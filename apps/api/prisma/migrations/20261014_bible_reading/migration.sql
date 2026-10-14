-- M3.6 additive migration: creates reading history, enrollments and completion records.
-- Do not re-run manually if Prisma has already applied this migration.
CREATE TABLE "BibleReadingHistory" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "locale" TEXT NOT NULL,
 "chapterId" TEXT NOT NULL, "verse" INTEGER,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "BibleReadingHistory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BibleReadingHistory_userId_locale_chapterId_key" ON "BibleReadingHistory"("userId","locale","chapterId");
CREATE INDEX "BibleReadingHistory_userId_updatedAt_idx" ON "BibleReadingHistory"("userId","updatedAt");
ALTER TABLE "BibleReadingHistory" ADD CONSTRAINT "BibleReadingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BibleReadingPlanEnrollment" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "planId" TEXT NOT NULL,
 "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "BibleReadingPlanEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BibleReadingPlanEnrollment_userId_planId_key" ON "BibleReadingPlanEnrollment"("userId","planId");
CREATE INDEX "BibleReadingPlanEnrollment_userId_idx" ON "BibleReadingPlanEnrollment"("userId");
ALTER TABLE "BibleReadingPlanEnrollment" ADD CONSTRAINT "BibleReadingPlanEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BibleReadingPlanDayCompletion" (
 "id" TEXT NOT NULL, "enrollmentId" TEXT NOT NULL, "day" INTEGER NOT NULL,
 "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "BibleReadingPlanDayCompletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BibleReadingPlanDayCompletion_enrollmentId_day_key" ON "BibleReadingPlanDayCompletion"("enrollmentId","day");
ALTER TABLE "BibleReadingPlanDayCompletion" ADD CONSTRAINT "BibleReadingPlanDayCompletion_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "BibleReadingPlanEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
