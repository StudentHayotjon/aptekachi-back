import type { PageQuery } from "./common.types";
import type { DrugSummary } from "./drug.types";

export const SEVERITIES = ["GREEN", "YELLOW", "RED"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface Interaction {
    id: string;
    drugAId: string;
    drugBId: string;
    severity: Severity;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    drugA: DrugSummary;
    drugB: DrugSummary;
}

export interface InteractionListQuery extends PageQuery {
    search?: string;
    severity?: Severity | "";
    drugId?: string;
}

export interface CreateInteractionPayload {
    drugAId: string;
    drugBId: string;
    severity: Severity;
    description?: string;
}

export interface UpdateInteractionPayload {
    severity?: Severity;
    description?: string | null;
}
