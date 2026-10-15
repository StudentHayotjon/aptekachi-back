import { Badge } from "@/components/ui/Badge";
import { ROLE_LABEL, ROLE_TONE, SEVERITY_LABEL, SEVERITY_TONE, STATUS_LABEL, STATUS_TONE } from "@/lib/labels";
import type { PrescriptionStatus, Role, Severity } from "@/types";

export { UserStatusBadge } from "./UserStatusBadge";

export const RoleBadge =({ role }: { role: Role }) => <Badge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Badge>;

export const StatusBadge = ({ status }: { status: PrescriptionStatus }) => (
    <Badge tone={STATUS_TONE[status]} dot>
        {STATUS_LABEL[status]}
    </Badge>
);

export const SeverityBadge = ({ severity }: { severity: Severity }) => (
    <Badge tone={SEVERITY_TONE[severity]} dot>
        {SEVERITY_LABEL[severity]}
    </Badge>
);

export const ActiveBadge = ({ active, activeLabel = "Faol", inactiveLabel = "Bloklangan" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) =>
    active ? (
        <Badge tone="success" dot>
            {activeLabel}
        </Badge>
    ) : (
        <Badge tone="danger" dot>
            {inactiveLabel}
        </Badge>
    );
