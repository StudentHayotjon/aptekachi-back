import { Button } from "@/components/ui";
import type { Drug } from "@/types";

interface Props {
    drug: Drug;
    onStock: () => void;
    onEdit: () => void;
    onArchive: () => void;
    onRestore: () => void;
}

export function DrugRowActions({ drug, onStock, onEdit, onArchive, onRestore }: Props) {
    if (!drug.isActive) {
        return (
            <div className="row-actions">
                <Button size="sm" icon="restore" onClick={onRestore}>
                    Qaytarish
                </Button>
            </div>
        );
    }
    return (
        <div className="row-actions">
            <Button size="sm" variant="ghost" icon="box" aria-label="Qoldiq" title="Qoldiq" onClick={onStock} />
            <Button size="sm" variant="ghost" icon="edit" aria-label="Tahrirlash" title="Tahrirlash" onClick={onEdit} />
            <Button size="sm" variant="ghost" className="btn--danger" icon="trash" aria-label="Arxivlash" title="Arxivlash" onClick={onArchive} />
        </div>
    );
}
