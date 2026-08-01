"use server";

import { db } from "@/db";
import { projects, categories, purchases, projectFiles } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { createSlug } from "@/lib/utils";

export async function createProject(
  developerId: string,
  data: {
    title: string;
    slug?: string;
    description: string;
    shortDescription?: string;
    categoryId: string;
    price?: number;
    currency?: "usd" | "bdt" | "owo";
  }
) {
  try {
    const slug = data.slug || createSlug(data.title);

    // Check if slug already exists for this developer
    const existing = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.developerId, developerId),
          eq(projects.slug, slug)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Project with this slug already exists");
    }

    const [project] = await db
      .insert(projects)
      .values({
        developerId,
        categoryId: data.categoryId,
        title: data.title,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price?.toString() || "0.00",
        currency: data.currency || "usd",
        status: "draft",
      })
      .returning();

    return project;
  } catch (error) {
    throw error;
  }
}

export async function getProjectById(projectId: string) {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) throw new Error("Project not found");

    return project;
  } catch (error) {
    throw error;
  }
}

export async function updateProject(
  projectId: string,
  developerId: string,
  data: Partial<typeof projects.$inferInsert>
) {
  try {
    const project = await getProjectById(projectId);

    if (project.developerId !== developerId) {
      throw new Error("Unauthorized");
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function publishProject(projectId: string, developerId: string) {
  try {
    return updateProject(projectId, developerId, {
      status: "published",
    });
  } catch (error) {
    throw error;
  }
}

export async function hideProject(projectId: string, developerId: string) {
  try {
    return updateProject(projectId, developerId, {
      status: "hidden",
    });
  } catch (error) {
    throw error;
  }
}

export async function deleteProject(projectId: string, developerId: string) {
  try {
    const project = await getProjectById(projectId);

    if (project.developerId !== developerId) {
      throw new Error("Unauthorized");
    }

    await db.delete(projects).where(eq(projects.id, projectId));
  } catch (error) {
    throw error;
  }
}

export async function getProjectsByDeveloper(
  developerId: string,
  includeHidden: boolean = false
) {
  try {
    const results = await db
      .select()
      .from(projects)
      .where(
        includeHidden
          ? eq(projects.developerId, developerId)
          : and(
              eq(projects.developerId, developerId),
              eq(projects.status, "published")
            )
      );

    return results;
  } catch (error) {
    throw error;
  }
}

export async function getPublishedProjects(
  limit: number = 20,
  offset: number = 0
) {
  try {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(projects.createdAt));

    return results;
  } catch (error) {
    throw error;
  }
}

export async function searchProjects(
  query: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .limit(limit)
      .offset(offset);

    // Basic search implementation - can be enhanced with full-text search
    return results.filter(
      (p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.tags?.includes(query.toLowerCase())
    );
  } catch (error) {
    throw error;
  }
}

export async function incrementProjectViews(projectId: string) {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) throw new Error("Project not found");

    await db
      .update(projects)
      .set({
        views: project.views + 1,
      })
      .where(eq(projects.id, projectId));
  } catch (error) {
    throw error;
  }
}

export async function getProjectsByCategory(
  categoryId: string,
  limit: number = 20
) {
  try {
    const results = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.categoryId, categoryId),
          eq(projects.status, "published")
        )
      )
      .limit(limit)
      .orderBy(desc(projects.downloads));

    return results;
  } catch (error) {
    throw error;
  }
}
