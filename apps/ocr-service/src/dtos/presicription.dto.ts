import { Type } from '@google/genai';

export interface PrescriptionItem {
    retsept_id: string;
    himoya_kodi: string;
    bemor_fish: string;
    bemor_yosh: string;
    shifokor: string;
    dori_nomi_xpn: string;
    chiqarilish_shakli: string;
    qabul_qilish_usuli: string;
    kunlik_qabul_soni: string;
    davomiyligi: string;
    qabul_tartibi: string;
    umumiy_miqdori: string;
    izoh: string | null;
    amal_qilish_muddati: string;
}

export interface PrescriptionResponse {
    retseptlar: PrescriptionItem[];
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T | null;
}

export const prescriptionSchema = {
    type: Type.OBJECT,
    properties: {
        retseptlar: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    retsept_id: { type: Type.STRING, description: "Retsept ID raqami (masalan, MAB1361987)" },
                    himoya_kodi: { type: Type.STRING },
                    bemor_fish: { type: Type.STRING },
                    bemor_yosh: { type: Type.STRING },
                    shifokor: { type: Type.STRING },
                    dori_nomi_xpn: { type: Type.STRING, description: "XPN bo'yicha dori nomi va dozasi" },
                    chiqarilish_shakli: { type: Type.STRING },
                    qabul_qilish_usuli: { type: Type.STRING },
                    kunlik_qabul_soni: { type: Type.STRING },
                    davomiyligi: { type: Type.STRING },
                    qabul_tartibi: { type: Type.STRING },
                    umumiy_miqdori: { type: Type.STRING },
                    izoh: { type: Type.STRING, nullable: true },
                    amal_qilish_muddati: { type: Type.STRING }
                },
                required: ["retsept_id", "bemor_fish", "dori_nomi_xpn", "kunlik_qabul_soni"]
            }
        }
    },
    required: ["retseptlar"]
};