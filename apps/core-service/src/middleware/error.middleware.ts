import { NextFunction } from "express";
import { ReqType, ResType } from "../types/express.types";

export const errorHandler = (err: any, req: ReqType, res: ResType, next: NextFunction): void => {
    console.error("[GLOBAL ERROR]:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Serverda ichki xatolik yuz berdi",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};
