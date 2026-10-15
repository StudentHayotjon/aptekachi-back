import { Field } from "@/components/ui";
import { cx } from "@/lib/cx";
import { SEVERITY_HINT, SEVERITY_LABEL } from "@/lib/labels";
import { SEVERITIES, type Severity } from "@/types";

export function SeverityPicker({ value, onChange, error }: { value: Severity; onChange: (s: Severity) => void; error?: string }) {
    return (
        <Field label="Xavf darajasi" error={error}>
            <div className="severity-picker" role="radiogroup">
                {SEVERITIES.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={value === s} className={cx("severity-picker__option", `severity-picker__option--${s}`, value === s && "is-active")} onClick={() => onChange(s)}>
                        <span className={`severity-dot severity-dot--${s}`} />
                        {SEVERITY_LABEL[s]}
                        <span className="text-muted text-xs">{SEVERITY_HINT[s]}</span>
                    </button>
                ))}
            </div>
        </Field>
    );
}
