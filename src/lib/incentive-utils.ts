import { prisma } from "./prisma";

export type ActivityType = 'RIDE' | 'REFERRAL';

/**
 * Records an activity for a driver and updates their incentive progression.
 * Automatically handles completion, cycling, and history.
 */
export async function recordDriverActivity(driverId: string, type: ActivityType, amount: number = 1) {
  try {
    // 1. Find the active offer progress for this driver
    let activeProgress = await (prisma as any).driverOfferProgress.findFirst({
      where: { driverId, status: "ACTIVE" },
      include: { offer: true }
    });

    // 2. If no active offer found, check for ANY existing record regardless of status
    if (!activeProgress) {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (!driver) return null;

      const defaultOffer = await (prisma as any).offer.findFirst({
        where: { propertyId: driver.propertyId, isActive: true },
        orderBy: { priority: 'asc' }
      });

      if (!defaultOffer) return null;

      // Handle re-activation or creation
      activeProgress = await (prisma as any).driverOfferProgress.upsert({
        where: {
          driverId_offerId: {
            driverId,
            offerId: defaultOffer.id
          }
        },
        update: { status: 'ACTIVE' }, // Re-activate instead of failing
        create: {
          driverId,
          offerId: defaultOffer.id,
          status: "ACTIVE",
          completedRides: 0,
          completedReferrals: 0,
          progressPercent: 0
        },
        include: { offer: true }
      });
      
      // If we re-activated a finished record, reset the numbers to start fresh
      if (activeProgress.progressPercent >= 100 || activeProgress.status !== 'ACTIVE') {
         activeProgress = await (prisma as any).driverOfferProgress.update({
            where: { id: activeProgress.id },
            data: { 
              completedRides: 0, 
              completedReferrals: 0, 
              progressPercent: 0,
              status: 'ACTIVE'
            },
            include: { offer: true }
         });
      }
    }

    const offer = activeProgress.offer;
    let newRides = activeProgress.completedRides;
    let newReferrals = activeProgress.completedReferrals;

    // 3. Update counts based on activity type
    if (type === 'RIDE') newRides += amount;
    if (type === 'REFERRAL') newReferrals += amount;

    // 4. Calculate new progress percentage
    // Logic: If target is set, progress is based on the target. If target is 0, it's considered 100%.
    let rideProg = offer.targetRides > 0 ? (newRides / offer.targetRides) * 100 : 100;
    
    // Since we only track Customers (Rides) now, force totalProgress to just rideProg
    let totalProgress = Math.min(rideProg, 100);

    try {
      require('fs').appendFileSync('/tmp/poslog.txt', JSON.stringify({
        driverId,
        newRides,
        targetRides: offer.targetRides,
        rideProg,
        totalProgress
      }) + '\n');
    } catch {}

    // 5. Handle Completion (Progress reached 100%) — auto-advance + record payout
    if (totalProgress >= 100) {
      // Record to HISTORY
      await (prisma as any).driverOfferHistory.create({
        data: {
          driverId,
          offerId: offer.id,
          ridesAtCompletion: newRides,
          referralsAtCompletion: newReferrals,
          rewardEarned: offer.rewardValue,
          rewardItemEarned: offer.rewardItem,
          completedAt: new Date()
        }
      });

      // Create a PENDING payout record so admin knows gift hasn't been given yet
      await (prisma as any).rewardPayout.create({
        data: {
          driverId,
          offerId: offer.id,
          amount: offer.rewardValue,
          itemName: offer.rewardItem || null,
          payoutStatus: 'PENDING',
        }
      });

      // Cycle Logic — auto-advance
      if (offer.resetType === 'SAME_OFFER') {
        // Reset progress but stay on same offer
        return await (prisma as any).driverOfferProgress.update({
          where: { id: activeProgress.id },
          data: {
            completedRides: 0,
            completedReferrals: 0,
            progressPercent: 0,
            status: 'ACTIVE',
            resetCount: { increment: 1 },
            updatedAt: new Date()
          }
        });
      } else if (offer.resetType === 'NEXT_OFFER' && offer.nextOfferId) {
        // Move to NEXT level slab
        await (prisma as any).driverOfferProgress.delete({ where: { id: activeProgress.id } });
        return await (prisma as any).driverOfferProgress.create({
          data: {
            driverId,
            offerId: offer.nextOfferId,
            status: 'ACTIVE',
            completedRides: 0,
            completedReferrals: 0,
            progressPercent: 0,
            resetCount: 0
          }
        });
      } else {
        // Just mark as COMPLETED and stop
        return await (prisma as any).driverOfferProgress.update({
          where: { id: activeProgress.id },
          data: {
            status: 'COMPLETED',
            completedRides: newRides,
            completedReferrals: newReferrals,
            progressPercent: 100,
            completedAt: new Date()
          }
        });
      }
    }

    // 6. Regular Update (Not completed yet)
    return await (prisma as any).driverOfferProgress.update({
      where: { id: activeProgress.id },
      data: {
        completedRides: newRides,
        completedReferrals: newReferrals,
        progressPercent: totalProgress,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('[Incentive Engine Error]:', error);
    return null;
  }
}

/**
 * Global re-sync for all drivers in a property.
 * Ensures every driver has an ACTIVE progress record if eligible.
 * Fixes "NONE" status for drivers who should be on a slab.
 */
export async function syncDriverProgression(propertyId: string) {
  try {
    const drivers = await (prisma as any).driver.findMany({
      where: { propertyId, isActive: true },
      include: {
        offerProgresses: { where: { status: 'ACTIVE' } }
      }
    });

    const activeOffers = await (prisma as any).offer.findMany({
      where: { propertyId, isActive: true },
      orderBy: { priority: 'asc' }
    });

    if (activeOffers.length === 0) return { success: false, message: "No active offers to sync." };

    let fixCount = 0;

    for (const driver of drivers) {
      if (driver.offerProgresses.length === 0) {
        // Find if they have any recently completed progress
        const lastCompleted = await (prisma as any).driverOfferProgress.findFirst({
          where: { driverId: driver.id, status: 'COMPLETED' },
          orderBy: { updatedAt: 'desc' },
          include: { offer: true }
        });

        let targetOffer = activeOffers[0]; // Start at Level 1 by default

        // If they finished a level, try to find the next one by Priority
        if (lastCompleted) {
          const finishedPriority = lastCompleted.offer.priority || 0;
          const nextByPriority = activeOffers.find((o: any) => o.priority > finishedPriority);
          
          if (lastCompleted.offer.nextOfferId) {
            const nextOffer = activeOffers.find((o: any) => o.id === lastCompleted.offer.nextOfferId);
            if (nextOffer) targetOffer = nextOffer;
          } else if (nextByPriority) {
            targetOffer = nextByPriority;
          }
        }

        // Upsert to ensure we don't hit unique constraints again
        await (prisma as any).driverOfferProgress.upsert({
          where: {
            driverId_offerId: {
              driverId: driver.id,
              offerId: targetOffer.id
            }
          },
          update: { status: 'ACTIVE', updatedAt: new Date(), progressPercent: 0, completedRides: 0 },
          create: {
            driverId: driver.id,
            offerId: targetOffer.id,
            status: 'ACTIVE',
            completedRides: 0,
            completedReferrals: 0,
            progressPercent: 0
          }
        });
        fixCount++;
      }
    }

    return { success: true, fixed: fixCount };
  } catch (error) {
    console.error('[Incentive Sync Error]:', error);
    throw error;
  }
}
