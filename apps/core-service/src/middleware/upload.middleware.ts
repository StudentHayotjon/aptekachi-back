import multer, { FileFilterCallback, MulterError } from "multer";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../utils/app-error.util";

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Faqat rasm fayllari (JPEG, PNG, WEBP) yuklanishi mumkin!"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// multer o'z xatolarini (fayl hajmi, fileFilter) `.status`siz Error/MulterError sifatida chaqiradi —
// global errorHandler bunda `err.status || 500`ga tushib, oddiy foydalanuvchi xatosini ham "500 server
// xatosi" deb qaytarardi. Shu wrapper ularni loyihadagi umumiy AppError konvensiyasiga o'tkazadi.
export const uploadSingle = (fieldName: string): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        upload.single(fieldName)(req, res, (err: unknown) => {
            if (!err) {
                next();
                return;
            }
            if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
                next(new AppError(413, "Fayl hajmi 10MB dan oshmasligi kerak"));
                return;
            }
            if (err instanceof Error) {
                next(new AppError(400, err.message));
                return;
            }
            next(err);
        });
    };
};
