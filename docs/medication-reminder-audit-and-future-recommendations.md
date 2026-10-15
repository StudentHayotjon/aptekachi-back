# Dori boshqaruvi va salomatlik funksiyalari: audit va kelajak tavsiyalari

**Sana:** 2026-10-15  
**Qamrov:** Aptekachi loyihasining mavjud backend, admin panel, ma'lumotlar modeli va loyiha hujjatlari.  
**Maqsad:** MyTherapy uslubidagi dori eslatmalari, refill, salomatlik kundaligi, oila bilan ulashish va qurilma integratsiyalarining hozirgi holatini hujjatlashtirish hamda bosqichma-bosqich rivojlantirish yo'lini belgilash.

## 1. Qisqa xulosa

Loyihada dori jadvali va doza holatlarini yuritish uchun foydali backend asosi bor. Tasdiqlangan retseptlardan jadval avtomatik yaratilishi, doza hodisalari hosil bo'lishi va foydalanuvchi ularni `TAKEN` yoki `SKIPPED` deb belgilashi mumkin. Oila a'zosi profili hamda boshqa akkaunt jadvalini faqat ko'rish uchun ulash mavjud.

Biroq loyiha hozircha bemorga mo'ljallangan mobil ilova emas: ko'rib chiqilgan frontend — admin panel. Eslatma yuborish haqiqiy push yoki SMS emas, konsolga yoziladigan stub. Bemorning shaxsiy dori zaxirasi, refill ogohlantirishi, salomatlik/simptom kundaligi, ukol joylari tarixi va shifokor PDF hisoboti topilmadi. Kamera skaneri va Apple Health ham mobil/native klient bo'lmagani uchun hozir mavjud emas.

| Yo'nalish | Holat | Qisqa izoh |
|---|---|---|
| Dori shakllari | Qisman mavjud | Katalogda asosiy shakllar bor; foydalanuvchi qabul qilish usuli va shaklga xos birliklar to'liq modellashtirilmagan. |
| Dori jadvali | Qisman mavjud | Kunlik bir nechta vaqt, boshlanish/tugash sanasi va retseptdan jadval yaratish bor; hafta kunlari va sikllar yo'q. |
| Barcode | Qisman mavjud | Katalog barcode qiymatini saqlaydi; kamera skaneri, barcode bo'yicha qidiruv va tashqi katalog yo'q. |
| Eslatma va snooze | Qisman mavjud | Doza holati yuritiladi; yetkazish stub, snooze mavjud emas. |
| Bemor dori qoldig'i/refill | Mavjud emas | Admin omboridagi `Drug.stock` bemor qutisidagi qoldiq emas. |
| Salomatlik ko'rsatkichlari | Mavjud emas | Bosim, puls, vazn, glyukoza va faollik jurnali topilmadi. |
| Simptom va kayfiyat | Mavjud emas | Og'riq, kayfiyat va nojo'ya ta'sirlarni qayd etish yo'q. |
| Ukol joylari | Mavjud emas | Ukol qilingan tana qismi va rotatsiya tarixi saqlanmaydi. |
| Shifokor hisoboti | Mavjud emas | Bemor ma'lumotlaridan oylik PDF eksport yo'q. |
| Oila/jamoa ogohlantirishi | Qisman mavjud | Profil va jadvalni ulash bor; yaqinlarga doza o'tkazib yuborilgani haqida real xabar yo'q. |
| GDPR/maxfiylik | Tasdiqlanmagan | Kodning o'zi huquqiy muvofiqlikni yoki ma'lumotlar sotilmasligini isbotlamaydi. |
| Apple Health | Mavjud emas | iOS ilovasi va HealthKit ulanishi yo'q. |

## 2. Hozirgi tizimning chegarasi

- `core-service`da `MedicationSchedule` dori nomi, qabul vaqtlari, boshlanish/tugash sanasi va faol holatini saqlaydi.
- Fon vazifasi jadval vaqtlariga mos `DoseEvent` yozuvlarini yaratadi. Doza `PENDING`, `TAKEN` yoki `SKIPPED` holatida bo'ladi.
- `DoseService.confirm()` va `skip()` bemor yoki u boshqaradigan oila a'zosi uchun ishlaydi. Bog'langan haqiqiy akkauntlar faqat ko'rish huquqiga ega.
- Tasdiqlangan retseptlardan jadval avtomatik yaratilishi hujjatlashtirilgan. “Kerak bo'lganda” yozilgan dorilar avtomatik jadvalga aylantirilmaydi.
- `dose-scheduler.job.ts` javobsiz dozalarni qayta eslatishga urinadi, ammo `sendReminderStub()` telefon raqamiga xabar yubormaydi: faqat konsolga yozadi.
- `Drug.stock` va admin paneldagi past qoldiq ko'rsatkichi dorixona katalogi/ombori uchun. U bemorning o'z dori qutisidagi miqdorni hisoblamaydi.
- Admin panel marshrutlari dashboard, foydalanuvchilar, retseptlar, dorilar, interaction va OCR sahifalaridan iborat; bemor uchun dori boshqaruvi mobil frontend ko'rib chiqilgan qamrovda yo'q.

Tegishli manbalar: [ma'lumotlar modeli](../apps/core-service/prisma/schema.prisma), [Schedule va Dose API](../apps/core-service/docs/API.md), [doza scheduler'i](../apps/core-service/src/jobs/dose-scheduler.job.ts), [doza xizmati](../apps/core-service/src/services/dose.service.ts), [admin marshrutlari](../apps/admin-panel/src/app/routes.ts), [loyiha roadmap'i](../docs/PROJECT-ROADMAP.md).

## 3. Funksiyalar bo'yicha batafsil audit va tavsiyalar

### 3.1 Dori shakllari, jadval va aqlli eslatmalar

**Hozir bor**

- `DosageForm` enumida `TABLETKA`, `KAPSULA`, `SIROP`, `INYEKSIYA`, `MALHAM`, `TOMCHI`, `SPREY` va `BOSHQA` mavjud.
- Jadval bir kunda bir nechta `HH:mm` vaqt qabul qiladi (API validatsiyasida 1–10 ta vaqt).
- `startDate` va ixtiyoriy `endDate` davolanish oralig'ini belgilaydi.
- Retsept tasdiqlanganda mos jadval avtomatik yaratilishi mumkin.
- Dozani qabul qilish yoki o'tkazib yuborish API orqali qayd etiladi.

**Yetishmayotgan qism**

- Enumda `SPREY` bor, lekin ingalyator/aerozol kabi kichik turlar va ularning alohida qo'llash yo'riqnomalari yo'q.
- Jadval faqat kunlik vaqtlar ro'yxati. Dushanba/chorshanba/juma, har N kunda, sikl va dam olish kunlari ifodalanmaydi.
- Doza miqdori erkin `dosageNote` matni ko'rinishida. Masalan, “1 tabletka” yoki “2 tomchi” hisoblanadigan aniq qiymat/birlik sifatida saqlanmaydi.
- Vaqt zonasi va yozgi vaqt o'zgarishi jadval modelida aniq ko'rsatilmagan; scheduler serverning lokal vaqtiga tayanadi.
- Snooze (5/10/30 daqiqa) endpointi va saqlanadigan snooze holati yo'q.
- Haqiqiy push/SMS yetkazilishi yo'q. Serverdagi cron internet, server ish vaqti va to'g'ri timezone sozlamalariga bog'liq.

**Tavsiya**

1. Jadvalni ikki qatlamga ajrating: dori/davolash yozuvi va qabul qoidasi. Qoidada `frequencyType`, `weekdays`, `intervalDays`, `activeDays`, `restDays`, `cycleStartDate`, `startDate`, `endDate`, `timeZone` kabi maydonlar bo'lishi mumkin. Barcha maydonlarni bir vaqtning o'zida kiritmang: avval kerakli qoidalar uchun minimal sxema va validatsiya belgilang.
2. Doza miqdorini son va birlik sifatida saqlang (`amount`, `unit`), ko'rsatish uchun esa foydalanuvchiga tushunarli yorliqni qoldiring. Sirop, tomchi va ukol dozalari tabletkadan farq qilishini hisobga oling.
3. Siklni avval aniq dori turi bilan cheklamang; umumiy “N faol kun, M tanaffus kuni” qoidasi yarating. Davolash ko'rsatmasini shifokor/retsept belgilaydi, ilova o'zi tibbiy rejim tavsiya qilmasin.
4. Snooze uchun mavjud doza hodisasiga `snoozedUntil` va kerak bo'lsa `snoozeCount` qo'shing. Snooze qilingan dozani scheduler ikkinchi mustaqil doza sifatida yaratmasligi kerak. Takrorlashlar soni yoki muddatini mahsulot siyosati bilan cheklang.
5. Scheduler'ni timezone-aware qilib, doza generatsiyasini idempotent qiling. Mahalliy qurilma bildirishnomalari internet bo'lmaganda server cron'idan ishonchliroq; buning uchun keyinchalik native yoki yetarli imkoniyatli mobil klient zarur.

**Qabul mezonlari**

- Haftaning tanlangan kunlari va faol/tanaffus sikli uchun keyingi dozalar to'g'ri hosil bo'ladi.
- Scheduler bir xil jadval va vaqt uchun takroriy doza yozmaydi.
- Snooze mavjud dozani ko'chiradi, qabul qilingan/o'tkazib yuborilgan dozani qayta ochmaydi.
- Yozgi vaqt yoki timezone almashinuvida foydalanuvchiga ko'rsatiladigan vaqt izchil qoladi.

### 3.2 Barcode orqali dori topish

**Hozir bor**

- `Drug.barcode` saqlanadi va takroriy barcode'lar uchun unique cheklov bor.
- Admin dori yaratish/tahrirlash formasida barcode maydoni mavjud.
- Dori qidiruvi nom va xalqaro nom bo'yicha ishlaydi.

**Yetishmayotgan qism**

- Kameradan barcode o'qish, barcode yuboradigan mobil UI va barcode bo'yicha katalog endpointi topilmadi.
- Katalogdagi dori barcode'i tashqi manbaga ulanganini bildirmaydi. Barcode ma'lumoti bazada bo'lmasa, dori avtomatik aniqlanmaydi.

**Tavsiya**

- Mobil klient kameradan barcode o'qisin va qiymatni backenddagi aniq lookup endpointiga yuborsin.
- Backend avval ichki katalogdan qidirsin. Topilmasa, tashqi dori ma'lumotlar provayderi bilan integratsiya alohida adapter orqali qo'shilsin.
- Topilmagan barcode'da foydalanuvchiga dori nomini qo'lda kiritish va ma'lumotni tekshirish yo'lini bering. Noto'g'ri moslikni avtomatik retsept/jadvalga qo'llamang.
- Barcode formati, mamlakat qamrovi va tashqi provayder litsenziyasini ish boshlashdan avval aniqlang.

**Qabul mezonlari**

- Ichki katalogdagi barcode dori nomi va shaklini qaytaradi.
- Topilmagan yoki noto'g'ri formatli kod tushunarli xatolik va qo'lda kiritish imkonini beradi.
- Tashqi manba bo'lmasa ham asosiy dori qo'shish oqimi ishlaydi.

### 3.3 Bemorning dori qoldig'i va refill ogohlantirishi

**Hozir bor**

- Admin katalogidagi `Drug.stock` va ombor qoldig'ini o'zgartirish mavjud.
- Admin dashboard dorixonada kam yoki tugagan dori sonini ko'rsatishi mumkin.

**Yetishmayotgan qism**

- Bemorning o'zida nechta tabletka/doza qolganligi, qachon tugashi va refill eslatmasi uchun bemorga tegishli model yo'q.
- Dorixona qoldig'ini bemor qoldig'i sifatida ishlatish noto'g'ri: ular boshqa egalar va boshqa biznes jarayonlari.

**Tavsiya**

`PatientMedicationSupply` yoki ekvivalent alohida model yarating. Unda bemor/oila a'zosi egasi, jadval/dori bilan bog'lanish, boshlang'ich va joriy miqdor, birlik, bitta qabulda sarf miqdori, past qoldiq chegarasi, oxirgi hisob-kitob va faol holat bo'lsin. Refill operatsiyasi qoldiqni oshirishi va tarixda kim/qachon qancha qo'shganini saqlashi kerak.

Doza `TAKEN` bo'lib muvaffaqiyatli tasdiqlangandagina sarfni kamaytiring. Bir xil tasdiq qayta yuborilsa, qoldiq ikkinchi marta kamaymasin. `SKIPPED` va `PENDING` qoldiqka ta'sir qilmasin. O'lchov birligi va `dosageNote` aniq miqdorga aylantirib bo'lmaydigan holatlarda avtomatik ayirishni yoqmang; foydalanuvchiga qoldiqni qo'lda tuzatish yo'lini bering.

**Qabul mezonlari**

- `TAKEN` qoldiqni bir marta kamaytiradi; `SKIPPED` kamaytirmaydi.
- Past qoldiq chegarasi har bir bemor dori yozuvi uchun sozlanadi.
- Refill, qo'lda tuzatish va sarf tarixi audit qilinadi.
- Admin dorixona omboridagi `Drug.stock` bemor qoldig'idan ajralgan qoladi.

### 3.4 Salomatlik ko'rsatkichlari kundaligi

**Hozirgi holat:** qon bosimi, puls, vazn, glyukoza, uyqu yoki jismoniy faollikni bemor bo'yicha qayd etadigan model/API/UI topilmadi. Admin dashboard ko'rsatkichlari tizim statistikasi bo'lib, bemorning sog'liq kundaligi emas.

**Tavsiya**

- `HealthMetricEntry` modelida bemor, ko'rsatkich turi, qiymat(lar), birlik, o'lchangan vaqt, manba (qo'lda/qurilma), izoh va yaratilgan vaqt saqlansin.
- Qon bosimini bitta son emas, sistolik/diastolik juftlik va alohida puls sifatida ifodalang. Glyukoza uchun birlikni aniq saqlang. Vazn va mashg'ulotlar uchun mos birliklar bo'lsin.
- Vaqt bo'yicha grafik, sana oralig'i filtri va CSV/PDF eksport keyingi qatlamda qo'shilsin.
- Qiymat diapazonlarini validatsiya qiling, lekin ilova o'lchovni tashxis yoki davolash tavsiyasiga aylantirmasin. Shoshilinch ogohlantirishlar alohida klinik xavfsizlik talabi va shifokorlar bilan tekshiruvni talab qiladi.

**Qabul mezonlari**

- Har bir yozuv birlik va timezone-aware vaqt bilan saqlanadi.
- Foydalanuvchi o'zining va ruxsatli oila profilining yozuvlarini ajratib ko'radi.
- Sana bo'yicha filtrlangan ma'lumotlar hisobotda aynan shu oraliq bilan mos keladi.

### 3.5 Simptom, og'riq, kayfiyat va nojo'ya ta'sirlar

**Hozirgi holat:** simptom, og'riq darajasi, kayfiyat yoki dori nojo'ya ta'siri uchun jurnal topilmadi.

**Tavsiya**

- `PatientJournalEntry` yoki maqsadga mos alohida modelda yozuv turi, vaqt, og'irlik shkalasi, simptom/ta'sir nomi, erkin izoh va tegishli dori/doza bilan ixtiyoriy bog'lanishni saqlang.
- Og'riq shkalasi kabi qiymatlarning chegarasini validatsiya qiling; shaxsiy izohlarni faqat bemor va ruxsat berilgan shifokor/oila roli ko'rsin.
- Jurnal yozuvlarini doza vaqtiga yaqinlashtirib ko'rsatish mumkin, ammo korrelyatsiyani “dori sabab bo'ldi” degan xulosa sifatida bermang.
- Bemor yozuvni tahrirlashi yoki o'chirishi, o'zgarishlar esa zarur bo'lsa audit logda qolishi kerak.

### 3.6 Ukol joylarini qayd etish va rotatsiya

**Hozirgi holat:** `INYEKSIYA` dori shakli mavjud, lekin ukol qilingan tana sohasi va navbatdagi joyni belgilash tarixi yo'q.

**Tavsiya**

- Ukol dozasini tasdiqlash jarayoniga tana sohasi, tomon va aniq joyni kiritish imkonini qo'shing. Masalan, `LEFT_ABDOMEN`, `RIGHT_THIGH`; erkin matn yoki oldindan belgilangan ro'yxatni mahsulot talabi hal qiladi.
- `InjectionSiteEvent` yozuvini `DoseEvent` bilan bog'lang va oxirgi ishlatilgan joylar tarixini ko'rsating.
- Rotatsiya tartibi va ruxsat etilgan joylar dori/klinika ko'rsatmasiga mos sozlanishi kerak. Ilova faqat tarixga asoslangan eslatma bersin; shifokor ko'rsatmasisiz ukol joyini tibbiy jihatdan tavsiya qilmasin.
- Joyni kiritish majburiyligi barcha `INYEKSIYA` dorilarga bir xil qo'llanmasin; ayrim holatlarda joy tegishli bo'lmasligi mumkin.

### 3.7 Shifokor uchun oylik PDF hisobot

**Hozirgi holat:** bemor ma'lumotlarini birlashtirib PDF tayyorlash yoki shifokorga ulashish yo'q.

**Tavsiya**

- Hisobot xizmatini doza tarixi, dori ro'yxati, salomatlik o'lchovlari va simptom jurnalidan belgilangan sana oralig'i uchun yig'ing.
- Hisobotda vaqt zonasi, birliklar, ma'lumot oralig'i va yetishmayotgan yozuvlar aniq ko'rsatilsin. Grafik va jadval o'qilishi oson bo'lsin.
- PDFni foydalanuvchi autentifikatsiyasi bilan yarating; vaqtinchalik havola ishlatilsa, muddati qisqa va taxmin qilib bo'lmaydigan bo'lsin. Hisobotga faqat kerakli ma'lumot kiritilsin.
- Telegram/email orqali avtomatik yuborishdan oldin bemorning aniq roziligi va tanlangan qabul qiluvchini tasdiqlash kerak. Dastlab PDFni qurilmaga yuklab olish yetarli.

**Qabul mezonlari**

- Sana oralig'i bo'yicha faqat shu bemorning ma'lumotlari chiqadi.
- PDF ichidagi sonlar API javoblari bilan mos.
- Ruxsatsiz akkaunt boshqa bemor hisobotini ololmaydi.

### 3.8 Oila/jamoa, maxfiylik va GDPR

**Hozir bor**

- `FamilyMember` akkauntsiz oila a'zosini profil sifatida saqlaydi; guardian uning jadvalini boshqarishi mumkin.
- `CareLink` haqiqiy akkaunt jadvalini faqat ko'rish uchun ulaydi.
- Oila a'zosi jadvali uchun hozirgi reminder stub guardian telefon raqamiga mo'ljallangan; bu real bildirishnoma emas.

**Yetishmayotgan qism/risk**

- O'tkazib yuborilgan dozani qarindoshga yetkazadigan faol kanal yo'q.
- `CareLink` ulanishi telefon raqami orqali darhol yaratiladi va hujjatda tasdiqlash yo'qligi qayd etilgan. Bu kuzatuv funksiyasi uchun maxfiylik riski; read-only ruxsatning o'zi rozilik o'rnini bosmaydi.
- GDPR muvofiqligi, ma'lumot sotilmasligi, ma'lumotlarni eksport/o'chirish, rozilikni qaytarib olish va saqlash muddati ushbu kod auditi bilan tasdiqlanmaydi.

**Tavsiya**

1. CareLink uchun ko'riladigan ma'lumot doirasini, rozilik matnini, tasdiqlash bosqichini, ulanishni bekor qilishni va har ikki tomon uchun xabarnomani aniqlang.
2. Alohida `NotificationPreference` yoki ekvivalent sozlamada qabul qiluvchi, kanal, ogohlantiriladigan holat, kechikish, tinch vaqt va rozilik holatini saqlang.
3. “Doza hali tasdiqlanmadi” xabarini yuborishdan avval grace period, foydalanuvchining `SKIPPED` holati va takroriy xabarlar sonini hisobga oling. Oila a'zosi kimligi, egasi va ruxsatlar aniq bo'lsin.
4. Minimal ma'lumot yig'ish, rolga asoslangan kirish, loglarda sog'liq ma'lumotlarini oshkor qilmaslik, shifrlash, eksport/o'chirish va saqlash siyosatini ishlab chiqing.
5. GDPR yoki boshqa qonuniy muvofiqlikni mahsulot xususiyati deb e'lon qilishdan oldin yurist/privacy mutaxassisi bilan tekshiring. Koddagi texnik nazoratlar huquqiy muvofiqlikning o'zi emas.

### 3.9 Apple Health va qurilmalar integratsiyasi

**Hozirgi holat:** iOS native ilova, HealthKit ruxsat oqimi yoki Apple Health sinxronizatsiyasi yo'q. Backendning o'zi iPhone sog'liq ma'lumotlarini o'qiy olmaydi.

**Tavsiya**

- Native iOS klient yaratilganda faqat zarur HealthKit turlariga ruxsat so'rang; foydalanuvchi ruxsat bermasa qo'lda kiritish ishlashda davom etsin.
- Qaysi ma'lumotlar bir yo'nalishda yoki ikki yo'nalishda sinxronlanishini belgilang. Takroriy o'lchov, manba va o'chirilgan yozuvlarni boshqarish siyosati bo'lsin.
- HealthKit ma'lumoti serverga yuboriladimi yoki faqat qurilmada qoladimi, bu alohida maxfiylik qarori. App Store/HealthKit talablariga mos tekshiruv zarur.
- Android uchun Apple Health yo'q; platformaga xos integratsiyani keyinchalik Google Health Connect kabi muqobil bilan alohida baholang.

## 4. Tavsiya etilgan amalga oshirish bosqichlari

### Bosqich 0: asos va xavfsizlik

- API va jadval qoidalarining aniq kontraktini belgilang.
- Jadval vaqt zonasini aniqlang; migratsiya va mavjud yozuvlar uchun default strategiyani belgilang.
- CareLink roziligi/bekor qilish oqimini ko'rib chiqing.
- Doza generatsiyasi, tasdiqlash va qoldiq hisobini tranzaksion/idempotent qilish strategiyasini yozing.

### Bosqich 1: eslatma va jadvalni mustahkamlash

- Hafta kunlari va davriy sikl qoidalarini qo'shing.
- Snooze endpointi/holatini qo'shing.
- Eslatma provayderi uchun interfeys yarating; SMS/push provayderini konfiguratsiyadan tanlash mumkin bo'lsin.
- Notification preference, retry, delivery status va takroriy yuborishni cheklashni kiriting.
- Foydalanuvchi tasdiqlashi uchun API va integratsiya testlari yozing.

### Bosqich 2: bemor zaxirasi va refill

- Bemor/oila a'zosiga tegishli qoldiq modelini dorixona `Drug.stock`idan ajrating.
- `TAKEN` bilan qoldiqni kamaytirish, refill va qo'lda tuzatish tarixini qo'shing.
- Minimal miqdor va taxminiy tugash sanasi uchun alert qo'shing. Taxminiy sana qabul jadvali o'zgarsa qayta hisoblansin.

### Bosqich 3: sog'liq jurnallari va PDF

- Qon bosimi, puls, vazn va glyukoza yozuvlari.
- Simptom/nojo'ya ta'sir va kayfiyat yozuvlari.
- Dori uchun mos bo'lsa ukol joyi tarixi.
- Sana oralig'i bo'yicha shifokor hisoboti va foydalanuvchi eksporti.

### Bosqich 4: mobil klient va qurilmalar

- Bemor uchun mobil/web UI: dori kiritish, jadvalni ko'rish, doza tasdiqlash, snooze va tarix.
- Barcode skaneri va qo'lda qidiruv.
- Offline ishlash va qurilma mahalliy bildirishnomalari; keyin server bilan sinxronizatsiya.
- iOS HealthKit; talab bo'lsa Android Health Connect.

## 5. Ustuvorlik va bog'liqliklar

| Ustuvorlik | Ish | Nima uchun / bog'liqlik |
|---|---|---|
| P0 | Hafta kunlari, sikl va timezone-aware doza scheduler'i | Hozirgi reminder yadrosini murakkab rejimlarga tayyorlaydi; mobil UI'dan oldin API kontrakti kerak. |
| P0 | Snooze va reminder yetkazish interfeysi | Foydalanuvchiga bevosita kerak; real yetkazish uchun provayder va foydalanuvchi klienti/kanali zarur. |
| P0 | CareLink roziligi va ulanishni bekor qilish | Oila ogohlantirishlari va shaxsiy ma'lumotlarni ulashdan avval maxfiylik nazorati kerak. |
| P1 | Bemor dori zaxirasi va refill | Hozirgi `Drug.stock` bilan aralashtirmasdan mustaqil modul bo'lishi kerak. |
| P1 | Sog'liq va simptom jurnallari | PDF hisoboti va klinik foyda uchun asosiy ma'lumot manbai. |
| P1 | PDF hisobot/eksport | Jurnallar paydo bo'lgach, shifokorga ulashish qiymatini beradi. |
| P2 | Ukol joyi rotatsiyasi | Faqat ukol dori oqimi va klinik talablar aniqlangach. |
| P2 | Barcode skaneri | Kamera/mobil klient va ishonchli dori katalogi talab qiladi. |
| P2 | Apple Health | Faqat iOS klienti va rozilik siyosati tayyor bo'lgach. |

P0/P1/P2 — texnik va mahsulot ustuvorligi bo'yicha tavsiya; muddat yoki tibbiy xavfsizlik tasdig'i emas.

## 6. Umumiy texnik va mahsulot talablar

- **Tibbiy xavfsizlik:** ilova yozilgan retseptni eslatadi; o'zboshimchalik bilan doza yoki davolash tartibini tavsiya qilmaydi. Qabul qilinmagan dozani “ikki baravar ichish” kabi maslahat avtomatik berilmasin.
- **Vaqt va takroriylik:** scheduler timezone, yozgi vaqt, qayta ishga tushish, bir nechta server nusxasi va idempotentlikni hisobga olsin.
- **Ruxsatlar:** bemor, guardian, ulangan kuzatuvchi va shifokor vakolatlari alohida tekshirilsin. Har bir endpointda egani tekshirish bo'lsin.
- **Audit:** dori qoldig'i, retsept, rozilik, jurnal va hisobotga kirish/o'zgarishlar kuzatiladigan bo'lsin; audit logning o'zida ortiqcha sog'liq ma'lumoti saqlanmasin.
- **Bildirishnoma:** yuborildi, yetkazildi, xato, qayta urinish kabi holatlar kuzatilsin. SMS/push provayderi ishlamasa, doza yozuvlari yo'qolmasin.
- **Maxfiylik:** kerakli minimum ma'lumot, rozilik, eksport/o'chirish, retention, shifrlash va ma'lumotlar joylashuvi bo'yicha qarorlar hujjatlashtirilsin.
- **Foydalanish qulayligi:** matn qo'lda kiritish, accessibility, mahalliy til va internet bo'lmaganda ko'rish/tasdiqlash talablari boshidan hisobga olinsin.
- **Sinov:** unit testlar bilan birga timezone/sikl, parallel tasdiqlash, dublikat xabar, qoldiq chegarasi, rol va oila ruxsatlari uchun integratsion testlar bo'lsin.

## 7. Yakuniy tavsiya

Eng amaliy yo'l — avval mavjud jadval/doza backendini murakkab jadval, timezone, snooze va haqiqiy bildirishnoma arxitekturasi bilan yakunlash; shu bilan parallel ravishda `CareLink` roziligini kuchaytirish. Keyin bemorga tegishli dori qoldig'i/refill modulini qo'shish. Salomatlik va simptom jurnallari PDF hisobotning asosiga aylanadi. Barcode kamera skaneri va Apple Health esa bemor uchun mobil klient hamda maxfiylik/rozilik oqimi tayyor bo'lgandan keyingi bosqichda bajarilishi kerak.

Ushbu hujjat statik kod va loyiha hujjatlarini ko'rib chiqish asosida tayyorlandi. U ishlab turgan muhitdagi E2E tekshiruv, klinik xavfsizlik validatsiyasi yoki GDPR bo'yicha huquqiy xulosa o'rnini bosmaydi.
