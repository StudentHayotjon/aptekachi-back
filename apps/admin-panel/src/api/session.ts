import { STORAGE_KEYS } from "@/lib/config";
import type { Session } from "@/types";

// localStorage xususiy rejimda yoki bloklanganda xato tashlashi mumkin — u holda sessiya faqat xotirada yashaydi
let memory: Session | null = null;
const listeners = new Set<(session: Session | null) => void>();

export const sessionStore = {
    get(): Session | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.session);
            memory = raw ? (JSON.parse(raw) as Session) : memory;
        } catch {
            /* xotiradagi qiymat ishlatiladi */
        }
        return memory;
    },

    set(session: Session | null): void {
        memory = session;
        try {
            if (session) localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
            else localStorage.removeItem(STORAGE_KEYS.session);
        } catch {
            /* e'tiborsiz */
        }
        listeners.forEach((listener) => listener(session));
    },

    /** Sessiya o'zgarganda (login, logout, muddati tugashi) chaqiriladi */
    subscribe(listener: (session: Session | null) => void): () => void {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }
};
