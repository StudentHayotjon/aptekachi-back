import { Drug, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import { CreateDrugDto, DrugListResponse, DrugResponse, ListDrugQueryDto, UpdateDrugDto } from "../dtos/drug.dto";
import { DrugMatchCandidate } from "../utils/drug-matcher.util";

const toDrugResponse = (drug: Drug): DrugResponse => ({
    id: drug.id,
    name: drug.name,
    internationalName: drug.internationalName,
    manufacturer: drug.manufacturer,
    country: drug.country,
    dosageForm: drug.dosageForm,
    dosage: drug.dosage,
    packageSize: drug.packageSize,
    barcode: drug.barcode,
    price: Number(drug.price),
    stock: drug.stock,
    requiresPrescription: drug.requiresPrescription,
    description: drug.description,
    imageUrl: drug.imageUrl,
    isActive: drug.isActive,
    createdAt: drug.createdAt,
    updatedAt: drug.updatedAt
});

export class DrugService {
    public static async list(query: ListDrugQueryDto): Promise<DrugListResponse> {
        const { search, dosageForm, requiresPrescription, isActive, page, limit } = query;

        const where: Prisma.DrugWhereInput = {
            isActive: isActive ?? true,
            ...(dosageForm ? { dosageForm } : {}),
            ...(requiresPrescription !== undefined ? { requiresPrescription } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { internationalName: { contains: search, mode: "insensitive" } }
                ]
            } : {})
        };

        const [items, total] = await prisma.$transaction([
            prisma.drug.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" } }),
            prisma.drug.count({ where })
        ]);

        return { items: items.map(toDrugResponse), total, page, limit };
    }

    // prescription.service.ts'dagi Levenshtein fuzzy-matching uchun — faqat faol dorilar, kerakli maydonlar
    public static async listMatchCandidates(): Promise<DrugMatchCandidate[]> {
        return prisma.drug.findMany({
            where: { isActive: true },
            select: { id: true, name: true, internationalName: true }
        });
    }

    public static async getById(id: string): Promise<DrugResponse> {
        const drug = await prisma.drug.findUnique({ where: { id } });
        if (!drug || !drug.isActive) {
            throw new AppError(404, "Dori topilmadi");
        }
        return toDrugResponse(drug);
    }

    public static async create(dto: CreateDrugDto): Promise<DrugResponse> {
        if (dto.barcode) {
            const existing = await prisma.drug.findUnique({ where: { barcode: dto.barcode } });
            if (existing) {
                throw new AppError(409, "Bu shtrix-kod bilan dori allaqachon mavjud");
            }
        }

        const drug = await prisma.drug.create({ data: dto });
        return toDrugResponse(drug);
    }

    public static async update(id: string, dto: UpdateDrugDto): Promise<DrugResponse> {
        const existing = await prisma.drug.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Dori topilmadi");
        }

        const drug = await prisma.drug.update({ where: { id }, data: dto });
        return toDrugResponse(drug);
    }

    public static async remove(id: string): Promise<void> {
        const existing = await prisma.drug.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Dori topilmadi");
        }

        await prisma.drug.update({ where: { id }, data: { isActive: false } });
    }
}
