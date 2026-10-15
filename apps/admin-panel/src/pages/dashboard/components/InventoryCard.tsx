import { useApp } from "@/app/AppContext";
import { Button, Card, StatTile, StatTiles } from "@/components/ui";
import { LOW_STOCK_THRESHOLD } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import type { Stats } from "@/types";

export function InventoryCard({ stats }: { stats: Stats }) {
    const { navigate } = useApp();
    const d = stats.drugs;
    return (
        <Card title="Dorilar ombori" actions={<Button size="sm" variant="ghost" onClick={() => navigate("drugs")}>Katalog</Button>}>
            <StatTiles>
                <StatTile value={formatNumber(d.lowStock)} label={`Kam qolgan (≤${LOW_STOCK_THRESHOLD})`} />
                <StatTile value={formatNumber(d.outOfStock)} label="Tugagan" tone={d.outOfStock ? "danger" : undefined} />
                <StatTile value={formatNumber(d.requiresPrescription)} label="Retsept bilan" />
            </StatTiles>
        </Card>
    );
}
