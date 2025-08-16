/*
  Warnings:

  - The values [SETTLEMENT] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('DIGITAL', 'SERVICE');

-- CreateEnum
CREATE TYPE "public"."FulfillmentMode" AS ENUM ('INSTANT', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."ProductKind" AS ENUM ('KEYS', 'SOURCE_CODE', 'ACCESS_LINK');

-- CreateEnum
CREATE TYPE "public"."StockType" AS ENUM ('UNLIMITED', 'STOCK_BASED');

-- CreateEnum
CREATE TYPE "public"."PromoKind" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "public"."PromoScope" AS ENUM ('ORDER', 'CATEGORY', 'PRODUCT');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentStatus_new" AS ENUM ('PENDING', 'SETTLED', 'CANCEL', 'FAIL', 'EXPIRE');
ALTER TABLE "public"."Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Payment" ALTER COLUMN "status" TYPE "public"."PaymentStatus_new" USING ("status"::text::"public"."PaymentStatus_new");
ALTER TYPE "public"."PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "public"."PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "public"."Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "provider" SET DEFAULT 'xendit';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailChangeToken" TEXT,
ADD COLUMN     "emailChangeTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "newEmail" TEXT,
ADD COLUMN     "profileImage" TEXT;

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "priceIDR" INTEGER NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "public"."ProductType" NOT NULL DEFAULT 'DIGITAL',
    "fulfillment" "public"."FulfillmentMode" NOT NULL DEFAULT 'INSTANT',
    "productKind" "public"."ProductKind" NOT NULL DEFAULT 'KEYS',
    "stockType" "public"."StockType" NOT NULL DEFAULT 'STOCK_BASED',
    "deliveryCfg" JSONB,
    "userId" TEXT,
    "categoryId" TEXT,
    "salePriceIDR" INTEGER,
    "salePercent" INTEGER,
    "saleStartAt" TIMESTAMP(3),
    "saleEndAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "public"."PromoKind" NOT NULL,
    "value" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "minSubtotalIDR" INTEGER,
    "maxDiscountIDR" INTEGER,
    "usageLimit" INTEGER,
    "perUserLimit" INTEGER,
    "appliesTo" "public"."PromoScope" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromoCodeCategory" (
    "promoCodeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "PromoCodeCategory_pkey" PRIMARY KEY ("promoCodeId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."PromoCodeProduct" (
    "promoCodeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PromoCodeProduct_pkey" PRIMARY KEY ("promoCodeId","productId")
);

-- CreateTable
CREATE TABLE "public"."PromoRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit" JSONB,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalIDR" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "metadata" JSONB,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductDelivery" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemValue" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug");

-- CreateIndex
CREATE INDEX "Product_productKind_idx" ON "public"."Product"("productKind");

-- CreateIndex
CREATE INDEX "Product_stockType_idx" ON "public"."Product"("stockType");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "public"."PromoCode"("code");

-- CreateIndex
CREATE INDEX "Wishlist_userId_idx" ON "public"."Wishlist"("userId");

-- CreateIndex
CREATE INDEX "Wishlist_productId_idx" ON "public"."Wishlist"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON "public"."Wishlist"("userId", "productId");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "public"."Cart"("userId");

-- CreateIndex
CREATE INDEX "Cart_productId_idx" ON "public"."Cart"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_productId_key" ON "public"."Cart"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "public"."Order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentId_key" ON "public"."Order"("paymentId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "public"."Order"("userId");

-- CreateIndex
CREATE INDEX "Order_orderId_idx" ON "public"."Order"("orderId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "ProductDelivery_productId_idx" ON "public"."ProductDelivery"("productId");

-- CreateIndex
CREATE INDEX "ProductDelivery_orderId_idx" ON "public"."ProductDelivery"("orderId");

-- CreateIndex
CREATE INDEX "ProductDelivery_userId_idx" ON "public"."ProductDelivery"("userId");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCodeCategory" ADD CONSTRAINT "PromoCodeCategory_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "public"."PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCodeCategory" ADD CONSTRAINT "PromoCodeCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCodeProduct" ADD CONSTRAINT "PromoCodeProduct_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "public"."PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCodeProduct" ADD CONSTRAINT "PromoCodeProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "public"."PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductDelivery" ADD CONSTRAINT "ProductDelivery_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
