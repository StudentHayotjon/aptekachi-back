import { Alert, Button, Field, FormGrid, Input, Modal, Select, Switch, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useZodForm } from "@/hooks/useZodForm";
import { DOSAGE_FORM_LABEL } from "@/lib/labels";
import { drugSchema, type DrugForm } from "@/schemas/drug.schema";
import { drugsService } from "@/services";
import { DOSAGE_FORMS, type DosageForm, type Drug } from "@/types";

const toForm = (d?: Drug): DrugForm => ({
    name: d?.name ?? "",
    internationalName: d?.internationalName ?? "",
    manufacturer: d?.manufacturer ?? "",
    country: d?.country ?? "",
    dosageForm: d?.dosageForm ?? "TABLETKA",
    dosage: d?.dosage ?? "",
    packageSize: d?.packageSize ?? "",
    barcode: d?.barcode ?? "",
    price: d ? String(d.price) : "",
    stock: d ? String(d.stock) : "0",
    requiresPrescription: d?.requiresPrescription ?? false,
    description: d?.description ?? "",
    imageUrl: d?.imageUrl ?? ""
});

interface Props {
    drug?: Drug;
    onClose: () => void;
    onSaved: () => void;
}

export function DrugFormModal({ drug, onClose, onSaved }: Props) {
    const toast = useToast();
    const form = useZodForm(drugSchema, toForm(drug));
    const { values, errors, set } = form;

    const submit = () =>
        form.submit(async ({ stock, ...payload }) => {
            // Qoldiq tahrirda alohida "Qoldiq" oynasi orqali o'zgartiriladi (kirim/chiqim tarixi uchun)
            if (drug) await drugsService.update(drug.id, payload);
            else await drugsService.create({ ...payload, stock });
            toast.success(drug ? "Dori yangilandi" : "Dori qo'shildi");
            onSaved();
            onClose();
        });

    const text = (key: Exclude<keyof DrugForm, "requiresPrescription" | "dosageForm">, label: string, placeholder = "", full = false) => (
        <Field label={label} error={errors[key]} full={full}>
            <Input value={values[key]} placeholder={placeholder} onChange={(e) => set(key)(e.target.value)} />
        </Field>
    );

    return (
        <Modal
            title={drug ? "Dorini tahrirlash" : "Yangi dori"}
            onClose={onClose}
            onSubmit={submit}
            footer={
                <>
                    <Button onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" variant="primary" loading={form.submitting}>
                        {drug ? "Saqlash" : "Qo'shish"}
                    </Button>
                </>
            }>
            {form.formError && <Alert>{form.formError}</Alert>}
            <FormGrid>
                {text("name", "Savdo nomi *", "Paracetamol Extra", true)}
                {text("internationalName", "Xalqaro nomi (INN)", "Paracetamol")}
                {text("manufacturer", "Ishlab chiqaruvchi *", "Nika Pharm")}
                <Field label="Dori shakli" error={errors.dosageForm}>
                    <Select value={values.dosageForm} onChange={(e) => set("dosageForm")(e.target.value as DosageForm)}>
                        {DOSAGE_FORMS.map((f) => (
                            <option key={f} value={f}>
                                {DOSAGE_FORM_LABEL[f]}
                            </option>
                        ))}
                    </Select>
                </Field>
                {text("dosage", "Dozasi", "500mg")}
                {text("packageSize", "Qadoq", "20 tabletka/quti")}
                {text("country", "Mamlakat", "O'zbekiston")}
                <Field label="Narx (so'm) *" error={errors.price}>
                    <Input inputMode="decimal" value={values.price} placeholder="12000" onChange={(e) => set("price")(e.target.value)} />
                </Field>
                {drug ? (
                    text("barcode", "Shtrix-kod", "4780000000000")
                ) : (
                    <Field label="Boshlang'ich qoldiq" error={errors.stock}>
                        <Input inputMode="numeric" value={values.stock} onChange={(e) => set("stock")(e.target.value)} />
                    </Field>
                )}
                {!drug && text("barcode", "Shtrix-kod", "4780000000000")}
                {text("imageUrl", "Rasm URL", "https://…", !!drug)}
                <Field label="Tavsif" error={errors.description} full>
                    <Textarea value={values.description} onChange={(e) => set("description")(e.target.value)} />
                </Field>
                <Switch label="Faqat retsept bilan sotiladi" checked={values.requiresPrescription} onChange={set("requiresPrescription")} />
            </FormGrid>
        </Modal>
    );
}
