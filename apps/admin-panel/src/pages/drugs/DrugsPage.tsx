import { useState } from "react";
import { ActiveBadge } from "@/components/badges";
import { Alert, Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ListHeader, Pagination, SearchInput, Segmented, Select, Switch, Toolbar, type Column } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDebounced } from "@/hooks/useDebounced";
import { useListQuery } from "@/hooks/useListQuery";
import { LOW_STOCK_THRESHOLD, PAGE_SIZE } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import { DOSAGE_FORM_LABEL } from "@/lib/labels";
import { drugsService } from "@/services";
import { DOSAGE_FORMS, type DosageForm, type Drug, type DrugListQuery } from "@/types";
import { DrugCell } from "./components/DrugCell";
import { DrugFormModal } from "./components/DrugFormModal";
import { DrugRowActions } from "./components/DrugRowActions";
import { StockLevel } from "./components/StockLevel";
import { StockModal } from "./components/StockModal";

const SORTS = {
    "name:asc": "Nomi (A–Z)",
    "price:asc": "Arzonroq",
    "price:desc": "Qimmatroq",
    "stock:asc": "Qoldiq kam",
    "updatedAt:desc": "Yaqinda yangilangan"
} as const;
type SortKey = keyof typeof SORTS;

const ACTIVE_OPTIONS = [
    { value: "true" as const, label: "Sotuvda" },
    { value: "false" as const, label: "Arxiv" },
    { value: "" as const, label: "Barchasi" }
];

type Dialog = { kind: "create" } | { kind: "edit" | "stock" | "archive"; drug: Drug } | null;

export default function DrugsPage() {
    const toast = useToast();
    const [search, setSearch] = useState("");
    const query = useDebounced(search);
    const { filters, set, page, setPage } = useListQuery({
        isActive: "true" as NonNullable<DrugListQuery["isActive"]>,
        dosageForm: "" as DosageForm | "",
        lowOnly: false,
        sort: "name:asc" as SortKey
    });
    const [dialog, setDialog] = useState<Dialog>(null);

    const [sortBy, order] = filters.sort.split(":") as [DrugListQuery["sortBy"], DrugListQuery["order"]];
    const list = useAsync(
        () =>
            drugsService.list({
                search: query,
                isActive: filters.isActive,
                dosageForm: filters.dosageForm,
                maxStock: filters.lowOnly ? LOW_STOCK_THRESHOLD : undefined,
                sortBy,
                order,
                page,
                limit: PAGE_SIZE
            }),
        [query, filters, page]
    );

    const restore = async (drug: Drug) => {
        try {
            await drugsService.restore(drug.id);
            toast.success(`${drug.name} sotuvga qaytarildi`);
            list.reload();
        } catch (e) {
            toast.error(e);
        }
    };

    const columns: Column<Drug>[] = [
        { key: "drug", header: "Dori", render: (d) => <DrugCell drug={d} /> },
        {
            key: "form",
            header: "Shakli",
            render: (d) => (
                <div className="chips">
                    <Badge>{DOSAGE_FORM_LABEL[d.dosageForm]}</Badge>
                    {d.requiresPrescription && <Badge tone="violet">Rx</Badge>}
                </div>
            )
        },
        { key: "price", header: "Narx", align: "right", render: (d) => <b>{formatMoney(d.price)}</b> },
        { key: "stock", header: "Qoldiq", align: "right", render: (d) => <StockLevel stock={d.stock} /> },
        { key: "status", header: "Holat", render: (d) => <ActiveBadge active={d.isActive} activeLabel="Sotuvda" inactiveLabel="Arxivda" /> },
        {
            key: "actions",
            header: "Amallar",
            interactive: true,
            width: 132,
            render: (d) => (
                <DrugRowActions
                    drug={d}
                    onStock={() => setDialog({ kind: "stock", drug: d })}
                    onEdit={() => setDialog({ kind: "edit", drug: d })}
                    onArchive={() => setDialog({ kind: "archive", drug: d })}
                    onRestore={() => void restore(d)}
                />
            )
        }
    ];

    return (
        <>
            <Card flush>
                <ListHeader
                    title="Dorilar"
                    total={list.data?.total}
                    actions={
                        <Button variant="primary" icon="plus" onClick={() => setDialog({ kind: "create" })}>
                            Dori qo'shish
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
                        placeholder="Nomi, ishlab chiqaruvchi yoki shtrix-kod"
                    />
                    <Segmented value={filters.isActive} onChange={set("isActive")} options={ACTIVE_OPTIONS} label="Mavjudlik" />
                    <Select value={filters.dosageForm} onChange={(e) => set("dosageForm")(e.target.value as DosageForm | "")} aria-label="Shakli">
                        <option value="">Barcha shakllar</option>
                        {DOSAGE_FORMS.map((f) => (
                            <option key={f} value={f}>
                                {DOSAGE_FORM_LABEL[f]}
                            </option>
                        ))}
                    </Select>
                    <Select value={filters.sort} onChange={(e) => set("sort")(e.target.value as SortKey)} aria-label="Saralash">
                        {Object.entries(SORTS).map(([k, label]) => (
                            <option key={k} value={k}>
                                {label}
                            </option>
                        ))}
                    </Select>
                    <Switch label="Kam qolganlar" checked={filters.lowOnly} onChange={set("lowOnly")} />
                </Toolbar>

                {list.error && (
                    <div className="card__section">
                        <Alert onRetry={list.reload}>{list.error}</Alert>
                    </div>
                )}

                <DataTable columns={columns} rows={list.data?.items ?? null} loading={list.loading} rowKey={(d) => d.id} rowClassName={(d) => (d.isActive ? undefined : "is-muted")} />

                {list.data?.items.length === 0 && <EmptyState icon="pill" title="Dorilar topilmadi" text="Filtrlarni o'zgartiring yoki yangi dori qo'shing" />}
                {list.data && list.data.total > 0 && <Pagination page={page} limit={list.data.limit} total={list.data.total} onPage={setPage} />}
            </Card>

            {dialog?.kind === "create" && <DrugFormModal onClose={() => setDialog(null)} onSaved={list.reload} />}
            {dialog?.kind === "edit" && <DrugFormModal drug={dialog.drug} onClose={() => setDialog(null)} onSaved={list.reload} />}
            {dialog?.kind === "stock" && <StockModal drug={dialog.drug} onClose={() => setDialog(null)} onSaved={list.reload} />}
            {dialog?.kind === "archive" && (
                <ConfirmDialog
                    title="Dorini arxivlash"
                    message={`"${dialog.drug.name}" katalogdan olib tashlanadi. Keyinroq "Arxiv" bo'limidan qaytarish mumkin.`}
                    confirmLabel="Arxivlash"
                    danger
                    onClose={() => setDialog(null)}
                    onConfirm={async () => {
                        await drugsService.archive(dialog.drug.id);
                        toast.success("Dori arxivlandi");
                        list.reload();
                    }}
                />
            )}
        </>
    );
}
