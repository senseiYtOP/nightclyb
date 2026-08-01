"use server";

import { db } from "@/db";
import {
  projects,
  purchases,
  licenses,
  reviews,
  wallets,
  downloadHistory,
} from "@/db/schema";
import { eq, and, sum, count } from "drizzle-orm";

export async function getDeveloperStats(developerId: string) {
  try {
    // Get projects count
    const projectCount = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.developerId, developerId));

    // Get total downloads
    const totalDownloads = await db
      .select({ total: sum(projects.downloads) })
      .from(projects)
      .where(eq(projects.developerId, developerId));

    // Get total earnings
    const wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, developerId))
      .limit(1);

    // Get recent reviews
    const recentReviews = await db
      .select()
      .from(reviews)
      .innerJoin(projects, eq(reviews.projectId, projects.id))
      .where(eq(projects.developerId, developerId))
      .limit(5);

    return {
      projectCount: projectCount[0]?.count || 0,
      totalDownloads: totalDownloads[0]?.total || 0,
      totalEarnings: wallet.length > 0 ? wallet[0].totalEarnings : "0.00",
      wallet: wallet.length > 0 ? wallet[0] : null,
      recentReviews,
    };
  } catch (error) {
    throw error;
  }
}

export async function getUserPurchaseHistory(userId: string) {
  try {
    const purchaseList = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.buyerId, userId),
          eq(purchases.status, "completed")
        )
      );

    return purchaseList;
  } catch (error) {
    throw error;
  }
}

export async function getUserLicenseHistory(userId: string) {
  try {
    const licenseList = await db
      .select()
      .from(licenses)
      .where(eq(licenses.userId, userId));

    return licenseList;
  } catch (error) {
    throw error;
  }
}

export async function getUserDownloadHistory(userId: string, limit: number = 50) {
  try {
    const downloads = await db
      .select()
      .from(downloadHistory)
      .where(eq(downloadHistory.userId, userId))
      .limit(limit);

    return downloads;
  } catch (error) {
    throw error;
  }
}

export async function getProjectStats(projectId: string) {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) throw new Error("Project not found");

    // Get purchase count
    const purchaseCount = await db
      .select({ count: count() })
      .from(purchases)
      .where(
        and(
          eq(purchases.projectId, projectId),
          eq(purchases.status, "completed")
        )
      );

    // Get revenue
    const revenue = await db
      .select({ total: sum(purchases.amount) })
      .from(purchases)
      .where(
        and(
          eq(purchases.projectId, projectId),
          eq(purchases.status, "completed")
        )
      );

    // Get review count and average rating
    const reviewStats = await db
      .select()
      .from(reviews)
      .where(eq(reviews.projectId, projectId));

    const averageRating =
      reviewStats.length > 0
        ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
        : 0;

    return {
      project,
      purchaseCount: purchaseCount[0]?.count || 0,
      revenue: revenue[0]?.total || "0.00",
      reviewCount: reviewStats.length,
      averageRating,
      downloads: project.downloads,
      views: project.views,
    };
  } catch (error) {
    throw error;
  }
}
