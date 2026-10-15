import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

interface CardProps {
    title?: ReactNode;
    hint?: ReactNode;
    actions?: ReactNode;
    /** Ichki padding'siz (jadvallar uchun) */
    flush?: boolean;
    className?: string;
    children: ReactNode;
}

export function Card({ title, hint, actions, flush, className, children }: CardProps) {
    return (
        <section className={cx("card", flush && "card--flush", className)}>
            {(title || actions) && (
                <header className="card__head">
                    <div>
                        {title && <h3 className="card__title">{title}</h3>}
                        {hint && <div className="card__hint">{hint}</div>}
                    </div>
                    {actions && <div className="card__actions">{actions}</div>}
                </header>
            )}
            {children}
        </section>
    );
}
