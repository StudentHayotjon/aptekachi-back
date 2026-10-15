import { Icon } from "@/components/icons/Icon";
import { CHART_COLORS as C } from "@/lib/labels";
import { formatNumber, formatPercent } from "@/lib/format";
import type { Stats } from "@/types";
import { KpiCard, KpiCardSkeleton } from "./KpiCard";

export function KpiGrid({ stats }: { stats: Stats | null }) {
    if (!stats) {
        return (
            <div className="grid grid--kpis">
                {Array.from({ length: 4 }, (_, i) => (
                    <KpiCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    const lowStock = stats.drugs.lowStock + stats.drugs.outOfStock;
    return (
        <div className="grid grid--kpis">
            <KpiCard
                icon="users"
                label="Foydalanuvchilar"
                value={formatNumber(stats.users.total)}
                footer={
                    <>
                        <b className="text-success">+{formatNumber(stats.users.newInPeriod)}</b> shu davrda
                    </>
                }
                trend={stats.series.registrations.map((p) => p.count)}
                trendColor={C.brand}
            />
            <KpiCard
                icon="file"
                tone="violet"
                label="Retseptlar"
                value={formatNumber(stats.prescriptions.total)}
                footer={
                    <>
                        <b className="text-warning">{formatNumber(stats.prescriptions.byStatus.PENDING)}</b> ko'rib chiqilmoqda
                    </>
                }
                trend={stats.series.prescriptions.map((p) => p.count)}
                trendColor={C.violet}
            />
            <KpiCard
                icon="pill"
                tone="success"
                label="Faol dorilar"
                value={formatNumber(stats.drugs.active)}
                footer={
                    lowStock > 0 ? (
                        <>
                            <Icon name="alert" size={14} />
                            <b className="text-danger">{formatNumber(lowStock)}</b> tasi kam qolgan
                        </>
                    ) : (
                        "Qoldiqlar yetarli"
                    )
                }
            />
            <KpiCard
                icon="heart"
                tone="warning"
                label="Dozaga rioya"
                value={formatPercent(stats.doses.adherenceRate)}
                footer={`${formatNumber(stats.doses.byStatus.TAKEN)} ta doza o'z vaqtida ichilgan`}
            />
        </div>
    );
}
