// src/pages/academicManagement/AcademicYears.tsx

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";

import {
    AlertCircle,
    AlertTriangle,
    ArrowDownUp,
    Building2,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Eye,
    GraduationCap,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    Trash2,
    UserCheck,
    X,
} from "lucide-react";

import {
    createAcademicYear,
    deleteAcademicYear,
    extractEditableCode,
    extractErrorMessage,
    formatAuditActor,
    getAcademicYearPostfix,
    getAllAcademicYears,
    getUniversityFilter,
    getStatusLabel,
    hasPermission,
    normalizeText,
    switchAcademicYear,
    uniqueDTOs,
    updateAcademicYear,
    type AcademicYearRequest,
    type AcademicYearResponse,
    type ActiveStatus,
    type CommonDTO,
    type PermissionAction,
} from "@/services/academic/academicYearService";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "CODE_ASC" | "START_DATE_DESC";

interface YearForm {
    universityId: number | "";
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    activeStatus: ActiveStatus;
}

interface FormErrors {
    universityId?: string;
    name?: string;
    code?: string;
    startDate?: string;
    endDate?: string;
    activeStatus?: string;
}

const PAGE_SIZE = 8;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "0";
    }
    return new Intl.NumberFormat("en-IN").format(value);
}

function formatDate(value?: string | null): string {
    if (!value) return "—";

    const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
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
    if (!name) return "AY";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "AY";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getYearActions(year: AcademicYearResponse): PermissionAction[] {
    return Array.isArray(year.permissionActions)
        ? year.permissionActions
        : [];
}

function getYearCode(year: AcademicYearResponse): string {
    return typeof year.code === "string" ? year.code : "";
}

function getUniversityId(year: AcademicYearResponse): number | null {
    const id = year.university?.id;
    return typeof id === "number" && id > 0 ? id : null;
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function GlassCard({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

function FieldError({ children }: { children?: string }) {
    if (!children) return null;

    return (
        <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-400"
            role="alert"
        >
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </motion.p>
    );
}

function StatusBadge({ status }: { status?: ActiveStatus | null }) {
    const active = status === "ENABLE";
    const inactive = status === "DISABLE";

    const classes = active
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
        : inactive
            ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
            : "border-slate-400/30 bg-slate-500/10 text-slate-300";

    const dot = active
        ? "bg-emerald-400"
        : inactive
            ? "bg-amber-400"
            : "bg-slate-400";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {getStatusLabel(status)}
        </span>
    );
}

function SelectChevron() {
    return (
        <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function ErrorBanner({
    title,
    message,
    onRetry,
    onDismiss,
}: {
    title: string;
    message: string;
    onRetry?: () => void;
    onDismiss: () => void;
}) {
    return (
        <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
            <div className="flex min-w-0 items-start gap-3">
                <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-rose-400"
                />
                <div className="min-w-0">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 break-words text-xs sm:text-sm">
                        {message}
                    </p>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss error"
                className="shrink-0 text-slate-400 transition hover:text-white"
            >
                <X size={17} />
            </button>
        </motion.div>
    );
}

function InfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-medium text-white">
                {value}
            </p>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Academic Year Dialog                                                       */
/* -------------------------------------------------------------------------- */

interface YearDialogProps {
    mode: DialogMode;
    year: AcademicYearResponse | null;
    defaultUniversityId?: number | "";
    universities: CommonDTO[];
    universitiesLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (universityId: number, request: AcademicYearRequest) => Promise<void>;
    onUpdate: (yearId: number, request: AcademicYearRequest) => Promise<void>;
    onDelete: (yearId: number) => Promise<void>;
    onSwitch?: (year: AcademicYearResponse) => Promise<void>;
}

function AcademicYearDialog({
    mode,
    year,
    defaultUniversityId,
    universities,
    universitiesLoading,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
    onSwitch,
}: YearDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const initialUniversityId: number | "" = isCreate
        ? defaultUniversityId && Number(defaultUniversityId) > 0
            ? Number(defaultUniversityId)
            : universities.length === 1
                ? universities[0].id
                : ""
        : getUniversityId(year as AcademicYearResponse) ?? "";

    const initialPostfix = year?.university?.code ?? "";

    const [form, setForm] = useState<YearForm>(() => ({
        universityId: initialUniversityId,
        name: year?.name ?? "",
        code:
            (isEdit || isView) && year
                ? extractEditableCode(getYearCode(year), initialPostfix)
                : getYearCode(year),
        startDate: year?.startDate ?? "",
        endDate: year?.endDate ?? "",
        activeStatus: year?.activeStatus ?? "ENABLE",
    }));

    const [postfix, setPostfix] = useState(initialPostfix);
    const [codeLoading, setCodeLoading] = useState(false);
    const [codeError, setCodeError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

    // Identify the active university object
    const selectedUniversity = useMemo(() => {
        const uId = Number(isCreate ? form.universityId : year?.university?.id);
        if (!uId || uId <= 0) return null;
        return universities.find((u) => u.id === uId) || year?.university || null;
    }, [isCreate, form.universityId, universities, year?.university]);

    /*
     * Resolve Postfix:
     * 1. Immediate resolution from selected university DTO's .code
     * 2. Background verification from backend /postfix?universityId=...
     * Works for CREATE, EDIT, and VIEW modes so postfix is always cleanly handled.
     */
    useEffect(() => {
        let cancelled = false;

        async function resolvePostfix() {
            const universityId = Number(
                isCreate ? form.universityId : year?.university?.id
            );

            setPostfix("");
            setCodeError("");

            if (!Number.isFinite(universityId) || universityId <= 0) {
                setCodeLoading(false);
                return;
            }

            // Instant local resolve from CommonController DTO or year.university
            const matchingUni =
                universities.find((u) => u.id === universityId) ||
                year?.university;
            if (matchingUni?.code) {
                setPostfix(matchingUni.code);
            }

            setCodeLoading(true);

            try {
                const loadedPostfix = await getAcademicYearPostfix(
                    universityId,
                    (isEdit || isView) && year ? year.id : undefined
                );

                if (cancelled) return;

                const resolved = loadedPostfix || matchingUni?.code || "";
                if (resolved) {
                    setPostfix(resolved);
                }

                if ((isEdit || isView) && year && resolved) {
                    setForm((current) => ({
                        ...current,
                        code: extractEditableCode(
                            getYearCode(year),
                            resolved
                        ),
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    if (matchingUni?.code) {
                        setPostfix(matchingUni.code);
                    } else {
                        setCodeError(extractErrorMessage(error));
                    }
                }
            } finally {
                if (!cancelled) setCodeLoading(false);
            }
        }

        if (isCreate || isEdit || isView) {
            void resolvePostfix();
        } else {
            setCodeLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [
        isCreate,
        isEdit,
        isView,
        form.universityId,
        universities,
        year?.id,
        year?.university?.id,
        year?.university?.code,
    ]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof YearForm>(
        key: K,
        value: YearForm[K]
    ) {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
        setDialogError("");
    }

    function validate(): boolean {
        const errors: FormErrors = {};
        const name = form.name.trim();
        const code = form.code.trim();

        if (isCreate) {
            const universityId = Number(form.universityId);

            if (!form.universityId || universityId <= 0) {
                errors.universityId = "Please select a university first.";
            } else if (!universities.some((item) => item.id === universityId)) {
                errors.universityId =
                    "The selected university is no longer available. Please reload.";
            }
        }

        if (!name) {
            errors.name = "Academic year name is required.";
        } else if (name.length < 2) {
            errors.name = "Name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "Name cannot exceed 150 characters.";
        }

        if (!code) {
            errors.code = "The session code prefix is required.";
        } else if (code.length > 40) {
            errors.code = "Session code cannot exceed 40 characters.";
        } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
            errors.code =
                "Use only letters, numbers, hyphens, and underscores.";
        }

        if (!form.startDate) {
            errors.startDate = "Start date is required.";
        }

        if (!form.endDate) {
            errors.endDate = "End date is required.";
        } else if (
            form.startDate &&
            form.endDate &&
            form.endDate < form.startDate
        ) {
            errors.endDate = "End date cannot be before the start date.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!year) {
                setDialogError("No academic year was selected.");
                return;
            }

            try {
                await onDelete(year.id);
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();

                setDialogError(
                    lower.includes("constraint") ||
                        lower.includes("foreign key") ||
                        lower.includes("cannot delete") ||
                        lower.includes("delete its courses first")
                        ? "This academic year has associated courses or sections. Delete or reassign those records first."
                        : message
                );
            }

            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (!validate()) return;

        const request: AcademicYearRequest = {
            name: form.name.trim(),
            // Only send the prefix; backend automatically appends the university code
            code: form.code.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
            activeStatus: form.activeStatus,
        };

        try {
            if (isCreate) {
                // Must pass universityId as required by @RequestParam Long universityId
                await onCreate(Number(form.universityId), request);
            } else if (isEdit && year) {
                await onUpdate(year.id, request);
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    const title: Record<DialogMode, string> = {
        CREATE: "Create Academic Year",
        EDIT: "Edit Academic Year",
        VIEW: "Academic Year Details",
        DELETE: "Delete Academic Year",
    };

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 disabled:opacity-60 read-only:opacity-75";

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="academic-year-dialog-title"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · Academic Administration
                        </p>
                        <h2
                            id="academic-year-dialog-title"
                            className="mt-1 text-xl font-semibold text-white"
                        >
                            {title[mode]}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={submit}
                    noValidate
                    className="max-h-[80vh] space-y-5 overflow-y-auto p-5 sm:p-6"
                >
                    <AnimatePresence>
                        {dialogError && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200"
                            >
                                <AlertCircle
                                    size={18}
                                    className="mt-0.5 shrink-0 text-rose-400"
                                />
                                <p className="min-w-0 flex-1 break-words text-xs leading-relaxed">
                                    {dialogError}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setDialogError("")}
                                    aria-label="Dismiss error"
                                    className="text-rose-400 hover:text-rose-200"
                                >
                                    <X size={15} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isDelete ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">
                                        Delete this academic year?
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                                        You are about to delete{" "}
                                        <strong className="text-white">
                                            {year?.name}
                                        </strong>
                                        . This action cannot be reversed and requires all linked courses to be deleted first.
                                    </p>
                                    <p className="mt-2 break-all font-mono text-xs text-cyan-300">
                                        {year?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Select University (CREATE mode) */}
                            {isCreate && (
                                <div>
                                    <label
                                        htmlFor="academic-year-university"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        University{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="academic-year-university"
                                            value={form.universityId}
                                            onChange={(event) => {
                                                const uId = event.target.value
                                                    ? Number(event.target.value)
                                                    : "";
                                                changeField("universityId", uId);
                                            }}
                                            disabled={
                                                busy ||
                                                universitiesLoading ||
                                                universities.length === 0
                                            }
                                            className={`${inputClass} appearance-none pr-10`}
                                        >
                                            <option value="">
                                                {universitiesLoading
                                                    ? "Loading universities..."
                                                    : "Select University"}
                                            </option>

                                            {universities.map((uni) => (
                                                <option
                                                    key={uni.id}
                                                    value={uni.id}
                                                >
                                                    {uni.name}
                                                    {uni.code
                                                        ? ` (${uni.code})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                    </div>

                                    <FieldError>
                                        {fieldErrors.universityId}
                                    </FieldError>
                                </div>
                            )}

                            {/* Linked University Display (EDIT / VIEW mode) */}
                            {!isCreate && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Associated University
                                    </label>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Building2 size={16} className="text-cyan-400" />
                                            <div>
                                                <p className="font-medium text-white text-sm">
                                                    {year?.university?.name ?? "—"}
                                                </p>
                                                {year?.university?.id && (
                                                    <p className="text-xs text-slate-400 font-mono">
                                                        University ID #{year.university.id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {year?.university?.code && (
                                            <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-xs text-cyan-300">
                                                {year.university.code}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Academic Year Name */}
                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="academic-year-name"
                                        className="text-sm font-medium text-slate-300"
                                    >
                                        Academic Year Name{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        {form.name.length}/150
                                    </span>
                                </div>

                                <input
                                    id="academic-year-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        changeField("name", event.target.value)
                                    }
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Academic Year 2026–2027"
                                    className={inputClass}
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            {/* Academic Year Code with Postfix */}
                            <div>
                                <label
                                    htmlFor="academic-year-code"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Academic Year Code{" "}
                                    <span className="text-cyan-400">*</span>
                                </label>

                                <div className="flex min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    {/* Code prefix (editable in create/edit, readOnly in view) */}
                                    <input
                                        id="academic-year-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="2026"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 sm:px-4 read-only:opacity-75"
                                    />

                                    {/* Fixed postfix (University Code): RIGHT */}
                                    <div className="flex max-w-[45%] shrink-0 items-center border-l border-white/10 bg-white/[0.04] px-3 font-mono text-xs text-cyan-300 sm:px-4 sm:text-sm">
                                        <span className="truncate">
                                            {codeLoading
                                                ? "Loading…"
                                                : postfix ||
                                                  selectedUniversity?.code ||
                                                  year?.university?.code ||
                                                  "UNI-CODE"}
                                        </span>
                                    </div>
                                </div>

                                <FieldError>
                                    {fieldErrors.code || codeError}
                                </FieldError>

                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    Backend automatically appends the selected university code postfix. Only enter the session prefix.
                                </p>

                                {(postfix || selectedUniversity?.code) && (
                                    <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                Resulting Code
                                            </p>
                                            <p className="mt-0.5 break-all font-mono text-sm font-semibold text-cyan-200">
                                                {form.code.trim() || "SESSION"}
                                                {postfix || selectedUniversity?.code}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500">
                                            Auto-Postfix
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="academic-year-start"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Start Date{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>
                                    <input
                                        id="academic-year-start"
                                        type="date"
                                        value={form.startDate}
                                        onChange={(event) =>
                                            changeField(
                                                "startDate",
                                                event.target.value
                                            )
                                        }
                                        readOnly={readOnly || busy}
                                        className={inputClass}
                                    />
                                    <FieldError>{fieldErrors.startDate}</FieldError>
                                </div>

                                <div>
                                    <label
                                        htmlFor="academic-year-end"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        End Date{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>
                                    <input
                                        id="academic-year-end"
                                        type="date"
                                        value={form.endDate}
                                        onChange={(event) =>
                                            changeField("endDate", event.target.value)
                                        }
                                        readOnly={readOnly || busy}
                                        className={inputClass}
                                    />
                                    <FieldError>{fieldErrors.endDate}</FieldError>
                                </div>
                            </div>

                            {/* Active Status */}
                            {!isCreate && (
                                <div>
                                    <label
                                        htmlFor="academic-year-status"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Active Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="academic-year-status"
                                            value={form.activeStatus}
                                            onChange={(event) =>
                                                changeField(
                                                    "activeStatus",
                                                    event.target.value as ActiveStatus
                                                )
                                            }
                                            disabled={readOnly || busy}
                                            className={`${inputClass} appearance-none pr-10`}
                                        >
                                            <option value="ENABLE">
                                                Active (Enable)
                                            </option>
                                            <option value="DISABLE">
                                                Inactive (Disable)
                                            </option>
                                        </select>
                                        <SelectChevron />
                                    </div>
                                </div>
                            )}

                            {/* View Mode Details & Audit Showcase */}
                            {isView && year && (
                                <div className="space-y-4 pt-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Academic Year Information
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <InfoTile label="Academic Year ID" value={`#${year.id}`} />
                                        <InfoTile
                                            label="Current Active Year"
                                            value={year.current ? "Yes (Current Session)" : "No"}
                                        />
                                        <InfoTile
                                            label="University"
                                            value={year.university ? `${year.university.name}${year.university.code ? ` (${year.university.code})` : ""}` : "—"}
                                        />
                                        <InfoTile
                                            label="Duration"
                                            value={`${formatDate(year.startDate)} to ${formatDate(year.endDate)}`}
                                        />
                                        <InfoTile
                                            label="Full System Code"
                                            value={year.code || "—"}
                                        />
                                        <InfoTile
                                            label="Session Prefix"
                                            value={
                                                extractEditableCode(
                                                    getYearCode(year),
                                                    postfix ||
                                                        year.university?.code
                                                ) || "—"
                                            }
                                        />
                                        <InfoTile
                                            label="University Postfix"
                                            value={
                                                postfix ||
                                                year.university?.code ||
                                                "—"
                                            }
                                        />
                                        <InfoTile
                                            label="Permissions"
                                            value={getYearActions(year).join(", ") || "View only"}
                                        />
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
                                                    {year.createdAt && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(year.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                        {getInitials(year.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {year.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(year.createdBy?.code || year.createdBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {year.createdBy.code ? `Code: ${year.createdBy.code}` : `ID: #${year.createdBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {year.createdAt && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(year.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Updated By Card */}
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <RotateCcw size={11} /> Last Modified By
                                                    </span>
                                                    {(year.updatedAt || year.createdAt) && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(year.updatedAt || year.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                        {getInitials(year.updatedBy?.name || year.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {year.updatedBy?.name || year.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(year.updatedBy?.code || year.updatedBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {year.updatedBy.code ? `Code: ${year.updatedBy.code}` : `ID: #${year.updatedBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(year.updatedAt || year.createdAt) && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(year.updatedAt || year.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>

                        {isView && year && !year.current && onSwitch && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                    onClose();
                                    void onSwitch(year);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-emerald-300 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw size={15} />
                                <span>Switch to Current Year</span>
                            </button>
                        )}

                        {!isView && (
                            <button
                                type="submit"
                                disabled={
                                    busy ||
                                    codeLoading ||
                                    (isCreate &&
                                        (universitiesLoading ||
                                            universities.length === 0 ||
                                            !form.universityId))
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${isDelete
                                    ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                    : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                    }`}
                            >
                                {busy || codeLoading ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                ) : isDelete ? (
                                    <Trash2 size={16} />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}

                                {busy
                                    ? "Processing..."
                                    : codeLoading
                                        ? "Loading code..."
                                        : isDelete
                                            ? "Confirm Delete"
                                            : isCreate
                                                ? "Create Academic Year"
                                                : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Academic Year Page                                                    */
/* -------------------------------------------------------------------------- */

export default function AcademicYears() {
    const reduceMotion = useReducedMotion();

    const [years, setYears] = useState<AcademicYearResponse[]>([]);
    const [universities, setUniversities] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [universitiesLoading, setUniversitiesLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    /* Local Filters */
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState<string>("ALL");
    const [currentFilter, setCurrentFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        year: AcademicYearResponse | null;
        defaultUniversityId?: number | "";
    } | null>(null);

    /* ---------------------------------------------------------------------- */
    /* Load universities from CommonController (Only used while creating)     */
    /* ---------------------------------------------------------------------- */

    const loadUniversities = useCallback(async () => {
        setUniversitiesLoading(true);

        try {
            const result = await getUniversityFilter();
            const options = uniqueDTOs(result);
            setUniversities(options);
            return options;
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not load universities: ${message}`);
            return [];
        } finally {
            setUniversitiesLoading(false);
        }
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Load academic years                                                    */
    /* ---------------------------------------------------------------------- */

    const loadData = useCallback(async (background = false) => {
        if (background) setRefreshing(true);
        else setLoading(true);

        setPageError("");

        try {
            const result = await getAllAcademicYears();
            setYears(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load academic years: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Load academic years on mount
    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!notice) return;

        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    /* Unique universities from loaded academic years data for local filter */
    const tableUniversities = useMemo(() => {
        const map = new Map<number, CommonDTO>();
        for (const year of years) {
            if (year.university && typeof year.university.id === "number") {
                map.set(year.university.id, year.university);
            }
        }
        return Array.from(map.values()).sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
        );
    }, [years]);

    function openCreateDialog() {
        setPageError("");
        setNotice("");

        // Fetch universities from common controller if not already loaded
        if (universities.length === 0) {
            void loadUniversities();
        }

        // If a university is selected in table filter, pre-select it
        const defaultUni =
            universityFilter !== "ALL" ? Number(universityFilter) : "";
        setDialog({
            mode: "CREATE",
            year: null,
            defaultUniversityId: defaultUni,
        });
    }

    function openDialog(
        mode: DialogMode,
        year: AcademicYearResponse | null = null
    ) {
        setPageError("");
        setNotice("");
        setDialog({ mode, year });
    }

    /* ---------------------------------------------------------------------- */
    /* Statistics                                                             */
    /* ---------------------------------------------------------------------- */

    const stats = useMemo(() => {
        const total = years.length;
        const active = years.filter((year) => year.activeStatus === "ENABLE").length;
        const inactive = years.filter((year) => year.activeStatus === "DISABLE").length;
        const current = years.filter((year) => year.current === true).length;

        return [
            {
                label: "Total Academic Years",
                value: formatNumber(total),
                icon: CalendarDays,
                tone: "cyan",
            },
            {
                label: "Active Academic Years",
                value: formatNumber(active),
                icon: GraduationCap,
                tone: "green",
            },
            {
                label: "Current Sessions",
                value: formatNumber(current),
                icon: Star,
                tone: "purple",
            },
            {
                label: "Inactive Academic Years",
                value: formatNumber(inactive),
                icon: ShieldCheck,
                tone: "amber",
            },
        ] as const;
    }, [years]);

    /* ---------------------------------------------------------------------- */
    /* Local search, filtering, and sorting                                   */
    /* ---------------------------------------------------------------------- */

    const filteredYears = useMemo(() => {
        const query = normalizeText(search);

        const result = years.filter((year) => {
            const matchesSearch =
                !query ||
                normalizeText(year.name).includes(query) ||
                normalizeText(year.code).includes(query) ||
                String(year.id).includes(query) ||
                normalizeText(year.university?.name).includes(query) ||
                normalizeText(year.university?.code).includes(query) ||
                normalizeText(year.createdBy?.name).includes(query) ||
                normalizeText(year.updatedBy?.name).includes(query);

            const matchesStatus =
                statusFilter === "ALL" || year.activeStatus === statusFilter;

            const matchesUniversity =
                universityFilter === "ALL" ||
                year.university?.id === Number(universityFilter);

            const matchesCurrent =
                currentFilter === "ALL" ||
                (currentFilter === "CURRENT" && year.current === true) ||
                (currentFilter === "NOT_CURRENT" && year.current !== true);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesUniversity &&
                matchesCurrent
            );
        });

        result.sort((a, b) => {
            if (sort === "NAME_ASC") {
                return (a.name ?? "").localeCompare(b.name ?? "");
            }

            if (sort === "NAME_DESC") {
                return (b.name ?? "").localeCompare(a.name ?? "");
            }

            if (sort === "CODE_ASC") {
                return (a.code ?? "").localeCompare(b.code ?? "");
            }

            if (sort === "START_DATE_DESC") {
                return (b.startDate ?? "").localeCompare(a.startDate ?? "");
            }

            return (b.id ?? 0) - (a.id ?? 0);
        });

        return result;
    }, [
        years,
        search,
        statusFilter,
        universityFilter,
        currentFilter,
        sort,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Pagination                                                             */
    /* ---------------------------------------------------------------------- */

    const totalPages = Math.max(1, Math.ceil(filteredYears.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const visibleYears = filteredYears.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [
        search,
        statusFilter,
        universityFilter,
        currentFilter,
        sort,
    ]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "ALL" ||
        universityFilter !== "ALL" ||
        currentFilter !== "ALL" ||
        sort !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setUniversityFilter("ALL");
        setCurrentFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    /* ---------------------------------------------------------------------- */
    /* CRUD handlers                                                          */
    /* ---------------------------------------------------------------------- */

    async function handleCreate(
        universityId: number,
        request: AcademicYearRequest
    ) {
        setBusy(true);

        try {
            await createAcademicYear(universityId, request);

            setDialog(null);
            setNotice("Academic year created successfully.");
            toast.success(`Academic year "${request.name}" created successfully.`);

            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not create academic year: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(
        yearId: number,
        request: AcademicYearRequest
    ) {
        setBusy(true);

        try {
            await updateAcademicYear(yearId, request);

            setDialog(null);
            setNotice("Academic year updated successfully.");
            toast.success("Academic year updated successfully.");

            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not update academic year: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(yearId: number) {
        setBusy(true);

        try {
            const message = await deleteAcademicYear(yearId);

            setDialog(null);
            setNotice(message);
            toast.success(message);

            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not delete academic year: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleSwitch(year: AcademicYearResponse) {
        const universityId = getUniversityId(year);

        if (!universityId) {
            toast.error("Cannot switch this academic year: University ID is missing.");
            return;
        }

        if (year.current) {
            toast.info("This academic year is already current.");
            return;
        }

        const confirmed = window.confirm(
            `Switch current active academic year for ${year.university?.name || "university"} to "${year.name}"?`
        );

        if (!confirmed) return;

        setBusy(true);

        try {
            const message = await switchAcademicYear(universityId, year.id);
            toast.success(message);
            setNotice(message);
            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not switch academic year: ${message}`);
        } finally {
            setBusy(false);
        }
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        amber: "border-amber-400/20 from-amber-500/10 to-orange-500/5 text-amber-300",
    };

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-7 p-4 text-white sm:p-6 lg:p-8"
        >
            {/* Page heading */}
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Academic Management</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Academic Years</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Academic Year Management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Configure university-scoped academic sessions, track audit history, and switch current operational sessions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                void loadUniversities();
                                void loadData(true);
                            }}
                            disabled={loading || refreshing || busy}
                            title="Refresh academic years"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loading || refreshing
                                        ? "animate-spin text-cyan-400"
                                        : ""
                                }
                            />
                            <span className="hidden sm:inline">
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreateDialog}
                            disabled={loading || refreshing || busy}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Add Academic Year
                        </button>
                    </div>
                </div>
            </section>

            {/* Errors and notices */}
            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        title="Could not load academic years"
                        message={pageError}
                        onRetry={() => void loadData()}
                        onDismiss={() => setPageError("")}
                    />
                )}

                {notice && (
                    <motion.div
                        role="status"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                    >
                        <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0 text-emerald-400"
                        />
                        <p>{notice}</p>
                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss success message"
                            className="ml-auto text-slate-400 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Statistics */}
            <section
                aria-label="Academic year statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: reduceMotion ? 0 : index * 0.06,
                            }}
                            whileHover={reduceMotion ? undefined : { y: -3 }}
                            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-300">
                                        {stat.label}
                                    </p>
                                    <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                                        {loading ? (
                                            <span className="inline-block h-8 w-20 animate-pulse rounded bg-white/10" />
                                        ) : (
                                            stat.value
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                                    <Icon size={23} />
                                </div>
                            </div>
                            <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: loading ? "30%" : "100%" }}
                                    transition={{
                                        duration: 0.7,
                                        delay: index * 0.08,
                                    }}
                                    className="h-full rounded-full bg-current opacity-60"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            {/* Main Table / Cards Card */}
            <GlassCard>
                {/* Search & Filter Toolbar */}
                <div className="grid gap-3 border-b border-white/10 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Search Input */}
                    <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search academic years"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, code, author..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-10 pr-9 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    {/* University Filter (from loaded academic years data) */}
                    <div className="relative">
                        <select
                            aria-label="Filter by university"
                            value={universityFilter}
                            onChange={(event) =>
                                setUniversityFilter(event.target.value)
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All universities</option>
                            {tableUniversities.map((uni) => (
                                <option key={uni.id} value={uni.id}>
                                    {uni.name}
                                    {uni.code ? ` (${uni.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by status"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as StatusFilter)
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ENABLE">Active (Enabled)</option>
                            <option value="DISABLE">Inactive (Disabled)</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Current Year Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by current session"
                            value={currentFilter}
                            onChange={(event) => setCurrentFilter(event.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">Current: All</option>
                            <option value="CURRENT">Current only</option>
                            <option value="NOT_CURRENT">Not current</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative flex items-center gap-2">
                        <div className="relative w-full">
                            <select
                                aria-label="Sort academic years"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value as SortOption)
                                }
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                            >
                                <option value="NEWEST">Highest ID first</option>
                                <option value="NAME_ASC">Name: A to Z</option>
                                <option value="NAME_DESC">Name: Z to A</option>
                                <option value="CODE_ASC">Code: A to Z</option>
                                <option value="START_DATE_DESC">Start Date: Newest</option>
                            </select>
                            <ArrowDownUp
                                size={15}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                title="Reset all filters"
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                            >
                                <RotateCcw size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ------------------------------------------------------------------ */}
                {/* View 1: Desktop Table (hidden on mobile, visible md and up)        */}
                {/* ------------------------------------------------------------------ */}
                <div className="hidden md:block w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[950px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Academic Year</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">University</th>
                                <th className="px-4 py-4 font-medium">Duration</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-4 py-4 font-medium">Current Session</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => (
                                    <tr key={`loading-${rowIndex}`}>
                                        {Array.from({ length: 8 }).map((__, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-5">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && years.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load academic years
                                        </p>
                                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                                            {pageError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadData()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : visibleYears.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleYears.map((year, index) => {
                                        const initials = getInitials(year.name);
                                        const canUpdate = hasPermission(year, "UPDATE");
                                        const canDelete = hasPermission(year, "DELETE");
                                        const canSwitch = canUpdate && !year.current;

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={year.id}
                                                initial={
                                                    reduceMotion
                                                        ? false
                                                        : { opacity: 0, x: -6 }
                                                }
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="group transition-colors hover:bg-cyan-400/[0.035]"
                                            >
                                                <td className="px-5 py-4 text-slate-500 text-xs font-mono">
                                                    {(currentPage - 1) * PAGE_SIZE +
                                                        index +
                                                        1}
                                                </td>

                                                {/* Academic Year Info + Creator Pill */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0 max-w-[240px]">
                                                            <p className="truncate font-semibold text-slate-100">
                                                                {year.name || "Unnamed Academic Year"}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                                <span className="font-mono text-[11px] text-slate-500">ID #{year.id}</span>
                                                                <span className="text-slate-600">·</span>
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                    title={`Created by: ${formatAuditActor(year.createdBy)}${year.createdAt ? ` on ${formatDate(year.createdAt)}` : ""}${year.updatedBy?.name ? ` | Modified by: ${formatAuditActor(year.updatedBy)}` : ""}`}
                                                                >
                                                                    <UserCheck size={11} className="text-emerald-400 shrink-0" />
                                                                    <span className="truncate max-w-[120px] font-medium text-slate-300">
                                                                        {year.createdBy?.name || "System"}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Code */}
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex max-w-[170px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1 font-mono text-xs text-cyan-200">
                                                        {getYearCode(year) || "—"}
                                                    </span>
                                                </td>

                                                {/* University */}
                                                <td className="px-4 py-4">
                                                    <div className="max-w-[190px]">
                                                        <p className="truncate font-medium text-slate-200">
                                                            {year.university?.name || "—"}
                                                        </p>
                                                        {year.university?.code && (
                                                            <p className="mt-0.5 truncate font-mono text-xs text-slate-400">
                                                                {year.university.code}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Duration */}
                                                <td className="px-4 py-4">
                                                    <div className="whitespace-nowrap text-xs text-slate-300">
                                                        <p className="font-medium">{formatDate(year.startDate)}</p>
                                                        <p className="mt-0.5 text-slate-500">
                                                            to {formatDate(year.endDate)}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={year.activeStatus} />
                                                </td>

                                                {/* Current Year Badge */}
                                                <td className="px-4 py-4">
                                                    {year.current ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                                            <Check size={13} />
                                                            Current
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs text-slate-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions: Strict h-8 w-8 preventing pill distortion */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("VIEW", year)}
                                                            aria-label={`View ${year.name}`}
                                                            title="View details & audit"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10 active:scale-95"
                                                        >
                                                            <Eye size={15} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("EDIT", year)}
                                                                aria-label={`Edit ${year.name}`}
                                                                title="Edit academic year"
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 active:scale-95"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                        )}

                                                        {canSwitch && (
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                onClick={() => void handleSwitch(year)}
                                                                aria-label={`Switch to current: ${year.name}`}
                                                                title="Set as current academic year"
                                                                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 text-xs font-semibold text-emerald-300 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                <RefreshCw
                                                                    size={12}
                                                                    className={
                                                                        busy
                                                                            ? "animate-spin shrink-0 text-emerald-400"
                                                                            : "shrink-0 text-emerald-400"
                                                                    }
                                                                />
                                                                <span className="hidden xl:inline">Switch</span>
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("DELETE", year)}
                                                                aria-label={`Delete ${year.name}`}
                                                                title="Delete academic year"
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-rose-400 transition hover:border-rose-400/30 hover:bg-rose-400/10 active:scale-95"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}

                                                        {!canUpdate && !canDelete && (
                                                            <span className="self-center text-xs text-slate-500">
                                                                View only
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <CalendarDays size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching academic years found"
                                                : "No academic years registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your university selection or search filters."
                                                : "Academic years will appear here after they are created."}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                                            >
                                                <RotateCcw size={14} />
                                                Clear Filters
                                            </button>
                                        )}
                                        {!hasActiveFilters &&
                                            !loading &&
                                            years.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={openCreateDialog}
                                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110"
                                                >
                                                    <Plus size={15} />
                                                    Add Academic Year
                                                </button>
                                            )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ------------------------------------------------------------------ */}
                {/* View 2: Mobile Cards (visible on mobile, hidden on md and up)      */}
                {/* ------------------------------------------------------------------ */}
                <div className="block md:hidden divide-y divide-white/5">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={`m-loading-${i}`} className="p-4 space-y-3">
                                <div className="h-5 w-3/4 animate-pulse rounded bg-white/[0.07]" />
                                <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.07]" />
                                <div className="h-8 w-full animate-pulse rounded bg-white/[0.07]" />
                            </div>
                        ))
                    ) : pageError && years.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-3">
                                <AlertTriangle size={22} />
                            </div>
                            <p className="font-semibold text-slate-200 text-sm">Failed to load</p>
                            <p className="mt-1 text-xs text-slate-400">{pageError}</p>
                            <button
                                type="button"
                                onClick={() => void loadData()}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                            >
                                <RefreshCw size={13} /> Try Again
                            </button>
                        </div>
                    ) : visibleYears.length > 0 ? (
                        visibleYears.map((year) => {
                            const initials = getInitials(year.name);
                            const canUpdate = hasPermission(year, "UPDATE");
                            const canDelete = hasPermission(year, "DELETE");
                            const canSwitch = canUpdate && !year.current;

                            return (
                                <div
                                    key={year.id}
                                    className="p-4 space-y-3.5 transition-colors hover:bg-white/[0.02]"
                                >
                                    {/* Top Header: Avatar + Name + Code + Badges */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                {initials}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-slate-100 text-sm truncate">
                                                    {year.name || "Unnamed"}
                                                </h3>
                                                <span className="font-mono text-xs text-cyan-300">
                                                    {year.code || "—"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {year.current && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                                    <Check size={11} /> Current
                                                </span>
                                            )}
                                            <StatusBadge status={year.activeStatus} />
                                        </div>
                                    </div>

                                    {/* University & Duration Row */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg border border-white/5 bg-slate-950/30 p-2">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                                                University
                                            </span>
                                            <span className="font-medium text-slate-200 truncate block mt-0.5">
                                                {year.university?.name || "—"}
                                            </span>
                                        </div>

                                        <div className="rounded-lg border border-white/5 bg-slate-950/30 p-2">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                                                Duration
                                            </span>
                                            <span className="text-slate-300 truncate block mt-0.5 text-[11px]">
                                                {formatDate(year.startDate)} – {formatDate(year.endDate)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Audit Showcase Footnote */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[110px]">
                                                {year.createdBy?.name || "System"}
                                            </span>
                                            {year.createdAt && (
                                                <span className="text-slate-500">· {formatDate(year.createdAt)}</span>
                                            )}
                                        </div>

                                        {year.updatedBy?.name && (
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="truncate max-w-[100px]">{year.updatedBy.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons Toolbar */}
                                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openDialog("VIEW", year)}
                                                aria-label={`View ${year.name}`}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300"
                                            >
                                                <Eye size={15} />
                                            </button>

                                            {canUpdate && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDialog("EDIT", year)}
                                                    aria-label={`Edit ${year.name}`}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDialog("DELETE", year)}
                                                    aria-label={`Delete ${year.name}`}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-rose-400"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>

                                        {canSwitch && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => void handleSwitch(year)}
                                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-300"
                                            >
                                                <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
                                                Switch to Current
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-sm text-slate-400">
                            No academic years found for the selected university.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        {filteredYears.length === 0
                            ? "Showing 0 academic years"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredYears.length
                            )} of ${filteredYears.length} academic years${hasActiveFilters &&
                                filteredYears.length !== years.length
                                ? ` (filtered from ${years.length})`
                                : ""
                            }`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            title="First page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsLeft size={16} />
                        </button>

                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            aria-label="Previous page"
                            title="Previous page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, index) => index + 1)
                            .filter(
                                (number) =>
                                    number === 1 ||
                                    number === totalPages ||
                                    Math.abs(number - currentPage) <= 1
                            )
                            .map((number, index, pages) => (
                                <span key={number} className="contents">
                                    {index > 0 &&
                                        number - pages[index - 1] > 1 && (
                                            <span className="px-1 text-slate-500">…</span>
                                        )}
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setPage(number)}
                                        aria-current={
                                            currentPage === number ? "page" : undefined
                                        }
                                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-medium transition ${currentPage === number
                                            ? "border-cyan-300/40 bg-gradient-to-r from-violet-600 to-blue-500 font-semibold text-white shadow-md shadow-blue-500/20"
                                            : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/10"
                                            }`}
                                    >
                                        {number}
                                    </button>
                                </span>
                            ))}

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() =>
                                setPage((value) => Math.min(totalPages, value + 1))
                            }
                            aria-label="Next page"
                            title="Next page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            title="Last page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </GlassCard>

            {/* Dialog */}
            <AnimatePresence>
                {dialog && (
                    <AcademicYearDialog
                        key={`${dialog.mode}-${dialog.year?.id ?? "new"}`}
                        mode={dialog.mode}
                        year={dialog.year}
                        defaultUniversityId={dialog.defaultUniversityId}
                        universities={universities}
                        universitiesLoading={universitiesLoading}
                        busy={busy}
                        onClose={() => {
                            if (!busy) setDialog(null);
                        }}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onSwitch={handleSwitch}
                    />
                )}
            </AnimatePresence>
        </motion.main>
    );
}
