import { Badge } from "@/components/ui";
import type { PrescriptionItem } from "@/types";

const FIELDS: [keyof PrescriptionItem, string][] = [
    ["releaseForm", "Chiqarilish shakli"],
    ["usageMethod", "Qabul usuli"],
    ["dailyDoseCount", "Kunlik soni"],
    ["regimen", "Qabul tartibi"],
    ["duration", "Davomiyligi"],
    ["totalQuantity", "Umumiy miqdori"],
    ["validUntil", "Amal qilish muddati"],
    ["retseptId", "Retsept ID"],
    ["shifokorFish", "Retseptdagi shifokor"],
    ["note", "Izoh"]
];

export function PrescriptionItemCard({ item, index }: { item: PrescriptionItem; index: number }) {
    return (
        <article className="item-card">
            <header className="item-card__title">
                <span className="item-card__index">{index + 1}</span>
                <span className="item-card__name">{item.drugNameRaw}</span>
                {item.drugId ? <Badge tone="success">Bazada bor</Badge> : <Badge tone="warning">Bazada topilmadi</Badge>}
            </header>
            <dl className="item-card__grid">
                {FIELDS.filter(([key]) => item[key]).map(([key, label]) => (
                    <div key={key}>
                        <dt>{label}</dt>
                        <dd>{item[key]}</dd>
                    </div>
                ))}
            </dl>
        </article>
    );
}
