import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

interface FieldProps {
    label: string;
    error?: string;
    hint?: string;
    full?: boolean;
    children: ReactNode;
}

/** Yorliq + input + xato matni. Ichiga Input/Select/Textarea yoki boshqa boshqaruv elementi qo'yiladi */
export function Field({ label, error, hint, full, children }: FieldProps) {
    return (
        <label className={cx("field", full && "field--full", error && "field--invalid")}>
            <span className="field__label">{label}</span>
            {children}
            {error ? (
                <span className="field__error" role="alert">
                    {error}
                </span>
            ) : (
                hint && <span className="field__hint">{hint}</span>
            )}
        </label>
    );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cx("input", className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select className={cx("input", "select", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cx("input", "textarea", className)} {...rest} />;
}

export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="switch">
            <input type="checkbox" className="switch__input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
    );
}

export function FormGrid({ children }: { children: ReactNode }) {
    return <div className="form-grid">{children}</div>;
}
