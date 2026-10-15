import { RING_RADIUS } from "./chart-math";

/** 0..1 qiymat uchun halqa ko'rsatkich; null — ma'lumot yo'q */
export function Ring({ value, size = 150, color, label }: { value: number | null; size?: number; color: string; label: string }) {
    const pct = value === null ? 0 : Math.max(0, Math.min(1, value)) * 100;
    return (
        <svg width={size} height={size} viewBox="0 0 42 42" role="img" aria-label={`${label}: ${value === null ? "ma'lumot yo'q" : `${Math.round(pct)}%`}`}>
            <circle cx="21" cy="21" r={RING_RADIUS} fill="none" className="chart__track" strokeWidth="4" />
            <circle
                cx="21"
                cy="21"
                r={RING_RADIUS}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset="25"
                className="chart__ring"
            />
            <text x="21" y="22" textAnchor="middle" className="chart__center-value chart__center-value--ring">
                {value === null ? "—" : `${Math.round(pct)}%`}
            </text>
            <text x="21" y="27.5" textAnchor="middle" className="chart__center-label">
                {label}
            </text>
        </svg>
    );
}
