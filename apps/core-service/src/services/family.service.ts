import { CareLink, FamilyMember, Prisma, User } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import {
    CareLinkListResponse,
    CareLinkResponse,
    CareLinkUserSummary,
    CreateCareLinkDto,
    CreateFamilyMemberDto,
    FamilyMemberResponse
} from "../dtos/family.dto";

const toFamilyMemberResponse = (member: FamilyMember): FamilyMemberResponse => ({
    id: member.id,
    guardianId: member.guardianId,
    fullName: member.fullName,
    relationship: member.relationship,
    birthDate: member.birthDate,
    createdAt: member.createdAt
});

const toUserSummary = (user: User): CareLinkUserSummary => ({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone
});

const toCareLinkResponse = (link: CareLink & { viewer: User; subject: User }): CareLinkResponse => ({
    id: link.id,
    createdAt: link.createdAt,
    viewer: toUserSummary(link.viewer),
    subject: toUserSummary(link.subject)
});

export class FamilyService {
    // schedule.service.ts va dose.service.ts'da qayta ishlatiladi — guardian to'liq
    // boshqara oladigan akkauntsiz profillar ro'yxati.
    public static async resolveFamilyMemberIds(guardianId: string): Promise<string[]> {
        const members = await prisma.familyMember.findMany({
            where: { guardianId },
            select: { id: true }
        });
        return members.map((member) => member.id);
    }

    // schedule.service.ts va dose.service.ts'da qayta ishlatiladi — faqat-ko'rish huquqi
    // berilgan haqiqiy akkauntlar ro'yxati (himoya talabi: yozish ro'yxatiga kirmaydi).
    public static async resolveLinkedSubjectIds(viewerId: string): Promise<string[]> {
        const links = await prisma.careLink.findMany({
            where: { viewerId },
            select: { subjectId: true }
        });
        return links.map((link) => link.subjectId);
    }

    public static async createFamilyMember(guardianId: string, dto: CreateFamilyMemberDto): Promise<FamilyMemberResponse> {
        const member = await prisma.familyMember.create({
            data: {
                guardianId,
                fullName: dto.fullName,
                relationship: dto.relationship,
                birthDate: dto.birthDate
            }
        });
        return toFamilyMemberResponse(member);
    }

    public static async listFamilyMembers(guardianId: string): Promise<FamilyMemberResponse[]> {
        const members = await prisma.familyMember.findMany({
            where: { guardianId },
            orderBy: { createdAt: "desc" }
        });
        return members.map(toFamilyMemberResponse);
    }

    public static async removeFamilyMember(id: string, guardianId: string): Promise<void> {
        const member = await prisma.familyMember.findUnique({ where: { id } });
        if (!member || member.guardianId !== guardianId) {
            throw new AppError(404, "Oila a'zosi topilmadi");
        }
        await prisma.familyMember.delete({ where: { id } });
    }

    public static async createCareLink(viewerId: string, dto: CreateCareLinkDto): Promise<CareLinkResponse> {
        const subject = await prisma.user.findUnique({ where: { phone: dto.phone } });
        if (!subject) {
            throw new AppError(404, "Bu raqamli foydalanuvchi topilmadi");
        }
        if (subject.id === viewerId) {
            throw new AppError(400, "O'zingizga ulanib bo'lmaydi");
        }

        try {
            const link = await prisma.careLink.create({
                data: { viewerId, subjectId: subject.id },
                include: { viewer: true, subject: true }
            });
            return toCareLinkResponse(link);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new AppError(409, "Bu akkauntga allaqachon ulangansiz");
            }
            throw error;
        }
    }

    public static async listCareLinks(userId: string): Promise<CareLinkListResponse> {
        const [watching, watchedBy] = await Promise.all([
            prisma.careLink.findMany({ where: { viewerId: userId }, include: { viewer: true, subject: true }, orderBy: { createdAt: "desc" } }),
            prisma.careLink.findMany({ where: { subjectId: userId }, include: { viewer: true, subject: true }, orderBy: { createdAt: "desc" } })
        ]);

        return {
            watching: watching.map(toCareLinkResponse),
            watchedBy: watchedBy.map(toCareLinkResponse)
        };
    }

    // Ulanishni ikkala tomon ham (kuzatuvchi yoki kuzatiladigan) bekor qila oladi.
    public static async removeCareLink(id: string, userId: string): Promise<void> {
        const link = await prisma.careLink.findUnique({ where: { id } });
        if (!link || (link.viewerId !== userId && link.subjectId !== userId)) {
            throw new AppError(404, "Ulanish topilmadi");
        }
        await prisma.careLink.delete({ where: { id } });
    }
}
