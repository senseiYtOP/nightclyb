import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "moderator",
  "developer",
  "user",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "published",
  "hidden",
  "deleted",
]);

export const licenseTypeEnum = pgEnum("license_type", [
  "lifetime",
  "monthly",
  "yearly",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "paypal",
  "cryptocurrency",
  "wallet",
]);

export const currencyEnum = pgEnum("currency", ["usd", "bdt", "owo"]);

export const deviceLockTypeEnum = pgEnum("device_lock_type", [
  "none",
  "hwid",
  "device_id",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
  "purchase",
  "refund",
  "earn",
  "admin_adjustment",
]);

export const requirementTypeEnum = pgEnum("requirement_type", [
  "purchase",
  "review",
  "upload",
  "login_streak",
  "referral",
]);

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 100 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: varchar("display_name", { length: 255 }),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").default("user").notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    isBanned: boolean("is_banned").default(false).notNull(),
    discordId: varchar("discord_id", { length: 100 }),
    discordUsername: varchar("discord_username", { length: 100 }),
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    twoFactorSecret: text("two_factor_secret"),
    lastLoginAt: timestamp("last_login_at"),
    lastLoginIp: varchar("last_login_ip", { length: 45 }),
    lastLoginUserAgent: text("last_login_user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_email").on(table.email),
    uniqueIndex("idx_username").on(table.username),
    index("idx_discord_id").on(table.discordId),
    index("idx_created_at").on(table.createdAt),
  ]
);

// ============================================================================
// USER SESSIONS
// ============================================================================

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    token: text("token").notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_id").on(table.userId),
    index("idx_token").on(table.token),
  ]
);

// ============================================================================
// LOGIN HISTORY
// ============================================================================

export const loginHistory = pgTable(
  "login_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    ipAddress: varchar("ip_address", { length: 45 }).notNull(),
    userAgent: text("user_agent"),
    success: boolean("success").default(false).notNull(),
    failureReason: varchar("failure_reason", { length: 255 }),
    isSuspicious: boolean("is_suspicious").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_id").on(table.userId),
    index("idx_created_at").on(table.createdAt),
  ]
);

// ============================================================================
// CATEGORIES
// ============================================================================

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }),
    color: varchar("color", { length: 7 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("idx_slug").on(table.slug)]
);

// ============================================================================
// PROJECTS
// ============================================================================

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    developerId: uuid("developer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict", onUpdate: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description").notNull(),
    shortDescription: varchar("short_description", { length: 500 }),
    thumbnailUrl: text("thumbnail_url"),
    bannerUrl: text("banner_url"),
    status: projectStatusEnum("status").default("draft").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
    currency: currencyEnum("currency").default("usd").notNull(),
    downloads: integer("downloads").default(0).notNull(),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
    ratingCount: integer("rating_count").default(0).notNull(),
    views: integer("views").default(0).notNull(),
    tags: text("tags"), // JSON array as text
    version: varchar("version", { length: 50 }),
    changelog: text("changelog"),
    licenseType: licenseTypeEnum("license_type").default("lifetime"),
    maxActivations: integer("max_activations"),
    supportedOs: text("supported_os"), // JSON array
    requiresLicense: boolean("requires_license").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_developer_slug").on(table.developerId, table.slug),
    index("idx_status").on(table.status),
    index("idx_category_id").on(table.categoryId),
    index("idx_created_at").on(table.createdAt),
  ]
);

// ============================================================================
// PROJECT FILES
// ============================================================================

export const projectFiles = pgTable(
  "project_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    filename: varchar("filename", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    s3Key: text("s3_key").notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    downloads: integer("downloads").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_project_id").on(table.projectId)]
);

// ============================================================================
// PURCHASES
// ============================================================================

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: currencyEnum("currency").default("usd").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    transactionId: varchar("transaction_id", { length: 255 }),
    couponId: uuid("coupon_id"),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    giftCode: varchar("gift_code", { length: 100 }),
    licenseKey: varchar("license_key", { length: 255 }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_buyer_id").on(table.buyerId),
    index("idx_project_id").on(table.projectId),
    index("idx_status").on(table.status),
    index("idx_created_at").on(table.createdAt),
  ]
);

// ============================================================================
// LICENSES
// ============================================================================

export const licenses = pgTable(
  "licenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purchaseId: uuid("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    licenseKey: varchar("license_key", { length: 255 }).notNull(),
    type: licenseTypeEnum("type").default("lifetime").notNull(),
    activationCount: integer("activation_count").default(0).notNull(),
    maxActivations: integer("max_activations"),
    deviceLockType: deviceLockTypeEnum("device_lock_type").default("none"),
    lockedHwid: varchar("locked_hwid", { length: 255 }),
    lockedDeviceId: varchar("locked_device_id", { length: 255 }),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true).notNull(),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_license_key").on(table.licenseKey),
    index("idx_user_id").on(table.userId),
    index("idx_project_id").on(table.projectId),
  ]
);

// ============================================================================
// LICENSE ACTIVATIONS
// ============================================================================

export const licenseActivations = pgTable(
  "license_activations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => licenses.id, { onDelete: "cascade", onUpdate: "cascade" }),
    hwid: varchar("hwid", { length: 255 }),
    deviceId: varchar("device_id", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    activatedAt: timestamp("activated_at").defaultNow().notNull(),
    deactivatedAt: timestamp("deactivated_at"),
    lastUsedAt: timestamp("last_used_at").defaultNow(),
  },
  (table) => [index("idx_license_id").on(table.licenseId)]
);

// ============================================================================
// DOWNLOAD HISTORY
// ============================================================================

export const downloadHistory = pgTable(
  "download_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    projectFileId: uuid("project_file_id")
      .notNull()
      .references(() => projectFiles.id, { onDelete: "cascade", onUpdate: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    ipAddress: varchar("ip_address", { length: 45 }).notNull(),
    userAgent: text("user_agent"),
    licenseKey: varchar("license_key", { length: 255 }),
    downloadUrl: text("download_url"),
    urlExpiresAt: timestamp("url_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_id").on(table.userId),
    index("idx_project_id").on(table.projectId),
    index("idx_created_at").on(table.createdAt),
  ]
);

// ============================================================================
// COUPONS & DISCOUNTS
// ============================================================================

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull(),
    discountType: discountTypeEnum("discount_type").default("percentage").notNull(),
    discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").default(0).notNull(),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true).notNull(),
    minPurchaseAmount: decimal("min_purchase_amount", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("idx_code").on(table.code)]
);

// ============================================================================
// GIFT CODES
// ============================================================================

export const giftCodes = pgTable(
  "gift_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }),
    amountBdt: decimal("amount_bdt", { precision: 10, scale: 2 }),
    amountOwo: decimal("amount_owo", { precision: 10, scale: 2 }),
    developerCoins: integer("developer_coins"),
    usedBy: uuid("used_by").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    usedAt: timestamp("used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("idx_code").on(table.code)]
);

// ============================================================================
// WALLETS
// ============================================================================

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    balanceUsd: decimal("balance_usd", { precision: 15, scale: 2 }).default("0.00"),
    balanceBdt: decimal("balance_bdt", { precision: 15, scale: 2 }).default("0.00"),
    balanceOwo: decimal("balance_owo", { precision: 15, scale: 2 }).default("0.00"),
    developerCoins: integer("developer_coins").default(0).notNull(),
    totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).default(
      "0.00"
    ),
    withdrawalsPending: decimal("withdrawals_pending", { precision: 15, scale: 2 }).default(
      "0.00"
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_user_id").on(table.userId)]
);

// ============================================================================
// WALLET TRANSACTIONS
// ============================================================================

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: transactionTypeEnum("type").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: currencyEnum("currency").default("usd").notNull(),
    description: text("description"),
    relatedPurchaseId: uuid("related_purchase_id").references(() => purchases.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    status: paymentStatusEnum("status").default("completed").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_wallet_id").on(table.walletId)]
);

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    title: varchar("title", { length: 255 }),
    content: text("content"),
    helpful: integer("helpful").default(0).notNull(),
    unhelpful: integer("unhelpful").default(0).notNull(),
    isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_project_user").on(table.projectId, table.userId),
    index("idx_project_id").on(table.projectId),
  ]
);

// ============================================================================
// QUESTS & ACHIEVEMENTS
// ============================================================================

export const quests = pgTable(
  "quests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }),
    rewardCoins: integer("reward_coins").default(0),
    rewardBadges: text("reward_badges"), // JSON array
    requirementType: requirementTypeEnum("requirement_type").notNull(),
    requirementCount: integer("requirement_count").default(1),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_active").on(table.isActive)]
);

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    questId: uuid("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade", onUpdate: "cascade" }),
    progress: integer("progress").default(0).notNull(),
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("idx_user_quest").on(table.userId, table.questId)]
);

// ============================================================================
// REFERRALS
// ============================================================================

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    referredId: uuid("referred_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 })
      .default("5.00")
      .notNull(),
    totalCommission: decimal("total_commission", { precision: 15, scale: 2 }).default(
      "0.00"
    ),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_code").on(table.code),
    index("idx_referrer_id").on(table.referrerId),
  ]
);

// ============================================================================
// AUDIT LOG
// ============================================================================

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }).notNull(),
    changes: jsonb("changes"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_id").on(table.userId),
    index("idx_created_at").on(table.createdAt),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  loginHistory: many(loginHistory),
  projects: many(projects),
  purchases: many(purchases),
  licenses: many(licenses),
  reviews: many(reviews),
  achievements: many(achievements),
  wallet: one(wallets),
  referralsAsReferrer: many(referrals, { relationName: "referrer" }),
  referralsAsReferred: many(referrals, { relationName: "referred" }),
  downloadHistory: many(downloadHistory),
  auditLogs: many(auditLog),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  developer: one(users, {
    fields: [projects.developerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
  files: many(projectFiles),
  purchases: many(purchases),
  reviews: many(reviews),
  licenses: many(licenses),
  downloadHistory: many(downloadHistory),
}));

export const projectFilesRelations = relations(projectFiles, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
  downloadHistory: many(downloadHistory),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  buyer: one(users, {
    fields: [purchases.buyerId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [purchases.projectId],
    references: [projects.id],
  }),
  licenses: many(licenses),
  walletTransactions: many(walletTransactions),
}));

export const licensesRelations = relations(licenses, ({ one, many }) => ({
  purchase: one(purchases, {
    fields: [licenses.purchaseId],
    references: [purchases.id],
  }),
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [licenses.projectId],
    references: [projects.id],
  }),
  activations: many(licenseActivations),
}));

export const licenseActivationsRelations = relations(licenseActivations, ({ one }) => ({
  license: one(licenses, {
    fields: [licenseActivations.licenseId],
    references: [licenses.id],
  }),
}));

export const downloadHistoryRelations = relations(downloadHistory, ({ one }) => ({
  user: one(users, {
    fields: [downloadHistory.userId],
    references: [users.id],
  }),
  projectFile: one(projectFiles, {
    fields: [downloadHistory.projectFileId],
    references: [projectFiles.id],
  }),
  project: one(projects, {
    fields: [downloadHistory.projectId],
    references: [projects.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  purchases: many(purchases),
}));

export const giftCodesRelations = relations(giftCodes, ({ one }) => ({
  project: one(projects, {
    fields: [giftCodes.projectId],
    references: [projects.id],
  }),
  usedByUser: one(users, {
    fields: [giftCodes.usedBy],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
  relatedPurchase: one(purchases, {
    fields: [walletTransactions.relatedPurchaseId],
    references: [purchases.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, {
    fields: [reviews.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const questsRelations = relations(quests, ({ many }) => ({
  achievements: many(achievements),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [achievements.questId],
    references: [quests.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));
