// Intl'ning uz-UZ lokali oy nomlarini "M09" ko'rinishida beradi va minglarni vergul bilan ajratadi —
// shuning uchun formatlash qo'lda qilingan.

export const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"] as const;

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** 23000 → "23 000" (bo'linmaydigan bo'sh joy bilan) */
export const formatNumber = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const formatMoney = (n: number): string => `${formatNumber(n)} so'm`;

export const formatPercent = (v: number | null): string => (v === null ? "—" : `${Math.round(v * 100)}%`);

/** 13-okt */
export const formatDay = (d: Date): string => `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`;

/** 13-okt, 2026 */
export const formatDate = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${formatDay(d)}, ${d.getFullYear()}`;
};

/** 13-okt, 14:05 */
export const formatDateTime = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${formatDay(d)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

export const timeAgo = (iso: string | null): string => {
    if (!iso) return "hech qachon";
    const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (sec < 60) return "hozirgina";
    if (sec < 3600) return `${Math.floor(sec / 60)} daqiqa oldin`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} soat oldin`;
    if (sec < 86400 * 30) return `${Math.floor(sec / 86400)} kun oldin`;
    return formatDate(iso);
};

/** Kelajakdagi vaqtgacha qolgan muddat: "2 kun 3 soat", "45 daqiqa" */
export const formatRemaining = (iso: string): string => {
    const min = Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 60000));
    const d = Math.floor(min / 1440);
    const h = Math.floor((min % 1440) / 60);
    const m = min % 60;
    if (d) return h ? `${d} kun ${h} soat` : `${d} kun`;
    if (h) return m ? `${h} soat ${m} daqiqa` : `${h} soat`;
    return `${m} daqiqa`;
};

export const formatUptime = (sec: number): string => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return d ? `${d} kun ${h} soat` : h ? `${h} soat ${m} daqiqa` : `${m} daqiqa`;
};

export const formatBytes = (bytes: number): string =>
    bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const initials = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";

export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
