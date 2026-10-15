import type { ReactNode } from "react";
import { Sparkline } from "@/components/charts";
import { Icon, type IconName } from "@/components/icons/Icon";

interface KpiCardProps {
    icon: IconName;
    tone?: "brand" | "success" | "warning" | "violet";
    label: string;
    value: string;
    footer: ReactNode;
    trend?: number[];
    trendColor?: string;
}

export function KpiCard({ icon, tone = "brand", label, value, footer, trend, trendColor }: KpiCardProps) {
    return (
        <div className="card kpi">
            <div className={`icon-chip icon-chip--${tone}`}>
                <Icon name={icon} size={20} />
            </div>
            <div className="kpi__label">{label}</div>
            <div className="kpi__value">{value}</div>
            <div className="kpi__footer">{footer}</div>
            {trend && trendColor && <Sparkline className="kpi__spark" points={trend} color={trendColor} />}
        </div>
    );
}

export function KpiCardSkeleton() {
    return (
        <div className="card kpi kpi--loading">
            <div className="skeleton" style={{ width: 42, height: 42 }} />
            <div className="skeleton" style={{ width: "40%", height: 14 }} />
            <div className="skeleton" style={{ width: "60%", height: 30 }} />
        </div>
    );
}
