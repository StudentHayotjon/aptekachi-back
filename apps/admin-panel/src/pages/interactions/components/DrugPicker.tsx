import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Field } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useDebounced } from "@/hooks/useDebounced";
import { drugsService } from "@/services";
import type { DrugSummary } from "@/types";

const MIN_QUERY = 2;

interface Props {
    label: string;
    value: DrugSummary | null;
    onChange: (drug: DrugSummary | null) => void;
    error?: string;
    excludeId?: string;
}

/** Faol dorilar ichidan nom bo'yicha qidirib tanlash (combobox) */
export function DrugPicker({ label, value, onChange, error, excludeId }: Props) {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const query = useDebounced(text.trim(), 250);
    const results = useAsync(() => (query.length >= MIN_QUERY ? drugsService.list({ search: query, isActive: "true", limit: 8 }) : Promise.resolve(null)), [query]);
    const options = results.data?.items.filter((d) => d.id !== excludeId) ?? [];

    if (value) {
        return (
            <Field label={label} error={error}>
                <div className="input picked">
                    <Icon name="pill" size={16} />
                    <b className="truncate">{value.name}</b>
                    <button type="button" className="picked__clear" aria-label="Tanlovni bekor qilish" onClick={() => onChange(null)}>
                        <Icon name="x" size={14} />
                    </button>
                </div>
            </Field>
        );
    }

    return (
        <Field label={label} error={error}>
            <div className="combo">
                <div className="input-icon">
                    <Icon name="search" size={16} />
                    <input
                        className="input"
                        role="combobox"
                        aria-expanded={open}
                        value={text}
                        placeholder={`Kamida ${MIN_QUERY} harf yozing`}
                        onFocus={() => setOpen(true)}
                        onBlur={() => setTimeout(() => setOpen(false), 150)}
                        onChange={(e) => {
                            setText(e.target.value);
                            setOpen(true);
                        }}
                    />
                </div>
                {open && query.length >= MIN_QUERY && (
                    <div className="combo__list" role="listbox">
                        {results.loading && <div className="combo__note">Qidirilmoqda…</div>}
                        {!results.loading && options.length === 0 && <div className="combo__note">Topilmadi</div>}
                        {options.map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                role="option"
                                className="combo__item"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange({ id: d.id, name: d.name, internationalName: d.internationalName });
                                    setText("");
                                }}>
                                <b>{d.name}</b> {d.dosage && <span className="text-muted">{d.dosage}</span>}
                                <div className="text-muted text-sm">{d.internationalName ?? d.manufacturer}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Field>
    );
}
