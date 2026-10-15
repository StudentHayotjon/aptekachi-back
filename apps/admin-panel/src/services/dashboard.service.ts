import { http } from "@/api/http";
import type { Stats, SystemHealth } from "@/types";

export const dashboardService = {
    stats: (days: number) => http.get<Stats>("/admin/stats", { days }),
    health: () => http.get<SystemHealth>("/admin/system/health")
};
