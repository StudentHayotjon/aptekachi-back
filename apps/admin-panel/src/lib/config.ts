/**
 * core-service manzili. Dev rejimida bo'sh — so'rovlar vite proksisi orqali ketadi (vite.config.ts),
 * shuning uchun CORS kerak emas. Production build'da VITE_API_URL ishlatiladi;
 * oxiridagi "/" yoki "/api/v1" olib tashlanadi, chunki so'rov yo'llari "/api/v1" ni o'zi qo'shadi.
 */
export const API_ORIGIN = import.meta.env.DEV
    ? ""
    : (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/+$/, "").replace(/\/api\/v1$/, "");

export const API_BASE = `${API_ORIGIN}/api/v1`;

export const STORAGE_KEYS = {
    session: "aptekachi.admin.session",
    theme: "aptekachi.admin.theme"
} as const;

export const PAGE_SIZE = 15;
export const LOW_STOCK_THRESHOLD = 10;

/** /uploads/... kabi nisbiy yo'lni to'liq URL'ga aylantiradi */
export const fileUrl = (path: string | null): string | null =>
    path ? (/^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`) : null;
