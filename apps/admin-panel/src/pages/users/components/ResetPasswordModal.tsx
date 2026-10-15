import { Alert, Button, Field, Input, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useZodForm } from "@/hooks/useZodForm";
import { resetPasswordSchema } from "@/schemas/user.schema";
import { usersService } from "@/services";
import type { AdminUser } from "@/types";

export function ResetPasswordModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
    const toast = useToast();
    const form = useZodForm(resetPasswordSchema, { newPassword: "" });

    const submit = () =>
        form.submit(async ({ newPassword }) => {
            await usersService.resetPassword(user.id, newPassword);
            toast.success("Parol yangilandi");
            onClose();
        });

    return (
        <Modal
            title="Parolni tiklash"
            size="sm"
            onClose={onClose}
            onSubmit={submit}
            footer={
                <>
                    <Button onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" variant="primary" loading={form.submitting}>
                        Yangilash
                    </Button>
                </>
            }>
            {form.formError && <Alert>{form.formError}</Alert>}
            <p className="text-secondary">
                <b>{user.fullName}</b> uchun yangi parol. Barcha faol sessiyalar yopiladi.
            </p>
            <Field label="Yangi parol" error={form.errors.newPassword}>
                <Input value={form.values.newPassword} onChange={(e) => form.set("newPassword")(e.target.value)} placeholder="Kamida 8 belgi" autoFocus autoComplete="new-password" />
            </Field>
        </Modal>
    );
}
