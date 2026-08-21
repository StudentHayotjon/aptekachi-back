import { prisma } from "../src/config/prisma.client";
prisma.user.count().then((n) => { console.log("OK count=" + n); process.exit(0); }).catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
