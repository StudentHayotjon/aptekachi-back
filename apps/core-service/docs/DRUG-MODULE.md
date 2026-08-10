# Drug moduli — nima qo'shildi

`core-service` (modular monolit) ichiga qo'shilgan ikkinchi modul. Dorilar katalogini boshqarish (CRUD) va qidiruv/filtrlash uchun.

## 1. Qo'shilgan fayllar

| Fayl | Vazifasi |
|---|---|
| `prisma/schema.prisma` | `DosageForm` enum va `Drug` modeli qo'shildi |
| `prisma/migrations/20260810172219_add_drug_model/` | `drugs` jadvalini yaratuvchi migratsiya |
| `src/dtos/drug.dto.ts` | Zod validatsiya sxemalari + TypeScript tiplari |
| `src/services/drug.service.ts` | Biznes mantiq — Prisma orqali DB bilan ishlash |
| `src/controllers/drug.controller.ts` | HTTP so'rov/javoblarni boshqarish |
| `src/routes/drug.routes.ts` | Endpointlar va middleware zanjiri |
| `src/server.ts` | `app.use("/api/v1/drugs", drugRouter)` qo'shildi |

Tuzilma auth moduli bilan bir xil qavatli patternga amal qiladi (`controllers/`, `services/`, `dtos/`, `routes/` — modul nomi fayl prefiksida).

## 2. `Drug` modeli (Prisma)

```prisma
enum DosageForm {
  TABLETKA
  KAPSULA
  SIROP
  INYEKSIYA
  MALHAM
  TOMCHI
  SPREY
  BOSHQA
}

model Drug {
  id                   String     @id @default(uuid())
  name                 String                    // savdo nomi
  internationalName    String?                   // INN — xalqaro nomi
  manufacturer         String                    // ishlab chiqaruvchi
  country              String?                   // ishlab chiqarilgan mamlakat
  dosageForm           DosageForm @default(BOSHQA)
  dosage               String?                   // masalan "500mg"
  packageSize          String?                   // masalan "20 tabletka/quti"
  barcode              String?    @unique
  price                Decimal    @db.Decimal(12, 2)
  stock                Int        @default(0)
  requiresPrescription Boolean    @default(false)
  description          String?
  imageUrl             String?
  isActive             Boolean    @default(true)  // soft delete uchun
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  @@index([name])
  @@map("drugs")
}
```

| Maydon | Izoh |
|---|---|
| `name` | Majburiy, savdo nomi (masalan "Paracetamol Extra") |
| `internationalName` | Ixtiyoriy, INN / faol modda nomi (masalan "Paracetamol") |
| `manufacturer` | Majburiy, ishlab chiqaruvchi |
| `country` | Ixtiyoriy, ishlab chiqarilgan mamlakat |
| `dosageForm` | Enum, default `BOSHQA` — tabletka/kapsula/sirop/inyeksiya/malham/tomchi/sprey |
| `dosage` | Ixtiyoriy, doza (masalan "500mg", "5mg/ml") |
| `packageSize` | Ixtiyoriy, qadoqlanish (masalan "20 tabletka/quti") |
| `barcode` | Ixtiyoriy, lekin **unique** — shtrix-kod takrorlanmasligi DB darajasida ta'minlanadi |
| `price` | Majburiy, `Decimal(12,2)` — pul bilan ishlashda `float` xatoliklarining oldini olish uchun |
| `stock` | Default `0`, qoldiq soni |
| `requiresPrescription` | Default `false` — retsept talab qiladigan dorilarni ajratish uchun |
| `isActive` | Default `true` — o'chirish **soft delete** orqali (`false` qilinadi, jadvaldan real o'chirilmaydi) |

## 3. Endpointlar (`/api/v1/drugs`)

| Method | Path | Auth | Tavsif |
|---|---|---|---|
| `GET` | `/` | - | Ro'yxat — filter + sahifalash bilan |
| `GET` | `/:id` | - | Bitta dori |
| `POST` | `/` | JWT + `ADMINISTRATOR` | Yangi dori qo'shish |
| `PUT` | `/:id` | JWT + `ADMINISTRATOR` | Tahrirlash (barcha maydon ixtiyoriy) |
| `DELETE` | `/:id` | JWT + `ADMINISTRATOR` | Soft delete (`isActive=false`) |

**`GET /` query parametrlari:**

| Param | Turi | Izoh |
|---|---|---|
| `search` | string | `name` yoki `internationalName` bo'yicha qidiruv (case-insensitive) |
| `dosageForm` | enum | Aniq shakl bo'yicha filtr |
| `requiresPrescription` | boolean | |
| `isActive` | boolean | Default: `true` (faqat faol dorilar ko'rinadi) |
| `page` | number | Default: `1` |
| `limit` | number | Default: `20`, maksimum `100` |

## 4. Biznes qoidalar

- **O'qish ochiq, yozish himoyalangan**: `GET` endpointlari auth talab qilmaydi (mijoz ilovasi login qilmasdan katalogni ko'ra oladi), `POST`/`PUT`/`DELETE` — faqat `ADMINISTRATOR` roli (`authenticate` + `authorize(Role.ADMINISTRATOR)` middleware zanjiri, auth moduli bilan bir xil mexanizm).
- **Shtrix-kod dublikat tekshiruvi**: `create()` da agar `barcode` berilgan bo'lsa, avval mavjudligi tekshiriladi — bo'lsa `409 Conflict` qaytadi.
- **Soft delete**: `DELETE` jadvaldan yozuvni o'chirmaydi, faqat `isActive: false` qiladi — shu sababli `getById` va default `list` faqat `isActive: true` bo'lganlarni qaytaradi (tarixiy ma'lumot, buyurtmalar bilan bog'liqlik saqlanadi).
- **`price` — `Decimal → number`**: Prisma `Decimal` tipini API javobida oddiy `number`ga aylantiradi (`toDrugResponse` funksiyasi), frontendda ishlash qulay bo'lishi uchun.

## 5. Hali qilinmagan / keyingi qadam

- Migratsiya `drugs` jadvalini yaratish uchun tayyor (`prisma/migrations/20260810172219_add_drug_model`), lekin **hali real bazaga qo'llanilmagan** (Supabase ulanish muammosi hal qilingandan keyin `npx prisma migrate dev` qayta ishga tushirilishi kerak).
- Rasm yuklash (`imageUrl`) hozircha faqat URL sifatida qabul qilinadi — fayl yuklash (upload) endpointlari yo'q.
- Kategoriya/ishlab chiqaruvchi alohida jadvalga chiqarilmagan (ataylab, MVP uchun yalpi (flat) modeldan boshlangan — [`docs/PROJECT-ROADMAP.md`](../../../docs/PROJECT-ROADMAP.md)ga qarang).

To'liq so'rov/javob namunalari (request/response misollari): [`docs/API.md`](API.md) § Drug moduli.
