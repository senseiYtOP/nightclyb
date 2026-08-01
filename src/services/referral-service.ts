"use server";

import { db } from "@/db";
import { referrals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateReferralCode } from "@/lib/auth";

export async function createReferral(
  referrerId: string,
  referredId: string,
  commissionPercentage?: number
) {
  try {
    const code = generateReferralCode();

    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId,
        referredId,
        code,
        commissionPercentage: commissionPercentage?.toString() || "5.00",
      })
      .returning();

    return referral;
  } catch (error) {
    throw error;
  }
}

export async function getReferralCode(referrerId: string) {
  try {
    const codeList = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, referrerId),
          eq(referrals.isActive, true)
        )
      )
      .limit(1);

    if (codeList.length === 0) {
      // Create a new referral code if none exists
      const code = generateReferralCode();
      const [newReferral] = await db
        .insert(referrals)
        .values({
          referrerId,
          referredId: referrerId, // Self-referral temporarily
          code,
        })
        .returning();
      return newReferral;
    }

    return codeList[0];
  } catch (error) {
    throw error;
  }
}

export async function getReferralByCode(code: string) {
  try {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.code, code))
      .limit(1);

    if (!referral) throw new Error("Referral code not found");

    return referral;
  } catch (error) {
    throw error;
  }
}

export async function updateReferralCommission(
  referralId: string,
  commission: number
) {
  try {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, referralId))
      .limit(1);

    if (!referral) throw new Error("Referral not found");

    const newTotal =
      (parseFloat(referral.totalCommission?.toString() || "0") +
        commission);

    const [updated] = await db
      .update(referrals)
      .set({
        totalCommission: newTotal.toString(),
      })
      .where(eq(referrals.id, referralId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function getReferralStats(referrerId: string) {
  try {
    const stats = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId));

    const totalCommission = stats.reduce(
      (sum, r) => sum + parseFloat(r.totalCommission?.toString() || "0"),
      0
    );

    return {
      referralsCount: stats.length,
      totalCommission,
      activeReferrals: stats.filter((r) => r.isActive).length,
    };
  } catch (error) {
    throw error;
  }
}
