import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { apiError, apiResponse } from '@/lib/api-utils'
import { decrypt } from '@/lib/session'
import { cookies } from 'next/headers'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').optional().nullable(),
  captchaText: z.string().min(1, 'Security code is required'),
  captchaToken: z.string().optional().nullable(),
  roleName: z.string().optional().default('RESTAURANTS_ADMIN'),
  packageId: z.string().optional().nullable(),
  paymentReference: z.string().optional().nullable(), // UPI/bank transaction ref submitted during signup
  paymentAmount: z.number().optional().nullable(),     // Amount the user claims to have paid
  // Branch configuration
  branchName: z.string().optional().nullable(),
  branchCode: z.string().optional().nullable(),
  branchCity: z.string().optional().nullable(),
  branchAddress: z.string().optional().nullable(),
  branchPhone: z.string().optional().nullable(),
  // POS user configuration
  posFullName: z.string().optional().nullable(),
  posEmail: z.string().optional().nullable(),
  posPassword: z.string().optional().nullable(),
  // Extra Rider & Supplier fields
  phone: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  vehicleNumber: z.string().optional().nullable(),
  deliveryLocation: z.string().optional().nullable(),
  deliveryLat: z.number().optional().nullable(),
  deliveryLng: z.number().optional().nullable(),
  deliveryRadius: z.number().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  restaurantPosEnabled: z.boolean().optional().default(true),
  barPosEnabled: z.boolean().optional().default(false),
  cafePosEnabled: z.boolean().optional().default(false),
  deliveryEnabled: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      fullName, email, password, businessName, captchaText, captchaToken, roleName, packageId, paymentReference, paymentAmount,
      branchName, branchCode, branchCity, branchAddress, branchPhone,
      posFullName, posEmail, posPassword,
      phone, vehicleType, vehicleNumber, deliveryLocation, deliveryLat, deliveryLng, deliveryRadius, gstNumber, category, address,
      restaurantPosEnabled, barPosEnabled, cafePosEnabled, deliveryEnabled
    } = signupSchema.parse(body)

    // 1. Verify Security Captcha
    const cookieStore = await cookies()
    let captchaCookie = cookieStore.get('captcha')?.value
    if (!captchaCookie) {
      captchaCookie = captchaToken || request.headers.get('x-captcha-token') || undefined
    }

    if (!captchaCookie) {
      return apiError(new Error('Security code expired or not found. Please refresh.'), 400)
    }

    try {
      const decodedCaptcha = await decrypt(captchaCookie) as any
      if (!captchaText || decodedCaptcha.text !== captchaText.trim().toLowerCase()) {
        return apiError(new Error('Invalid security code. Please try again.'), 400)
      }
      // Delete the captcha cookie after successful validation
      try {
        cookieStore.delete('captcha')
      } catch (_) {}
    } catch (err) {
      return apiError(new Error('Security code verification failed. Please refresh.'), 400)
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return apiError(new Error('An account with this email address already exists.'), 400)
    }

    // Validate allowed roles for signup
    const allowedRoles = ['RESTAURANTS_ADMIN', 'HOTEL_ADMIN', 'B2B_SUPPLIER', 'DELIVERY_RIDER']
    const roleToAssign = allowedRoles.includes(roleName) ? roleName : 'RESTAURANTS_ADMIN'

    // If Restaurant Owner or Hotel Owner, validate branch code and cashier email uniqueness beforehand
    if (roleToAssign === 'RESTAURANTS_ADMIN' || roleToAssign === 'HOTEL_ADMIN') {
      if (branchCode && branchCode.trim().length > 0) {
        const existingBranch = await prisma.property.findUnique({
          where: { code: branchCode.trim() }
        })
        if (existingBranch) {
          return apiError(new Error(`The Branch Code "${branchCode.trim()}" is already in use. Please select a unique code.`), 400)
        }
      }

      if (posEmail && posEmail.trim().length > 0) {
        // Receptionist email must not match the main user email
        if (posEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
          return apiError(new Error('Receptionist email cannot be the same as the owner email. Please use a different email.'), 400)
        }
        const existingCashier = await prisma.user.findUnique({
          where: { email: posEmail.toLowerCase().trim() }
        })
        if (existingCashier) {
          return apiError(new Error('The Receptionist email address is already in use. Please use a different email.'), 400)
        }
      }
    }

    // If B2B Supplier, validate supplier email uniqueness beforehand
    if (roleToAssign === 'B2B_SUPPLIER') {
      const existingSupplier = await prisma.b2BSupplier.findUnique({
        where: { email: email.toLowerCase().trim() }
      })
      if (existingSupplier) {
        return apiError(new Error('A supplier account with this email address already exists. Please use a different email or sign in.'), 400)
      }
    }

    // 3. Find selected role
    const selectedRole = await prisma.role.findUnique({
      where: { name: roleToAssign },
    })

    if (!selectedRole) {
      return apiError(new Error(`Required system role (${roleToAssign}) was not found in the database. Please run migrations/seeds.`), 500)
    }

    // 4. Determine selected Package to request
    let selectedPackage = null
    let isPaidPackage = false

    if (packageId) {
      selectedPackage = await prisma.package.findUnique({
        where: { id: packageId }
      })
      if (selectedPackage && (selectedPackage.priceUSD > 0 || selectedPackage.priceINR > 0)) {
        isPaidPackage = true
      }
    }

    if (!selectedPackage) {
      // Fallback to default Package if available
      selectedPackage = await prisma.package.findFirst({
        where: { name: { in: ['Free Trial', 'Starter', 'Enterprise'] } }
      })

      if (!selectedPackage) {
        selectedPackage = await prisma.package.findFirst({
          where: { isActive: true }
        })
      }
    }

    // Validate POS limit based on the resolved package
    if (roleToAssign === 'RESTAURANTS_ADMIN' || roleToAssign === 'HOTEL_ADMIN') {
      const limit = selectedPackage?.allowedPosCount ?? 1
      const proposedPosCount = (restaurantPosEnabled ? 1 : 0) + (barPosEnabled ? 1 : 0) + (cafePosEnabled ? 1 : 0)
      if (proposedPosCount > limit) {
        return apiError(new Error(`Your selected package limit permits up to ${limit} POS terminal(s). You selected ${proposedPosCount}.`), 400)
      }
    }

    // 5. Create Organization, Property, and Users in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create Organization
      const orgName = businessName ? businessName.trim() : `${fullName.trim()}'s Business`
      // If user submitted a payment reference during signup, jump straight to PENDING_APPROVAL
      const hasPaymentRef = isPaidPackage && paymentReference && paymentReference.trim().length > 0
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          packageId: isPaidPackage ? null : (selectedPackage ? selectedPackage.id : null),
          packageStartDate: isPaidPackage ? null : (selectedPackage ? new Date() : null),
          packageEndDate: isPaidPackage ? null : (selectedPackage ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null), // 30 days trial
          subscriptionStatus: hasPaymentRef ? 'PENDING_APPROVAL' : (isPaidPackage ? 'PENDING_PAYMENT' : 'TRIAL'),
          pendingPackageId: isPaidPackage ? (selectedPackage ? selectedPackage.id : null) : null,
          paymentReference: hasPaymentRef ? paymentReference!.trim() : null,
          paymentAmount: hasPaymentRef ? (paymentAmount ?? selectedPackage?.priceINR ?? null) : null,
          paymentDate: hasPaymentRef ? new Date() : null,
        },
      })

      // Hash password
      const passwordHash = await hashPassword(password)

      if (roleToAssign === 'RESTAURANTS_ADMIN' || roleToAssign === 'HOTEL_ADMIN') {
        // Create Property (Branch / Hotel)
        const branchCodeToUse = branchCode && branchCode.trim().length > 0
          ? branchCode.trim()
          : `${roleToAssign === 'HOTEL_ADMIN' ? 'HT' : 'BR'}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

        const isHotel = roleToAssign === 'HOTEL_ADMIN'
        const branch = await tx.property.create({
          data: {
            organizationId: organization.id,
            name: branchName && branchName.trim().length > 0 ? branchName.trim() : (isHotel ? 'Main Hotel' : 'Main Branch'),
            code: branchCodeToUse,
            city: branchCity && branchCity.trim().length > 0 ? branchCity.trim() : null,
            address: branchAddress && branchAddress.trim().length > 0 ? branchAddress.trim() : null,
            phone: branchPhone && branchPhone.trim().length > 0 ? branchPhone.trim() : null,
            restaurantPosEnabled: restaurantPosEnabled,
            showRestaurantInQrMenu: restaurantPosEnabled,
            barPosEnabled: barPosEnabled,
            showBarInQrMenu: barPosEnabled,
            cafePosEnabled: cafePosEnabled,
            showCafeInQrMenu: cafePosEnabled,
            deliveryEnabled: deliveryEnabled,
            showDeliveryInQrMenu: deliveryEnabled,
          }
        })

        // Create Main User linked to the Property
        const user = await tx.user.create({
          data: {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            organizationId: organization.id,
            propertyId: branch.id,
            roleId: selectedRole.id,
            isActive: true,
            onboardingCompleted: true,
          },
        })

        // Create Receptionist / Cashier sub-user if provided
        if (posFullName && posFullName.trim().length > 0 && posEmail && posEmail.trim().length > 0 && posPassword) {
          const subRoleName = isHotel ? 'HOTEL_RECEPTIONIST' : 'POSSYSTEM'
          let subRole = await tx.role.findUnique({ where: { name: subRoleName } })
          if (!subRole) {
            subRole = await tx.role.create({
              data: {
                name: subRoleName,
                description: isHotel ? 'Hotel Front Desk Receptionist' : 'POS Terminal Operator Access'
              }
            })
          }

          const subPasswordHash = await hashPassword(posPassword)
          await tx.user.create({
            data: {
              fullName: posFullName.trim(),
              email: posEmail.toLowerCase().trim(),
              passwordHash: subPasswordHash,
              organizationId: organization.id,
              propertyId: branch.id,
              roleId: subRole.id,
              isActive: true,
              onboardingCompleted: true,
            }
          })
        }

        // Create Default Outlet for Property
        await tx.outlet.create({
          data: {
            name: isHotel ? 'Main Hotel Outlet' : 'Main POS Outlet',
            type: isHotel ? 'HOTEL' : 'RESTAURANT',
            propertyId: branch.id,
          }
        })

        // Create Default Payment Modes
        const paymentModes = [
          { name: 'Cash', type: 'CASH' },
          { name: 'Credit Card', type: 'CARD' },
          { name: 'UPI / QR', type: 'UPI' },
        ]
        for (const mode of paymentModes) {
          await tx.paymentMode.create({
            data: {
              name: mode.name,
              type: mode.type,
              propertyId: branch.id,
              isActive: true,
            }
          })
        }

        // Seed Cash assets account group & Cash account
        let assetGroup = await tx.accountGroup.findFirst({
          where: { name: 'Cash & Bank', organizationId: organization.id }
        })
        if (!assetGroup) {
          assetGroup = await tx.accountGroup.create({
            data: {
              name: 'Cash & Bank',
              nature: 'ASSET',
              organizationId: organization.id,
            }
          })
        }

        await tx.account.create({
          data: {
            id: `cash-${branch.id}`,
            name: 'Cash Account',
            accountType: 'CASH',
            openingBalanceType: 'DEBIT',
            accountGroupId: assetGroup.id,
            propertyId: branch.id,
            organizationId: organization.id,
          }
        })

        // If it's a hotel, seed default Room Types, Rooms, Guests and Reservations
        if (isHotel) {
          // 1. Seed Room Types
          const deluxeType = await tx.roomType.create({
            data: {
              propertyId: branch.id,
              name: 'Deluxe Room',
              code: 'DELUXE',
              baseRate: 3500.0,
              maxOccupancy: 2,
            }
          })

          const superDeluxeType = await tx.roomType.create({
            data: {
              propertyId: branch.id,
              name: 'Super Deluxe Room',
              code: 'SDELUXE',
              baseRate: 5000.0,
              maxOccupancy: 3,
            }
          })

          const suiteType = await tx.roomType.create({
            data: {
              propertyId: branch.id,
              name: 'Suite Room',
              code: 'SUITE',
              baseRate: 8000.0,
              maxOccupancy: 4,
            }
          })

          // 2. Seed Rooms
          const room101 = await tx.room.create({
            data: {
              propertyId: branch.id,
              roomTypeId: deluxeType.id,
              roomNumber: '101',
              floor: '1',
              status: 'OCCUPIED',
              housekeepingStatus: 'CLEAN',
            }
          })

          const room102 = await tx.room.create({
            data: {
              propertyId: branch.id,
              roomTypeId: deluxeType.id,
              roomNumber: '102',
              floor: '1',
              status: 'AVAILABLE',
              housekeepingStatus: 'CLEAN',
            }
          })

          const room103 = await tx.room.create({
            data: {
              propertyId: branch.id,
              roomTypeId: superDeluxeType.id,
              roomNumber: '103',
              floor: '1',
              status: 'AVAILABLE',
              housekeepingStatus: 'DIRTY',
            }
          })

          const room201 = await tx.room.create({
            data: {
              propertyId: branch.id,
              roomTypeId: deluxeType.id,
              roomNumber: '201',
              floor: '2',
              status: 'AVAILABLE',
              housekeepingStatus: 'CLEAN',
            }
          })

          const room202 = await tx.room.create({
            data: {
              propertyId: branch.id,
              roomTypeId: superDeluxeType.id,
              roomNumber: '202',
              floor: '2',
              status: 'AVAILABLE',
              housekeepingStatus: 'CLEAN',
            }
          })

          const room203 = await tx.room.create({
            data: {
              propertyId: branch.id,
              roomTypeId: suiteType.id,
              roomNumber: '203',
              floor: '2',
              status: 'AVAILABLE',
              housekeepingStatus: 'CLEAN',
            }
          })

          // 3. Seed Guests
          const guest1 = await tx.guest.create({
            data: {
              organizationId: organization.id,
              firstName: 'Tarun',
              lastName: 'Sharma',
              mobile: '9876543210',
              email: 'tarun@example.com',
              idType: 'Aadhaar',
              idNumber: '1234-5678-9012',
            }
          })

          const guest2 = await tx.guest.create({
            data: {
              organizationId: organization.id,
              firstName: 'Priya',
              lastName: 'Patel',
              mobile: '9876543211',
              email: 'priya@example.com',
              idType: 'Passport',
              idNumber: 'Z1234567',
            }
          })

          // 4. Seed Reservations & Check-Ins
          const today = new Date()
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

          // Reservation 1 (Checked-In, Expected Departure Today)
          const res1 = await tx.reservation.create({
            data: {
              propertyId: branch.id,
              guestId: guest1.id,
              bookingNo: `RES-${Date.now().toString().slice(-6)}-101`,
              arrivalDate: yesterday,
              departureDate: today,
              adults: 2,
              children: 0,
              roomTypeId: deluxeType.id,
              assignedRoomId: room101.id,
              status: 'CHECKED_IN',
              totalAmount: 3500.0,
              advanceAmount: 1000.0,
              dueAmount: 2500.0,
              rooms: {
                create: {
                  roomId: room101.id,
                  ratePerNight: 3500.0,
                  adults: 2,
                  children: 0,
                }
              }
            }
          })

          // Create CheckIn record for Reservation 1
          await tx.checkIn.create({
            data: {
              reservationId: res1.id,
              guestId: guest1.id,
              roomId: room101.id,
              checkedInAt: yesterday,
              expectedCheckoutAt: today,
              status: 'ACTIVE',
            }
          })

          // Create Folio for CheckIn 1
          const folioNo1 = `FOL-${Date.now().toString().slice(-6)}-101`
          const folio1 = await tx.folio.create({
            data: {
              reservationId: res1.id,
              guestId: guest1.id,
              folioNo: folioNo1,
              openingBalance: 0,
              totalCharges: 3500.0,
              totalPayments: 1000.0,
              closingBalance: 2500.0,
              status: 'OPEN',
            }
          })

          // Folio transactions
          await tx.folioTransaction.create({
            data: {
              folioId: folio1.id,
              txnDate: yesterday,
              txnType: 'DEBIT',
              sourceModule: 'HMS',
              description: 'Room Rent Charges - 1 Night',
              debitAmount: 3500.0,
              creditAmount: 0,
              netAmount: 3500.0,
            }
          })

          await tx.folioTransaction.create({
            data: {
              folioId: folio1.id,
              txnDate: yesterday,
              txnType: 'CREDIT',
              sourceModule: 'HMS',
              description: 'Advance Paid at Booking',
              debitAmount: 0,
              creditAmount: 1000.0,
              netAmount: -1000.0,
            }
          })

          // Reservation 2 (Expected Arrival Today, Confirmed)
          await tx.reservation.create({
            data: {
              propertyId: branch.id,
              guestId: guest2.id,
              bookingNo: `RES-${Date.now().toString().slice(-6)}-103`,
              arrivalDate: today,
              departureDate: threeDaysLater,
              adults: 2,
              children: 1,
              roomTypeId: superDeluxeType.id,
              assignedRoomId: room103.id,
              status: 'CONFIRMED',
              totalAmount: 15000.0,
              advanceAmount: 3000.0,
              dueAmount: 12000.0,
              rooms: {
                create: {
                  roomId: room103.id,
                  ratePerNight: 5000.0,
                  adults: 2,
                  children: 1,
                }
              }
            }
          })
        }

        return { user, organization }
      } else {
        // Non-restaurant signup, create simple user and organization
        let supplierId: string | null = null

        if (roleToAssign === 'B2B_SUPPLIER') {
          const supplier = await tx.b2BSupplier.create({
            data: {
              name: businessName && businessName.trim().length > 0 ? businessName.trim() : `${fullName.trim()}'s Supplies`,
              email: email.toLowerCase().trim(),
              phone: phone && phone.trim().length > 0 ? phone.trim() : null,
              address: address && address.trim().length > 0 ? address.trim() : null,
              gstNumber: gstNumber && gstNumber.trim().length > 0 ? gstNumber.trim() : null,
              category: category && category.trim().length > 0 ? category.trim() : null,
            }
          })
          supplierId = supplier.id
        }

        const user = await tx.user.create({
          data: {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone && phone.trim().length > 0 ? phone.trim() : null,
            passwordHash,
            organizationId: organization.id,
            roleId: selectedRole.id,
            isActive: true,
            onboardingCompleted: true, // Mark completed as we collected everything on signup
            supplierId: supplierId,
            vehicleType: roleToAssign === 'DELIVERY_RIDER' ? (vehicleType || 'BIKE') : null,
            vehicleNumber: roleToAssign === 'DELIVERY_RIDER' ? (vehicleNumber || null) : null,
            deliveryLocation: roleToAssign === 'DELIVERY_RIDER' ? (deliveryLocation || null) : null,
            deliveryLat: roleToAssign === 'DELIVERY_RIDER' ? (deliveryLat || null) : null,
            deliveryLng: roleToAssign === 'DELIVERY_RIDER' ? (deliveryLng || null) : null,
            deliveryRadius: roleToAssign === 'DELIVERY_RIDER' ? (deliveryRadius || null) : null,
          },
        })

        return { user, organization }
      }
    })

    // 6. Return response (excluding password hash)
    const { passwordHash: _, ...safeUser } = result.user

    return apiResponse(
      { user: safeUser, organization: result.organization },
      'Account registered successfully! You can now log in.',
      201
    )

  } catch (error: any) {
    // Handle Prisma unique constraint errors with a user-friendly message
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'field'
      if (field === 'email') {
        return apiError(new Error('An account with this email address already exists. Please sign in or use a different email.'), 400)
      }
      if (field === 'code') {
        return apiError(new Error('This Branch Code is already in use. Please enter a unique branch code.'), 400)
      }
      return apiError(new Error(`A record with this value already exists (${field}). Please use a different value.`), 400)
    }
    return apiError(error)
  }
}
