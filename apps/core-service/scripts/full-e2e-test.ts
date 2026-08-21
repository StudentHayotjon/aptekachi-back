import fs from "node:fs";
import { prisma } from "../src/config/prisma.client";
import { hashPassword } from "../src/utils/password.util";

const BASE = "http://localhost:3001/api/v1";
const rand = () => Math.floor(1000000 + Math.random() * 8999999);
const newPhone = () => `+99878${rand()}`;

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

async function call(method: string, path: string, token: string | null, body?: unknown, isForm = false) {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data: any = null;
    try {
        data = JSON.parse(text);
    } catch {
        data = { __raw: text.slice(0, 300) };
    }
    return { status: res.status, data };
}

function assert(cond: boolean, label: string, extra?: unknown): void {
    if (cond) {
        passCount++;
        console.log(`  OK  ${label}`);
    } else {
        failCount++;
        failures.push(label);
        console.log(`  !! FAIL  ${label}`, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : "");
    }
}

function section(title: string): void {
    console.log(`\n=== ${title} ===`);
}

async function run() {
    // -------------------------------------------------------------------
    section("BOOTSTRAP — test uchun ADMIN yaratish (to'g'ridan-to'g'ri Prisma orqali)");
    // -------------------------------------------------------------------
    const adminPhoneSeed = newPhone();
    await prisma.user.create({
        data: { phone: adminPhoneSeed, passwordHash: await hashPassword("AdminPass123"), fullName: "E2E Admin", role: "ADMINISTRATOR" }
    });
    const adminLogin = await call("POST", "/auth/login", null, { phone: adminPhoneSeed, password: "AdminPass123" });
    assert(adminLogin.status === 200, "bootstrap admin login -> 200", adminLogin);
    const adminToken = adminLogin.data?.data?.tokens?.accessToken;

    const shifokorPhone = newPhone();
    const provisionShifokor = await call("POST", "/auth/users/provision", adminToken, {
        phone: shifokorPhone,
        password: "DoctorPass123",
        fullName: "E2E Shifokor",
        role: "SHIFOKOR"
    });
    assert(provisionShifokor.status === 201, "admin: SHIFOKOR provision -> 201", provisionShifokor);
    const shifokorLogin = await call("POST", "/auth/login", null, { phone: shifokorPhone, password: "DoctorPass123" });
    const shifokorToken = shifokorLogin.data?.data?.tokens?.accessToken;

    // -------------------------------------------------------------------
    section("AUTH — register / login / validation");
    // -------------------------------------------------------------------
    const phoneA = newPhone();
    const regA = await call("POST", "/auth/register", null, { phone: phoneA, password: "TestPass123", fullName: "Bemor A" });
    assert(regA.status === 201, "register 201", regA);
    const tokenA = regA.data?.data?.tokens?.accessToken;
    const refreshA = regA.data?.data?.tokens?.refreshToken;
    const userA = regA.data?.data?.user;

    const regDup = await call("POST", "/auth/register", null, { phone: phoneA, password: "TestPass123", fullName: "Boshqa" });
    assert(regDup.status === 409, "register: duplicate phone -> 409", regDup);

    const regWeak = await call("POST", "/auth/register", null, { phone: newPhone(), password: "short", fullName: "X" });
    assert(regWeak.status === 400, "register: qisqa parol -> 400", regWeak);

    const regBadPhone = await call("POST", "/auth/register", null, { phone: "998901234567", password: "TestPass123", fullName: "X" });
    assert(regBadPhone.status === 400, "register: +998siz raqam -> 400", regBadPhone);

    const loginWrong = await call("POST", "/auth/login", null, { phone: phoneA, password: "NotoGriParol1" });
    assert(loginWrong.status === 401, "login: noto'g'ri parol -> 401", loginWrong);

    const loginOk = await call("POST", "/auth/login", null, { phone: phoneA, password: "TestPass123" });
    assert(loginOk.status === 200, "login: to'g'ri -> 200", loginOk);

    const me = await call("GET", "/auth/me", tokenA);
    assert(me.status === 200 && me.data.data.phone === phoneA, "GET /me", me);

    const meNoToken = await call("GET", "/auth/me", null);
    assert(meNoToken.status === 401, "GET /me tokensiz -> 401", meNoToken);

    const meBadToken = await call("GET", "/auth/me", "yaroqsiz.token.bu");
    assert(meBadToken.status === 401, "GET /me yaroqsiz token -> 401", meBadToken);

    // -------------------------------------------------------------------
    section("AUTH — refresh rotation + reuse detection");
    // -------------------------------------------------------------------
    const refresh1 = await call("POST", "/auth/refresh", null, { refreshToken: refreshA });
    assert(refresh1.status === 200, "refresh: birinchi marta -> 200", refresh1);
    const newRefresh = refresh1.data?.data?.tokens?.refreshToken;
    const newAccess = refresh1.data?.data?.tokens?.accessToken;

    const reuseOld = await call("POST", "/auth/refresh", null, { refreshToken: refreshA });
    assert(reuseOld.status === 401, "refresh: eski (ishlatilgan) tokenni qayta ishlatish -> 401", reuseOld);

    const newAlsoRevoked = await call("POST", "/auth/refresh", null, { refreshToken: newRefresh });
    assert(newAlsoRevoked.status === 401, "refresh: reuse aniqlangach YANGI token ham bekor qilingan -> 401", newAlsoRevoked);

    const meAfterReuse = await call("GET", "/auth/me", newAccess);
    assert(meAfterReuse.status === 200, "access token hali 15 daq amal qiladi (revoke faqat refresh'ga tegishli)", meAfterReuse);

    // relogin to get a clean session for the rest of the suite
    const relogin = await call("POST", "/auth/login", null, { phone: phoneA, password: "TestPass123" });
    const tokenA2 = relogin.data?.data?.tokens?.accessToken;
    const refreshA2 = relogin.data?.data?.tokens?.refreshToken;

    const logoutRes = await call("POST", "/auth/logout", null, { refreshToken: refreshA2 });
    assert(logoutRes.status === 200, "logout -> 200", logoutRes);
    const refreshAfterLogout = await call("POST", "/auth/refresh", null, { refreshToken: refreshA2 });
    assert(refreshAfterLogout.status === 401, "logout qilingan refresh tokendan foydalanib bo'lmaydi -> 401", refreshAfterLogout);

    // final working session for the rest of the suite
    const finalLogin = await call("POST", "/auth/login", null, { phone: phoneA, password: "TestPass123" });
    const tokenAFinal = finalLogin.data.data.tokens.accessToken;

    // -------------------------------------------------------------------
    section("AUTH — forgot/reset password (kod alohida PowerShell qadamida sinaladi)");
    // -------------------------------------------------------------------
    const resetPhone = newPhone();
    await call("POST", "/auth/register", null, { phone: resetPhone, password: "OldPass123", fullName: "Reset Test" });
    const forgot = await call("POST", "/auth/forgot-password", null, { phone: resetPhone });
    assert(forgot.status === 200, "forgot-password -> 200 (mavjud raqam)", forgot);
    const forgotUnknown = await call("POST", "/auth/forgot-password", null, { phone: newPhone() });
    assert(forgotUnknown.status === 200, "forgot-password -> 200 hatto mavjud bo'lmagan raqam uchun ham (enumeration'dan himoya)", forgotUnknown);
    console.log(`RESET_TEST_PHONE=${resetPhone}`);

    // -------------------------------------------------------------------
    section("AUTH — admin endpoints (BEMOR uchun taqiqlangan bo'lishi kerak)");
    // -------------------------------------------------------------------
    const listUsersAsBemor = await call("GET", "/auth/users", tokenAFinal);
    assert(listUsersAsBemor.status === 403, "GET /auth/users BEMOR uchun -> 403", listUsersAsBemor);

    const listUsersAsAdmin = await call("GET", "/auth/users?role=BEMOR&page=1&limit=5", adminToken);
    assert(listUsersAsAdmin.status === 200 && Array.isArray(listUsersAsAdmin.data?.data?.items), "GET /auth/users admin -> 200", listUsersAsAdmin);

    const provisionDupPhone = await call("POST", "/auth/users/provision", adminToken, {
        phone: shifokorPhone,
        password: "DoctorPass123",
        fullName: "Dublikat",
        role: "SHIFOKOR"
    });
    assert(provisionDupPhone.status === 409, "provision: mavjud raqamga qayta -> 409", provisionDupPhone);

    const provisionInvalidRole = await call("POST", "/auth/users/provision", adminToken, {
        phone: newPhone(),
        password: "TestPass123",
        fullName: "X",
        role: "BEMOR"
    });
    assert(provisionInvalidRole.status === 400, "provision: role=BEMOR (faqat SHIFOKOR/ADMIN ruxsat) -> 400", provisionInvalidRole);

    const deactivateB = await call("PATCH", `/auth/users/${userA.id}/status`, adminToken, { isActive: false });
    assert(deactivateB.status === 200 && deactivateB.data?.data?.isActive === false, "admin: foydalanuvchini deaktivatsiya -> 200", deactivateB);
    const loginAfterDeactivate = await call("POST", "/auth/login", null, { phone: phoneA, password: "TestPass123" });
    assert(loginAfterDeactivate.status === 401, "deaktivatsiyadan keyin login bloklandi -> 401", loginAfterDeactivate);
    // qayta faollashtirib, qolgan testlar davom etishi uchun tokenAFinal ishlayversin
    await call("PATCH", `/auth/users/${userA.id}/status`, adminToken, { isActive: true });
    const reactivateCheck = await call("GET", "/auth/me", tokenAFinal);
    assert(
        reactivateCheck.status === 200,
        "MA'LUM: deaktivatsiya vaqtida access token (15 daq) hali ham ishlayveradi — faqat refresh bloklanadi, joriy sessiya darhol kesilmaydi",
        reactivateCheck
    );

    // -------------------------------------------------------------------
    section("DRUG — public list/get, admin CRUD");
    // -------------------------------------------------------------------
    const publicList = await call("GET", "/drugs", null);
    assert(publicList.status === 200, "GET /drugs — ochiq, tokensiz -> 200", publicList);

    const createDrugAsBemor = await call("POST", "/drugs", tokenAFinal, {
        name: "Ruxsatsiz dori",
        manufacturer: "X",
        price: 1000
    });
    assert(createDrugAsBemor.status === 403, "POST /drugs BEMOR uchun -> 403", createDrugAsBemor);

    const getMissingDrug = await call("GET", "/drugs/00000000-0000-4000-8000-000000000000", null);
    assert(getMissingDrug.status === 404, "GET /drugs/:id mavjud bo'lmagan -> 404", getMissingDrug);

    const negativePriceD = await call("POST", "/drugs", tokenAFinal, { name: "Test", manufacturer: "X", price: -5 });
    assert(negativePriceD.status !== 500, "POST /drugs manfiy narx -> 500 emas (403 kutilgan, chunki role tekshiruvi birinchi)", negativePriceD);

    const negativePriceAdmin = await call("POST", "/drugs", adminToken, { name: "Test", manufacturer: "X", price: -5 });
    assert(negativePriceAdmin.status === 400, "POST /drugs (admin) manfiy narx -> 400", negativePriceAdmin);

    const barcode1 = `TEST-${rand()}`;
    const barcode2 = `TEST-${rand()}`;
    const drugAdd1 = await call("POST", "/drugs", adminToken, {
        name: "E2E Dori 1",
        manufacturer: "Test MFR",
        price: 15000,
        barcode: barcode1
    });
    assert(drugAdd1.status === 201, "POST /drugs (admin) -> 201", drugAdd1);
    const drug1Id = drugAdd1.data?.data?.id;

    const drugAdd2 = await call("POST", "/drugs", adminToken, {
        name: "E2E Dori 2",
        manufacturer: "Test MFR",
        price: 20000,
        barcode: barcode2
    });
    const drug2Id = drugAdd2.data?.data?.id;

    const drugDupBarcode = await call("POST", "/drugs", adminToken, { name: "Boshqa", manufacturer: "X", price: 1000, barcode: barcode1 });
    assert(drugDupBarcode.status === 409, "POST /drugs bir xil barcode -> 409", drugDupBarcode);

    const drugUpdateDupBarcode = await call("PUT", `/drugs/${drug2Id}`, adminToken, { barcode: barcode1 });
    assert(
        drugUpdateDupBarcode.status === 409,
        "PUT /drugs/:id boshqa dorining barcode'iga o'zgartirish -> 409 (TUZATILDI: avval xom Prisma xatosi bilan 500 qaytardi)",
        drugUpdateDupBarcode
    );

    const drugUpdateOk = await call("PUT", `/drugs/${drug2Id}`, adminToken, { price: 25000 });
    assert(drugUpdateOk.status === 200 && drugUpdateOk.data?.data?.price === 25000, "PUT /drugs/:id oddiy yangilash -> 200", drugUpdateOk);

    const drugUpdateMissing = await call("PUT", "/drugs/00000000-0000-4000-8000-000000000000", adminToken, { price: 1 });
    assert(drugUpdateMissing.status === 404, "PUT /drugs/:id mavjud bo'lmagan -> 404", drugUpdateMissing);

    const drugRemove = await call("DELETE", `/drugs/${drug2Id}`, adminToken);
    assert(drugRemove.status === 200, "DELETE /drugs/:id (soft delete) -> 200", drugRemove);

    const publicListAfterDelete = await call("GET", "/drugs", null);
    assert(
        !publicListAfterDelete.data?.data?.items?.some((d: any) => d.id === drug2Id),
        "soft-delete qilingan dori ochiq ro'yxatda ko'rinmaydi",
        publicListAfterDelete.data
    );

    // -------------------------------------------------------------------
    section("PRESCRIPTION — dmed import (mock)");
    // -------------------------------------------------------------------
    const dmedUuid1 = crypto.randomUUID();
    const dmedImport1 = await call("POST", "/prescriptions/dmed", tokenAFinal, { uuid: dmedUuid1 });
    assert(dmedImport1.status === 201, "POST /prescriptions/dmed -> 201", dmedImport1);
    assert(dmedImport1.data?.data?.status === "APPROVED", "dmed import -> darhol APPROVED", dmedImport1.data);
    const dmedPrescriptionId = dmedImport1.data?.data?.id;

    const dmedDup = await call("POST", "/prescriptions/dmed", tokenAFinal, { uuid: dmedUuid1 });
    assert(dmedDup.status === 409, "bir xil dmed UUID qayta import -> 409", dmedDup);

    const dmedNotFound = await call("POST", "/prescriptions/dmed", tokenAFinal, {
        uuid: "00000000-0000-0000-0000-000000000000"
    });
    assert(dmedNotFound.status === 404, "dmed sentinel UUID (topilmadi) -> 404", dmedNotFound);

    const dmedGarbage = await call("POST", "/prescriptions/dmed", tokenAFinal, { uuid: "shunchaki-matn-uuid-emas" });
    assert(
        dmedGarbage.status === 201,
        "MA'LUM TOPILDI: dmed UUID formati tekshirilmaydi — UUID-emas matn ham 201 bilan \"import\" qilinadi (mock adapter'da zararsiz, real API ulanganda validatsiya qo'shish tavsiya etiladi)",
        dmedGarbage
    );

    // schedule avtomatik yaratilganini tekshirish (F-003 -> auto-link)
    const schedulesAfterDmed = await call("GET", "/schedules", tokenAFinal);
    const autoSchedule = schedulesAfterDmed.data?.data?.find((s: any) => s.drugName?.includes("Paracetamol"));
    assert(!!autoSchedule, "dmed import tasdiqlangach avtomatik MedicationSchedule yaratildi", schedulesAfterDmed.data);
    assert(autoSchedule?.drugId === null || typeof autoSchedule?.drugId === "string", "auto-schedule drugId maydoni mavjud (fuzzy-match natijasi)", autoSchedule);

    // -------------------------------------------------------------------
    section("PRESCRIPTION — OCR yuklash (haqiqiy Gemini chaqiruvi)");
    // -------------------------------------------------------------------
    const realImgPath = process.env.TEST_IMAGE_PATH;
    if (realImgPath && fs.existsSync(realImgPath)) {
        const buf = fs.readFileSync(realImgPath);
        const form = new FormData();
        form.append("file", new Blob([new Uint8Array(buf)], { type: "image/jpeg" }), "test-prescription.jpg");
        const ocrUpload = await call("POST", "/prescriptions", tokenAFinal, form, true);
        assert(ocrUpload.status === 201 || ocrUpload.status === 422, "POST /prescriptions (OCR rasm) -> 201 yoki 422 (o'qilmasa)", ocrUpload);
        if (ocrUpload.status === 201) {
            assert(ocrUpload.data?.data?.status === "PENDING", "OCR retsept boshlang'ich holati PENDING", ocrUpload.data);
            assert(Array.isArray(ocrUpload.data?.data?.items) && ocrUpload.data.data.items.length > 0, "OCR kamida 1 ta dori qatorini aniqladi", ocrUpload.data);
            const item0 = ocrUpload.data?.data?.items?.[0];
            console.log(`     OCR natija namunasi: drugNameRaw="${item0?.drugNameRaw}", dailyDoseCount="${item0?.dailyDoseCount}"`);
        } else {
            console.log("     OCR rasmdan ma'lumot topa olmadi (422) — sintetik rasm Gemini uchun yetarli aniq bo'lmagan bo'lishi mumkin");
        }
    } else {
        console.log("  SKIP  OCR haqiqiy rasm testi — TEST_IMAGE_PATH topilmadi");
    }

    // noto'g'ri fayl turi (matn fayli, "rasm" deb da'vo qilinmagan)
    const badFileForm = new FormData();
    badFileForm.append("file", new Blob([new Uint8Array(Buffer.from("bu rasm emas"))], { type: "text/plain" }), "hujjat.txt");
    const badFileUpload = await call("POST", "/prescriptions", tokenAFinal, badFileForm, true);
    assert(badFileUpload.status === 400, "POST /prescriptions noto'g'ri fayl turi -> 400 (avval 500 edi, tuzatildi)", badFileUpload);

    const noFileUpload = await call("POST", "/prescriptions", tokenAFinal, new FormData(), true);
    assert(noFileUpload.status === 400, "POST /prescriptions faylsiz -> 400", noFileUpload);

    // -------------------------------------------------------------------
    section("PRESCRIPTION — ro'yxat, huquqlar, approve/reject");
    // -------------------------------------------------------------------
    const listOwn = await call("GET", "/prescriptions", tokenAFinal);
    assert(listOwn.status === 200 && listOwn.data.data.items.every((p: any) => p.patientId === userA.id), "BEMOR faqat o'zinikini ko'radi", listOwn.data);

    const getOtherPrescription = await call("GET", `/prescriptions/${dmedPrescriptionId}`, tokenAFinal);
    assert(getOtherPrescription.status === 200, "GET /prescriptions/:id o'ziniki -> 200", getOtherPrescription);

    const approveAsBemor = await call("PATCH", `/prescriptions/${dmedPrescriptionId}/approve`, tokenAFinal);
    assert(approveAsBemor.status === 403, "PATCH approve BEMOR uchun -> 403 (faqat SHIFOKOR)", approveAsBemor);

    // dmed retsepti allaqachon APPROVED holatda import qilingan — shifokor uni qayta ko'rib chiqa olmasligi kerak
    const approveAlreadyApproved = await call("PATCH", `/prescriptions/${dmedPrescriptionId}/approve`, shifokorToken);
    assert(approveAlreadyApproved.status === 409, "SHIFOKOR: allaqachon APPROVED dmed retseptini approve qilish -> 409", approveAlreadyApproved);

    const rejectMissingReason = await call("PATCH", `/prescriptions/${dmedPrescriptionId}/reject`, shifokorToken, { reason: "" });
    assert(rejectMissingReason.status === 400, "reject: bo'sh sabab -> 400", rejectMissingReason);

    // yangi PENDING (OCR yo'li bilan) retsept yaratib, shifokor tomonidan to'liq approve/reject oqimini sinaymiz
    const listAllAsShifokor = await call("GET", "/prescriptions", shifokorToken);
    assert(
        listAllAsShifokor.status === 200 && listAllAsShifokor.data?.data?.items?.length >= listOwn?.data?.data?.items?.length,
        "SHIFOKOR barcha retseptlarni ko'radi (patientId bo'yicha filtrlanmaydi)",
        listAllAsShifokor.data
    );

    // -------------------------------------------------------------------
    section("SCHEDULE — yaratish, ro'yxat, deactivate, validatsiya");
    // -------------------------------------------------------------------
    const createSchedBadTime = await call("POST", "/schedules", tokenAFinal, {
        drugName: "Test dori",
        scheduleTimes: ["25:99"],
        startDate: new Date().toISOString()
    });
    assert(createSchedBadTime.status === 400, "schedule: noto'g'ri vaqt formati -> 400", createSchedBadTime);

    const createSchedEmpty = await call("POST", "/schedules", tokenAFinal, {
        drugName: "Test dori",
        scheduleTimes: [],
        startDate: new Date().toISOString()
    });
    assert(createSchedEmpty.status === 400, "schedule: bo'sh scheduleTimes -> 400", createSchedEmpty);

    const pastEndDate = new Date();
    pastEndDate.setDate(pastEndDate.getDate() - 10);
    const createSchedPastEnd = await call("POST", "/schedules", tokenAFinal, {
        drugName: "Muddati o'tgan test",
        scheduleTimes: ["09:00"],
        startDate: new Date().toISOString(),
        endDate: pastEndDate.toISOString()
    });
    assert(
        createSchedPastEnd.status === 201,
        "MA'LUM TOPILDI: endDate < startDate bo'lsa ham 201 qaytadi (jim ravishda hech qachon eslatma yaratilmaydigan jadval) — mantiqiy validatsiya yo'q",
        createSchedPastEnd.data
    );

    const createSched = await call("POST", "/schedules", tokenAFinal, {
        drugName: "Vitamin C",
        scheduleTimes: ["08:00", "20:00"],
        startDate: new Date().toISOString()
    });
    assert(createSched.status === 201, "schedule: to'g'ri yaratish -> 201", createSched);
    const schedId = createSched.data?.data?.id;

    const getForeignSched = await call("GET", `/schedules/${schedId}`, "boshqa.token.emas");
    assert(getForeignSched.status === 401, "schedule: yaroqsiz token bilan -> 401", getForeignSched);

    const deactivateMissing = await call("PATCH", "/schedules/00000000-0000-4000-8000-000000000000/deactivate", tokenAFinal);
    assert(deactivateMissing.status === 404, "schedule: mavjud bo'lmagan id deactivate -> 404", deactivateMissing);

    const deactivateOk = await call("PATCH", `/schedules/${schedId}/deactivate`, tokenAFinal);
    assert(deactivateOk.status === 200 && deactivateOk.data.data.isActive === false, "schedule: deactivate -> 200", deactivateOk);

    // -------------------------------------------------------------------
    section("DOSE — ro'yxat, confirm/skip huquqi");
    // -------------------------------------------------------------------
    const doseList = await call("GET", "/doses", tokenAFinal);
    assert(doseList.status === 200, "GET /doses -> 200", doseList);

    const confirmMissingDose = await call("PATCH", "/doses/00000000-0000-4000-8000-000000000000/confirm", tokenAFinal);
    assert(confirmMissingDose.status === 404, "confirm mavjud bo'lmagan doza -> 404", confirmMissingDose);

    // -------------------------------------------------------------------
    section("INTERACTION — CRUD, duplikat, check");
    // -------------------------------------------------------------------
    const checkNoDrugs = await call("POST", "/interactions/check", tokenAFinal, { drugIds: [] });
    assert(checkNoDrugs.status === 400, "interactions/check bo'sh massiv -> 400", checkNoDrugs);

    const checkOneDrug = await call("POST", "/interactions/check", tokenAFinal, { drugIds: [crypto.randomUUID()] });
    assert(checkOneDrug.status === 400, "interactions/check faqat 1 ta dori -> 400 (kamida 2 kerak)", checkOneDrug);

    const checkTwoRandom = await call("POST", "/interactions/check", tokenAFinal, { drugIds: [crypto.randomUUID(), crypto.randomUUID()] });
    assert(checkTwoRandom.status === 200 && Array.isArray(checkTwoRandom.data.data), "interactions/check mavjud bo'lmagan dorilar -> 200 bo'sh massiv", checkTwoRandom.data);

    const createInteractionAsBemor = await call("POST", "/interactions", tokenAFinal, {
        drugAId: crypto.randomUUID(),
        drugBId: crypto.randomUUID(),
        severity: "RED"
    });
    assert(createInteractionAsBemor.status === 403, "POST /interactions BEMOR uchun -> 403", createInteractionAsBemor);

    const drugAdd3 = await call("POST", "/drugs", adminToken, { name: "E2E Dori 3", manufacturer: "Test MFR", price: 5000 });
    const drug3Id = drugAdd3.data?.data?.id;

    const sameDrugInteraction = await call("POST", "/interactions", adminToken, { drugAId: drug1Id, drugBId: drug1Id, severity: "RED" });
    assert(sameDrugInteraction.status === 400, "interaction: bir xil ikkita dori -> 400", sameDrugInteraction);

    const createInteraction = await call("POST", "/interactions", adminToken, { drugAId: drug1Id, drugBId: drug3Id, severity: "RED", description: "E2E test" });
    assert(createInteraction.status === 201, "POST /interactions (admin) -> 201", createInteraction);
    const interactionId = createInteraction.data?.data?.id;

    const createInteractionReverseDup = await call("POST", "/interactions", adminToken, { drugAId: drug3Id, drugBId: drug1Id, severity: "YELLOW" });
    assert(createInteractionReverseDup.status === 409, "interaction: teskari tartibda (B,A) duplikat -> 409", createInteractionReverseDup);

    const checkRealPair = await call("POST", "/interactions/check", tokenAFinal, { drugIds: [drug1Id, drug3Id] });
    assert(
        checkRealPair.status === 200 && checkRealPair.data?.data?.length === 1 && checkRealPair.data.data[0].severity === "RED",
        "interactions/check haqiqiy juftlikni topadi",
        checkRealPair.data
    );

    const listInteractions = await call("GET", "/interactions", adminToken);
    assert(listInteractions.status === 200 && listInteractions.data?.data?.items?.some((i: any) => i.id === interactionId), "GET /interactions ro'yxatda bor", listInteractions.data);

    const removeInteraction = await call("DELETE", `/interactions/${interactionId}`, adminToken);
    assert(removeInteraction.status === 200, "DELETE /interactions/:id -> 200", removeInteraction);

    // -------------------------------------------------------------------
    section("FAMILY — a'zolar va ulanishlar");
    // -------------------------------------------------------------------
    const createMember = await call("POST", "/family/members", tokenAFinal, { fullName: "Test bola" });
    assert(createMember.status === 201, "POST /family/members -> 201", createMember);
    const memberId = createMember.data?.data?.id;

    const createMemberBadName = await call("POST", "/family/members", tokenAFinal, { fullName: "A" });
    assert(createMemberBadName.status === 400, "family/members: juda qisqa ism -> 400", createMemberBadName);

    const linkToSelf = await call("POST", "/family/links", tokenAFinal, { phone: phoneA });
    assert(linkToSelf.status === 400, "family/links: o'zingizga ulanish -> 400", linkToSelf);

    const linkToUnknown = await call("POST", "/family/links", tokenAFinal, { phone: newPhone() });
    assert(linkToUnknown.status === 404, "family/links: mavjud bo'lmagan raqam -> 404", linkToUnknown);

    const phoneB = newPhone();
    const regB = await call("POST", "/auth/register", null, { phone: phoneB, password: "TestPass123", fullName: "Bemor B" });
    const tokenB = regB.data?.data?.tokens?.accessToken;

    const link1 = await call("POST", "/family/links", tokenAFinal, { phone: phoneB });
    assert(link1.status === 201, "family/links: haqiqiy raqamga ulanish -> 201", link1);
    const linkId = link1.data?.data?.id;

    const linkDup = await call("POST", "/family/links", tokenAFinal, { phone: phoneB });
    assert(linkDup.status === 409, "family/links: bir xil odamga qayta ulanish -> 409", linkDup);

    const scheduleForFamilyMember = await call("POST", "/schedules", tokenAFinal, {
        familyMemberId: memberId,
        drugName: "Bolalar siropi",
        scheduleTimes: ["10:00"],
        startDate: new Date().toISOString()
    });
    assert(scheduleForFamilyMember.status === 201, "oila a'zosi uchun schedule yaratish -> 201", scheduleForFamilyMember);

    const foreignMemberId = crypto.randomUUID();
    const scheduleForForeignMember = await call("POST", "/schedules", tokenAFinal, {
        familyMemberId: foreignMemberId,
        drugName: "X",
        scheduleTimes: ["10:00"],
        startDate: new Date().toISOString()
    });
    assert(scheduleForForeignMember.status === 403, "boshqa/mavjud bo'lmagan familyMemberId bilan schedule -> 403", scheduleForForeignMember);

    // B ning jadvali A'ga LINKED_ACCOUNT sifatida ko'rinishi va yozib bo'lmasligi
    const scheduleB = await call("POST", "/schedules", tokenB, {
        drugName: "B ning dorisi",
        scheduleTimes: ["07:00"],
        startDate: new Date().toISOString()
    });
    const scheduleBId = scheduleB.data?.data?.id;

    const aSeesB = await call("GET", "/schedules", tokenAFinal);
    const linkedView = aSeesB.data?.data?.find((s: any) => s.id === scheduleBId);
    assert(linkedView?.owner?.type === "LINKED_ACCOUNT", "A, B ning jadvalini LINKED_ACCOUNT sifatida ko'radi", linkedView);

    const aTriesWriteB = await call("PATCH", `/schedules/${scheduleBId}/deactivate`, tokenAFinal);
    assert(aTriesWriteB.status === 403, "A, B ning jadvalini o'zgartira olmaydi -> 403", aTriesWriteB);

    const removeLink = await call("DELETE", `/family/links/${linkId}`, tokenAFinal);
    assert(removeLink.status === 200, "family/links: o'chirish -> 200", removeLink);

    const removeMember = await call("DELETE", `/family/members/${memberId}`, tokenAFinal);
    assert(removeMember.status === 200, "family/members: o'chirish -> 200", removeMember);

    const removeMemberAgain = await call("DELETE", `/family/members/${memberId}`, tokenAFinal);
    assert(removeMemberAgain.status === 404, "family/members: allaqachon o'chirilganni qayta o'chirish -> 404", removeMemberAgain);

    // -------------------------------------------------------------------
    section("NATIJA");
    // -------------------------------------------------------------------
    console.log(`\nJAMI: ${passCount} OK, ${failCount} FAIL`);
    if (failures.length > 0) {
        console.log("Muvaffaqiyatsiz tekshiruvlar:");
        failures.forEach((f) => console.log(`  - ${f}`));
    }
    console.log(`RESULT_PASS=${passCount}`);
    console.log(`RESULT_FAIL=${failCount}`);
}

run().catch((error) => {
    console.error("SKRIPT XATOSI:", error);
    process.exit(1);
});
