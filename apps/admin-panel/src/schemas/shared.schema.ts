import { z } from "zod";

export const PHONE_RE = /^\+998\d{9}$/;

/** "90 123 45 67", "998901234567" yoki "+998 90 ..." → "+998901234567" */
export const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 9) return `+998${digits}`;
    if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
    return raw.trim();
};

export const phoneSchema = z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(PHONE_RE, "Telefon +998 XX XXX XX XX formatida bo'lishi kerak"));

export const passwordSchema = z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak");

export const fullNameSchema = z.string().trim().min(2, "Ism kamida 2 belgi bo'lishi kerak").max(100, "Ism juda uzun");

/** Bo'sh qoldirilgan ixtiyoriy matn maydoni so'rovga yuborilmaydi */
export const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max, `Ko'pi bilan ${max} belgi`)
        .transform((v) => (v === "" ? undefined : v));

/** Input'dan kelgan matnni butun songa aylantiradi */
export const intFromString = (message: string) =>
    z
        .string()
        .trim()
        .min(1, message)
        .transform(Number)
        .pipe(z.number({ error: message }).int(message).min(0, message));
