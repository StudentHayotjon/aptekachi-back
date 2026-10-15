import type { PageQuery, SortOrder } from "./common.types";

export const DOSAGE_FORMS = ["TABLETKA", "KAPSULA", "SIROP", "INYEKSIYA", "MALHAM", "TOMCHI", "SPREY", "BOSHQA"] as const;
export type DosageForm = (typeof DOSAGE_FORMS)[number];

export interface Drug {
    id: string;
    name: string;
    internationalName: string | null;
    manufacturer: string;
    country: string | null;
    dosageForm: DosageForm;
    dosage: string | null;
    packageSize: string | null;
    barcode: string | null;
    price: number;
    stock: number;
    requiresPrescription: boolean;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DrugSummary {
    id: string;
    name: string;
    internationalName: string | null;
}

export interface DrugListQuery extends PageQuery {
    search?: string;
    isActive?: "true" | "false" | "";
    dosageForm?: DosageForm | "";
    requiresPrescription?: "true" | "false" | "";
    maxStock?: number;
    sortBy?: "name" | "price" | "stock" | "createdAt" | "updatedAt";
    order?: SortOrder;
}

export interface DrugPayload {
    name: string;
    manufacturer: string;
    dosageForm: DosageForm;
    price: number;
    requiresPrescription: boolean;
    internationalName?: string;
    country?: string;
    dosage?: string;
    packageSize?: string;
    barcode?: string;
    description?: string;
    imageUrl?: string;
    stock?: number;
}

export type StockPayload = { stock: number } | { delta: number };
