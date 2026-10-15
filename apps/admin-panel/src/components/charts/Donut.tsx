import { RING_RADIUS } from "./chart-math";

export interface Slice {
    label: string;
    value: number;
    color: string;
}

const GAP = 0.8; // bo'laklar orasidagi tirqish (foizda)

export function Donut({ slices, size = 168, center }: { slices: Slice[]; size?: number; center?: { value: string; label: string } }) {
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    const visible = slices.filter((s) => s.value > 0).length;
    let offset = 25; // 12 soat yo'nalishidan boshlash

    return (
        <svg width={size} height={size} viewBox="0 0 42 42" role="img" aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(", ")}>
            <circle cx="21" cy="21" r={RING_RADIUS} fill="none" className="chart__track" strokeWidth="5" />
            {slices.map((s) => {
                const pct = total ? (s.value / total) * 100 : 0;
                const arc = (
                    <circle
                        key={s.label}
                        cx="21"
                        cy="21"
                        r={RING_RADIUS}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="5"
                        strokeDasharray={`${Math.max(0, pct - (visible > 1 ? GAP : 0))} ${100 - pct + GAP}`}
                        strokeDashoffset={offset}
                    />
                );
                offset -= pct;
                return pct > 0 ? arc : null;
            })}
            {center && (
                <>
                    <text x="21" y="21" textAnchor="middle" className="chart__center-value">
                        {center.value}
                    </text>
                    <text x="21" y="26.5" textAnchor="middle" className="chart__center-label">
                        {center.label}
                    </text>
                </>
            )}
        </svg>
    );
}
