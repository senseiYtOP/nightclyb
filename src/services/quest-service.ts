"use server";

import { db } from "@/db";
import { quests, achievements } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createQuest(data: {
  title: string;
  description?: string;
  icon?: string;
  requirementType:
    | "purchase"
    | "review"
    | "upload"
    | "login_streak"
    | "referral";
  requirementCount?: number;
  rewardCoins?: number;
  rewardBadges?: string[];
}) {
  try {
    const [quest] = await db
      .insert(quests)
      .values({
        title: data.title,
        description: data.description,
        icon: data.icon,
        requirementType: data.requirementType,
        requirementCount: data.requirementCount || 1,
        rewardCoins: data.rewardCoins || 0,
        rewardBadges: data.rewardBadges ? JSON.stringify(data.rewardBadges) : null,
      })
      .returning();

    return quest;
  } catch (error) {
    throw error;
  }
}

export async function getActiveQuests() {
  try {
    const results = await db
      .select()
      .from(quests)
      .where(eq(quests.isActive, true));

    return results;
  } catch (error) {
    throw error;
  }
}

export async function getUserAchievements(userId: string) {
  try {
    const results = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));

    return results;
  } catch (error) {
    throw error;
  }
}

export async function getOrCreateAchievement(userId: string, questId: string) {
  try {
    const existing = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, userId),
          eq(achievements.questId, questId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [achievement] = await db
      .insert(achievements)
      .values({
        userId,
        questId,
        progress: 0,
        isCompleted: false,
      })
      .returning();

    return achievement;
  } catch (error) {
    throw error;
  }
}

export async function updateAchievementProgress(
  achievementId: string,
  progress: number
) {
  try {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId))
      .limit(1);

    if (!achievement) throw new Error("Achievement not found");

    const questList = await db
      .select()
      .from(quests)
      .where(eq(quests.id, achievement.questId))
      .limit(1);

    if (questList.length === 0) throw new Error("Quest not found");
    const quest = questList[0];

    let isCompleted = achievement.isCompleted;
    let completedAt = achievement.completedAt;

    if (!isCompleted && progress >= (quest.requirementCount || 1)) {
      isCompleted = true;
      completedAt = new Date();
    }

    const [updated] = await db
      .update(achievements)
      .set({
        progress,
        isCompleted,
        completedAt,
      })
      .where(eq(achievements.id, achievementId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function completeAchievement(achievementId: string) {
  try {
    const [updated] = await db
      .update(achievements)
      .set({
        isCompleted: true,
        completedAt: new Date(),
      })
      .where(eq(achievements.id, achievementId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}
