-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shopierProductId" TEXT,
ADD COLUMN     "shopierUrl" TEXT;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "transferDescriptionTemplate" TEXT NOT NULL DEFAULT 'Sipariş {orderNumber}',
    "reservationWindowHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopierProductId_key" ON "Product"("shopierProductId");

