import { NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import {
    AdminUserResponse,
    AuthResponse,
    AuthUserResponse,
    ForgotPasswordDto,
    listUsersQuerySchema,
    LoginDto,
    ProvisionUserDto,
    RefreshDto,
    RegisterDto,
    ResetPasswordDto,
    UpdateUserStatusDto,
    UserListResponse
} from "../dtos/auth.dto";
import { AuthedRequest, ReqType, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

export class AuthController {
    public static async register(req: ReqType<unknown, RegisterDto>, res: ResType<AuthResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, message: "Ro'yxatdan muvaffaqiyatli o'tdingiz", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async login(req: ReqType<unknown, LoginDto>, res: ResType<AuthResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.login(req.body);
            res.status(200).json({ success: true, message: "Tizimga muvaffaqiyatli kirdingiz", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async refresh(req: ReqType<unknown, RefreshDto>, res: ResType<AuthResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.refresh(req.body.refreshToken);
            res.status(200).json({ success: true, message: "Token yangilandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async logout(req: ReqType<unknown, RefreshDto>, res: ResType, next: NextFunction): Promise<void> {
        try {
            await AuthService.logout(req.body.refreshToken);
            res.status(200).json({ success: true, message: "Tizimdan chiqdingiz" });
        } catch (error) {
            next(error);
        }
    }

    public static async me(req: AuthedRequest, res: ResType<AuthUserResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await AuthService.me(req.user.sub);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async listUsers(req: AuthedRequest, res: ResType<UserListResponse>, next: NextFunction): Promise<void> {
        try {
            const parsed = listUsersQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
            }
            const result = await AuthService.listUsers(parsed.data);
            res.status(200).json({ success: true, message: "OK", data: result });
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
            const result = await AuthService.updateUserStatus(req.params.id, req.body);
            res.status(200).json({ success: true, message: "Foydalanuvchi holati yangilandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async provision(
        req: AuthedRequest<unknown, ProvisionUserDto>,
        res: ResType<AdminUserResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await AuthService.provision(req.body);
            res.status(201).json({ success: true, message: "Foydalanuvchi yaratildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async forgotPassword(req: ReqType<unknown, ForgotPasswordDto>, res: ResType, next: NextFunction): Promise<void> {
        try {
            await AuthService.forgotPassword(req.body);
            res.status(200).json({
                success: true,
                message: "Agar bu raqam ro'yxatdan o'tgan bo'lsa, tasdiqlash kodi yuborildi"
            });
        } catch (error) {
            next(error);
        }
    }

    public static async resetPassword(req: ReqType<unknown, ResetPasswordDto>, res: ResType, next: NextFunction): Promise<void> {
        try {
            await AuthService.resetPassword(req.body);
            res.status(200).json({ success: true, message: "Parol muvaffaqiyatli yangilandi" });
        } catch (error) {
            next(error);
        }
    }
}
