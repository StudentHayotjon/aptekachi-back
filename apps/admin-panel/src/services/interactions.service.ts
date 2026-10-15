import { http } from "@/api/http";
import type { CreateInteractionPayload, Interaction, InteractionListQuery, Paginated, UpdateInteractionPayload } from "@/types";

export const interactionsService = {
    list: (query: InteractionListQuery) => http.get<Paginated<Interaction>>("/admin/interactions", { ...query }),
    create: (payload: CreateInteractionPayload) => http.post<Interaction>("/admin/interactions", payload),
    update: (id: string, payload: UpdateInteractionPayload) => http.patch<Interaction>(`/admin/interactions/${id}`, payload),
    remove: (id: string) => http.delete<void>(`/admin/interactions/${id}`)
};
