import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, encrypt } from '@/lib/session'
import { apiError, apiResponse } from '@/lib/api-utils'
import { cookies } from 'next/headers'

// Define validation schemas
const personalSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  phone: z.string().min(10, 'Phone Number is required'),
  designation: z.string().optional(), // mapped to DB
})

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization Name is required'),
  businessType: z.string().min(1, 'Business Type is required'),
  businessPreferences: z.string().optional(),
})

const propertySchema = z.object({
  name: z.string().min(1, 'Property Name is required'),
  type: z.string().min(1, 'Property Type is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pinCode: z.string().min(6, 'PIN Code must be 6 digits'),
  taxDetails: z.string().optional(),
})

const categorySchema = z.object({
  name: z.string().min(1, 'Category Name is required'),
  description: z.string().optional(),
  displayOrder: z.number().default(0),
})

const productSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  sku: z.string().optional(),
  categoryId: z.string().optional(), // Will map during transaction
  sellingPrice: z.number().min(0),
  taxRate: z.number().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  availabilityStatus: z.boolean().default(true),
  kitchenMapping: z.string().optional(),
  variantSize: z.string().optional(),
  hsnCode: z.string().optional(),
  productType: z.string().default('VEG'), // Default type
})

const tableSchema = z.object({
  name: z.string().min(1, 'Table Name is required'),
  capacity: z.number().default(4),
  status: z.string().default('VACANT'),
  floorName: z.string().min(1, 'Floor Name is required'), // Map to floor
})

const onboardingSchema = z.object({
  personal: personalSchema,
  organization: organizationSchema,
  property: propertySchema,
  categories: z.array(categorySchema).optional(),
  products: z.array(productSchema).optional(),
  tables: z.array(tableSchema).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError(new Error('Unauthorized'), 401)
    }

    const body = await request.json()
    const parsedData = onboardingSchema.parse(body)

    const userId = session.id
    const userRole = session.role

    // Run in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User Personal Info
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          fullName: parsedData.personal.fullName,
          phone: parsedData.personal.phone,
          designation: parsedData.personal.designation,
          onboardingCompleted: true, // Mark as completed
        },
      })

      // 2. Update/Create Organization
      let organization
      if (session.organizationId) {
        organization = await tx.organization.update({
          where: { id: session.organizationId },
          data: {
            name: parsedData.organization.name,
            businessType: parsedData.organization.businessType,
            businessPreferences: parsedData.organization.businessPreferences,
          },
        })
      } else {
        // Create new organization if none exists (rare but possible)
        organization = await tx.organization.create({
          data: {
            name: parsedData.organization.name,
            businessType: parsedData.organization.businessType,
            businessPreferences: parsedData.organization.businessPreferences,
          },
        })
        // Update user's organizationId if created new
        await tx.user.update({
          where: { id: userId },
          data: { organizationId: organization.id },
        })
      }

      // 3. Create Property
      const propertyCode = `PROP-${Date.now()}` // Generate temporary code
      const property = await tx.property.create({
        data: {
          organizationId: organization.id,
          name: parsedData.property.name,
          code: propertyCode,
          type: parsedData.property.type,
          city: parsedData.property.city,
          state: parsedData.property.state,
          country: parsedData.property.country,
          pinCode: parsedData.property.pinCode,
          taxDetails: parsedData.property.taxDetails,
        },
      })

      // Update user with property reference
      await tx.user.update({
        where: { id: userId },
        data: { propertyId: property.id },
      })

      // 4. Create default Outlet if POS Operations are needed
      // Most hotels need at least one outlet
      const outlet = await tx.outlet.create({
        data: {
          propertyId: property.id,
          name: 'Main Outlet',
          type: 'RESTAURANT', // Default type
        },
      })

      // 5. Create Categories
      const categoryMap = new Map<string, string>()
      let hasCategories = parsedData.categories && parsedData.categories.length > 0

      if (hasCategories) {
        for (const cat of parsedData.categories!) {
          const category = await tx.category.create({
            data: {
              propertyId: property.id,
              name: cat.name,
              description: cat.description,
              displayOrder: cat.displayOrder,
            },
          })
          categoryMap.set(cat.name, category.id)
        }
      }

      // Fallback category if products exist but no categories created
      if (!hasCategories && parsedData.products && parsedData.products.length > 0) {
        const defaultCategory = await tx.category.create({
          data: {
            propertyId: property.id,
            name: 'General',
            description: 'Default category',
          },
        })
        categoryMap.set('General', defaultCategory.id)
      }

      // 6. Create Products
      if (parsedData.products && parsedData.products.length > 0) {
        const fallbackCategoryId = Array.from(categoryMap.values())[0]

        for (const prod of parsedData.products) {
          let categoryId = ''
          if (prod.categoryId) {
             categoryId = categoryMap.get(prod.categoryId) || ''
          }

          if (!categoryId) {
             categoryId = fallbackCategoryId
          }

          if (!categoryId) {
             throw new Error('Category id could not be determined for product')
          }

          await tx.product.create({
            data: {
              propertyId: property.id,
              categoryId: categoryId,
              outletId: outlet.id,
              name: prod.name,
              sku: prod.sku,
              sellingPrice: prod.sellingPrice,
              taxRate: prod.taxRate,
              unit: prod.unit,
              description: prod.description,
              image: prod.image,
              availabilityStatus: prod.availabilityStatus,
              kitchenMapping: prod.kitchenMapping,
              variantSize: prod.variantSize,
              hsnCode: prod.hsnCode,
              productType: prod.productType,
            },
          })
        }
      }

      // 7. Create Floors & Tables
      if (parsedData.tables && parsedData.tables.length > 0) {
        const floorMap = new Map<string, string>()
        
        for (const table of parsedData.tables) {
          let floorId = floorMap.get(table.floorName)
          if (!floorId) {
            const floor = await tx.floor.create({
              data: {
                propertyId: property.id,
                outletId: outlet.id,
                name: table.floorName,
              },
            })
            floorId = floor.id
            floorMap.set(table.floorName, floorId)
          }

          await tx.table.create({
            data: {
              floorId: floorId,
              propertyId: property.id,
              name: table.name,
              capacity: table.capacity,
              status: table.status,
            },
          })
        }
      }

      // 8. Update Session cookie with new propertyId and onboardingCompleted = true
      return {
        userId: updatedUser.id,
        organizationId: organization.id,
        propertyId: property.id,
        onboardingCompleted: true,
        role: userRole,
      }
    })

    // Update session cookie
    const updatedPayload = {
      id: result.userId,
      email: session.email,
      roleId: session.roleId,
      role: result.role,
      organizationId: result.organizationId,
      propertyId: result.propertyId,
      onboardingCompleted: true,
    }

    const token = await encrypt(updatedPayload)
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    })

    return apiResponse(
      { success: true, onboardingCompleted: true },
      'Onboarding completed successfully'
    )

  } catch (error) {
    return apiError(error)
  }
}
