import { env } from "../../config/env.config";
import { DmedAdapter } from "./dmed.types";
import { MockDmedAdapter } from "./dmed.mock-adapter";

// Yagona joy — dmed API kalitlari kelganda faqat shu yerga real implementatsiya (masalan
// `RealDmedAdapter`, OAuth 2.0 Client Credentials bilan `https://api.dmed.uz/v2` chaqiradigan)
// qo'shiladi va DMED_MODE=real qilib almashtiriladi. Servisning qolgan qismi DmedAdapter
// interfeysiga bog'liq, o'zgarishsiz qoladi.
export const getDmedAdapter = (): DmedAdapter => {
    if (env.dmed.mode === "real") {
        throw new Error("Real dmed adapter hali implementatsiya qilinmagan — DMED_MODE=mock qoldiring");
    }
    return new MockDmedAdapter();
};
