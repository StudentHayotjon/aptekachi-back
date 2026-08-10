import { NextFunction } from "express";
import { OcrService } from "../services/ocr.service";
import { PrescriptionResponse } from "../dtos/presicription.dto";
import { ReqType, ResType } from "../types/express.types";

export class OcrController {
    public static async analyzePrescription(req: ReqType, res: ResType<PrescriptionResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "Fayl yuklashda muammo yuzaga keldi"
                })
                return;
            }
            const extractData = await OcrService.extractPrescription(req.file.buffer, req.file.mimetype)
            res.status(200).json({
                success: true,
                data: extractData,
                message: "Malumotlar aniqlandi."
            })
        } catch (error) {
            next(error);
        }
    }
}