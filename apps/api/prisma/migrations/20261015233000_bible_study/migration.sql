-- Additive Bible Study schema. No existing data is modified; no content is seeded.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- CreateEnum
CREATE TYPE "StudyMethod" AS ENUM ('THEMATIC', 'CHARACTER', 'BOOK', 'SYSTEMATIC');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "StudySeries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "method" "StudyMethod" NOT NULL,
    "status" "StudyStatus" NOT NULL DEFAULT 'DRAFT',
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyLesson" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "scriptureReference" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "historicalContext" TEXT,
    "exegesis" TEXT NOT NULL,
    "theology" TEXT,
    "reflectionQuestions" JSONB NOT NULL,
    "guidedPrayer" TEXT,
    "application" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyLessonCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyLessonCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudySeries_method_status_locale_idx" ON "StudySeries"("method", "status", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "StudySeries_slug_locale_key" ON "StudySeries"("slug", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "StudyLesson_seriesId_position_key" ON "StudyLesson"("seriesId", "position");

-- CreateIndex
CREATE INDEX "StudyEnrollment_userId_idx" ON "StudyEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyEnrollment_userId_seriesId_key" ON "StudyEnrollment"("userId", "seriesId");

-- CreateIndex
CREATE INDEX "StudyLessonCompletion_userId_idx" ON "StudyLessonCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyLessonCompletion_userId_lessonId_key" ON "StudyLessonCompletion"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "StudyLesson" ADD CONSTRAINT "StudyLesson_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "StudySeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyEnrollment" ADD CONSTRAINT "StudyEnrollment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "StudySeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyLessonCompletion" ADD CONSTRAINT "StudyLessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "StudyLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
