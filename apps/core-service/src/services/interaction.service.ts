import { DrugInteraction, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.client";
import { AppError } from "../utils/app-error.util";
import {
    CreateInteractionDto,
    InteractionListResponse,
    InteractionResponse,
    ListInteractionQueryDto
} from "../dtos/interaction.dto";

// Juftlikni doim bir xil tartibda saqlaymiz — A-B va B-A bir xil yozuv hisoblanishi uchun
// (aks holda ikkala tartib uchun alohida-alohida yozuv kiritilishi mumkin edi).
const sortPair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

const toInteractionResponse = (row: DrugInteraction): InteractionResponse => ({
    id: row.id,
    drugAId: row.drugAId,
    drugBId: row.drugBId,
    severity: row.severity,
    description: row.description,
    createdAt: row.createdAt
});

export class InteractionService {
    public static async create(dto: CreateInteractionDto): Promise<InteractionResponse> {
        const [drugAId, drugBId] = sortPair(dto.drugAId, dto.drugBId);

        const [drugA, drugB] = await Promise.all([
            prisma.drug.findUnique({ where: { id: drugAId } }),
            prisma.drug.findUnique({ where: { id: drugBId } })
        ]);
        if (!drugA || !drugB) {
            throw new AppError(404, "Dori topilmadi");
        }

        const existing = await prisma.drugInteraction.findUnique({
            where: { drugAId_drugBId: { drugAId, drugBId } }
        });
        if (existing) {
            throw new AppError(409, "Bu ikki dori uchun o'zaro ta'sir yozuvi allaqachon mavjud");
        }

        const row = await prisma.drugInteraction.create({
            data: { drugAId, drugBId, severity: dto.severity, description: dto.description }
        });

        return toInteractionResponse(row);
    }

    public static async list(query: ListInteractionQueryDto): Promise<InteractionListResponse> {
        const { page, limit } = query;

        const [items, total] = await prisma.$transaction([
            prisma.drugInteraction.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
            prisma.drugInteraction.count()
        ]);

        return { items: items.map(toInteractionResponse), total, page, limit };
    }

    public static async remove(id: string): Promise<void> {
        const existing = await prisma.drugInteraction.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError(404, "Yozuv topilmadi");
        }
        await prisma.drugInteraction.delete({ where: { id } });
    }

    // Berilgan dorilar to'plami ichida bir-biriga mos keladigan barcha juftliklarni tekshiradi.
    public static async check(drugIds: string[]): Promise<InteractionResponse[]> {
        const uniqueIds = [...new Set(drugIds)];
        const pairs: Prisma.DrugInteractionWhereInput[] = [];

        for (let i = 0; i < uniqueIds.length; i++) {
            for (let j = i + 1; j < uniqueIds.length; j++) {
                const [drugAId, drugBId] = sortPair(uniqueIds[i], uniqueIds[j]);
                pairs.push({ drugAId, drugBId });
            }
        }

        if (pairs.length === 0) {
            return [];
        }

        const rows = await prisma.drugInteraction.findMany({ where: { OR: pairs } });
        return rows.map(toInteractionResponse);
    }
}
