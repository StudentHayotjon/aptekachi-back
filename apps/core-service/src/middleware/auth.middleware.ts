import { NextFunction } from "express";
import { AuthedRequest, ResType } from "../types/express.types";
import { verifyAccessToken } from "../utils/jwt.util";

export const authenticate = (req: AuthedRequest, res: ResType, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Avtorizatsiya tokeni topilmadi" });
        return;
    }

    const token = header.slice(7);
    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        res.status(401).json({ success: false, message: "Token yaroqsiz yoki muddati o'tgan" });
    }
};
