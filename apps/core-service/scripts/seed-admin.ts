import { prisma } from "../src/config/prisma.client";
import { hashPassword } from "../src/utils/password.util";

async function main() {
    const phone = `+99878${Math.floor(1000000 + Math.random() * 8999999)}`;
    const passwordHash = await hashPassword("AdminPass123");
    const admin = await prisma.user.create({
        data: { phone, passwordHash, fullName: "Test Admin", role: "ADMINISTRATOR" }
    });
    console.log(`ADMIN_PHONE=${phone}`);
    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error("XATO:", error);
    await prisma.$disconnect();
    process.exit(1);
});
