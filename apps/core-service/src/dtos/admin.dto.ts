import { z } from "zod";
import {
    DoseStatus,
    DosageForm,
    InteractionSeverity,
    PrescriptionSource,
    PrescriptionStatus,
    Role
} from "@prisma/client";
import { paginationQuerySchema, queryBoolean, sortOrderSchema } from "./common.dto";
import { AdminUserResponse } from "./auth.dto";
import { DrugResponse } from "./drug.dto";
import { InteractionResponse } from "./interaction.dto";
import { PrescriptionResponse } from "./prescription.dto";

const phoneSchema = z.string().regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");
const dateQuery = z.coerce.date({ errorMap: () => ({ message: "Sana ISO formatida bo'lishi kerak (masalan 2026-10-01)" }) });

// ---------- Statistika ----------

export const statsQuerySchema = z.object({
    days: z.coerce.number().int().min(1).max(90).default(7),
    lowStockThreshold: z.coerce.number().int().min(0).max(10000).default(10)
});

export type StatsQueryDto = z.infer<typeof statsQuerySchema>;

export interface DailyPoint {
    date: string; // YYYY-MM-DD (server vaqt mintaqasida)
    count: number;
}

export interface AdminStatsResponse {
    period: { days: number; from: Date; to: Date };
    users: {
        total: number;
        active: number;
        blocked: number;
        byRole: Record<Role, number>;
        newInPeriod: number;
    };
    prescriptions: {
        total: number;
        byStatus: Record<PrescriptionStatus, number>;
        bySource: Record<PrescriptionSource, number>;
        newInPeriod: number;
    };
    drugs: {
        active: number;
        inactive: number;
        lowStock: number;
        outOfStock: number;
        requiresPrescription: number;
    };
    interactions: {
        total: number;
        bySeverity: Record<InteractionSeverity, number>;
    };
    doses: {
        // Faqat davr ichida va hozirgacha rejalashtirilgan dozalar (kelajakdagilar hisobga olinmaydi)
        byStatus: Record<DoseStatus, number>;
        adherenceRate: number | null; // TAKEN / jami, 0..1; dozalar bo'lmasa null
    };
    series: {
        registrations: DailyPoint[];
        prescriptions: DailyPoint[];
    };
}

// ---------- Foydalanuvchilar ----------

export const adminListUsersQuerySchema = paginationQuerySchema.extend({
    role: z.nativeEnum(Role).optional(),
    isActive: queryBoolean.optional(),
    search: z.string().trim().max(200).optional(),
    sortBy: z.enum(["createdAt", "fullName", "phone"]).default("createdAt"),
    order: sortOrderSchema
});

export const adminCreateUserSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak"),
    fullName: z.string().trim().min(2).max(100),
    role: z.nativeEnum(Role)
});

export const adminUpdateUserSchema = z
    .object({
        phone: phoneSchema.optional(),
        fullName: z.string().trim().min(2).max(100).optional(),
        role: z.nativeEnum(Role).optional()
    })
    .refine((data) => Object.keys(data).length > 0, { message: "Kamida bitta maydon yuborilishi kerak" });

const MAX_BLOCK_DAYS = 365;

/** until berilsa — shu vaqtgacha vaqtincha blok; berilmasa (yoki null) — muddatsiz blok */
export const adminBlockUserSchema = z.object({
    until: z.coerce
        .date({ errorMap: () => ({ message: "until ISO sana/vaqt bo'lishi kerak" }) })
        .refine((d) => d.getTime() > Date.now(), "Blok tugash vaqti kelajakda bo'lishi kerak")
        .refine((d) => d.getTime() <= Date.now() + MAX_BLOCK_DAYS * 24 * 60 * 60 * 1000, `Vaqtincha blok ${MAX_BLOCK_DAYS} kundan oshmasligi kerak`)
        .nullable()
        .optional(),
    reason: z.string().trim().max(300, "Sabab 300 belgidan oshmasligi kerak").optional()
});

export const adminResetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
});

export type AdminListUsersQueryDto = z.infer<typeof adminListUsersQuerySchema>;
export type AdminCreateUserDto = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;
export type AdminResetPasswordDto = z.infer<typeof adminResetPasswordSchema>;
export type AdminBlockUserDto = z.infer<typeof adminBlockUserSchema>;

export interface DeleteUserResponse {
    id: string;
    deleted: {
        prescriptions: number;
        schedules: number;
        familyMembers: number;
    };
}

export interface AdminUserDetailResponse extends AdminUserResponse {
    updatedAt: Date;
    lastLoginAt: Date | null; // oxirgi berilgan refresh token vaqti (login yoki token yangilash)
    activeSessions: number;
    counts: {
        prescriptions: number; // bemor sifatida yuklagan retseptlari
        reviewedPrescriptions: number; // shifokor sifatida ko'rib chiqqanlari
        activeSchedules: number;
        familyMembers: number;
        careLinksAsViewer: number;
        careLinksAsSubject: number;
    };
    doses30d: {
        byStatus: Record<DoseStatus, number>;
        adherenceRate: number | null;
    };
}

// ---------- Retseptlar ----------

export const adminListPrescriptionsQuerySchema = paginationQuerySchema.extend({
    status: z.nativeEnum(PrescriptionStatus).optional(),
    source: z.nativeEnum(PrescriptionSource).optional(),
    patientId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional(),
    search: z.string().trim().max(200).optional(), // bemor telefoni yoki ismi bo'yicha
    from: dateQuery.optional(),
    to: dateQuery.optional(),
    order: sortOrderSchema
});

export type AdminListPrescriptionsQueryDto = z.infer<typeof adminListPrescriptionsQuerySchema>;

export interface UserSummary {
    id: string;
    phone: string;
    fullName: string;
}

export interface AdminPrescriptionResponse extends PrescriptionResponse {
    patient: UserSummary;
    doctor: UserSummary | null;
}

// ---------- Dorilar ----------

export const adminListDrugsQuerySchema = paginationQuerySchema.extend({
    search: z.string().trim().max(200).optional(), // nomi, xalqaro nomi, ishlab chiqaruvchi yoki shtrix-kod
    dosageForm: z.nativeEnum(DosageForm).optional(),
    requiresPrescription: queryBoolean.optional(),
    isActive: queryBoolean.optional(), // berilmasa faol va nofaol hammasi
    maxStock: z.coerce.number().int().min(0).optional(), // masalan maxStock=10 — kam qolgan dorilar
    sortBy: z.enum(["name", "price", "stock", "createdAt", "updatedAt"]).default("name"),
    order: z.enum(["asc", "desc"]).default("asc")
});

export const adminUpdateStockSchema = z
    .object({
        stock: z.number().int().min(0).optional(), // aniq qiymat o'rnatish
        delta: z.number().int().optional() // kirim (+) yoki chiqim (-)
    })
    .refine((data) => (data.stock === undefined) !== (data.delta === undefined), {
        message: "stock yoki delta'dan aynan bittasi yuborilishi kerak"
    });

export type AdminListDrugsQueryDto = z.infer<typeof adminListDrugsQuerySchema>;
export type AdminUpdateStockDto = z.infer<typeof adminUpdateStockSchema>;

export interface AdminDrugListResponse {
    items: DrugResponse[];
    total: number;
    page: number;
    limit: number;
}

// ---------- O'zaro ta'sirlar ----------

export const adminListInteractionsQuerySchema = paginationQuerySchema.extend({
    severity: z.nativeEnum(InteractionSeverity).optional(),
    drugId: z.string().uuid().optional(),
    search: z.string().trim().max(200).optional() // ikki doridan birining nomi bo'yicha
});

export const adminUpdateInteractionSchema = z
    .object({
        severity: z.nativeEnum(InteractionSeverity).optional(),
        description: z.string().max(1000).nullable().optional()
    })
    .refine((data) => Object.keys(data).length > 0, { message: "Kamida bitta maydon yuborilishi kerak" });

export type AdminListInteractionsQueryDto = z.infer<typeof adminListInteractionsQuerySchema>;
export type AdminUpdateInteractionDto = z.infer<typeof adminUpdateInteractionSchema>;

export interface DrugSummary {
    id: string;
    name: string;
    internationalName: string | null;
}

export interface AdminInteractionResponse extends InteractionResponse {
    updatedAt: Date;
    drugA: DrugSummary;
    drugB: DrugSummary;
}

// ---------- Tizim holati va OCR ----------

export interface ServiceHealth {
    ok: boolean;
    latencyMs: number | null;
    message?: string;
}

export interface SystemHealthResponse {
    core: { ok: true; uptimeSec: number; node: string; env: string; timeZone: string };
    database: ServiceHealth;
    ocr: ServiceHealth;
    checkedAt: Date;
}

export interface OcrAnalyzeItem {
    retseptId: string | null;
    himoyaKodi: string | null;
    bemorFish: string | null;
    bemorYosh: string | null;
    shifokorFish: string | null;
    drugNameRaw: string;
    releaseForm: string | null;
    usageMethod: string | null;
    dailyDoseCount: string | null;
    duration: string | null;
    regimen: string | null;
    totalQuantity: string | null;
    note: string | null;
    validUntil: string | null;
    matchedDrug: DrugSummary | null; // dori bazasidan Levenshtein bo'yicha topilgan mos dori
}

export interface OcrAnalyzeResponse {
    items: OcrAnalyzeItem[];
    durationMs: number;
}
