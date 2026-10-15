import { Icon } from "@/components/icons/Icon";
import type { DrugSummary, Severity } from "@/types";

export function DrugPair({ a, b, severity }: { a: DrugSummary; b: DrugSummary; severity?: Severity }) {
    return (
        <div className="pair">
            <span>{a.name}</span>
            <span className={`pair__link ${severity ? `pair__link--${severity}` : ""}`}>
                <Icon name={severity ? "zap" : "plus"} size={15} />
            </span>
            <span>{b.name}</span>
        </div>
    );
}
