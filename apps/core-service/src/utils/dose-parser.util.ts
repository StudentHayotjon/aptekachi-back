const MIN_DAILY_DOSE_COUNT = 1;
const MAX_DAILY_DOSE_COUNT = 6;
const DEFAULT_SCHEDULE_TIME = "09:00";
const WINDOW_START_MINUTES = 8 * 60; // 08:00
const WINDOW_END_MINUTES = 22 * 60; // 22:00

const NON_DAILY_PATTERNS = [/kerak\s*bo'?lganda/i, /zarurat/i, /talab\s*qilinganda/i, /\bprn\b/i];

export const isNonDailyDose = (dailyDoseCount: string | null): boolean => {
    if (!dailyDoseCount) {
        return false;
    }
    return NON_DAILY_PATTERNS.some((pattern) => pattern.test(dailyDoseCount));
};

export const parseDailyDoseCount = (raw: string | null): number | null => {
    if (!raw) {
        return null;
    }
    const match = raw.match(/(\d+)/);
    if (!match) {
        return null;
    }
    return Math.min(Math.max(Number(match[1]), MIN_DAILY_DOSE_COUNT), MAX_DAILY_DOSE_COUNT);
};

export const parseDurationDays = (raw: string | null): number | null => {
    if (!raw) {
        return null;
    }
    const match = raw.match(/(\d+)\s*(kun|hafta|oy)?/i);
    if (!match) {
        return null;
    }
    const value = Number(match[1]);
    const unit = match[2]?.toLowerCase();
    if (unit === "hafta") {
        return value * 7;
    }
    if (unit === "oy") {
        return value * 30;
    }
    return value;
};

const formatMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// Klinik jihatdan tasdiqlanmagan evristika — dozalar sonini kunning 08:00-22:00 oralig'ida
// teng taqsimlaydi. Bemor uchun aniqroq vaqt kerak bo'lsa, jadvalni hozircha faqat
// to'xtatib (deactivate), qo'lda POST /schedules orqali qayta yaratish mumkin.
export const buildScheduleTimes = (doseCount: number | null): string[] => {
    const n = doseCount ?? 1;
    if (n <= 1) {
        return [DEFAULT_SCHEDULE_TIME];
    }

    const rawStep = (WINDOW_END_MINUTES - WINDOW_START_MINUTES) / (n - 1);
    const step = Math.round(rawStep / 5) * 5;

    return Array.from({ length: n }, (_, i) => {
        const minutes = Math.min(WINDOW_START_MINUTES + i * step, WINDOW_END_MINUTES);
        return formatMinutes(minutes);
    });
};

export const buildDosageNote = (parts: {
    releaseForm: string | null;
    usageMethod: string | null;
    regimen: string | null;
}): string | null => {
    const filled = [parts.releaseForm, parts.usageMethod, parts.regimen].filter((part): part is string => Boolean(part));
    return filled.length > 0 ? filled.join(", ") : null;
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
