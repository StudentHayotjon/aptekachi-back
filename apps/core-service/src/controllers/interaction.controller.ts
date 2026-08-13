import { NextFunction } from "express";
import { InteractionService } from "../services/interaction.service";
import {
    CheckInteractionsDto,
    CreateInteractionDto,
    InteractionListResponse,
    InteractionResponse,
    listInteractionQuerySchema
} from "../dtos/interaction.dto";
import { ReqType, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

export class InteractionController {
    public static async create(req: ReqType<unknown, CreateInteractionDto>, res: ResType<InteractionResponse>, next: NextFunction): Promise<void> {
        try {
            const result = await InteractionService.create(req.body);
            res.status(201).json({ success: true, message: "O'zaro ta'sir yozuvi qo'shildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async list(req: ReqType, res: ResType<InteractionListResponse>, next: NextFunction): Promise<void> {
        try {
            const parsed = listInteractionQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
            }
            const result = await InteractionService.list(parsed.data);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async remove(req: ReqType<{ id: string }>, res: ResType, next: NextFunction): Promise<void> {
        try {
            await InteractionService.remove(req.params.id);
            res.status(200).json({ success: true, message: "Yozuv o'chirildi" });
        } catch (error) {
            next(error);
        }
    }

    public static async check(req: ReqType<unknown, CheckInteractionsDto>, res: ResType<InteractionResponse[]>, next: NextFunction): Promise<void> {
        try {
            const result = await InteractionService.check(req.body.drugIds);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }
}
