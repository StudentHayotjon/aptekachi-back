import { useState } from "react";
import { useApp } from "@/app/AppContext";
import { RoleBadge, UserStatusBadge } from "@/components/badges";
import { Alert, Badge, Button, Card, DataTable, EmptyState, ListHeader, Pagination, SearchInput, Segmented, Select, Toolbar, UserCell, type Column } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useDebounced } from "@/hooks/useDebounced";
import { useListQuery } from "@/hooks/useListQuery";
import { PAGE_SIZE } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";
import { usersService } from "@/services";
import { ROLES, type AdminUser, type UserListQuery } from "@/types";
import { UserDrawer } from "./components/UserDrawer";
import { UserFormModal } from "./components/UserFormModal";
import { UserRowActions } from "./components/UserRowActions";
import { useUserActions } from "./components/useUserActions";

const SORTS = {
    "createdAt:desc": "Avval yangilari",
    "createdAt:asc": "Avval eskilari",
    "fullName:asc": "Ism (A–Z)"
} as const;
type SortKey = keyof typeof SORTS;

const ROLE_OPTIONS = [{ value: "" as const, label: "Barcha rollar" }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))];
const STATUS_OPTIONS = [
    { value: "" as const, label: "Har qanday holat" },
    { value: "true" as const, label: "Faol" },
    { value: "false" as const, label: "Bloklangan" }
];

export default function UsersPage() {
    const { session } = useApp();
    const [search, setSearch] = useState("");
    const query = useDebounced(search);
    const { filters, set, page, setPage } = useListQuery({
        role: "" as NonNullable<UserListQuery["role"]>,
        isActive: "" as NonNullable<UserListQuery["isActive"]>,
        sort: "createdAt:desc" as SortKey
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const [sortBy, order] = filters.sort.split(":") as [UserListQuery["sortBy"], UserListQuery["order"]];
    const list = useAsync(
        () => usersService.list({ search: query, role: filters.role, isActive: filters.isActive, sortBy, order, page, limit: PAGE_SIZE }),
        [query, filters, page]
    );
    const actions = useUserActions({ onChanged: list.reload });

    const columns: Column<AdminUser>[] = [
        {
            key: "user",
            header: "Foydalanuvchi",
            render: (u) => <UserCell name={u.fullName} sub={u.phone} extra={u.id === session.user.id && <Badge>Siz</Badge>} />
        },
        { key: "role", header: "Rol", render: (u) => <RoleBadge role={u.role} /> },
        { key: "status", header: "Holat", render: (u) => <UserStatusBadge user={u} /> },
        { key: "created", header: "Ro'yxatdan o'tgan", render: (u) => <span className="text-muted">{formatDate(u.createdAt)}</span> },
        {
            key: "actions",
            header: "Amallar",
            interactive: true,
            width: 132,
            render: (u) => <UserRowActions user={u} isSelf={u.id === session.user.id} onAction={(a) => actions.run(a, u)} />
        }
    ];

    return (
        <>
            <Card flush>
                <ListHeader
                    title="Foydalanuvchilar"
                    total={list.data?.total}
                    actions={
                        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
                            Yangi foydalanuvchi
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
                        placeholder="Ism yoki telefon bo'yicha qidirish"
                    />
                    <Segmented value={filters.role} onChange={set("role")} options={ROLE_OPTIONS} label="Rol" />
                    <Segmented value={filters.isActive} onChange={set("isActive")} options={STATUS_OPTIONS} label="Holat" />
                    <Select value={filters.sort} onChange={(e) => set("sort")(e.target.value as SortKey)} aria-label="Saralash">
                        {Object.entries(SORTS).map(([k, label]) => (
                            <option key={k} value={k}>
                                {label}
                            </option>
                        ))}
                    </Select>
                </Toolbar>

                {list.error && (
                    <div className="card__section">
                        <Alert onRetry={list.reload}>{list.error}</Alert>
                    </div>
                )}

                <DataTable
                    columns={columns}
                    rows={list.data?.items ?? null}
                    loading={list.loading}
                    rowKey={(u) => u.id}
                    onRowClick={(u) => setSelectedId(u.id)}
                    rowClassName={(u) => (u.isActive && !u.blockedUntil ? undefined : "is-flagged")}
                />

                {list.data?.items.length === 0 && <EmptyState icon="users" title="Foydalanuvchi topilmadi" text="Filtrlarni o'zgartirib ko'ring" />}
                {list.data && list.data.total > 0 && <Pagination page={page} limit={list.data.limit} total={list.data.total} onPage={setPage} />}
            </Card>

            {actions.dialogs}
            {selectedId && <UserDrawer userId={selectedId} currentUserId={session.user.id} onClose={() => setSelectedId(null)} onChanged={list.reload} />}
            {creating && <UserFormModal onClose={() => setCreating(false)} onSaved={list.reload} />}
        </>
    );
}
