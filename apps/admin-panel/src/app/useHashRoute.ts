import { useCallback, useEffect, useState } from "react";
import { DEFAULT_ROUTE, ROUTES, type RouteKey } from "./routes";

const read = (): RouteKey => {
    const key = window.location.hash.replace(/^#\/?/, "") as RouteKey;
    return ROUTES.some((r) => r.key === key) ? key : DEFAULT_ROUTE;
};

/** #/users ko'rinishidagi hash-marshrutlash: statik hostingda server sozlamasiz ishlaydi */
export function useHashRoute() {
    const [route, setRoute] = useState<RouteKey>(read);

    useEffect(() => {
        const onChange = () => setRoute(read());
        window.addEventListener("hashchange", onChange);
        return () => window.removeEventListener("hashchange", onChange);
    }, []);

    const navigate = useCallback((key: RouteKey) => {
        window.location.hash = `/${key}`;
    }, []);

    return { route, navigate };
}
