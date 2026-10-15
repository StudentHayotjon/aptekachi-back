import { Icon, type IconName } from "@/components/icons/Icon";
import { Alert, Badge, Button, Card, Skeleton } from "@/components/ui";
import type { AsyncState } from "@/hooks/useAsync";
import { cx } from "@/lib/cx";
import { formatTime, formatUptime } from "@/lib/format";
import type { ServiceHealth, SystemHealth } from "@/types";

function HealthRow({ icon, name, meta, health }: { icon: IconName; name: string; meta: string; health: ServiceHealth }) {
    return (
        <div className="health-row">
            <div className={cx("icon-chip", "icon-chip--sm", health.ok ? "icon-chip--success" : "icon-chip--danger")}>
                <Icon name={icon} size={17} />
            </div>
            <div>
                <div className="health-row__name">{name}</div>
                <div className="health-row__meta">{health.ok ? meta : (health.message ?? "Javob bermayapti")}</div>
            </div>
            <div className="health-row__status">
                <div className="health-row__state">
                    <span className={cx("pulse", !health.ok && "pulse--down")} />
                    {health.ok ? "Ishlayapti" : "Ishlamayapti"}
                </div>
                {health.latencyMs !== null && <div className="health-row__meta">{health.latencyMs} ms</div>}
            </div>
        </div>
    );
}

export function SystemHealthCard({ health }: { health: AsyncState<SystemHealth> }) {
    const h = health.data;
    return (
        <Card
            title="Xizmatlar holati"
            hint={h ? `Tekshirildi: ${formatTime(h.checkedAt)}` : "Tekshirilmoqda…"}
            actions={<Button size="sm" variant="ghost" icon="refresh" aria-label="Qayta tekshirish" loading={health.loading} onClick={health.reload} />}>
            {health.error && <Alert>{health.error}</Alert>}
            {h ? (
                <>
                    <HealthRow icon="server" name="Core service" meta={`${h.core.node} · ${formatUptime(h.core.uptimeSec)} ishlamoqda`} health={{ ok: true, latencyMs: null }} />
                    <HealthRow icon="database" name="PostgreSQL" meta="Asosiy ma'lumotlar bazasi" health={h.database} />
                    <HealthRow icon="scan" name="OCR service" meta="Gemini asosidagi retsept tanish" health={h.ocr} />
                    <div className="chips">
                        <Badge>{h.core.env}</Badge>
                        <Badge>{h.core.timeZone}</Badge>
                    </div>
                </>
            ) : (
                !health.error && (
                    <div className="stack">
                        <Skeleton height={40} />
                        <Skeleton height={40} />
                        <Skeleton height={40} />
                    </div>
                )
            )}
        </Card>
    );
}
