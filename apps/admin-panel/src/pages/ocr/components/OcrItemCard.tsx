import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui";
import type { OcrItem } from "@/types";

const FIELDS: [keyof OcrItem, string][] = [
    ["releaseForm", "Chiqarilish shakli"],
    ["usageMethod", "Qabul usuli"],
    ["dailyDoseCount", "Kunlik soni"],
    ["regimen", "Qabul tartibi"],
    ["duration", "Davomiyligi"],
    ["totalQuantity", "Umumiy miqdori"],
    ["validUntil", "Amal qilish muddati"],
    ["himoyaKodi", "Himoya kodi"],
    ["note", "Izoh"]
];

export function OcrItemCard({ item, index }: { item: OcrItem; index: number }) {
    return (
        <article className="item-card">
            <header className="item-card__title">
                <span className="item-card__index">{index + 1}</span>
                <span className="item-card__name">{item.drugNameRaw}</span>
                {item.matchedDrug ? (
                    <Badge tone="success">
                        <Icon name="check" size={13} /> {item.matchedDrug.name}
                    </Badge>
                ) : (
                    <Badge tone="warning">Bazada mos dori yo'q</Badge>
                )}
            </header>
            <dl className="item-card__grid">
                {FIELDS.filter(([key]) => item[key]).map(([key, label]) => (
                    <div key={key}>
                        <dt>{label}</dt>
                        <dd>{String(item[key])}</dd>
                    </div>
                ))}
            </dl>
        </article>
    );
}
