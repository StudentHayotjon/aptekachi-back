import { Icon } from "@/components/icons/Icon";

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div className="input-icon toolbar__grow">
            <Icon name="search" size={16} />
            <input className="input" type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}
