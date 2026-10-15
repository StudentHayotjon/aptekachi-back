import { useState } from "react";
import { StatusBadge } from "@/components/badges";
import { Icon } from "@/components/icons/Icon";
import { Alert, Badge, Card, DataTable, EmptyState, ListHeader, Pagination, SearchInput, Segmented, Select, Toolbar, UserCell, type Column } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useDebounced } from "@/hooks/useDebounced";
import { useListQuery } from "@/hooks/useListQuery";
import { PAGE_SIZE } from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { prescriptionsService } from "@/services";
import type { Prescription, PrescriptionSource, PrescriptionStatus } from "@/types";
import { DateRangeFilter } from "./components/DateRangeFilter";
import { PrescriptionDrawer } from "./components/PrescriptionDrawer";

const STATUS_OPTIONS = [
    { value: "" as const, label: "Barchasi" },
    ...(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => ({ value: s, label: STATUS_LABEL[s] }))
];

const columns: Column<Prescription>[] = [
    { key: "patient", header: "Bemor", render: (p) => <UserCell name={p.patient.fullName} sub={p.patient.phone} /> },
    {
        key: "drugs",
        header: "Dorilar",
        className: "cell-truncate",
        render: (p) => (
            <>
                <div className="text-strong truncate">{p.items.map((i) => i.drugNameRaw).join(", ") || "—"}</div>
                <div className="text-muted text-sm">{p.items.length} ta</div>
            </>
        )
    },
    {
        key: "source",
        header: "Manba",
        render: (p) => (
            <Badge tone="brand">
                <Icon name={p.source === "OCR" ? "image" : "scan"} size={13} />
                {p.source === "OCR" ? "OCR" : "DMED"}
            </Badge>
        )
    },
    { key: "status", header: "Holat", render: (p) => <StatusBadge status={p.status} /> },
    { key: "doctor", header: "Shifokor", render: (p) => p.doctor?.fullName ?? <span className="text-muted">—</span> },
    { key: "date", header: "Sana", render: (p) => <span className="text-muted">{formatDateTime(p.createdAt)}</span> }
];

export default function PrescriptionsPage() {
    const [search, setSearch] = useState("");
    const query = useDebounced(search);
    const { filters, set, page, setPage } = useListQuery({
        status: "" as PrescriptionStatus | "",
        source: "" as PrescriptionSource | "",
        from: "",
        to: ""
    });
    const [selected, setSelected] = useState<Prescription | null>(null);

    const list = useAsync(() => prescriptionsService.list({ search: query, ...filters, page, limit: PAGE_SIZE }), [query, filters, page]);

    return (
        <>
            <Card flush>
                <ListHeader title="Retseptlar" total={list.data?.total} />
                <Toolbar>
                    <SearchInput
                        value={search}
                        onChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        placeholder="Bemor ismi yoki telefoni"
                    />
                    <Segmented value={filters.status} onChange={set("status")} options={STATUS_OPTIONS} label="Holat" />
                    <Select value={filters.source} onChange={(e) => set("source")(e.target.value as PrescriptionSource | "")} aria-label="Manba">
                        <option value="">Barcha manbalar</option>
                        <option value="OCR">OCR (rasm)</option>
                        <option value="DMED_QR">DMED QR</option>
                    </Select>
                    <DateRangeFilter from={filters.from} to={filters.to} onFrom={set("from")} onTo={set("to")} />
                </Toolbar>

                {list.error && (
                    <div className="card__section">
                        <Alert onRetry={list.reload}>{list.error}</Alert>
                    </div>
                )}

                <DataTable columns={columns} rows={list.data?.items ?? null} loading={list.loading} rowKey={(p) => p.id} onRowClick={setSelected} />

                {list.data?.items.length === 0 && <EmptyState icon="file" title="Retseptlar topilmadi" text="Filtrlarni o'zgartirib ko'ring" />}
                {list.data && list.data.total > 0 && <Pagination page={page} limit={list.data.limit} total={list.data.total} onPage={setPage} />}
            </Card>

            {selected && <PrescriptionDrawer prescription={selected} onClose={() => setSelected(null)} />}
        </>
    );
}
