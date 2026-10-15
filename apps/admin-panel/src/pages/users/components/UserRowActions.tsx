import { Button } from "@/components/ui";
import { accessState, type AdminUser } from "@/types";

export type UserAction = "edit" | "block" | "unblock" | "delete";

/** Jadval qatoridagi tez amallar. O'z hisobingizga bloklash/o'chirish ko'rsatilmaydi */
export function UserRowActions({ user, isSelf, onAction }: { user: AdminUser; isSelf: boolean; onAction: (action: UserAction) => void }) {
    const blocked = accessState(user) !== "active";
    return (
        <div className="row-actions">
            <Button size="sm" variant="ghost" icon="edit" aria-label="Tahrirlash" title="Tahrirlash" onClick={() => onAction("edit")} />
            {!isSelf &&
                (blocked ? (
                    <Button size="sm" variant="ghost" icon="unlock" aria-label="Blokdan chiqarish" title="Blokdan chiqarish" className="btn--success" onClick={() => onAction("unblock")} />
                ) : (
                    <Button size="sm" variant="ghost" icon="lock" aria-label="Bloklash" title="Bloklash (vaqtincha yoki muddatsiz)" className="btn--warning" onClick={() => onAction("block")} />
                ))}
            {!isSelf && <Button size="sm" variant="ghost" icon="trash" aria-label="O'chirish" title="O'chirish" className="btn--danger" onClick={() => onAction("delete")} />}
        </div>
    );
}
