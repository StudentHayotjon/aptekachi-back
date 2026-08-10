# Aptekachi v0 — Loyiha xaritasi (Roadmap)

Ushbu hujjat loyihaning hozirgi holatini va admin paneli bilan birga to'liq tizimni qurish uchun tayyorlanishi kerak bo'lgan qismlarni jamlaydi.

## 1. Hozirgi holat (2026-07-28 holatiga ko'ra)

Loyiha mikroservis arxitekturasida rejalashtirilgan (`apps/*`), lekin hozircha faqat ikkita servis real kod bilan yozilgan:

| Servis | Holati | Izoh |
|---|---|---|
| `apps/auth-service` | ✅ Ishlab turibdi | JWT auth, RBAC, refresh token rotation. To'liq API hujjati: [`apps/auth-service/docs/API.md`](../apps/auth-service/docs/API.md) |
| `apps/ocr-service` | ✅ Kod bor | Gemini asosida retsept rasmidan matn ajratib olish |
| `apps/gateway` | ⛔ Bo'sh papka | Hali yozilmagan |
| `apps/drug-service` | ⛔ Bo'sh papka | Hali yozilmagan |
| `apps/prescription-service` | ⛔ Bo'sh papka | Hali yozilmagan |
| `apps/notification-service` | ⛔ Bo'sh papka | Hali yozilmagan |
| `packages/shared-types` | ⛔ Bo'sh | Servislar orasida umumiy tiplar (User, Role, DTO'lar) uchun |
| `packages/shared-config` | ⛔ Bo'sh | Umumiy env/config validatsiyasi |
| `packages/shared-logger` | ⛔ Bo'sh | Umumiy logging (masalan pino/winston wrapper) |
| `infra/docker-compose.yml` | ⛔ Bo'sh | Postgres, Redis, servislarni birga ishga tushirish uchun |
| `infra/k8s` | ⛔ Bo'sh | Production uchun k8s manifestlari |
| **Admin paneli (frontend)** | ⛔ Mavjud emas | Hali boshlanmagan |
| **Bemor/Shifokor mobil/veb ilova** | ⛔ Mavjud emas | Hali boshlanmagan |

Auth-service'da rollar allaqachon tayyor: `BEMOR`, `SHIFOKOR`, `ADMINISTRATOR` (`prisma/schema.prisma`), va `rbac.middleware.ts`'da `authorize(...roles)` funksiyasi mavjud — bu admin panelni himoyalash uchun tayyor infratuzilma.

---

## 2. Admin paneli (frontend)

**Maqsad**: `ADMINISTRATOR` roli uchun tizimni boshqarish interfeysi.

### Kerakli funksiyalar
- **Foydalanuvchilar boshqaruvi**: ro'yxatni ko'rish, qidirish, `isActive` orqali bloklash/aktivlashtirish
- **Shifokor/Administrator provisioning**: hozircha auth-service'da faqat DB orqali qo'lda qilinadi — admin panel uchun bu alohida backend endpoint sifatida yozilishi kerak (masalan `POST /admin/users` role bilan)
- **Dorilar katalogi boshqaruvi**: qo'shish/tahrirlash/o'chirish, narx va qoldiq (stock) — `drug-service` orqali
- **Retseptlar monitoringi**: barcha retseptlar ro'yxati, status (kutilmoqda/tasdiqlangan/rad etilgan) — `prescription-service` orqali
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

## 3. Yozilishi kerak bo'lgan backend xizmatlar

### `gateway`
- Barcha servislarga yagona kirish nuqtasi (reverse proxy)
- JWT tekshirish (yoki auth-service'ga proksi qilish)
- Rate limiting, CORS, request logging
- Tavsiya: Express + `http-proxy-middleware`, yoki agar ko'proq trafik kutilsa — Nginx/Kong

### `drug-service`
- Dorilar katalogi: nomi, ishlab chiqaruvchi, narx, qoldiq, retsept talab qiladimi (`requiresPrescription: boolean`)
- Qidiruv/filter API
- Prisma + Postgres (auth-service pattern'iga o'xshash alohida schema)

### `prescription-service`
- Retsept yaratish (shifokor tomonidan yoki OCR natijasidan)
- `ocr-service`'dan kelgan matnni tuzilgan retsept ma'lumotiga aylantirish
- Status oqimi: `PENDING → APPROVED/REJECTED`
- Shifokor tasdiqlash endpointlari (RBAC: faqat `SHIFOKOR`)

### `notification-service`
- SMS yuborish — Eskiz.uz integratsiyasi (auth-service'dagi `forgot-password` hozircha `[SMS STUB]` konsolga chiqaradi, buni shu servis orqali real qilish kerak)
- Push/email (keyingi bosqich)
- Boshqa servislar bilan aloqa: sinxron REST yoki queue (quyida)

### Servislararo aloqa
Hozir hech qanday inter-service communication mexanizmi yo'q. Ikki variant:
1. **Sinxron REST** — oddiy, lekin servislar bir-biriga bog'liq bo'lib qoladi (masalan prescription-service to'g'ridan-to'g'ri notification-service'ga HTTP so'rov yuboradi)
2. **Message queue (RabbitMQ/Redis Streams)** — masalan "retsept tasdiqlandi" hodisasi yuboriladi, notification-service uni tinglaydi. Kelajakda kengayish uchun tavsiya etiladi, lekin boshlang'ich bosqichda ortiqcha bo'lishi mumkin.

---

## 4. Mijoz ilovalari

- **Bemor ilovasi** (mobil yoki veb PWA): ro'yxatdan o'tish/login, retsept rasmini yuklash (OCR'ga), dori qidirish, buyurtma
- **Shifokor interfeysi**: retseptlarni ko'rish/tasdiqlash/yozish

---

## 5. Infratuzilma va DevOps

- [ ] `infra/docker-compose.yml`ni to'ldirish: Postgres (har servis uchun alohida DB yoki schema), Redis (agar queue/cache kerak bo'lsa), har bir `apps/*` servisi
- [ ] Har servis uchun `.env.example` (auth-service'da bor, boshqalarida ham bo'lishi kerak) — **muhim: `.env` fayllar hech qachon git'ga commit qilinmasin**
- [ ] CI/CD pipeline (test + build + deploy)
- [ ] `infra/k8s` — production uchun manifestlar (keyingi bosqich, MVP uchun shart emas)
- [ ] Secrets boshqaruvi (production'da `.env` emas — Vault/AWS Secrets Manager/K8s Secrets)

---

## 6. Umumiy paketlar (`packages/*`)

Hozircha bo'sh, lekin ko'p servis bo'lgani sayin takrorlanishning oldini olish uchun kerak:

- **`shared-types`**: `Role` enum, umumiy DTO interfeyslari (`ApiResponse<T>` kabi — hozir auth-service ichida lokal e'lon qilingan)
- **`shared-config`**: env validatsiya patterni (auth-service'dagi `env.config.ts`ga o'xshash, lekin umumiy)
- **`shared-logger`**: barcha servislarda bir xil formatdagi loglar (masalan `pino`)

---

## 7. Huquqiy/biznes tomon (O'zbekiston uchun)

- Dori retseptlarini masofadan tasdiqlash bo'yicha Sog'liqni saqlash vazirligi talablariga muvofiqlik
- Shaxsiy tibbiy ma'lumotlar (tashxis, retsept)ni saqlash bo'yicha maxfiylik/qonunchilik talablari
- SMS integratsiyasi uchun Eskiz.uz (yoki analogik) bilan shartnoma

---

## 8. Tavsiya etilgan ustuvorlik tartibi (MVP uchun)

1. `gateway` — servislarni birlashtirish uchun zamin
2. `drug-service` — oddiy CRUD, tez yoziladi
3. `prescription-service` + OCR bilan integratsiya
4. Admin panel — foydalanuvchi va dori boshqaruvi (asosiy funksiyalar)
5. `notification-service` — real SMS integratsiyasi
6. Bemor/Shifokor mijoz ilovalari
7. Infra qattiqlashtirish (docker-compose to'liq, keyin k8s)
