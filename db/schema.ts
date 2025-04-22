import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Organizations table
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PayPal merchant accounts for organizations
export const paypalAccounts = pgTable("paypal_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.clerkId),
  merchantId: text("merchant_id").notNull().unique(),
  email: text("email"),
  businessName: text("business_name"),
  status: text("status").default("pending").notNull(), // pending, active, suspended
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  webhookId: text("webhook_id"), // For tracking webhook subscriptions
  isLive: boolean("is_live").default(false).notNull(),
  credentials: jsonb("credentials"), // Stored securely, contains refresh tokens or other necessary data
});

// Transaction records for payments processed
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  paypalAccountId: uuid("paypal_account_id").references(
    () => paypalAccounts.id,
  ),
  orderId: text("order_id").notNull(),
  amount: text("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: text("status").notNull(), // created, approved, completed, voided, etc.
  platformFee: text("platform_fee"), // Fee collected by the platform
  buyerEmail: text("buyer_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paymentDetails: jsonb("payment_details"), // Detailed information about the payment
  metadata: jsonb("metadata"), // Custom data for integrations
});

// Webhook events received from PayPal
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  paypalAccountId: uuid("paypal_account_id").references(
    () => paypalAccounts.id,
  ),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  payload: jsonb("payload"),
  processed: boolean("processed").default(false).notNull(),
});

// Subscriptions table to store active subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  paypalAccountId: uuid("paypal_account_id").references(
    () => paypalAccounts.id,
  ),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.clerkId),
  subscriptionId: text("subscription_id").notNull().unique(),
  planId: text("plan_id"),
  status: text("status").notNull(), // ACTIVE, SUSPENDED, CANCELLED, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  startDate: timestamp("start_date"),
  nextBillingDate: timestamp("next_billing_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  lastPaymentAmount: text("last_payment_amount"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  buyerEmail: text("buyer_email"),
  metadata: jsonb("metadata"), // For additional details about the subscription
});
