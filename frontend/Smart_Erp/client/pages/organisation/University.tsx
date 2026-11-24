import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownUp,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Eye,
    GraduationCap,
    Info,
    Library,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import {
    createUniversity,
    deleteUniversity,
    extractUniversityErrorMessage,
    formatAuditActor,
    getUniversities,
    updateUniversity,
    type ActiveStatus,
    type CommonDTO,
    type UniversityResponse,
} from "@/services/org/universityService";

type StatusFilter = "ALL" | ActiveStatus;
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "CODE_ASC" | "STUDENTS_DESC";
type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";

interface UniversityForm {
    name: string;
    code: string;
    activeStatus: ActiveStatus;
}

interface FieldErrors {
    name?: string;
    code?: string;
}

const EMPTY_FORM: UniversityForm = { name: "", code: "", activeStatus: "ENABLE" };
const PAGE_SIZE = 8;

function formatNumber(value: number | null | undefined): string {
    return typeof value === "number" && !isNaN(value) ? new Intl.NumberFormat("en-IN").format(value) : "0";
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(d);
    } catch {
        return "—";
    }
}

function formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return "—";
    }
}

function getInitials(name?: string): string {
    if (!name) return "UN";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "UN";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Modal Dialog Component                                                      */
/* -------------------------------------------------------------------------- */

function UniversityDialog({
    mode,
    university,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: {
    mode: DialogMode;
    university: UniversityResponse | null;
    busy: boolean;
    onClose: () => void;
    onCreate: (form: UniversityForm) => Promise<void>;
    onUpdate: (id: number, form: Pick<UniversityForm, "name" | "activeStatus">) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}) {
    const reduceMotion = useReducedMotion();
    const [form, setForm] = useState<UniversityForm>(
        university
            ? {
                name: university.name ?? "",
                code: university.code ?? "",
                activeStatus: university.activeStatus ?? "ENABLE",
            }
            : { ...EMPTY_FORM }
    );
    const [dialogError, setDialogError] = useState<string>("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const title: Record<DialogMode, string> = {
        CREATE: "Add University",
        EDIT: "Edit University",
        VIEW: "University Overview",
        DELETE: "Delete University",
    };

    // Close on Escape key if not busy
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function validate(): boolean {
        const errors: FieldErrors = {};
        const name = form.name.trim();

        if (!name) {
            errors.name = "University name is required.";
        } else if (name.length < 2) {
            errors.name = "University name must be at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "University name cannot exceed 150 characters.";
        }

        if (isCreate) {
            const code = form.code.trim();
            if (!code) {
                errors.code = "University code is required.";
            } else if (code.length < 2) {
                errors.code = "University code must be at least 2 characters.";
            } else if (code.length > 40) {
                errors.code = "University code cannot exceed 40 characters.";
            } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
                errors.code = "Code should only contain letters, numbers, hyphens, and underscores.";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!university) return;
            try {
                await onDelete(university.id);
            } catch (err) {
                setDialogError(extractUniversityErrorMessage(err));
            }
            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (!validate()) return;

        const name = form.name.trim();
        const code = form.code.trim();

        try {
            if (isCreate) {
                await onCreate({ ...form, name, code });
            } else if (isEdit && university) {
                await onUpdate(university.id, { name, activeStatus: form.activeStatus });
            }
        } catch (err) {
            setDialogError(extractUniversityErrorMessage(err));
        }
    }

    const hasActiveDependents =
        university &&
        ((university.noOfStudent ?? 0) > 0 ||
            (university.noOfTeacher ?? 0) > 0 ||
            (university.noOfUser ?? 0) > 0 ||
            (Array.isArray(university.school) && university.school.length > 0));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (!busy) onClose();
                }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.section
                role="dialog"
                aria-modal="true"
                aria-labelledby="university-dialog-title"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex max-h-[94vh] sm:max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/80"
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Super Admin · Organisation
                        </p>
                        <h2 id="university-dialog-title" className="mt-0.5 text-base sm:text-lg font-bold text-white truncate">
                            {title[mode]}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white shrink-0 ml-2 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 custom-scrollbar">
                    <form onSubmit={submit} className="space-y-4" noValidate>
                        {/* In-Dialog Error Banner */}
                        <AnimatePresence>
                            {dialogError && (
                                <motion.div
                                    role="alert"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200"
                                >
                                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-rose-300">Action blocked</p>
                                        <p className="mt-0.5 leading-relaxed text-rose-200/90">{dialogError}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDialogError("")}
                                        className="text-rose-400 hover:text-rose-200"
                                        aria-label="Dismiss error"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isDelete ? (
                            <div className="space-y-3.5">
                                <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 sm:p-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                                        <Trash2 size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white">
                                            Confirm Institutional Deletion
                                        </p>
                                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                            Are you sure you want to permanently delete{" "}
                                            <strong className="text-white">{university?.name}</strong>{" "}
                                            (<span className="font-mono text-cyan-300">{university?.code}</span>)?
                                        </p>
                                    </div>
                                </div>

                                {hasActiveDependents && (
                                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed">
                                        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
                                        <div>
                                            <p className="font-semibold text-amber-300">Attached Dependencies Notice</p>
                                            <p className="mt-0.5 text-amber-200/90">
                                                This university currently has{" "}
                                                <strong>{formatNumber(university?.noOfStudent)} students</strong>,{" "}
                                                <strong>{formatNumber(university?.noOfTeacher)} teachers</strong>, and{" "}
                                                <strong>{university?.school?.length ?? 0} affiliated schools</strong>.
                                                The backend requires removing all attached schools, academic years, roles, and users before deletion can proceed.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* University Name */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="university-name" className="text-xs font-semibold text-slate-300">
                                            University Name <span className="text-cyan-400">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-500">{form.name.length}/150</span>
                                    </div>
                                    <input
                                        id="university-name"
                                        value={form.name}
                                        onChange={(e) => {
                                            setForm((v) => ({ ...v, name: e.target.value }));
                                            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                                            if (dialogError) setDialogError("");
                                        }}
                                        readOnly={readOnly || busy}
                                        maxLength={150}
                                        placeholder="e.g. Stanford University"
                                        className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 ${fieldErrors.name
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : "border-white/10 focus:border-cyan-400/60"
                                            } read-only:opacity-75 disabled:opacity-50`}
                                    />
                                    {fieldErrors.name && (
                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-rose-400">
                                            <AlertCircle size={13} /> {fieldErrors.name}
                                        </p>
                                    )}
                                </div>

                                {/* University Code */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="university-code" className="text-xs font-semibold text-slate-300">
                                            University Code {isCreate && <span className="text-cyan-400">*</span>}
                                        </label>
                                        {isCreate && <span className="text-[11px] text-slate-500">{form.code.length}/40</span>}
                                    </div>
                                    <input
                                        id="university-code"
                                        value={form.code}
                                        onChange={(e) => {
                                            setForm((v) => ({ ...v, code: e.target.value.toUpperCase() }));
                                            if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: undefined }));
                                            if (dialogError) setDialogError("");
                                        }}
                                        readOnly={!isCreate || busy}
                                        maxLength={40}
                                        placeholder="e.g. STANFORD"
                                        className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 font-mono text-sm uppercase text-white outline-none transition placeholder:text-slate-500 ${fieldErrors.code
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : "border-white/10 focus:border-cyan-400/60"
                                            } read-only:opacity-60 disabled:opacity-50`}
                                    />
                                    {fieldErrors.code ? (
                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-rose-400">
                                            <AlertCircle size={13} /> {fieldErrors.code}
                                        </p>
                                    ) : isEdit ? (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            University code is immutable and cannot be changed after creation.
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Unique identifier. Uppercase letters, numbers, hyphens.
                                        </p>
                                    )}
                                </div>

                                {/* Active Status */}
                                {!isCreate && (
                                    <div>
                                        <label htmlFor="university-status" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Operational Status
                                        </label>
                                        {isView ? (
                                            <div className="flex items-center pt-0.5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${form.activeStatus === "ENABLE"
                                                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                        : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                                                        }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${form.activeStatus === "ENABLE" ? "bg-emerald-400" : "bg-amber-400"
                                                            }`}
                                                    />
                                                    {form.activeStatus === "ENABLE" ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        ) : (
                                            <select
                                                id="university-status"
                                                value={form.activeStatus}
                                                onChange={(e) => {
                                                    setForm((v) => ({ ...v, activeStatus: e.target.value as ActiveStatus }));
                                                    if (dialogError) setDialogError("");
                                                }}
                                                disabled={busy}
                                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-75"
                                            >
                                                <option value="ENABLE">Active (Enable)</option>
                                                <option value="DISABLE">Inactive (Disable)</option>
                                            </select>
                                        )}
                                    </div>
                                )}

                                {/* View-only: Institutional Statistics and Associated Schools */}
                                {isView && university && (
                                    <div className="space-y-3 pt-2 border-t border-white/5">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Institutional Metrics
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: "Students", value: university.noOfStudent },
                                                { label: "Faculties", value: university.noOfTeacher },
                                                { label: "Total Users", value: university.noOfUser },
                                            ].map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="rounded-xl border border-white/10 bg-slate-950/40 p-2.5 text-center"
                                                >
                                                    <p className="text-[11px] font-medium text-slate-400">{item.label}</p>
                                                    <p className="mt-0.5 text-base sm:text-lg font-bold text-white">{formatNumber(item.value)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Associated Schools list */}
                                        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                                    <Library size={13} className="text-cyan-400" />
                                                    Associated Schools
                                                </span>
                                                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                                                    {university.school?.length ?? 0}
                                                </span>
                                            </div>
                                            {Array.isArray(university.school) && university.school.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {university.school.map((s) => (
                                                        <span
                                                            key={s.id}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200"
                                                        >
                                                            <span>{s.name}</span>
                                                            {s.code && <span className="text-[10px] text-cyan-400 font-mono">({s.code})</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 italic">No schools affiliated with this university yet.</p>
                                            )}
                                        </div>

                                        {/* Audit & Governance Showcase */}
                                        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                                    <ShieldCheck size={13} className="text-emerald-400" />
                                                    Audit Trail & Governance
                                                </span>
                                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                                                    System Records
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                {/* Created By Card */}
                                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1.5">
                                                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <UserCheck size={11} /> Created By
                                                        </span>
                                                        {university.createdAt && (
                                                            <span className="text-slate-400 font-mono text-[10px]">
                                                                {formatDate(university.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                            {getInitials(university.createdBy?.name || "System")}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-semibold text-slate-200 text-xs">
                                                                {university.createdBy?.name || "System Administrator"}
                                                            </p>
                                                            {(university.createdBy?.code || university.createdBy?.id) && (
                                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                    {university.createdBy.code ? `Code: ${university.createdBy.code}` : `ID: #${university.createdBy.id}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {university.createdAt && (
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                            <Clock size={10} className="text-slate-400 shrink-0" />
                                                            <span className="truncate">Timestamp: {formatDateTime(university.createdAt)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Updated By Card */}
                                                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                    <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <RotateCcw size={11} /> Last Modified By
                                                        </span>
                                                        {(university.updatedAt || university.createdAt) && (
                                                            <span className="text-slate-400 font-mono text-[10px]">
                                                                {formatDate(university.updatedAt || university.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                            {getInitials(university.updatedBy?.name || university.createdBy?.name || "System")}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-semibold text-slate-200 text-xs">
                                                                {university.updatedBy?.name || university.createdBy?.name || "System Administrator"}
                                                            </p>
                                                            {(university.updatedBy?.code || university.updatedBy?.id) && (
                                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                    {university.updatedBy.code ? `Code: ${university.updatedBy.code}` : `ID: #${university.updatedBy.id}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {(university.updatedAt || university.createdAt) && (
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                            <Clock size={10} className="text-slate-400 shrink-0" />
                                                            <span className="truncate">Timestamp: {formatDateTime(university.updatedAt || university.createdAt)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex flex-col-reverse gap-2 pt-3 border-t border-white/10 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={busy}
                                className="w-full sm:w-auto rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                            >
                                {isView ? "Close" : "Cancel"}
                            </button>
                            {!isView && (
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${isDelete
                                        ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                        : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                        }`}
                                >
                                    {busy && <LoaderCircle size={15} className="animate-spin" />}
                                    {busy
                                        ? "Processing..."
                                        : isDelete
                                            ? "Confirm Delete"
                                            : isCreate
                                                ? "Create University"
                                                : "Save Changes"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </motion.section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component: Universities                                          */
/* -------------------------------------------------------------------------- */

export default function Universities() {
    const reduceMotion = useReducedMotion();
    const [universities, setUniversities] = useState<UniversityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);
    const [dialog, setDialog] = useState<{ mode: DialogMode; university: UniversityResponse | null } | null>(null);

    async function loadUniversities(isBackgroundRefresh = false) {
        if (isBackgroundRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setPageError("");

        try {
            const data = await getUniversities();
            setUniversities(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = extractUniversityErrorMessage(err);
            setPageError(msg);
            toast.error("Failed to load universities: " + msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        void loadUniversities();
    }, []);

    // Clear notice auto-timer
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    const stats = useMemo(() => {
        const list = Array.isArray(universities) ? universities : [];
        const students = list.reduce((sum, item) => sum + (item.noOfStudent ?? 0), 0);
        const teachers = list.reduce((sum, item) => sum + (item.noOfTeacher ?? 0), 0);
        const activeCount = list.filter((u) => u.activeStatus === "ENABLE").length;

        return [
            { label: "Total Universities", value: formatNumber(list.length), icon: Building2, tone: "cyan" },
            { label: "Active Institutions", value: formatNumber(activeCount), icon: GraduationCap, tone: "green" },
            { label: "Enrolled Students", value: formatNumber(students), icon: Users, tone: "blue" },
            { label: "Faculty Members", value: formatNumber(teachers), icon: ShieldCheck, tone: "purple" },
        ];
    }, [universities]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        const list = Array.isArray(universities) ? universities : [];

        const result = list.filter((u) => {
            const name = (u.name ?? "").toLowerCase();
            const code = (u.code ?? "").toLowerCase();
            const matchesQuery = !query || name.includes(query) || code.includes(query);
            const matchesStatus = statusFilter === "ALL" || u.activeStatus === statusFilter;
            return matchesQuery && matchesStatus;
        });

        return result.sort((a, b) => {
            if (sort === "NAME_ASC") return (a.name ?? "").localeCompare(b.name ?? "");
            if (sort === "NAME_DESC") return (b.name ?? "").localeCompare(a.name ?? "");
            if (sort === "CODE_ASC") return (a.code ?? "").localeCompare(b.code ?? "");
            if (sort === "STUDENTS_DESC") return (b.noOfStudent ?? 0) - (a.noOfStudent ?? 0);
            return (b.id ?? 0) - (a.id ?? 0);
        });
    }, [universities, search, statusFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Reset pagination when search or filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, sort]);

    function openDialog(mode: DialogMode, university: UniversityResponse | null = null) {
        setPageError("");
        setNotice("");
        setDialog({ mode, university });
    }

    async function handleCreate(form: UniversityForm) {
        setBusy(true);
        try {
            await createUniversity({ name: form.name, code: form.code });
            setDialog(null);
            setNotice(`University "${form.name}" registered successfully.`);
            toast.success(`University "${form.name}" created successfully.`);
            await loadUniversities(true);
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(id: number, form: Pick<UniversityForm, "name" | "activeStatus">) {
        setBusy(true);
        try {
            await updateUniversity(id, form);
            setDialog(null);
            setNotice("University updated successfully.");
            toast.success("University updated successfully.");
            await loadUniversities(true);
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setBusy(true);
        try {
            await deleteUniversity(id);
            setDialog(null);
            setNotice("University deleted successfully.");
            toast.success("University removed successfully.");
            await loadUniversities(true);
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setSort("NEWEST");
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
    };

    const hasActiveFilters = search.trim() !== "" || statusFilter !== "ALL" || sort !== "NEWEST";

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-5 p-3 text-slate-100 sm:space-y-6 sm:p-5 lg:p-7"
        >
            {/* Header & Breadcrumbs */}
            <section className="space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span className="truncate">Organisation</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Universities</span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Infrastructure &amp; Entities
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Universities
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Manage institutional entities, configure operational states, and oversee aggregated faculty and student counts.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadUniversities(true)}
                            disabled={loading || refreshing}
                            title="Refresh university list"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-3 sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw size={15} className={refreshing || loading ? "animate-spin text-cyan-400" : ""} />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => openDialog("CREATE")}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Add University</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Alert Status Banners */}
            <AnimatePresence>
                {(pageError || notice) && (
                    <motion.div
                        role={pageError ? "alert" : "status"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm ${pageError
                            ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                            : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            }`}
                    >
                        <div className="flex items-start gap-2.5">
                            {pageError ? (
                                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                            ) : (
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                            )}
                            <div>
                                <p className="font-semibold text-white">{pageError ? "Action Required" : "Success"}</p>
                                <p className="mt-0.5 leading-relaxed">{pageError || notice}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {pageError && (
                                <button
                                    type="button"
                                    onClick={() => void loadUniversities()}
                                    className="rounded-lg border border-rose-400/30 bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/30"
                                >
                                    Retry
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setPageError("");
                                    setNotice("");
                                }}
                                aria-label="Dismiss message"
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metric / Statistics Cards */}
            <section
                aria-label="University statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.06 }}
                            whileHover={reduceMotion ? undefined : { y: -3 }}
                            className={`rounded-2xl border bg-gradient-to-br p-3.5 sm:p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-300 truncate sm:text-sm">{stat.label}</p>
                                    <p className="mt-1.5 text-xl font-bold tracking-tight text-white sm:mt-3 sm:text-3xl">
                                        {loading ? (
                                            <span className="inline-block h-7 w-16 animate-pulse rounded bg-white/10 sm:h-8 sm:w-20" />
                                        ) : (
                                            stat.value
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-2 sm:p-3 shrink-0">
                                    <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
                                </div>
                            </div>
                            <div className="mt-3 sm:mt-5 h-1 overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: loading ? "30%" : "100%" }}
                                    transition={{ duration: 0.7, delay: index * 0.08 }}
                                    className="h-full rounded-full bg-current opacity-60"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            {/* Main Data Container: Filters + Desktop Table + Mobile Cards */}
            <GlassCard>
                {/* Search & Filter Toolbar */}
                <div className="grid gap-2.5 sm:gap-3 border-b border-white/10 p-3 sm:p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Search Field */}
                    <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            aria-label="Search universities by name or code"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or code..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-9 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            id="status-filter"
                            aria-label="Filter by active status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ENABLE">Active Only</option>
                            <option value="DISABLE">Inactive Only</option>
                        </select>
                        <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {/* Sort Filter */}
                    <div className="relative">
                        <select
                            id="sort-filter"
                            aria-label="Sort universities"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="NEWEST">Highest ID First</option>
                            <option value="NAME_ASC">Name: A to Z</option>
                            <option value="NAME_DESC">Name: Z to A</option>
                            <option value="CODE_ASC">Code: A to Z</option>
                            <option value="STUDENTS_DESC">Most Students</option>
                        </select>
                        <ArrowDownUp
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {/* Reset Filter Button */}
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                        >
                            <RotateCcw size={14} />
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* 1. Desktop Table View (>= lg) */}
                <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[950px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">University</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Schools</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-4 py-4 text-right font-medium">Students</th>
                                <th className="px-4 py-4 text-right font-medium">Faculties</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`loading-${i}`}>
                                        {Array.from({ length: 8 }).map((__, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && universities.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">Failed to load universities</p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">{pageError}</p>
                                        <button
                                            type="button"
                                            onClick={() => void loadUniversities()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : visible.length > 0 ? (
                                visible.map((u, index) => {
                                    const initials = getInitials(u.name);
                                    const schoolsCount = u.school?.length ?? 0;

                                    return (
                                        <motion.tr
                                            key={u.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.035]"
                                        >
                                            <td className="px-5 py-4 text-slate-500 text-xs">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {u.name || "Unnamed University"}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-slate-500">ID #{u.id}</span>
                                                            <span className="text-slate-600">·</span>
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                title={`Created by: ${formatAuditActor(u.createdBy)}${u.createdAt ? ` on ${formatDate(u.createdAt)}` : ""}${u.updatedBy?.name ? ` | Modified by: ${formatAuditActor(u.updatedBy)}` : ""}`}
                                                            >
                                                                <UserCheck size={11} className="text-emerald-400 shrink-0" />
                                                                <span className="truncate max-w-[120px] font-medium text-slate-300">
                                                                    {u.createdBy?.name || "System"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1 font-mono text-xs text-slate-300">
                                                    {u.code || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300">
                                                    <Library size={12} className="text-cyan-400" />
                                                    {schoolsCount} {schoolsCount === 1 ? "School" : "Schools"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${u.activeStatus === "ENABLE"
                                                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                        : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                                                        }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${u.activeStatus === "ENABLE" ? "bg-emerald-400" : "bg-amber-400"
                                                            }`}
                                                    />
                                                    {u.activeStatus === "ENABLE" ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right tabular-nums text-slate-300">
                                                {formatNumber(u.noOfStudent)}
                                            </td>
                                            <td className="px-4 py-4 text-right tabular-nums text-slate-300">
                                                {formatNumber(u.noOfTeacher)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("VIEW", u)}
                                                        aria-label={`View details of ${u.name}`}
                                                        title="View details"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("EDIT", u)}
                                                        aria-label={`Edit ${u.name}`}
                                                        title="Edit university"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("DELETE", u)}
                                                        aria-label={`Delete ${u.name}`}
                                                        title="Delete university"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/20"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Building2 size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters ? "No matching universities found" : "No universities registered yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search term, changing status filter, or clearing search criteria."
                                                : "Get started by registering your organization's first university."}
                                        </p>
                                        <div className="mt-4 flex justify-center gap-2">
                                            {hasActiveFilters ? (
                                                <button
                                                    type="button"
                                                    onClick={resetFilters}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                                >
                                                    <RotateCcw size={13} />
                                                    Clear Filters
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => openDialog("CREATE")}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plus size={14} />
                                                    Add University
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. Mobile & Tablet Cards View (< lg) */}
                <div className="divide-y divide-white/5 lg:hidden">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-3 p-4">
                                <div className="h-5 w-40 rounded bg-white/10" />
                                <div className="h-4 w-56 rounded bg-white/5" />
                                <div className="h-10 rounded bg-white/5" />
                            </div>
                        ))
                    ) : visible.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Building2 size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-300">No universities found</p>
                        </div>
                    ) : (
                        visible.map((u) => {
                            const initials = getInitials(u.name);
                            const schoolsCount = u.school?.length ?? 0;

                            return (
                                <article key={u.id} className="min-w-0 space-y-3 p-3.5 sm:p-5">
                                    {/* Card Header */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                            {initials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-white break-words">
                                                    {u.name}
                                                </h3>
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${u.activeStatus === "ENABLE"
                                                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                        : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                                                        }`}
                                                >
                                                    {u.activeStatus === "ENABLE" ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                                                <span>Code: <strong className="text-cyan-300">{u.code}</strong></span>
                                                <span>·</span>
                                                <span>ID #{u.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary 4-cell Grid */}
                                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs sm:grid-cols-4 sm:p-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Students</p>
                                            <p className="font-semibold text-white mt-0.5">{formatNumber(u.noOfStudent)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Faculties</p>
                                            <p className="font-semibold text-white mt-0.5">{formatNumber(u.noOfTeacher)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Total Users</p>
                                            <p className="font-semibold text-white mt-0.5">{formatNumber(u.noOfUser)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Schools</p>
                                            <p className="font-semibold text-cyan-300 mt-0.5">{schoolsCount} affiliated</p>
                                        </div>
                                    </div>

                                    {/* Audit & Governance Showcase */}
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                {u.createdBy?.name || "System"}
                                            </span>
                                            {u.createdAt && (
                                                <span className="text-slate-500 font-mono text-[10px]">
                                                    · {formatDate(u.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {u.updatedBy?.name && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="text-slate-500">Updated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {u.updatedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => openDialog("VIEW", u)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                                        >
                                            <Eye size={13} /> Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDialog("EDIT", u)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                        >
                                            <Pencil size={13} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDialog("DELETE", u)}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>

                {/* Footer Pagination Controls */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {filtered.length === 0
                            ? "Showing 0 universities"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                currentPage * PAGE_SIZE,
                                filtered.length
                            )} of ${filtered.length} universities`}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            title="First page"
                            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.035] flex items-center justify-center text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsLeft size={15} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((v) => Math.max(1, v - 1))}
                            aria-label="Previous page"
                            title="Previous page"
                            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.035] flex items-center justify-center text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={15} />
                        </button>

                        {/* Compact on mobile (<sm), full buttons on sm+ */}
                        <span className="flex sm:hidden items-center px-2 text-xs font-semibold text-cyan-300">
                            {currentPage} / {totalPages}
                        </span>

                        <span className="hidden sm:inline-flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                                .map((n, i, pages) => (
                                    <span key={n} className="contents">
                                        {i > 0 && n - pages[i - 1] > 1 && <span className="px-1 text-slate-500 text-xs">…</span>}
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setPage(n)}
                                            aria-current={currentPage === n ? "page" : undefined}
                                            className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-semibold transition ${currentPage === n
                                                ? "border-cyan-300/40 bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-md shadow-blue-500/20"
                                                : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/10"
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    </span>
                                ))}
                        </span>

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                            aria-label="Next page"
                            title="Next page"
                            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.035] flex items-center justify-center text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={15} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            title="Last page"
                            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.035] flex items-center justify-center text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsRight size={15} />
                        </button>
                    </div>
                </footer>
            </GlassCard>

            {/* Modal Dialog */}
            <AnimatePresence>
                {dialog && (
                    <UniversityDialog
                        key={`${dialog.mode}-${dialog.university?.id ?? "new"}`}
                        mode={dialog.mode}
                        university={dialog.university}
                        busy={busy}
                        onClose={() => {
                            if (!busy) setDialog(null);
                        }}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>
        </motion.main>
    );
}
