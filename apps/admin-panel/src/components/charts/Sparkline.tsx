import { useId } from "react";
import { smoothPath, type Point } from "./chart-math";

const W = 160;
const H = 56;

export function Sparkline({ points, color, className }: { points: number[]; color: string; className?: string }) {
    const id = useId();
    const max = Math.max(1, ...points);
    const line = smoothPath(points.map((v, i): Point => [points.length <= 1 ? 0 : (i / (points.length - 1)) * W, H - 4 - (v / max) * (H - 12)]));
    return (
        <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity="0.22" />
                    <stop offset="1" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}
