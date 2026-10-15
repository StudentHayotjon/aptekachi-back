import type { ReactNode } from "react";
import { useEscape } from "@/hooks/useEscape";
import { cx } from "@/lib/cx";
import { Button } from "./Button";

interface ModalProps {
    title: string;
    onClose: () => void;
    footer?: ReactNode;
    size?: "sm" | "md";
    children: ReactNode;
    /** Forma submit'i (Enter tugmasi bilan ham ishlaydi) */
    onSubmit?: () => void;
}

export function Modal({ title, onClose, footer, size = "md", children, onSubmit }: ModalProps) {
    useEscape(onClose);
    const body = (
        <>
            <header className="modal__head">
                <h2>{title}</h2>
                <Button variant="ghost" icon="x" aria-label="Yopish" onClick={onClose} />
            </header>
            <div className="modal__body">{children}</div>
            {footer && <footer className="modal__foot">{footer}</footer>}
        </>
    );

    return (
        <div className="overlay overlay--center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className={cx("modal", size === "sm" && "modal--sm")} role="dialog" aria-modal="true" aria-label={title}>
                {onSubmit ? (
                    <form
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}>
                        {body}
                    </form>
                ) : (
                    body
                )}
            </div>
        </div>
    );
}
