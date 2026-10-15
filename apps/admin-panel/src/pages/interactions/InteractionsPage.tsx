import { useState } from "react";
import { SeverityBadge } from "@/components/badges";
import { Alert, Button, Card, ConfirmDialog, DataTable, EmptyState, ListHeader, Pagination, SearchInput, Segmented, Toolbar, type Column } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDebounced } from "@/hooks/useDebounced";
import { useListQuery } from "@/hooks/useListQuery";
import { PAGE_SIZE } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { SEVERITY_LABEL } from "@/lib/labels";
import { interactionsService } from "@/services";
import { SEVERITIES, type Interaction, type Severity } from "@/types";
import { DrugPair } from "./components/DrugPair";
import { InteractionFormModal } from "./components/InteractionFormModal";

const SEVERITY_OPTIONS = [{ value: "" as const, label: "Barchasi" }, ...SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABEL[s] }))];

type Dialog = { kind: "create" } | { kind: "edit" | "delete"; interaction: Interaction } | null;

export default function InteractionsPage() {
    const toast = useToast();
    const [search, setSearch] = useState("");
    const query = useDebounced(search);
    const { filters, set, page, setPage } = useListQuery({ severity: "" as Severity | "" });
    const [dialog, setDialog] = useState<Dialog>(null);

    const list = useAsync(() => interactionsService.list({ search: query, severity: filters.severity, page, limit: PAGE_SIZE }), [query, filters, page]);

    const columns: Column<Interaction>[] = [
        { key: "pair", header: "Dorilar juftligi", render: (it) => <DrugPair a={it.drugA} b={it.drugB} severity={it.severity} /> },
        { key: "severity", header: "Daraja", render: (it) => <SeverityBadge severity={it.severity} /> },
        { key: "description", header: "Izoh", className: "cell-wide text-muted", render: (it) => it.description ?? "—" },
        { key: "updated", header: "Yangilangan", render: (it) => <span className="text-muted">{formatDate(it.updatedAt)}</span> },
        {
            key: "actions",
            header: "Amallar",
            interactive: true,
            width: 100,
            render: (it) => (
                <div className="row-actions">
                    <Button size="sm" variant="ghost" icon="edit" aria-label="Tahrirlash" onClick={() => setDialog({ kind: "edit", interaction: it })} />
                    <Button size="sm" variant="ghost" className="btn--danger" icon="trash" aria-label="O'chirish" onClick={() => setDialog({ kind: "delete", interaction: it })} />
                </div>
            )
        }
    ];

    return (
        <>
            <Card flush>
                <ListHeader
                    title="O'zaro ta'sirlar"
                    total={list.data?.total}
                    actions={
                        <Button variant="primary" icon="plus" onClick={() => setDialog({ kind: "create" })}>
                            Juftlik qo'shish
                        </Button>
                    }
                />
                <Toolbar>
                    <SearchInput
                        value={search}
                        onChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        placeholder="Dori nomi bo'yicha qidirish"
                    />
                    <Segmented value={filters.severity} onChange={set("severity")} options={SEVERITY_OPTIONS} label="Daraja" />
                </Toolbar>

                {list.error && (
                    <div className="card__section">
                        <Alert onRetry={list.reload}>{list.error}</Alert>
                    </div>
                )}

                <DataTable columns={columns} rows={list.data?.items ?? null} loading={list.loading} rowKey={(it) => it.id} />

                {list.data?.items.length === 0 && <EmptyState icon="zap" title="Yozuvlar yo'q" text="Xavfli dori juftliklarini qo'shing — bemorlar ilovada ogohlantiriladi" />}
                {list.data && list.data.total > 0 && <Pagination page={page} limit={list.data.limit} total={list.data.total} onPage={setPage} />}
            </Card>

            {dialog?.kind === "create" && <InteractionFormModal onClose={() => setDialog(null)} onSaved={list.reload} />}
            {dialog?.kind === "edit" && <InteractionFormModal interaction={dialog.interaction} onClose={() => setDialog(null)} onSaved={list.reload} />}
            {dialog?.kind === "delete" && (
                <ConfirmDialog
                    title="Yozuvni o'chirish"
                    message={`${dialog.interaction.drugA.name} + ${dialog.interaction.drugB.name} juftligi bazadan butunlay o'chiriladi.`}
                    confirmLabel="O'chirish"
                    danger
                    onClose={() => setDialog(null)}
                    onConfirm={async () => {
                        await interactionsService.remove(dialog.interaction.id);
                        toast.success("Yozuv o'chirildi");
                        list.reload();
                    }}
                />
            )}
        </>
    );
}
