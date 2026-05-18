-- DropIndex
DROP INDEX "InfluencerProfile_handle_key";

-- AlterTable
ALTER TABLE "InfluencerProfile" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "homepageUrl" TEXT,
ADD COLUMN     "isFree" BOOLEAN,
ADD COLUMN     "lastScrapedAt" TIMESTAMP(3),
ADD COLUMN     "likes" INTEGER,
ADD COLUMN     "nick" TEXT,
ADD COLUMN     "postedImages" INTEGER,
ADD COLUMN     "postedVideos" INTEGER,
ADD COLUMN     "props" JSONB,
ADD COLUMN     "sampleMedia" JSONB,
ADD COLUMN     "socialMedia" JSONB,
ADD COLUMN     "sourceName" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "subscriptionFee" DECIMAL(10,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "niche" DROP NOT NULL,
ALTER COLUMN "followerCount" DROP NOT NULL,
ALTER COLUMN "engagementRate" DROP NOT NULL,
ALTER COLUMN "platforms" DROP NOT NULL,
ALTER COLUMN "locationCountry" DROP NOT NULL,
ALTER COLUMN "locationRegion" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "InfluencerProfile_handle_idx" ON "InfluencerProfile"("handle");

-- CreateIndex
CREATE INDEX "InfluencerProfile_homepageUrl_idx" ON "InfluencerProfile"("homepageUrl");

-- CreateIndex
CREATE INDEX "InfluencerProfile_sourceName_idx" ON "InfluencerProfile"("sourceName");

-- CreateIndex
CREATE INDEX "InfluencerProfile_deletedAt_idx" ON "InfluencerProfile"("deletedAt");
