import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/config";

type ThemeChoice = "light" | "dark" | null; // null — tizim sozlamasiga ergashadi

const read = (): ThemeChoice => {
    try {
        const v = localStorage.getItem(STORAGE_KEYS.theme);
        return v === "light" || v === "dark" ? v : null;
    } catch {
        return null;
    }
};

export function useTheme() {
    const [choice, setChoice] = useState<ThemeChoice>(read);
    const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (choice) root.dataset.theme = choice;
        else delete root.dataset.theme;
        try {
            if (choice) localStorage.setItem(STORAGE_KEYS.theme, choice);
            else localStorage.removeItem(STORAGE_KEYS.theme);
        } catch {
            /* e'tiborsiz */
        }
    }, [choice]);

    const isDark = choice === "dark" || (choice === null && systemDark);
    return { isDark, toggle: () => setChoice(isDark ? "light" : "dark") };
}
