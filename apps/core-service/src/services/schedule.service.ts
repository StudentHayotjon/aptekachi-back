import { MedicationSchedule } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import { CreateScheduleDto, ScheduleResponse } from "../dtos/schedule.dto";

const toScheduleResponse = (schedule: MedicationSchedule): ScheduleResponse => ({
    id: schedule.id,
    patientId: schedule.patientId,
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
    public static async create(patientId: string, dto: CreateScheduleDto): Promise<ScheduleResponse> {
        if (dto.drugId) {
            const drug = await prisma.drug.findUnique({ where: { id: dto.drugId } });
            if (!drug || !drug.isActive) {
                throw new AppError(404, "Dori topilmadi");
            }
        }

        const schedule = await prisma.medicationSchedule.create({
            data: {
                patientId,
                drugId: dto.drugId,
                drugName: dto.drugName,
                dosageNote: dto.dosageNote,
                scheduleTimes: dto.scheduleTimes,
                startDate: dto.startDate,
                endDate: dto.endDate
            }
        });

        return toScheduleResponse(schedule);
    }

    public static async list(patientId: string): Promise<ScheduleResponse[]> {
        const schedules = await prisma.medicationSchedule.findMany({
            where: { patientId },
            orderBy: { createdAt: "desc" }
        });
        return schedules.map(toScheduleResponse);
    }

    public static async getById(id: string, patientId: string): Promise<ScheduleResponse> {
        const schedule = await prisma.medicationSchedule.findUnique({ where: { id } });
        if (!schedule || schedule.patientId !== patientId) {
            throw new AppError(404, "Jadval topilmadi");
        }
        return toScheduleResponse(schedule);
    }

    public static async deactivate(id: string, patientId: string): Promise<ScheduleResponse> {
        const schedule = await prisma.medicationSchedule.findUnique({ where: { id } });
        if (!schedule || schedule.patientId !== patientId) {
            throw new AppError(404, "Jadval topilmadi");
        }

        const updated = await prisma.medicationSchedule.update({
            where: { id },
            data: { isActive: false }
        });

        return toScheduleResponse(updated);
    }
}
