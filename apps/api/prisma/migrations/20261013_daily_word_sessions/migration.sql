-- ============================================================
-- LIFEBOOK DATABASE MIGRATION
-- Milestone 3.4.1 — Persistent Daily Word Sessions
--
-- PostgreSQL / Supabase
-- Prisma ORM 5.22.0
--
-- PURPOSE:
-- 1. Create Daily Word session status enum.
-- 2. Create Daily Word step enum.
-- 3. Create DailyWordSession table.
-- 4. Create DailyWordStepProgress table.
-- 5. Create DailyWordReflection table.
-- 6. Add unique constraints and indexes.
-- 7. Add foreign key relationships.
--
-- IMPORTANT:
-- This is an additive migration.
-- No existing tables or records are deleted.
-- ============================================================


-- ============================================================
-- 1. CREATE ENUMS
-- ============================================================

CREATE TYPE "DailyWordSessionStatus" AS ENUM (
    'IN_PROGRESS',
    'COMPLETED'
);

CREATE TYPE "DailyWordStep" AS ENUM (
    'UNDERSTAND',
    'MEDITATE',
    'REFLECT',
    'PRAY',
    'LIVE'
);


-- ============================================================
-- 2. CREATE DAILY WORD SESSION TABLE
-- ============================================================

CREATE TABLE "DailyWordSession" (

    "id" TEXT NOT NULL,

    "userId" TEXT NOT NULL,

    "journeyDate" DATE NOT NULL,

    "passageKey" TEXT NOT NULL,

    "status" "DailyWordSessionStatus"
        NOT NULL DEFAULT 'IN_PROGRESS',

    "startedAt" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "completedAt" TIMESTAMP(3),

    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWordSession_pkey"
        PRIMARY KEY ("id")
);


-- ============================================================
-- 3. CREATE DAILY WORD STEP PROGRESS TABLE
-- ============================================================

CREATE TABLE "DailyWordStepProgress" (

    "id" TEXT NOT NULL,

    "sessionId" TEXT NOT NULL,

    "step" "DailyWordStep" NOT NULL,

    "completedAt" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyWordStepProgress_pkey"
        PRIMARY KEY ("id")
);


-- ============================================================
-- 4. CREATE DAILY WORD REFLECTION TABLE
-- ============================================================

CREATE TABLE "DailyWordReflection" (

    "id" TEXT NOT NULL,

    "sessionId" TEXT NOT NULL,

    "content" TEXT NOT NULL,

    "createdAt" TIMESTAMP(3)
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWordReflection_pkey"
        PRIMARY KEY ("id")
);


-- ============================================================
-- 5. CREATE UNIQUE INDEXES
-- ============================================================

-- Prevent multiple Daily Word sessions for the same
-- user on the same calendar date.

CREATE UNIQUE INDEX
    "DailyWordSession_userId_journeyDate_key"
ON "DailyWordSession"(
    "userId",
    "journeyDate"
);


-- Prevent duplicate completion records for the
-- same step within the same session.

CREATE UNIQUE INDEX
    "DailyWordStepProgress_sessionId_step_key"
ON "DailyWordStepProgress"(
    "sessionId",
    "step"
);


-- Allow only one reflection per Daily Word session.

CREATE UNIQUE INDEX
    "DailyWordReflection_sessionId_key"
ON "DailyWordReflection"(
    "sessionId"
);


-- ============================================================
-- 6. CREATE PERFORMANCE INDEXES
-- ============================================================

-- Optimize session history and status filtering.

CREATE INDEX
    "DailyWordSession_userId_status_idx"
ON "DailyWordSession"(
    "userId",
    "status"
);


-- ============================================================
-- 7. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================

-- Each Daily Word session belongs to a LifeBook user.
-- Deleting a user removes their Daily Word sessions.

ALTER TABLE "DailyWordSession"
ADD CONSTRAINT "DailyWordSession_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- Each step progress record belongs to a Daily Word session.
-- Deleting a session removes its step progress records.

ALTER TABLE "DailyWordStepProgress"
ADD CONSTRAINT "DailyWordStepProgress_sessionId_fkey"
FOREIGN KEY ("sessionId")
REFERENCES "DailyWordSession"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- Each reflection belongs to a Daily Word session.
-- Deleting a session removes its reflection.

ALTER TABLE "DailyWordReflection"
ADD CONSTRAINT "DailyWordReflection_sessionId_fkey"
FOREIGN KEY ("sessionId")
REFERENCES "DailyWordSession"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- ============================================================
-- END OF MIGRATION
-- Milestone 3.4.1 — Persistent Daily Word Sessions
-- ============================================================