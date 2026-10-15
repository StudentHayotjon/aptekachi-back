import { useEffect, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";
import { errorMessage, formatBytes } from "@/lib/format";
import { ocrFileSchema } from "@/schemas/ocr.schema";
import { ocrService } from "@/services";
import type { OcrResult } from "@/types";
import { ImageDropzone } from "./components/ImageDropzone";
import { OcrResultPanel } from "./components/OcrResultPanel";

export default function OcrLabPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<OcrResult | null>(null);

    // Eski preview URL xotiradan bo'shatiladi
    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const pick = (candidate: File) => {
        const parsed = ocrFileSchema.safeParse(candidate);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Fayl yaroqsiz");
            return;
        }
        setError("");
        setResult(null);
        setFile(parsed.data);
        setPreviewUrl(URL.createObjectURL(parsed.data));
    };

    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError("");
    };

    const analyze = async () => {
        if (!file) return;
        setScanning(true);
        setError("");
        try {
            setResult(await ocrService.analyze(file));
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="grid grid--halves grid--top">
            <Card
                title="Retsept rasmi"
                hint="Rasm saqlanmaydi — faqat tanib olish sifatini tekshirish uchun"
                actions={
                    file && (
                        <Button size="sm" variant="ghost" icon="x" onClick={reset}>
                            Tozalash
                        </Button>
                    )
                }>
                <ImageDropzone previewUrl={previewUrl} scanning={scanning} onFile={pick} />
                <div className="ocr-actions">
                    <Button variant="primary" icon="sparkles" className="btn--lg ocr-actions__main" disabled={!file} loading={scanning} onClick={analyze}>
                        {scanning ? "Tanib olinmoqda…" : "Tahlil qilish"}
                    </Button>
                    {file && <span className="text-muted">{formatBytes(file.size)}</span>}
                </div>
                {error && <Alert>{error}</Alert>}
            </Card>

            <OcrResultPanel result={result} />
        </div>
    );
}
