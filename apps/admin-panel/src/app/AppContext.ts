import { createContext, useContext } from "react";
import type { RouteKey } from "./routes";
import type { Session } from "@/types";

export interface AppContextValue {
    session: Session;
    navigate: (key: RouteKey) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

/** Sahifalar ichida joriy admin va navigatsiyaga kirish */
export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp AppContext ichida ishlatilishi kerak");
    return ctx;
}
