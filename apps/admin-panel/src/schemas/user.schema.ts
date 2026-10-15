import { z } from "zod";
import { ROLES } from "@/types";
import { fullNameSchema, passwordSchema, phoneSchema } from "./shared.schema";

export const createUserSchema = z.object({
    fullName: fullNameSchema,
    phone: phoneSchema,
    role: z.enum(ROLES, { error: "Rolni tanlang" }),
    password: passwordSchema
});

export const updateUserSchema = createUserSchema.omit({ password: true });

export const resetPasswordSchema = z.object({
    newPassword: passwordSchema
});

const HOUR = 60 * 60 * 1000;

/** Tez tanlanadigan blok muddatlari; "custom" — sana/vaqtni qo'lda kiritish, "forever" — muddatsiz */
export const BLOCK_DURATIONS = {
    "1h": { label: "1 soat", ms: HOUR },
    "24h": { label: "24 soat", ms: 24 * HOUR },
    "7d": { label: "7 kun", ms: 7 * 24 * HOUR },
    "30d": { label: "30 kun", ms: 30 * 24 * HOUR },
    custom: { label: "Sana tanlash", ms: 0 },
    forever: { label: "Muddatsiz", ms: 0 }
} as const;
export type BlockDuration = keyof typeof BLOCK_DURATIONS;
const BLOCK_DURATION_KEYS = Object.keys(BLOCK_DURATIONS) as [BlockDuration, ...BlockDuration[]];

/** Forma → BlockUserPayload: muddat tanloviga qarab "until" hisoblanadi */
export const blockUserSchema = z
    .object({
        duration: z.enum(BLOCK_DURATION_KEYS),
        customUntil: z.string(), // <input type="datetime-local"> qiymati
        reason: z.string().trim().max(300, "Sabab 300 belgidan oshmasligi kerak")
    })
    .superRefine((v, ctx) => {
        if (v.duration !== "custom") return;
        const at = new Date(v.customUntil).getTime();
        if (!v.customUntil || Number.isNaN(at)) {
            ctx.addIssue({ code: "custom", path: ["customUntil"], message: "Blok tugash vaqtini tanlang" });
        } else if (at <= Date.now()) {
            ctx.addIssue({ code: "custom", path: ["customUntil"], message: "Vaqt kelajakda bo'lishi kerak" });
        } else if (at > Date.now() + 365 * 24 * HOUR) {
            ctx.addIssue({ code: "custom", path: ["customUntil"], message: "Vaqtincha blok 365 kundan oshmasligi kerak" });
        }
    })
    .transform((v) => ({
        until:
            v.duration === "forever"
                ? null
                : v.duration === "custom"
                  ? new Date(v.customUntil).toISOString()
                  : new Date(Date.now() + BLOCK_DURATIONS[v.duration].ms).toISOString(),
        reason: v.reason || undefined
    }));

export type BlockUserForm = z.input<typeof blockUserSchema>;
export type CreateUserForm = z.input<typeof createUserSchema>;
export type UpdateUserForm = z.input<typeof updateUserSchema>;
export type ResetPasswordForm = z.input<typeof resetPasswordSchema>;
