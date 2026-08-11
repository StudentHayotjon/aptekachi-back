import { NextFunction } from "express";
import { ScheduleService } from "../services/schedule.service";
import { CreateScheduleDto, ScheduleResponse } from "../dtos/schedule.dto";
import { AuthedRequest, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

export class ScheduleController {
    public static async create(req: AuthedRequest<unknown, CreateScheduleDto>, res: ResType<ScheduleResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await ScheduleService.create(req.user.sub, req.body);
            res.status(201).json({ success: true, message: "Dori jadvali yaratildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async list(req: AuthedRequest, res: ResType<ScheduleResponse[]>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await ScheduleService.list(req.user.sub);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async getById(req: AuthedRequest<{ id: string }>, res: ResType<ScheduleResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await ScheduleService.getById(req.params.id, req.user.sub);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async deactivate(req: AuthedRequest<{ id: string }>, res: ResType<ScheduleResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await ScheduleService.deactivate(req.params.id, req.user.sub);
            res.status(200).json({ success: true, message: "Jadval to'xtatildi", data: result });
        } catch (error) {
            next(error);
        }
    }
}
