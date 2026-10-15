-- Reconcile previously unrecorded meditation schema.
-- Existing databases: mark applied only after exact schema verification and a recoverable backup.
-- Empty databases: this migration creates the meditation tables normally.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- CreateTable
CREATE TABLE "Meditation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scriptureReference" TEXT NOT NULL,
    "scriptureText" TEXT,
    "translation" TEXT,
    "explanation" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "guidedPrayer" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "publishDate" DATE,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meditation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeditationReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeditationCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeditationBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meditation_slug_key" ON "Meditation"("slug");

-- CreateIndex
CREATE INDEX "Meditation_locale_isPublished_publishDate_idx" ON "Meditation"("locale", "isPublished", "publishDate");

-- CreateIndex
CREATE INDEX "MeditationReflection_userId_idx" ON "MeditationReflection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeditationReflection_userId_meditationId_key" ON "MeditationReflection"("userId", "meditationId");

-- CreateIndex
CREATE INDEX "MeditationCompletion_userId_idx" ON "MeditationCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeditationCompletion_userId_meditationId_key" ON "MeditationCompletion"("userId", "meditationId");

-- CreateIndex
CREATE INDEX "MeditationBookmark_userId_idx" ON "MeditationBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeditationBookmark_userId_meditationId_key" ON "MeditationBookmark"("userId", "meditationId");

-- AddForeignKey
ALTER TABLE "MeditationReflection" ADD CONSTRAINT "MeditationReflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationReflection" ADD CONSTRAINT "MeditationReflection_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "Meditation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationCompletion" ADD CONSTRAINT "MeditationCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationCompletion" ADD CONSTRAINT "MeditationCompletion_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "Meditation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationBookmark" ADD CONSTRAINT "MeditationBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationBookmark" ADD CONSTRAINT "MeditationBookmark_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "Meditation"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
