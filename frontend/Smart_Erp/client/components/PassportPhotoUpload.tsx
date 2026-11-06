import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Crop, Image as ImageIcon, LoaderCircle, RotateCw, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface PassportPhotoUploadProps {
    file: File | null;
    initialPhotoUrl?: string;
    loadingPhoto?: boolean;
    studentName?: string;
    onPhotoChange: (file: File | null, previewUrl: string | null) => void;
    disabled?: boolean;
    label?: string;
    hint?: string;
}

/** Passport-photo uploader compatible with Student.tsx. Exports a 700x900 JPEG. */
export function PassportPhotoUpload({
    file, initialPhotoUrl, loadingPhoto = false, studentName = "Student", onPhotoChange,
    disabled = false, label = "Passport Size Photo", hint = "3.5 × 4.5 cm · JPEG, PNG or WebP · maximum 10 MB",
}: PassportPhotoUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [cropOpen, setCropOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);
    useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);

    const chooseFile = (selected?: File) => {
        if (!selected) return;
        if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) { toast.error("Choose a JPEG, PNG or WebP image."); return; }
        if (selected.size > 10 * 1024 * 1024) { toast.error("Photo must be 10 MB or smaller."); return; }
        const url = URL.createObjectURL(selected);
        const img = new Image();
        img.onload = () => {
            setSourceUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return url; });
            setSourceFile(selected); setImage(img); setZoom(1); setRotation(0); setCropOpen(true);
        };
        img.onerror = () => { URL.revokeObjectURL(url); toast.error("The selected image could not be opened."); };
        img.src = url;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image || !cropOpen) return;
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        const w = 280, h = 360, ratio = 7 / 9;
        canvas.width = w * 2; canvas.height = h * 2;
        ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, w, h);
        const rotated = rotation % 180 !== 0;
        const naturalW = rotated ? image.naturalHeight : image.naturalWidth;
        const naturalH = rotated ? image.naturalWidth : image.naturalHeight;
        const cropW = Math.min(w, h * ratio), cropH = cropW / ratio;
        const scale = Math.max(cropW / naturalW, cropH / naturalH) * zoom;
        ctx.save(); ctx.beginPath(); ctx.rect((w - cropW) / 2, (h - cropH) / 2, cropW, cropH); ctx.clip();
        ctx.translate(w / 2, h / 2); ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale); ctx.restore();
        ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.strokeRect((w - cropW) / 2, (h - cropH) / 2, cropW, cropH);
        ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w / 2, (h - cropH) / 2); ctx.lineTo(w / 2, (h + cropH) / 2); ctx.moveTo((w - cropW) / 2, h / 2); ctx.lineTo((w + cropW) / 2, h / 2); ctx.stroke();
    }, [image, cropOpen, zoom, rotation]);

    const applyCrop = () => {
        if (!image) return;
        setExporting(true);
        try {
            const out = document.createElement("canvas"); out.width = 700; out.height = 900;
            const ctx = out.getContext("2d"); if (!ctx) throw new Error("Canvas is not supported by this browser.");
            ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 700, 900);
            const ratio = 7 / 9; const rotated = rotation % 180 !== 0;
            const nw = rotated ? image.naturalHeight : image.naturalWidth, nh = rotated ? image.naturalWidth : image.naturalHeight;
            const scale = Math.max(700 / nw, 900 / nh) * zoom;
            ctx.translate(350, 450); ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale);
            out.toBlob((blob) => {
                setExporting(false);
                if (!blob) { toast.error("Could not export the cropped photo."); return; }
                const name = (sourceFile?.name || "student-photo").replace(/\.[^.]+$/g, "") + "-passport.jpg";
                const cropped = new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
                const url = URL.createObjectURL(blob);
                setLocalPreview((previous) => { if (previous) URL.revokeObjectURL(previous); return url; });
                onPhotoChange(cropped, url); setCropOpen(false); toast.success("Passport photo is ready.");
            }, "image/jpeg", 0.92);
        } catch (error) { setExporting(false); toast.error(error instanceof Error ? error.message : "Unable to crop photo."); }
    };

    const displayUrl = localPreview || initialPhotoUrl;
    const remove = () => { setLocalPreview((previous) => { if (previous) URL.revokeObjectURL(previous); return null; }); setSourceFile(null); setImage(null); onPhotoChange(null, null); };
    const onInput = (event: ChangeEvent<HTMLInputElement>) => { chooseFile(event.target.files?.[0]); event.target.value = ""; };
    const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragOver(false); if (!disabled) chooseFile(event.dataTransfer.files?.[0]); };

    return <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span><span className="text-[11px] font-medium text-cyan-300">Passport ratio · 3.5 × 4.5</span></div>
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`grid grid-cols-1 gap-4 rounded-2xl border p-4 sm:grid-cols-[130px_1fr] ${dragOver ? "border-cyan-300 bg-cyan-500/10" : "border-white/10 bg-slate-950/40"}`}>
            <div className="mx-auto flex h-[168px] w-[130px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-lg">
                {loadingPhoto ? <LoaderCircle className="animate-spin text-cyan-300" /> : displayUrl ? <img src={displayUrl} alt={`${studentName} passport photo`} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-slate-500"><Camera size={25} /><span className="text-xs">No photo</span></div>}
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-2">
                {displayUrl ? <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><ImageIcon size={14} /> {file ? "Cropped photo ready" : "Current photo on file"}</div> : <p className="text-sm font-semibold text-slate-200">Upload student photograph</p>}
                <p className="text-xs leading-5 text-slate-400">Choose or drop a portrait. Adjust zoom and rotation in the crop preview before it is submitted with the student record.</p>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} disabled={disabled} className="hidden" />
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"><Upload size={14} />{displayUrl ? "Change photo" : "Select & crop photo"}</button>
                    {file && image && <button type="button" onClick={() => { setZoom(1); setRotation(0); setCropOpen(true); }} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"><Crop size={14} /> Re-crop</button>}
                    {displayUrl && file && <button type="button" onClick={remove} disabled={disabled} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"><Trash2 size={14} /> Remove</button>}
                </div>
            </div>
        </div>
        {hint && <p className="text-[11px] leading-4 text-slate-500">{hint}</p>}
        <AnimatePresence>{cropOpen && image && <motion.div className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto p-3 sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close cropper" onClick={() => setCropOpen(false)} className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
            <motion.section role="dialog" aria-modal="true" aria-label="Crop student photo" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="relative flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                <header className="flex items-center justify-between border-b border-white/10 p-4"><div><h3 className="font-bold text-white">Crop passport photo</h3><p className="mt-1 text-xs text-slate-400">Adjust framing before applying.</p></div><button type="button" onClick={() => setCropOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={17} /></button></header>
                <div className="space-y-4 overflow-y-auto p-4"><div className="flex justify-center rounded-xl border border-white/10 bg-slate-950 p-3"><canvas ref={canvasRef} style={{ width: 280, height: 360, maxWidth: "100%" }} className="rounded-lg" /></div>
                    <label className="block space-y-2"><span className="text-xs font-semibold text-slate-300">Zoom · {zoom.toFixed(1)}×</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-cyan-400" /></label>
                    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setRotation(v => (v + 90) % 360)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5"><RotateCw size={14} /> Rotate 90°</button><button type="button" onClick={() => { setZoom(1); setRotation(0); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">Reset</button></div>
                </div>
                <footer className="flex justify-end gap-2 border-t border-white/10 p-4"><button type="button" onClick={() => setCropOpen(false)} disabled={exporting} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300">Cancel</button><button type="button" onClick={applyCrop} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{exporting ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Crop & use photo</button></footer>
            </motion.section>
        </motion.div>}</AnimatePresence>
    </div>;
}

export default PassportPhotoUpload;
