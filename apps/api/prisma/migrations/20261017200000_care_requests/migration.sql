-- CreateEnum
CREATE TYPE "CareRequestStatus" AS ENUM ('OPEN', 'CLAIMED', 'CLOSED');

-- CreateTable
CREATE TABLE "CareRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "pastorId" TEXT,
    "topic" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "contactPreference" TEXT NOT NULL,
    "nameCiphertext" TEXT,
    "phoneCiphertext" TEXT,
    "messageCiphertext" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "CareRequestStatus" NOT NULL DEFAULT 'OPEN',
    "claimedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "deleteAfter" TIMESTAMP(3),
    "memberReadAt" TIMESTAMP(3),
    "pastorReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareRequest_status_language_createdAt_idx" ON "CareRequest"("status", "language", "createdAt");

-- CreateIndex
CREATE INDEX "CareRequest_memberId_createdAt_idx" ON "CareRequest"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "CareRequest_pastorId_status_idx" ON "CareRequest"("pastorId", "status");

-- CreateIndex
CREATE INDEX "CareMessage_requestId_createdAt_idx" ON "CareMessage"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "CareRequest" ADD CONSTRAINT "CareRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareRequest" ADD CONSTRAINT "CareRequest_pastorId_fkey" FOREIGN KEY ("pastorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareMessage" ADD CONSTRAINT "CareMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CareRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

