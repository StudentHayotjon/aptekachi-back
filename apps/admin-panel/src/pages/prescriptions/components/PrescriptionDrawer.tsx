import { StatusBadge } from "@/components/badges";
import { Badge, Drawer } from "@/components/ui";
import { fileUrl } from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { SOURCE_LABEL } from "@/lib/labels";
import type { Prescription } from "@/types";
import { PrescriptionItemCard } from "./PrescriptionItemCard";

export function PrescriptionDrawer({ prescription: p, onClose }: { prescription: Prescription; onClose: () => void }) {
    const image = fileUrl(p.imageUrl);
    return (
        <Drawer title="Retsept tafsilotlari" onClose={onClose}>
            <div className="card stack">
                <div className="chips">
                    <StatusBadge status={p.status} />
                    <Badge tone="brand">{SOURCE_LABEL[p.source]}</Badge>
                    <Badge>{p.items.length} ta dori</Badge>
                </div>
                <dl className="kv">
                    <dt>Bemor</dt>
                    <dd>
                        {p.patient.fullName}
                        <div className="text-muted">{p.patient.phone}</div>
                    </dd>
                    <dt>Shifokor</dt>
                    <dd>{p.doctor ? p.doctor.fullName : <span className="text-muted">Biriktirilmagan</span>}</dd>
                    <dt>Yuklangan</dt>
                    <dd>{formatDateTime(p.createdAt)}</dd>
                    <dt>Ko'rib chiqilgan</dt>
                    <dd>{formatDateTime(p.reviewedAt)}</dd>
                    {p.rejectReason && (
                        <>
                            <dt>Rad etish sababi</dt>
                            <dd className="text-danger">{p.rejectReason}</dd>
                        </>
                    )}
                    {p.dmedUuid && (
                        <>
                            <dt>DMED UUID</dt>
                            <dd className="mono">{p.dmedUuid}</dd>
                        </>
                    )}
                </dl>
            </div>

            {image && (
                <>
                    <h4 className="section-title">Retsept rasmi</h4>
                    <a href={image} target="_blank" rel="noreferrer">
                        <img className="img-thumb" src={image} alt="Retsept rasmi" />
                    </a>
                </>
            )}

            <h4 className="section-title">Dorilar</h4>
            {p.items.map((item, i) => (
                <PrescriptionItemCard key={item.id} item={item} index={i} />
            ))}
        </Drawer>
    );
}
