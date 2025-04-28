CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paypal_account_id" uuid,
	"org_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"plan_id" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"start_date" timestamp,
	"next_billing_date" timestamp,
	"last_payment_date" timestamp,
	"last_payment_amount" text,
	"currency" varchar(3) DEFAULT 'USD',
	"buyer_email" text,
	"metadata" jsonb,
	CONSTRAINT "subscriptions_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_paypal_account_id_paypal_accounts_id_fk" FOREIGN KEY ("paypal_account_id") REFERENCES "public"."paypal_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_organizations_clerk_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("clerk_id") ON DELETE no action ON UPDATE no action;