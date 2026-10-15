import { LOW_STOCK_THRESHOLD } from "@/lib/config";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";

const FULL_SCALE = 100; // shkala 100 donada to'ladi

export function StockLevel({ stock }: { stock: number }) {
    const level = stock === 0 ? "danger" : stock <= LOW_STOCK_THRESHOLD ? "warning" : "success";
    return (
        <div className="stock">
            <b className={cx(level !== "success" && `text-${level}`)}>{formatNumber(stock)}</b>
            <div className="bar bar--sm">
                <div className={`bar__fill bar__fill--${level}`} style={{ width: `${Math.min(100, (stock / FULL_SCALE) * 100)}%` }} />
            </div>
        </div>
    );
}
