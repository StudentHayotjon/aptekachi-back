import { NAV_GROUP_LABEL, ROUTES, type NavGroup, type RouteKey } from "@/app/routes";
import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/lib/cx";
import type { AuthUser } from "@/types";
import { BrandMark } from "./BrandMark";

interface SidebarProps {
    active: RouteKey;
    open: boolean;
    user: AuthUser;
    onNavigate: (key: RouteKey) => void;
    onLogout: () => void;
}

const GROUPS: NavGroup[] = ["general", "core", "ocr"];

export function Sidebar({ active, open, user, onNavigate, onLogout }: SidebarProps) {
    return (
        <aside className={cx("sidebar", open && "is-open")}>
            <div className="brand">
                <BrandMark />
                <div>
                    <div className="brand__name">Aptekachi</div>
                    <div className="brand__sub">Admin panel</div>
                </div>
            </div>

            <nav className="nav" aria-label="Asosiy menyu">
                {GROUPS.map((group) => (
                    <div key={group} className="nav__group">
                        <div className="nav__label">{NAV_GROUP_LABEL[group]}</div>
                        {ROUTES.filter((r) => r.group === group).map((r) => (
                            <button
                                key={r.key}
                                type="button"
                                className={cx("nav__item", active === r.key && "is-active")}
                                aria-current={active === r.key ? "page" : undefined}
                                onClick={() => onNavigate(r.key)}>
                                <Icon name={r.icon} />
                                {r.label}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar__user">
                <Avatar name={user.fullName} />
                <div className="sidebar__user-info">
                    <div className="sidebar__user-name">{user.fullName}</div>
                    <div className="sidebar__user-phone">{user.phone}</div>
                </div>
                <button type="button" className="sidebar__logout" aria-label="Chiqish" title="Chiqish" onClick={onLogout}>
                    <Icon name="logout" size={16} />
                </button>
            </div>
        </aside>
    );
}
