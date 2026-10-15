import { NextFunction } from "express";
import { env } from "../config/env.config";
import { ReqType, ResType } from "../types/express.types";

// Brauzerdagi admin panel API'ga murojaat qila olishi uchun. Ruxsat etilgan manbalar CORS_ORIGINS
// muhit o'zgaruvchisida vergul bilan beriladi; bo'sh bo'lsa CORS sarlavhalari umuman qo'yilmaydi
// (mobil ilova uchun CORS kerak emas). Token Authorization sarlavhasida yuriladi, cookie ishlatilmaydi.
export const cors = (req: ReqType, res: ResType, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (origin && (env.corsOrigins.includes("*") || env.corsOrigins.includes(origin))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
        res.setHeader("Access-Control-Max-Age", "600");
    }

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    next();
};
