import type { DrugSummary } from "./drug.types";

export interface OcrItem {
    retseptId: string | null;
    himoyaKodi: string | null;
    bemorFish: string | null;
    bemorYosh: string | null;
    shifokorFish: string | null;
    drugNameRaw: string;
    releaseForm: string | null;
    usageMethod: string | null;
    dailyDoseCount: string | null;
    duration: string | null;
    regimen: string | null;
    totalQuantity: string | null;
    note: string | null;
    validUntil: string | null;
    matchedDrug: DrugSummary | null;
}

export interface OcrResult {
    items: OcrItem[];
    durationMs: number;
}
