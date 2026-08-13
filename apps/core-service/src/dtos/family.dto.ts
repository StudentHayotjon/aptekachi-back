import { z } from "zod";

const phoneSchema = z.string().regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

export const createFamilyMemberSchema = z.object({
    fullName: z.string().min(2, "Ism kamida 2 belgidan iborat bo'lishi kerak").max(200),
    relationship: z.string().max(50).optional(),
    birthDate: z.coerce.date().optional()
});

export const createCareLinkSchema = z.object({
    phone: phoneSchema
});

export type CreateFamilyMemberDto = z.infer<typeof createFamilyMemberSchema>;
export type CreateCareLinkDto = z.infer<typeof createCareLinkSchema>;

export interface FamilyMemberResponse {
    id: string;
    guardianId: string;
    fullName: string;
    relationship: string | null;
    birthDate: Date | null;
    createdAt: Date;
}

export interface CareLinkUserSummary {
    id: string;
    fullName: string;
    phone: string;
}

export interface CareLinkResponse {
    id: string;
    createdAt: Date;
    viewer: CareLinkUserSummary;
    subject: CareLinkUserSummary;
}

export interface CareLinkListResponse {
    watching: CareLinkResponse[]; // men kuzatayotgan haqiqiy akkauntlar
    watchedBy: CareLinkResponse[]; // meni kuzatayotgan akkauntlar
}
