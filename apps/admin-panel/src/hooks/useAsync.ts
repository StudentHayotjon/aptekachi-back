import { useCallback, useEffect, useState, type DependencyList } from "react";
import { errorMessage } from "@/lib/format";

export interface AsyncState<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    reload: () => void;
}

/** deps o'zgarganda load() qayta chaqiriladi; eskirgan javoblar e'tiborsiz qoldiriladi */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        load()
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(errorMessage(e));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick]);

    const reload = useCallback(() => setTick((t) => t + 1), []);
    return { data, error, loading, reload };
}
