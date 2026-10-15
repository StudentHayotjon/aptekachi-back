import { useState } from "react";
import { Alert, Button, ConfirmDialog, Drawer, Skeleton } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { formatDateTime } from "@/lib/format";
import { usersService } from "@/services";
import { accessState } from "@/types";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { UserActivity } from "./UserActivity";
import { UserProfileHeader } from "./UserProfileHeader";
import { useUserActions } from "./useUserActions";

interface Props {
    userId: string;
    currentUserId: string;
    onClose: () => void;
    onChanged: () => void;
}

export function UserDrawer({ userId, currentUserId, onClose, onChanged }: Props) {
    const toast = useToast();
    const detail = useAsync(() => usersService.get(userId), [userId]);
    const [dialog, setDialog] = useState<"password" | "sessions" | null>(null);
    const user = detail.data;
    const isSelf = userId === currentUserId;

    const refresh = () => {
        detail.reload();
        onChanged();
    };
    const actions = useUserActions({
        onChanged: refresh,
        onDeleted: () => {
            onChanged();
            onClose();
        }
    });

    const state = user ? accessState(user) : "active";

    return (
        <Drawer title="Foydalanuvchi" onClose={onClose}>
            {detail.error && <Alert onRetry={detail.reload}>{detail.error}</Alert>}

            {!user ? (
                !detail.error && (
                    <div className="stack">
                        <Skeleton height={96} />
                        <Skeleton height={36} width="70%" />
                        <Skeleton height={180} />
                    </div>
                )
            ) : (
                <>
                    <UserProfileHeader user={user} isSelf={isSelf} />

                    {state !== "active" && (
                        <Alert icon="lock">
                            {state === "temporary" ? `${formatDateTime(user.blockedUntil)} gacha vaqtincha bloklangan.` : "Muddatsiz bloklangan."}
                            {user.blockReason && ` Sabab: ${user.blockReason}`}
                        </Alert>
                    )}

                    <div className="chips">
                        <Button size="sm" icon="edit" onClick={() => actions.run("edit", user)}>
                            Tahrirlash
                        </Button>
                        <Button size="sm" icon="key" onClick={() => setDialog("password")}>
                            Parolni tiklash
                        </Button>
                        <Button size="sm" icon="logout" disabled={user.activeSessions === 0} onClick={() => setDialog("sessions")}>
                            Sessiyalarni yopish
                        </Button>
                        {!isSelf &&
                            (state === "active" ? (
                                <Button size="sm" icon="lock" className="btn--warning" onClick={() => actions.run("block", user)}>
                                    Bloklash
                                </Button>
                            ) : (
                                <Button size="sm" icon="unlock" className="btn--success" onClick={() => actions.run("unblock", user)}>
                                    Blokdan chiqarish
                                </Button>
                            ))}
                        {!isSelf && (
                            <Button size="sm" variant="danger" icon="trash" onClick={() => actions.run("delete", user)}>
                                O'chirish
                            </Button>
                        )}
                    </div>

                    <UserActivity user={user} />

                    {actions.dialogs}
                    {dialog === "password" && <ResetPasswordModal user={user} onClose={() => setDialog(null)} />}
                    {dialog === "sessions" && (
                        <ConfirmDialog
                            title="Sessiyalarni yopish"
                            message={`${user.fullName} barcha qurilmalardan chiqariladi va qaytadan kirishi kerak bo'ladi.`}
                            confirmLabel="Yopish"
                            onClose={() => setDialog(null)}
                            onConfirm={async () => {
                                const { revoked } = await usersService.revokeSessions(user.id);
                                toast.success(`${revoked} ta sessiya yopildi`);
                                refresh();
                            }}
                        />
                    )}
                </>
            )}
        </Drawer>
    );
}
