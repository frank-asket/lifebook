-- AlterTable
ALTER TABLE "MinistryVerification" ADD COLUMN     "churchName" TEXT,
ADD COLUMN     "codeOfConductSignedAt" TIMESTAMP(3),
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ministryRole" TEXT,
ADD COLUMN     "referenceContactCiphertext" TEXT,
ADD COLUMN     "referenceName" TEXT,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT,
ADD COLUMN     "trainingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "trainingCourse" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "verifiedById" TEXT;

-- CreateTable
CREATE TABLE "PastorProfile" (
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "languages" TEXT[],
    "acceptingRequests" BOOLEAN NOT NULL DEFAULT false,
    "maxOpenRequests" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastorProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PastorProfile_slug_key" ON "PastorProfile"("slug");

-- AddForeignKey
ALTER TABLE "PastorProfile" ADD CONSTRAINT "PastorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

