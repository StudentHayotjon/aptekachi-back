import { Button } from "@/components/ui/Button";

interface TopbarProps {
    title: string;
    subtitle: string;
    isDark: boolean;
    onToggleTheme: () => void;
    onOpenMenu: () => void;
}

export function Topbar({ title, subtitle, isDark, onToggleTheme, onOpenMenu }: TopbarProps) {
    return (
        <header className="topbar">
            <Button className="topbar__menu" variant="ghost" icon="menu" aria-label="Menyuni ochish" onClick={onOpenMenu} />
            <div>
                <h1 className="topbar__title">{title}</h1>
                <div className="topbar__subtitle">{subtitle}</div>
            </div>
            <div className="topbar__actions">
                <Button variant="ghost" icon={isDark ? "sun" : "moon"} aria-label={isDark ? "Yorug' mavzu" : "Qorong'i mavzu"} onClick={onToggleTheme} />
            </div>
        </header>
    );
}
