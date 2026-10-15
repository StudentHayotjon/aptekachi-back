import { formatNumber } from "@/lib/format";

export function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
    return (
        <div className="legend-list__row">
            <i style={{ background: color }} />
            {label}
            <b>{formatNumber(value)}</b>
        </div>
    );
}
