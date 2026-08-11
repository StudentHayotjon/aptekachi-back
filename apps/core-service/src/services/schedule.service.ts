import { MedicationSchedule, Prisma, PrescriptionItem } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import { CreateScheduleDto, ScheduleResponse } from "../dtos/schedule.dto";
import { buildDosageNote, buildScheduleTimes, isNonDailyDose, parseDailyDoseCount, parseDurationDays, addDays } from "../utils/dose-parser.util";

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
