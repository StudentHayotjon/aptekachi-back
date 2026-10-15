import { useState, type ReactNode } from "react";
import { errorMessage } from "@/lib/format";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
    title: string;
    message: ReactNode;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

/** Tasdiqlash oynasi: amal muvaffaqiyatli bo'lsa yopiladi, xato bo'lsa oyna ichida ko'rsatiladi */
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmDialogProps) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const confirm = async () => {
        setBusy(true);
        setError("");
        try {
            await onConfirm();
            onClose();
        } catch (e) {
            setError(errorMessage(e));
            setBusy(false);
        }
    };

    return (
        <Modal
            title={title}
            size="sm"
            onClose={onClose}
            footer={
                <>
                    <Button onClick={onClose}>Bekor qilish</Button>
                    <Button variant={danger ? "danger-solid" : "primary"} loading={busy} onClick={confirm}>
                        {confirmLabel}
                    </Button>
                </>
            }>
            {error && <Alert>{error}</Alert>}
            <p className="text-secondary">{message}</p>
        </Modal>
    );
}
