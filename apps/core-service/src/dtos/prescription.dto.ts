import { z } from "zod";
import { PrescriptionSource, PrescriptionStatus } from "@prisma/client";

export const listPrescriptionQuerySchema = z.object({
    status: z.nativeEnum(PrescriptionStatus).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const rejectPrescriptionSchema = z.object({
    reason: z.string().min(3, "Rad etish sababi ko'rsatilishi kerak").max(500)
});

export const dmedImportSchema = z.object({
    uuid: z.string().min(1, "dmed retsept UUID ko'rsatilishi kerak")
});

export type ListPrescriptionQueryDto = z.infer<typeof listPrescriptionQuerySchema>;
export type RejectPrescriptionDto = z.infer<typeof rejectPrescriptionSchema>;
export type DmedImportDto = z.infer<typeof dmedImportSchema>;

export interface PrescriptionItemResponse {
    id: string;
    retseptId: string | null;
    himoyaKodi: string | null;
    bemorFish: string | null;
    bemorYosh: string | null;
    shifokorFish: string | null;
    drugId: string | null;
    drugNameRaw: string;
    releaseForm: string | null;
    usageMethod: string | null;
    dailyDoseCount: string | null;
    duration: string | null;
    regimen: string | null;
    totalQuantity: string | null;
    note: string | null;
    validUntil: string | null;
}

export interface PrescriptionResponse {
    id: string;
    patientId: string;
    doctorId: string | null;
    source: PrescriptionSource;
    imageUrl: string | null;
    dmedUuid: string | null;
    status: PrescriptionStatus;
    rejectReason: string | null;
    reviewedAt: Date | null;
    items: PrescriptionItemResponse[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PrescriptionListResponse {
    items: PrescriptionResponse[];
    total: number;
    page: number;
    limit: number;
}
