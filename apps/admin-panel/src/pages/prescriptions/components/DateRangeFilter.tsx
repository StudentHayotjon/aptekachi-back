import { Input } from "@/components/ui";

interface Props {
    from: string;
    to: string;
    onFrom: (v: string) => void;
    onTo: (v: string) => void;
}

export function DateRangeFilter({ from, to, onFrom, onTo }: Props) {
    return (
        <div className="date-range">
            <Input type="date" value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} aria-label="Boshlanish sanasi" />
            <span className="text-muted">—</span>
            <Input type="date" value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} aria-label="Tugash sanasi" />
        </div>
    );
}
