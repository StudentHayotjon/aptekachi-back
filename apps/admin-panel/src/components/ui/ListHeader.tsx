import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

/** Ro'yxat kartasi sarlavhasi: nom + jami soni chapda, asosiy amal (masalan "Qo'shish") o'ngda */
export function ListHeader({ title, total, actions }: { title: string; total?: number; actions?: ReactNode }) {
    return (
        <div className="list-header">
            <h2 className="list-header__title">
                {title}
                {total !== undefined && <span className="list-header__count">{formatNumber(total)}</span>}
            </h2>
            {actions && <div className="list-header__actions">{actions}</div>}
        </div>
    );
}
