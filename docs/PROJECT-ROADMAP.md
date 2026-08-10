# Aptekachi v0 — Loyiha xaritasi (Roadmap)

Ushbu hujjat loyihaning hozirgi holatini va admin paneli bilan birga to'liq tizimni qurish uchun tayyorlanishi kerak bo'lgan qismlarni jamlaydi.

> **Arxitektura qarori**: loyiha boshida mikroservis sifatida rejalashtirilgan edi (`gateway`, `auth-service`, `drug-service`, `prescription-service`, `notification-service` — barchasi alohida). Amalda faqat `auth-service`da kod bor edi, qolganlari bo'sh papka bo'lgani va jamoa hali kichik (solo/kichik dev) bo'lgani uchun **modular monolitga** o'tildi: `auth-service` kodi `core-service`ga ko'chirildi, `drug`/`prescription`/`notification` shu monolit ichida modul sifatida yoziladi. **`ocr-service`** ataylab alohida qoldirildi — Gemini API bilan og'ir/resurs talab qiladigan ish bo'lgani uchun kelajakda mustaqil scale qilinishi mumkin.

## 1. Hozirgi holat

| Qism | Holati | Izoh |
|---|---|---|
| `apps/core-service` | ✅ Ishlab turibdi | Modular monolit (qavatli tuzilma: `controllers/`, `services/`, `dtos/`, `routes/`). `auth`, `drug` va `prescription` modullari to'liq ishlaydi. Port: **3001**. API hujjati: [`apps/core-service/docs/API.md`](../apps/core-service/docs/API.md) |
| `apps/ocr-service` | ✅ Kod bor | Gemini asosida retsept rasmidan matn ajratib olish, alohida servis. Port: **3000** |
| `packages/shared-types` | ⛔ Bo'sh | Endi shart emas — monolit ichida bitta `@prisma/client` va umumiy tiplar bitta joyda |
| `packages/shared-config` | ⛔ Bo'sh | Endi shart emas (monolitda bitta `env.config.ts`) |
| `packages/shared-logger` | ⛔ Bo'sh | `core-service` va `ocr-service` orasida umumiy logging kerak bo'lsa hali foydali bo'lishi mumkin |
| `infra/docker-compose.yml` | ⛔ Bo'sh | Postgres + `core-service` + `ocr-service`ni birga ishga tushirish uchun |
| `infra/k8s` | ⛔ Bo'sh | Production uchun k8s manifestlari (MVP uchun shart emas) |
| **Admin paneli (frontend)** | ⛔ Mavjud emas | Hali boshlanmagan |
| **Bemor/Shifokor mobil/veb ilova** | ⛔ Mavjud emas | Hali boshlanmagan |

`core-service`da rollar allaqachon tayyor: `BEMOR`, `SHIFOKOR`, `ADMINISTRATOR` (`prisma/schema.prisma`), va `rbac.middleware.ts`'da `authorize(...roles)` funksiyasi mavjud — bu admin panelni himoyalash uchun tayyor infratuzilma.

---

## 2. `core-service` tuzilmasi

Qavatli (layered) tuzilma tanlandi — har bir turdagi fayl (controller/service/dto/route) o'z papkasida, modullar fayl prefiksi bilan ajratiladi:

```
apps/core-service/src/
├── config/            # env, prisma client — umumiy
├── middleware/         # auth, rbac, validate, error — umumiy
├── utils/              # jwt, otp, password, refresh-token — umumiy
├── types/               # express kengaytmalari — umumiy
├── controllers/         # auth.controller.ts, drug.controller.ts, ...
├── services/            # auth.service.ts, drug.service.ts, ...
├── dtos/                # auth.dto.ts, drug.dto.ts, ...
├── routes/              # auth.routes.ts, drug.routes.ts, ...
└── server.ts             # barcha routerlarni bu yerda mount qilamiz
```

Yangi modul qo'shish tartibi: `controllers/`, `services/`, `dtos/`, `routes/` papkalarining har biriga `<nom>.*.ts` faylini `drug` moduli patternida qo'shish, so'ng `server.ts`da `app.use("/api/v1/<nom>", <nom>Router)` bilan ulash. Umumiy `middleware/`, `utils/`, `types/` papkalaridan foydalanish, takrorlamaslik.

---

## 3. Admin paneli (frontend)

**Maqsad**: `ADMINISTRATOR` roli uchun tizimni boshqarish interfeysi.

### Kerakli funksiyalar
- **Foydalanuvchilar boshqaruvi**: ro'yxatni ko'rish, qidirish, `isActive` orqali bloklash/aktivlashtirish
- **Shifokor/Administrator provisioning**: hozircha faqat DB orqali qo'lda qilinadi — admin panel uchun bu alohida backend endpoint sifatida yozilishi kerak (masalan `POST /api/v1/auth/users/provision`)
- **Dorilar katalogi boshqaruvi**: qo'shish/tahrirlash/o'chirish, narx va qoldiq (stock) — `drug` moduli orqali
- **Retseptlar monitoringi**: barcha retseptlar ro'yxati, status (kutilmoqda/tasdiqlangan/rad etilgan) — `prescription` moduli orqali
- **Statistika/Dashboard**: kunlik ro'yxatdan o'tishlar, faol foydalanuvchilar, eng ko'p sotilgan dorilar
- **Audit log**: kim, qachon, nima o'zgartirgani (ayniqsa retsept tasdiqlash/rad etishda muhim)

### Texnik tavsiya
- **Stack**: React + Next.js (yoki Vite + React), TanStack Query (API cache), Zod (frontend validatsiya — backenddagi bilan bir xil sxema)
- **Auth**: `access token`ni memory'da, `refresh token`ni httpOnly cookie'da saqlash (localStorage'da JWT saqlash xavfsiz emas)
- **Himoya**: barcha admin route'lar `Authorization: Bearer <token>` bilan yuboriladi, backendda `authorize(Role.ADMINISTRATOR)` middleware orqali tekshiriladi
- **UI kit**: shadcn/ui yoki Ant Design (admin panel uchun tez va tayyor komponentlar)

### Admin uchun kerak bo'ladigan yangi backend endpointlar (hali yo'q)
```
GET    /api/v1/auth/users                 — barcha foydalanuvchilar ro'yxati (filter: role, isActive)
PATCH  /api/v1/auth/users/:id/status      — isActive'ni o'zgartirish
POST   /api/v1/auth/users/provision       — SHIFOKOR/ADMINISTRATOR yaratish (faqat admin)
GET    /api/v1/drugs                      — dorilar ro'yxati
POST   /api/v1/drugs                      — yangi dori qo'shish
PUT    /api/v1/drugs/:id                  — dori tahrirlash
GET    /api/v1/prescriptions              — barcha retseptlar (admin ko'rinishi)
```

---

## 4. Yozilishi kerak bo'lgan modullar (`core-service` ichida)

### `drug` moduli — ✅ tayyor
CRUD + qidiruv/filter/sahifalash (`GET /` va `GET /:id` ochiq, yozish amallari `ADMINISTRATOR` roli bilan himoyalangan). `Drug` modeli: `name`, `internationalName` (INN), `manufacturer`, `country`, `dosageForm` (enum), `dosage`, `packageSize`, `barcode` (unique), `price`, `stock`, `requiresPrescription`, `description`, `imageUrl`, `isActive` (soft delete). To'liq API: [`apps/core-service/docs/API.md`](../apps/core-service/docs/API.md) § Drug moduli.

### `prescription` moduli — ✅ tayyor
Bemor retsept rasmini yuklaydi (`multipart/form-data`) → `core-service` uni `ocr-service`ning `/api/ocr/analyze`iga (native `fetch`/`FormData`, `OCR_SERVICE_URL` orqali) yuboradi → natija `Prescription` + `PrescriptionItem[]` sifatida saqlanadi (`PENDING`) → `SHIFOKOR` roli tasdiqlaydi (`PATCH /:id/approve`) yoki sababi bilan rad etadi (`PATCH /:id/reject`). Rasm lokal `uploads/prescriptions/`ga saqlanadi va `/uploads/*` orqali statik xizmat qilinadi. To'liq API: [`apps/core-service/docs/API.md`](../apps/core-service/docs/API.md) § Prescription moduli.

### `notification` moduli
- SMS yuborish — Eskiz.uz integratsiyasi (hozircha `forgot-password` `[SMS STUB]` konsolga chiqaradi, buni real qilish kerak)
- Push/email (keyingi bosqich)

### `core-service` ↔ `ocr-service` aloqasi — ✅ ulangan
`prescription` moduli orqali HTTP (native `fetch`) bilan sinxron chaqiriladi, manzil `OCR_SERVICE_URL` env orqali beriladi.

---

## 5. Mijoz ilovalari

- **Bemor ilovasi** (mobil yoki veb PWA): ro'yxatdan o'tish/login, retsept rasmini yuklash (OCR'ga), dori qidirish, buyurtma
- **Shifokor interfeysi**: retseptlarni ko'rish/tasdiqlash/yozish

---

## 6. Infratuzilma va DevOps

- [ ] `infra/docker-compose.yml`ni to'ldirish: Postgres, `core-service`, `ocr-service`
- [ ] Har servis uchun `.env.example` (`core-service`da bor, `ocr-service`da ham bo'lishi kerak) — **muhim: `.env` fayllar hech qachon git'ga commit qilinmasin**
- [ ] CI/CD pipeline (test + build + deploy)
- [ ] `infra/k8s` — production uchun manifestlar (keyingi bosqich, MVP uchun shart emas)
- [ ] Secrets boshqaruvi (production'da `.env` emas — Vault/AWS Secrets Manager/K8s Secrets)

---

## 7. Huquqiy/biznes tomon (O'zbekiston uchun)

- Dori retseptlarini masofadan tasdiqlash bo'yicha Sog'liqni saqlash vazirligi talablariga muvofiqlik
- Shaxsiy tibbiy ma'lumotlar (tashxis, retsept)ni saqlash bo'yicha maxfiylik/qonunchilik talablari
- SMS integratsiyasi uchun Eskiz.uz (yoki analogik) bilan shartnoma

---

## 8. Tavsiya etilgan ustuvorlik tartibi (MVP uchun)

1. ~~`drug` moduli~~ — ✅ tayyor
2. ~~`prescription` moduli + `ocr-service` bilan HTTP integratsiya~~ — ✅ tayyor
3. Admin panel — foydalanuvchi va dori boshqaruvi (asosiy funksiyalar), shu jumladan `POST /api/v1/auth/users/provision` (SHIFOKOR/ADMINISTRATOR yaratish)
4. `notification` moduli — real SMS integratsiyasi
5. Bemor/Shifokor mijoz ilovalari
6. Infra qattiqlashtirish (docker-compose to'liq, keyin k8s)
