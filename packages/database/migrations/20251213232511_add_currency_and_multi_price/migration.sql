/*
  Warnings:

  - You are about to drop the column `currency` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Unit` table. All the data in the column will be lost.
  - The `status` column on the `Unit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `currency_id` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'PARKING', 'STORAGE');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "currency",
DROP COLUMN "quantity",
ADD COLUMN     "cost_price" DECIMAL(18,2),
ADD COLUMN     "currency_id" TEXT NOT NULL,
ADD COLUMN     "discount_percentage" DECIMAL(5,2),
ADD COLUMN     "features" JSONB DEFAULT '{}',
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "list_price" DECIMAL(18,2),
ADD COLUMN     "reserved_by_id" TEXT,
ADD COLUMN     "reserved_until" TIMESTAMP(3),
ADD COLUMN     "sale_price" DECIMAL(18,2),
ADD COLUMN     "sold_at" TIMESTAMP(3),
ADD COLUMN     "sold_to_id" TEXT,
ADD COLUMN     "unit_type" "UnitType" NOT NULL DEFAULT 'APARTMENT',
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "bathrooms" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimal_places" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "exchange_rate_to_usd" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "Currency_code_idx" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "Currency_is_active_idx" ON "Currency"("is_active");

-- CreateIndex
CREATE INDEX "Unit_currency_id_idx" ON "Unit"("currency_id");

-- CreateIndex
CREATE INDEX "Unit_status_idx" ON "Unit"("status");

-- CreateIndex
CREATE INDEX "Unit_unit_type_idx" ON "Unit"("unit_type");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_reserved_by_id_fkey" FOREIGN KEY ("reserved_by_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_sold_to_id_fkey" FOREIGN KEY ("sold_to_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
