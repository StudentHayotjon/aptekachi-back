import { http } from "@/api/http";
import type { OcrResult } from "@/types";

// OCR xizmati tashqariga ochilmagan — core-service'ning himoyalangan proksisi orqali chaqiriladi
export const ocrService = {
    analyze: (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return http.post<OcrResult>("/admin/ocr/analyze", form);
    }
};
