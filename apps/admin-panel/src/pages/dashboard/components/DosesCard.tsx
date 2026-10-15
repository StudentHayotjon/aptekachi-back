import { Ring } from "@/components/charts";
import { Card } from "@/components/ui";
import { CHART_COLORS as C, DOSE_LABEL } from "@/lib/labels";
import type { Stats } from "@/types";
import { LegendRow } from "./LegendRow";

const ORDER = ["TAKEN", "SKIPPED", "PENDING"] as const;
const COLOR = { TAKEN: C.success, SKIPPED: C.danger, PENDING: C.gray } as const;

export function DosesCard({ stats }: { stats: Stats }) {
    return (
        <Card title="Dozalar" hint="Davr ichida rejalashtirilganlar">
            <div className="split">
                <Ring value={stats.doses.adherenceRate} label="rioya" color={C.success} />
                <div className="legend-list">
                    {ORDER.map((k) => (
                        <LegendRow key={k} color={COLOR[k]} label={DOSE_LABEL[k]} value={stats.doses.byStatus[k]} />
                    ))}
                </div>
            </div>
        </Card>
    );
}
