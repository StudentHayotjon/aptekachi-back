import type { ReactNode } from "react";
import type { Tone } from "@/lib/labels";

export function Badge({ tone = "neutral", dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
    return (
        <span className={`badge badge--${tone}`}>
            {dot && <span className="badge__dot" />}
            {children}
        </span>
    );
}
