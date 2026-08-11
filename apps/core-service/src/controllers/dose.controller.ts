import { NextFunction } from "express";
import { DoseService } from "../services/dose.service";
import { DoseEventResponse, DoseListResponse, listDoseQuerySchema } from "../dtos/dose.dto";
import { AuthedRequest, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

export class DoseController {
    public static async list(req: AuthedRequest, res: ResType<DoseListResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const parsed = listDoseQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
            }
            const result = await DoseService.list(req.user.sub, parsed.data);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async confirm(req: AuthedRequest<{ id: string }>, res: ResType<DoseEventResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await DoseService.confirm(req.params.id, req.user.sub);
            res.status(200).json({ success: true, message: "Dori qabul qilindi deb belgilandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async skip(req: AuthedRequest<{ id: string }>, res: ResType<DoseEventResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await DoseService.skip(req.params.id, req.user.sub);
            res.status(200).json({ success: true, message: "O'tkazib yuborilgan deb belgilandi", data: result });
        } catch (error) {
            next(error);
        }
    }
}
