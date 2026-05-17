CREATE TYPE "public"."complaint_status" AS ENUM('open', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('national_id', 'registration_form', 'loan_contract', 'membership_certificate', 'other');--> statement-breakpoint
CREATE TYPE "public"."fine_status" AS ENUM('pending', 'paid', 'waived');--> statement-breakpoint
CREATE TYPE "public"."interest_type" AS ENUM('daily', 'monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('pending', 'verified', 'approved', 'declined', 'disbursed', 'active', 'extended', 'settled', 'defaulted');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'suspended', 'exited');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('sms', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'mobile_money', 'bank');--> statement-breakpoint
CREATE TYPE "public"."savings_account_type" AS ENUM('regular', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('loan_disbursement', 'loan_repayment', 'savings_deposit', 'savings_withdrawal', 'fine_payment');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"diff" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_id" uuid,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" "complaint_status" DEFAULT 'open',
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"loan_id" uuid,
	"type" "document_type" NOT NULL,
	"file_name" text NOT NULL,
	"blob_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fine_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"name" text NOT NULL,
	"default_amount" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"category_id" uuid,
	"amount" integer NOT NULL,
	"reason" text,
	"status" "fine_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interest_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"min_amount" integer NOT NULL,
	"max_amount" integer NOT NULL,
	"rate" numeric NOT NULL,
	"rate_type" "interest_type" DEFAULT 'monthly',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loan_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"min_amount" integer DEFAULT 0,
	"max_amount" integer NOT NULL,
	"interest_rate" numeric DEFAULT '0' NOT NULL,
	"max_duration_months" integer DEFAULT 12,
	"requires_guarantor" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loan_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"old_due_date" date NOT NULL,
	"new_due_date" date NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loan_guarantors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"category_id" uuid,
	"interest_rate_id" uuid,
	"loan_ref" text NOT NULL,
	"amount" integer NOT NULL,
	"expected_received" integer NOT NULL,
	"balance" integer NOT NULL,
	"interest_rate" numeric NOT NULL,
	"interest_type" "interest_type" DEFAULT 'monthly',
	"duration_months" integer DEFAULT 12,
	"status" "loan_status" DEFAULT 'pending' NOT NULL,
	"late_penalty_fee" integer DEFAULT 0,
	"daily_payment" integer DEFAULT 0,
	"monthly_payment" integer DEFAULT 0,
	"due_date" date,
	"disbursed_at" timestamp,
	"settled_at" timestamp,
	"decline_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "loans_loan_ref_unique" UNIQUE("loan_ref")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_code" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"national_id" text,
	"photo_url" text,
	"date_of_birth" date,
	"address" text,
	"next_of_kin" text,
	"next_of_kin_phone" text,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "members_member_code_unique" UNIQUE("member_code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" "notification_type" DEFAULT 'sms',
	"status" "notification_status" DEFAULT 'pending',
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saccos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#16a34a',
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"settings" text DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "saccos_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "savings_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"category_id" uuid,
	"account_number" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"account_type" "savings_account_type" DEFAULT 'regular',
	"is_locked" boolean DEFAULT false,
	"lock_until" date,
	"lock_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "savings_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "savings_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"interest_rate" numeric DEFAULT '0',
	"is_fixed" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sacco_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer,
	"reference_id" uuid,
	"payment_method" "payment_method" DEFAULT 'cash',
	"narration" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fine_categories" ADD CONSTRAINT "fine_categories_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_category_id_fine_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."fine_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_rates" ADD CONSTRAINT "interest_rates_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_categories" ADD CONSTRAINT "loan_categories_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_extensions" ADD CONSTRAINT "loan_extensions_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_guarantors" ADD CONSTRAINT "loan_guarantors_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_guarantors" ADD CONSTRAINT "loan_guarantors_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_category_id_loan_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."loan_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_interest_rate_id_interest_rates_id_fk" FOREIGN KEY ("interest_rate_id") REFERENCES "public"."interest_rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_category_id_savings_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."savings_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_categories" ADD CONSTRAINT "savings_categories_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sacco_id_saccos_id_fk" FOREIGN KEY ("sacco_id") REFERENCES "public"."saccos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;