import { z } from "zod";

// Query string'dagi "true"/"false" uchun. z.coerce.boolean() ishlatilmaydi — u "false" qatorini ham true qiladi
// (Boolean("false") === true), natijada ?isActive=false filtri teskari ishlardi.
export const queryBoolean = z
    .enum(["true", "false", "1", "0"])
    .transform((value) => value === "true" || value === "1");

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
