import { Icon } from "@/components/icons/Icon";
import type { Drug } from "@/types";

export function DrugCell({ drug }: { drug: Drug }) {
    return (
        <div className="cell-user">
            <div className="icon-chip icon-chip--sm">
                <Icon name="pill" size={17} />
            </div>
            <div>
                <div className="cell-user__name">
                    {drug.name} {drug.dosage && <span className="text-muted">{drug.dosage}</span>}
                </div>
                <div className="cell-user__sub">
                    {drug.manufacturer}
                    {drug.internationalName && ` · ${drug.internationalName}`}
                </div>
            </div>
        </div>
    );
}
