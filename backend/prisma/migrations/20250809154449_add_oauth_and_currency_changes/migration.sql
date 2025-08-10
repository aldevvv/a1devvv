/*
  Warnings:

  - You are about to drop the column `balanceCents` on the `BalanceAccount` table. All the data in the column will be lost.
  - You are about to drop the column `amountCents` on the `BalanceLedger` table. All the data in the column will be lost.
  - You are about to drop the column `grossCents` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[githubId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amountIDR` to the `BalanceLedger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grossIDR` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'EXPIRE';

-- AlterTable
ALTER TABLE "public"."BalanceAccount" DROP COLUMN "balanceCents",
ADD COLUMN     "balanceIDR" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."BalanceLedger" DROP COLUMN "amountCents",
ADD COLUMN     "amountIDR" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "grossCents",
ADD COLUMN     "grossIDR" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "githubId" TEXT,
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "public"."User"("githubId");
