import { genAi } from "../config/gemini.config";
import { prescriptionSchema, PrescriptionResponse } from "../dtos/presicription.dto";

export class OcrService {
    public static async extractPrescription(fileBuffer: Buffer, mimeType: string): Promise<PrescriptionResponse> {
        const imagePart = {
            inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType
            }
        }
        const prompt = `
            Siz dorixona tizimi (Aptekachi loyihasi) uchun tibbiy retseptlarni aniq taniy oladigan professional OCR tizimisiz.
            Rasmdagi DMED retsept cheklaridan barcha ma'lumotlarni 100% aniqlik bilan o'qib oling.
            Agar rasmda yonma-yon yoki ketma-ket bir nechta retsept bo'lsa, ularning har birini alohida ob'ekt qilib massivga joylang.
            Matn harflariga, dorilar nomiga va raqamlarga juda e'tiborli bo'ling.
        `;
        const response = await genAi.models.generateContent({
            model: "models/gemini-flash-latest",
            contents: [imagePart, prompt],
            config: {
                responseMimeType: "application/json",
                responseSchema: prescriptionSchema,
                temperature: 0.0
            }
        })
        if (!response.text) {
            throw new Error("Modeldan bo'sh javib qaytdi")
        }
        return JSON.parse(response.text) as PrescriptionResponse;
    }
}