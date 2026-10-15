import { ApiError, http } from "@/api/http";
import { sessionStore } from "@/api/session";
import type { LoginValues } from "@/schemas/auth.schema";
import type { Session } from "@/types";

export const authService = {
    async login(values: LoginValues): Promise<Session> {
        const session = await http.post<Session>("/auth/login", values, { anonymous: true });
        if (session.user.role !== "ADMINISTRATOR") {
            throw new ApiError(403, "Bu panel faqat administratorlar uchun");
        }
        sessionStore.set(session);
        return session;
    },

    async logout(): Promise<void> {
        const session = sessionStore.get();
        sessionStore.set(null);
        if (session) {
            // Server javobi muhim emas — lokal sessiya allaqachon tozalangan
            await http.post("/auth/logout", { refreshToken: session.tokens.refreshToken }, { anonymous: true }).catch(() => undefined);
        }
    }
};
