-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 7500,
    "progressMessage" TEXT NOT NULL DEFAULT 'Add {amount} more for free shipping!',
    "successMessage" TEXT NOT NULL DEFAULT 'You''ve unlocked free shipping!',
    "barColor" TEXT NOT NULL DEFAULT '#1D9E75',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
