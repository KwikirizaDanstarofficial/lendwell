ALTER TABLE "complaints" ADD COLUMN "complaint_ref" text;--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "category" text DEFAULT 'general';--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "priority" text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "resolution_notes" text;--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "resolved_by" uuid;--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "satisfaction_rating" integer;--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "fine_ref" text;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "priority" text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "waived_by" uuid;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "waiver_reason" text;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "priority" text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "channel" text DEFAULT 'sms';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "recipient_phone" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "recipient_email" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "reference_type" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "reference_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" text DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "retry_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "max_retries" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_complaint_ref_unique" UNIQUE("complaint_ref");--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_fine_ref_unique" UNIQUE("fine_ref");