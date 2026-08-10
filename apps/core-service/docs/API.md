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
