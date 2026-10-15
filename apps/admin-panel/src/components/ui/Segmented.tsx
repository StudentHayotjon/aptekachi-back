import { cx } from "@/lib/cx";

export interface SegmentOption<T extends string> {
    value: T;
    label: string;
}

/** Bir nechta variantdan bittasini tanlash (filtr tablari) */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: SegmentOption<T>[]; onChange: (v: T) => void; label?: string }) {
    return (
        <div className="segmented" role="tablist" aria-label={label}>
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    role="tab"
                    aria-selected={value === o.value}
                    className={cx("segmented__item", value === o.value && "is-active")}
                    onClick={() => onChange(o.value)}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}
