import { formatNumber } from "@/lib/format";
import { Button } from "./Button";

export function Pagination({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (p: number) => void }) {
    const pages = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(total, page * limit);
    return (
        <nav className="pagination" aria-label="Sahifalash">
            <span>
                {formatNumber(from)}–{formatNumber(to)} / {formatNumber(total)}
            </span>
            <div className="pagination__controls">
                <Button size="sm" icon="chevronLeft" aria-label="Oldingi sahifa" disabled={page <= 1} onClick={() => onPage(page - 1)} />
                <span className="pagination__page">
                    {page} / {pages}
                </span>
                <Button size="sm" icon="chevronRight" aria-label="Keyingi sahifa" disabled={page >= pages} onClick={() => onPage(page + 1)} />
            </div>
        </nav>
    );
}
