-- Additive only. Review history and confirm a recoverable backup before production deployment.
CREATE TABLE "LearningLessonCompletion" (
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningLessonCompletion_pkey" PRIMARY KEY ("enrollmentId", "lessonId")
);
CREATE INDEX "LearningLessonCompletion_lessonId_idx" ON "LearningLessonCompletion"("lessonId");
ALTER TABLE "LearningLessonCompletion" ADD CONSTRAINT "LearningLessonCompletion_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningLessonCompletion" ADD CONSTRAINT "LearningLessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
