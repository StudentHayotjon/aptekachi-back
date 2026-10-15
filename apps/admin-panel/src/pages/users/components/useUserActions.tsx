import { useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { usersService } from "@/services";
import type { AdminUser } from "@/types";
import { BlockUserModal } from "./BlockUserModal";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserFormModal } from "./UserFormModal";
import type { UserAction } from "./UserRowActions";

interface Options {
    /** Foydalanuvchi o'zgardi (tahrir, blok, blokdan chiqarish) — ro'yxat/karta yangilanadi */
    onChanged: () => void;
    /** Foydalanuvchi o'chirildi */
    onDeleted?: (user: AdminUser) => void;
}

/**
 * Jadval va drawer uchun umumiy amallar: tegishli oynani ochadi yoki (blokdan chiqarishda) darhol bajaradi.
 * `dialogs` ni komponent JSX'iga qo'yish kerak.
 */
export function useUserActions({ onChanged, onDeleted }: Options): { run: (action: UserAction, user: AdminUser) => void; dialogs: ReactNode } {
    const toast = useToast();
    const [active, setActive] = useState<{ action: Exclude<UserAction, "unblock">; user: AdminUser } | null>(null);
    const close = () => setActive(null);

    const run = (action: UserAction, user: AdminUser) => {
        if (action !== "unblock") {
            setActive({ action, user });
            return;
        }
        usersService
            .unblock(user.id)
            .then(() => {
                toast.success(`${user.fullName} blokdan chiqarildi`);
                onChanged();
            })
            .catch(toast.error);
    };

    const dialogs = active && (
        <>
            {active.action === "edit" && <UserFormModal user={active.user} onClose={close} onSaved={onChanged} />}
            {active.action === "block" && <BlockUserModal user={active.user} onClose={close} onDone={onChanged} />}
            {active.action === "delete" && <DeleteUserDialog user={active.user} onClose={close} onDone={() => (onDeleted ? onDeleted(active.user) : onChanged())} />}
        </>
    );

    return { run, dialogs };
}
