import { prisma } from '@/lib/prisma'

export async function createReservation(data: {
  propertyId: string
  guestId: string
  arrivalDate: Date
  departureDate: Date
  roomTypeId: string
  adults: number
  children: number
  totalAmount: number
}) {
  return prisma.reservation.create({
    data: {
      ...data,
      bookingNo: `RES-${Date.now()}`,
      status: 'CONFIRMED',
    },
  })
}
