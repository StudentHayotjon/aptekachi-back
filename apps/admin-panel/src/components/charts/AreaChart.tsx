import { useId, useState, type MouseEvent } from "react";
import { formatDay, formatNumber } from "@/lib/format";
import type { DailyPoint } from "@/types";
import { niceMax, smoothPath, type Point } from "./chart-math";

export interface Series {
    name: string;
    color: string;
    points: DailyPoint[];
}

const WIDTH = 720;
const PAD = { l: 36, r: 12, t: 12, b: 28 };
const dayLabel = (iso: string) => formatDay(new Date(`${iso}T00:00:00`));

/** Bir nechta kunlik qator uchun maydonli chiziqli grafik, sichqoncha bilan tooltip */
export function AreaChart({ series, height = 260 }: { series: Series[]; height?: number }) {
    const id = useId();
    const [hover, setHover] = useState<number | null>(null);
    const n = series[0]?.points.length ?? 0;
    const max = niceMax(Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.count))));

    const x = (i: number) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (WIDTH - PAD.l - PAD.r));
    const y = (v: number) => PAD.t + (1 - v / max) * (height - PAD.t - PAD.b);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
    const labelEvery = Math.max(1, Math.ceil(n / 8));

    const onMove = (e: MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const rel = ((e.clientX - rect.left) / rect.width) * WIDTH;
        const i = Math.round(((rel - PAD.l) / (WIDTH - PAD.l - PAD.r)) * (n - 1));
        setHover(Math.min(n - 1, Math.max(0, i)));
    };

    return (
        <div className="chart">
            <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Kunlik dinamika grafigi">
                <defs>
                    {series.map((s, si) => (
                        <linearGradient key={s.name} id={`${id}-g${si}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
                            <stop offset="1" stopColor={s.color} stopOpacity="0" />
                        </linearGradient>
                    ))}
                </defs>
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={PAD.l} x2={WIDTH - PAD.r} y1={y(t)} y2={y(t)} className="chart__grid" strokeDasharray={t === 0 ? undefined : "3 5"} />
                        <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="chart__label">
                            {formatNumber(t)}
                        </text>
                    </g>
                ))}
                {series[0]?.points.map((p, i) =>
                    (i % labelEvery === 0 && n - 1 - i >= labelEvery / 2) || i === n - 1 ? (
                        <text key={p.date} x={x(i)} y={height - 8} textAnchor="middle" className="chart__label">
                            {dayLabel(p.date)}
                        </text>
                    ) : null
                )}
                {series.map((s, si) => {
                    const line = smoothPath(s.points.map((p, i): Point => [x(i), y(p.count)]));
                    return (
                        <g key={s.name}>
                            <path d={`${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${id}-g${si})`} />
                            <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                    );
                })}
                {hover !== null && (
                    <g>
                        <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={height - PAD.b} className="chart__cursor" />
                        {series.map((s) => (
                            <circle key={s.name} cx={x(hover)} cy={y(s.points[hover].count)} r="5" className="chart__dot" stroke={s.color} />
                        ))}
                    </g>
                )}
            </svg>
            {hover !== null && series[0] && (
                <div
                    className="chart__tip"
                    style={{
                        left: `${(x(hover) / WIDTH) * 100}%`,
                        top: `${(y(Math.max(...series.map((s) => s.points[hover].count))) / height) * 100}%`
                    }}>
                    <div className="chart__tip-date">{dayLabel(series[0].points[hover].date)}</div>
                    {series.map((s) => (
                        <div key={s.name}>
                            <span style={{ color: s.color }}>●</span> {s.name}: {formatNumber(s.points[hover].count)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
