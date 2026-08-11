import "dotenv/config";

const required = ["DATABASE_URL", "JWT_ACCESS_SECRET"] as const;

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`${key} muhit o'zgaruvchilarida topilmadi!`);
    }
}

export const env = {
    port: process.env.PORT ?? 3001,
    databaseUrl: process.env.DATABASE_URL!,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET!,
        accessTtl: "15m",
        refreshTtlDays: 30
    },
    passwordReset: {
        codeTtlMinutes: 10
    },
    ocrServiceUrl: process.env.OCR_SERVICE_URL ?? "http://localhost:3000",
    dmed: {
        mode: process.env.DMED_MODE ?? "mock" // "mock" | "real" — real API kalitlari kelganda "real"ga o'zgartiriladi
    }
} as const;
