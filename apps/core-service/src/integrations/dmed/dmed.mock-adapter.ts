import { DmedAdapter, DmedPrescriptionData } from "./dmed.types";

// Real dmed API (api.dmed.uz) hali ulanmagan — hamkorlik muzokara jarayonida (TZ risk: "dmed API
// o'zgarishi → Adapter layer"). Shu mock har qanday UUID uchun bir xil (deterministik) taxminiy
// retsept qaytaradi, faqat demo/test uchun. Bitta sentinel UUID "topilmadi" holatini simulyatsiya
// qiladi. Real kalitlar kelganda shu faylning o'rniga `DmedAdapter`ni haqiqiy HTTP chaqiruv bilan
// implementatsiya qiluvchi yangi fayl yoziladi — `dmed.adapter.ts`dagi factory shunga almashtiriladi.
const NOT_FOUND_UUID = "00000000-0000-0000-0000-000000000000";

export class MockDmedAdapter implements DmedAdapter {
    public async fetchPrescription(uuid: string): Promise<DmedPrescriptionData | null> {
        if (uuid === NOT_FOUND_UUID) {
            return null;
        }

        return {
            uuid,
            himoyaKodi: `MOCK-${uuid.slice(0, 8).toUpperCase()}`,
            bemorFish: "Test Bemor",
            bemorYosh: "34",
            shifokorFish: "Dr. Aliyev (mock)",
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            items: [
                {
                    drugNameRaw: "Paracetamol 500mg",
                    releaseForm: "tabletka",
                    usageMethod: "ichishga",
                    dailyDoseCount: "2",
                    duration: "5 kun",
                    regimen: "ovqatdan keyin",
                    totalQuantity: "10",
                    note: "dmed mock adapter — real API hali ulanmagan"
                }
            ]
        };
    }
}
