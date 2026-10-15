import { useApp } from "@/app/AppContext";
import { Donut } from "@/components/charts";
import { Button, Card } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { CHART_COLORS as C, STATUS_LABEL } from "@/lib/labels";
import type { Stats } from "@/types";
import { LegendRow } from "./LegendRow";

const ORDER = ["APPROVED", "PENDING", "REJECTED"] as const;
const COLOR = { APPROVED: C.success, PENDING: C.warning, REJECTED: C.danger } as const;

export function PrescriptionStatusCard({ stats }: { stats: Stats }) {
    const { navigate } = useApp();
    const p = stats.prescriptions;
    return (
        <Card title="Retseptlar holati" actions={<Button size="sm" variant="ghost" onClick={() => navigate("prescriptions")}>Barchasi</Button>}>
            <div className="split">
                <Donut center={{ value: formatNumber(p.total), label: "jami" }} slices={ORDER.map((k) => ({ label: STATUS_LABEL[k], value: p.byStatus[k], color: COLOR[k] }))} />
                <div className="legend-list">
                    {ORDER.map((k) => (
                        <LegendRow key={k} color={COLOR[k]} label={STATUS_LABEL[k]} value={p.byStatus[k]} />
                    ))}
                    <div className="legend-list__row legend-list__row--total">
                        OCR / DMED QR
                        <b>
                            {formatNumber(p.bySource.OCR)} / {formatNumber(p.bySource.DMED_QR)}
                        </b>
                    </div>
                </div>
            </div>
        </Card>
    );
}
