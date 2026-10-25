import { z } from "zod";
import { DoseStatus } from "@prisma/client";

export const listDoseQuerySchema = z.object({
    status: z.nativeEnum(DoseStatus).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50)
});

export type ListDoseQueryDto = z.infer<typeof listDoseQuerySchema>;

// Mobil ilova doza holatini kun bo'yicha boshqaradi (bitta dori = bitta kunlik holat), server esa
// har bir vaqt-sloti uchun alohida DoseEvent saqlaydi. Shu endpoint berilgan sanadagi jadvalning
// BARCHA vaqt-slotlarini bitta holatga keltiradi (upsert) — undo (PENDING) ham qo'llab-quvvatlanadi,
// cron hali hodisa yaratmagan bo'lsa ham ishlaydi (idempotent).
export const setScheduleDayDoseSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
    status: z.nativeEnum(DoseStatus)
});

export type SetScheduleDayDoseDto = z.infer<typeof setScheduleDayDoseSchema>;

export interface DoseEventResponse {
    id: string;
    scheduleId: string;
    drugName: string;
    dosageNote: string | null;
    scheduledAt: Date;
    status: DoseStatus;
    confirmedAt: Date | null;
    remindersSent: number;
}

export interface DoseListResponse {
    items: DoseEventResponse[];
    total: number;
    page: number;
    limit: number;
}
