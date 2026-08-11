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
