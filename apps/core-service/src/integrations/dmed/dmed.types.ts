// dmed API javobi (TZ §2.3 "dmed — haqiqatda qanday ishlaydi?"): GET /prescription/{uuid}.
// Real API kalitlari kelmaguncha bu shakl taxminiy — real integratsiyada dmed hujjatiga
// qarab moslashtiriladi, lekin PrescriptionService bu interfeysga bog'liq bo'lgani uchun
// faqat DmedAdapter implementatsiyasi almashtiriladi, qolgan tizim o'zgarmaydi.
export interface DmedPrescriptionItem {
    drugNameRaw: string;
    releaseForm?: string;
    usageMethod?: string;
    dailyDoseCount?: string;
    duration?: string;
    regimen?: string;
    totalQuantity?: string;
    note?: string;
}

export interface DmedPrescriptionData {
    uuid: string;
    himoyaKodi: string;
    bemorFish: string;
    bemorYosh: string;
    shifokorFish: string;
    validUntil: string;
    items: DmedPrescriptionItem[];
}

export interface DmedAdapter {
    fetchPrescription(uuid: string): Promise<DmedPrescriptionData | null>;
}
