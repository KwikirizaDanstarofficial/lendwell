CREATE TYPE "public"."cms_user_role" AS ENUM('super_admin', 'admin');--> statement-breakpoint
ALTER TABLE "saccos" ALTER COLUMN "onboarding_completed" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "next_of_kin_relationship" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "next_of_kin_address" text;--> statement-breakpoint
ALTER TABLE "saccos" ADD COLUMN "tagline" text;