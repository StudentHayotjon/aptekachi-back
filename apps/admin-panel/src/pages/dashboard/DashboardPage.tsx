import { useState } from "react";
import { Alert, Button, Segmented } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services";
import { ActivityChartCard } from "./components/ActivityChartCard";
import { DosesCard } from "./components/DosesCard";
import { InteractionSummaryCard } from "./components/InteractionSummaryCard";
import { InventoryCard } from "./components/InventoryCard";
import { KpiGrid } from "./components/KpiGrid";
import { PrescriptionStatusCard } from "./components/PrescriptionStatusCard";
import { UserCompositionCard } from "./components/UserCompositionCard";
import { SystemHealthCard } from "./components/SystemHealthCard";

type Period = "7" | "30" | "90";

const PERIODS = [
    { value: "7" as const, label: "7 kun" },
    { value: "30" as const, label: "30 kun" },
    { value: "90" as const, label: "90 kun" }
];

export default function DashboardPage() {
    const [period, setPeriod] = useState<Period>("30");
    const stats = useAsync(() => dashboardService.stats(Number(period)), [period]);
    const health = useAsync(() => dashboardService.health(), []);
    const s = stats.data;

    return (
        <>
            {stats.error && <Alert onRetry={stats.reload}>{stats.error}</Alert>}

            <div className="page-actions">
                <Segmented value={period} onChange={setPeriod} options={PERIODS} label="Davr" />
                <span className="text-muted">Davr bo'yicha ko'rsatkichlar</span>
                <Button
                    size="sm"
                    icon="refresh"
                    className="page-actions__end"
                    onClick={() => {
                        stats.reload();
                        health.reload();
                    }}>
                    Yangilash
                </Button>
            </div>

            <KpiGrid stats={s} />

            <div className="grid grid--main-side">
                <ActivityChartCard stats={s} />
                <SystemHealthCard health={health} />
            </div>

            {s && (
                <>
                    <div className="grid grid--three">
                        <PrescriptionStatusCard stats={s} />
                        <UserCompositionCard stats={s} />
                        <DosesCard stats={s} />
                    </div>
                    <div className="grid grid--halves">
                        <InventoryCard stats={s} />
                        <InteractionSummaryCard stats={s} />
                    </div>
                </>
            )}
        </>
    );
}
