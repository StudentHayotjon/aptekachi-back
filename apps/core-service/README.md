# Core Service

Modular monolit: `auth`, `drug`, `prescription`, `schedule`, `dose`, `interaction` va `family` modullari hozircha to'liq ishlaydi. `auth` — OAuth 2.0 uslubidagi JWT autentifikatsiya (access 15 daqiqa TTL), refresh token rotation, RBAC (Bemor / Shifokor / Administrator), shu jumladan admin foydalanuvchi boshqaruvi (`GET /users`, `PATCH /users/:id/status`, `POST /users/provision`). `drug` — dorilar katalogi (CRUD + qidiruv). `prescription` — retsept rasmini (F-002 OCR) yoki dmed QR (F-001) qabul qilib saqlaydi. `schedule`/`dose` — F-003 Smart eslatma tizimi: dori qabul qilish jadvali va "Oldim"/"O'tkazib yubordim" oqimi, soatlik qayta eslatish bilan. `interaction` — F-004 dori-dori o'zaro ta'sirini tekshirish (hozircha faqat struktura, admin qo'lda to'ldiradi). `family` — Oilaviy profil: akkauntsiz oila a'zolarini to'liq boshqarish + haqiqiy akkauntlarga faqat-ko'rish uchun ulanish. `notification` moduli (real SMS) kelayotgan bosqichda qo'shiladi. `ocr-service` — Gemini bilan og'ir ishlaydigan qism bo'lgani uchun ataylab alohida servis sifatida qoldirilgan, `OCR_SERVICE_URL` orqali HTTP bilan chaqiriladi.

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
│   ├── dose.controller.ts
│   ├── interaction.controller.ts
│   └── family.controller.ts
├── services/
│   ├── auth.service.ts
│   ├── drug.service.ts
│   ├── prescription.service.ts
│   ├── schedule.service.ts
│   ├── dose.service.ts
│   ├── interaction.service.ts
│   └── family.service.ts
├── dtos/
│   ├── auth.dto.ts
│   ├── drug.dto.ts
│   ├── prescription.dto.ts
│   ├── schedule.dto.ts
│   ├── dose.dto.ts
│   ├── interaction.dto.ts
│   └── family.dto.ts
├── routes/
│   ├── auth.routes.ts
│   ├── drug.routes.ts
│   ├── prescription.routes.ts
│   ├── schedule.routes.ts
│   ├── dose.routes.ts
│   ├── interaction.routes.ts
│   └── family.routes.ts
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

**Retsept tasdiqlanganda (`approve()` yoki `importFromDmed()`) avtomatik eslatma jadvali yaratiladi** — har bir `PrescriptionItem` uchun `ScheduleService.createFromPrescriptionItems()` chaqiriladi (batafsil: quyida `schedule` moduli bo'limida).

**Dori nomini katalogga avtomatik bog'lash**: har bir item yaratilishida (`create()` va `importFromDmed()`ning ikkalasida ham) `drugNameRaw` (masalan "Paracetamol 500mg") `Drug` katalogiga (faqat `isActive: true`) Levenshtein masofasi orqali moslashtiriladi (`src/utils/drug-matcher.util.ts`, TZ §3.2.4 asosida) va topilsa `drugId` avtomatik to'ldiriladi. Mos dori topilmasa (yoki noaniq bo'lsa — ikkita candidate teng masofada) — `drugId: null` bilan xavfsiz davom etiladi, taxmin qilinmaydi. `MedicationSchedule.drugId` buni bepul meros oladi (`ScheduleService.createFromPrescriptionItems` allaqachon `item.drugId`ni ishlatadi).

**dmed integratsiyasi hozircha mock**: real `api.dmed.uz` ulanishi yo'q (hamkorlik muzokara jarayonida). `src/integrations/dmed/` papkasida `DmedAdapter` interfeysi va `MockDmedAdapter` bor — `DMED_MODE` env orqali tanlanadi (hozircha faqat `mock` implementatsiya mavjud). Real kalitlar kelganda shu interfeysni implementatsiya qiluvchi yangi adapter yoziladi, boshqa hech narsa o'zgarmaydi.

### `schedule` moduli (`/api/v1/schedules`) — F-003 Smart eslatma tizimi

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| POST | `/` | JWT + `BEMOR` | Dori qabul qilish jadvali yaratish (`drugName`, `scheduleTimes: ["08:00","20:00"]`, `startDate`, ixtiyoriy `drugId`/`dosageNote`/`endDate`/`familyMemberId`) |
| GET | `/` | JWT + `BEMOR` | O'z + oila a'zolari + ulangan akkauntlarning jadvallari (birlashtirilgan, `owner` maydoni bilan) |
| GET | `/:id` | JWT + `BEMOR` | Bitta jadval (o'ziniki, oila a'zosiniki yoki ulangan akkauntniki) |
| PATCH | `/:id/deactivate` | JWT + `BEMOR` | Jadvalni to'xtatish (`isActive=false`) — faqat o'ziniki/oila a'zosiniki, ulangan akkaunt uchun `403` |

**Oilaviy profil bilan integratsiya** (batafsil: quyida `family` moduli): `familyMemberId` berilsa jadval `patientId: null` bilan, akkauntsiz oila a'zosiga bog'lanadi. `GET /` va `GET /doses` doim uchta manbadan birlashtirilgan ro'yxat qaytaradi — `owner.type`: `SELF` / `FAMILY_MEMBER` (to'liq boshqarish huquqi) / `LINKED_ACCOUNT` (`CareLink` orqali, faqat ko'rish — yozish urinishlari `403`).

**Avtomatik yaratish (retsept → jadval)**: `ScheduleService.createFromPrescriptionItems(patientId, items)` — tasdiqlangan retsept (`prescription` moduli, F-001/F-002) har bir dori qatoridan avtomatik jadval yaratadi. Xatti-harakat (`src/utils/dose-parser.util.ts`):
- `dailyDoseCount` (masalan `"2"`) → `scheduleTimes` — 08:00–22:00 oralig'ida teng taqsimlangan N ta vaqt (o'qib bo'lmasa — bitta standart `09:00`)
- `duration` (masalan `"5 kun"`, `"2 hafta"`) → `endDate` (o'qib bo'lmasa — muddatsiz, `null`)
- `"kerak bo'lganda"` / `"zarurat"` / PRN kabi iboralar — jadval yaratilmaydi, o'tkazib yuboriladi (taxmin qilinmaydi)
- `MedicationSchedule.prescriptionItemId` (unique) — bir xil itemdan qayta chaqirilsa ham dublikat yaratilmaydi (idempotent)
- **Halokatga uchramaydigan yon effekt**: xato bo'lsa ham retsept tasdiqlash/import natijasi bekor qilinmaydi, faqat konsolga log yoziladi
- Bu — klinik jihatdan tasdiqlanmagan evristika. Auto-yaratilgan jadvalni hozircha faqat `deactivate` qilish mumkin, tahrirlash yo'q (kelajakda `PATCH /schedules/:id` qo'shilishi mumkin)

### `dose` moduli (`/api/v1/doses`) — "Oldim"/"O'tkazib yubordim" tugmalari

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| GET | `/` | JWT + `BEMOR` | O'z dozalari ro'yxati (filter: `status`, `from`, `to`, sahifalash) |
| PATCH | `/:id/confirm` | JWT + `BEMOR` | "Oldim" — `status: TAKEN` |
| PATCH | `/:id/skip` | JWT + `BEMOR` | "O'tkazib yubordim" — `status: SKIPPED` |

**Ishlash mexanizmi** (`src/jobs/dose-scheduler.job.ts`, `node-cron` bilan):
1. Har **5 daqiqada** — barcha faol jadvallar (`MedicationSchedule`) uchun, kunning shu vaqtga yetgan (`scheduleTimes`dagi HH:mm o'tgan) lekin hali `DoseEvent`i yaratilmagan dozalar avtomatik `PENDING` holatda yaratiladi.
2. Har **soat boshida** — javob berilmagan (`PENDING`, vaqti allaqachon o'tgan) dozalar uchun qayta eslatma yuboriladi (`remindersSent` oshiriladi) — bemor "Oldim"/"O'tkazib yubordim" bosmaguncha soatlik davom etadi.
3. Eslatma yetkazish hozircha **stub** (konsolga `[REMINDER STUB] ...` chiqadi, `forgot-password`dagi `[SMS STUB]` pattern'iga o'xshash) — real push/SMS ulanmagan, chunki mobil ilova va push infratuzilmasi hali yo'q. Oila a'zosi (akkauntsiz) jadvali bo'lsa, eslatma guardian'ning raqamiga yuboriladi.

### `interaction` moduli (`/api/v1/interactions`) — F-004 (soddalashtirilgan)

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| POST | `/` | JWT + `ADMINISTRATOR` | Yangi o'zaro ta'sir juftligi (`drugAId`, `drugBId`, `severity`, ixtiyoriy `description`) |
| GET | `/` | JWT + `ADMINISTRATOR` | Ro'yxat (sahifalash bilan) |
| DELETE | `/:id` | JWT + `ADMINISTRATOR` | O'chirish |
| POST | `/check` | JWT | Berilgan `drugIds[]` ichida ma'lum o'zaro ta'sirlarni tekshirish (istalgan rol) |

Real ma'lumot manbai (DrugBank litsenziyasi) hozircha yo'q — jadval admin tomonidan qo'lda to'ldiriladi. Juftlik doim `drugAId < drugBId` tartibida saqlanadi (`sortPair()`), A-B va B-A bir xil yozuv hisoblanishi uchun — takroriy qo'shishga urinish `409` qaytaradi.

### `family` moduli (`/api/v1/family`) — Oilaviy profil

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| POST | `/members` | JWT + `BEMOR` | Akkauntsiz oila a'zosi qo'shish (`fullName`, ixtiyoriy `relationship`/`birthDate`) |
| GET | `/members` | JWT + `BEMOR` | O'zi qo'shgan oila a'zolari |
| DELETE | `/members/:id` | JWT + `BEMOR` | O'chirish (bog'liq jadvallar kaskad o'chadi) |
| POST | `/links` | JWT + `BEMOR` | Haqiqiy akkauntga telefon raqami orqali **darhol** ulanish (`{ phone }`) |
| GET | `/links` | JWT | Ikkala yo'nalish: `{ watching, watchedBy }` |
| DELETE | `/links/:id` | JWT | Ulanishni bekor qilish (kuzatuvchi yoki kuzatiladigan, ikkalasi ham) |

Ikki xil oila a'zosi holatini qamrab oladi: **akkauntsiz** shaxs (`FamilyMember`) — guardian to'liq boshqaradi; **haqiqiy akkaunti bor** shaxs (`CareLink`) — guardian faqat kuzatadi (masalan bola dorini ichdimi-yo'qmi tekshirish uchun), jadvalni o'zgartirish huquqisiz — bu ongli tanlangan himoya talabi. `CareLink` tasdiqlashsiz, telefon raqami to'g'ri bo'lsa darhol yaratiladi (SMS/push xabardor qilish hali yo'qligi sabab bilan tezlik uchun tanlangan, xavfni faqat-ko'rish cheklovi kamaytiradi).

## Eslatma

- Refresh token — JWT emas, tasodifiy 96-baytli token; DB'da faqat uning SHA-256 xeshi saqlanadi. Refresh oqimida token reuse aniqlansa, foydalanuvchining barcha sessiyalari bekor qilinadi.
- Parolni tiklash kodi 10 daqiqa amal qiladi, bir marta ishlatiladi.
- Prisma bilan ishlashda doim `npx prisma ...` ishlating (loyiha v6 ishlatadi).
- `ocr-service` bilan aloqa native `fetch`/`FormData` orqali sinxron HTTP (qo'shimcha kutubxona shart emas) — manzil `OCR_SERVICE_URL` env orqali beriladi (default: `http://localhost:3000`).
