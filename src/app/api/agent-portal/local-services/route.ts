import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const filterCity = (searchParams.get('city') || searchParams.get('location') || '').trim().toLowerCase();

    // 1. Fetch Buses (from TransportVehicle)
    const busVehicles = await prisma.transportVehicle.findMany({
      where: {
        type: { in: ['BUS', 'MINIBUS'] },
        isActive: true,
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, rating: true, city: true, state: true, address: true, isOnline: true },
        },
        schedules: { where: { isActive: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const buses = busVehicles.map((v) => {
      const schedule = v.schedules?.[0];
      const city = v.driver?.city || schedule?.fromLocation || 'Local';
      const state = v.driver?.state || '';
      const location = schedule?.fromLocation && schedule?.toLocation
        ? `${schedule.fromLocation} ⇄ ${schedule.toLocation}`
        : [city, state].filter(Boolean).join(', ') || 'Local Route';

      return {
        id: v.id,
        name: v.model || `${v.type === 'BUS' ? 'Bus Coach' : 'Mini Bus'} (${v.plateNumber})`,
        type: v.type === 'BUS' ? 'AC Bus Coach' : 'Mini Bus',
        capacity: `${v.capacity} Seater`,
        plateNumber: v.plateNumber,
        priceFrom: schedule?.pricePerSeat || v.baseFare || 0,
        priceTo: schedule?.fullVehiclePrice || undefined,
        unit: schedule?.pricePerSeat ? '/seat' : '/day',
        rating: v.driver?.rating || undefined,
        features: ['Driver Included', v.type === 'BUS' ? 'Coach' : 'Push-back Seats'],
        contact: v.driver?.phone || undefined,
        available: v.isActive,
        photoUrl: v.photoUrl,
        city,
        state,
        location,
        route: schedule?.routeName || (schedule?.fromLocation ? `${schedule.fromLocation} ⇄ ${schedule.toLocation}` : undefined),
        operator: v.driver?.name || 'Coach Operator',
      };
    });

    // 2. Fetch Taxis & Cabs (from TransportVehicle where type = 'CAR')
    const taxiVehicles = await prisma.transportVehicle.findMany({
      where: {
        type: 'CAR',
        isActive: true,
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, rating: true, city: true, state: true, address: true, isOnline: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const taxis = taxiVehicles.map((v) => {
      const city = v.driver?.city || 'Local Stand';
      const state = v.driver?.state || '';
      const location = [city, state].filter(Boolean).join(', ') || 'Local Taxi Stand';

      return {
        id: v.id,
        name: v.model || `Cab (${v.plateNumber})`,
        type: v.capacity > 4 ? 'SUV / MUV' : 'Sedan / Hatchback',
        capacity: `${v.capacity} Pax`,
        plateNumber: v.plateNumber,
        priceFrom: v.perKmRate || 0,
        unit: '/km',
        rating: v.driver?.rating || undefined,
        features: ['Commercial Permit', 'Driver Included'],
        contact: v.driver?.phone || undefined,
        available: v.isActive,
        photoUrl: v.photoUrl,
        city,
        state,
        location,
        driverName: v.driver?.name,
      };
    });

    // 3. Fetch Tempo Travellers (from TransportVehicle where capacity >= 9 or type = 'MINIBUS'/'VAN')
    const tempoVehicles = await prisma.transportVehicle.findMany({
      where: {
        OR: [
          { type: { in: ['MINIBUS', 'VAN'] } },
          { capacity: { gte: 9 } },
        ],
        isActive: true,
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, rating: true, city: true, state: true, address: true, isOnline: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tempos = tempoVehicles.map((v) => {
      const city = v.driver?.city || 'Local Stand';
      const state = v.driver?.state || '';
      const location = [city, state].filter(Boolean).join(', ') || 'Local Depot';

      return {
        id: v.id,
        name: v.model || `Tempo Traveller ${v.capacity}-Seater`,
        type: `${v.capacity}-Seater`,
        capacity: `${v.capacity}+1`,
        plateNumber: v.plateNumber,
        priceFrom: v.baseFare || 0,
        unit: '/day',
        rating: v.driver?.rating || undefined,
        features: ['Spacious Seating', 'Driver Included'],
        contact: v.driver?.phone || undefined,
        available: v.isActive,
        photoUrl: v.photoUrl,
        city,
        state,
        location,
        driverName: v.driver?.name,
      };
    });

    // 4. Fetch Real Rental Bikes (from RentalBike)
    const rentalBikes = await prisma.rentalBike.findMany({
      where: {
        status: { in: ['AVAILABLE', 'ON_RENT'] },
      },
      include: {
        vendor: {
          select: { id: true, name: true, shopName: true, phone: true, city: true, state: true, address: true, rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const bikes = rentalBikes.map((b) => {
      const city = b.vendor?.city || 'Local Hub';
      const state = b.vendor?.state || '';
      const location = [b.vendor?.address, city, state].filter(Boolean).join(', ') || city;

      return {
        id: b.id,
        name: b.model,
        type: b.category,
        plateNumber: b.plateNumber,
        priceFrom: b.dailyRate,
        priceTo: b.hourlyRate ? b.hourlyRate : undefined,
        unit: '/day',
        rating: b.vendor?.rating || undefined,
        features: [
          `${b.helmetsProvided} Helmet${b.helmetsProvided > 1 ? 's' : ''}`,
          `Deposit: ₹${b.securityDeposit}`,
          b.fuelIncluded ? 'Fuel Included' : 'Fuel on Return',
        ],
        contact: b.vendor?.phone || undefined,
        available: b.status === 'AVAILABLE',
        photoUrl: b.photoUrl,
        shopName: b.vendor?.shopName || b.vendor?.name,
        city,
        state,
        location,
        address: b.vendor?.address,
      };
    });

    // 5. Fetch Sightseeing Spots (from SightseeingSpot)
    const sightseeingSpots = await prisma.sightseeingSpot.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const sightseeing = sightseeingSpots.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.category as any,
      distance: s.distance,
      timing: s.timing,
      entryFee: s.entryFee || 'Free Entry',
      rating: s.rating || undefined,
      description: s.description,
      tags: s.tags ? s.tags.split(',').map((t) => t.trim()) : [],
      photoUrl: s.photoUrl,
      contact: s.contactPhone || undefined,
      location: s.distance || 'Local Destination',
    }));

    // 6. Fetch Real Nearby Restaurants (from Property where type = 'RESTAURANT')
    const restaurantProperties = await prisma.property.findMany({
      where: { type: 'RESTAURANT' },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        starRating: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    const restaurants = restaurantProperties.map((r) => ({
      id: `prop-${r.id}`,
      name: r.name,
      type: 'RESTAURANT' as const,
      distance: [r.address, r.city, r.state].filter(Boolean).join(', ') || 'Local Restaurant',
      timing: 'Dining Hours',
      entryFee: 'A la carte',
      rating: r.starRating || undefined,
      description: `Restaurant in ${r.city || 'local area'}`,
      tags: ['Restaurant', 'Dining'],
      photoUrl: r.logoUrl || undefined,
      contact: r.phone || undefined,
      city: r.city || '',
      location: [r.address, r.city].filter(Boolean).join(', '),
    }));

    // Gather all distinct locations across vehicles & services
    const locationSet = new Set<string>();
    [...buses, ...taxis, ...tempos, ...bikes].forEach((v) => {
      if (v.city && v.city !== 'Local' && v.city !== 'Local Stand' && v.city !== 'Local Hub') {
        locationSet.add(v.city);
      }
    });

    // Also add property cities if available
    const propCities = await prisma.property.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ['city'],
      take: 10,
    });
    propCities.forEach((p) => {
      if (p.city && p.city.trim()) locationSet.add(p.city.trim());
    });

    const availableLocations = Array.from(locationSet).sort((a, b) => a.localeCompare(b));

    // Optional server-side filtering if city query parameter is passed
    const filterFn = (item: { city?: string; location?: string }) => {
      if (!filterCity || filterCity === 'all') return true;
      const c = (item.city || '').toLowerCase();
      const l = (item.location || '').toLowerCase();
      return c.includes(filterCity) || l.includes(filterCity);
    };

    const finalBuses = filterCity ? buses.filter(filterFn) : buses;
    const finalTaxis = filterCity ? taxis.filter(filterFn) : taxis;
    const finalTempos = filterCity ? tempos.filter(filterFn) : tempos;
    const finalBikes = filterCity ? bikes.filter(filterFn) : bikes;

    return NextResponse.json({
      success: true,
      availableLocations,
      counts: {
        buses: finalBuses.length,
        taxis: finalTaxis.length,
        tempos: finalTempos.length,
        bikes: finalBikes.length,
        sightseeing: sightseeing.length,
        restaurants: restaurants.length,
      },
      data: {
        buses: finalBuses,
        taxis: finalTaxis,
        tempos: finalTempos,
        bikes: finalBikes,
        sightseeing,
        restaurants,
      },
    });
  } catch (error: any) {
    console.error('Local services API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
