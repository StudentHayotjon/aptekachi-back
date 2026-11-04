// Bir martalik: test uchun ADMIN va BEMOR akkauntlarini yaratadi/yangilaydi.
// Ishga tushirish: node --use-system-ca scripts/seed-test-accounts.mjs
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const accounts = [
  { phone: "+998900000001", fullName: "Test Admin", role: "ADMINISTRATOR", password: "Admin12345" },
  { phone: "+998900000002", fullName: "Test Bemor", role: "BEMOR", password: "Bemor12345" },
];

async function main() {
  for (const a of accounts) {
    const passwordHash = await bcrypt.hash(a.password, 12);
    const user = await prisma.user.upsert({
      where: { phone: a.phone },
      update: { passwordHash, fullName: a.fullName, role: a.role, isActive: true, blockedUntil: null, blockReason: null },
      create: { phone: a.phone, passwordHash, fullName: a.fullName, role: a.role },
    });
    console.log(`OK  ${a.role.padEnd(13)} ${a.phone}  pw=${a.password}  id=${user.id}`);
  }
}

main()
  .catch((e) => { console.error("SEED ERROR:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
