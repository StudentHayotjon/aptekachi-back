import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { Button } from "./Button";

export function Alert({ tone = "danger", icon, children, onRetry }: { tone?: "danger" | "info"; icon?: IconName; children: ReactNode; onRetry?: () => void }) {
    return (
        <div className={`alert alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
            <Icon name={icon ?? (tone === "danger" ? "alert" : "check")} />
            <div className="alert__body">{children}</div>
            {onRetry && (
                <Button size="sm" icon="refresh" onClick={onRetry}>
                    Qayta urinish
                </Button>
            )}
        </div>
    );
}
