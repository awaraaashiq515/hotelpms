import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordDriverActivity } from '@/lib/incentive-utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { status, numberOfTables, guestCount, date, time, customerName, customerPhone, driverId, tableId } = body;
    const { id } = await params;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (numberOfTables !== undefined) dataToUpdate.numberOfTables = numberOfTables;
    if (guestCount !== undefined) dataToUpdate.guestCount = guestCount;
    if (date) dataToUpdate.date = new Date(date);
    if (time) dataToUpdate.time = time;
    if (customerName) dataToUpdate.customerName = customerName;
    if (customerPhone !== undefined) dataToUpdate.customerPhone = customerPhone;
    if (driverId !== undefined) dataToUpdate.driverId = driverId || null;
    if (tableId !== undefined) dataToUpdate.tableId = tableId || null;

    if (dataToUpdate.tableId || dataToUpdate.date || dataToUpdate.time) {
      const existingRecord = await (prisma as any).tableReservation.findUnique({ where: { id } });
      const checkTableId = dataToUpdate.tableId !== undefined ? dataToUpdate.tableId : existingRecord.tableId;
      const checkDate = dataToUpdate.date || existingRecord.date;
      const checkTime = dataToUpdate.time || existingRecord.time;
      const checkStatus = dataToUpdate.status || existingRecord.status;

      if (checkTableId && !['CANCELLED', 'COMPLETED'].includes(checkStatus)) {
        const conflict = await (prisma as any).tableReservation.findFirst({
          where: {
            tableId: checkTableId,
            date: new Date(checkDate),
            time: checkTime,
            id: { not: id },
            status: { notIn: ['CANCELLED', 'COMPLETED'] }
          }
        });
        if (conflict) {
          return NextResponse.json({ success: false, message: 'This table is already booked at the selected time.' }, { status: 400 });
        }
      }
    }

    const updatedReservation = await (prisma as any).tableReservation.update({
      where: { id },
      data: dataToUpdate
    });

    // --- Incentive Engine Integration ---
    // If status changed to COMPLETED and a driver is assigned, record a "Ride"
    if (dataToUpdate.status === 'COMPLETED' && updatedReservation.driverId) {
       await recordDriverActivity(updatedReservation.driverId, 'RIDE');
    }

    return NextResponse.json({ success: true, data: updatedReservation });
  } catch (error: any) {
    console.error('Error updating table reservation:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await (prisma as any).tableReservation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting table reservation:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
