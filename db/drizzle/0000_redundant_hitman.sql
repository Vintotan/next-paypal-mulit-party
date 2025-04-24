CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "paypal_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"email" text,
	"business_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"webhook_id" text,
	"is_live" boolean DEFAULT false NOT NULL,
	"credentials" jsonb,
	CONSTRAINT "paypal_accounts_merchant_id_unique" UNIQUE("merchant_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paypal_account_id" uuid,
	"order_id" text NOT NULL,
	"amount" text NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"platform_fee" text,
	"buyer_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"payment_details" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paypal_account_id" uuid,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"payload" jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "paypal_accounts" ADD CONSTRAINT "paypal_accounts_org_id_organizations_clerk_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("clerk_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paypal_account_id_paypal_accounts_id_fk" FOREIGN KEY ("paypal_account_id") REFERENCES "public"."paypal_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_paypal_account_id_paypal_accounts_id_fk" FOREIGN KEY ("paypal_account_id") REFERENCES "public"."paypal_accounts"("id") ON DELETE no action ON UPDATE no action;