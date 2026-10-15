import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import { errorMessage } from "@/lib/format";

interface ToastItem {
    id: number;
    text: string;
    error: boolean;
}

interface ToastApi {
    success: (text: string) => void;
    error: (e: unknown) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const TOAST_MS = 3800;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);
    const seq = useRef(0);

    const push = useCallback((text: string, error: boolean) => {
        const id = ++seq.current;
        setItems((list) => [...list, { id, text, error }]);
        setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), TOAST_MS);
    }, []);

    const api = useMemo<ToastApi>(() => ({ success: (text) => push(text, false), error: (e) => push(errorMessage(e), true) }), [push]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="toasts" aria-live="polite">
                {items.map((t) => (
                    <div key={t.id} className={`toast ${t.error ? "toast--error" : ""}`}>
                        <Icon name={t.error ? "alert" : "check"} />
                        {t.text}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
    return ctx;
}
