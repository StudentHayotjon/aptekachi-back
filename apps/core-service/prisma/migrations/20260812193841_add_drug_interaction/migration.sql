-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateTable
CREATE TABLE "drug_interactions" (
    "id" TEXT NOT NULL,
    "drugAId" TEXT NOT NULL,
    "drugBId" TEXT NOT NULL,
    "severity" "InteractionSeverity" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drug_interactions_drugAId_idx" ON "drug_interactions"("drugAId");

-- CreateIndex
CREATE INDEX "drug_interactions_drugBId_idx" ON "drug_interactions"("drugBId");

-- CreateIndex
CREATE UNIQUE INDEX "drug_interactions_drugAId_drugBId_key" ON "drug_interactions"("drugAId", "drugBId");

-- AddForeignKey
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_drugAId_fkey" FOREIGN KEY ("drugAId") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_drugBId_fkey" FOREIGN KEY ("drugBId") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
