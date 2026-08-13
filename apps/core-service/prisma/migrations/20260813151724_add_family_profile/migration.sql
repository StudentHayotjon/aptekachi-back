-- AlterTable
ALTER TABLE "medication_schedules" ADD COLUMN     "familyMemberId" TEXT,
ALTER COLUMN "patientId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_links" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_members_guardianId_idx" ON "family_members"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "care_links_viewerId_subjectId_key" ON "care_links"("viewerId", "subjectId");

-- CreateIndex
CREATE INDEX "medication_schedules_familyMemberId_idx" ON "medication_schedules"("familyMemberId");

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_links" ADD CONSTRAINT "care_links_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_links" ADD CONSTRAINT "care_links_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
