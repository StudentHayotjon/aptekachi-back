import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { cx } from "@/lib/cx";
import { Spinner } from "./Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "primary" | "danger" | "danger-solid" | "ghost";
    size?: "md" | "sm";
    icon?: IconName;
    loading?: boolean;
    block?: boolean;
}

export function Button({ variant = "default", size = "md", icon, loading, block, className, children, type = "button", disabled, ...rest }: ButtonProps) {
    const iconOnly = !children;
    return (
        <button
            type={type}
            className={cx("btn", `btn--${variant}`, size === "sm" && "btn--sm", iconOnly && "btn--icon", block && "btn--block", className)}
            disabled={loading || disabled}
            {...rest}>
            {loading ? <Spinner /> : icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
            {children}
        </button>
    );
}
