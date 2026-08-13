import { Prisma, User } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { env } from "../config/env.config";
import { AppError } from "../utils/app-error.util";
import { hashPassword, comparePassword } from "../utils/password.util";
import { signAccessToken } from "../utils/jwt.util";
import { generateRefreshToken, hashRefreshToken } from "../utils/refresh-token.util";
import { generateOtpCode, hashOtpCode } from "../utils/otp.util";
import {
    AdminUserResponse,
    AuthResponse,
    AuthUserResponse,
    ForgotPasswordDto,
    ListUsersQueryDto,
    LoginDto,
    ProvisionUserDto,
    RegisterDto,
    ResetPasswordDto,
    UpdateUserStatusDto,
    UserListResponse
} from "../dtos/auth.dto";

const toUserResponse = (user: User): AuthUserResponse => ({
    id: user.id,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role
});

const toAdminUserResponse = (user: User): AdminUserResponse => ({
    ...toUserResponse(user),
    isActive: user.isActive,
    createdAt: user.createdAt
});
const issueTokens = async (user: User): Promise<AuthResponse["tokens"]> => {
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { token: refreshToken, tokenHash } = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.jwt.refreshTtlDays);

    await prisma.refreshToken.create({
        data: { userId: user.id, tokenHash, expiresAt }
    });

    return { accessToken, refreshToken, expiresIn: env.jwt.accessTtl };
};

export class AuthService {
    public static async register(dto: RegisterDto): Promise<AuthResponse> {
        const existing = await prisma.user.findUnique({ where: { phone: dto.phone } });
        if (existing) {
            throw new AppError(409, "Bu telefon raqami bilan foydalanuvchi allaqachon ro'yxatdan o'tgan");
        }

        const passwordHash = await hashPassword(dto.password);
        const user = await prisma.user.create({
            data: { phone: dto.phone, passwordHash, fullName: dto.fullName }
        });

        return { user: toUserResponse(user), tokens: await issueTokens(user) };
    }

    public static async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await prisma.user.findUnique({ where: { phone: dto.phone } });
        if (!user || !user.isActive) {
            throw new AppError(401, "Telefon raqam yoki parol noto'g'ri");
        }

        const passwordMatches = await comparePassword(dto.password, user.passwordHash);
        if (!passwordMatches) {
            throw new AppError(401, "Telefon raqam yoki parol noto'g'ri");
        }

        return { user: toUserResponse(user), tokens: await issueTokens(user) };
    }

    public static async refresh(rawToken: string): Promise<AuthResponse> {
        const tokenHash = hashRefreshToken(rawToken);
        const existing = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });

        if (!existing) {
            throw new AppError(401, "Refresh token yaroqsiz");
        }

        if (existing.revokedAt) {
            // Token qayta ishlatilmoqda — o'g'irlangan bo'lishi mumkin, foydalanuvchining barcha tokenlarini bekor qilamiz
            await prisma.refreshToken.updateMany({
                where: { userId: existing.userId, revokedAt: null },
                data: { revokedAt: new Date() }
            });
            throw new AppError(401, "Refresh token yaroqsiz, qaytadan tizimga kiring");
        }

        if (existing.expiresAt < new Date()) {
            throw new AppError(401, "Refresh token muddati o'tgan, qaytadan tizimga kiring");
        }

        if (!existing.user.isActive) {
            throw new AppError(401, "Foydalanuvchi faol emas");
        }

        await prisma.refreshToken.update({
            where: { id: existing.id },
            data: { revokedAt: new Date() }
        });

        return { user: toUserResponse(existing.user), tokens: await issueTokens(existing.user) };
    }

    public static async logout(rawToken: string): Promise<void> {
        const tokenHash = hashRefreshToken(rawToken);
        await prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() }
        });
    }

    public static async me(userId: string): Promise<AuthUserResponse> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }
        return toUserResponse(user);
    }

    public static async listUsers(query: ListUsersQueryDto): Promise<UserListResponse> {
        const { role, isActive, search, page, limit } = query;

        const where: Prisma.UserWhereInput = {
            ...(role && { role }),
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { phone: { contains: search, mode: "insensitive" } },
                    { fullName: { contains: search, mode: "insensitive" } }
                ]
            })
        };

        const [items, total] = await prisma.$transaction([
            prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
            prisma.user.count({ where })
        ]);

        return { items: items.map(toAdminUserResponse), total, page, limit };
    }

    public static async updateUserStatus(id: string, dto: UpdateUserStatusDto): Promise<AdminUserResponse> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Foydalanuvchi topilmadi");
        }

        const user = await prisma.user.update({ where: { id }, data: { isActive: dto.isActive } });

        if (!dto.isActive) {
            // Bloklangan foydalanuvchining barcha sessiyalari bekor qilinadi (majburiy chiqish)
            await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
        }

        return toAdminUserResponse(user);
    }

    public static async provision(dto: ProvisionUserDto): Promise<AdminUserResponse> {
        const existing = await prisma.user.findUnique({ where: { phone: dto.phone } });
        if (existing) {
            throw new AppError(409, "Bu telefon raqami bilan foydalanuvchi allaqachon mavjud");
        }

        const passwordHash = await hashPassword(dto.password);
        const user = await prisma.user.create({
            data: { phone: dto.phone, passwordHash, fullName: dto.fullName, role: dto.role }
        });

        return toAdminUserResponse(user);
    }

    public static async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
        const user = await prisma.user.findUnique({ where: { phone: dto.phone } });
        if (!user || !user.isActive) {
            // Foydalanuvchi mavjudligini oshkor qilmaslik uchun jim qaytamiz
            return;
        }

        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() }
        });

        const code = generateOtpCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + env.passwordReset.codeTtlMinutes);

        await prisma.passwordResetToken.create({
            data: { userId: user.id, codeHash: hashOtpCode(code), expiresAt }
        });

        // TODO: Eskiz.uz SMS integratsiyasi ulanganda shu yerga real yuborish qo'shiladi
        console.log(`[SMS STUB] ${dto.phone} uchun parolni tiklash kodi: ${code}`);
    }

    public static async resetPassword(dto: ResetPasswordDto): Promise<void> {
        const user = await prisma.user.findUnique({ where: { phone: dto.phone } });
        if (!user) {
            throw new AppError(400, "Kod yaroqsiz yoki muddati o'tgan");
        }

        const resetToken = await prisma.passwordResetToken.findFirst({
            where: { userId: user.id, codeHash: hashOtpCode(dto.code), usedAt: null },
            orderBy: { createdAt: "desc" }
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            throw new AppError(400, "Kod yaroqsiz yoki muddati o'tgan");
        }

        const passwordHash = await hashPassword(dto.newPassword);

        await prisma.$transaction([
            prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
            prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
            prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } })
        ]);
    }
}
