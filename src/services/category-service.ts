"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, SQL } from "drizzle-orm";

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}) {
  try {
    const [category] = await db
      .insert(categories)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        sortOrder: data.sortOrder || 0,
      })
      .returning();

    return category;
  } catch (error) {
    throw error;
  }
}

export async function getCategories(activeOnly: boolean = true) {
  try {
    if (activeOnly) {
      const results = await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true));
      return results;
    } else {
      const results = await db.select().from(categories);
      return results;
    }
  } catch (error) {
    throw error;
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category) throw new Error("Category not found");

    return category;
  } catch (error) {
    throw error;
  }
}

export async function updateCategory(
  categoryId: string,
  data: Partial<typeof categories.$inferInsert>
) {
  try {
    const [updated] = await db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    await db.delete(categories).where(eq(categories.id, categoryId));
  } catch (error) {
    throw error;
  }
}
