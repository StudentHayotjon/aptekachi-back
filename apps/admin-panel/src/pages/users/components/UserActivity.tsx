import { StatTile, StatTiles } from "@/components/ui";
import { formatDateTime, formatNumber, formatPercent, timeAgo } from "@/lib/format";
import type { AdminUserDetail } from "@/types";

export function UserActivity({ user }: { user: AdminUserDetail }) {
    const c = user.counts;
    const d = user.doses30d.byStatus;
    return (
        <>
            <h4 className="section-title">Faoliyat</h4>
            <StatTiles>
                <StatTile value={formatNumber(c.prescriptions)} label="Retseptlar" />
                <StatTile value={formatNumber(c.activeSchedules)} label="Faol jadvallar" />
                <StatTile value={formatPercent(user.doses30d.adherenceRate)} label="Rioya (30 kun)" />
                <StatTile value={formatNumber(c.familyMembers)} label="Oila a'zolari" />
                <StatTile value={formatNumber(c.careLinksAsViewer + c.careLinksAsSubject)} label="Kuzatuv aloqalari" />
                <StatTile value={formatNumber(c.reviewedPrescriptions)} label="Ko'rib chiqqan" />
            </StatTiles>

            <h4 className="section-title">Ma'lumotlar</h4>
            <div className="card">
                <dl className="kv">
                    <dt>Oxirgi kirish</dt>
                    <dd>{timeAgo(user.lastLoginAt)}</dd>
                    <dt>Faol sessiyalar</dt>
                    <dd>{formatNumber(user.activeSessions)}</dd>
                    <dt>Dozalar (30 kun)</dt>
                    <dd>
                        {formatNumber(d.TAKEN)} ichilgan · {formatNumber(d.SKIPPED)} o'tkazilgan · {formatNumber(d.PENDING)} belgilanmagan
                    </dd>
                    <dt>Ro'yxatdan o'tgan</dt>
                    <dd>{formatDateTime(user.createdAt)}</dd>
                    <dt>Yangilangan</dt>
                    <dd>{formatDateTime(user.updatedAt)}</dd>
                    <dt>ID</dt>
                    <dd className="mono">{user.id}</dd>
                </dl>
            </div>
        </>
    );
}
