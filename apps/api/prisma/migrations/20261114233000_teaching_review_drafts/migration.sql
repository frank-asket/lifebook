-- CreateTable
CREATE TABLE "TeachingReviewDraft" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "speaker" TEXT NOT NULL DEFAULT '',
    "attribution" TEXT NOT NULL DEFAULT '',
    "rightsReference" TEXT NOT NULL DEFAULT '',
    "reviewNotes" TEXT NOT NULL DEFAULT '',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "creatorId" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingReviewDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeachingReviewDraft_sourceUrl_key" ON "TeachingReviewDraft"("sourceUrl");

-- CreateIndex
CREATE INDEX "TeachingReviewDraft_updatedAt_id_idx" ON "TeachingReviewDraft"("updatedAt", "id");

-- API uses the database owner; public Supabase API roles receive no row policies.
ALTER TABLE "TeachingReviewDraft" ENABLE ROW LEVEL SECURITY;
