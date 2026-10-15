import type { DosageForm, DoseStatus, PrescriptionSource, PrescriptionStatus, Role, Severity } from "@/types";

export type Tone = "brand" | "success" | "warning" | "danger" | "violet" | "neutral";

export const ROLE_LABEL: Record<Role, string> = { BEMOR: "Bemor", SHIFOKOR: "Shifokor", ADMINISTRATOR: "Administrator" };
export const ROLE_TONE: Record<Role, Tone> = { BEMOR: "brand", SHIFOKOR: "violet", ADMINISTRATOR: "warning" };

export const STATUS_LABEL: Record<PrescriptionStatus, string> = {
    PENDING: "Kutilmoqda",
    APPROVED: "Tasdiqlangan",
    REJECTED: "Rad etilgan"
};
export const STATUS_TONE: Record<PrescriptionStatus, Tone> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export const SOURCE_LABEL: Record<PrescriptionSource, string> = { OCR: "OCR (rasm)", DMED_QR: "DMED QR" };

export const SEVERITY_LABEL: Record<Severity, string> = { GREEN: "Minimal", YELLOW: "Ehtiyot", RED: "Xavfli" };
export const SEVERITY_HINT: Record<Severity, string> = { GREEN: "Kam xavf", YELLOW: "Nazorat kerak", RED: "Birga ichmang" };
export const SEVERITY_TONE: Record<Severity, Tone> = { GREEN: "success", YELLOW: "warning", RED: "danger" };

export const DOSE_LABEL: Record<DoseStatus, string> = { TAKEN: "Ichilgan", SKIPPED: "O'tkazilgan", PENDING: "Belgilanmagan" };

export const DOSAGE_FORM_LABEL: Record<DosageForm, string> = {
    TABLETKA: "Tabletka",
    KAPSULA: "Kapsula",
    SIROP: "Sirop",
    INYEKSIYA: "Inyeksiya",
    MALHAM: "Malham",
    TOMCHI: "Tomchi",
    SPREY: "Sprey",
    BOSHQA: "Boshqa"
};

/** Grafiklar uchun aniq ranglar (SVG ichida CSS o'zgaruvchilari bilan bir xil) */
export const CHART_COLORS = {
    brand: "#347FE7",
    cyan: "#19C9E8",
    violet: "#7B61FF",
    success: "#22A95A",
    warning: "#E29A12",
    danger: "#E5403C",
    gray: "#9AA6B8"
} as const;
