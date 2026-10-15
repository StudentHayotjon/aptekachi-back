import { http } from "@/api/http";
import type { Paginated, Prescription, PrescriptionListQuery } from "@/types";

export const prescriptionsService = {
    list: (query: PrescriptionListQuery) =>
        http.get<Paginated<Prescription>>("/admin/prescriptions", {
            ...query,
            // "to" sanasi kun oxirigacha qamrab olinishi uchun
            to: query.to ? `${query.to}T23:59:59` : undefined
        }),
    get: (id: string) => http.get<Prescription>(`/admin/prescriptions/${id}`)
};
