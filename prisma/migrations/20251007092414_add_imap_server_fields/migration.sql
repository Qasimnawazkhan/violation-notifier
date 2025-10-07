-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "imap_port" INTEGER,
ADD COLUMN     "imap_server" TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;
