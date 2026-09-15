-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Loan_shareToken_key" ON "Loan"("shareToken");
