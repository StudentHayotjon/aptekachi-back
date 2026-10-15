import { AreaChart } from "@/components/charts";
import { Card, Skeleton } from "@/components/ui";
import { CHART_COLORS as C } from "@/lib/labels";
import type { Stats } from "@/types";

const SERIES = [
    { key: "registrations", name: "Ro'yxatdan o'tish", color: C.brand },
    { key: "prescriptions", name: "Retseptlar", color: C.violet }
] as const;

export function ActivityChartCard({ stats }: { stats: Stats | null }) {
    return (
        <Card
            title="Faollik dinamikasi"
            hint="Kunlik yangi foydalanuvchilar va retseptlar"
            actions={
                <div className="legend">
                    {SERIES.map((s) => (
                        <span key={s.key}>
                            <i style={{ background: s.color }} />
                            {s.name}
                        </span>
                    ))}
                </div>
            }>
            {stats ? <AreaChart series={SERIES.map((s) => ({ name: s.name, color: s.color, points: stats.series[s.key] }))} /> : <Skeleton height={260} />}
        </Card>
    );
}
