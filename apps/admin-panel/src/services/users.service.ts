import { http } from "@/api/http";
import type {
    AdminUser,
    AdminUserDetail,
    BlockUserPayload,
    CreateUserPayload,
    DeleteUserResult,
    Paginated,
    UpdateUserPayload,
    UserListQuery
} from "@/types";

export const usersService = {
    list: (query: UserListQuery) => http.get<Paginated<AdminUser>>("/admin/users", { ...query }),
    get: (id: string) => http.get<AdminUserDetail>(`/admin/users/${id}`),
    create: (payload: CreateUserPayload) => http.post<AdminUser>("/admin/users", payload),
    update: (id: string, payload: UpdateUserPayload) => http.patch<AdminUser>(`/admin/users/${id}`, payload),
    remove: (id: string) => http.delete<DeleteUserResult>(`/admin/users/${id}`),
    block: (id: string, payload: BlockUserPayload) => http.post<AdminUser>(`/admin/users/${id}/block`, payload),
    unblock: (id: string) => http.post<AdminUser>(`/admin/users/${id}/unblock`),
    resetPassword: (id: string, newPassword: string) => http.post<void>(`/admin/users/${id}/reset-password`, { newPassword }),
    revokeSessions: (id: string) => http.post<{ revoked: number }>(`/admin/users/${id}/revoke-sessions`)
};
