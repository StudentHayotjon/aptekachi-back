import type { PageQuery, SortOrder } from "./common.types";
import type { DoseStatus } from "./stats.types";

export const ROLES = ["BEMOR", "SHIFOKOR", "ADMINISTRATOR"] as const;
export type Role = (typeof ROLES)[number];

export interface AdminUser {
    id: string;
    phone: string;
    fullName: string;
    role: Role;
    /** false — muddatsiz bloklangan */
    isActive: boolean;
    /** Amaldagi vaqtincha blok tugash vaqti; blok yo'q yoki muddati o'tgan bo'lsa null */
    blockedUntil: string | null;
    blockReason: string | null;
    createdAt: string;
}

export type UserAccessState = "active" | "temporary" | "blocked";

export const accessState = (u: Pick<AdminUser, "isActive" | "blockedUntil">): UserAccessState =>
    !u.isActive ? "blocked" : u.blockedUntil && new Date(u.blockedUntil).getTime() > Date.now() ? "temporary" : "active";

export interface BlockUserPayload {
    /** ISO vaqt — vaqtincha blok; null — muddatsiz */
    until: string | null;
    reason?: string;
}

export interface DeleteUserResult {
    id: string;
    deleted: { prescriptions: number; schedules: number; familyMembers: number };
}

export interface AdminUserDetail extends AdminUser {
    updatedAt: string;
    lastLoginAt: string | null;
    activeSessions: number;
    counts: {
        prescriptions: number;
        reviewedPrescriptions: number;
        activeSchedules: number;
        familyMembers: number;
        careLinksAsViewer: number;
        careLinksAsSubject: number;
    };
    doses30d: { byStatus: Record<DoseStatus, number>; adherenceRate: number | null };
}

export interface UserListQuery extends PageQuery {
    search?: string;
    role?: Role | "";
    isActive?: "true" | "false" | "";
    sortBy?: "createdAt" | "fullName" | "phone";
    order?: SortOrder;
}

export interface CreateUserPayload {
    phone: string;
    password: string;
    fullName: string;
    role: Role;
}

export type UpdateUserPayload = Partial<Pick<AdminUser, "phone" | "fullName" | "role">>;
