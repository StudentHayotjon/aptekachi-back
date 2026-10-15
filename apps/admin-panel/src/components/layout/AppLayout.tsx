import { Suspense, useState, type ReactNode } from "react";
import type { RouteDef, RouteKey } from "@/app/routes";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/hooks/useTheme";
import type { AuthUser } from "@/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
    route: RouteDef;
    user: AuthUser;
    onNavigate: (key: RouteKey) => void;
    onLogout: () => void;
    children: ReactNode;
}

function PageFallback() {
    return (
        <div className="stack">
            <Skeleton height={44} width="40%" />
            <Skeleton height={320} />
        </div>
    );
}

export function AppLayout({ route, user, onNavigate, onLogout, children }: AppLayoutProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const theme = useTheme();

    const navigate = (key: RouteKey) => {
        setMenuOpen(false);
        onNavigate(key);
    };

    return (
        <div className="shell">
            <Sidebar active={route.key} open={menuOpen} user={user} onNavigate={navigate} onLogout={onLogout} />
            {menuOpen && <div className="overlay overlay--menu" onClick={() => setMenuOpen(false)} />}
            <div className="main">
                <Topbar title={route.title} subtitle={route.subtitle} isDark={theme.isDark} onToggleTheme={theme.toggle} onOpenMenu={() => setMenuOpen(true)} />
                <main className="content" key={route.key}>
                    <Suspense fallback={<PageFallback />}>{children}</Suspense>
                </main>
            </div>
        </div>
    );
}
