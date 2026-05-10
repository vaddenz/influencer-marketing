/*
  Warnings:

  - You are about to drop the column `invitationId` on the `Deliverable` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Deliverable" DROP CONSTRAINT "Deliverable_invitationId_fkey";

-- AlterTable
ALTER TABLE "Deliverable" DROP COLUMN "invitationId";
