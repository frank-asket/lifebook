-- AlterTable
ALTER TABLE "PrayerEntry" ADD COLUMN     "meditationAt" TIMESTAMP(3),
ADD COLUMN     "meditationCiphertext" TEXT;

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsage_userId_feature_createdAt_idx" ON "AiUsage"("userId", "feature", "createdAt");

