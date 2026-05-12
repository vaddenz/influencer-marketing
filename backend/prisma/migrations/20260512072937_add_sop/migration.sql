-- CreateEnum
CREATE TYPE "SopStatus" AS ENUM ('generated', 'active', 'completed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'sop_pushed';
ALTER TYPE "NotificationType" ADD VALUE 'sop_reminder';
ALTER TYPE "NotificationType" ADD VALUE 'sop_delay_requested';

-- CreateTable
CREATE TABLE "Sop" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishDate" DATE NOT NULL,
    "targetMarket" TEXT NOT NULL,
    "influencerType" TEXT NOT NULL,
    "sellingPoints" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "status" "SopStatus" NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Sop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SopBinding" (
    "id" TEXT NOT NULL,
    "sopId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sopPushedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SopBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SopReminderLog" (
    "id" TEXT NOT NULL,
    "sopBindingId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "reminderType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SopReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sop_campaignId_key" ON "Sop"("campaignId");

-- CreateIndex
CREATE INDEX "SopBinding_sopId_idx" ON "SopBinding"("sopId");

-- CreateIndex
CREATE UNIQUE INDEX "SopBinding_invitationId_key" ON "SopBinding"("invitationId");

-- CreateIndex
CREATE INDEX "SopReminderLog_sopBindingId_idx" ON "SopReminderLog"("sopBindingId");

-- CreateIndex
CREATE UNIQUE INDEX "SopReminderLog_sopBindingId_stepIndex_reminderType_key" ON "SopReminderLog"("sopBindingId", "stepIndex", "reminderType");

-- AddForeignKey
ALTER TABLE "Sop" ADD CONSTRAINT "Sop_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopBinding" ADD CONSTRAINT "SopBinding_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "Sop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopBinding" ADD CONSTRAINT "SopBinding_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SopReminderLog" ADD CONSTRAINT "SopReminderLog_sopBindingId_fkey" FOREIGN KEY ("sopBindingId") REFERENCES "SopBinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
