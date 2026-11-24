import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownUp,
    Award,
    BadgeIndianRupee,
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
    Hash,
    Library,
    LoaderCircle,
    Pencil,
    Percent,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import {
    createScholarship,
    deleteScholarship,
    extractScholarshipError,
    formatAuditActor,
    formatDate,
    formatDateTime,
    getInitials,
    getScholarshipPrefix,
    getScholarships,
    getUniversityFilter,
    removePrefix,
    uniqueCommonDTOs,
    updateScholarship,
    type AmountType,
    type CommonDTO,
    type ScholarshipPermission,
    type ScholarshipRequest,
    type ScholarshipResponse,
    type ScholarshipType,
} from "@/services/financial/scholarshipService";

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type AmountFilter = "ALL" | AmountType;
type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "AMOUNT_DESC"
    | "AMOUNT_ASC";

interface ScholarshipForm {
    universityId: number | "";
    name: string;
    code: string; // Suffix only
    description: string;
    number: string;
    status: boolean;
    amountType: AmountType;
    scholarshipType: ScholarshipType;
}

interface FieldErrors {
    universityId?: string;
    name?: string;
    code?: string;
    number?: string;
    description?: string;
}

interface ScholarshipDialogProps {
    mode: DialogMode;
    scholarship: ScholarshipResponse | null;
    universities: CommonDTO[];
    universitiesLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (universityId: number, request: ScholarshipRequest) => Promise<void>;
    onUpdate: (id: number, request: ScholarshipRequest) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

const EMPTY_FORM: ScholarshipForm = {
    universityId: "",
    name: "",
    code: "",
    description: "",
    number: "10",
    status: true,
    amountType: "PERCENTAGE",
    scholarshipType: "PERMANENT",
};

/* -------------------------------------------------------------------------- */
/* Helpers & Visual Utilities                                                 */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function formatAmount(
    amount: number | null | undefined,
    type: AmountType
): string {
    const value = Number(amount);
    if (!Number.isFinite(value)) return "—";

    if (type === "PERCENTAGE") {
        return `${new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
        }).format(value)}%`;
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatScholarshipType(type?: ScholarshipType | null): string {
    if (!type) return "Permanent";
    switch (type) {
        case "PERMANENT":
            return "Permanent";
        case "ENROLLMENT":
            return "Enrollment";
        case "ONE_TIME":
            return "One Time";
        default:
            return type;
    }
}

function hasPermission(
    scholarship: ScholarshipResponse,
    action: ScholarshipPermission
): boolean {
    return (
        Array.isArray(scholarship.permissionActions) &&
        scholarship.permissionActions.includes(action)
    );
}

function SelectChevron() {
    return (
        <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function FieldError({ children }: { children?: string }) {
    if (!children) return null;
    return (
        <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 flex items-start gap-1.5 text-xs text-rose-400"
            role="alert"
        >
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </motion.p>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                active
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-400/30 bg-amber-500/10 text-amber-300"
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-emerald-400" : "bg-amber-400"
                }`}
            />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function TypeBadge({ type }: { type: ScholarshipType }) {
    let classes = "border-violet-400/25 bg-violet-500/10 text-violet-300";
    if (type === "ENROLLMENT") {
        classes = "border-cyan-400/25 bg-cyan-500/10 text-cyan-300";
    } else if (type === "ONE_TIME") {
        classes = "border-amber-400/25 bg-amber-500/10 text-amber-300";
    }

    return (
        <span
            className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${classes}`}
        >
            {formatScholarshipType(type)}
        </span>
    );
}

function GlassCard({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Modal Dialog Component                                                     */
/* -------------------------------------------------------------------------- */

function ScholarshipDialog({
    mode,
    scholarship,
    universities,
    universitiesLoading,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: ScholarshipDialogProps) {
    const reduceMotion = useReducedMotion();
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<ScholarshipForm>(() => {
        if (!scholarship) return EMPTY_FORM;
        return {
            universityId: scholarship.university?.id ?? "",
            name: scholarship.name ?? "",
            code: scholarship.code ?? "",
            description: scholarship.description ?? "",
            number: scholarship.number != null ? String(scholarship.number) : "10",
            status: Boolean(scholarship.status),
            amountType: scholarship.amountType ?? "PERCENTAGE",
            scholarshipType: scholarship.scholarshipType ?? "PERMANENT",
        };
    });

    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Handle ESC key
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    // Fetch dynamic university prefix in CREATE or resolve in EDIT
    useEffect(() => {
        let cancelled = false;
        const uId = Number(form.universityId);

        if (!Number.isFinite(uId) || uId <= 0) {
            setPrefix("");
            setPrefixError("");
            setPrefixLoading(false);
            return;
        }

        setPrefixLoading(true);
        setPrefixError("");

        getScholarshipPrefix(uId, isEdit && scholarship ? scholarship.id : undefined)
            .then((fetchedPrefix) => {
                if (!cancelled) {
                    setPrefix(fetchedPrefix);
                    if (isEdit && scholarship) {
                        setForm((prev) => ({
                            ...prev,
                            code: removePrefix(scholarship.code, fetchedPrefix),
                        }));
                    } else if (isCreate && form.code) {
                        setForm((prev) => ({
                            ...prev,
                            code: removePrefix(prev.code, fetchedPrefix),
                        }));
                    }
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setPrefix("");
                    setPrefixError(extractScholarshipError(err, "Unable to resolve university prefix."));
                }
            })
            .finally(() => {
                if (!cancelled) setPrefixLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [form.universityId, isCreate, isEdit, scholarship]);

    // In VIEW mode, code decomposition
    const viewCodeDecomposition = useMemo(() => {
        if (!isView || !scholarship) return null;
        const fullCode = scholarship.code || "";
        const uCode = scholarship.university?.code || "";

        const suffix = uCode && fullCode.startsWith(uCode)
            ? fullCode.slice(uCode.length)
            : fullCode;

        return {
            fullCode,
            prefix: uCode || "—",
            suffix: suffix || "—",
        };
    }, [isView, scholarship]);

    // Live resulting code preview
    const fullCodePreview = useMemo(() => {
        const cleanSuffix = form.code.trim().toUpperCase();
        if (!prefix && !cleanSuffix) return "—";
        return `${prefix || ""}${cleanSuffix}`;
    }, [prefix, form.code]);

    function validate(): boolean {
        const errors: FieldErrors = {};
        const uId = Number(form.universityId);
        const num = Number(form.number);

        if (isCreate) {
            if (!form.universityId || !Number.isFinite(uId) || uId <= 0) {
                errors.universityId = "Please select a university.";
            }
        }

        if (!form.name.trim()) {
            errors.name = "Scholarship name is required (e.g. Merit Excellence Grant).";
        } else if (form.name.trim().length > 150) {
            errors.name = "Scholarship name cannot exceed 150 characters.";
        }

        if (!form.code.trim()) {
            errors.code = "Scholarship code suffix is required (e.g. MERIT-10).";
        } else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) {
            errors.code = "Only alphanumeric characters, hyphens, and underscores are permitted.";
        } else if (form.code.trim().length > 60) {
            errors.code = "Code suffix cannot exceed 60 characters.";
        }

        if (!form.number.trim() || !Number.isFinite(num) || num < 0) {
            errors.number = "Enter a valid non-negative grant amount or percentage.";
        } else if (form.amountType === "PERCENTAGE" && num > 100) {
            errors.number = "Percentage cannot exceed 100%.";
        }

        if (form.description.trim().length > 2000) {
            errors.description = "Description cannot exceed 2000 characters.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setDialogError("");

        if (isDelete && scholarship) {
            try {
                await onDelete(scholarship.id);
            } catch (err) {
                setDialogError(extractScholarshipError(err));
            }
            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (!validate()) return;

        const request: ScholarshipRequest = {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim(),
            number: Number(form.number),
            status: Boolean(form.status),
            amountType: form.amountType,
            scholarshipType: form.scholarshipType,
        };

        try {
            if (isCreate) {
                await onCreate(Number(form.universityId), request);
            } else if (isEdit && scholarship) {
                await onUpdate(scholarship.id, request);
            }
        } catch (err) {
            setDialogError(extractScholarshipError(err));
        }
    }

    const titleMap: Record<DialogMode, string> = {
        CREATE: "Create Scholarship",
        EDIT: `Edit Scholarship · ${scholarship?.name ?? ""}`,
        VIEW: `Scholarship Details · ${scholarship?.name ?? ""}`,
        DELETE: `Delete Scholarship · ${scholarship?.name ?? ""}`,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
            {/* Backdrop */}
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (!busy) onClose();
                }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Dialog Container */}
            <motion.section
                role="dialog"
                aria-modal="true"
                aria-labelledby="scholarship-dialog-title"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex max-h-[94vh] sm:max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/80"
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Finance & Grants · Financial Aid
                        </p>
                        <h2
                            id="scholarship-dialog-title"
                            className="mt-0.5 text-base sm:text-lg font-bold text-white truncate"
                        >
                            {titleMap[mode]}
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

                {/* Body Content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Error Banner */}
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

                        {/* DELETE MODE */}
                        {isDelete && (
                            <div className="space-y-3.5">
                                <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 sm:p-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                                        <Trash2 size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white">
                                            Confirm Scholarship Deletion
                                        </p>
                                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                            Are you sure you want to permanently delete scholarship{" "}
                                            <strong className="text-white">{scholarship?.name}</strong>{" "}
                                            (<span className="font-mono text-cyan-300">{scholarship?.code}</span>)?
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed">
                                    <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                                        <ShieldAlert size={14} className="text-amber-400" />
                                        Enrolled Student Accounts Notice
                                    </p>
                                    <p className="mt-1 text-amber-200/90">
                                        The backend strictly blocks deleting any scholarship that is currently assigned to student fee accounts. If this grant is linked to existing student ledgers, please unassign it before deletion.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* CREATE / EDIT / VIEW MODES */}
                        {!isDelete && (
                            <>
                                {/* University Selector (CREATE) or Read-Only Card (EDIT/VIEW) */}
                                {isCreate ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label
                                                htmlFor="scholarship-university"
                                                className="text-xs font-semibold text-slate-300"
                                            >
                                                Institutional University <span className="text-cyan-400">*</span>
                                            </label>
                                            {universitiesLoading && (
                                                <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                                                    <LoaderCircle size={11} className="animate-spin" /> Loading universities...
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <select
                                                id="scholarship-university"
                                                value={form.universityId}
                                                onChange={(e) => {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        universityId: e.target.value ? Number(e.target.value) : "",
                                                    }));
                                                    if (fieldErrors.universityId) {
                                                        setFieldErrors((prev) => ({ ...prev, universityId: undefined }));
                                                    }
                                                    setDialogError("");
                                                }}
                                                disabled={busy || universitiesLoading || universities.length === 0}
                                                className={`w-full appearance-none rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition ${
                                                    fieldErrors.universityId
                                                        ? "border-rose-500/60 focus:border-rose-400"
                                                        : "border-white/10 focus:border-cyan-400/60"
                                                }`}
                                            >
                                                <option value="" className="bg-slate-900 text-slate-400">
                                                    Select university...
                                                </option>
                                                {universities.map((uni) => (
                                                    <option
                                                        key={uni.id}
                                                        value={uni.id}
                                                        className="bg-slate-900 text-white"
                                                    >
                                                        {uni.name} ({uni.code || `ID #${uni.id}`})
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        <FieldError>{fieldErrors.universityId}</FieldError>
                                    </div>
                                ) : (
                                    /* Read-only hierarchy card in EDIT / VIEW */
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Institutional University Context
                                        </p>
                                        <div className="flex items-center justify-between text-xs pt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
                                                    <Building2 size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">
                                                        {scholarship?.university?.name || "—"}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono">
                                                        Code: {scholarship?.university?.code || `ID #${scholarship?.university?.id || ""}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] text-cyan-200">
                                                Prefix: {prefix || scholarship?.university?.code || "—"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Scholarship Name */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label
                                            htmlFor="scholarship-name"
                                            className="text-xs font-semibold text-slate-300"
                                        >
                                            Scholarship Program Name <span className="text-cyan-400">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-500">{form.name.length}/150</span>
                                    </div>
                                    <input
                                        id="scholarship-name"
                                        value={form.name}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, name: e.target.value }));
                                            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                                            setDialogError("");
                                        }}
                                        readOnly={readOnly || busy}
                                        maxLength={150}
                                        placeholder="e.g. Academic Merit Excellence Grant"
                                        className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 ${
                                            fieldErrors.name
                                                ? "border-rose-500/60 focus:border-rose-400"
                                                : "border-white/10 focus:border-cyan-400/60"
                                        } read-only:opacity-75 disabled:opacity-50`}
                                    />
                                    <FieldError>{fieldErrors.name}</FieldError>
                                </div>

                                {/* Scholarship Code Input with Dynamic Prefix Badge (CREATE / EDIT) */}
                                {!isView && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor="scholarship-code-suffix"
                                                className="text-xs font-semibold text-slate-300"
                                            >
                                                Scholarship Code (Suffix) <span className="text-cyan-400">*</span>
                                            </label>
                                            {prefixLoading && (
                                                <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                                                    <LoaderCircle size={11} className="animate-spin" /> Resolving prefix...
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex rounded-xl border border-white/10 bg-slate-950/60 overflow-hidden focus-within:border-cyan-400/60">
                                            {/* Fixed Prefix Badge */}
                                            <div className="flex items-center gap-1 bg-white/[0.04] px-3 border-r border-white/10 text-xs font-mono text-cyan-300 shrink-0 select-none">
                                                <Hash size={13} className="text-cyan-400" />
                                                <span>{prefix || "PREFIX-"}</span>
                                            </div>
                                            {/* Editable Suffix */}
                                            <input
                                                id="scholarship-code-suffix"
                                                value={form.code}
                                                onChange={(e) => {
                                                    setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                                                    if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: undefined }));
                                                    setDialogError("");
                                                }}
                                                readOnly={readOnly || busy}
                                                maxLength={60}
                                                placeholder="e.g. MERIT-10 or AID-50"
                                                className="w-full bg-transparent px-3 py-2.5 font-mono text-xs uppercase text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                                            />
                                        </div>

                                        {prefixError && (
                                            <p className="text-[11px] text-amber-300 flex items-center gap-1">
                                                <AlertCircle size={12} /> {prefixError}
                                            </p>
                                        )}
                                        <FieldError>{fieldErrors.code}</FieldError>

                                        {/* Live Preview Pill */}
                                        <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs">
                                            <span className="text-slate-400 text-[11px]">System Full Code Preview:</span>
                                            <span className="font-mono font-bold text-cyan-200">{fullCodePreview}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Code Architecture Showcase in VIEW mode */}
                                {isView && viewCodeDecomposition && (
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Code Architecture
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">University Prefix</p>
                                                <p className="mt-1 font-mono font-bold text-slate-300 truncate">
                                                    {viewCodeDecomposition.prefix}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">Scholarship Suffix</p>
                                                <p className="mt-1 font-mono font-bold text-cyan-300 truncate">
                                                    {viewCodeDecomposition.suffix}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
                                                <p className="text-[10px] text-cyan-300 uppercase">Composite System Code</p>
                                                <p className="mt-1 font-mono font-bold text-white truncate">
                                                    {viewCodeDecomposition.fullCode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Amount Type, Number, and Scholarship Type Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Amount Type */}
                                    <div>
                                        <label
                                            htmlFor="scholarship-amount-type"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            Grant Calculation <span className="text-cyan-400">*</span>
                                        </label>
                                        {isView ? (
                                            <div className="pt-1 text-xs font-medium text-slate-200">
                                                {form.amountType === "PERCENTAGE" ? "Percentage Based" : "Fixed Amount (INR)"}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    id="scholarship-amount-type"
                                                    value={form.amountType}
                                                    onChange={(e) => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            amountType: e.target.value as AmountType,
                                                        }));
                                                        setDialogError("");
                                                    }}
                                                    disabled={busy}
                                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
                                                >
                                                    <option value="PERCENTAGE" className="bg-slate-900 text-white">Percentage (%)</option>
                                                    <option value="NUMBER" className="bg-slate-900 text-white">Fixed Amount (₹)</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        )}
                                    </div>

                                    {/* Grant Number */}
                                    <div>
                                        <label
                                            htmlFor="scholarship-number"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            {form.amountType === "PERCENTAGE" ? "Percentage Value *" : "Amount (INR) *"}
                                        </label>
                                        <input
                                            id="scholarship-number"
                                            type="number"
                                            min="0"
                                            max={form.amountType === "PERCENTAGE" ? 100 : undefined}
                                            step="0.01"
                                            value={form.number}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, number: e.target.value }));
                                                if (fieldErrors.number) setFieldErrors((prev) => ({ ...prev, number: undefined }));
                                                setDialogError("");
                                            }}
                                            readOnly={readOnly || busy}
                                            placeholder={form.amountType === "PERCENTAGE" ? "e.g. 25" : "e.g. 50000"}
                                            className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 ${
                                                fieldErrors.number
                                                    ? "border-rose-500/60 focus:border-rose-400"
                                                    : "border-white/10 focus:border-cyan-400/60"
                                            } read-only:opacity-75 disabled:opacity-50`}
                                        />
                                        <FieldError>{fieldErrors.number}</FieldError>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Evaluates to: <strong className="text-emerald-300">{formatAmount(Number(form.number), form.amountType)}</strong>
                                        </p>
                                    </div>

                                    {/* Scholarship Type */}
                                    <div>
                                        <label
                                            htmlFor="scholarship-type"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            Grant Frequency <span className="text-cyan-400">*</span>
                                        </label>
                                        {isView ? (
                                            <div className="pt-1">
                                                <TypeBadge type={form.scholarshipType} />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    id="scholarship-type"
                                                    value={form.scholarshipType}
                                                    onChange={(e) => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            scholarshipType: e.target.value as ScholarshipType,
                                                        }));
                                                        setDialogError("");
                                                    }}
                                                    disabled={busy}
                                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
                                                >
                                                    <option value="PERMANENT" className="bg-slate-900 text-white">Permanent (All Sems)</option>
                                                    <option value="ENROLLMENT" className="bg-slate-900 text-white">Enrollment Period</option>
                                                    <option value="ONE_TIME" className="bg-slate-900 text-white">One Time</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label
                                            htmlFor="scholarship-description"
                                            className="text-xs font-semibold text-slate-300"
                                        >
                                            Terms & Eligibility Description
                                        </label>
                                        <span className="text-[11px] text-slate-500">{form.description.length}/2000</span>
                                    </div>
                                    <textarea
                                        id="scholarship-description"
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, description: e.target.value }));
                                            if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
                                            setDialogError("");
                                        }}
                                        readOnly={readOnly || busy}
                                        maxLength={2000}
                                        placeholder="Outline scholarship criteria, academic thresholds, and renewal conditions..."
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 read-only:opacity-75 disabled:opacity-50 resize-y"
                                    />
                                    <FieldError>{fieldErrors.description}</FieldError>
                                </div>

                                {/* Status Switch in EDIT / VIEW */}
                                {!isCreate && (
                                    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                                        <div>
                                            <p className="text-xs font-semibold text-white">
                                                Scholarship Active Status
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Enables or disables eligibility consideration for fee account allocations.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge active={form.status} />
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={form.status}
                                                    disabled={busy}
                                                    onClick={() => setForm((prev) => ({ ...prev, status: !prev.status }))}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                                                        form.status ? "bg-emerald-500" : "bg-slate-700"
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                                                            form.status ? "translate-x-5" : "translate-x-0"
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* VIEW ONLY: Exact University.tsx Audit Trail & Governance Showcase */}
                                {isView && scholarship && (
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2.5 pt-3 border-t border-white/10">
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
                                                    {scholarship.createdAt && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(scholarship.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                        {getInitials(scholarship.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {scholarship.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(scholarship.createdBy?.code || scholarship.createdBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {scholarship.createdBy.code
                                                                    ? `Code: ${scholarship.createdBy.code}`
                                                                    : `ID: #${scholarship.createdBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {scholarship.createdAt && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(scholarship.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Last Modified By Card */}
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <RotateCcw size={11} /> Last Modified By
                                                    </span>
                                                    {(scholarship.updatedAt || scholarship.createdAt) && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(scholarship.updatedAt || scholarship.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                        {getInitials(scholarship.updatedBy?.name || scholarship.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {scholarship.updatedBy?.name || scholarship.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(scholarship.updatedBy?.code || scholarship.updatedBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {scholarship.updatedBy.code
                                                                    ? `Code: ${scholarship.updatedBy.code}`
                                                                    : `ID: #${scholarship.updatedBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(scholarship.updatedAt || scholarship.createdAt) && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(scholarship.updatedAt || scholarship.createdAt)}</span>
                                                    </div>
                                                )}
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
                                    disabled={busy || prefixLoading || (isCreate && (universities.length === 0 || !prefix))}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                                        isDelete
                                            ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                            : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                    }`}
                                >
                                    {busy && <LoaderCircle size={14} className="animate-spin" />}
                                    <span>
                                        {isDelete
                                            ? "Delete Scholarship"
                                            : isEdit
                                                ? "Save Changes"
                                                : "Create Scholarship"}
                                    </span>
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
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function Scholarships() {
    const reduceMotion = useReducedMotion();

    // Data States
    const [scholarships, setScholarships] = useState<ScholarshipResponse[]>([]);
    const [universities, setUniversities] = useState<CommonDTO[]>([]);

    // Loading & Feedback
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [universitiesLoading, setUniversitiesLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Modal Dialog State
    const [dialogState, setDialogState] = useState<{
        mode: DialogMode;
        scholarship: ScholarshipResponse | null;
    } | null>(null);

    // Filter States
    const [search, setSearch] = useState("");
    const [universityFilter, setUniversityFilter] = useState<number | "ALL">("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [amountTypeFilter, setAmountTypeFilter] = useState<AmountFilter>("ALL");
    const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);

    // Initial Data Fetch
    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setPageError("");

        try {
            const data = await getScholarships();
            setScholarships(data);
        } catch (err) {
            setPageError(extractScholarshipError(err, "Failed to load scholarship schemes."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadUniversities = useCallback(async () => {
        setUniversitiesLoading(true);
        try {
            const list = await getUniversityFilter();
            setUniversities(uniqueCommonDTOs(list));
        } catch (err) {
            console.warn("Failed to preload universities for scholarship creation:", err);
        } finally {
            setUniversitiesLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
        void loadUniversities();
    }, [loadData, loadUniversities]);

    // Clear notices after 5 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    // Unique Universities derived dynamically from loaded scholarships
    const universityOptions = useMemo(() => {
        return uniqueCommonDTOs(scholarships.map((s) => s.university));
    }, [scholarships]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        universityFilter,
        statusFilter,
        typeFilter,
        amountTypeFilter,
        sortBy,
    ]);

    // Filter & Sort
    const filteredScholarships = useMemo(() => {
        const q = text(search);

        return scholarships.filter((s) => {
            if (q) {
                const sName = text(s.name);
                const sCode = text(s.code);
                const sDesc = text(s.description);
                const uName = text(s.university?.name);
                if (
                    !sName.includes(q) &&
                    !sCode.includes(q) &&
                    !sDesc.includes(q) &&
                    !uName.includes(q)
                ) {
                    return false;
                }
            }

            if (universityFilter !== "ALL" && s.university?.id !== universityFilter) {
                return false;
            }

            if (statusFilter === "ACTIVE" && !s.status) return false;
            if (statusFilter === "INACTIVE" && s.status) return false;

            if (typeFilter !== "ALL" && s.scholarshipType !== typeFilter) {
                return false;
            }

            if (amountTypeFilter !== "ALL" && s.amountType !== amountTypeFilter) {
                return false;
            }

            return true;
        });
    }, [
        scholarships,
        search,
        universityFilter,
        statusFilter,
        typeFilter,
        amountTypeFilter,
    ]);

    const sortedScholarships = useMemo(() => {
        return [...filteredScholarships].sort((a, b) => {
            switch (sortBy) {
                case "NAME_ASC":
                    return (a.name || "").localeCompare(b.name || "");
                case "NAME_DESC":
                    return (b.name || "").localeCompare(a.name || "");
                case "AMOUNT_DESC":
                    return (b.number ?? 0) - (a.number ?? 0);
                case "AMOUNT_ASC":
                    return (a.number ?? 0) - (b.number ?? 0);
                case "NEWEST":
                default:
                    return b.id - a.id;
            }
        });
    }, [filteredScholarships, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedScholarships.length / PAGE_SIZE));
    const paginatedScholarships = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedScholarships.slice(start, start + PAGE_SIZE);
    }, [sortedScholarships, currentPage]);

    // Statistics
    const metrics = useMemo(() => {
        const total = scholarships.length;
        const active = scholarships.filter((s) => s.status).length;
        const inactive = scholarships.filter((s) => !s.status).length;
        const percentageBased = scholarships.filter((s) => s.amountType === "PERCENTAGE").length;
        return { total, active, inactive, percentageBased };
    }, [scholarships]);

    const hasActiveFilters =
        Boolean(search.trim()) ||
        universityFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        typeFilter !== "ALL" ||
        amountTypeFilter !== "ALL" ||
        sortBy !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setUniversityFilter("ALL");
        setStatusFilter("ALL");
        setTypeFilter("ALL");
        setAmountTypeFilter("ALL");
        setSortBy("NEWEST");
    }

    // Modal Operations
    function openDialog(mode: DialogMode, scholarship: ScholarshipResponse | null = null) {
        setDialogState({ mode, scholarship });
    }

    function closeDialog() {
        setDialogState(null);
    }

    async function handleCreate(universityId: number, request: ScholarshipRequest) {
        setBusy(true);
        try {
            const created = await createScholarship(universityId, request);
            setScholarships((prev) => [created, ...prev]);
            closeDialog();
            setNotice(`Scholarship "${created.name}" created successfully.`);
            toast.success("Scholarship scheme created successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(id: number, request: ScholarshipRequest) {
        setBusy(true);
        try {
            const updated = await updateScholarship(id, request);
            setScholarships((prev) => prev.map((s) => (s.id === id ? updated : s)));
            closeDialog();
            setNotice(`Scholarship "${updated.name}" updated successfully.`);
            toast.success("Scholarship scheme updated successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setBusy(true);
        try {
            const msg = await deleteScholarship(id);
            setScholarships((prev) => prev.filter((s) => s.id !== id));
            closeDialog();
            setNotice(msg);
            toast.success(msg);
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-5 p-3 text-slate-100 sm:space-y-6 sm:p-5 lg:p-7"
        >
            {/* Header & Breadcrumbs */}
            <section className="space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span className="truncate">Financial Administration</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Scholarships</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Grants & Financial Aid Allocations
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Scholarships
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Configure institutional scholarships, establish fee remission percentages, and govern financial aid eligibility criteria.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            title="Refresh scholarships list"
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
                            <span>Add Scholarship</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Alert / Notice Banner */}
            <AnimatePresence>
                {(pageError || notice) && (
                    <motion.div
                        role={pageError ? "alert" : "status"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm ${
                            pageError
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
                                    onClick={() => void loadData()}
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

            {/* Metric Statistics Cards */}
            <section
                aria-label="Scholarship statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    {
                        label: "Total Scholarships",
                        value: metrics.total,
                        sub: "Across all institutions",
                        icon: Award,
                        color: "from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30",
                    },
                    {
                        label: "Active Schemes",
                        value: metrics.active,
                        sub: "Currently grant-eligible",
                        icon: ShieldCheck,
                        color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
                    },
                    {
                        label: "Inactive Schemes",
                        value: metrics.inactive,
                        sub: "Suspended or archived",
                        icon: GraduationCap,
                        color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
                    },
                    {
                        label: "Percentage Grants",
                        value: metrics.percentageBased,
                        sub: "Tuition percentage waiver",
                        icon: BadgeIndianRupee,
                        color: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30",
                    },
                ].map((stat) => (
                    <GlassCard key={stat.label} className="p-3.5 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-400">
                                {stat.label}
                            </span>
                            <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border bg-gradient-to-br ${stat.color}`}>
                                <stat.icon size={17} />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                                {stat.value.toLocaleString("en-IN")}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 truncate">{stat.sub}</p>
                    </GlassCard>
                ))}
            </section>

            {/* Filter Toolbar Card */}
            <GlassCard className="p-3.5 sm:p-4">
                <div className="space-y-3">
                    {/* Top Row: Search + University + Sort + Reset */}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search scholarship name, code, description, university..."
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* University Filter (derived from loaded scholarships) */}
                        <div className="relative min-w-[150px]">
                            <select
                                value={universityFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setUniversityFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Universities</option>
                                {universityOptions.map((u) => (
                                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Sort Order */}
                        <div className="relative min-w-[150px]">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="NEWEST" className="bg-slate-900 text-white">Newest First</option>
                                <option value="NAME_ASC" className="bg-slate-900 text-white">Name (A-Z)</option>
                                <option value="NAME_DESC" className="bg-slate-900 text-white">Name (Z-A)</option>
                                <option value="AMOUNT_DESC" className="bg-slate-900 text-white">Award (High-Low)</option>
                                <option value="AMOUNT_ASC" className="bg-slate-900 text-white">Award (Low-High)</option>
                            </select>
                            <ArrowDownUp size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                title="Reset all filters"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white shrink-0"
                            >
                                <RotateCcw size={13} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>

                    {/* Secondary Row: Status, Type, and Amount Type Filters */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
                                <option value="ACTIVE" className="bg-slate-900 text-white">Active Only</option>
                                <option value="INACTIVE" className="bg-slate-900 text-white">Inactive Only</option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Frequency Type */}
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Frequencies</option>
                                <option value="PERMANENT" className="bg-slate-900 text-white">Permanent</option>
                                <option value="ENROLLMENT" className="bg-slate-900 text-white">Enrollment</option>
                                <option value="ONE_TIME" className="bg-slate-900 text-white">One Time</option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Amount Type */}
                        <div className="relative">
                            <select
                                value={amountTypeFilter}
                                onChange={(e) => setAmountTypeFilter(e.target.value as AmountFilter)}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Types</option>
                                <option value="PERCENTAGE" className="bg-slate-900 text-white">Percentage (%)</option>
                                <option value="NUMBER" className="bg-slate-900 text-white">Fixed Amount (₹)</option>
                            </select>
                            <SelectChevron />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* List Presentation & Dual-View */}
            <GlassCard>
                {/* Desktop Table View (hidden on sm/mobile) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th scope="col" className="px-5 py-4 w-12 text-center">#</th>
                                <th scope="col" className="px-4 py-4 min-w-[220px]">Scholarship & Creator</th>
                                <th scope="col" className="px-4 py-4 min-w-[140px]">Code</th>
                                <th scope="col" className="px-4 py-4 min-w-[160px]">University</th>
                                <th scope="col" className="px-4 py-4">Frequency</th>
                                <th scope="col" className="px-4 py-4 text-center">Award Value</th>
                                <th scope="col" className="px-4 py-4">Status</th>
                                <th scope="col" className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="inline-flex flex-col items-center justify-center gap-3">
                                            <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                                            <p className="font-semibold text-slate-200">Loading scholarships...</p>
                                            <p className="text-xs text-slate-400">Fetching financial aid schemes and grant criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageError && scholarships.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">Failed to load scholarships</p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">{pageError}</p>
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
                            ) : paginatedScholarships.length > 0 ? (
                                paginatedScholarships.map((s, index) => {
                                    const canEdit = hasPermission(s, "UPDATE");
                                    const canDelete = hasPermission(s, "DELETE");

                                    return (
                                        <motion.tr
                                            key={s.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.035]"
                                        >
                                            {/* Index */}
                                            <td className="px-5 py-4 text-slate-500 text-xs text-center">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>

                                            {/* Name & Creator Pill (Matching University.tsx) */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                        {getInitials(s.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {s.name || "Unnamed Scholarship"}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                ID #{s.id}
                                                            </span>
                                                            <span className="text-slate-600">·</span>
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                title={`Created by: ${formatAuditActor(s.createdBy)}${s.createdAt ? ` on ${formatDate(s.createdAt)}` : ""}${s.updatedBy?.name ? ` | Modified by: ${formatAuditActor(s.updatedBy)}` : ""}`}
                                                            >
                                                                <UserCheck size={11} className="text-emerald-400 shrink-0" />
                                                                <span className="truncate max-w-[120px] font-medium text-slate-300">
                                                                    {s.createdBy?.name || "System"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Code Badge */}
                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-200">
                                                    {s.code || "—"}
                                                </span>
                                            </td>

                                            {/* University */}
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-200">
                                                        {s.university?.name || "—"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 font-mono">
                                                        {s.university?.code || `ID #${s.university?.id || ""}`}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Frequency Type */}
                                            <td className="px-4 py-4">
                                                <TypeBadge type={s.scholarshipType} />
                                            </td>

                                            {/* Award Value */}
                                            <td className="px-4 py-4 text-center">
                                                <p className="font-bold text-emerald-300 text-sm">
                                                    {formatAmount(s.number, s.amountType)}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {s.amountType === "PERCENTAGE" ? "Tuition Waiver" : "Direct Grant"}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-4">
                                                <StatusBadge active={s.status} />
                                            </td>

                                            {/* Actions with strict h-8 w-8 shrink-0 */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("VIEW", s)}
                                                        aria-label={`View details of ${s.name}`}
                                                        title="View scholarship details"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("EDIT", s)}
                                                            aria-label={`Edit ${s.name}`}
                                                            title="Edit scholarship"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("DELETE", s)}
                                                            aria-label={`Delete ${s.name}`}
                                                            title="Delete scholarship"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/20"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Award size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters ? "No matching scholarships found" : "No scholarships registered yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search terms or clearing your filters."
                                                : "Get started by creating your institution's first scholarship scheme."}
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
                                                    Add Scholarship
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View (sm:hidden) */}
                <div className="divide-y divide-white/5 sm:hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <LoaderCircle size={28} className="animate-spin text-cyan-400 mx-auto" />
                            <p className="mt-3 text-xs font-semibold text-slate-200">Loading scholarships...</p>
                        </div>
                    ) : pageError && scholarships.length === 0 ? (
                        <div className="p-6 text-center">
                            <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                            <p className="mt-2 text-xs font-semibold text-white">Failed to load scholarships</p>
                            <button
                                type="button"
                                onClick={() => void loadData()}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                            >
                                <RefreshCw size={13} /> Retry
                            </button>
                        </div>
                    ) : paginatedScholarships.length > 0 ? (
                        paginatedScholarships.map((s) => {
                            const canEdit = hasPermission(s, "UPDATE");
                            const canDelete = hasPermission(s, "DELETE");

                            return (
                                <article key={s.id} className="p-3.5 space-y-3">
                                    {/* Header: Name + Code + Status */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-white text-sm truncate">{s.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="font-mono text-xs text-cyan-300 font-semibold">{s.code}</span>
                                                <span className="text-slate-500 text-xs">·</span>
                                                <span className="text-slate-400 font-mono text-[11px]">ID #{s.id}</span>
                                            </div>
                                        </div>
                                        <StatusBadge active={s.status} />
                                    </div>

                                    {/* University & Award Details */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">University:</span>
                                            <span className="font-medium text-white truncate max-w-[200px]">{s.university?.name || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Award Amount:</span>
                                            <span className="font-bold text-emerald-300">{formatAmount(s.number, s.amountType)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Frequency:</span>
                                            <TypeBadge type={s.scholarshipType} />
                                        </div>
                                    </div>

                                    {/* Description excerpt */}
                                    {s.description && (
                                        <p className="line-clamp-2 text-xs text-slate-400 leading-relaxed">
                                            {s.description}
                                        </p>
                                    )}

                                    {/* Mobile Audit Showcase Pill (matching University.tsx) */}
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                {s.createdBy?.name || "System"}
                                            </span>
                                            {s.createdAt && (
                                                <span className="text-slate-500 font-mono text-[10px]">
                                                    · {formatDate(s.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {s.updatedBy?.name && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="text-slate-500">Updated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {s.updatedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => openDialog("VIEW", s)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                                        >
                                            <Eye size={13} /> Details
                                        </button>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("EDIT", s)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("DELETE", s)}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-xs text-slate-400">
                            No scholarships match your criteria.
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {sortedScholarships.length === 0
                            ? "Showing 0 scholarships"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                                  currentPage * PAGE_SIZE,
                                  sortedScholarships.length
                              )} of ${sortedScholarships.length} scholarship${
                                  sortedScholarships.length === 1 ? "" : "s"
                              }`}
                    </p>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Scholarship pagination"
                            className="flex items-center justify-center gap-1"
                        >
                            <button
                                type="button"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                aria-label="First page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <span className="px-3 text-xs font-semibold text-slate-300">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                aria-label="Next page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                aria-label="Last page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </nav>
                    )}
                </footer>
            </GlassCard>

            {/* Modal Dialog */}
            <AnimatePresence>
                {dialogState && (
                    <ScholarshipDialog
                        mode={dialogState.mode}
                        scholarship={dialogState.scholarship}
                        universities={universities}
                        universitiesLoading={universitiesLoading}
                        busy={busy}
                        onClose={closeDialog}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
