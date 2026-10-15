import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ".", "");
    const target = (env.VITE_API_URL ?? "http://localhost:3001").replace(/\/+$/, "").replace(/\/api\/v1$/, "");

    return {
        plugins: [react()],
        resolve: {
            alias: [{ find: /^@\//, replacement: "/src/" }]
        },
        server: {
            port: 5173,
            // Dev rejimida brauzer so'rovlari shu server orqali core-service'ga uzatiladi —
            // brauzer uchun bir xil manba bo'lgani sababli CORS kerak bo'lmaydi
            proxy: {
                "/api": { target, changeOrigin: true, secure: true },
                "/uploads": { target, changeOrigin: true, secure: true }
            }
        }
    };
});
