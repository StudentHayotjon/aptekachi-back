# Core Service — Auth moduli API hujjati

Base URL: `http://localhost:3001/api/v1/auth`
Barcha javoblar `application/json` formatida qaytadi va umumiy shakli:

```ts
{
  success: boolean;
  message: string;
  data?: T | null;   // faqat muvaffaqiyatli va data qaytaradigan endpointlarda
}
```

## Auth mexanizmi

- **Access token** — JWT, `Authorization: Bearer <token>` header orqali yuboriladi. TTL: **15 daqiqa**.
- **Refresh token** — JWT emas, tasodifiy 96-baytli token. DB'da faqat SHA-256 xeshi saqlanadi. TTL: **30 kun**.
- Refresh oqimida **rotation** qo'llaniladi: har `refresh` chaqiruvida eski token bekor qilinib, yangi juftlik (access+refresh) qaytariladi.
- Agar allaqachon bekor qilingan (revoked) refresh token qayta yuborilsa — bu token o'g'irlangan deb hisoblanadi va foydalanuvchining **barcha** sessiyalari (barcha refresh tokenlar) bekor qilinadi.
- Rollar: `BEMOR` (default), `SHIFOKOR`, `ADMINISTRATOR`. Ro'yxatdan o'tishda rol har doim `BEMOR`.

---

## 1. `POST /register`

Telefon raqam + parol bilan ro'yxatdan o'tish. Auth talab qilinmaydi.

**Request body**

| Field      | Turi   | Talablar                                  |
|------------|--------|--------------------------------------------|
| `phone`    | string | `+998XXXXXXXXX` formatida                  |
| `password` | string | kamida 8 belgi                             |
| `fullName` | string | 2–100 belgi                                |

```json
{
  "phone": "+998901234567",
  "password": "SuperSecret123",
  "fullName": "Aliyev Vali"
}
```

**Response — 201 Created**

```json
{
  "success": true,
  "message": "Ro'yxatdan muvaffaqiyatli o'tdingiz",
  "data": {
    "user": { "id": "uuid", "phone": "+998901234567", "fullName": "Aliyev Vali", "role": "BEMOR" },
    "tokens": { "accessToken": "jwt...", "refreshToken": "random...", "expiresIn": "15m" }
  }
}
```

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Validatsiya xatosi (zod) |
| 409 | Bu telefon raqami bilan foydalanuvchi allaqachon mavjud |

---

## 2. `POST /login`

**Request body**

| Field      | Turi   |
|------------|--------|
| `phone`    | string (`+998XXXXXXXXX`) |
| `password` | string (min 1) |

**Response — 200 OK** — `register` bilan bir xil `data` shakli (`user` + `tokens`).

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Validatsiya xatosi |
| 401 | Telefon raqam yoki parol noto'g'ri (yoki foydalanuvchi `isActive=false`) |

---

## 3. `POST /refresh`

Refresh token rotatsiyasi orqali yangi access+refresh juftlik olish.

**Request body**

```json
{ "refreshToken": "..." }
```

**Response — 200 OK** — `data`: `{ user, tokens }` (yangi juftlik).

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Validatsiya xatosi |
| 401 | Token topilmadi / yaroqsiz |
| 401 | Token allaqachon bekor qilingan → **barcha sessiyalar bekor qilindi**, qaytadan login talab qilinadi |
| 401 | Token muddati o'tgan |
| 401 | Foydalanuvchi faol emas |

---

## 4. `POST /logout`

Berilgan refresh tokenni bekor qiladi (idempotent — token topilmasa ham 200 qaytaradi).

**Request body**

```json
{ "refreshToken": "..." }
```

**Response — 200 OK**

```json
{ "success": true, "message": "Tizimdan chiqdingiz" }
```

---

## 5. `GET /me`

Joriy foydalanuvchi ma'lumotini olish. **Auth talab qilinadi.**

**Headers**: `Authorization: Bearer <accessToken>`

**Response — 200 OK**

```json
{
  "success": true,
  "message": "OK",
  "data": { "id": "uuid", "phone": "+998901234567", "fullName": "Aliyev Vali", "role": "BEMOR" }
}
```

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 401 | `Authorization` header yo'q yoki `Bearer ` bilan boshlanmaydi |
| 401 | Token yaroqsiz yoki muddati o'tgan |
| 404 | Foydalanuvchi topilmadi yoki faol emas |

---

## 6. `POST /forgot-password`

Telefon uchun 6 xonali parolni tiklash kodini yuborish.

**Request body**

```json
{ "phone": "+998901234567" }
```

**Response — 200 OK** (foydalanuvchi mavjud bo'lsa ham, bo'lmasa ham **bir xil** javob — enumeration oldini olish uchun):

```json
{ "success": true, "message": "Agar bu raqam ro'yxatdan o'tgan bo'lsa, tasdiqlash kodi yuborildi" }
```

**Eslatma**: hozircha real SMS integratsiyasi yo'q — kod konsolga `[SMS STUB]` sifatida chiqadi. Kod **10 daqiqa** amal qiladi, avvalgi ishlatilmagan kodlar avtomatik bekor qilinadi.

---

## 7. `POST /reset-password`

**Request body**

| Field         | Turi   | Talablar        |
|---------------|--------|-----------------|
| `phone`       | string | `+998XXXXXXXXX` |
| `code`        | string | 6 xonali        |
| `newPassword` | string | kamida 8 belgi  |

```json
{ "phone": "+998901234567", "code": "123456", "newPassword": "NewSecret123" }
```

**Response — 200 OK**

```json
{ "success": true, "message": "Parol muvaffaqiyatli yangilandi" }
```

Muvaffaqiyatli reset'dan so'ng foydalanuvchining **barcha refresh tokenlari bekor qilinadi** (barcha qurilmalardan chiqib ketadi — qaytadan login talab qilinadi).

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Validatsiya xatosi |
| 400 | Kod yaroqsiz yoki muddati o'tgan (yoki foydalanuvchi umuman topilmasa ham shu xabar qaytadi) |

---

## Admin — foydalanuvchilarni boshqarish (`/api/v1/auth/users`)

Barchasi **Auth: JWT + `ADMINISTRATOR` roli**.

### 26. `GET /users`

Foydalanuvchilar ro'yxati.

**Query parametrlari**: `role` (`BEMOR`/`SHIFOKOR`/`ADMINISTRATOR`), `isActive` (boolean), `search` (telefon yoki F.I.Sh bo'yicha), `page` (default `1`), `limit` (default `20`, maks `100`).

**Response — 200 OK**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      { "id": "uuid", "phone": "+998901234567", "fullName": "Aliyev Vali", "role": "BEMOR", "isActive": true, "createdAt": "2026-08-01T10:00:00.000Z" }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### 27. `PATCH /users/:id/status`

Foydalanuvchini bloklash/aktivlashtirish.

**Request body**

```json
{ "isActive": false }
```

`isActive: false` qilinganda foydalanuvchining **barcha faol refresh tokenlari bekor qilinadi** (majburiy chiqish — barcha qurilmalardan).

**Xatoliklar**: `400` validatsiya, `401/403` auth, `404` topilmadi.

### 28. `POST /users/provision`

`SHIFOKOR` yoki `ADMINISTRATOR` akkaunt yaratish (`BEMOR` — ochiq `POST /register` orqali yaratiladi, bu yerda kerak emas).

**Request body**

```json
{ "phone": "+998901234567", "password": "SuperSecret123", "fullName": "Dr. Aliyev", "role": "SHIFOKOR" }
```

**Response — 201 Created** — yaratilgan foydalanuvchi (`GET /users` bilan bir xil shakl, lekin bitta obyekt).

**Xatoliklar**: `400` validatsiya (`role` faqat `SHIFOKOR`/`ADMINISTRATOR`), `401/403` auth, `409` — shu telefon raqami bilan foydalanuvchi allaqachon mavjud.

---

# Drug moduli (`/api/v1/drugs`)

Base URL: `http://localhost:3001/api/v1/drugs`

## 8. `GET /`

Dorilar ro'yxati (faqat `isActive: true` bo'lganlar, agar `isActive` query orqali boshqacha berilmasa). Auth talab qilinmaydi.

**Query parametrlari**

| Param | Turi | Izoh |
|---|---|---|
| `search` | string | `name` yoki `internationalName` bo'yicha qidiruv (case-insensitive) |
| `dosageForm` | enum | `TABLETKA`, `KAPSULA`, `SIROP`, `INYEKSIYA`, `MALHAM`, `TOMCHI`, `SPREY`, `BOSHQA` |
| `requiresPrescription` | boolean | |
| `isActive` | boolean | default: `true` |
| `page` | number | default: `1` |
| `limit` | number | default: `20`, max `100` |

**Response — 200 OK**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Paracetamol Extra",
        "internationalName": "Paracetamol",
        "manufacturer": "Nobel Pharma",
        "country": "O'zbekiston",
        "dosageForm": "TABLETKA",
        "dosage": "500mg",
        "packageSize": "20 tabletka/quti",
        "barcode": "4780123456789",
        "price": 15000,
        "stock": 120,
        "requiresPrescription": false,
        "description": null,
        "imageUrl": null,
        "isActive": true,
        "createdAt": "2026-07-28T10:00:00.000Z",
        "updatedAt": "2026-07-28T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

## 9. `GET /:id`

Bitta dori. Auth talab qilinmaydi.

**Xatoliklar**: `404` — dori topilmadi yoki `isActive: false`.

## 10. `POST /`

Yangi dori qo'shish. **Auth: JWT + `ADMINISTRATOR` roli.**

**Request body** — `dosageForm`, `stock`, `requiresPrescription` majburiy emas (default qiymatlar bor), qolganlaridan `name`, `manufacturer`, `price` majburiy:

```json
{
  "name": "Paracetamol Extra",
  "internationalName": "Paracetamol",
  "manufacturer": "Nobel Pharma",
  "country": "O'zbekiston",
  "dosageForm": "TABLETKA",
  "dosage": "500mg",
  "packageSize": "20 tabletka/quti",
  "barcode": "4780123456789",
  "price": 15000,
  "stock": 120,
  "requiresPrescription": false
}
```

**Response — 201 Created** — yaratilgan dori obyekti (`GET /:id` bilan bir xil shakl).

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Validatsiya xatosi |
| 401 / 403 | Auth yo'q yoki `ADMINISTRATOR` emas |
| 409 | Shu `barcode` bilan dori allaqachon mavjud |

## 11. `PUT /:id`

Tahrirlash — barcha maydonlar ixtiyoriy (`POST` sxemasining `.partial()`). **Auth: JWT + `ADMINISTRATOR` roli.**

**Xatoliklar**: `400` validatsiya, `401/403` auth, `404` dori topilmadi.

## 12. `DELETE /:id`

Soft delete — `isActive: false` qilib qo'yadi, DB'dan o'chirmaydi. **Auth: JWT + `ADMINISTRATOR` roli.**

**Response — 200 OK**: `{ "success": true, "message": "Dori o'chirildi" }`

---

# Prescription moduli (`/api/v1/prescriptions`)

Base URL: `http://localhost:3001/api/v1/prescriptions`

Retsept rasmini qabul qiladi, `ocr-service`ning `/api/ocr/analyze` endpointi orqali (native `fetch`/`FormData` bilan, `OCR_SERVICE_URL` env orqali) matnni tuzilgan ma'lumotga aylantiradi va saqlaydi. Shifokor keyin tasdiqlaydi yoki rad etadi.

## 13. `POST /`

Retsept rasmini yuklash. **Auth: JWT + `BEMOR` roli.**

**Request**: `multipart/form-data`, maydon nomi — `file` (rasm, JPEG/PNG/WEBP, maks. 10MB).

**Response — 201 Created**

```json
{
  "success": true,
  "message": "Retsept qabul qilindi, ko'rib chiqilmoqda",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": null,
    "source": "OCR",
    "imageUrl": "/uploads/prescriptions/f1e2...jpg",
    "dmedUuid": null,
    "status": "PENDING",
    "rejectReason": null,
    "reviewedAt": null,
    "items": [
      {
        "id": "uuid",
        "retseptId": "MAB1361987",
        "himoyaKodi": "...",
        "bemorFish": "...",
        "bemorYosh": "...",
        "shifokorFish": "...",
        "drugId": null,
        "drugNameRaw": "Paracetamol 500mg",
        "releaseForm": "tabletka",
        "usageMethod": "ichishga",
        "dailyDoseCount": "2",
        "duration": "5 kun",
        "regimen": "ovqatdan keyin",
        "totalQuantity": "10",
        "note": null,
        "validUntil": "..."
      }
    ],
    "createdAt": "2026-08-10T18:00:00.000Z",
    "updatedAt": "2026-08-10T18:00:00.000Z"
  }
}
```

`items[]` maydonlari `ocr-service`ning DMED retsept OCR javobidagi o'zbekcha kalitlarga bevosita mos keladi — ma'lumot yo'qotilmasdan saqlanadi. `drugId` avtomatik bog'lanmaydi (hozircha `null`) — `drugNameRaw` xom OCR matni sifatida saqlanadi.

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Fayl yuklanmadi yoki rasm formatida emas |
| 401 / 403 | Auth yo'q yoki `BEMOR` emas |
| 422 | Rasmdan retsept ma'lumotlari aniqlanmadi (OCR bo'sh natija qaytardi) |
| 502 | `ocr-service`ga ulanib bo'lmadi yoki u xato qaytardi |

## 14. `POST /dmed`

dmed davlat tizimidan QR-kod orqali retsept import qilish (F-001). **Auth: JWT + `BEMOR` roli.**

> **Hozircha mock**: real `api.dmed.uz` ulanishi yo'q (hamkorlik muzokara jarayonida). `DmedAdapter` interfeysi orqali `MockDmedAdapter` chaqiriladi — har qanday UUID uchun taxminiy (lekin barqaror) retsept ma'lumoti qaytaradi. `DMED_MODE=real`ga o'tkazilganda (real adapter implementatsiya qilingach) xatti-harakat avtomatik almashadi, boshqa hech narsa o'zgarmaydi.

**Request body**

```json
{ "uuid": "b3f1c2a0-1234-4abc-9def-0123456789ab" }
```

**Response — 201 Created** — `POST /` bilan bir xil `Prescription` shakli, farqlar: `source: "DMED_QR"`, `dmedUuid` to'ldirilgan, `imageUrl: null`, **`status` darhol `APPROVED`** (dmed retsepti allaqachon shifokor tomonidan rasmiylashtirilgan va raqamli imzolangan deb hisoblanadi — qayta tasdiqlash shart emas, OCR manbasidan farqli o'laroq).

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Validatsiya xatosi (`uuid` bo'sh) |
| 401 / 403 | Auth yo'q yoki `BEMOR` emas |
| 404 | dmed tizimida bunday UUID topilmadi |
| 409 | Bu dmed retsepti (`dmedUuid`) allaqachon import qilingan |

## 15. `GET /`

Ro'yxat. **Auth: JWT** (istalgan rol).

- `BEMOR` — faqat o'ziga tegishli retseptlarni ko'radi (`patientId` avtomatik filtrlanadi)
- `SHIFOKOR` / `ADMINISTRATOR` — barcha retseptlarni ko'radi

**Query parametrlari**: `status` (`PENDING`/`APPROVED`/`REJECTED`), `page` (default `1`), `limit` (default `20`, maks `100`).

**Response — 200 OK** — `{ items: Prescription[], total, page, limit }` (`POST /` bilan bir xil `Prescription` shakli).

## 16. `GET /:id`

Bitta retsept. **Auth: JWT.** `BEMOR` faqat o'ziniki bo'lsa ko'ra oladi (`403` aks holda).

**Xatoliklar**: `404` topilmadi, `403` boshqa bemorning retsepti.

## 17. `PATCH /:id/approve`

Retseptni tasdiqlaydi (`status: APPROVED`, `doctorId` = joriy shifokor). **Auth: JWT + `SHIFOKOR` roli.** (Faqat `OCR` manbali retseptlar uchun amaliy — `DMED_QR` retseptlari import paytida darhol tasdiqlangan bo'ladi, shuning uchun `409` qaytaradi.)

**Xatoliklar**: `404` topilmadi, `409` — retsept allaqachon `PENDING` holatida emas (qayta ko'rib chiqib bo'lmaydi).

## 18. `PATCH /:id/reject`

Retseptni rad etadi. **Auth: JWT + `SHIFOKOR` roli.**

**Request body**

```json
{ "reason": "Dozasi noaniq, qayta yuklang" }
```

**Xatoliklar**: `400` validatsiya (`reason` bo'sh), `404` topilmadi, `409` allaqachon ko'rib chiqilgan.

---

# Schedule moduli (`/api/v1/schedules`) — F-003 Smart eslatma tizimi

Base URL: `http://localhost:3001/api/v1/schedules`

## 19. `POST /`

Dori qabul qilish jadvali yaratish. **Auth: JWT + `BEMOR` roli.**

**Request body**

```json
{
  "drugId": null,
  "drugName": "Vitamin C",
  "dosageNote": "1 tabletka",
  "scheduleTimes": ["08:00", "13:00", "20:00"],
  "startDate": "2026-08-11",
  "endDate": null
}
```

`drugName` va `scheduleTimes` majburiy (`scheduleTimes` — kamida 1, ko'pi bilan 10 ta `HH:mm` vaqt). `drugId` ixtiyoriy — `drug` katalogidan bog'lash uchun (berilsa, mavjud va faol dori bo'lishi tekshiriladi).

**Response — 201 Created**

```json
{
  "success": true,
  "message": "Dori jadvali yaratildi",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "drugId": null,
    "drugName": "Vitamin C",
    "dosageNote": "1 tabletka",
    "scheduleTimes": ["08:00", "13:00", "20:00"],
    "startDate": "2026-08-11T00:00:00.000Z",
    "endDate": null,
    "isActive": true,
    "createdAt": "2026-08-11T08:00:00.000Z",
    "updatedAt": "2026-08-11T08:00:00.000Z"
  }
}
```

**Xatoliklar**: `400` validatsiya, `401/403` auth, `404` — `drugId` berilgan-u topilmagan/faol emas.

## 20. `GET /`

O'z jadvallari ro'yxati. **Auth: JWT + `BEMOR` roli.** — `data: ScheduleResponse[]` (sahifalashsiz, to'liq ro'yxat).

## 21. `GET /:id`

Bitta jadval (faqat egasi ko'ra oladi, aks holda `404`).

## 22. `PATCH /:id/deactivate`

Jadvalni to'xtatadi (`isActive: false`) — bundan keyin yangi `DoseEvent` yaratilmaydi, lekin avvalgi tarix saqlanib qoladi.

---

# Dose moduli (`/api/v1/doses`) — "Oldim" / "O'tkazib yubordim"

Base URL: `http://localhost:3001/api/v1/doses`

Har bir yozuv — bitta jadvalning bitta aniq vaqtdagi dozasi. Fon jarayoni (`src/jobs/dose-scheduler.job.ts`) faol jadvallardan avtomatik yaratadi (batafsil: [`README.md`](../README.md) § `schedule`/`dose` moduli).

## 23. `GET /`

O'z dozalari ro'yxati. **Auth: JWT + `BEMOR` roli.**

**Query parametrlari**: `status` (`PENDING`/`TAKEN`/`SKIPPED`), `from`/`to` (ISO sana, `scheduledAt` bo'yicha oraliq filtri), `page` (default `1`), `limit` (default `50`, maks `200`).

**Response — 200 OK**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "uuid",
        "scheduleId": "uuid",
        "drugName": "Vitamin C",
        "dosageNote": "1 tabletka",
        "scheduledAt": "2026-08-11T03:00:00.000Z",
        "status": "PENDING",
        "confirmedAt": null,
        "remindersSent": 2
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

## 24. `PATCH /:id/confirm`

"Oldim" tugmasi — `status: TAKEN`, `confirmedAt` = hozirgi vaqt. **Auth: JWT + `BEMOR` roli**, faqat doza egasi.

**Xatoliklar**: `404` topilmadi/boshqaniki, `409` — doza allaqachon `TAKEN`/`SKIPPED` (qayta belgilab bo'lmaydi).

## 25. `PATCH /:id/skip`

"O'tkazib yubordim" tugmasi — `status: SKIPPED`. Xatoliklar `confirm` bilan bir xil.

---

# Interaction moduli (`/api/v1/interactions`) — F-004 (soddalashtirilgan)

Base URL: `http://localhost:3001/api/v1/interactions`

> **Hozircha faqat struktura**: real ma'lumot manbai (DrugBank litsenziyasi) hal qilinmagan. Bu modul dori-dori o'zaro ta'sirini **admin qo'lda kiritgan** juftliklar asosida tekshiradi — avtomatik/AI-based aniqlash emas. Jadval bo'sh boshlanadi, admin vaqt o'tishi bilan to'ldiradi.

## 26. `POST /`

Yangi o'zaro ta'sir juftligi qo'shish. **Auth: JWT + `ADMINISTRATOR` roli.**

**Request body**

```json
{ "drugAId": "uuid-1", "drugBId": "uuid-2", "severity": "RED", "description": "Qon ketish xavfini oshiradi" }
```

`severity`: `GREEN` (minimal) / `YELLOW` (ehtiyot bo'lish kerak) / `RED` (xavfli).

**Response — 201 Created** — yaratilgan yozuv.

**Xatoliklar**
| Status | Sabab |
|--------|-------|
| 400 | Validatsiya (`drugAId === drugBId` va h.k.) |
| 401/403 | Auth yo'q yoki `ADMINISTRATOR` emas |
| 404 | `drugAId`/`drugBId`dan biri topilmadi |
| 409 | Shu ikki dori uchun yozuv allaqachon mavjud (tartibdan qat'i nazar — A-B va B-A bir xil hisoblanadi) |

## 27. `GET /`

Barcha yozuvlar ro'yxati (sahifalash bilan). **Auth: JWT + `ADMINISTRATOR` roli.**

## 28. `DELETE /:id`

Yozuvni o'chiradi. **Auth: JWT + `ADMINISTRATOR` roli.**

## 29. `POST /check`

Berilgan dorilar to'plami ichida ma'lum bo'lgan o'zaro ta'sirlarni tekshiradi. **Auth: JWT** (istalgan rol — bemor ham o'z dorilarini tekshira oladi).

**Request body**

```json
{ "drugIds": ["uuid-1", "uuid-2", "uuid-3"] }
```

**Response — 200 OK** — topilgan juftliklar ro'yxati (`data: []`, agar hech qanday mos yozuv topilmasa — bu hozircha jadval bo'sh bo'lgani uchun normal holat).

**Xatoliklar**: `400` — kamida 2 ta `drugId` kerak.

---

## Umumiy xato javob shakli

Validatsiya (400) va boshqa xatolar (401/403/404/409/500) uchun:

```json
{ "success": false, "message": "..." }
```

`development` muhitida qo'shimcha `stack` maydoni ham qaytadi.

## Qamrovdan tashqarida

- Eskiz.uz orqali real SMS yuborish
- Biometric token endpoint
- Shifokor / Administrator uchun alohida provisioning endpoint (hozircha faqat DB orqali qo'lda)
