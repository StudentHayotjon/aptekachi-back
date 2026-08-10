# Core Service

Modular monolit: `auth` va `drug` modullari hozircha to'liq ishlaydi. `auth` — OAuth 2.0 uslubidagi JWT autentifikatsiya (access 15 daqiqa TTL), refresh token rotation, RBAC (Bemor / Shifokor / Administrator). `drug` — dorilar katalogi (CRUD + qidiruv). `prescription`, `notification` modullari kelayotgan bosqichlarda shu monolit ichiga qo'shiladi. `ocr-service` — Gemini bilan og'ir ishlaydigan qism bo'lgani uchun ataylab alohida servis sifatida qoldirilgan.

Port: **3001**.

## Ishga tushirish

```bash
cp .env.example .env   # DATABASE_URL va JWT_ACCESS_SECRET ni to'ldiring
npm install
npx prisma migrate dev --name init
npm run dev
```

## Tuzilma

Qavatli (layered) tuzilma — har bir turdagi fayl (controller/service/dto/route) o'z papkasida, modul nomi fayl prefiksida ajratiladi:

```
src/
├── config/            # env, prisma client — umumiy
├── middleware/         # auth, rbac, validate, error — umumiy
├── utils/              # jwt, otp, password, refresh-token — umumiy
├── types/               # express kengaytmalari — umumiy
├── controllers/
│   ├── auth.controller.ts
│   └── drug.controller.ts
├── services/
│   ├── auth.service.ts
│   └── drug.service.ts
├── dtos/
│   ├── auth.dto.ts
│   └── drug.dto.ts
├── routes/
│   ├── auth.routes.ts
│   └── drug.routes.ts
└── server.ts             # barcha routerlarni bu yerda mount qilamiz
```

Yangi modul qo'shish: `controllers/`, `services/`, `dtos/`, `routes/` papkalarining har biriga `<nom>.controller.ts`, `<nom>.service.ts`, `<nom>.dto.ts`, `<nom>.routes.ts` faylini `drug` moduli patternida qo'shing, so'ng `server.ts`da `app.use("/api/v1/<nom>", <nom>Router)` bilan ulang. Umumiy `middleware/`, `utils/`, `types/` papkalaridan foydalaning — takrorlamang.

## Endpointlar

To'liq API hujjati: [`docs/API.md`](docs/API.md) — `auth` moduli (`/api/v1/auth/*`).

### `drug` moduli (`/api/v1/drugs`)

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| GET | `/` | - | Ro'yxat (filter: `search`, `dosageForm`, `requiresPrescription`, `isActive`, sahifalash: `page`, `limit`) |
| GET | `/:id` | - | Bitta dori |
| POST | `/` | JWT + `ADMINISTRATOR` | Yangi dori qo'shish |
| PUT | `/:id` | JWT + `ADMINISTRATOR` | Tahrirlash |
| DELETE | `/:id` | JWT + `ADMINISTRATOR` | Soft delete (`isActive=false`) |

`Drug` modeli maydonlari: `name`, `internationalName` (INN), `manufacturer`, `country`, `dosageForm` (enum: tabletka/kapsula/sirop/inyeksiya/malham/tomchi/sprey/boshqa), `dosage`, `packageSize`, `barcode` (unique), `price`, `stock`, `requiresPrescription`, `description`, `imageUrl`, `isActive`.

## Eslatma

- Refresh token — JWT emas, tasodifiy 96-baytli token; DB'da faqat uning SHA-256 xeshi saqlanadi. Refresh oqimida token reuse aniqlansa, foydalanuvchining barcha sessiyalari bekor qilinadi.
- Parolni tiklash kodi 10 daqiqa amal qiladi, bir marta ishlatiladi.
- Prisma bilan ishlashda doim `npx prisma ...` ishlating (loyiha v6 ishlatadi).
- `ocr-service` bilan aloqa hozircha yo'q — `prescription` moduli yozilganda OCR natijasini qanday qabul qilish (sinxron HTTP yoki queue) alohida hal qilinadi.
