"use server";

import { db } from "@/db";
import { giftCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function generateGiftCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

export async function createGiftCode(data: {
  projectId?: string;
  amountUsd?: number;
  amountBdt?: number;
  amountOwo?: number;
  developerCoins?: number;
  expiresAt?: Date;
}) {
  try {
    const code = generateGiftCode();

    const [giftCode] = await db
      .insert(giftCodes)
      .values({
        code,
        projectId: data.projectId,
        amountUsd: data.amountUsd?.toString(),
        amountBdt: data.amountBdt?.toString(),
        amountOwo: data.amountOwo?.toString(),
        developerCoins: data.developerCoins,
        expiresAt: data.expiresAt,
      })
      .returning();

    return giftCode;
  } catch (error) {
    throw error;
  }
}

export async function getGiftCode(code: string) {
  try {
    const [giftCode] = await db
      .select()
      .from(giftCodes)
      .where(eq(giftCodes.code, code))
      .limit(1);

    if (!giftCode) throw new Error("Gift code not found");

    return giftCode;
  } catch (error) {
    throw error;
  }
}

export async function validateGiftCode(code: string) {
  try {
    const giftCode = await getGiftCode(code);

    // Check if already used
    if (giftCode.usedBy) throw new Error("Gift code has already been used");

    // Check if expired
    if (giftCode.expiresAt && giftCode.expiresAt < new Date()) {
      throw new Error("Gift code has expired");
    }

    return giftCode;
  } catch (error) {
    throw error;
  }
}

export async function redeemGiftCode(code: string, userId: string) {
  try {
    const giftCode = await validateGiftCode(code);

    const [updated] = await db
      .update(giftCodes)
      .set({
        usedBy: userId,
        usedAt: new Date(),
      })
      .where(eq(giftCodes.id, giftCode.id))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function getUserRedeemedCodes(userId: string) {
  try {
    const codes = await db
      .select()
      .from(giftCodes)
      .where(eq(giftCodes.usedBy, userId));

    return codes;
  } catch (error) {
    throw error;
  }
}
