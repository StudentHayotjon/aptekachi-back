import { DoseStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import { hashPassword } from "../utils/password.util";
import { toAdminUserResponse } from "./auth.service";
import { toDrugResponse } from "./drug.service";
import { toInteractionResponse } from "./interaction.service";
import { analyzeWithOcrService, matchDrugIds, toPrescriptionResponse } from "./prescription.service";
import { env } from "../config/env.config";
import { AdminUserResponse, UserListResponse } from "../dtos/auth.dto";
import { DrugResponse } from "../dtos/drug.dto";
import { PaginatedResponse } from "../dtos/common.dto";
import {
    AdminBlockUserDto,
    AdminCreateUserDto,
    AdminDrugListResponse,
    AdminInteractionResponse,
    AdminListDrugsQueryDto,
    AdminListInteractionsQueryDto,
    AdminListPrescriptionsQueryDto,
    AdminListUsersQueryDto,
    AdminPrescriptionResponse,
    AdminResetPasswordDto,
    AdminStatsResponse,
    AdminUpdateInteractionDto,
    AdminUpdateStockDto,
    AdminUpdateUserDto,
    AdminUserDetailResponse,
    DailyPoint,
    DeleteUserResponse,
    OcrAnalyzeResponse,
    ServiceHealth,
    StatsQueryDto,
    SystemHealthResponse
} from "../dtos/admin.dto";

const TIME_ZONE = process.env.TZ ?? "Asia/Tashkent";
const DAY_MS = 24 * 60 * 60 * 1000;

const userSummarySelect = { id: true, phone: true, fullName: true } as const;
const drugSummarySelect = { id: true, name: true, internationalName: true } as const;

// groupBy natijasini enum'ning barcha qiymatlari bilan to'ldirilgan obyektga aylantiradi (yo'qlari 0 bo'ladi)
const countBy = <K extends string>(keys: readonly K[], rows: { key: K; count: number }[]): Record<K, number> => {
    const result = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
    for (const row of rows) {
        result[row.key] = row.count;
    }
    return result;
};

const adherence = (byStatus: Record<DoseStatus, number>): number | null => {
    const total = byStatus.TAKEN + byStatus.SKIPPED + byStatus.PENDING;
    return total === 0 ? null : Number((byStatus.TAKEN / total).toFixed(4));
};

/** Hozir tizimga kira oladigan foydalanuvchilar: muddatsiz bloklanmagan va vaqtincha blokda emas */
const activeUserWhere = (now = new Date()): Prisma.UserWhereInput => ({
    isActive: true,
    OR: [{ blockedUntil: null }, { blockedUntil: { lte: now } }]
});

const blockedUserWhere = (now = new Date()): Prisma.UserWhereInput => ({
    OR: [{ isActive: false }, { blockedUntil: { gt: now } }]
});

const revokeSessions = (userId: string) =>
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

// Kunlik qatorni bo'shliqsiz qaytaradi — yozuv bo'lmagan kunlar ham 0 bilan chiqadi (grafik uchun qulay)
const dailySeries = async (table: "users" | "prescriptions", from: Date, days: number): Promise<DailyPoint[]> => {
    const rows = await prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS date,
               count(*)::int AS count
        FROM ${Prisma.raw(`"${table}"`)}
        WHERE ("createdAt" AT TIME ZONE 'UTC') >= ${from}
        GROUP BY 1`;
    const byDate = new Map(rows.map((row) => [row.date, row.count]));
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }); // en-CA → YYYY-MM-DD

    return Array.from({ length: days }, (_, i) => {
        const date = formatter.format(new Date(from.getTime() + i * DAY_MS));
        return { date, count: byDate.get(date) ?? 0 };
    });
};

// Server vaqt mintaqasida bugundan (days - 1) kun oldingi kun boshlanishi
const periodStart = (days: number): Date => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
    const startOfToday = new Date(new Date(`${today}T00:00:00Z`).getTime() - tzOffsetMs(new Date()));
    return new Date(startOfToday.getTime() - (days - 1) * DAY_MS);
};

const tzOffsetMs = (date: Date): number => {
    const local = new Date(date.toLocaleString("en-US", { timeZone: TIME_ZONE }));
    const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    return local.getTime() - utc.getTime();
};

/**
 * O'qish so'rovlarini ketma-ket bajaradi. Promise.all har bir so'rovga alohida ulanish olib, Supabase
 * pooler'ining limitini (session mode, pool_size 15) tez to'ldirardi; bu yerda bir vaqtda faqat bitta ulanish
 * band bo'ladi va har bir so'rov prisma.client.ts'dagi qayta urinish mexanizmidan o'tadi
 * ($transaction ichidagi so'rovlar uchun qayta urinish ishlamaydi).
 */
async function sequential<T extends (() => Promise<unknown>)[]>(...tasks: T): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    const results: unknown[] = [];
    for (const task of tasks) results.push(await task());
    return results as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
}

const timed = async (check: () => Promise<void>): Promise<ServiceHealth> => {
    const started = Date.now();
    try {
        await check();
        return { ok: true, latencyMs: Date.now() - started };
    } catch (error) {
        return { ok: false, latencyMs: null, message: error instanceof Error ? error.message : "Noma'lum xato" };
    }
};

export class AdminService {
    // ---------- Tizim holati va OCR ----------

    public static async systemHealth(): Promise<SystemHealthResponse> {
        const [database, ocr] = await Promise.all([
            timed(async () => {
                await prisma.$queryRaw`SELECT 1`;
            }),
            timed(async () => {
                const response = await fetch(`${env.ocrServiceUrl}/health`, { signal: AbortSignal.timeout(5000) });
                if (!response.ok) {
                    throw new Error(`OCR xizmati ${response.status} qaytardi`);
                }
            })
        ]);

        return {
            core: { ok: true, uptimeSec: Math.round(process.uptime()), node: process.version, env: process.env.NODE_ENV ?? "development", timeZone: TIME_ZONE },
            database,
            ocr,
            checkedAt: new Date()
        };
    }

    // Retseptni saqlamasdan OCR natijasini ko'rsatadi — admin panel'dagi "OCR laboratoriyasi" uchun
    public static async analyzeOcr(file: Express.Multer.File): Promise<OcrAnalyzeResponse> {
        const started = Date.now();
        const rows = await analyzeWithOcrService(file);
        const drugIds = await matchDrugIds(rows.map((row) => row.dori_nomi_xpn));

        const uniqueIds = [...new Set(drugIds.filter((id): id is string => id !== null))];
        const drugs = uniqueIds.length
            ? await prisma.drug.findMany({ where: { id: { in: uniqueIds } }, select: drugSummarySelect })
            : [];
        const drugById = new Map(drugs.map((drug) => [drug.id, drug]));

        return {
            durationMs: Date.now() - started,
            items: rows.map((row, i) => ({
                retseptId: row.retsept_id || null,
                himoyaKodi: row.himoya_kodi || null,
                bemorFish: row.bemor_fish || null,
                bemorYosh: row.bemor_yosh || null,
                shifokorFish: row.shifokor || null,
                drugNameRaw: row.dori_nomi_xpn,
                releaseForm: row.chiqarilish_shakli || null,
                usageMethod: row.qabul_qilish_usuli || null,
                dailyDoseCount: row.kunlik_qabul_soni || null,
                duration: row.davomiyligi || null,
                regimen: row.qabul_tartibi || null,
                totalQuantity: row.umumiy_miqdori || null,
                note: row.izoh || null,
                validUntil: row.amal_qilish_muddati || null,
                matchedDrug: (drugIds[i] && drugById.get(drugIds[i]!)) || null
            }))
        };
    }

    // ---------- Statistika ----------

    public static async stats(query: StatsQueryDto): Promise<AdminStatsResponse> {
        const { days, lowStockThreshold } = query;
        const to = new Date();
        const from = periodStart(days);

        const [
            usersByRole,
            activeUsers,
            newUsers,
            prescriptionsByStatus,
            prescriptionsBySource,
            newPrescriptions,
            activeDrugs,
            inactiveDrugs,
            lowStockDrugs,
            outOfStockDrugs,
            rxDrugs,
            interactionsBySeverity,
            dosesByStatus
        ] = await sequential(
            () => prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
            () => prisma.user.count({ where: activeUserWhere() }),
            () => prisma.user.count({ where: { createdAt: { gte: from } } }),
            () => prisma.prescription.groupBy({ by: ["status"], _count: { _all: true } }),
            () => prisma.prescription.groupBy({ by: ["source"], _count: { _all: true } }),
            () => prisma.prescription.count({ where: { createdAt: { gte: from } } }),
            () => prisma.drug.count({ where: { isActive: true } }),
            () => prisma.drug.count({ where: { isActive: false } }),
            () => prisma.drug.count({ where: { isActive: true, stock: { gt: 0, lte: lowStockThreshold } } }),
            () => prisma.drug.count({ where: { isActive: true, stock: 0 } }),
            () => prisma.drug.count({ where: { isActive: true, requiresPrescription: true } }),
            () => prisma.drugInteraction.groupBy({ by: ["severity"], _count: { _all: true } }),
            () => prisma.doseEvent.groupBy({
                by: ["status"],
                where: { scheduledAt: { gte: from, lte: to } },
                _count: { _all: true }
            })
        );

        const [registrations, prescriptionSeries] = await sequential(
            () => dailySeries("users", from, days),
            () => dailySeries("prescriptions", from, days)
        );

        const byRole = countBy(Object.values(Role), usersByRole.map((r) => ({ key: r.role, count: r._count._all })));
        const totalUsers = Object.values(byRole).reduce((sum, n) => sum + n, 0);
        const byStatus = countBy(
            ["PENDING", "APPROVED", "REJECTED"] as const,
            prescriptionsByStatus.map((r) => ({ key: r.status, count: r._count._all }))
        );
        const doseCounts = countBy(
            Object.values(DoseStatus),
            dosesByStatus.map((r) => ({ key: r.status, count: r._count._all }))
        );

        return {
            period: { days, from, to },
            users: {
                total: totalUsers,
                active: activeUsers,
                blocked: totalUsers - activeUsers,
                byRole,
                newInPeriod: newUsers
            },
            prescriptions: {
                total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
                byStatus,
                bySource: countBy(
                    ["OCR", "DMED_QR"] as const,
                    prescriptionsBySource.map((r) => ({ key: r.source, count: r._count._all }))
                ),
                newInPeriod: newPrescriptions
            },
            drugs: {
                active: activeDrugs,
                inactive: inactiveDrugs,
                lowStock: lowStockDrugs,
                outOfStock: outOfStockDrugs,
                requiresPrescription: rxDrugs
            },
            interactions: {
                total: interactionsBySeverity.reduce((sum, r) => sum + r._count._all, 0),
                bySeverity: countBy(
                    ["GREEN", "YELLOW", "RED"] as const,
                    interactionsBySeverity.map((r) => ({ key: r.severity, count: r._count._all }))
                )
            },
            doses: { byStatus: doseCounts, adherenceRate: adherence(doseCounts) },
            series: { registrations, prescriptions: prescriptionSeries }
        };
    }

    // ---------- Foydalanuvchilar ----------

    public static async listUsers(query: AdminListUsersQueryDto): Promise<UserListResponse> {
        const { role, isActive, search, page, limit, sortBy, order } = query;

        const where: Prisma.UserWhereInput = {
            ...(role && { role }),
            ...(isActive !== undefined && { AND: [isActive ? activeUserWhere() : blockedUserWhere()] }),
            ...(search && {
                OR: [
                    { phone: { contains: search, mode: "insensitive" } },
                    { fullName: { contains: search, mode: "insensitive" } }
                ]
            })
        };

        const [items, total] = await sequential(
            () => prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sortBy]: order } }),
            () => prisma.user.count({ where })
        );

        return { items: items.map(toAdminUserResponse), total, page, limit };
    }

    public static async getUser(id: string): Promise<AdminUserDetailResponse> {
        const since30d = new Date(Date.now() - 30 * DAY_MS);
        const now = new Date();

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        patientPrescriptions: true,
                        doctorPrescriptions: true,
                        guardianOfFamilyMembers: true,
                        careLinksAsViewer: true,
                        careLinksAsSubject: true,
                        medicationSchedules: { where: { isActive: true } }
                    }
                }
            }
        });
        if (!user) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }

        const [lastToken, activeSessions, doses] = await sequential(
            () => prisma.refreshToken.findFirst({ where: { userId: id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
            () => prisma.refreshToken.count({ where: { userId: id, revokedAt: null, expiresAt: { gt: now } } }),
            () => prisma.doseEvent.groupBy({
                by: ["status"],
                where: { schedule: { patientId: id }, scheduledAt: { gte: since30d, lte: now } },
                _count: { _all: true }
            })
        );

        const doseCounts = countBy(Object.values(DoseStatus), doses.map((r) => ({ key: r.status, count: r._count._all })));

        return {
            ...toAdminUserResponse(user),
            updatedAt: user.updatedAt,
            lastLoginAt: lastToken?.createdAt ?? null,
            activeSessions,
            counts: {
                prescriptions: user._count.patientPrescriptions,
                reviewedPrescriptions: user._count.doctorPrescriptions,
                activeSchedules: user._count.medicationSchedules,
                familyMembers: user._count.guardianOfFamilyMembers,
                careLinksAsViewer: user._count.careLinksAsViewer,
                careLinksAsSubject: user._count.careLinksAsSubject
            },
            doses30d: { byStatus: doseCounts, adherenceRate: adherence(doseCounts) }
        };
    }

    public static async createUser(dto: AdminCreateUserDto): Promise<AdminUserResponse> {
        const existing = await prisma.user.findUnique({ where: { phone: dto.phone } });
        if (existing) {
            throw new AppError(409, "Bu telefon raqami bilan foydalanuvchi allaqachon mavjud");
        }

        const passwordHash = await hashPassword(dto.password);
        const user = await prisma.user.create({
            data: { phone: dto.phone, passwordHash, fullName: dto.fullName, role: dto.role }
        });
        return toAdminUserResponse(user);
    }

    public static async updateUser(actorId: string, id: string, dto: AdminUpdateUserDto): Promise<AdminUserResponse> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }

        const roleChanges = dto.role !== undefined && dto.role !== existing.role;
        if (roleChanges && id === actorId) {
            throw new AppError(400, "O'z rolingizni o'zgartira olmaysiz");
        }
        if (roleChanges && existing.role === Role.ADMINISTRATOR && existing.isActive) {
            await AdminService.ensureAnotherActiveAdmin(id);
        }

        if (dto.phone && dto.phone !== existing.phone) {
            const taken = await prisma.user.findUnique({ where: { phone: dto.phone } });
            if (taken) {
                throw new AppError(409, "Bu telefon raqami boshqa foydalanuvchiga tegishli");
            }
        }

        const user = await prisma.user.update({ where: { id }, data: dto });

        // Rol access token ichida saqlanadi — eski rol bilan ishlashda davom etmasligi uchun qayta kirish talab qilinadi
        if (roleChanges) {
            await revokeSessions(id);
        }

        return toAdminUserResponse(user);
    }

    public static async setUserStatus(actorId: string, id: string, isActive: boolean): Promise<AdminUserResponse> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }
        if (!isActive && id === actorId) {
            throw new AppError(400, "O'zingizni bloklay olmaysiz");
        }
        if (!isActive && existing.role === Role.ADMINISTRATOR && existing.isActive) {
            await AdminService.ensureAnotherActiveAdmin(id);
        }

        const user = await prisma.user.update({
            where: { id },
            data: isActive ? { isActive, blockedUntil: null, blockReason: null } : { isActive }
        });

        if (!isActive) {
            // Bloklangan foydalanuvchining barcha sessiyalari bekor qilinadi (majburiy chiqish)
            await revokeSessions(id);
        }

        return toAdminUserResponse(user);
    }

    /** until berilsa — vaqtincha, aks holda muddatsiz blok. Har ikki holatda sessiyalar darhol yopiladi */
    public static async blockUser(actorId: string, id: string, dto: AdminBlockUserDto): Promise<AdminUserResponse> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }
        if (id === actorId) {
            throw new AppError(400, "O'zingizni bloklay olmaysiz");
        }
        if (existing.role === Role.ADMINISTRATOR) {
            await AdminService.ensureAnotherActiveAdmin(id);
        }

        const reason = dto.reason || null;
        const user = await prisma.user.update({
            where: { id },
            data: dto.until
                ? { isActive: true, blockedUntil: dto.until, blockReason: reason }
                : { isActive: false, blockedUntil: null, blockReason: reason }
        });
        await revokeSessions(id);
        return toAdminUserResponse(user);
    }

    public static async unblockUser(id: string): Promise<AdminUserResponse> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }
        const user = await prisma.user.update({ where: { id }, data: { isActive: true, blockedUntil: null, blockReason: null } });
        return toAdminUserResponse(user);
    }

    /**
     * Foydalanuvchini butunlay o'chiradi. Bog'liq yozuvlar sxemadagi qoidalar bo'yicha:
     * bemor retseptlari, jadvallari, dozalari, oila profillari va sessiyalari ham o'chadi;
     * shifokor sifatida ko'rib chiqqan retseptlarida doctorId null bo'lib qoladi.
     */
    public static async deleteUser(actorId: string, id: string): Promise<DeleteUserResponse> {
        const existing = await prisma.user.findUnique({
            where: { id },
            include: { _count: { select: { patientPrescriptions: true, medicationSchedules: true, guardianOfFamilyMembers: true } } }
        });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }
        if (id === actorId) {
            throw new AppError(400, "O'zingizni o'chira olmaysiz");
        }
        if (existing.role === Role.ADMINISTRATOR) {
            await AdminService.ensureAnotherActiveAdmin(id);
        }

        await prisma.user.delete({ where: { id } });
        return {
            id,
            deleted: {
                prescriptions: existing._count.patientPrescriptions,
                schedules: existing._count.medicationSchedules,
                familyMembers: existing._count.guardianOfFamilyMembers
            }
        };
    }

    public static async resetUserPassword(id: string, dto: AdminResetPasswordDto): Promise<void> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }

        const passwordHash = await hashPassword(dto.newPassword);
        await prisma.$transaction([
            prisma.user.update({ where: { id }, data: { passwordHash } }),
            prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
        ]);
    }

    public static async revokeUserSessions(id: string): Promise<number> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }
        const result = await revokeSessions(id);
        return result.count;
    }

    // Tizimda kamida bitta faol administrator qolishini kafolatlaydi
    private static async ensureAnotherActiveAdmin(excludeId: string): Promise<void> {
        const others = await prisma.user.count({
            where: { role: Role.ADMINISTRATOR, id: { not: excludeId }, ...activeUserWhere() }
        });
        if (others === 0) {
            throw new AppError(400, "Tizimdagi oxirgi faol administratorni bloklash yoki rolini o'zgartirish mumkin emas");
        }
    }

    // ---------- Retseptlar ----------

    public static async listPrescriptions(query: AdminListPrescriptionsQueryDto): Promise<PaginatedResponse<AdminPrescriptionResponse>> {
        const { status, source, patientId, doctorId, search, from, to, page, limit, order } = query;

        const where: Prisma.PrescriptionWhereInput = {
            ...(status && { status }),
            ...(source && { source }),
            ...(patientId && { patientId }),
            ...(doctorId && { doctorId }),
            ...((from || to) && { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }),
            ...(search && {
                patient: {
                    OR: [
                        { phone: { contains: search, mode: "insensitive" } },
                        { fullName: { contains: search, mode: "insensitive" } }
                    ]
                }
            })
        };

        const [items, total] = await sequential(
            () => prisma.prescription.findMany({
                where,
                include: { items: true, patient: { select: userSummarySelect }, doctor: { select: userSummarySelect } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: order }
            }),
            () => prisma.prescription.count({ where })
        );

        return {
            items: items.map((p) => ({ ...toPrescriptionResponse(p), patient: p.patient, doctor: p.doctor })),
            total,
            page,
            limit
        };
    }

    public static async getPrescription(id: string): Promise<AdminPrescriptionResponse> {
        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: { items: true, patient: { select: userSummarySelect }, doctor: { select: userSummarySelect } }
        });
        if (!prescription) {
            throw new AppError(404, "Retsept topilmadi");
        }
        return { ...toPrescriptionResponse(prescription), patient: prescription.patient, doctor: prescription.doctor };
    }

    // ---------- Dorilar ----------

    public static async listDrugs(query: AdminListDrugsQueryDto): Promise<AdminDrugListResponse> {
        const { search, dosageForm, requiresPrescription, isActive, maxStock, page, limit, sortBy, order } = query;

        const where: Prisma.DrugWhereInput = {
            ...(isActive !== undefined && { isActive }),
            ...(dosageForm && { dosageForm }),
            ...(requiresPrescription !== undefined && { requiresPrescription }),
            ...(maxStock !== undefined && { stock: { lte: maxStock } }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { internationalName: { contains: search, mode: "insensitive" } },
                    { manufacturer: { contains: search, mode: "insensitive" } },
                    { barcode: { equals: search } }
                ]
            })
        };

        const [items, total] = await sequential(
            () => prisma.drug.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sortBy]: order } }),
            () => prisma.drug.count({ where })
        );

        return { items: items.map(toDrugResponse), total, page, limit };
    }

    // Ommaviy GET /drugs/:id'dan farqli o'laroq nofaol (o'chirilgan) dorini ham qaytaradi
    public static async getDrug(id: string): Promise<DrugResponse> {
        const drug = await prisma.drug.findUnique({ where: { id } });
        if (!drug) {
            throw new AppError(404, "Dori topilmadi");
        }
        return toDrugResponse(drug);
    }

    public static async restoreDrug(id: string): Promise<DrugResponse> {
        const existing = await prisma.drug.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Dori topilmadi");
        }
        const drug = await prisma.drug.update({ where: { id }, data: { isActive: true } });
        return toDrugResponse(drug);
    }

    public static async updateDrugStock(id: string, dto: AdminUpdateStockDto): Promise<DrugResponse> {
        const existing = await prisma.drug.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Dori topilmadi");
        }

        if (dto.stock !== undefined) {
            return toDrugResponse(await prisma.drug.update({ where: { id }, data: { stock: dto.stock } }));
        }

        const delta = dto.delta!;
        // Atomik o'zgartirish: parallel so'rovlarda ham qoldiq manfiy bo'lib qolmaydi
        const result = await prisma.drug.updateMany({
            where: { id, ...(delta < 0 && { stock: { gte: -delta } }) },
            data: { stock: { increment: delta } }
        });
        if (result.count === 0) {
            throw new AppError(400, `Omborda yetarli qoldiq yo'q (hozirgi qoldiq: ${existing.stock})`);
        }

        return AdminService.getDrug(id);
    }

    // ---------- O'zaro ta'sirlar ----------

    public static async listInteractions(query: AdminListInteractionsQueryDto): Promise<PaginatedResponse<AdminInteractionResponse>> {
        const { severity, drugId, search, page, limit } = query;

        const drugNameFilter: Prisma.DrugWhereInput | undefined = search
            ? {
                  OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { internationalName: { contains: search, mode: "insensitive" } }
                  ]
              }
            : undefined;

        const where: Prisma.DrugInteractionWhereInput = {
            ...(severity && { severity }),
            AND: [
                ...(drugId ? [{ OR: [{ drugAId: drugId }, { drugBId: drugId }] }] : []),
                ...(drugNameFilter ? [{ OR: [{ drugA: drugNameFilter }, { drugB: drugNameFilter }] }] : [])
            ]
        };

        const [items, total] = await sequential(
            () => prisma.drugInteraction.findMany({
                where,
                include: { drugA: { select: drugSummarySelect }, drugB: { select: drugSummarySelect } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" }
            }),
            () => prisma.drugInteraction.count({ where })
        );

        return {
            items: items.map((row) => ({ ...toInteractionResponse(row), updatedAt: row.updatedAt, drugA: row.drugA, drugB: row.drugB })),
            total,
            page,
            limit
        };
    }

    public static async updateInteraction(id: string, dto: AdminUpdateInteractionDto): Promise<AdminInteractionResponse> {
        const existing = await prisma.drugInteraction.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Yozuv topilmadi");
        }

        const row = await prisma.drugInteraction.update({
            where: { id },
            data: dto,
            include: { drugA: { select: drugSummarySelect }, drugB: { select: drugSummarySelect } }
        });

        return { ...toInteractionResponse(row), updatedAt: row.updatedAt, drugA: row.drugA, drugB: row.drugB };
    }
}
