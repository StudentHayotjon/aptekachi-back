import { DoseEvent, DoseStatus, MedicationSchedule } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import { DoseEventResponse, DoseListResponse, ListDoseQueryDto } from "../dtos/dose.dto";
import { FamilyService } from "./family.service";

type DoseEventWithSchedule = DoseEvent & { schedule: MedicationSchedule };

const toDoseResponse = (dose: DoseEventWithSchedule): DoseEventResponse => ({
    id: dose.id,
    scheduleId: dose.scheduleId,
    drugName: dose.schedule.drugName,
    dosageNote: dose.schedule.dosageNote,
    scheduledAt: dose.scheduledAt,
    status: dose.status,
    confirmedAt: dose.confirmedAt,
    remindersSent: dose.remindersSent
});

const isReadable = (schedule: MedicationSchedule, requesterId: string, familyMemberIds: string[], linkedSubjectIds: string[]): boolean =>
    schedule.patientId === requesterId ||
    (schedule.familyMemberId !== null && familyMemberIds.includes(schedule.familyMemberId)) ||
    (schedule.patientId !== null && linkedSubjectIds.includes(schedule.patientId));

const isWritable = (schedule: MedicationSchedule, requesterId: string, familyMemberIds: string[]): boolean =>
    schedule.patientId === requesterId || (schedule.familyMemberId !== null && familyMemberIds.includes(schedule.familyMemberId));

export class DoseService {
    // O'zining, oila a'zolarining va faqat-ko'rish uchun ulangan haqiqiy akkauntlarning
    // dozalarini birlashtirib qaytaradi.
    public static async list(requesterId: string, query: ListDoseQueryDto): Promise<DoseListResponse> {
        const { status, from, to, page, limit } = query;

        const [familyMemberIds, linkedSubjectIds] = await Promise.all([
            FamilyService.resolveFamilyMemberIds(requesterId),
            FamilyService.resolveLinkedSubjectIds(requesterId)
        ]);

        const where = {
            schedule: {
                OR: [
                    { patientId: requesterId },
                    ...(linkedSubjectIds.length > 0 ? [{ patientId: { in: linkedSubjectIds } }] : []),
                    ...(familyMemberIds.length > 0 ? [{ familyMemberId: { in: familyMemberIds } }] : [])
                ]
            },
            ...(status && { status }),
            ...((from || to) && {
                scheduledAt: {
                    ...(from && { gte: from }),
                    ...(to && { lte: to })
                }
            })
        };

        const [items, total] = await prisma.$transaction([
            prisma.doseEvent.findMany({
                where,
                include: { schedule: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { scheduledAt: "desc" }
            }),
            prisma.doseEvent.count({ where })
        ]);

        return { items: items.map(toDoseResponse), total, page, limit };
    }

    // Faqat yozish huquqi bor holatlarni qaytaradi (o'zi + o'zi boshqaradigan oila a'zosi) —
    // faqat-ko'rish uchun ulangan haqiqiy akkauntlar uchun 403, umuman aloqasi bo'lmasa 404.
    private static async findOwned(id: string, requesterId: string): Promise<DoseEventWithSchedule> {
        const dose = await prisma.doseEvent.findUnique({ where: { id }, include: { schedule: true } });
        if (!dose) {
            throw new AppError(404, "Doza topilmadi");
        }

        const [familyMemberIds, linkedSubjectIds] = await Promise.all([
            FamilyService.resolveFamilyMemberIds(requesterId),
            FamilyService.resolveLinkedSubjectIds(requesterId)
        ]);
        if (!isWritable(dose.schedule, requesterId, familyMemberIds)) {
            if (isReadable(dose.schedule, requesterId, familyMemberIds, linkedSubjectIds)) {
                throw new AppError(403, "Bu doza faqat ko'rish uchun ulangan — belgilash mumkin emas");
            }
            throw new AppError(404, "Doza topilmadi");
        }

        return dose;
    }

    public static async confirm(id: string, requesterId: string): Promise<DoseEventResponse> {
        const dose = await this.findOwned(id, requesterId);
        if (dose.status !== DoseStatus.PENDING) {
            throw new AppError(409, "Bu doza allaqachon belgilangan");
        }

        const updated = await prisma.doseEvent.update({
            where: { id },
            data: { status: DoseStatus.TAKEN, confirmedAt: new Date() },
            include: { schedule: true }
        });

        return toDoseResponse(updated);
    }

    public static async skip(id: string, requesterId: string): Promise<DoseEventResponse> {
        const dose = await this.findOwned(id, requesterId);
        if (dose.status !== DoseStatus.PENDING) {
            throw new AppError(409, "Bu doza allaqachon belgilangan");
        }

        const updated = await prisma.doseEvent.update({
            where: { id },
            data: { status: DoseStatus.SKIPPED, confirmedAt: new Date() },
            include: { schedule: true }
        });

        return toDoseResponse(updated);
    }
}
