import { NextFunction } from "express";
import { z, ZodTypeAny } from "zod";
import { AdminService } from "../services/admin.service";
import { AdminUserResponse, UpdateUserStatusDto, UserListResponse } from "../dtos/auth.dto";
import { DrugResponse } from "../dtos/drug.dto";
import { PaginatedResponse } from "../dtos/common.dto";
import {
    AdminBlockUserDto,
    AdminCreateUserDto,
    DeleteUserResponse,
    AdminDrugListResponse,
    AdminInteractionResponse,
    adminListDrugsQuerySchema,
    adminListInteractionsQuerySchema,
    adminListPrescriptionsQuerySchema,
    adminListUsersQuerySchema,
    AdminPrescriptionResponse,
    AdminResetPasswordDto,
    AdminStatsResponse,
    AdminUpdateInteractionDto,
    AdminUpdateStockDto,
    AdminUpdateUserDto,
    AdminUserDetailResponse,
    OcrAnalyzeResponse,
    statsQuerySchema,
    SystemHealthResponse
} from "../dtos/admin.dto";
import { AuthedRequest, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

const parseQuery = <S extends ZodTypeAny>(schema: S, query: unknown): z.output<S> => {
    const parsed = schema.safeParse(query);
    if (!parsed.success) {
        throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
    }
    return parsed.data;
};

// authenticate middleware'dan keyin chaqiriladi, shuning uchun req.user doim mavjud
const actorId = (req: AuthedRequest): string => {
    if (!req.user) {
        throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
    }
    return req.user.sub;
};

export class AdminController {
    public static async systemHealth(req: AuthedRequest, res: ResType<SystemHealthResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.systemHealth();
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async analyzeOcr(req: AuthedRequest, res: ResType<OcrAnalyzeResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                throw new AppError(400, "Retsept rasmi yuklanmadi (maydon nomi: file)");
            }
            const result = await AdminService.analyzeOcr(req.file);
            res.status(200).json({ success: true, message: "Ma'lumotlar aniqlandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async stats(req: AuthedRequest, res: ResType<AdminStatsResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.stats(parseQuery(statsQuerySchema, req.query));
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    // ---------- Foydalanuvchilar ----------

    public static async listUsers(req: AuthedRequest, res: ResType<UserListResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.listUsers(parseQuery(adminListUsersQuerySchema, req.query));
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async getUser(req: AuthedRequest<{ id: string }>, res: ResType<AdminUserDetailResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.getUser(req.params.id);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async createUser(
        req: AuthedRequest<unknown, AdminCreateUserDto>,
        res: ResType<AdminUserResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.createUser(req.body);
            res.status(201).json({ success: true, message: "Foydalanuvchi yaratildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async updateUser(
        req: AuthedRequest<{ id: string }, AdminUpdateUserDto>,
        res: ResType<AdminUserResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.updateUser(actorId(req), req.params.id, req.body);
            res.status(200).json({ success: true, message: "Foydalanuvchi yangilandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async updateUserStatus(
        req: AuthedRequest<{ id: string }, UpdateUserStatusDto>,
        res: ResType<AdminUserResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.setUserStatus(actorId(req), req.params.id, req.body.isActive);
            res.status(200).json({ success: true, message: "Foydalanuvchi holati yangilandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async blockUser(
        req: AuthedRequest<{ id: string }, AdminBlockUserDto>,
        res: ResType<AdminUserResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.blockUser(actorId(req), req.params.id, req.body);
            const message = result.blockedUntil ? "Foydalanuvchi vaqtincha bloklandi" : "Foydalanuvchi bloklandi";
            res.status(200).json({ success: true, message, data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async unblockUser(req: AuthedRequest<{ id: string }>, res: ResType<AdminUserResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.unblockUser(req.params.id);
            res.status(200).json({ success: true, message: "Foydalanuvchi blokdan chiqarildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async deleteUser(req: AuthedRequest<{ id: string }>, res: ResType<DeleteUserResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.deleteUser(actorId(req), req.params.id);
            res.status(200).json({ success: true, message: "Foydalanuvchi o'chirildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async resetUserPassword(
        req: AuthedRequest<{ id: string }, AdminResetPasswordDto>,
        res: ResType,
        next: NextFunction
    ): Promise<void> {
        try {
            await AdminService.resetUserPassword(req.params.id, req.body);
            res.status(200).json({ success: true, message: "Parol yangilandi, foydalanuvchining barcha sessiyalari yopildi" });
        } catch (error) {
            next(error);
        }
    }

    public static async revokeUserSessions(
        req: AuthedRequest<{ id: string }>,
        res: ResType<{ revoked: number }>,
        next: NextFunction
    ): Promise<void> {
        try {
            const revoked = await AdminService.revokeUserSessions(req.params.id);
            res.status(200).json({ success: true, message: "Barcha sessiyalar yopildi", data: { revoked } });
        } catch (error) {
            next(error);
        }
    }

    // ---------- Retseptlar ----------

    public static async listPrescriptions(
        req: AuthedRequest,
        res: ResType<PaginatedResponse<AdminPrescriptionResponse>>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.listPrescriptions(parseQuery(adminListPrescriptionsQuerySchema, req.query));
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async getPrescription(
        req: AuthedRequest<{ id: string }>,
        res: ResType<AdminPrescriptionResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.getPrescription(req.params.id);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    // ---------- Dorilar ----------

    public static async listDrugs(req: AuthedRequest, res: ResType<AdminDrugListResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.listDrugs(parseQuery(adminListDrugsQuerySchema, req.query));
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async getDrug(req: AuthedRequest<{ id: string }>, res: ResType<DrugResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.getDrug(req.params.id);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async restoreDrug(req: AuthedRequest<{ id: string }>, res: ResType<DrugResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AdminService.restoreDrug(req.params.id);
            res.status(200).json({ success: true, message: "Dori qayta faollashtirildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async updateDrugStock(
        req: AuthedRequest<{ id: string }, AdminUpdateStockDto>,
        res: ResType<DrugResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.updateDrugStock(req.params.id, req.body);
            res.status(200).json({ success: true, message: "Qoldiq yangilandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    // ---------- O'zaro ta'sirlar ----------

    public static async listInteractions(
        req: AuthedRequest,
        res: ResType<PaginatedResponse<AdminInteractionResponse>>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.listInteractions(parseQuery(adminListInteractionsQuerySchema, req.query));
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async updateInteraction(
        req: AuthedRequest<{ id: string }, AdminUpdateInteractionDto>,
        res: ResType<AdminInteractionResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AdminService.updateInteraction(req.params.id, req.body);
            res.status(200).json({ success: true, message: "O'zaro ta'sir yangilandi", data: result });
        } catch (error) {
            next(error);
        }
    }
}
