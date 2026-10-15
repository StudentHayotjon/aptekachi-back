import { useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { cx } from "@/lib/cx";

interface Props {
    previewUrl: string | null;
    scanning: boolean;
    onFile: (file: File) => void;
}

/** Rasmni sudrab tashlash yoki bosib tanlash maydoni; tahlil paytida "skaner" animatsiyasi */
export function ImageDropzone({ previewUrl, scanning, onFile }: Props) {
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const open = () => !scanning && input.current?.click();

    return (
        <>
            <div
                className={cx("dropzone", dragging && "is-dragging")}
                role="button"
                tabIndex={0}
                aria-label="Retsept rasmini tanlash"
                onClick={open}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) onFile(file);
                }}>
                {previewUrl ? (
                    <img src={previewUrl} alt="Tanlangan retsept" className="dropzone__preview" />
                ) : (
                    <div className="dropzone__placeholder">
                        <div className="icon-chip icon-chip--xl">
                            <Icon name="upload" size={26} />
                        </div>
                        <strong>Rasmni shu yerga tashlang</strong>
                        <span className="text-muted">yoki tanlash uchun bosing · JPEG, PNG, WEBP · 10MB gacha</span>
                    </div>
                )}
                {scanning && <div className="dropzone__scan" />}
            </div>
            <input
                ref={input}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFile(file);
                    e.target.value = ""; // bir xil faylni qayta tanlash mumkin bo'lishi uchun
                }}
            />
        </>
    );
}
