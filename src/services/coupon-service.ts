"use server";

import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createCoupon(data: {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses?: number;
  expiresAt?: Date;
  minPurchaseAmount?: number;
}) {
  try {
    const [coupon] = await db
      .insert(coupons)
      .values({
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue.toString(),
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
        minPurchaseAmount: data.minPurchaseAmount?.toString(),
      })
      .returning();

    return coupon;
  } catch (error) {
    throw error;
  }
}

export async function getCoupon(code: string) {
  try {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (!coupon) throw new Error("Coupon not found");

    return coupon;
  } catch (error) {
    throw error;
  }
}

export async function validateCoupon(code: string, purchaseAmount: number) {
  try {
    const coupon = await getCoupon(code);

    // Check if coupon is active
    if (!coupon.isActive) throw new Error("Coupon is not active");

    // Check if coupon has expired
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new Error("Coupon has expired");
    }

    // Check if coupon has reached max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new Error("Coupon usage limit reached");
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount) {
      if (purchaseAmount < parseFloat(coupon.minPurchaseAmount.toString())) {
        throw new Error(
          `Minimum purchase amount of ${coupon.minPurchaseAmount} required`
        );
      }
    }

    return coupon;
  } catch (error) {
    throw error;
  }
}

export async function updateCoupon(
  couponId: string,
  data: Partial<typeof coupons.$inferInsert>
) {
  try {
    const [updated] = await db
      .update(coupons)
      .set(data)
      .where(eq(coupons.id, couponId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    await db.delete(coupons).where(eq(coupons.id, couponId));
  } catch (error) {
    throw error;
  }
}

export async function getCoupons(activeOnly: boolean = true) {
  try {
    if (activeOnly) {
      const results = await db
        .select()
        .from(coupons)
        .where(eq(coupons.isActive, true));
      return results;
    } else {
      const results = await db.select().from(coupons);
      return results;
    }
  } catch (error) {
    throw error;
  }
}
