import { Alert, Button, Field, Input, Modal, Segmented, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useZodForm } from "@/hooks/useZodForm";
import { formatDateTime } from "@/lib/format";
import { BLOCK_DURATIONS, blockUserSchema, type BlockDuration } from "@/schemas/user.schema";
import { usersService } from "@/services";
import type { AdminUser } from "@/types";

const OPTIONS = (Object.keys(BLOCK_DURATIONS) as BlockDuration[]).map((value) => ({ value, label: BLOCK_DURATIONS[value].label }));

/** <input type="datetime-local"> uchun lokal vaqt: "2026-10-15T09:30" */
const toLocalInput = (date: Date): string => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

export function BlockUserModal({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
    const toast = useToast();
    const form = useZodForm(blockUserSchema, {
        duration: "24h",
        customUntil: toLocalInput(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
        reason: ""
    });
    const { values, errors, set } = form;
    const duration = values.duration as BlockDuration;

    const preview =
        duration === "forever"
            ? "Admin qo'lda ochmaguncha kira olmaydi"
            : duration === "custom"
              ? values.customUntil && `${formatDateTime(new Date(values.customUntil).toISOString())} gacha`
              : `${formatDateTime(new Date(Date.now() + BLOCK_DURATIONS[duration].ms).toISOString())} gacha, keyin avtomatik ochiladi`;

    const submit = () =>
        form.submit(async (payload) => {
            await usersService.block(user.id, payload);
            toast.success(payload.until ? `${user.fullName} vaqtincha bloklandi` : `${user.fullName} bloklandi`);
            onDone();
            onClose();
        });

    return (
        <Modal
            title="Foydalanuvchini bloklash"
            onClose={onClose}
            onSubmit={submit}
            footer={
                <>
                    <Button onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" variant="danger-solid" icon="lock" loading={form.submitting}>
                        Bloklash
                    </Button>
                </>
            }>
            {form.formError && <Alert>{form.formError}</Alert>}
            <p className="text-secondary">
                <b>{user.fullName}</b> ({user.phone}) tizimdan darhol chiqariladi va blok davomida kira olmaydi.
            </p>

            <Field label="Muddat">
                <Segmented value={duration} onChange={set("duration")} options={OPTIONS} label="Blok muddati" />
            </Field>

            {duration === "custom" && (
                <Field label="Qachongacha" error={errors.customUntil}>
                    <Input type="datetime-local" value={values.customUntil} min={toLocalInput(new Date())} onChange={(e) => set("customUntil")(e.target.value)} />
                </Field>
            )}

            {preview && (
                <Alert tone="info" icon="clock">
                    {preview}
                </Alert>
            )}

            <Field label="Sabab (ixtiyoriy)" error={errors.reason} hint="Faqat administratorlarga ko'rinadi">
                <Textarea value={values.reason} onChange={(e) => set("reason")(e.target.value)} placeholder="Masalan: shubhali faollik, shikoyat bo'yicha tekshiruv" />
            </Field>
        </Modal>
    );
}
