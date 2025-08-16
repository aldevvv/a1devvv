-- CreateEnum
CREATE TYPE "public"."ContactCategory" AS ENUM ('GENERAL', 'TECHNICAL', 'BILLING', 'FEATURE', 'BUG', 'FEEDBACK', 'PARTNERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "public"."ContactPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "public"."ContactCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "public"."ContactStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."ContactPriority" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactSubmission_status_idx" ON "public"."ContactSubmission"("status");

-- CreateIndex
CREATE INDEX "ContactSubmission_category_idx" ON "public"."ContactSubmission"("category");

-- CreateIndex
CREATE INDEX "ContactSubmission_priority_idx" ON "public"."ContactSubmission"("priority");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "public"."ContactSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_email_idx" ON "public"."ContactSubmission"("email");
