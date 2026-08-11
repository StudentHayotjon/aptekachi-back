import { NextFunction } from "express";
import { PrescriptionService } from "../services/prescription.service";
import {
    DmedImportDto,
    listPrescriptionQuerySchema,
    PrescriptionListResponse,
    PrescriptionResponse,
    RejectPrescriptionDto
} from "../dtos/prescription.dto";
import { AuthedRequest, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

export class PrescriptionController {
    public static async create(req: AuthedRequest, res: ResType<PrescriptionResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            if (!req.file) {
                throw new AppError(400, "Retsept rasmi yuklanmadi");
            }
            const result = await PrescriptionService.create(req.user.sub, req.file);
            res.status(201).json({ success: true, message: "Retsept qabul qilindi, ko'rib chiqilmoqda", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async importFromDmed(
        req: AuthedRequest<unknown, DmedImportDto>,
        res: ResType<PrescriptionResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await PrescriptionService.importFromDmed(req.user.sub, req.body.uuid);
            res.status(201).json({ success: true, message: "Retsept dmed'dan import qilindi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async list(req: AuthedRequest, res: ResType<PrescriptionListResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const parsed = listPrescriptionQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                throw new AppError(400, parsed.error.issues.map((issue) => issue.message).join(", "));
            }
            const result = await PrescriptionService.list({ id: req.user.sub, role: req.user.role }, parsed.data);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async getById(req: AuthedRequest<{ id: string }>, res: ResType<PrescriptionResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await PrescriptionService.getById(req.params.id, { id: req.user.sub, role: req.user.role });
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async approve(req: AuthedRequest<{ id: string }>, res: ResType<PrescriptionResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await PrescriptionService.approve(req.params.id, req.user.sub);
            res.status(200).json({ success: true, message: "Retsept tasdiqlandi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async reject(
        req: AuthedRequest<{ id: string }, RejectPrescriptionDto>,
        res: ResType<PrescriptionResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await PrescriptionService.reject(req.params.id, req.user.sub, req.body);
            res.status(200).json({ success: true, message: "Retsept rad etildi", data: result });
        } catch (error) {
            next(error);
        }
    }
}
