"use server";

import { db } from "@/db";
import { wallets, walletTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWallet(userId: string) {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error("Wallet not found");

    return wallet;
  } catch (error) {
    throw error;
  }
}

export async function addWalletBalance(
  userId: string,
  amount: number,
  currency: "usd" | "bdt" | "owo",
  description?: string
) {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error("Wallet not found");

    // Update wallet balance based on currency
    const updateData: any = {};
    if (currency === "usd") {
      updateData.balanceUsd = (
        parseFloat(wallet.balanceUsd?.toString() || "0") + amount
      ).toFixed(2);
    } else if (currency === "bdt") {
      updateData.balanceBdt = (
        parseFloat(wallet.balanceBdt?.toString() || "0") + amount
      ).toFixed(2);
    } else if (currency === "owo") {
      updateData.balanceOwo = (
        parseFloat(wallet.balanceOwo?.toString() || "0") + amount
      ).toFixed(2);
    }

    await db.update(wallets).set(updateData).where(eq(wallets.id, wallet.id));

    // Log transaction
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        walletId: wallet.id,
        type: "deposit",
        amount: amount.toString(),
        currency,
        description: description || "Balance added",
      })
      .returning();

    return transaction;
  } catch (error) {
    throw error;
  }
}

export async function deductWalletBalance(
  userId: string,
  amount: number,
  currency: "usd" | "bdt" | "owo",
  description?: string
) {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error("Wallet not found");

    // Check balance
    let currentBalance = 0;
    if (currency === "usd") {
      currentBalance = parseFloat(wallet.balanceUsd?.toString() || "0");
    } else if (currency === "bdt") {
      currentBalance = parseFloat(wallet.balanceBdt?.toString() || "0");
    } else if (currency === "owo") {
      currentBalance = parseFloat(wallet.balanceOwo?.toString() || "0");
    }

    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }

    // Update wallet balance based on currency
    const updateData: any = {};
    if (currency === "usd") {
      updateData.balanceUsd = (currentBalance - amount).toFixed(2);
    } else if (currency === "bdt") {
      updateData.balanceBdt = (currentBalance - amount).toFixed(2);
    } else if (currency === "owo") {
      updateData.balanceOwo = (currentBalance - amount).toFixed(2);
    }

    await db.update(wallets).set(updateData).where(eq(wallets.id, wallet.id));

    // Log transaction
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        walletId: wallet.id,
        type: "withdrawal",
        amount: amount.toString(),
        currency,
        description: description || "Balance deducted",
      })
      .returning();

    return transaction;
  } catch (error) {
    throw error;
  }
}

export async function addDeveloperCoins(
  userId: string,
  coins: number,
  description?: string
) {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error("Wallet not found");

    await db
      .update(wallets)
      .set({
        developerCoins: wallet.developerCoins + coins,
      })
      .where(eq(wallets.id, wallet.id));

    // No transaction log for coins, they're internal currency
  } catch (error) {
    throw error;
  }
}

export async function getWalletTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error("Wallet not found");

    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .limit(limit)
      .offset(offset);

    return transactions;
  } catch (error) {
    throw error;
  }
}

export async function recordPurchaseTransaction(
  userId: string,
  amount: number,
  currency: "usd" | "bdt" | "owo",
  purchaseId: string,
  description: string
) {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error("Wallet not found");

    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        walletId: wallet.id,
        type: "purchase",
        amount: amount.toString(),
        currency,
        description,
        relatedPurchaseId: purchaseId,
      })
      .returning();

    return transaction;
  } catch (error) {
    throw error;
  }
}
