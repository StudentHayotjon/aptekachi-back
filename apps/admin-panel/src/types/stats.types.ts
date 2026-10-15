import type { PrescriptionSource, PrescriptionStatus } from "./prescription.types";
import type { Severity } from "./interaction.types";
import type { Role } from "./user.types";

export type DoseStatus = "PENDING" | "TAKEN" | "SKIPPED";

export interface DailyPoint {
    date: string; // YYYY-MM-DD
    count: number;
}

export interface Stats {
    period: { days: number; from: string; to: string };
    users: { total: number; active: number; blocked: number; byRole: Record<Role, number>; newInPeriod: number };
    prescriptions: {
        total: number;
        byStatus: Record<PrescriptionStatus, number>;
        bySource: Record<PrescriptionSource, number>;
        newInPeriod: number;
    };
    drugs: { active: number; inactive: number; lowStock: number; outOfStock: number; requiresPrescription: number };
    interactions: { total: number; bySeverity: Record<Severity, number> };
    doses: { byStatus: Record<DoseStatus, number>; adherenceRate: number | null };
    series: { registrations: DailyPoint[]; prescriptions: DailyPoint[] };
}

export interface ServiceHealth {
    ok: boolean;
    latencyMs: number | null;
    message?: string;
}

export interface SystemHealth {
    core: { ok: true; uptimeSec: number; node: string; env: string; timeZone: string };
    database: ServiceHealth;
    ocr: ServiceHealth;
    checkedAt: string;
}
