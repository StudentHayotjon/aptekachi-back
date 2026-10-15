import { API_BASE } from "@/lib/config";
import type { ApiEnvelope, QueryParams, Session } from "@/types";
import { sessionStore } from "./session";

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

type Body = object | FormData | undefined;

interface RequestOptions {
    query?: QueryParams;
    body?: Body;
    /** Authorization sarlavhasisiz (login/refresh/logout) */
    anonymous?: boolean;
}

const buildUrl = (path: string, query?: QueryParams): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
};

const parse = async <T>(response: Response): Promise<T> => {
    const text = await response.text();
    let envelope: Partial<ApiEnvelope<T>> = {};
    try {
        envelope = text ? JSON.parse(text) : {};
    } catch {
        throw new ApiError(response.status, `Server kutilmagan javob qaytardi (${response.status})`);
    }
    if (!response.ok || envelope.success === false) {
        throw new ApiError(response.status, envelope.message || `So'rov bajarilmadi (${response.status})`);
    }
    return envelope.data as T;
};

const send = async (method: string, path: string, { query, body, anonymous }: RequestOptions): Promise<Response> => {
    const headers: Record<string, string> = {};
    const session = anonymous ? null : sessionStore.get();
    if (session) headers.Authorization = `Bearer ${session.tokens.accessToken}`;
    if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

    try {
        return await fetch(buildUrl(path, query), {
            method,
            headers,
            body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new ApiError(0, "Serverga ulanib bo'lmadi. Internet aloqasini yoki VITE_API_URL ni tekshiring.");
    }
};

// Bir vaqtda bir nechta 401 kelsa ham token faqat bir marta yangilanadi
let refreshing: Promise<boolean> | null = null;

const refreshSession = (): Promise<boolean> => {
    refreshing ??= (async () => {
        const current = sessionStore.get();
        if (!current) return false;
        try {
            const response = await send("POST", "/auth/refresh", {
                body: { refreshToken: current.tokens.refreshToken },
                anonymous: true
            });
            sessionStore.set(await parse<Session>(response));
            return true;
        } catch {
            return false;
        } finally {
            refreshing = null;
        }
    })();
    return refreshing;
};

const request = async <T>(method: string, path: string, options: RequestOptions = {}): Promise<T> => {
    let response = await send(method, path, options);

    if (response.status === 401 && !options.anonymous && sessionStore.get()) {
        if (await refreshSession()) {
            response = await send(method, path, options);
        } else {
            sessionStore.set(null); // App sessiya o'zgarishini eshitib login sahifasiga qaytaradi
            throw new ApiError(401, "Sessiya muddati tugadi, qaytadan kiring");
        }
    }

    return parse<T>(response);
};

// Bir xil GET so'rovi javob kelguncha qayta yuborilmaydi — mavjud promise qayta ishlatiladi.
// (React StrictMode dev rejimida effektlarni ikki marta chaqiradi; bir nechta komponent bir xil
// ma'lumotni so'raganda ham serverga va bazaga ortiqcha bosim tushmaydi.)
const inflight = new Map<string, Promise<unknown>>();

const dedupedGet = <T>(path: string, query?: QueryParams): Promise<T> => {
    const key = buildUrl(path, query);
    const existing = inflight.get(key);
    if (existing) return existing as Promise<T>;
    const promise = request<T>("GET", path, { query }).finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
};

export const http = {
    get: dedupedGet,
    post: <T>(path: string, body?: Body, options?: Omit<RequestOptions, "body">) => request<T>("POST", path, { ...options, body }),
    put: <T>(path: string, body?: Body) => request<T>("PUT", path, { body }),
    patch: <T>(path: string, body?: Body) => request<T>("PATCH", path, { body }),
    delete: <T>(path: string) => request<T>("DELETE", path)
};
