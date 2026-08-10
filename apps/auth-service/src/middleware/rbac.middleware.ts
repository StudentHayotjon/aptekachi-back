import { NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthedRequest, ResType } from "../types/express.types";

export const authorize = (...roles: Role[]) => {
    return (req: AuthedRequest, res: ResType, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Avtorizatsiyadan o'tilmagan" });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: "Bu amal uchun ruxsatingiz yo'q" });
            return;
        }
        next();
    };
};
