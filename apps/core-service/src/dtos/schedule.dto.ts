import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Vaqt HH:mm formatida bo'lishi kerak (masalan 08:00)");

export const createScheduleSchema = z.object({
    familyMemberId: z.string().uuid().optional(), // berilsa — oila a'zosi uchun, aks holda o'zi uchun
    drugId: z.string().uuid().optional(),
    drugName: z.string().min(2, "Dori nomi kamida 2 belgidan iborat bo'lishi kerak").max(200),
    dosageNote: z.string().max(200).optional(),
    scheduleTimes: z.array(timeSchema).min(1, "Kamida bitta qabul vaqti kerak").max(10),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional()
});

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;

export type ScheduleOwnerType = "SELF" | "FAMILY_MEMBER" | "LINKED_ACCOUNT";

export interface ScheduleOwner {
    type: ScheduleOwnerType;
    id: string;
    fullName: string;
}

export interface ScheduleResponse {
    id: string;
    patientId: string | null;
    familyMemberId: string | null;
    owner: ScheduleOwner;
    drugId: string | null;
    drugName: string;
    dosageNote: string | null;
    scheduleTimes: string[];
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
