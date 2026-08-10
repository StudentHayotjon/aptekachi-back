import { z } from "zod";
import { DosageForm } from "@prisma/client";

export const createDrugSchema = z.object({
    name: z.string().min(2, "Dori nomi kamida 2 belgidan iborat bo'lishi kerak").max(200),
    internationalName: z.string().max(200).optional(),
    manufacturer: z.string().min(2, "Ishlab chiqaruvchi ko'rsatilishi shart").max(200),
    country: z.string().max(100).optional(),
    dosageForm: z.nativeEnum(DosageForm).default(DosageForm.BOSHQA),
    dosage: z.string().max(50).optional(),
    packageSize: z.string().max(100).optional(),
    barcode: z.string().max(50).optional(),
    price: z.number().positive("Narx musbat son bo'lishi kerak"),
    stock: z.number().int().min(0).default(0),
    requiresPrescription: z.boolean().default(false),
    description: z.string().max(2000).optional(),
    imageUrl: z.string().url("imageUrl to'g'ri URL bo'lishi kerak").optional()
});

export const updateDrugSchema = createDrugSchema.partial();

export const listDrugQuerySchema = z.object({
    search: z.string().max(200).optional(),
    dosageForm: z.nativeEnum(DosageForm).optional(),
    requiresPrescription: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateDrugDto = z.infer<typeof createDrugSchema>;
export type UpdateDrugDto = z.infer<typeof updateDrugSchema>;
export type ListDrugQueryDto = z.infer<typeof listDrugQuerySchema>;

export interface DrugResponse {
    id: string;
    name: string;
    internationalName: string | null;
    manufacturer: string;
    country: string | null;
    dosageForm: DosageForm;
    dosage: string | null;
    packageSize: string | null;
    barcode: string | null;
    price: number;
    stock: number;
    requiresPrescription: boolean;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DrugListResponse {
    items: DrugResponse[];
    total: number;
    page: number;
    limit: number;
}
