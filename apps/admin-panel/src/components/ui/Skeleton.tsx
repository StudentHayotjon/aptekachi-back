export function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: number | string }) {
    return <div className="skeleton" style={{ height, width }} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <tbody>
            {Array.from({ length: rows }, (_, r) => (
                <tr key={r}>
                    {Array.from({ length: cols }, (_, c) => (
                        <td key={c}>
                            <Skeleton height={14} width={c === 0 ? "70%" : "50%"} />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}
