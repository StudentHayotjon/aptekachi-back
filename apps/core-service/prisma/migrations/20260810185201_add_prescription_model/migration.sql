-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "retseptId" TEXT,
    "himoyaKodi" TEXT,
    "bemorFish" TEXT,
    "bemorYosh" TEXT,
    "shifokorFish" TEXT,
    "drugId" TEXT,
    "drugNameRaw" TEXT NOT NULL,
    "releaseForm" TEXT,
    "usageMethod" TEXT,
    "dailyDoseCount" TEXT,
    "duration" TEXT,
    "regimen" TEXT,
    "totalQuantity" TEXT,
    "note" TEXT,
    "validUntil" TEXT,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "prescriptions_doctorId_idx" ON "prescriptions"("doctorId");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- CreateIndex
CREATE INDEX "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "drugs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
