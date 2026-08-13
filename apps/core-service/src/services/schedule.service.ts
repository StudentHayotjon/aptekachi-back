import { FamilyMember, MedicationSchedule, Prisma, PrescriptionItem, User } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import { CreateScheduleDto, ScheduleOwner, ScheduleResponse } from "../dtos/schedule.dto";
import { buildDosageNote, buildScheduleTimes, isNonDailyDose, parseDailyDoseCount, parseDurationDays, addDays } from "../utils/dose-parser.util";
import { FamilyService } from "./family.service";

const ownerInclude = {
    patient: { select: { id: true, fullName: true } },
    familyMember: { select: { id: true, fullName: true } }
} satisfies Prisma.MedicationScheduleInclude;

type ScheduleWithOwner = MedicationSchedule & {
    patient: Pick<User, "id" | "fullName"> | null;
    familyMember: Pick<FamilyMember, "id" | "fullName"> | null;
};

// Bitta jadval uchun uchta egalik holati: o'zi, guardian to'liq boshqaradigan oila a'zosi,
// yoki faqat-ko'rish uchun ulangan haqiqiy akkaunt.
const resolveOwner = (schedule: ScheduleWithOwner, requesterId: string): ScheduleOwner => {
    if (schedule.familyMember) {
        return { type: "FAMILY_MEMBER", id: schedule.familyMember.id, fullName: schedule.familyMember.fullName };
    }
    if (schedule.patient) {
        return {
            type: schedule.patient.id === requesterId ? "SELF" : "LINKED_ACCOUNT",
            id: schedule.patient.id,
            fullName: schedule.patient.fullName
        };
    }
    throw new AppError(500, "Jadval egasi aniqlanmadi");
};

const isReadable = (schedule: MedicationSchedule, requesterId: string, familyMemberIds: string[], linkedSubjectIds: string[]): boolean =>
    schedule.patientId === requesterId ||
    (schedule.familyMemberId !== null && familyMemberIds.includes(schedule.familyMemberId)) ||
    (schedule.patientId !== null && linkedSubjectIds.includes(schedule.patientId));

// Linked (real akkaunt) subject'lar hech qachon yozish ro'yxatiga kirmaydi — himoya talabi.
const isWritable = (schedule: MedicationSchedule, requesterId: string, familyMemberIds: string[]): boolean =>
    schedule.patientId === requesterId || (schedule.familyMemberId !== null && familyMemberIds.includes(schedule.familyMemberId));

const toScheduleResponse = (schedule: ScheduleWithOwner, requesterId: string): ScheduleResponse => ({
    id: schedule.id,
    patientId: schedule.patientId,
    familyMemberId: schedule.familyMemberId,
    owner: resolveOwner(schedule, requesterId),
    drugId: schedule.drugId,
    drugName: schedule.drugName,
    dosageNote: schedule.dosageNote,
    scheduleTimes: schedule.scheduleTimes,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    isActive: schedule.isActive,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
});

export class ScheduleService {
    public static async create(requesterId: string, dto: CreateScheduleDto): Promise<ScheduleResponse> {
        if (dto.drugId) {
            const drug = await prisma.drug.findUnique({ where: { id: dto.drugId } });
            if (!drug || !drug.isActive) {
                throw new AppError(404, "Dori topilmadi");
            }
        }

        if (dto.familyMemberId) {
            const member = await prisma.familyMember.findUnique({ where: { id: dto.familyMemberId } });
            if (!member || member.guardianId !== requesterId) {
                throw new AppError(403, "Bu oila a'zosi sizga tegishli emas");
            }
        }

        const schedule = await prisma.medicationSchedule.create({
            data: {
                patientId: dto.familyMemberId ? null : requesterId,
                familyMemberId: dto.familyMemberId,
                drugId: dto.drugId,
                drugName: dto.drugName,
                dosageNote: dto.dosageNote,
                scheduleTimes: dto.scheduleTimes,
                startDate: dto.startDate,
                endDate: dto.endDate
            },
            include: ownerInclude
        });

        return toScheduleResponse(schedule, requesterId);
    }

    // F-003: tasdiqlangan retsept (OCR yoki dmed)dagi har bir dori qatoridan avtomatik jadval
    // yaratadi. Halokatga uchramaydigan yon effekt — hech qachon throw qilmaydi, xato/PRN
    // holatlarida shunchaki o'tkazib yuboradi (chaqiruvchi — PrescriptionService — buni bilishi shart emas).
    public static async createFromPrescriptionItems(
        patientId: string,
        items: PrescriptionItem[]
    ): Promise<{ created: number; skipped: number }> {
        let created = 0;
        let skipped = 0;

        for (const item of items) {
            if (isNonDailyDose(item.dailyDoseCount)) {
                console.log(`[schedule] ${item.id}: zarurat bo'yicha ("${item.dailyDoseCount}") — avtomatik jadval o'tkazib yuborildi`);
                skipped++;
                continue;
            }

            try {
                const scheduleTimes = buildScheduleTimes(parseDailyDoseCount(item.dailyDoseCount));
                const durationDays = parseDurationDays(item.duration);
                const startDate = new Date();

                await prisma.medicationSchedule.create({
                    data: {
                        patientId,
                        drugId: item.drugId,
                        drugName: item.drugNameRaw,
                        dosageNote: buildDosageNote(item),
                        scheduleTimes,
                        startDate,
                        endDate: durationDays ? addDays(startDate, durationDays) : null,
                        prescriptionItemId: item.id
                    }
                });
                created++;
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                    console.log(`[schedule] ${item.id}: jadval allaqachon mavjud, o'tkazib yuborildi`);
                } else {
                    console.error(`[schedule] ${item.id} uchun avtomatik jadval yaratishda xato:`, error);
                }
                skipped++;
            }
        }

        return { created, skipped };
    }

    // O'zining, o'zi boshqaradigan oila a'zolarining va faqat-ko'rish uchun ulangan
    // haqiqiy akkauntlarning jadvallarini birlashtirib qaytaradi.
    public static async list(requesterId: string): Promise<ScheduleResponse[]> {
        const [familyMemberIds, linkedSubjectIds] = await Promise.all([
            FamilyService.resolveFamilyMemberIds(requesterId),
            FamilyService.resolveLinkedSubjectIds(requesterId)
        ]);

        const schedules = await prisma.medicationSchedule.findMany({
            where: {
                OR: [
                    { patientId: requesterId },
                    ...(linkedSubjectIds.length > 0 ? [{ patientId: { in: linkedSubjectIds } }] : []),
                    ...(familyMemberIds.length > 0 ? [{ familyMemberId: { in: familyMemberIds } }] : [])
                ]
            },
            include: ownerInclude,
            orderBy: { createdAt: "desc" }
        });

        return schedules.map((schedule) => toScheduleResponse(schedule, requesterId));
    }

    public static async getById(id: string, requesterId: string): Promise<ScheduleResponse> {
        const schedule = await prisma.medicationSchedule.findUnique({ where: { id }, include: ownerInclude });
        if (!schedule) {
            throw new AppError(404, "Jadval topilmadi");
        }

        const [familyMemberIds, linkedSubjectIds] = await Promise.all([
            FamilyService.resolveFamilyMemberIds(requesterId),
            FamilyService.resolveLinkedSubjectIds(requesterId)
        ]);
        if (!isReadable(schedule, requesterId, familyMemberIds, linkedSubjectIds)) {
            throw new AppError(404, "Jadval topilmadi");
        }

        return toScheduleResponse(schedule, requesterId);
    }

    public static async deactivate(id: string, requesterId: string): Promise<ScheduleResponse> {
        const schedule = await prisma.medicationSchedule.findUnique({ where: { id }, include: ownerInclude });
        if (!schedule) {
            throw new AppError(404, "Jadval topilmadi");
        }

        const [familyMemberIds, linkedSubjectIds] = await Promise.all([
            FamilyService.resolveFamilyMemberIds(requesterId),
            FamilyService.resolveLinkedSubjectIds(requesterId)
        ]);
        if (!isWritable(schedule, requesterId, familyMemberIds)) {
            if (isReadable(schedule, requesterId, familyMemberIds, linkedSubjectIds)) {
                throw new AppError(403, "Bu jadval faqat ko'rish uchun ulangan — o'zgartirish mumkin emas");
            }
            throw new AppError(404, "Jadval topilmadi");
        }

        const updated = await prisma.medicationSchedule.update({
            where: { id },
            data: { isActive: false },
            include: ownerInclude
        });

        return toScheduleResponse(updated, requesterId);
    }
}
