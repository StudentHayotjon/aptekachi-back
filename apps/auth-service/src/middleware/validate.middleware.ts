import { NextFunction } from "express";
import { ZodSchema } from "zod";
import { ReqType, ResType } from "../types/express.types";

export const validate = (schema: ZodSchema) => {
    return (req: ReqType, res: ResType, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.error.issues.map((issue) => issue.message).join(", ")
            });
            return;
        }
        req.body = result.data;
        next();
    };
};
