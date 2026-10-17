-- CreateEnum
CREATE TYPE "CareReportStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "CareReport" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reporterRole" TEXT NOT NULL,
    "subjectPastorId" TEXT,
    "category" TEXT NOT NULL,
    "detailsCiphertext" TEXT NOT NULL,
    "transcriptCiphertext" TEXT,
    "status" "CareReportStatus" NOT NULL DEFAULT 'OPEN',
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "handledById" TEXT,
    "resolutionCiphertext" TEXT,
    "deleteAfter" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "pastorUserId" TEXT,
    "reportId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeguardingAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareReport_status_createdAt_idx" ON "CareReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CareReport_reporterId_createdAt_idx" ON "CareReport"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "SafeguardingAction_createdAt_idx" ON "SafeguardingAction"("createdAt");

-- AddForeignKey
ALTER TABLE "CareReport" ADD CONSTRAINT "CareReport_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CareRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

