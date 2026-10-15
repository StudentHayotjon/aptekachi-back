import { useApp } from "@/app/AppContext";
import { Button, Card, StatTile, StatTiles } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { SEVERITY_LABEL } from "@/lib/labels";
import type { Stats } from "@/types";

const ORDER = ["RED", "YELLOW", "GREEN"] as const;
const TONE = { RED: "danger", YELLOW: "warning", GREEN: "success" } as const;

export function InteractionSummaryCard({ stats }: { stats: Stats }) {
    const { navigate } = useApp();
    return (
        <Card title="O'zaro ta'sirlar bazasi" actions={<Button size="sm" variant="ghost" onClick={() => navigate("interactions")}>Ochish</Button>}>
            <StatTiles>
                {ORDER.map((k) => (
                    <StatTile key={k} value={formatNumber(stats.interactions.bySeverity[k])} label={SEVERITY_LABEL[k]} tone={TONE[k]} />
                ))}
            </StatTiles>
        </Card>
    );
}
