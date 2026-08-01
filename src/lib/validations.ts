import { z } from "zod";

// ============================================================================
// USER VALIDATIONS
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must be at most 100 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(255).optional(),
  bio: z.string().max(500).optional(),
});

// ============================================================================
// PROJECT VALIDATIONS
// ============================================================================

export const createProjectSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  price: z.number().min(0).optional(),
  currency: z.enum(["usd", "bdt", "owo"]).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ============================================================================
// PURCHASE VALIDATIONS
// ============================================================================

export const purchaseSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.number().min(0),
  currency: z.enum(["usd", "bdt", "owo"]).default("usd"),
  paymentMethod: z.enum(["stripe", "paypal", "cryptocurrency", "wallet"]),
  couponCode: z.string().optional(),
});

// ============================================================================
// LICENSE VALIDATIONS
// ============================================================================

export const verifyLicenseSchema = z.object({
  licenseKey: z.string(),
  projectId: z.string().uuid(),
  hwid: z.string().optional(),
  deviceId: z.string().optional(),
});

export const activateLicenseSchema = z.object({
  licenseKey: z.string(),
  hwid: z.string().optional(),
  deviceId: z.string().optional(),
});

// ============================================================================
// REVIEW VALIDATIONS
// ============================================================================

export const createReviewSchema = z.object({
  projectId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().max(1000),
});

// ============================================================================
// COUPON VALIDATIONS
// ============================================================================

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0),
  maxUses: z.number().int().optional(),
  expiresAt: z.date().optional(),
  minPurchaseAmount: z.number().min(0).optional(),
});

// ============================================================================
// QUEST VALIDATIONS
// ============================================================================

export const createQuestSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  requirementType: z.enum([
    "purchase",
    "review",
    "upload",
    "login_streak",
    "referral",
  ]),
  requirementCount: z.number().int().min(1),
  rewardCoins: z.number().int().min(0).optional(),
});
