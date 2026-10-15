import type { PageQuery, SortOrder } from "./common.types";

export type PrescriptionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PrescriptionSource = "OCR" | "DMED_QR";

export interface UserSummary {
    id: string;
    phone: string;
    fullName: string;
}

export interface PrescriptionItem {
    id: string;
    retseptId: string | null;
    himoyaKodi: string | null;
    bemorFish: string | null;
    bemorYosh: string | null;
    shifokorFish: string | null;
    drugId: string | null;
    drugNameRaw: string;
    releaseForm: string | null;
    usageMethod: string | null;
    dailyDoseCount: string | null;
    duration: string | null;
    regimen: string | null;
    totalQuantity: string | null;
    note: string | null;
    validUntil: string | null;
}

export interface Prescription {
    id: string;
    patientId: string;
    doctorId: string | null;
    source: PrescriptionSource;
    imageUrl: string | null;
    dmedUuid: string | null;
    status: PrescriptionStatus;
    rejectReason: string | null;
    reviewedAt: string | null;
    items: PrescriptionItem[];
    createdAt: string;
    updatedAt: string;
    patient: UserSummary;
    doctor: UserSummary | null;
}

export interface PrescriptionListQuery extends PageQuery {
    search?: string;
    status?: PrescriptionStatus | "";
    source?: PrescriptionSource | "";
    from?: string;
    to?: string;
    order?: SortOrder;
}
