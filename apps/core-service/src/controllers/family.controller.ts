import { NextFunction } from "express";
import { FamilyService } from "../services/family.service";
import {
    CareLinkListResponse,
    CareLinkResponse,
    CreateCareLinkDto,
    CreateFamilyMemberDto,
    FamilyMemberResponse
} from "../dtos/family.dto";
import { AuthedRequest, ResType } from "../types/express.types";
import { AppError } from "../utils/app-error.util";

export class FamilyController {
    public static async createFamilyMember(
        req: AuthedRequest<unknown, CreateFamilyMemberDto>,
        res: ResType<FamilyMemberResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await FamilyService.createFamilyMember(req.user.sub, req.body);
            res.status(201).json({ success: true, message: "Oila a'zosi qo'shildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async listFamilyMembers(req: AuthedRequest, res: ResType<FamilyMemberResponse[]>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await FamilyService.listFamilyMembers(req.user.sub);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async removeFamilyMember(req: AuthedRequest<{ id: string }>, res: ResType, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            await FamilyService.removeFamilyMember(req.params.id, req.user.sub);
            res.status(200).json({ success: true, message: "Oila a'zosi o'chirildi" });
        } catch (error) {
            next(error);
        }
    }

    public static async createCareLink(
        req: AuthedRequest<unknown, CreateCareLinkDto>,
        res: ResType<CareLinkResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await FamilyService.createCareLink(req.user.sub, req.body);
            res.status(201).json({ success: true, message: "Akkauntga ulanildi", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async listCareLinks(req: AuthedRequest, res: ResType<CareLinkListResponse>, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            const result = await FamilyService.listCareLinks(req.user.sub);
            res.status(200).json({ success: true, message: "OK", data: result });
        } catch (error) {
            next(error);
        }
    }

    public static async removeCareLink(req: AuthedRequest<{ id: string }>, res: ResType, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError(401, "Avtorizatsiyadan o'tilmagan");
            }
            await FamilyService.removeCareLink(req.params.id, req.user.sub);
            res.status(200).json({ success: true, message: "Ulanish bekor qilindi" });
        } catch (error) {
            next(error);
        }
    }
}
