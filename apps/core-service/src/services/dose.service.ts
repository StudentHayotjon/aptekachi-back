import { DoseEvent, DoseStatus, MedicationSchedule } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import { DoseEventResponse, DoseListResponse, ListDoseQueryDto } from "../dtos/dose.dto";

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

export class DoseService {
    public static async list(patientId: string, query: ListDoseQueryDto): Promise<DoseListResponse> {
        const { status, from, to, page, limit } = query;

        const where = {
            schedule: { patientId },
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

    private static async findOwned(id: string, patientId: string): Promise<DoseEventWithSchedule> {
        const dose = await prisma.doseEvent.findUnique({ where: { id }, include: { schedule: true } });
        if (!dose || dose.schedule.patientId !== patientId) {
            throw new AppError(404, "Doza topilmadi");
        }
        return dose;
    }

    public static async confirm(id: string, patientId: string): Promise<DoseEventResponse> {
        const dose = await this.findOwned(id, patientId);
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

    public static async skip(id: string, patientId: string): Promise<DoseEventResponse> {
        const dose = await this.findOwned(id, patientId);
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
