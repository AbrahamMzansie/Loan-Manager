-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invoicesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "loansEnabled" BOOLEAN NOT NULL DEFAULT true;
