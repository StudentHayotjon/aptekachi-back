import { Alert, Button, Field, Input, Modal, Segmented } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useZodForm } from "@/hooks/useZodForm";
import { formatNumber } from "@/lib/format";
import { stockSchema, type StockMode } from "@/schemas/drug.schema";
import { drugsService } from "@/services";
import type { Drug, StockPayload } from "@/types";

const MODES = [
    { value: "in" as const, label: "Kirim +" },
    { value: "out" as const, label: "Chiqim −" },
    { value: "set" as const, label: "Aniq qiymat" }
];

const nextStock = (current: number, mode: StockMode, amount: number): number =>
    mode === "in" ? current + amount : mode === "out" ? current - amount : amount;

export function StockModal({ drug, onClose, onSaved }: { drug: Drug; onClose: () => void; onSaved: () => void }) {
    const toast = useToast();
    const form = useZodForm(stockSchema, { mode: "in", amount: "" });
    const amount = Number(form.values.amount || 0);
    const preview = nextStock(drug.stock, form.values.mode as StockMode, Number.isFinite(amount) ? amount : 0);

    const submit = () =>
        form.submit(async ({ mode, amount }) => {
            if (nextStock(drug.stock, mode, amount) < 0) throw new Error("Qoldiq manfiy bo'lib qoladi");
            const payload: StockPayload = mode === "set" ? { stock: amount } : { delta: mode === "in" ? amount : -amount };
            await drugsService.adjustStock(drug.id, payload);
            toast.success("Qoldiq yangilandi");
            onSaved();
            onClose();
        });

    return (
        <Modal
            title="Qoldiqni o'zgartirish"
            size="sm"
            onClose={onClose}
            onSubmit={submit}
            footer={
                <>
                    <Button onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" variant="primary" loading={form.submitting}>
                        Saqlash
                    </Button>
                </>
            }>
            {form.formError && <Alert>{form.formError}</Alert>}
            <div>
                <b>{drug.name}</b>
                <div className="text-muted">Hozirgi qoldiq: {formatNumber(drug.stock)}</div>
            </div>
            <Segmented value={form.values.mode as StockMode} onChange={form.set("mode")} options={MODES} label="Amal turi" />
            <Field label="Miqdor" error={form.errors.amount}>
                <Input inputMode="numeric" autoFocus value={form.values.amount} placeholder="0" onChange={(e) => form.set("amount")(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Alert tone={preview < 0 ? "danger" : "info"} icon="box">
                {preview < 0 ? "Qoldiq manfiy bo'lib qoladi" : `Yangi qoldiq: ${formatNumber(preview)}`}
            </Alert>
        </Modal>
    );
}
