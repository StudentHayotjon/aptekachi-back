import { http } from "@/api/http";
import type { Drug, DrugListQuery, DrugPayload, Paginated, StockPayload } from "@/types";

export const drugsService = {
    list: (query: DrugListQuery) => http.get<Paginated<Drug>>("/admin/drugs", { ...query }),
    get: (id: string) => http.get<Drug>(`/admin/drugs/${id}`),
    create: (payload: DrugPayload) => http.post<Drug>("/admin/drugs", payload),
    update: (id: string, payload: Partial<DrugPayload>) => http.put<Drug>(`/admin/drugs/${id}`, payload),
    archive: (id: string) => http.delete<void>(`/admin/drugs/${id}`),
    restore: (id: string) => http.patch<Drug>(`/admin/drugs/${id}/restore`),
    adjustStock: (id: string, payload: StockPayload) => http.patch<Drug>(`/admin/drugs/${id}/stock`, payload)
};
