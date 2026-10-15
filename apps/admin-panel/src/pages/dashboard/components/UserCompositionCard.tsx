import { useApp } from "@/app/AppContext";
import { Button, Card } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { CHART_COLORS as C, ROLE_LABEL } from "@/lib/labels";
import { ROLES, type Stats } from "@/types";

const COLOR = { BEMOR: C.brand, SHIFOKOR: C.violet, ADMINISTRATOR: C.warning } as const;

export function UserCompositionCard({ stats }: { stats: Stats }) {
    const { navigate } = useApp();
    const u = stats.users;
    return (
        <Card title="Foydalanuvchilar tarkibi" actions={<Button size="sm" variant="ghost" onClick={() => navigate("users")}>Barchasi</Button>}>
            <div className="legend-list legend-list--spaced">
                {ROLES.map((role) => (
                    <div key={role} className="stack stack--tight">
                        <div className="legend-list__row">
                            {ROLE_LABEL[role]}
                            <b>{formatNumber(u.byRole[role])}</b>
                        </div>
                        <div className="bar">
                            <div className="bar__fill" style={{ width: `${u.total ? (u.byRole[role] / u.total) * 100 : 0}%`, background: COLOR[role] }} />
                        </div>
                    </div>
                ))}
                <div className="legend-list__row legend-list__row--total">
                    Bloklangan hisoblar
                    <b className={u.blocked ? "text-danger" : undefined}>{formatNumber(u.blocked)}</b>
                </div>
            </div>
        </Card>
    );
}
