import type { ReactNode } from "react";

export function StatTile({ value, label, tone }: { value: ReactNode; label: string; tone?: "success" | "warning" | "danger" }) {
    return (
        <div className="stat-tile">
            <div className={`stat-tile__value ${tone ? `text-${tone}` : ""}`}>{value}</div>
            <div className="stat-tile__label">{label}</div>
        </div>
    );
}

export function StatTiles({ children }: { children: ReactNode }) {
    return <div className="stat-tiles">{children}</div>;
}
