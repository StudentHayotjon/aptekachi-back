import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Vaqt HH:mm formatida bo'lishi kerak (masalan 08:00)");

export const createScheduleSchema = z.object({
    drugId: z.string().uuid().optional(),
    drugName: z.string().min(2, "Dori nomi kamida 2 belgidan iborat bo'lishi kerak").max(200),
    dosageNote: z.string().max(200).optional(),
    scheduleTimes: z.array(timeSchema).min(1, "Kamida bitta qabul vaqti kerak").max(10),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional()
});

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;

export interface ScheduleResponse {
    id: string;
    patientId: string;
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
