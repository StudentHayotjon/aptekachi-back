import cron from "node-cron";
import { DoseStatus } from "@prisma/client";
import { prisma } from "../config/prisma.client";

// F-003 Smart eslatma tizimi — soddalashtirilgan MVP versiyasi (TZ: FCM/APNs + Bull Queue o'rniga,
// mobil ilova/queue infratuzilmasi hali yo'q). Ikkita fon jarayoni:
// 1) har 5 daqiqada — vaqti kelgan (lekin hali yaratilmagan) doza hodisalarini yaratadi
// 2) har soat boshida — javob berilmagan (PENDING) o'tkazib yuborilgan dozalar uchun qayta eslatadi
const GENERATE_CRON = "*/5 * * * *";
const NAG_CRON = "0 * * * *";
const NAG_INTERVAL_MS = 60 * 60 * 1000;

const pad = (n: number): string => n.toString().padStart(2, "0");

export const generateDueDoseEvents = async (): Promise<void> => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const schedules = await prisma.medicationSchedule.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: todayStart } }]
        }
    });

    for (const schedule of schedules) {
        for (const time of schedule.scheduleTimes) {
            const [hours, minutes] = time.split(":").map(Number);
            const scheduledAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
            if (scheduledAt > now) {
                continue;
            }

            await prisma.doseEvent.upsert({
                where: { scheduleId_scheduledAt: { scheduleId: schedule.id, scheduledAt } },
                update: {},
                create: { scheduleId: schedule.id, scheduledAt }
            });
        }
    }
};

// TODO: Eskiz.uz/push integratsiyasi ulanganda shu yerga real yuborish qo'shiladi (auth-service'dagi
// forgot-password'dagi [SMS STUB] pattern'iga o'xshash)
const sendReminderStub = (phone: string, drugName: string, scheduledAt: Date, attempt: number): void => {
    const time = `${pad(scheduledAt.getHours())}:${pad(scheduledAt.getMinutes())}`;
    console.log(`[REMINDER STUB] ${phone} — "${drugName}" dozasi (${time}) hali tasdiqlanmagan. ${attempt}-eslatma: "Dorini ichdingizmi?"`);
};

export const nagOverdueDoses = async (): Promise<void> => {
    const now = new Date();
    const nagThreshold = new Date(now.getTime() - NAG_INTERVAL_MS);

    const overdue = await prisma.doseEvent.findMany({
        where: {
            status: DoseStatus.PENDING,
            scheduledAt: { lte: now },
            OR: [{ lastReminderAt: null }, { lastReminderAt: { lte: nagThreshold } }]
        },
        include: { schedule: { include: { patient: true, familyMember: { include: { guardian: true } } } } }
    });

    for (const dose of overdue) {
        // Oila a'zosi (akkauntsiz) jadvali bo'lsa — eslatma guardian'ning raqamiga yuboriladi.
        const recipientPhone = dose.schedule.patient?.phone ?? dose.schedule.familyMember?.guardian.phone;
        if (!recipientPhone) {
            console.error(`[dose-scheduler] ${dose.id}: eslatma qabul qiluvchisi topilmadi, o'tkazib yuborildi`);
            continue;
        }

        sendReminderStub(recipientPhone, dose.schedule.drugName, dose.scheduledAt, dose.remindersSent + 1);
        await prisma.doseEvent.update({
            where: { id: dose.id },
            data: { remindersSent: { increment: 1 }, lastReminderAt: now }
        });
    }
};

export const startDoseJobs = (): void => {
    cron.schedule(GENERATE_CRON, () => {
        generateDueDoseEvents().catch((error) => console.error("[dose-scheduler] generateDueDoseEvents xatosi:", error));
    });
    cron.schedule(NAG_CRON, () => {
        nagOverdueDoses().catch((error) => console.error("[dose-scheduler] nagOverdueDoses xatosi:", error));
    });

    // Server ishga tushganda darhol bir marta ham ishga tushiramiz — birinchi 5 daqiqani/1 soatni kutib o'tirmaslik uchun
    generateDueDoseEvents().catch((error) => console.error("[dose-scheduler] boshlang'ich generatsiya xatosi:", error));
};
