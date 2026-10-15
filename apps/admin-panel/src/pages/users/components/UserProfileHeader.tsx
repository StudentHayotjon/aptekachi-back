import { RoleBadge, UserStatusBadge } from "@/components/badges";
import { Avatar, Badge } from "@/components/ui";
import type { AdminUser } from "@/types";

export function UserProfileHeader({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
    return (
        <div className="card profile">
            <Avatar name={user.fullName} size="lg" />
            <div className="profile__info">
                <div className="profile__name">{user.fullName}</div>
                <div className="text-muted">{user.phone}</div>
                <div className="chips">
                    <RoleBadge role={user.role} />
                    <UserStatusBadge user={user} />
                    {isSelf && <Badge>Siz</Badge>}
                </div>
            </div>
        </div>
    );
}
