import { z } from "zod";

export const OCR_MAX_BYTES = 10 * 1024 * 1024;

export const ocrFileSchema = z
    .instanceof(File)
    .refine((f) => f.type.startsWith("image/"), "Faqat rasm fayllari (JPEG, PNG, WEBP) qabul qilinadi")
    .refine((f) => f.size <= OCR_MAX_BYTES, "Fayl hajmi 10MB dan oshmasligi kerak");
