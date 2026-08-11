-- CreateEnum
CREATE TYPE "PrescriptionSource" AS ENUM ('OCR', 'DMED_QR');

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "dmedUuid" TEXT,
ADD COLUMN     "source" "PrescriptionSource" NOT NULL DEFAULT 'OCR',
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_dmedUuid_key" ON "prescriptions"("dmedUuid");
