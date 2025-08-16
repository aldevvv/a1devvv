-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "userId" TEXT,
    "adminId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "amount" INTEGER,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_operation_idx" ON "public"."AuditLog"("operation");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "public"."AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "public"."AuditLog"("timestamp");
