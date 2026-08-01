"use server";

import { db } from "@/db";
import {
  purchases,
  licenses,
  projects,
  wallets,
  walletTransactions,
  coupons,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateLicenseKey } from "@/lib/auth";

export async function createPurchase(
  buyerId: string,
  projectId: string,
  data: {
    amount: string;
    currency: "usd" | "bdt" | "owo";
    paymentMethod: "stripe" | "paypal" | "cryptocurrency" | "wallet";
    couponCode?: string;
    transactionId?: string;
  }
) {
  try {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) throw new Error("Project not found");

    let discountAmount = "0.00";
    let couponId: string | null = null;

    if (data.couponCode) {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, data.couponCode),
            eq(coupons.isActive, true)
          )
        )
        .limit(1);

      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        couponId = coupon.id;
        if (coupon.discountType === "percentage") {
          discountAmount = (
            (parseFloat(data.amount) * parseFloat(coupon.discountValue.toString())) /
            100
          ).toFixed(2);
        } else {
          discountAmount = coupon.discountValue.toString();
        }
      }
    }

    const licenseKey = generateLicenseKey();

    const [purchase] = await db
      .insert(purchases)
      .values({
        buyerId,
        projectId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        status: "pending",
        couponId: couponId || undefined,
        discountAmount,
        licenseKey,
        transactionId: data.transactionId,
      })
      .returning();

    return purchase;
  } catch (error) {
    throw error;
  }
}

export async function completePurchase(purchaseId: string) {
  try {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) throw new Error("Purchase not found");

    // Update purchase status
    const [updatedPurchase] = await db
      .update(purchases)
      .set({
        status: "completed",
      })
      .where(eq(purchases.id, purchaseId))
      .returning();

    // Create license
    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, purchase.projectId))
      .limit(1);

    if (projectList.length === 0) throw new Error("Project not found");
    const project = projectList[0];

    const [license] = await db
      .insert(licenses)
      .values({
        purchaseId: purchase.id,
        userId: purchase.buyerId,
        projectId: purchase.projectId,
        licenseKey: purchase.licenseKey!,
        type: project.licenseType || "lifetime",
        maxActivations: project.maxActivations || 1,
        expiresAt:
          project.licenseType === "monthly"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : project.licenseType === "yearly"
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              : undefined,
      })
      .returning();

    // Add to developer's wallet
    const walletList = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, project.developerId))
      .limit(1);

    const wallet = walletList.length > 0 ? walletList[0] : null;

    if (wallet) {
      const finalAmount = (
        parseFloat(purchase.amount.toString()) -
        parseFloat(purchase.discountAmount?.toString() || "0")
      ).toFixed(2);

      await db
        .update(wallets)
        .set({
          totalEarnings: (
            parseFloat(wallet.totalEarnings?.toString() || "0") + parseFloat(finalAmount)
          ).toString(),
        })
        .where(eq(wallets.id, wallet.id));

      // Log transaction
      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "earn",
        amount: finalAmount,
        currency: purchase.currency,
        description: `Earnings from ${project.title}`,
        relatedPurchaseId: purchase.id,
      });
    }

    // Update coupon usage
    if (purchase.couponId) {
      const couponList = await db
        .select()
        .from(coupons)
        .where(eq(coupons.id, purchase.couponId))
        .limit(1);

      if (couponList.length > 0) {
        const coupon = couponList[0];
        await db
          .update(coupons)
          .set({
            usedCount: coupon.usedCount + 1,
          })
          .where(eq(coupons.id, purchase.couponId));
      }
    }

    return {
      purchase: updatedPurchase,
      license,
    };
  } catch (error) {
    throw error;
  }
}

export async function getPurchasesByUser(userId: string) {
  try {
    const results = await db
      .select()
      .from(purchases)
      .where(eq(purchases.buyerId, userId));

    return results;
  } catch (error) {
    throw error;
  }
}

export async function getPurchaseById(purchaseId: string) {
  try {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) throw new Error("Purchase not found");

    return purchase;
  } catch (error) {
    throw error;
  }
}

export async function refundPurchase(purchaseId: string) {
  try {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) throw new Error("Purchase not found");

    // Update purchase status
    await db
      .update(purchases)
      .set({
        status: "refunded",
      })
      .where(eq(purchases.id, purchaseId));

    // Revoke license
    if (purchase.licenseKey) {
      await db
        .update(licenses)
        .set({
          isRevoked: true,
        })
        .where(eq(licenses.licenseKey, purchase.licenseKey));
    }

    // Reverse wallet transaction
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, purchase.buyerId))
      .limit(1);

    if (wallet) {
      const refundAmount = (
        parseFloat(purchase.amount.toString()) -
        parseFloat(purchase.discountAmount?.toString() || "0")
      ).toFixed(2);

      await db
        .update(wallets)
        .set({
          totalEarnings: (
            parseFloat(wallet.totalEarnings?.toString() || "0") - parseFloat(refundAmount)
          ).toString(),
        })
        .where(eq(wallets.id, wallet.id));
    }
  } catch (error) {
    throw error;
  }
}
