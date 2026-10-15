import type { ReactNode } from "react";
import { useEscape } from "@/hooks/useEscape";
import { Button } from "./Button";

export function Drawer({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
    useEscape(onClose);
    return (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside className="drawer" role="dialog" aria-modal="true">
                <header className="drawer__head">
                    <h2>{title}</h2>
                    <Button variant="ghost" icon="x" aria-label="Yopish" onClick={onClose} />
                </header>
                <div className="drawer__body">{children}</div>
            </aside>
        </div>
    );
}
