# Admin panel API

Prefiks: `/api/v1/admin`. Barcha yo'llar `Authorization: Bearer <accessToken>` talab qiladi va faqat `ADMINISTRATOR` roli uchun ochiq (aks holda `401` / `403`). Token `POST /api/v1/auth/login` orqali olinadi, `POST /api/v1/auth/refresh` bilan yangilanadi (access token 15 daqiqa yashaydi).

Javob formati boshqa modullar bilan bir xil: `{ success, message, data }`. Ro'yxatlar `data: { items, total, page, limit }` qaytaradi; `page` (1 dan) va `limit` (1–100, standart 20) barcha ro'yxatlarda ishlaydi. Mantiqiy query parametrlari `true`/`false` (yoki `1`/`0`) qabul qiladi.

## Dashboard

| Metod | Yo'l | Izoh |
| --- | --- | --- |
| GET | `/stats?days=7&lowStockThreshold=10` | Foydalanuvchilar (rol, faol/bloklangan, yangi), retseptlar (status, manba), dorilar (faol, nofaol, kam qolgan, tugagan), o'zaro ta'sirlar (darajasi), dozalar (status va `adherenceRate` 0..1) va grafik uchun kunlik `series.registrations` / `series.prescriptions`. `days` 1–90; kunlar server vaqt mintaqasida (`TZ`) hisoblanadi, bo'sh kunlar `0` bilan keladi. |

## Tizim holati va OCR

| Metod | Yo'l | Izoh |
| --- | --- | --- |
| GET | `/system/health` | core (uptime, Node, muhit), PostgreSQL va OCR xizmatining holati hamda javob vaqti (ms) |
| POST | `/ocr/analyze` | `multipart/form-data`, maydon `file` (rasm, 10MB gacha). Retseptni **saqlamasdan** OCR natijasini qaytaradi: har bir dori qatori va bazadan topilgan mos dori (`matchedDrug`), `durationMs`. OCR xizmati tashqariga ochilmaydi — admin panel unga shu proksi orqali murojaat qiladi |

## Foydalanuvchilar

| Metod | Yo'l | Body / query |
| --- | --- | --- |
| GET | `/users` | `role`, `isActive`, `search` (telefon yoki ism), `sortBy` = `createdAt`\|`fullName`\|`phone`, `order` = `asc`\|`desc` |
| POST | `/users` | `{ phone, password, fullName, role }` — istalgan rol (BEMOR ham) |
| GET | `/users/:id` | Batafsil: `lastLoginAt`, `activeSessions`, bog'liq yozuvlar soni, oxirgi 30 kunlik dozalar va `adherenceRate` |
| PATCH | `/users/:id` | `{ phone?, fullName?, role? }` — rol o'zgarsa foydalanuvchi sessiyalari yopiladi |
| PATCH | `/users/:id/status` | `{ isActive }` — bloklanganda sessiyalar yopiladi; `true` vaqtincha blokni ham olib tashlaydi |
| POST | `/users/:id/block` | `{ until?, reason? }` — `until` (ISO vaqt, 365 kungacha) berilsa vaqtincha blok, muddat o'tgach avtomatik ochiladi; berilmasa muddatsiz blok. Sessiyalar darhol yopiladi |
| POST | `/users/:id/unblock` | Har qanday blokni (vaqtincha yoki muddatsiz) olib tashlaydi |
| DELETE | `/users/:id` | Butunlay o'chirish: bemor retseptlari, jadvallari, dozalari, oila profillari ham o'chadi; shifokor ko'rib chiqqan retseptlarda `doctorId` null bo'ladi. `data.deleted` — o'chirilgan yozuvlar soni |
| POST | `/users/:id/reset-password` | `{ newPassword }` — barcha sessiyalar yopiladi |
| POST | `/users/:id/revoke-sessions` | Majburiy chiqish; `data.revoked` — yopilgan sessiyalar soni |

Himoyalar: admin o'zini bloklay, o'chira va o'z rolini o'zgartira olmaydi; oxirgi faol administratorni bloklash, o'chirish yoki rolini tushirish mumkin emas (`400`).

Foydalanuvchi obyektida `blockedUntil` (amaldagi vaqtincha blok tugash vaqti yoki `null`) va `blockReason` bor. `isActive` filtri: `true` — hozir kira oladiganlar, `false` — muddatsiz yoki vaqtincha bloklanganlar. Vaqtincha bloklangan foydalanuvchi to'g'ri parol bilan kirganda `403 "Hisobingiz ... gacha vaqtincha bloklangan"` oladi.

Eslatma: bloklash refresh tokenlarni darhol bekor qiladi, lekin allaqachon berilgan access token muddati (15 daqiqagacha) tugaguncha ishlashi mumkin.

## Retseptlar (faqat ko'rish)

| Metod | Yo'l | Query |
| --- | --- | --- |
| GET | `/prescriptions` | `status`, `source` (`OCR`\|`DMED_QR`), `patientId`, `doctorId`, `search` (bemor telefoni yoki ismi), `from`, `to` (ISO sana), `order` |
| GET | `/prescriptions/:id` | Retsept qatorlari bilan |

Har bir retseptda `patient` va `doctor` (`{ id, phone, fullName }` yoki `null`) bor. Tasdiqlash yoki rad etish shifokor endpointlarida qoladi (`/api/v1/prescriptions/:id/approve|reject`).

## Dorilar

| Metod | Yo'l | Body / query |
| --- | --- | --- |
| GET | `/drugs` | `search` (nom, xalqaro nom, ishlab chiqaruvchi, shtrix-kod), `dosageForm`, `requiresPrescription`, `isActive` (berilmasa hammasi), `maxStock`, `sortBy` = `name`\|`price`\|`stock`\|`createdAt`\|`updatedAt`, `order` (standart `asc`) |
| POST | `/drugs` | `POST /api/v1/drugs` bilan bir xil body |
| GET | `/drugs/:id` | Nofaol dorini ham qaytaradi |
| PUT | `/drugs/:id` | Qisman yangilash |
| DELETE | `/drugs/:id` | Soft delete (`isActive=false`) |
| PATCH | `/drugs/:id/restore` | Qayta faollashtirish |
| PATCH | `/drugs/:id/stock` | `{ stock }` (aniq qiymat) yoki `{ delta }` (kirim `+` / chiqim `-`). Ikkalasidan aynan bittasi yuboriladi; qoldiq manfiy bo'lsa `400` |

Ommaviy `GET /api/v1/drugs` endi faqat faol dorilarni qaytaradi; nofaol dorilar faqat shu yerda ko'rinadi.

## Dorilarning o'zaro ta'siri

| Metod | Yo'l | Body / query |
| --- | --- | --- |
| GET | `/interactions` | `severity` (`GREEN`\|`YELLOW`\|`RED`), `drugId`, `search` (dori nomi). Har bir yozuvda `drugA` va `drugB` nomlari bor |
| POST | `/interactions` | `{ drugAId, drugBId, severity, description? }` |
| PATCH | `/interactions/:id` | `{ severity?, description? }` |
| DELETE | `/interactions/:id` | |

## CORS

Brauzerdagi admin panel uchun core-service'ga `CORS_ORIGINS` beriladi: vergul bilan ajratilgan manbalar, masalan `https://admin.example.com,http://localhost:5173`. Bo'sh bo'lsa CORS sarlavhalari qo'yilmaydi (mobil ilovaga ta'sir qilmaydi).
