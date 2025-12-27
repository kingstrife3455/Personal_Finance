-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "mainCategoryId" TEXT;

-- CreateTable
CREATE TABLE "MainCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MainCategory_name_key" ON "MainCategory"("name");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "MainCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
