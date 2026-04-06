import { prisma } from "@/lib/prisma"

export async function processDriverRide(driverId: string) {
  await processDriverAction(driverId, "rides");
}

export async function processDriverReferral(driverId: string) {
  await processDriverAction(driverId, "referrals");
}

async function processDriverAction(driverId: string, actionType: "rides" | "referrals") {
  // Check if driver has an active offer progress
  let progress = await prisma.driverOfferProgress.findFirst({
    where: { driverId, status: "ACTIVE" },
    include: { offer: true }
  });

  if (!progress) return; // No active offer to progress

  // Increment the corresponding count
  const nextRides = actionType === "rides" ? progress.completedRides + 1 : progress.completedRides;
  const nextReferrals = actionType === "referrals" ? progress.completedReferrals + 1 : progress.completedReferrals;

  // Check if thresholds met
  const targetRides = progress.offer.targetRides;
  const targetReferrals = progress.offer.targetReferrals;

  let completed = false;
  let progressPercent = 0;

  if (progress.offer.offerType === "RIDES") {
    progressPercent = Math.min((nextRides / targetRides) * 100, 100);
    if (nextRides >= targetRides) completed = true;
  } else if (progress.offer.offerType === "REFERRALS") {
    progressPercent = Math.min((nextReferrals / targetReferrals) * 100, 100);
    if (nextReferrals >= targetReferrals) completed = true;
  } else if (progress.offer.offerType === "COMBINED") {
    const ridesPrct = Math.min((nextRides / targetRides) * 100, 100);
    // Be careful with division by zero
    const refPrct = targetReferrals > 0 ? Math.min((nextReferrals / targetReferrals) * 100, 100) : 100;
    progressPercent = (ridesPrct + refPrct) / 2;
    if (nextRides >= targetRides && nextReferrals >= targetReferrals) completed = true;
  }

  if (!completed) {
    await prisma.driverOfferProgress.update({
      where: { id: progress.id },
      data: {
        completedRides: nextRides,
        completedReferrals: nextReferrals,
        progressPercent
      }
    });

    // Audit log
    await prisma.offerAuditLog.create({
      data: {
        driverId,
        actionType: actionType === "rides" ? "RIDE_ADDED" : "REFERRAL_ADDED",
        newValue: `${actionType}: ${actionType === "rides" ? nextRides : nextReferrals}`,
        createdBy: "SYSTEM"
      }
    });
    return;
  }

  // Offer is completed!
  await prisma.$transaction(async (tx) => {
    // 1. Mark current as completed
    await tx.driverOfferProgress.update({
      where: { id: progress!.id },
      data: {
        completedRides: nextRides,
        completedReferrals: nextReferrals,
        progressPercent: 100,
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    // 2. Add to history
    await tx.driverOfferHistory.create({
      data: {
        driverId,
        offerId: progress!.offerId,
        ridesAtCompletion: nextRides,
        referralsAtCompletion: nextReferrals,
        rewardEarned: progress!.offer.rewardValue,
        rewardItemEarned: progress!.offer.rewardItem
      }
    });

    // 3. Create reward payout
    await tx.rewardPayout.create({
      data: {
        driverId,
        offerId: progress!.offerId,
        amount: progress!.offer.rewardValue,
        itemName: progress!.offer.rewardItem,
        payoutStatus: "PENDING"
      }
    });

    // 4. Handle Reset/Next Offer logic
    let nextOfferIdToAssign: string | null = null;
    if (progress!.offer.resetType === "SAME_OFFER") {
      nextOfferIdToAssign = progress!.offerId;
    } else if (progress!.offer.resetType === "NEXT_OFFER" && progress!.offer.nextOfferId) {
      nextOfferIdToAssign = progress!.offer.nextOfferId;
    }
    
    // Create audit log for completion
    await tx.offerAuditLog.create({
      data: {
        driverId,
        actionType: "OFFER_COMPLETED",
        note: `Completed offer: ${progress!.offer.title}. Reward: ${progress!.offer.rewardValue}`,
        createdBy: "SYSTEM"
      }
    });

    if (nextOfferIdToAssign) {
      // Deactivate any old active progress for safety
      await tx.driverOfferProgress.updateMany({
        where: { driverId, status: "ACTIVE" },
        data: { status: "PAUSED" }
      });
      // Try to find if progress record already exists for the next offer
      const existingProgress = await tx.driverOfferProgress.findUnique({
        where: {
          driverId_offerId: {
            driverId,
            offerId: nextOfferIdToAssign
          }
        }
      });
      
      if (existingProgress) {
        // Just reactivate and reset counters
        await tx.driverOfferProgress.update({
          where: { id: existingProgress.id },
          data: {
            status: "ACTIVE",
            completedRides: 0,
            completedReferrals: 0,
            progressPercent: 0,
            resetCount: existingProgress.resetCount + 1,
            startedAt: new Date(),
            completedAt: null
          }
        });
      } else {
        await tx.driverOfferProgress.create({
          data: {
            driverId,
            offerId: nextOfferIdToAssign,
            status: "ACTIVE",
            resetCount: progress!.resetCount + 1
          }
        });
      }
      
      await tx.offerAuditLog.create({
        data: {
          driverId,
          actionType: "OFFER_ASSIGNED",
          note: `Auto-assigned new offer due to reset rules.`,
          createdBy: "SYSTEM"
        }
      });
    }
  });
}
