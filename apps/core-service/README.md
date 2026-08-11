# Core Service

Modular monolit: `auth`, `drug`, `prescription`, `schedule` va `dose` modullari hozircha to'liq ishlaydi. `auth` — OAuth 2.0 uslubidagi JWT autentifikatsiya (access 15 daqiqa TTL), refresh token rotation, RBAC (Bemor / Shifokor / Administrator). `drug` — dorilar katalogi (CRUD + qidiruv). `prescription` — retsept rasmini (F-002 OCR) yoki dmed QR (F-001) qabul qilib saqlaydi. `schedule`/`dose` — F-003 Smart eslatma tizimi: dori qabul qilish jadvali va "Oldim"/"O'tkazib yubordim" oqimi, soatlik qayta eslatish bilan. `notification` moduli (real SMS) kelayotgan bosqichda qo'shiladi. `ocr-service` — Gemini bilan og'ir ishlaydigan qism bo'lgani uchun ataylab alohida servis sifatida qoldirilgan, `OCR_SERVICE_URL` orqali HTTP bilan chaqiriladi.

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
│   ├── drug.controller.ts
│   ├── prescription.controller.ts
│   ├── schedule.controller.ts
│   └── dose.controller.ts
├── services/
│   ├── auth.service.ts
│   ├── drug.service.ts
│   ├── prescription.service.ts
│   ├── schedule.service.ts
│   └── dose.service.ts
├── dtos/
│   ├── auth.dto.ts
│   ├── drug.dto.ts
│   ├── prescription.dto.ts
│   ├── schedule.dto.ts
│   └── dose.dto.ts
├── routes/
│   ├── auth.routes.ts
│   ├── drug.routes.ts
│   ├── prescription.routes.ts
│   ├── schedule.routes.ts
│   └── dose.routes.ts
├── integrations/
│   └── dmed/              # DmedAdapter, MockDmedAdapter — F-001
├── jobs/
│   └── dose-scheduler.job.ts  # F-003 fon jarayonlari (doza generatsiya + soatlik eslatma)
└── server.ts             # barcha routerlarni bu yerda mount qilamiz
```

`uploads/prescriptions/` papkasi (git'ga qo'shilmaydi, runtime'da avtomatik yaratiladi) — yuklangan retsept rasmlari shu yerda saqlanadi va `/uploads/*` orqali statik xizmat qilinadi.

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

### `prescription` moduli (`/api/v1/prescriptions`)

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| POST | `/` | JWT + `BEMOR` | Retsept rasmini yuklash (`multipart/form-data`, maydon: `file`) — `ocr-service`ga yuboriladi, natija saqlanadi, status `PENDING` (F-002) |
| POST | `/dmed` | JWT + `BEMOR` | dmed QR retsept import (F-001) — `{ uuid }` qabul qiladi, status darhol `APPROVED` |
| GET | `/` | JWT | Ro'yxat (Bemor faqat o'zinikini, Shifokor/Admin — hammasini; filter: `status`, sahifalash: `page`, `limit`) |
| GET | `/:id` | JWT | Bitta retsept (Bemor faqat o'zinikini ko'ra oladi) |
| PATCH | `/:id/approve` | JWT + `SHIFOKOR` | Retseptni tasdiqlash (faqat `OCR` manbali, `PENDING` retseptlar uchun) |
| PATCH | `/:id/reject` | JWT + `SHIFOKOR` | Retseptni rad etish (`reason` majburiy) |

`Prescription` ikki manbadan biriga ega bo'ladi (`source`): **`OCR`** — retsept rasmi yuklanib, shifokor tasdiqlashi kerak (`PENDING → APPROVED/REJECTED`); **`DMED_QR`** — dmed davlat tizimidan QR orqali import qilinadi, allaqachon rasmiy tasdiqlangan hisoblanib, darhol `APPROVED` bo'ladi (qayta tasdiqlash shart emas). `Prescription` → `PrescriptionItem[]` (bitta retseptda bir nechta dori qatori bo'lishi mumkin, DMED formatiga mos — ikkala manbada ham bir xil ustunlar ishlatiladi).

**dmed integratsiyasi hozircha mock**: real `api.dmed.uz` ulanishi yo'q (hamkorlik muzokara jarayonida). `src/integrations/dmed/` papkasida `DmedAdapter` interfeysi va `MockDmedAdapter` bor — `DMED_MODE` env orqali tanlanadi (hozircha faqat `mock` implementatsiya mavjud). Real kalitlar kelganda shu interfeysni implementatsiya qiluvchi yangi adapter yoziladi, boshqa hech narsa o'zgarmaydi.

### `schedule` moduli (`/api/v1/schedules`) — F-003 Smart eslatma tizimi

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| POST | `/` | JWT + `BEMOR` | Dori qabul qilish jadvali yaratish (`drugName`, `scheduleTimes: ["08:00","20:00"]`, `startDate`, ixtiyoriy `drugId`/`dosageNote`/`endDate`) |
| GET | `/` | JWT + `BEMOR` | O'z jadvallari ro'yxati |
| GET | `/:id` | JWT + `BEMOR` | Bitta jadval (faqat egasi) |
| PATCH | `/:id/deactivate` | JWT + `BEMOR` | Jadvalni to'xtatish (`isActive=false`, yangi doza yaratilmaydi) |

### `dose` moduli (`/api/v1/doses`) — "Oldim"/"O'tkazib yubordim" tugmalari

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| GET | `/` | JWT + `BEMOR` | O'z dozalari ro'yxati (filter: `status`, `from`, `to`, sahifalash) |
| PATCH | `/:id/confirm` | JWT + `BEMOR` | "Oldim" — `status: TAKEN` |
| PATCH | `/:id/skip` | JWT + `BEMOR` | "O'tkazib yubordim" — `status: SKIPPED` |

**Ishlash mexanizmi** (`src/jobs/dose-scheduler.job.ts`, `node-cron` bilan):
1. Har **5 daqiqada** — barcha faol jadvallar (`MedicationSchedule`) uchun, kunning shu vaqtga yetgan (`scheduleTimes`dagi HH:mm o'tgan) lekin hali `DoseEvent`i yaratilmagan dozalar avtomatik `PENDING` holatda yaratiladi.
2. Har **soat boshida** — javob berilmagan (`PENDING`, vaqti allaqachon o'tgan) dozalar uchun qayta eslatma yuboriladi (`remindersSent` oshiriladi) — bemor "Oldim"/"O'tkazib yubordim" bosmaguncha soatlik davom etadi.
3. Eslatma yetkazish hozircha **stub** (konsolga `[REMINDER STUB] ...` chiqadi, `forgot-password`dagi `[SMS STUB]` pattern'iga o'xshash) — real push/SMS ulanmagan, chunki mobil ilova va push infratuzilmasi hali yo'q.

## Eslatma

- Refresh token — JWT emas, tasodifiy 96-baytli token; DB'da faqat uning SHA-256 xeshi saqlanadi. Refresh oqimida token reuse aniqlansa, foydalanuvchining barcha sessiyalari bekor qilinadi.
- Parolni tiklash kodi 10 daqiqa amal qiladi, bir marta ishlatiladi.
- Prisma bilan ishlashda doim `npx prisma ...` ishlating (loyiha v6 ishlatadi).
- `ocr-service` bilan aloqa native `fetch`/`FormData` orqali sinxron HTTP (qo'shimcha kutubxona shart emas) — manzil `OCR_SERVICE_URL` env orqali beriladi (default: `http://localhost:3000`).
