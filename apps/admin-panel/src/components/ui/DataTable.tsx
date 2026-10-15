import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { TableSkeleton } from "./Skeleton";

export interface Column<T> {
    key: string;
    header: ReactNode;
    render: (row: T) => ReactNode;
    align?: "left" | "right";
    className?: string;
    /** Tugmalar ustuni: bu katakdagi bosish qator bosilishi (onRowClick) sifatida hisoblanmaydi */
    interactive?: boolean;
    width?: number | string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    rows: T[] | null;
    loading: boolean;
    rowKey: (row: T) => string;
    onRowClick?: (row: T) => void;
    rowClassName?: (row: T) => string | undefined;
}

/** Ustunlar konfiguratsiyasi asosidagi jadval; birinchi yuklanishda skeleton ko'rsatadi */
export function DataTable<T>({ columns, rows, loading, rowKey, onRowClick, rowClassName }: DataTableProps<T>) {
    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((c) => (
                            <th key={c.key} className={cx(c.align === "right" && "is-num", c.interactive && "is-actions")} style={c.width ? { width: c.width } : undefined}>
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                {loading && !rows ? (
                    <TableSkeleton cols={columns.length} />
                ) : (
                    <tbody>
                        {rows?.map((row) => (
                            <tr
                                key={rowKey(row)}
                                className={cx(onRowClick && "is-clickable", rowClassName?.(row))}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                tabIndex={onRowClick ? 0 : undefined}
                                onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(row) : undefined}>
                                {columns.map((c) => (
                                    <td
                                        key={c.key}
                                        className={cx(c.align === "right" && "is-num", c.interactive && "is-actions", c.className)}
                                        onClick={c.interactive ? (e) => e.stopPropagation() : undefined}
                                        onKeyDown={c.interactive ? (e) => e.stopPropagation() : undefined}>
                                        {c.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                )}
            </table>
        </div>
    );
}
