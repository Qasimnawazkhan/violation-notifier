/*
  Warnings:

  - A unique constraint covering the columns `[contact_email]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Company" 
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "imap_password" TEXT,
ADD COLUMN "imap_user" TEXT,
ADD COLUMN "provider" TEXT,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Company_contact_email_key" ON "public"."Company"("contact_email");

-- CreateIndex
CREATE INDEX "Company_contact_email_idx" ON "public"."Company"("contact_email");
