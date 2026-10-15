import { z } from "zod";
import { SEVERITIES } from "@/types";

const drugRef = z.object({ id: z.string(), name: z.string(), internationalName: z.string().nullable() }, { error: "Dorini tanlang" });

const descriptionSchema = z
    .string()
    .trim()
    .max(1000, "Ko'pi bilan 1000 belgi");

export const createInteractionSchema = z
    .object({
        drugA: drugRef.nullable().refine((v) => v !== null, "1-dorini tanlang"),
        drugB: drugRef.nullable().refine((v) => v !== null, "2-dorini tanlang"),
        severity: z.enum(SEVERITIES),
        description: descriptionSchema
    })
    .refine((v) => !v.drugA || !v.drugB || v.drugA.id !== v.drugB.id, {
        message: "Ikkita har xil dori tanlang",
        path: ["drugB"]
    });

export const updateInteractionSchema = z.object({
    severity: z.enum(SEVERITIES),
    description: descriptionSchema
});

export type CreateInteractionForm = z.input<typeof createInteractionSchema>;
export type UpdateInteractionForm = z.input<typeof updateInteractionSchema>;
