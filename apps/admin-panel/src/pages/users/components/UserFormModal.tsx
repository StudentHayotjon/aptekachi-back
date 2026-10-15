import { Alert, Button, Field, FormGrid, Input, Modal, Select } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useZodForm } from "@/hooks/useZodForm";
import { ROLE_LABEL } from "@/lib/labels";
import { createUserSchema, updateUserSchema } from "@/schemas/user.schema";
import { usersService } from "@/services";
import { ROLES, type AdminUser, type Role, type UpdateUserPayload } from "@/types";

interface Props {
    user?: AdminUser;
    onClose: () => void;
    onSaved: () => void;
}

/** Yangi foydalanuvchi yaratish yoki mavjudini tahrirlash (faqat o'zgargan maydonlar yuboriladi) */
export function UserFormModal({ user, onClose, onSaved }: Props) {
    return user ? <EditUser user={user} onClose={onClose} onSaved={onSaved} /> : <CreateUser onClose={onClose} onSaved={onSaved} />;
}

function RoleSelect({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
    return (
        <Select value={value} onChange={(e) => onChange(e.target.value as Role)}>
            {ROLES.map((r) => (
                <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                </option>
            ))}
        </Select>
    );
}

function CreateUser({ onClose, onSaved }: Omit<Props, "user">) {
    const toast = useToast();
    const form = useZodForm(createUserSchema, { fullName: "", phone: "+998", role: "SHIFOKOR", password: "" });
    const { values, errors, set } = form;

    const submit = () =>
        form.submit(async (data) => {
            await usersService.create(data);
            toast.success("Foydalanuvchi yaratildi");
            onSaved();
            onClose();
        });

    return (
        <Modal
            title="Yangi foydalanuvchi"
            onClose={onClose}
            onSubmit={submit}
            footer={
                <>
                    <Button onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" variant="primary" loading={form.submitting}>
                        Yaratish
                    </Button>
                </>
            }>
            {form.formError && <Alert>{form.formError}</Alert>}
            <FormGrid>
                <Field label="To'liq ism" error={errors.fullName} full>
                    <Input value={values.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="Dr. Aliyev Vali" autoFocus />
                </Field>
                <Field label="Telefon" error={errors.phone}>
                    <Input inputMode="tel" value={values.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+998901234567" />
                </Field>
                <Field label="Rol" error={errors.role}>
                    <RoleSelect value={values.role as Role} onChange={set("role")} />
                </Field>
                <Field label="Boshlang'ich parol" error={errors.password} hint="Foydalanuvchi keyin o'zi o'zgartirishi mumkin" full>
                    <Input value={values.password} onChange={(e) => set("password")(e.target.value)} placeholder="Kamida 8 belgi" autoComplete="new-password" />
                </Field>
            </FormGrid>
        </Modal>
    );
}

function EditUser({ user, onClose, onSaved }: Props & { user: AdminUser }) {
    const toast = useToast();
    const form = useZodForm(updateUserSchema, { fullName: user.fullName, phone: user.phone, role: user.role });
    const { values, errors, set } = form;

    const submit = () =>
        form.submit(async (data) => {
            const changes: UpdateUserPayload = {
                ...(data.fullName !== user.fullName && { fullName: data.fullName }),
                ...(data.phone !== user.phone && { phone: data.phone }),
                ...(data.role !== user.role && { role: data.role })
            };
            if (Object.keys(changes).length > 0) {
                await usersService.update(user.id, changes);
                toast.success("Foydalanuvchi yangilandi");
                onSaved();
            }
            onClose();
        });

    return (
        <Modal
            title="Foydalanuvchini tahrirlash"
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
            <FormGrid>
                <Field label="To'liq ism" error={errors.fullName} full>
                    <Input value={values.fullName} onChange={(e) => set("fullName")(e.target.value)} autoFocus />
                </Field>
                <Field label="Telefon" error={errors.phone}>
                    <Input inputMode="tel" value={values.phone} onChange={(e) => set("phone")(e.target.value)} />
                </Field>
                <Field label="Rol" error={errors.role}>
                    <RoleSelect value={values.role as Role} onChange={set("role")} />
                </Field>
            </FormGrid>
            {values.role !== user.role && <Alert tone="info">Rol o'zgarganda foydalanuvchi barcha qurilmalardan chiqariladi.</Alert>}
        </Modal>
    );
}
