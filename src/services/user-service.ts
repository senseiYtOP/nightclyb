"use server";

import { db } from "@/db";
import { users, wallets, sessions } from "@/db/schema";
import { hashPassword, verifyPassword, generateSessionToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function createUser(
  email: string,
  username: string,
  password: string,
  displayName?: string
) {
  try {
    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("User with this email already exists");
    }

    const usernameExists = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (usernameExists.length > 0) {
      throw new Error("Username already taken");
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
        displayName: displayName || username,
        isVerified: false,
      })
      .returning();

    // Create wallet for the user
    await db.insert(wallets).values({
      userId: newUser.id,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      displayName: newUser.displayName,
    };
  } catch (error) {
    throw error;
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.isBanned) {
      throw new Error("Account has been banned");
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error("Invalid email or password");
    }

    const token = generateSessionToken();

    const [session] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
      session: {
        id: session.id,
        token: session.token,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getUserById(userId: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error("User not found");

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  } catch (error) {
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  }
) {
  try {
    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function getUserByUsername(username: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) throw new Error("User not found");

    return user;
  } catch (error) {
    throw error;
  }
}

export async function verifySession(token: string) {
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!session) throw new Error("Invalid session");
    if (session.expiresAt < new Date()) throw new Error("Session expired");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) throw new Error("User not found");

    return user;
  } catch (error) {
    throw error;
  }
}

export async function invalidateSession(token: string) {
  try {
    await db.delete(sessions).where(eq(sessions.token, token));
  } catch (error) {
    throw error;
  }
}
