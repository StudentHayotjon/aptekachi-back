-- AlterTable
ALTER TABLE "medication_schedules" ADD COLUMN     "prescriptionItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "medication_schedules_prescriptionItemId_key" ON "medication_schedules"("prescriptionItemId");

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "prescription_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
