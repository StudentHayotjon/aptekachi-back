import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatRemaining } from "@/lib/format";
import { accessState, type AdminUser } from "@/types";

/** Faol / vaqtincha bloklangan (qolgan muddat bilan) / bloklangan. Sabab sichqoncha ustida ko'rinadi */
export function UserStatusBadge({ user }: { user: Pick<AdminUser, "isActive" | "blockedUntil" | "blockReason"> }) {
    const state = accessState(user);
    const title = user.blockReason ? `Sabab: ${user.blockReason}` : undefined;

    if (state === "active") {
        return (
            <Badge tone="success" dot>
                Faol
            </Badge>
        );
    }
    if (state === "temporary") {
        return (
            <span title={[`${formatDateTime(user.blockedUntil)} gacha`, title].filter(Boolean).join("\n")}>
                <Badge tone="warning">
                    <Icon name="clock" size={13} />
                    {formatRemaining(user.blockedUntil!)} blokda
                </Badge>
            </span>
        );
    }
    return (
        <span title={title}>
            <Badge tone="danger" dot>
                Bloklangan
            </Badge>
        </span>
    );
}
