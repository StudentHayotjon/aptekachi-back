import { useEffect, useState } from "react";
import { sessionStore } from "@/api/session";
import type { Session } from "@/types";

/** Joriy sessiya; login/logout yoki token muddati tugaganda avtomatik yangilanadi */
export function useSession(): Session | null {
    const [session, setSession] = useState<Session | null>(() => sessionStore.get());
    useEffect(() => sessionStore.subscribe(setSession), []);
    return session;
}
