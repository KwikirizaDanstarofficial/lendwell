ALTER TYPE "public"."payment_method" ADD VALUE 'flutterwave';--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'mtn';--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'airtel';--> statement-breakpoint
CREATE TABLE "loan_top_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text,
	"payment_method" "payment_method" DEFAULT 'cash',
	"payment_reference" text,
	"notes" text,
	"processed_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "reference_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "reference_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "loan_top_ups" ADD CONSTRAINT "loan_top_ups_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_top_ups" ADD CONSTRAINT "loan_top_ups_processed_by_members_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;