-- Existing sermons remain unapproved until a moderator reviews publication rights.
-- Production deployment requires history review and a recoverable backup.
ALTER TABLE "Sermon"
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'audio',
  ADD COLUMN "speaker" TEXT,
  ADD COLUMN "attribution" TEXT,
  ADD COLUMN "transcript" TEXT,
  ADD COLUMN "rightsReference" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT;
