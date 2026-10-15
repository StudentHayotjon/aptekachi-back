import type { ReactNode } from "react";
import { Avatar } from "./Avatar";

/** Jadval katagi: avatar + ism + ikkinchi qator (telefon) */
export function UserCell({ name, sub, extra }: { name: string; sub: string; extra?: ReactNode }) {
    return (
        <div className="cell-user">
            <Avatar name={name} />
            <div>
                <div className="cell-user__name">
                    {name} {extra}
                </div>
                <div className="cell-user__sub">{sub}</div>
            </div>
        </div>
    );
}
