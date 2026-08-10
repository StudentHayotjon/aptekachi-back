# Auth Service

TZ v2.1 § 4.4 / § 6 ga asosan: OAuth 2.0 uslubidagi JWT autentifikatsiya (access 15 daqiqa TTL) + refresh token rotation + RBAC (Bemor / Shifokor / Administrator). Port: **3001**.

## Ishga tushirish

```bash
cp .env.example .env   # DATABASE_URL va JWT_ACCESS_SECRET ni to'ldiring
npm install
npx prisma migrate dev --name init
npm run dev
```

## Endpointlar (`/api/v1/auth`)

| Method | Path       | Auth | Tavsif                                  |
|--------|-----------|------|------------------------------------------|
| POST   | /register | -    | Telefon+parol bilan ro'yxatdan o'tish (rol har doim `BEMOR`) |
| POST   | /login    | -    | Access + refresh token olish             |
| POST   | /refresh  | -    | Refresh token rotatsiyasi                |
| POST   | /logout   | -    | Refresh tokenni bekor qilish             |
| GET    | /me       | JWT  | Joriy foydalanuvchi ma'lumoti            |
| POST   | /forgot-password | - | Telefon uchun 6 xonali tiklash kodi yuborish |
| POST   | /reset-password  | - | Kod + yangi parol bilan parolni tiklash |

## Qamrovdan tashqarida (keyingi bosqich)

- OTP (SMS) orqali tasdiqlash — Eskiz.uz integratsiyasi (hozircha `forgot-password` kodi konsolga chiqadi, `[SMS STUB]`)
- Biometric token endpoint
- Shifokor / Administrator provisioning (hozircha faqat DB orqali qo'lda)

## Eslatma

- Refresh token — JWT emas, tasodifiy 96-baytli token; DB'da faqat uning SHA-256 xeshi saqlanadi (o'g'irlansa ham qayta ishlatib bo'lmaydi). Refresh oqimida token reuse aniqlansa, foydalanuvchining barcha sessiyalari bekor qilinadi.
- Parolni tiklash kodi 10 daqiqa amal qiladi, bir marta ishlatiladi va muvaffaqiyatli reset'dan so'ng foydalanuvchining barcha refresh tokenlari bekor qilinadi (barcha qurilmalardan chiqib ketadi).
- `forgot-password` foydalanuvchi mavjudligini oshkor qilmaslik uchun telefon raqam bazada bor-yo'qligidan qat'i nazar bir xil javob qaytaradi.
- Prisma bilan ishlashda doim `npx prisma ...` ishlating (loyiha v6 ishlatadi), global o'rnatilgan `prisma` CLI bilan aralashtirmang.
