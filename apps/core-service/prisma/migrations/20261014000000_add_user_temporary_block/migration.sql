-- Foydalanuvchini vaqtincha bloklash: blockedUntil o'tgach avtomatik ochiladi; blockReason — admin izohi
ALTER TABLE "users" ADD COLUMN "blockedUntil" TIMESTAMP(3),
ADD COLUMN "blockReason" TEXT;
