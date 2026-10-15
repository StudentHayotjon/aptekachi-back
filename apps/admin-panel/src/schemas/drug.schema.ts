import { z } from "zod";
import { DOSAGE_FORMS } from "@/types";
import { intFromString, optionalText } from "./shared.schema";

/** Forma maydonlari matn ko'rinishida saqlanadi; chiqishda backend kutgan DrugPayload hosil bo'ladi */
export const drugSchema = z.object({
    name: z.string().trim().min(2, "Dori nomi kamida 2 belgi bo'lishi kerak").max(200),
    internationalName: optionalText(200),
    manufacturer: z.string().trim().min(2, "Ishlab chiqaruvchini kiriting").max(200),
    country: optionalText(100),
    dosageForm: z.enum(DOSAGE_FORMS),
    dosage: optionalText(50),
    packageSize: optionalText(100),
    barcode: optionalText(50),
    price: z
        .string()
        .trim()
        .min(1, "Narxni kiriting")
        .transform((v) => Number(v.replace(",", ".")))
        .pipe(z.number({ error: "Narx son bo'lishi kerak" }).positive("Narx musbat son bo'lishi kerak")),
    stock: intFromString("Qoldiq 0 yoki undan katta butun son bo'lishi kerak"),
    requiresPrescription: z.boolean(),
    description: optionalText(2000),
    imageUrl: optionalText(500).pipe(z.url("To'g'ri URL kiriting (https://...)").optional())
});

export type DrugForm = z.input<typeof drugSchema>;
export type DrugValues = z.output<typeof drugSchema>;

export const STOCK_MODES = ["in", "out", "set"] as const;
export type StockMode = (typeof STOCK_MODES)[number];

export const stockSchema = z.object({
    mode: z.enum(STOCK_MODES),
    amount: z
        .string()
        .trim()
        .min(1, "Miqdorni kiriting")
        .transform(Number)
        .pipe(z.number().int("Butun son kiriting").positive("Miqdor 0 dan katta bo'lishi kerak"))
});

export type StockForm = z.input<typeof stockSchema>;
