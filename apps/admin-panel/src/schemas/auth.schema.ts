import { z } from "zod";
import { phoneSchema } from "./shared.schema";

export const loginSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(1, "Parolni kiriting")
});

export type LoginForm = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;
