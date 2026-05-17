CREATE TYPE "public"."user_role" AS ENUM('admin', 'cashier', 'field_agent');--> statement-breakpoint
CREATE TABLE "sacco_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'field_agent' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true,
	"must_change_password" boolean DEFAULT false,
	"last_login_at" timestamp,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sacco_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "loan_top_ups" DROP CONSTRAINT "loan_top_ups_processed_by_members_id_fk";
--> statement-breakpoint
ALTER TABLE "saccos" ALTER COLUMN "primary_color" SET DEFAULT '#f97316';--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "actor_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "actor_name" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "actor_role" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "saccos" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "saccos" ADD COLUMN "registration_number" text;--> statement-breakpoint
ALTER TABLE "saccos" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "sacco_users" ADD CONSTRAINT "sacco_users_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "actor";--> statement-breakpoint
ALTER TABLE "loan_top_ups" DROP COLUMN "payment_reference";