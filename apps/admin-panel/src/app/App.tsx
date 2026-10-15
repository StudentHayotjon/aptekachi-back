import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSession } from "@/hooks/useSession";
import { LoginPage } from "@/pages/login/LoginPage";
import { authService } from "@/services";
import { AppContext } from "./AppContext";
import { ROUTES } from "./routes";
import { useHashRoute } from "./useHashRoute";

export function App() {
    const session = useSession();
    const { route, navigate } = useHashRoute();
    const current = ROUTES.find((r) => r.key === route)!;
    const context = useMemo(() => (session ? { session, navigate } : null), [session, navigate]);

    if (!session || !context) {
        return <LoginPage />;
    }

    const Page = current.component;
    return (
        <AppContext.Provider value={context}>
            <AppLayout route={current} user={session.user} onNavigate={navigate} onLogout={() => void authService.logout()}>
                <Page />
            </AppLayout>
        </AppContext.Provider>
    );
}
