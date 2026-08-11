# Aptekachi v0 — Loyiha xaritasi (Roadmap)

Manba hujjat: `APTEKACHI_TZ_v2_2_final.docx` (TZ v2.1). Ushbu fayl — TZ'dagi to'liq vizyonni **hozirgi real imkoniyatlarga** (solo/kichik dev, faqat Node.js/TypeScript stack, tashqi integratsiyalar hali yo'q) moslab qayta tartiblangan ish rejasi. TZ — maqsad; bu hujjat — unga boradigan real yo'l.

## 0. TZ va reallik o'rtasidagi tafovut — nega to'liq TZ MVP emas

TZ'ning o'zi "MVP" deb atagan qism (§9) ham quyidagilarni talab qiladi: iOS (Swift) + Android (Java) native jamoalar, Python (FastAPI/spaCy/LangChain) jamoasi, **dmed davlat tizimiga real API kirish**, DrugBank kommertsiya litsenziyasi, Kong/Keycloak/MinIO/RabbitMQ/ClickHouse/Elasticsearch infratuzilmasi — 11 milestone, ko'p kishilik jamoa uchun mo'ljallangan. Hozirgi loyiha buning hech biriga ega emas — faqat Node.js/TypeScript backend (`core-service`, `ocr-service`) bor, frontend/mobil ilova umuman yo'q.

**Muhim aniqlik**: TZ'da hech qanday sotib olish/buyurtma (e-commerce) funksiyasi yo'q — Aptekachi bu **retsept import + dori qabul qilish eslatma tizimi**, do'kon emas. (Oldingi tahlilda bu noto'g'ri taxmin qilingan edi — TZ o'qib chiqilgach tuzatildi.)

**dmed API holati**: hozircha kirish huquqi yo'q, hamkorlik muzokara jarayonida. Shuning uchun F-001 (★ASOSIY) hozircha **mock adapter** bilan quriladi — real kalitlar kelganda faqat adapter implementatsiyasi almashtiriladi, qolgan tizim o'zgarmaydi.

---

## 1. TZ funksiyalari — holat va reja

| # | TZ funksiyasi | Ustuvorlik (TZ) | Bizda holat |
|---|---|---|---|
| F-001 | dmed QR retsept integratsiyasi | ★ ASOSIY, MVP #1 | ✅ Mock adapter bilan qurilgan — `POST /api/v1/prescriptions/dmed`. Real `api.dmed.uz` hali ulanmagan (hamkorlik muzokara jarayonida), `DmedAdapter` interfeysi orqali oson almashtiriladi |
| F-002 | OCR chek/retsept skaneri | ★ INNOVATSIYA, MVP #2 | ✅ Qurilgan — `ocr-service` (Gemini) + `core-service`dagi `prescription` moduli. Stack TZ'dan farqli (Python+Google Vision+spaCy/RxNorm o'rniga Node.js+Gemini) — pragmatik almashtirish, natija bir xil |
| F-003 | Smart eslatma tizimi (push, missed dose, refill, drug interaction alert, Ramazon mode) | MVP | ✅ Yadrosi qurilgan — `schedule`/`dose` modullari: jadval, "Oldim"/"O'tkazib yubordim", har soatda qayta so'rash. Push/FCM/APNs/Ramazon mode/refill alert hali yo'q (quyida) |
| F-004 | Dori ma'lumotlar bazasi (RxNorm/DrugBank/OpenFDA) + interaction checker | MVP | ⚠️ Qisman — oddiy `Drug` katalogi bor (`drug` moduli), lekin DrugBank litsenziyasi va interaction engine yo'q |
| F-005..F-010 | Vital signs, AI Assistant, Oilaviy profil, Gamification, Apteka Map, Telemedicine | v1.5/v2.0 | Ataylab qamrovdan tashqarida — TZ'ning o'zida ham keyingi bosqich |
| — | Sotib olish/buyurtma | TZ'da yo'q | ❌ Kerak emas — mahsulot qamrovida yo'q |

## 2. Rollar va infratuzilma — TZ bilan solishtirish

`Bemor` / `Shifokor` / `Administrator` rollari va Auth Service porti (**3001**) TZ'ga aynan mos (`core-service`da tayyor). Farqlar:

| TZ talabi | Bizda qaror | Sabab |
|---|---|---|
| Node.js (Auth/Prescription/Notification) + Python (OCR/Drug/AI) — mikroservislar, Kong gateway | Bitta Node.js/TS modular monolit (`core-service`) + alohida `ocr-service` | Solo dev uchun 2 tilni parallel boshqarish, Kong/Keycloak sozlash — ortiqcha murakkablik. Modullar keyin kerak bo'lsa alohida servisga ajratiladi ([oldingi muhokama](#)) |
| MinIO (S3-compatible), 30 min TTL | Lokal disk (`uploads/`) | MVP uchun yetarli, production'da S3/MinIO'ga o'tish kerak bo'ladi |
| RabbitMQ, ClickHouse, Elasticsearch, Sentry, Grafana | Yo'q | MVP bosqichida ortiqcha — trafik/monitoring ehtiyoji paydo bo'lgach qo'shiladi |
| iOS Swift + Android Java native | Yo'q | Frontend umuman yo'q — quyida ko'rib chiqiladi |

---

## 3. Qayta belgilangan MVP ustuvorligi

1. ~~**F-001 — dmed QR integratsiyasi (mock adapter bilan)**~~ — ✅ tayyor
   - `Prescription` modeliga `dmedUuid` (`@unique`) va `source` (`OCR` / `DMED_QR`) maydoni qo'shildi
   - `POST /api/v1/prescriptions/dmed` — QR'dan o'qilgan UUID qabul qiladi, `src/integrations/dmed/DmedAdapter` interfeysi orqali ma'lumot oladi, import qilingan retsept darhol `APPROVED` bo'ladi (dmed'da allaqachon tasdiqlangan hisoblanadi)
   - Hozirgi implementatsiya — `MockDmedAdapter` (har qanday UUID uchun barqaror taxminiy javob, bitta sentinel UUID `404`ni simulyatsiya qiladi). Real API kalitlari kelganda `DMED_MODE=real` va yangi adapter implementatsiyasi qo'shiladi, qolgan tizim (route, service, DB) o'zgarmaydi. To'liq API: [`apps/core-service/docs/API.md`](../apps/core-service/docs/API.md) § Prescription moduli
2. ~~**F-003 — Smart eslatma tizimi (soddalashtirilgan)**~~ — ✅ yadrosi tayyor
   - `MedicationSchedule` (dori + qabul vaqtlari, `["08:00","20:00"]` kabi) va `DoseEvent` (har bir aniq vaqtdagi bitta doza holati: `PENDING`/`TAKEN`/`SKIPPED`) modellari qo'shildi
   - `POST /api/v1/schedules`, `GET/PATCH /api/v1/doses/:id/confirm`|`/skip` — "Oldim"/"O'tkazib yubordim" tugmalari uchun tayyor backend
   - `src/jobs/dose-scheduler.job.ts` (`node-cron`): har 5 daqiqada vaqti kelgan dozalarni avtomatik yaratadi, **har soat boshida** javob berilmagan (`PENDING`, vaqti o'tgan) dozalar uchun qayta eslatma yuboradi (Medisafe/MyTherapy'dagi "missed dose" naging patterniga mos)
   - Real bazada (Supabase) to'liq E2E tekshirildi: jadval yaratish → avtomatik doza generatsiyasi → confirm
   - ~~tasdiqlangan retsept/OCR natijasidan avtomatik jadval yaratish~~ — ✅ **tayyor**: `Prescription` `APPROVED` bo'lganda (`approve()`/`importFromDmed()`), har bir `PrescriptionItem`dan `ScheduleService.createFromPrescriptionItems()` avtomatik jadval yaratadi (`dailyDoseCount`→vaqtlar, `duration`→`endDate`, PRN/"kerak bo'lganda" — o'tkazib yuboriladi, `prescriptionItemId` orqali idempotent). Real bazada to'liq E2E va edge-case (PRN, o'qib bo'lmaydigan matn, idempotentlik) tekshirildi. TZ'ning "OCR → avtomatik jadval setup" MVP mezoni endi to'liq yopilgan
   - **Hali yo'q**: real push (FCM/APNs — mobil ilova yo'qligi uchun hozircha imkonsiz), eslatma yetkazish hali **stub** (`[REMINDER STUB]` konsolga), auto-yaratilgan jadvalni tahrirlash (faqat deactivate bor), Ramazon mode, refill alert, drug interaction alert
   - To'liq API: [`apps/core-service/docs/API.md`](../apps/core-service/docs/API.md) § Schedule/Dose moduli, [`apps/core-service/README.md`](../apps/core-service/README.md) § `schedule` moduli
3. **F-004 — Drug interaction checker — soddalashtirilgan yoki keyinga qoldirish** ← **keyingi qadam**
   - DrugBank kommertsiya litsenziyasi talab qiladi (pullik/murakkab) — hozircha real ma'lumot manbai yo'q
   - Muqobil: RxNorm (NIH/NLM, **bepul**) orqali faqat generic nom/ATC kod — to'liq interaction checker emas, lekin boshlanish nuqtasi. Yoki bu funksiyani butunlay keyingi bosqichga qoldirish
4. **Frontend — hali boshlanmagan, ataylab keyinga qoldirilgan**
   - Muhokama qilingan, lekin qaror: backend ustida davom etish (F-004 va h.k.), frontend ishi keyingi bosqichda
   - **Muhim aniqlangan tafovut (frontend boshlanganda hisobga olinsin)**: "internet o'chirilganda ham aniq vaqtda bildirishnoma" talabi PWA bilan **to'liq kafolatlanmaydi** — iOS Safari/PWA `Notification Triggers API`ni umuman qo'llab-quvvatlamaydi, Android Chrome'da ham eksperimental. TZ shuning uchun aynan native (`UNNotificationCenter` / `AlarmManager`) tanlagan. Frontend ishi boshlanganda PWA vs native (kamida Android) tanlovi **qayta ko'rib chiqilishi kerak**, ayniqsa TZ'ning o'zi "Internet yo'qligi — Yuqori (viloyatlar)" xavfini alohida qayd etgani uchun
   - To'g'ri arxitektura (frontend qurilganda): klient `GET /schedules`dan jadvalni tortib oladi → mahalliy xotiraga (SQLite/Room/Core Data) saqlaydi → qurilmaning o'zi mahalliy bildirishnoma rejalashtiradi (serverga bog'liq emas) → oflayn confirm/skip navbatga qo'yiladi, internet qaytganda serverga sinxronlanadi
5. Admin panel, `notification` moduli (real SMS) — F-001/F-003 bilan bog'liq holda, ulardan keyin

---

## 4. Hozirgi holat (`apps/*`)

| Qism | Holati | Izoh |
|---|---|---|
| `apps/core-service` | ✅ Ishlab turibdi | Modular monolit. `auth`, `drug`, `prescription`, `schedule`, `dose` modullari tayyor. Port: **3001**. API: [`apps/core-service/docs/API.md`](../apps/core-service/docs/API.md) |
| `apps/ocr-service` | ✅ Ishlab turibdi | Gemini asosida OCR (F-002). Port: **3000** |
| F-001 dmed integratsiyasi | ✅ Mock bilan tayyor | `src/integrations/dmed/` — real API kelguncha `MockDmedAdapter` ishlatiladi |
| F-003 Smart eslatma | ✅ Yadrosi tayyor | `schedule`/`dose` + `dose-scheduler.job.ts` cron. Eslatma yetkazish hali stub (real SMS/push yo'q) |
| F-004 Drug interaction checker | ⚠️ Keyingi qadam | Ma'lumot manbai (litsenziya) hal qilinmagan |
| Admin paneli / PWA frontend | ❌ Mavjud emas | F-001/F-003'dan keyin |
| `packages/shared-*`, `infra/*` | ⛔ Bo'sh | Monolit yondashuvida hozircha shart emas |

---

## 5. Xavfsizlik va huquqiy eslatmalar (TZ §6 asosida)

- "Shaxsiy ma'lumotlar to'g'risida"gi qonun (2019) — **data residency O'zbekiston serverlarida** talab qiladi. Hozirgi Supabase (`aws-0-ap-southeast-1`, AWS Singapur) bu talabga **mos emas** — production'ga chiqishdan oldin O'zbekiston/mintaqaviy hosting'ga ko'chirish kerak bo'ladi. MVP/dev bosqichida qabul qilinadi, lekin unutilmasligi kerak
- OCR rasmlari uchun TZ 30 daqiqalik avto-o'chirish talab qiladi (privacy-by-design) — hozirgi `uploads/prescriptions/` doimiy saqlaydi, bu farq hisobga olinishi kerak
- 16 yoshgacha ota-ona roziligi talabi — foydalanuvchi ro'yxatdan o'tish oqimida hali tekshirilmaydi

---

## 6. Monetizatsiya (TZ §11, ma'lumot uchun — MVP uchun emas)

Freemium (Bemor, bepul/15,000 UZS/oy), Shifokor PRO (35,000 UZS/oy), Apteka Partner (50,000 UZS/oy/apteka — panel+API, **sotib olish emas**), Korporativ/Government. MVP bosqichida monetizatsiya qurilmaydi, faqat kelajakdagi yo'nalish sifatida qayd etiladi.
