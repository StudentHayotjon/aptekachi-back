-- CreateEnum
CREATE TYPE "DoseStatus" AS ENUM ('PENDING', 'TAKEN', 'SKIPPED');

-- CreateTable
CREATE TABLE "medication_schedules" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "drugId" TEXT,
    "drugName" TEXT NOT NULL,
    "dosageNote" TEXT,
    "scheduleTimes" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dose_events" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "DoseStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dose_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_schedules_patientId_idx" ON "medication_schedules"("patientId");

-- CreateIndex
CREATE INDEX "dose_events_status_scheduledAt_idx" ON "dose_events"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "dose_events_scheduleId_scheduledAt_key" ON "dose_events"("scheduleId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "drugs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dose_events" ADD CONSTRAINT "dose_events_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "medication_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
