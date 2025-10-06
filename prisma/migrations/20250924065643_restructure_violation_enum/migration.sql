/*
  Warnings:

  - The `violation_type` column on the `Violation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[company_id,driver_id,violation_type,source_ref]` on the table `Violation` will be added. If there are existing duplicate values, this will fail.
  - Made the column `driver_id` on table `Violation` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ViolationType" AS ENUM ('OverSpeeding', 'SeatBelt', 'FollowingDistance', 'PhoneUse', 'SignalBreak', 'DocumentsMissing', 'Other');

-- DropForeignKey
ALTER TABLE "public"."Violation" DROP CONSTRAINT "Violation_driver_id_fkey";

-- AlterTable
ALTER TABLE "public"."Violation" ADD COLUMN     "raw_excerpt" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "source_ref" TEXT,
ALTER COLUMN "driver_id" SET NOT NULL,
DROP COLUMN "violation_type",
ADD COLUMN     "violation_type" "public"."ViolationType" NOT NULL DEFAULT 'Other';

-- CreateIndex
CREATE INDEX "Violation_company_id_idx" ON "public"."Violation"("company_id");

-- CreateIndex
CREATE INDEX "Violation_driver_id_idx" ON "public"."Violation"("driver_id");

-- CreateIndex
CREATE INDEX "Violation_company_id_driver_id_idx" ON "public"."Violation"("company_id", "driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "Violation_company_id_driver_id_violation_type_source_ref_key" ON "public"."Violation"("company_id", "driver_id", "violation_type", "source_ref");

-- AddForeignKey
ALTER TABLE "public"."Violation" ADD CONSTRAINT "Violation_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
