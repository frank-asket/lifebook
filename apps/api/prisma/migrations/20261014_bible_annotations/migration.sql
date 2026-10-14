-- Additive migration. Does not modify existing user content.
CREATE TABLE "BibleAnnotation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "passageId" TEXT NOT NULL,
  "bookmarked" BOOLEAN NOT NULL DEFAULT false,
  "highlight" TEXT,
  "noteCiphertext" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BibleAnnotation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BibleAnnotation_userId_locale_passageId_key" ON "BibleAnnotation"("userId", "locale", "passageId");
CREATE INDEX "BibleAnnotation_userId_updatedAt_idx" ON "BibleAnnotation"("userId", "updatedAt");
ALTER TABLE "BibleAnnotation" ADD CONSTRAINT "BibleAnnotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
