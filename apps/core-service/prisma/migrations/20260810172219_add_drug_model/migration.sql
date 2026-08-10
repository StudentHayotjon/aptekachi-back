-- CreateEnum
CREATE TYPE "DosageForm" AS ENUM ('TABLETKA', 'KAPSULA', 'SIROP', 'INYEKSIYA', 'MALHAM', 'TOMCHI', 'SPREY', 'BOSHQA');

-- CreateTable
CREATE TABLE "drugs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internationalName" TEXT,
    "manufacturer" TEXT NOT NULL,
    "country" TEXT,
    "dosageForm" "DosageForm" NOT NULL DEFAULT 'BOSHQA',
    "dosage" TEXT,
    "packageSize" TEXT,
    "barcode" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drugs_barcode_key" ON "drugs"("barcode");

-- CreateIndex
CREATE INDEX "drugs_name_idx" ON "drugs"("name");
