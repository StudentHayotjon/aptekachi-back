import { useState } from "react";
import { Button, Card, EmptyState, StatTile, StatTiles } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import type { OcrResult } from "@/types";
import { OcrItemCard } from "./OcrItemCard";

export function OcrResultPanel({ result }: { result: OcrResult | null }) {
    const [asJson, setAsJson] = useState(false);
    const first = result?.items[0];
    const matched = result?.items.filter((i) => i.matchedDrug).length ?? 0;

    return (
        <Card
            title="Natija"
            hint={result ? `${formatNumber(result.items.length)} ta dori · ${(result.durationMs / 1000).toFixed(1)} s` : "Rasm tahlil qilingach shu yerda ko'rinadi"}
            actions={
                result && (
                    <Button size="sm" variant="ghost" onClick={() => setAsJson((v) => !v)}>
                        {asJson ? "Kartochkalar" : "JSON"}
                    </Button>
                )
            }>
            {!result ? (
                <EmptyState icon="scan" title="Hali tahlil qilinmagan" text="Chap tomonga retsept rasmini yuklang va “Tahlil qilish”ni bosing" />
            ) : result.items.length === 0 ? (
                <EmptyState icon="alert" title="Rasmda retsept topilmadi" text="Aniqroq yoki yorug'roq rasm bilan qayta urinib ko'ring" />
            ) : asJson ? (
                <pre className="code-block">{JSON.stringify(result, null, 2)}</pre>
            ) : (
                <div className="stack">
                    <StatTiles>
                        <StatTile value={first?.bemorFish ?? "—"} label={first?.bemorYosh ? `Bemor · ${first.bemorYosh}` : "Bemor"} />
                        <StatTile value={first?.shifokorFish ?? "—"} label="Shifokor" />
                        <StatTile value={`${matched}/${result.items.length}`} label="Bazaga mos" tone={matched === result.items.length ? "success" : "warning"} />
                    </StatTiles>
                    {result.items.map((item, i) => (
                        <OcrItemCard key={`${item.drugNameRaw}-${i}`} item={item} index={i} />
                    ))}
                </div>
            )}
        </Card>
    );
}
