export interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data?: T | null;
}

export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export interface PageQuery {
    page?: number;
    limit?: number;
}

export type SortOrder = "asc" | "desc";

/** Query qiymatlari: bo'sh satr, null yoki undefined so'rovga qo'shilmaydi */
export type QueryParams = Record<string, string | number | boolean | undefined | null>;
