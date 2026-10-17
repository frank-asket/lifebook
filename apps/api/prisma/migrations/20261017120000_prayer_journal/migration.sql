-- AlterTable
ALTER TABLE "PrayerEntry" ADD COLUMN     "answerNoteCiphertext" TEXT,
ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "titleCiphertext" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "keyVersion" SET DEFAULT 1;

-- CreateIndex
CREATE INDEX "PrayerEntry_userId_updatedAt_idx" ON "PrayerEntry"("userId", "updatedAt");

