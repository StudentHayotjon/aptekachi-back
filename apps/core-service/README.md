# Core Service

Modular monolit: `auth` moduli hozircha to'liq ishlaydi (OAuth 2.0 uslubidagi JWT autentifikatsiya, access 15 daqiqa TTL, refresh token rotation, RBAC — Bemor / Shifokor / Administrator). `drug`, `prescription`, `notification` modullari kelayotgan bosqichlarda shu monolit ichiga qo'shiladi. `ocr-service` — Gemini bilan og'ir ishlaydigan qism bo'lgani uchun ataylab alohida servis sifatida qoldirilgan.

Port: **3001**.

## Ishga tushirish

```bash
cp .env.example .env   # DATABASE_URL va JWT_ACCESS_SECRET ni to'ldiring
npm install
npx prisma migrate dev --name init
npm run dev
```

## Tuzilma

```
src/
├── config/            # env, prisma client — umumiy
├── middleware/         # auth, rbac, validate, error — umumiy
├── utils/              # jwt, otp, password, refresh-token — umumiy
├── types/               # express kengaytmalari — umumiy
├── modules/
│   └── auth/            # controller, service, routes, dto — bitta domenga tegishli hammasi bir joyda
│       # kelajakda: modules/drug/, modules/prescription/, modules/notification/
└── server.ts             # barcha modul routerlarini bu yerda mount qilamiz
```

Yangi modul qo'shish: `src/modules/<nom>/` papkasini shu `auth` moduli patternida yarating (`*.controller.ts`, `*.service.ts`, `*.routes.ts`, `*.dto.ts`), so'ng `server.ts`da `app.use("/api/v1/<nom>", <nom>Router)` bilan ulang. Umumiy `middleware/`, `utils/`, `types/` papkalaridan foydalaning — takrorlamang.

## Endpointlar

To'liq API hujjati: [`docs/API.md`](docs/API.md) (hozircha faqat `auth` moduli — `/api/v1/auth/*`).

## Eslatma

- Refresh token — JWT emas, tasodifiy 96-baytli token; DB'da faqat uning SHA-256 xeshi saqlanadi. Refresh oqimida token reuse aniqlansa, foydalanuvchining barcha sessiyalari bekor qilinadi.
- Parolni tiklash kodi 10 daqiqa amal qiladi, bir marta ishlatiladi.
- Prisma bilan ishlashda doim `npx prisma ...` ishlating (loyiha v6 ishlatadi).
- `ocr-service` bilan aloqa hozircha yo'q — `prescription` moduli yozilganda OCR natijasini qanday qabul qilish (sinxron HTTP yoki queue) alohida hal qilinadi.
