import type { Role } from "./user.types";

export interface AuthUser {
    id: string;
    phone: string;
    fullName: string;
    role: Role;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface Session {
    user: AuthUser;
    tokens: AuthTokens;
}
