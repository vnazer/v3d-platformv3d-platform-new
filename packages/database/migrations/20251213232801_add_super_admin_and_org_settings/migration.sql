/*
  Warnings:

  - You are about to drop the column `description` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- DropIndex
DROP INDEX "Organization_is_active_idx";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "description",
DROP COLUMN "is_active",
DROP COLUMN "settings",
DROP COLUMN "timezone",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "subscription_status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "default_currency_id" TEXT,
    "allowed_currency_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allow_bulk_updates" BOOLEAN NOT NULL DEFAULT true,
    "allow_csv_import" BOOLEAN NOT NULL DEFAULT true,
    "require_approval" BOOLEAN NOT NULL DEFAULT false,
    "crm_enabled" BOOLEAN NOT NULL DEFAULT false,
    "crm_type" TEXT,
    "crm_api_key" TEXT,
    "crm_webhook_url" TEXT,
    "crm_sync_direction" TEXT DEFAULT 'one_way',
    "custom_settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organization_id_key" ON "OrganizationSettings"("organization_id");

-- CreateIndex
CREATE INDEX "OrganizationSettings_organization_id_idx" ON "OrganizationSettings"("organization_id");

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
