import { z } from "zod";
import { InteractionSeverity } from "@prisma/client";

export const createInteractionSchema = z
    .object({
        drugAId: z.string().uuid("drugAId to'g'ri UUID bo'lishi kerak"),
        drugBId: z.string().uuid("drugBId to'g'ri UUID bo'lishi kerak"),
        severity: z.nativeEnum(InteractionSeverity),
        description: z.string().max(1000).optional()
    })
    .refine((data) => data.drugAId !== data.drugBId, {
        message: "Ikkita bir xil dori tanlanishi mumkin emas",
        path: ["drugBId"]
    });

export const checkInteractionsSchema = z.object({
    drugIds: z.array(z.string().uuid()).min(2, "Tekshirish uchun kamida 2 ta dori kerak")
});

export const listInteractionQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateInteractionDto = z.infer<typeof createInteractionSchema>;
export type CheckInteractionsDto = z.infer<typeof checkInteractionsSchema>;
export type ListInteractionQueryDto = z.infer<typeof listInteractionQuerySchema>;

export interface InteractionResponse {
    id: string;
    drugAId: string;
    drugBId: string;
    severity: InteractionSeverity;
    description: string | null;
    createdAt: Date;
}

export interface InteractionListResponse {
    items: InteractionResponse[];
    total: number;
    page: number;
    limit: number;
}
