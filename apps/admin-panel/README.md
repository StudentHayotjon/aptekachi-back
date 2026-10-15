# Aptekachi admin panel

Web boshqaruv paneli (Vite + React + TypeScript + Zod). Faqat `core-service` bilan gaplashadi: OCR xizmati tashqariga ochilmaydi, panel unga core'dagi himoyalangan `POST /api/v1/admin/ocr/analyze` proksisi orqali murojaat qiladi. Kirish faqat `ADMINISTRATOR` roli uchun.

## Ishga tushirish

```bash
cp .env.example .env      # VITE_API_URL — core-service manzili (/api/v1 siz)
npm install
npm run dev               # http://localhost:5173
```

Dev rejimida so'rovlar Vite proksisi orqali core-service'ga uzatiladi, shuning uchun CORS sozlash shart emas. Production build brauzerdan to'g'ridan-to'g'ri `VITE_API_URL` ga murojaat qiladi — u holda core'ning `CORS_ORIGINS` ida panel domeni bo'lishi kerak.

```bash
npm run typecheck
npm run build             # typecheck + dist/
```

## Tuzilma

```
src/
├── app/              Ilova ildizi: App (auth gate), marshrutlar ro'yxati, hash-router, AppContext
├── api/              HTTP qatlami: fetch o'rami, xatolar (ApiError), token yangilash, sessiya ombori
├── services/         Domen bo'yicha API servislari — sahifalar faqat shular orqali so'rov yuboradi
├── types/            Backend javoblari va so'rov parametrlari turlari (domen bo'yicha fayllar)
├── schemas/          Zod sxemalari: formalarni tekshirish va input → payload aylantirish
├── hooks/            useAsync, useZodForm, useListQuery, useDebounced, useTheme, useSession ...
├── lib/              Konfiguratsiya, formatlash, yorliqlar (labels), cx
├── components/
│   ├── ui/           Umumiy primitivlar: Button, Card, Field, Modal, Drawer, DataTable, Toast ...
│   ├── badges/       Domen nishonlari: RoleBadge, StatusBadge, SeverityBadge, ActiveBadge
│   ├── charts/       SVG grafiklar: AreaChart, Sparkline, Donut, Ring
│   ├── layout/       AppLayout, Sidebar, Topbar
│   └── icons/        Ikonkalar to'plami
├── pages/<sahifa>/
│   ├── <Sahifa>Page.tsx   Sahifa: holat, ma'lumot yuklash, kompozitsiya (lazy-load qilinadi)
│   └── components/        Faqat shu sahifaga tegishli komponentlar (formalar, drawer, kataklar)
└── styles/           tokens → base → layout → components → pages
```

Qoidalar:

- Sahifa yoki komponent `fetch` ni to'g'ridan-to'g'ri chaqirmaydi — faqat `services/*`.
- Har bir forma `schemas/*` dagi zod sxemasi va `useZodForm` bilan ishlaydi; sxema chiqishi to'g'ridan-to'g'ri servisga uzatiladigan payload bo'ladi.
- Bir sahifadan tashqarida ishlatiladigan komponent `components/` ga ko'chiriladi.
- Ranglar va o'lchamlar faqat `styles/tokens.css` dagi CSS o'zgaruvchilari orqali.

## Railway

Alohida servis sifatida: Root Directory `/apps/admin-panel`, Config File `/apps/admin-panel/railway.json`. Variables: `VITE_API_URL=https://<core-service domeni>` (build vaqtida kodga yoziladi). Public domain yarating va uni core-service'ning `CORS_ORIGINS` iga qo'shing.

API ma'lumotnomasi: [docs/ADMIN-API.md](../../docs/ADMIN-API.md).
