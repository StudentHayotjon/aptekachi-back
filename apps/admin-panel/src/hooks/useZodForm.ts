import { useState } from "react";
import type { z } from "zod";
import { errorMessage } from "@/lib/format";

type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Zod sxemasi bilan ishlaydigan yengil forma holati.
 * - values: input qiymatlari (sxemaning kirish turi)
 * - errors: maydon bo'yicha birinchi xato matni
 * - submit(onValid): sxemadan o'tsa, tozalangan/aylantirilgan qiymat bilan onValid chaqiriladi;
 *   onValid tashlagan xato (masalan server xatosi) formError'ga yoziladi
 */
export function useZodForm<S extends z.ZodType<unknown, Record<string, unknown>>>(schema: S, initial: z.input<S>) {
    type In = z.input<S>;
    const [values, setValues] = useState<In>(initial);
    const [errors, setErrors] = useState<FieldErrors<In>>({});
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const set =
        <K extends keyof In>(key: K) =>
        (value: In[K]) => {
            setValues((prev) => ({ ...prev, [key]: value }));
            setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
        };

    const submit = async (onValid: (data: z.output<S>) => Promise<void> | void): Promise<void> => {
        const result = schema.safeParse(values);
        if (!result.success) {
            const next: FieldErrors<In> = {};
            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof In | undefined;
                if (key !== undefined && !next[key]) next[key] = issue.message;
                else if (key === undefined) setFormError(issue.message);
            }
            setErrors(next);
            return;
        }
        setErrors({});
        setFormError("");
        setSubmitting(true);
        try {
            await onValid(result.data);
        } catch (e) {
            setFormError(errorMessage(e));
        } finally {
            setSubmitting(false);
        }
    };

    return { values, errors, formError, submitting, set, submit, setValues };
}
