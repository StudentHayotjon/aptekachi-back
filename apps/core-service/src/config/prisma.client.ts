import { Prisma, PrismaClient } from "@prisma/client";

// Ulanish darajasidagi vaqtinchalik xatolar (Supabase pooler'i band yoki ulanishni uzib qo'ygan):
//   P1001 — serverga ulanib bo'lmadi, P2024 — pool'dan ulanish kutib vaqt tugadi.
//   Bu ikkisida so'rov bazaga umuman yetib bormagan, shuning uchun istalgan amalni qayta urinish xavfsiz.
//   P1017 — server ulanishni yopdi; so'rov bajarilgan bo'lishi mumkin, shu sababli faqat o'qish amallari qayta uriniladi.
const NOT_EXECUTED_CODES = new Set(["P1001", "P2024"]);
const CONNECTION_LOST_CODE = "P1017";
const READ_OPERATIONS = new Set([
    "findUnique",
    "findUniqueOrThrow",
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
    "$queryRaw",
    "$queryRawUnsafe"
]);
const RETRY_DELAYS_MS = [300, 1000];

const errorCode = (error: unknown): string | undefined => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
    if (error instanceof Prisma.PrismaClientInitializationError) return error.errorCode;
    return undefined;
};

const isRetryable = (error: unknown, operation: string): boolean => {
    const code = errorCode(error);
    if (!code) return false;
    return NOT_EXECUTED_CODES.has(code) || (code === CONNECTION_LOST_CODE && READ_OPERATIONS.has(operation));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createClient = () =>
    new PrismaClient().$extends({
        query: {
            async $allOperations({ operation, args, query }) {
                for (let attempt = 0; ; attempt++) {
                    try {
                        return await query(args);
                    } catch (error) {
                        if (attempt >= RETRY_DELAYS_MS.length || !isRetryable(error, operation)) throw error;
                        console.warn(`[prisma] ${operation}: ${errorCode(error)} — ${RETRY_DELAYS_MS[attempt]}ms dan so'ng qayta urinish`);
                        await sleep(RETRY_DELAYS_MS[attempt]);
                    }
                }
            }
        }
    });

type ExtendedPrismaClient = ReturnType<typeof createClient>;

// `tsx watch` qayta yuklaganda yangi client (va yangi ulanishlar pool'i) yaratilmasligi uchun
const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient };

export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Jarayon to'xtaganda ulanishlar pooler'ga darhol qaytariladi — aks holda Supabase ularni
// bir muddat band deb hisoblaydi va yangi ishga tushgan server "max clients" xatosini oladi
let shuttingDown = false;
const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
        await prisma.$disconnect();
    } finally {
        process.kill(process.pid, signal);
    }
};
for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => void shutdown(signal));
}
