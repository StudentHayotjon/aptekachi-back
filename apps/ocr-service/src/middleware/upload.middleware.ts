import multer, { FileFilterCallback, MulterError } from "multer";
import { NextFunction, Request, RequestHandler, Response } from "express";

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

// multer o'z xatolarini `.status`siz chaqiradi — errorHandler'dagi `err.status || 500` bunda oddiy
// foydalanuvchi xatosini ham "500 server xatosi" deb qaytarardi.
export const uploadSingle = (fieldName: string): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        upload.single(fieldName)(req, res, (err: unknown) => {
            if (!err) {
                next();
                return;
            }
            if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
                next(Object.assign(new Error("Fayl hajmi 10MB dan oshmasligi kerak"), { status: 413 }));
                return;
            }
            if (err instanceof Error) {
                next(Object.assign(err, { status: 400 }));
                return;
            }
            next(err);
        });
    };
};
