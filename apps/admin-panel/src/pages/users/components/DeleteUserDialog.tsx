import { useState } from "react";
import { Alert, Button, Field, Input, Modal, Skeleton } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage, formatNumber } from "@/lib/format";
import { usersService } from "@/services";
import type { AdminUser } from "@/types";

/**
 * Qaytarib bo'lmaydigan amal: o'chiriladigan bog'liq ma'lumotlar soni ko'rsatiladi va
 * tasdiqlash uchun telefon raqamining oxirgi 4 raqamini kiritish talab qilinadi.
 */
export function DeleteUserDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
    const toast = useToast();
    const detail = useAsync(() => usersService.get(user.id), [user.id]);
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const code = user.phone.slice(-4);
    const c = detail.data?.counts;

    const remove = async () => {
        setBusy(true);
        setError("");
        try {
            await usersService.remove(user.id);
            toast.success(`${user.fullName} o'chirildi`);
            onDone();
            onClose();
        } catch (e) {
            setError(errorMessage(e));
            setBusy(false);
        }
    };

    return (
        <Modal
            title="Foydalanuvchini o'chirish"
            size="sm"
            onClose={onClose}
            onSubmit={() => confirm === code && void remove()}
            footer={
                <>
                    <Button onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" variant="danger-solid" icon="trash" loading={busy} disabled={confirm !== code}>
                        O'chirish
                    </Button>
                </>
            }>
            {error && <Alert>{error}</Alert>}
            <p className="text-secondary">
                <b>{user.fullName}</b> ({user.phone}) butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </p>

            {c ? (
                <ul className="consequences">
                    <li>
                        <b>{formatNumber(c.prescriptions)}</b> ta retsept va ularning dorilari
                    </li>
                    <li>
                        <b>{formatNumber(c.activeSchedules)}</b> ta faol eslatma jadvali va dozalar tarixi
                    </li>
                    <li>
                        <b>{formatNumber(c.familyMembers)}</b> ta oila a'zosi profili
                    </li>
                    {c.reviewedPrescriptions > 0 && (
                        <li>
                            Ko'rib chiqqan <b>{formatNumber(c.reviewedPrescriptions)}</b> ta retseptda shifokor maydoni bo'shab qoladi
                        </li>
                    )}
                </ul>
            ) : (
                !detail.error && <Skeleton height={72} />
            )}

            <Alert tone="info" icon="lock">
                Faqat kirishni to'xtatish kerak bo'lsa, o'chirish o'rniga bloklang — ma'lumotlar saqlanib qoladi.
            </Alert>

            <Field label={`Tasdiqlash uchun telefonning oxirgi 4 raqamini kiriting: ${code}`}>
                <Input inputMode="numeric" maxLength={4} value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))} autoFocus />
            </Field>
        </Modal>
    );
}
