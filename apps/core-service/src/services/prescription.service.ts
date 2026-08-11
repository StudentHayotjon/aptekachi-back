import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prescription, PrescriptionItem, PrescriptionStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { env } from "../config/env.config";
import { AppError } from "../utils/app-error.util";
import { ListPrescriptionQueryDto, PrescriptionListResponse, PrescriptionResponse, RejectPrescriptionDto } from "../dtos/prescription.dto";
import { getDmedAdapter } from "../integrations/dmed/dmed.adapter";

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "prescriptions");

interface OcrPrescriptionItem {
    retsept_id: string;
    himoya_kodi: string;
    bemor_fish: string;
    bemor_yosh: string;
    shifokor: string;
    dori_nomi_xpn: string;
    chiqarilish_shakli: string;
    qabul_qilish_usuli: string;
    kunlik_qabul_soni: string;
    davomiyligi: string;
    qabul_tartibi: string;
    umumiy_miqdori: string;
    izoh: string | null;
    amal_qilish_muddati: string;
}

interface OcrApiResponse {
    success: boolean;
    message: string;
    data?: { retseptlar: OcrPrescriptionItem[] };
}

type PrescriptionWithItems = Prescription & { items: PrescriptionItem[] };
type Requester = { id: string; role: Role };

const toPrescriptionResponse = (prescription: PrescriptionWithItems): PrescriptionResponse => ({
    id: prescription.id,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    source: prescription.source,
    imageUrl: prescription.imageUrl,
    dmedUuid: prescription.dmedUuid,
    status: prescription.status,
    rejectReason: prescription.rejectReason,
    reviewedAt: prescription.reviewedAt,
    items: prescription.items.map((item) => ({
        id: item.id,
        retseptId: item.retseptId,
        himoyaKodi: item.himoyaKodi,
        bemorFish: item.bemorFish,
        bemorYosh: item.bemorYosh,
        shifokorFish: item.shifokorFish,
        drugId: item.drugId,
        drugNameRaw: item.drugNameRaw,
        releaseForm: item.releaseForm,
        usageMethod: item.usageMethod,
        dailyDoseCount: item.dailyDoseCount,
        duration: item.duration,
        regimen: item.regimen,
        totalQuantity: item.totalQuantity,
        note: item.note,
        validUntil: item.validUntil
    })),
    createdAt: prescription.createdAt,
    updatedAt: prescription.updatedAt
});

const analyzeWithOcrService = async (file: Express.Multer.File): Promise<OcrPrescriptionItem[]> => {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);

    let response: Response;
    try {
        response = await fetch(`${env.ocrServiceUrl}/api/ocr/analyze`, { method: "POST", body: formData });
    } catch {
        throw new AppError(502, "OCR xizmatiga ulanib bo'lmadi");
    }

    const json = (await response.json()) as OcrApiResponse;
    if (!response.ok || !json.success || !json.data) {
        throw new AppError(502, json.message || "OCR xizmati retseptni tanib ololmadi");
    }

    return json.data.retseptlar;
};

const saveImage = async (file: Express.Multer.File): Promise<string> => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = file.mimetype === "image/png" ? "png" : file.mimetype === "image/webp" ? "webp" : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
    return `/uploads/prescriptions/${filename}`;
};

export class PrescriptionService {
    public static async create(patientId: string, file: Express.Multer.File): Promise<PrescriptionResponse> {
        const ocrItems = await analyzeWithOcrService(file);
        if (ocrItems.length === 0) {
            throw new AppError(422, "Rasmdan retsept ma'lumotlari aniqlanmadi");
        }

        const imageUrl = await saveImage(file);

        const prescription = await prisma.prescription.create({
            data: {
                patientId,
                imageUrl,
                items: {
                    create: ocrItems.map((item) => ({
                        retseptId: item.retsept_id,
                        himoyaKodi: item.himoya_kodi,
                        bemorFish: item.bemor_fish,
                        bemorYosh: item.bemor_yosh,
                        shifokorFish: item.shifokor,
                        drugNameRaw: item.dori_nomi_xpn,
                        releaseForm: item.chiqarilish_shakli,
                        usageMethod: item.qabul_qilish_usuli,
                        dailyDoseCount: item.kunlik_qabul_soni,
                        duration: item.davomiyligi,
                        regimen: item.qabul_tartibi,
                        totalQuantity: item.umumiy_miqdori,
                        note: item.izoh,
                        validUntil: item.amal_qilish_muddati
                    }))
                }
            },
            include: { items: true }
        });

        return toPrescriptionResponse(prescription);
    }

    public static async importFromDmed(patientId: string, uuid: string): Promise<PrescriptionResponse> {
        const existing = await prisma.prescription.findUnique({ where: { dmedUuid: uuid } });
        if (existing) {
            throw new AppError(409, "Bu dmed retsepti allaqachon import qilingan");
        }

        const dmedData = await getDmedAdapter().fetchPrescription(uuid);
        if (!dmedData) {
            throw new AppError(404, "dmed tizimida bunday retsept topilmadi");
        }

        const prescription = await prisma.prescription.create({
            data: {
                patientId,
                source: "DMED_QR",
                dmedUuid: uuid,
                status: PrescriptionStatus.APPROVED, // dmed retsepti allaqachon shifokor tomonidan rasmiylashtirilgan va imzolangan
                reviewedAt: new Date(),
                items: {
                    create: dmedData.items.map((item) => ({
                        himoyaKodi: dmedData.himoyaKodi,
                        bemorFish: dmedData.bemorFish,
                        bemorYosh: dmedData.bemorYosh,
                        shifokorFish: dmedData.shifokorFish,
                        drugNameRaw: item.drugNameRaw,
                        releaseForm: item.releaseForm,
                        usageMethod: item.usageMethod,
                        dailyDoseCount: item.dailyDoseCount,
                        duration: item.duration,
                        regimen: item.regimen,
                        totalQuantity: item.totalQuantity,
                        note: item.note,
                        validUntil: dmedData.validUntil
                    }))
                }
            },
            include: { items: true }
        });

        return toPrescriptionResponse(prescription);
    }

    public static async list(requester: Requester, query: ListPrescriptionQueryDto): Promise<PrescriptionListResponse> {
        const { status, page, limit } = query;

        const where = {
            ...(status && { status }),
            ...(requester.role === Role.BEMOR && { patientId: requester.id })
        };

        const [items, total] = await prisma.$transaction([
            prisma.prescription.findMany({
                where,
                include: { items: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" }
            }),
            prisma.prescription.count({ where })
        ]);

        return { items: items.map(toPrescriptionResponse), total, page, limit };
    }

    public static async getById(id: string, requester: Requester): Promise<PrescriptionResponse> {
        const prescription = await prisma.prescription.findUnique({ where: { id }, include: { items: true } });
        if (!prescription) {
            throw new AppError(404, "Retsept topilmadi");
        }
        if (requester.role === Role.BEMOR && prescription.patientId !== requester.id) {
            throw new AppError(403, "Bu retseptni ko'rish huquqingiz yo'q");
        }
        return toPrescriptionResponse(prescription);
    }

    public static async approve(id: string, doctorId: string): Promise<PrescriptionResponse> {
        const existing = await prisma.prescription.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Retsept topilmadi");
        }
        if (existing.status !== PrescriptionStatus.PENDING) {
            throw new AppError(409, "Bu retsept allaqachon ko'rib chiqilgan");
        }

        const prescription = await prisma.prescription.update({
            where: { id },
            data: { status: PrescriptionStatus.APPROVED, doctorId, reviewedAt: new Date(), rejectReason: null },
            include: { items: true }
        });

        return toPrescriptionResponse(prescription);
    }

    public static async reject(id: string, doctorId: string, dto: RejectPrescriptionDto): Promise<PrescriptionResponse> {
        const existing = await prisma.prescription.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Retsept topilmadi");
        }
        if (existing.status !== PrescriptionStatus.PENDING) {
            throw new AppError(409, "Bu retsept allaqachon ko'rib chiqilgan");
        }

        const prescription = await prisma.prescription.update({
            where: { id },
            data: { status: PrescriptionStatus.REJECTED, doctorId, reviewedAt: new Date(), rejectReason: dto.reason },
            include: { items: true }
        });

        return toPrescriptionResponse(prescription);
    }
}
