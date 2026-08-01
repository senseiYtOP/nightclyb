"use server";

import { db } from "@/db";
import { reviews, purchases } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createReview(
  projectId: string,
  userId: string,
  data: {
    rating: number;
    title?: string;
    content: string;
  }
) {
  try {
    // Check if user has purchased the project
    const purchased = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.projectId, projectId),
          eq(purchases.buyerId, userId),
          eq(purchases.status, "completed")
        )
      )
      .limit(1);

    const isVerifiedPurchase = purchased.length > 0;

    // Check if review already exists
    const existing = await db
      .select()
      .from(reviews)
      .where(
        and(eq(reviews.projectId, projectId), eq(reviews.userId, userId))
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("You have already reviewed this project");
    }

    const [review] = await db
      .insert(reviews)
      .values({
        projectId,
        userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        isVerifiedPurchase,
      })
      .returning();

    return review;
  } catch (error) {
    throw error;
  }
}

export async function getProjectReviews(projectId: string, limit: number = 20) {
  try {
    const results = await db
      .select()
      .from(reviews)
      .where(eq(reviews.projectId, projectId))
      .limit(limit);

    return results;
  } catch (error) {
    throw error;
  }
}

export async function updateReview(
  reviewId: string,
  userId: string,
  data: Partial<typeof reviews.$inferInsert>
) {
  try {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) throw new Error("Review not found");
    if (review.userId !== userId) throw new Error("Unauthorized");

    const [updated] = await db
      .update(reviews)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function deleteReview(reviewId: string, userId: string) {
  try {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) throw new Error("Review not found");
    if (review.userId !== userId) throw new Error("Unauthorized");

    await db.delete(reviews).where(eq(reviews.id, reviewId));
  } catch (error) {
    throw error;
  }
}

export async function markReviewHelpful(reviewId: string) {
  try {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) throw new Error("Review not found");

    await db
      .update(reviews)
      .set({
        helpful: review.helpful + 1,
      })
      .where(eq(reviews.id, reviewId));

    return review;
  } catch (error) {
    throw error;
  }
}

export async function markReviewUnhelpful(reviewId: string) {
  try {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) throw new Error("Review not found");

    await db
      .update(reviews)
      .set({
        unhelpful: review.unhelpful + 1,
      })
      .where(eq(reviews.id, reviewId));

    return review;
  } catch (error) {
    throw error;
  }
}
