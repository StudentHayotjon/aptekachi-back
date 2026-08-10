import { z } from "zod";
import { Role } from "@prisma/client";

const phoneSchema = z.string().regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

export const registerSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak"),
    fullName: z.string().min(2).max(100)
});

export const loginSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(1)
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
    phone: phoneSchema
});

export const resetPasswordSchema = z.object({
    phone: phoneSchema,
    code: z.string().length(6, "Tasdiqlash kodi 6 xonali bo'lishi kerak"),
    newPassword: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export interface AuthUserResponse {
    id: string;
    phone: string;
    fullName: string;
    role: Role;
}

export interface AuthTokensResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface AuthResponse {
    user: AuthUserResponse;
    tokens: AuthTokensResponse;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T | null;
}
