-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('system_admin', 'company_admin', 'company_user');

-- CreateEnum
CREATE TYPE "public"."ConsentStatus" AS ENUM ('unknown', 'granted', 'revoked');

-- CreateEnum
CREATE TYPE "public"."ParsedStatus" AS ENUM ('pending', 'parsed', 'failed');

-- CreateEnum
CREATE TYPE "public"."ViolationStatus" AS ENUM ('pending_match', 'matched', 'notified', 'failed');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('queued', 'sending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "whatsapp_sender_id" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "company_id" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Driver" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "external_driver_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp_e164" TEXT NOT NULL,
    "vehicle_number" TEXT,
    "consent_status" "public"."ConsentStatus" NOT NULL DEFAULT 'unknown',
    "consent_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InboundEmail" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "mail_from" TEXT NOT NULL,
    "rcpt_to" TEXT NOT NULL,
    "subject" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "s3_key" TEXT NOT NULL,
    "parsed_status" "public"."ParsedStatus" NOT NULL DEFAULT 'pending',
    "dedup_hash" TEXT NOT NULL,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Violation" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "violation_type" TEXT,
    "occurred_at" TIMESTAMP(3),
    "location" TEXT,
    "raw_payload_ref" TEXT,
    "source_email_id" TEXT,
    "status" "public"."ViolationStatus" NOT NULL DEFAULT 'pending_match',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "violation_id" TEXT,
    "template_name" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "provider_message_id" TEXT,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'queued',
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "company_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "public"."Company"("slug");

-- CreateIndex
CREATE INDEX "Company_slug_idx" ON "public"."Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "Driver_company_id_whatsapp_e164_idx" ON "public"."Driver"("company_id", "whatsapp_e164");

-- CreateIndex
CREATE INDEX "Driver_createdAt_idx" ON "public"."Driver"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_company_id_external_driver_id_key" ON "public"."Driver"("company_id", "external_driver_id");

-- CreateIndex
CREATE INDEX "InboundEmail_company_id_dedup_hash_idx" ON "public"."InboundEmail"("company_id", "dedup_hash");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_company_id_message_id_key" ON "public"."InboundEmail"("company_id", "message_id");

-- CreateIndex
CREATE INDEX "Violation_company_id_status_occurred_at_idx" ON "public"."Violation"("company_id", "status", "occurred_at");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_company_id_status_sent_at_idx" ON "public"."WhatsAppMessage"("company_id", "status", "sent_at");

-- CreateIndex
CREATE INDEX "AuditLog_company_id_at_idx" ON "public"."AuditLog"("company_id", "at");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Driver" ADD CONSTRAINT "Driver_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InboundEmail" ADD CONSTRAINT "InboundEmail_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Violation" ADD CONSTRAINT "Violation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Violation" ADD CONSTRAINT "Violation_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_violation_id_fkey" FOREIGN KEY ("violation_id") REFERENCES "public"."Violation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
