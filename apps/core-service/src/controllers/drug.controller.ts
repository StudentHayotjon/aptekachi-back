import { NextFunction } from "express";
import { DrugService } from "../services/drug.service";
import { CreateDrugDto, DrugListResponse, DrugResponse, listDrugQuerySchema, UpdateDrugDto } from "../dtos/drug.dto";
import { ReqType, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

export class DrugController {
    public static async list(req: ReqType, res: ResType<DrugListResponse>, next: NextFunction): Promise<void> {
        try {
            const parsed = listDrugQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
            }
            const result = await DrugService.list(parsed.data);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async getById(req: ReqType<{ id: string }>, res: ResType<DrugResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await DrugService.getById(req.params.id);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async create(req: ReqType<unknown, CreateDrugDto>, res: ResType<DrugResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await DrugService.create(req.body);
            res.status(201).json({ success: true, message: "Dori qo'shildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async update(req: ReqType<{ id: string }, UpdateDrugDto>, res: ResType<DrugResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await DrugService.update(req.params.id, req.body);
            res.status(200).json({ success: true, message: "Dori yangilandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async remove(req: ReqType<{ id: string }>, res: ResType, next: NextFunction): Promise<void> {
        try {
            await DrugService.remove(req.params.id);
            res.status(200).json({ success: true, message: "Dori o'chirildi" });
        } catch (error) {
            next(error);
        }
    }
}
