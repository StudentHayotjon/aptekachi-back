import { useState } from "react";

/**
 * Ro'yxat sahifalari uchun filtr holati: istalgan filtr o'zgarsa sahifa 1 ga qaytadi.
 * `set("role")(value)` ko'rinishida komponentlarga to'g'ridan-to'g'ri uzatish qulay.
 */
export function useListQuery<F extends object>(initial: F) {
    const [filters, setFilters] = useState<F>(initial);
    const [page, setPage] = useState(1);

    const set =
        <K extends keyof F>(key: K) =>
        (value: F[K]) => {
            setFilters((prev) => ({ ...prev, [key]: value }));
            setPage(1);
        };

    return { filters, set, page, setPage };
}
