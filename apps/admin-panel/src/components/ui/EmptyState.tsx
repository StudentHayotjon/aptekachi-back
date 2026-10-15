import { Icon, type IconName } from "@/components/icons/Icon";

export function EmptyState({ icon = "search", title, text }: { icon?: IconName; title: string; text?: string }) {
    return (
        <div className="empty">
            <div className="icon-chip icon-chip--lg">
                <Icon name={icon} size={22} />
            </div>
            <strong className="empty__title">{title}</strong>
            {text && <span>{text}</span>}
        </div>
    );
}
