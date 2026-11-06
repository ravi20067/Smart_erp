// src/pages/AcademicYears.tsx

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
    BookOpen,
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock3,
    Eye,
    GraduationCap,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Star,
    Trash2,
    X,
} from "lucide-react";

import {
    createAcademicYear,
    deleteAcademicYear,
    extractEditableCode,
    extractErrorMessage,
    getAllAcademicYears,
    getAcademicYearPostfix,
    getDepartmentFilter,
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
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "CODE_ASC";

interface YearForm {
    departmentId: number | "";
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    activeStatus: ActiveStatus;
}

interface FormErrors {
    departmentId?: string;
    name?: string;
    code?: string;
    startDate?: string;
    endDate?: string;
    activeStatus?: string;
}

const PAGE_SIZE = 5;

const EMPTY_FORM: YearForm = {
    departmentId: "",
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    activeStatus: "ENABLE",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-IN").format(value);
}

function formatDate(value?: string | null): string {
    if (!value) return "—";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getYearActions(year: AcademicYearResponse): PermissionAction[] {
    return Array.isArray(year.permissionActions)
        ? year.permissionActions
        : [];
}

function getYearCode(year: AcademicYearResponse): string {
    return typeof year.code === "string" ? year.code : "";
}

function getDepartmentId(year: AcademicYearResponse): number | null {
    const id = year.department?.id;

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
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${classes}`}
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

/* -------------------------------------------------------------------------- */
/* Academic Year Dialog                                                       */
/* -------------------------------------------------------------------------- */

interface YearDialogProps {
    mode: DialogMode;
    year: AcademicYearResponse | null;
    departments: CommonDTO[];
    departmentsLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (departmentId: number, request: AcademicYearRequest) => Promise<void>;
    onUpdate: (yearId: number, request: AcademicYearRequest) => Promise<void>;
    onDelete: (yearId: number) => Promise<void>;
    onSwitch?: (year: AcademicYearResponse) => Promise<void>;
}

function AcademicYearDialog({
    mode,
    year,
    departments,
    departmentsLoading,
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

    const [form, setForm] = useState<YearForm>(() => ({
        departmentId: isCreate
            ? ""
            : getDepartmentId(year as AcademicYearResponse) ?? "",
        name: year?.name ?? "",
        code: year?.code ?? "",
        startDate: year?.startDate ?? "",
        endDate: year?.endDate ?? "",
        activeStatus: year?.activeStatus ?? "ENABLE",
    }));

    const [postfix, setPostfix] = useState("");
    const [codeLoading, setCodeLoading] = useState(false);
    const [codeError, setCodeError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

    /*
     * Postfix is fetched from the backend.
     *
     * Display: EDITABLE CODE | POSTFIX
     * Payload: EDITABLE CODE only.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadCodeParts() {
            const departmentId = Number(
                isCreate ? form.departmentId : year?.department?.id
            );

            setPostfix("");
            setCodeError("");

            if (!Number.isFinite(departmentId) || departmentId <= 0) {
                setCodeLoading(false);
                return;
            }

            setCodeLoading(true);

            try {
                const loadedPostfix = await getAcademicYearPostfix(
                    departmentId,
                    isEdit && year ? year.id : undefined
                );

                if (cancelled) return;

                setPostfix(loadedPostfix);

                if (isEdit && year) {
                    setForm((current) => ({
                        ...current,
                        code: extractEditableCode(
                            getYearCode(year),
                            loadedPostfix
                        ),
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    setCodeError(extractErrorMessage(error));
                }
            } finally {
                if (!cancelled) setCodeLoading(false);
            }
        }

        if (isCreate || isEdit) {
            void loadCodeParts();
        } else {
            setCodeLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [
        isCreate,
        isEdit,
        form.departmentId,
        year?.id,
        year?.department?.id,
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
            const departmentId = Number(form.departmentId);

            if (!form.departmentId || departmentId <= 0) {
                errors.departmentId = "Please select a department.";
            } else if (!departments.some((item) => item.id === departmentId)) {
                errors.departmentId =
                    "The selected department is no longer available. Reload the options.";
            }
        }

        if (!name) {
            errors.name = "Academic year name is required.";
        } else if (name.length < 2) {
            errors.name = "Name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "Name cannot exceed 150 characters.";
        }

        if (!postfix) {
            errors.code = "The fixed postfix could not be loaded.";
        } else if (!code) {
            errors.code = "The editable code is required.";
        } else if (code.length > 40) {
            errors.code = "Editable code cannot exceed 40 characters.";
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
                        lower.includes("cannot delete")
                        ? "This academic year has related records. Remove or reassign those records before deleting it."
                        : message
                );
            }

            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (codeLoading) {
            setDialogError("Please wait while the fixed code parts load.");
            return;
        }

        if (codeError) {
            setDialogError(codeError);
            return;
        }

        if (!validate()) return;

        const request: AcademicYearRequest = {
            name: form.name.trim(),
            // Never send the postfix.
            code: form.code.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
            activeStatus: form.activeStatus,
        };

        try {
            if (isCreate) {
                await onCreate(Number(form.departmentId), request);
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
                                        . This operation may be blocked if
                                        related records exist.
                                    </p>
                                    <p className="mt-2 break-all font-mono text-xs text-cyan-300">
                                        {year?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isCreate && (
                                <div>
                                    <label
                                        htmlFor="academic-year-department"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Department{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="academic-year-department"
                                            value={form.departmentId}
                                            onChange={(event) => {
                                                changeField(
                                                    "departmentId",
                                                    event.target.value
                                                        ? Number(event.target.value)
                                                        : ""
                                                );
                                                changeField("code", "");
                                            }}
                                            disabled={
                                                busy ||
                                                departmentsLoading ||
                                                departments.length === 0
                                            }
                                            className={`${inputClass} appearance-none pr-10`}
                                        >
                                            <option value="">
                                                {departmentsLoading
                                                    ? "Loading departments..."
                                                    : "Select department"}
                                            </option>

                                            {departments.map((department) => (
                                                <option
                                                    key={department.id}
                                                    value={department.id}
                                                >
                                                    {department.name}
                                                    {department.code
                                                        ? ` (${department.code})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                    </div>

                                    <FieldError>
                                        {fieldErrors.departmentId}
                                    </FieldError>

                                    {!departmentsLoading &&
                                        departments.length === 0 && (
                                            <p className="mt-2 text-xs text-amber-300">
                                                No departments are available.
                                                Academic year creation is unavailable.
                                            </p>
                                        )}
                                </div>
                            )}

                            {!isCreate && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Department
                                    </label>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                                        <p className="font-medium text-white">
                                            {year?.department?.name ?? "—"}
                                        </p>
                                        {year?.department?.code && (
                                            <p className="mt-1 font-mono text-xs text-cyan-300">
                                                {year.department.code}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

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

                            <div>
                                <label
                                    htmlFor="academic-year-code"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Academic Year Code{" "}
                                    <span className="text-cyan-400">*</span>
                                </label>

                                {isCreate || isEdit ? (
                                    <div className="flex min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                        {/* Editable code: LEFT */}
                                        <input
                                            id="academic-year-code"
                                            value={form.code}
                                            onChange={(event) =>
                                                changeField(
                                                    "code",
                                                    event.target.value.toUpperCase()
                                                )
                                            }
                                            readOnly={busy}
                                            maxLength={40}
                                            placeholder="2026"
                                            className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 sm:px-4"
                                        />

                                        {/* Fixed postfix: RIGHT */}
                                        <div className="flex max-w-[45%] shrink-0 items-center border-l border-white/10 bg-white/[0.04] px-3 font-mono text-xs text-cyan-300 sm:px-4 sm:text-sm">
                                            <span className="truncate">
                                                {codeLoading ? "Loading…" : postfix || "POSTFIX"}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        id="academic-year-code"
                                        value={form.code}
                                        readOnly
                                        className={inputClass}
                                    />
                                )}

                                <FieldError>
                                    {fieldErrors.code || codeError}
                                </FieldError>

                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    The postfix is generated by the backend
                                    from the selected department and placed on the
                                    right. Only the code before the postfix is entered.
                                </p>

                                {!codeLoading && postfix && (
                                    <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Preview
                                        </p>
                                        <p className="mt-1 break-all font-mono text-sm text-cyan-200">
                                            {form.code.trim() || "CODE"}
                                            {postfix}
                                        </p>
                                    </div>
                                )}
                            </div>

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

                            {isView && year && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Academic Year Information
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <InfoTile label="ID" value={String(year.id)} />
                                        <InfoTile
                                            label="Current Year"
                                            value={year.current ? "Yes" : "No"}
                                        />
                                        <InfoTile
                                            label="School"
                                            value={year.school?.name ?? "—"}
                                        />
                                        <InfoTile
                                            label="University"
                                            value={year.university?.name ?? "—"}
                                        />
                                        <InfoTile
                                            label="Courses"
                                            value={
                                                year.courses?.map((item) => item.name).join(", ") ||
                                                "—"
                                            }
                                        />
                                        <InfoTile
                                            label="Permissions"
                                            value={getYearActions(year).join(", ") || "View only"}
                                        />
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
                                        (departmentsLoading ||
                                            departments.length === 0))
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

function InfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-medium text-white">
                {value}
            </p>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Academic Year Page                                                    */
/* -------------------------------------------------------------------------- */

export default function AcademicYears() {
    const reduceMotion = useReducedMotion();

    const [years, setYears] = useState<AcademicYearResponse[]>([]);
    const [departmentsForCreate, setDepartmentsForCreate] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [departmentsLoading, setDepartmentsLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [departmentOptionsError, setDepartmentOptionsError] = useState("");
    const [notice, setNotice] = useState("");

    /* Table filters are all local; they never make filter API calls. */
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [currentFilter, setCurrentFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        year: AcademicYearResponse | null;
    } | null>(null);

    /* ---------------------------------------------------------------------- */
    /* Load academic years                                                     */
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

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!notice) return;

        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    /* ---------------------------------------------------------------------- */
    /* Load department options only for creation                              */
    /* ---------------------------------------------------------------------- */

    const loadDepartmentOptions = useCallback(async () => {
        setDepartmentsLoading(true);
        setDepartmentOptionsError("");

        try {
            const result = await getDepartmentFilter();
            const options = uniqueDTOs(result);
            setDepartmentsForCreate(options);
            return options;
        } catch (error) {
            const message = extractErrorMessage(error);
            setDepartmentOptionsError(message);
            toast.error(`Could not load department options: ${message}`);
            throw error;
        } finally {
            setDepartmentsLoading(false);
        }
    }, []);

    async function openCreateDialog() {
        setPageError("");
        setNotice("");

        try {
            const options = await loadDepartmentOptions();

            if (options.length === 0) {
                toast.error(
                    "No departments are available. An academic year cannot be created."
                );
                return;
            }

            setDialog({ mode: "CREATE", year: null });
        } catch {
            // The department-options error is displayed separately.
        }
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
    /* Derive table filter options from the loaded academic-year data          */
    /* ---------------------------------------------------------------------- */

    const tableUniversities = useMemo(
        () => uniqueDTOs(years.map((year) => year.university)),
        [years]
    );

    const tableSchools = useMemo(
        () => uniqueDTOs(years.map((year) => year.school)),
        [years]
    );

    const tableDepartments = useMemo(
        () => uniqueDTOs(years.map((year) => year.department)),
        [years]
    );

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
                label: "Current Academic Years",
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
                normalizeText(year.department?.name).includes(query) ||
                normalizeText(year.department?.code).includes(query) ||
                normalizeText(year.school?.name).includes(query) ||
                normalizeText(year.university?.name).includes(query) ||
                (Array.isArray(year.courses) &&
                    year.courses.some((course) =>
                        normalizeText(course.name).includes(query)
                    ));

            const matchesStatus =
                statusFilter === "ALL" || year.activeStatus === statusFilter;

            const matchesUniversity =
                universityFilter === "ALL" ||
                year.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                year.school?.id === Number(schoolFilter);

            const matchesDepartment =
                departmentFilter === "ALL" ||
                year.department?.id === Number(departmentFilter);

            const matchesCurrent =
                currentFilter === "ALL" ||
                (currentFilter === "CURRENT" && year.current === true) ||
                (currentFilter === "NOT_CURRENT" && year.current !== true);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment &&
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

            return (b.id ?? 0) - (a.id ?? 0);
        });

        return result;
    }, [
        years,
        search,
        statusFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
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
        schoolFilter,
        departmentFilter,
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
        schoolFilter !== "ALL" ||
        departmentFilter !== "ALL" ||
        currentFilter !== "ALL" ||
        sort !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setCurrentFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    /* ---------------------------------------------------------------------- */
    /* CRUD handlers                                                          */
    /* ---------------------------------------------------------------------- */

    async function handleCreate(
        departmentId: number,
        request: AcademicYearRequest
    ) {
        setBusy(true);

        try {
            await createAcademicYear(departmentId, request);

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
        const departmentId = getDepartmentId(year);

        if (!departmentId) {
            toast.error("Cannot switch this academic year: department ID is missing.");
            return;
        }

        if (year.current) {
            toast.info("This academic year is already current.");
            return;
        }

        const confirmed = window.confirm(
            `Switch the current academic year to "${year.name}"?`
        );

        if (!confirmed) return;

        setBusy(true);

        try {
            const message = await switchAcademicYear(departmentId, year.id);
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
                            Manage academic sessions, review institutional
                            associations, and switch the current academic year.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
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
                            onClick={() => void openCreateDialog()}
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

                {departmentOptionsError && (
                    <ErrorBanner
                        title="Department options unavailable"
                        message={departmentOptionsError}
                        onRetry={() =>
                            void loadDepartmentOptions().catch(() => undefined)
                        }
                        onDismiss={() => setDepartmentOptionsError("")}
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

            {/* Table and local filters */}
            <GlassCard>
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 xl:grid-cols-3 2xl:grid-cols-[minmax(220px,1.5fr)_160px_180px_180px_180px_170px_170px_auto]">
                    {/* Search by name and code, plus related fields */}
                    <div className="relative min-w-0">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search academic years by name or code"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, code, department..."
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
                            <option value="ENABLE">Active</option>
                            <option value="DISABLE">Inactive</option>
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Filter by university"
                            value={universityFilter}
                            onChange={(event) => setUniversityFilter(event.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All universities</option>
                            {tableUniversities.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Filter by school"
                            value={schoolFilter}
                            onChange={(event) => setSchoolFilter(event.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All schools</option>
                            {tableSchools.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Filter by department"
                            value={departmentFilter}
                            onChange={(event) => setDepartmentFilter(event.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All departments</option>
                            {tableDepartments.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Filter by current year"
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

                    <div className="relative">
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[1150px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Academic Year</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Department</th>
                                <th className="px-4 py-4 font-medium">School / University</th>
                                <th className="px-4 py-4 font-medium">Duration</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-4 py-4 font-medium">Current</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => (
                                    <tr key={`loading-${rowIndex}`}>
                                        {Array.from({ length: 9 }).map((__, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-5">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && years.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
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
                                        const initials =
                                            (year.name || "AY")
                                                .trim()
                                                .split(/\s+/)
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase() || "AY";

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
                                                <td className="px-5 py-5 text-slate-500">
                                                    {(currentPage - 1) * PAGE_SIZE +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-cyan-200">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-xs truncate font-semibold text-slate-100">
                                                                {year.name || "Unnamed Academic Year"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                ID: {year.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <span className="inline-flex max-w-[190px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {getYearCode(year) || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="max-w-[190px]">
                                                        <p className="truncate font-medium text-slate-200">
                                                            {year.department?.name || "—"}
                                                        </p>
                                                        {year.department?.code && (
                                                            <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                                {year.department.code}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="max-w-[210px]">
                                                        <p className="truncate font-medium text-slate-200">
                                                            {year.school?.name || "—"}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-slate-500">
                                                            {year.university?.name || "—"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="whitespace-nowrap text-xs text-slate-300">
                                                        <p>{formatDate(year.startDate)}</p>
                                                        <p className="mt-1 text-slate-500">
                                                            to {formatDate(year.endDate)}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <StatusBadge status={year.activeStatus} />
                                                </td>

                                                <td className="px-4 py-5">
                                                    {year.current ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                                                            <Check size={13} />
                                                            Current
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400">
                                                            Not Current
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("VIEW", year)}
                                                            aria-label={`View ${year.name}`}
                                                            title="View details"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={17} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("EDIT", year)}
                                                                aria-label={`Edit ${year.name}`}
                                                                title="Edit academic year"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil size={17} />
                                                            </button>
                                                        )}

                                                        {canSwitch && (
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                onClick={() => void handleSwitch(year)}
                                                                aria-label={`Switch to current academic year: ${year.name}`}
                                                                title="Set as current academic year"
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                <RefreshCw
                                                                    size={13}
                                                                    className={
                                                                        busy
                                                                            ? "animate-spin shrink-0 text-emerald-400"
                                                                            : "shrink-0 text-emerald-400"
                                                                    }
                                                                />
                                                                <span>Switch to Current</span>
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("DELETE", year)}
                                                                aria-label={`Delete ${year.name}`}
                                                                title="Delete academic year"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rose-400 transition hover:border-rose-400/30 hover:bg-rose-400/10"
                                                            >
                                                                <Trash2 size={17} />
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
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <BookOpen size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching academic years found"
                                                : "No academic years registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
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
                                                    onClick={() => void openCreateDialog()}
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
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsLeft size={17} />
                        </button>

                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            aria-label="Previous page"
                            title="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={17} />
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
                                        className={`min-w-9 rounded-lg border px-3 py-2 text-sm transition ${currentPage === number
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
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={17} />
                        </button>

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            title="Last page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsRight size={17} />
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
                        departments={departmentsForCreate}
                        departmentsLoading={departmentsLoading}
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