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
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    GraduationCap,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    X,
} from "lucide-react";

import {
    createDepartment,
    deleteDepartment,
    extractErrorMessage,
    getAllDepartments,
    getDepartmentPrefix,
    getSchoolFilter,
    updateDepartment,
    type ActiveStatus,
    type CommonDTO,
    type DepartmentCreateRequest,
    type DepartmentRequest,
    type DepartmentResponse,
    type PermissionAction,
} from "@/services/org/departmentService";

/* -------------------------------------------------------------------------- */
/* Types and constants                                                        */
/* -------------------------------------------------------------------------- */

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "CODE_ASC";

interface DepartmentForm {
    schoolId: number | "";
    name: string;
    code: string;
    activeStatus: ActiveStatus;
}

interface FieldErrors {
    schoolId?: string;
    name?: string;
    code?: string;
    activeStatus?: string;
}

interface DepartmentDialogProps {
    mode: DialogMode;
    department: DepartmentResponse | null;
    schools: CommonDTO[];
    busy: boolean;
    onClose: () => void;
    onCreate: (
        schoolId: number,
        request: DepartmentCreateRequest
    ) => Promise<void>;
    onUpdate: (request: DepartmentRequest) => Promise<void>;
    onDelete: (departmentId: number) => Promise<void>;
}

const PAGE_SIZE = 5;

const EMPTY_FORM: DepartmentForm = {
    schoolId: "",
    name: "",
    code: "",
    activeStatus: "ENABLE",
};

/* -------------------------------------------------------------------------- */
/* General helpers                                                            */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "—";
    }

    return new Intl.NumberFormat("en-IN").format(value);
}

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getDepartmentActions(
    department: DepartmentResponse
): PermissionAction[] {
    return Array.isArray(department.permissionActions)
        ? department.permissionActions
        : [];
}

function hasPermission(
    department: DepartmentResponse,
    action: PermissionAction
): boolean {
    return getDepartmentActions(department).includes(action);
}

/**
 * If the backend returns a fully prefixed code, display only its suffix
 * inside the editable input.
 */
function removePrefix(code: string | null | undefined, prefix: string): string {
    const value = (code ?? "").trim();

    if (prefix && value.startsWith(prefix)) {
        return value.slice(prefix.length).trim();
    }

    return value;
}

/**
 * The response DTO may include multiple academic years.
 * Normalize absent or malformed values to an empty array.
 */
function getAcademicYears(
    department: DepartmentResponse
): CommonDTO[] {
    return Array.isArray(department.academicYears)
        ? department.academicYears.filter(
            (item): item is CommonDTO =>
                !!item &&
                typeof item.id === "number" &&
                typeof item.name === "string"
        )
        : [];
}

/**
 * Build unique filter options from the data already loaded for the table.
 * These helpers never make API calls.
 */
function uniqueDTOs(items: Array<CommonDTO | null | undefined>): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();

    for (const item of items) {
        if (
            item &&
            Number.isFinite(item.id) &&
            item.id > 0 &&
            !unique.has(item.id)
        ) {
            unique.set(item.id, item);
        }
    }

    return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

function getStatusLabel(status: ActiveStatus | null | undefined): string {
    if (status === "ENABLE") return "Active";
    if (status === "DISABLE") return "Inactive";
    return "Unknown";
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function GlassCard({
    children,
    className = "",
}: {
    children: ReactNode;
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

function StatusBadge({
    status,
}: {
    status: ActiveStatus | null | undefined;
}) {
    const active = status === "ENABLE";
    const inactive = status === "DISABLE";

    const classes = active
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
        : inactive
            ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
            : "border-slate-400/30 bg-slate-500/10 text-slate-300";

    const dotClasses = active
        ? "bg-emerald-400"
        : inactive
            ? "bg-amber-400"
            : "bg-slate-400";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${classes}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${dotClasses}`} />
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
/* Department dialog                                                           */
/* -------------------------------------------------------------------------- */

function DepartmentDialog({
    mode,
    department,
    schools,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: DepartmentDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<DepartmentForm>(() => ({
        schoolId:
            department?.school?.id &&
                Number.isFinite(department.school.id)
                ? department.school.id
                : "",
        name: department?.name ?? "",
        code: department?.code ?? "",
        activeStatus: department?.activeStatus ?? "ENABLE",
    }));

    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const title: Record<DialogMode, string> = {
        CREATE: "Create Department",
        EDIT: "Edit Department",
        VIEW: "Department Details",
        DELETE: "Delete Department",
    };

    const selectedSchool = schools.find(
        (school) => school.id === Number(form.schoolId)
    );

    const schoolName =
        selectedSchool?.name ?? department?.school?.name ?? "—";

    const schoolCode =
        selectedSchool?.code ?? department?.school?.code ?? "";

    /*
     * Load the prefix when creating or editing.
     * The prefix is displayed separately and excluded from the payload.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadPrefix() {
            const schoolId = Number(form.schoolId);

            if (!Number.isFinite(schoolId) || schoolId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            setPrefix("");
            setPrefixError("");
            setPrefixLoading(true);

            try {
                const result = await getDepartmentPrefix(
                    schoolId,
                    isEdit && department ? department.id : undefined
                );

                if (cancelled) return;

                setPrefix(result);

                if (isEdit && department) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(department.code, result),
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    setPrefixError(extractErrorMessage(error));
                }
            } finally {
                if (!cancelled) {
                    setPrefixLoading(false);
                }
            }
        }

        if (isCreate || isEdit) {
            void loadPrefix();
        } else {
            setPrefixLoading(false);
        }

        return () => {
            cancelled = true;
        };
        // The selected school is the prefix's source of truth.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.schoolId, isCreate, isEdit, department?.id]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof DepartmentForm>(
        key: K,
        value: DepartmentForm[K]
    ) {
        setForm((current) => ({ ...current, [key]: value }));

        setFieldErrors((current) => ({
            ...current,
            [key]: undefined,
        }));

        setDialogError("");
    }

    function validate(): boolean {
        const errors: FieldErrors = {};

        const name = form.name.trim();
        const code = form.code.trim();

        if (isCreate) {
            const schoolId = Number(form.schoolId);

            if (!form.schoolId || schoolId <= 0) {
                errors.schoolId = "Please select a school.";
            } else if (!schools.some((school) => school.id === schoolId)) {
                errors.schoolId =
                    "The selected school is no longer available. Refresh the options.";
            }
        }

        if (!name) {
            errors.name = "Department name is required.";
        } else if (name.length < 2) {
            errors.name = "Department name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "Department name cannot exceed 150 characters.";
        }

        if (!prefix) {
            errors.code = "The fixed department prefix could not be loaded.";
        } else if (!code) {
            errors.code = "Department code is required.";
        } else if (code.length > 40) {
            errors.code = "Department code cannot exceed 40 characters.";
        } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
            errors.code =
                "Use only letters, numbers, hyphens, and underscores.";
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!department) {
                setDialogError("No department was selected for deletion.");
                return;
            }

            try {
                await onDelete(department.id);
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();

                setDialogError(
                    lower.includes("constraint") ||
                        lower.includes("foreign key") ||
                        lower.includes("cannot delete")
                        ? "This department has related records. Remove or reassign those records before deleting it."
                        : message
                );
            }

            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (prefixLoading) {
            setDialogError("Please wait while the department prefix loads.");
            return;
        }

        if (prefixError) {
            setDialogError(prefixError);
            return;
        }

        if (!validate()) return;

        const name = form.name.trim();

        /*
         * IMPORTANT:
         * Only the suffix is submitted, never prefix + suffix.
         */
        const code = form.code.trim();

        try {
            if (isCreate) {
                await onCreate(Number(form.schoolId), { name, code });
            } else if (isEdit && department) {
                await onUpdate({
                    id: department.id,
                    name,
                    code,
                    activeStatus: form.activeStatus,
                });
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !busy
                ) {
                    onClose();
                }
            }}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="department-dialog-title"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · Academic Administration
                        </p>

                        <h2
                            id="department-dialog-title"
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
                    className="space-y-5 p-5 sm:p-6"
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

                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-rose-300">
                                        Action could not be completed
                                    </p>
                                    <p className="mt-1 break-words text-xs leading-relaxed">
                                        {dialogError}
                                    </p>
                                </div>

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
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                                <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400">
                                    <Trash2 size={22} />
                                </div>

                                <div className="min-w-0">
                                    <p className="font-semibold text-white">
                                        Delete this department?
                                    </p>

                                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                                        You are about to delete{" "}
                                        <strong className="text-white">
                                            {department?.name}
                                        </strong>
                                        . This action may be blocked if related
                                        records exist.
                                    </p>

                                    <p className="mt-2 break-all font-mono text-xs text-cyan-300">
                                        {department?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label
                                    htmlFor="department-school"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    School{" "}
                                    {isCreate && (
                                        <span className="text-cyan-400">*</span>
                                    )}
                                </label>

                                {isCreate ? (
                                    <>
                                        <div className="relative">
                                            <select
                                                id="department-school"
                                                value={form.schoolId}
                                                onChange={(event) => {
                                                    changeField(
                                                        "schoolId",
                                                        event.target.value
                                                            ? Number(event.target.value)
                                                            : ""
                                                    );
                                                    changeField("code", "");
                                                }}
                                                disabled={busy || schools.length === 0}
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    Select school
                                                </option>

                                                {schools.map((school) => (
                                                    <option
                                                        key={school.id}
                                                        value={school.id}
                                                    >
                                                        {school.name}
                                                        {school.code
                                                            ? ` (${school.code})`
                                                            : ""}
                                                    </option>
                                                ))}
                                            </select>

                                            <SelectChevron />
                                        </div>

                                        {schools.length === 0 && (
                                            <p className="mt-2 text-xs text-amber-300">
                                                No schools are available.
                                                Department creation is unavailable.
                                            </p>
                                        )}

                                        <FieldError>
                                            {fieldErrors.schoolId}
                                        </FieldError>
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                                        <p className="font-medium text-white">
                                            {schoolName}
                                        </p>

                                        {schoolCode && (
                                            <p className="mt-1 font-mono text-xs text-cyan-300">
                                                {schoolCode}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="department-name"
                                        className="text-sm font-medium text-slate-300"
                                    >
                                        Department Name{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>

                                    <span className="text-[11px] text-slate-500">
                                        {form.name.length}/150
                                    </span>
                                </div>

                                <input
                                    id="department-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        changeField("name", event.target.value)
                                    }
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Computer Science"
                                    className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 ${fieldErrors.name
                                        ? "border-rose-500/60 focus:border-rose-400"
                                        : "border-white/10 focus:border-cyan-400/60"
                                        } read-only:opacity-75`}
                                />

                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            <div>
                                <label
                                    htmlFor="department-code"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Department Code{" "}
                                    <span className="text-cyan-400">*</span>
                                </label>

                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[50%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading
                                                ? "Loading…"
                                                : prefix || "PREFIX"}
                                        </span>
                                    </div>

                                    <input
                                        id="department-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="CSE"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>

                                <FieldError>
                                    {fieldErrors.code || prefixError}
                                </FieldError>

                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    The prefix is fixed by the server. Only the
                                    code after the prefix is entered and sent
                                    to the API.
                                </p>
                            </div>

                            {!isCreate && (
                                <div>
                                    <label
                                        htmlFor="department-status"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Active Status
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="department-status"
                                            value={form.activeStatus}
                                            onChange={(event) =>
                                                changeField(
                                                    "activeStatus",
                                                    event.target.value as ActiveStatus
                                                )
                                            }
                                            disabled={readOnly || busy}
                                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-70"
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

                            {isView && department && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Department Information
                                    </p>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-xs text-slate-500">
                                                Department ID
                                            </p>
                                            <p className="mt-1 font-semibold text-white">
                                                {department.id}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-xs text-slate-500">
                                                Status
                                            </p>
                                            <div className="mt-2">
                                                <StatusBadge
                                                    status={department.activeStatus}
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-xs text-slate-500">
                                                University
                                            </p>
                                            <p className="mt-1 font-medium text-white">
                                                {department.university?.name ?? "—"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-xs text-slate-500">
                                                Academic Years
                                            </p>
                                            <p className="mt-1 font-medium text-white">
                                                {getAcademicYears(department)
                                                    .map((year) => year.name)
                                                    .join(", ") || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="mb-2 text-xs text-slate-500">
                                            Available permissions
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {getDepartmentActions(department).length ? (
                                                getDepartmentActions(department).map(
                                                    (action) => (
                                                        <span
                                                            key={action}
                                                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-xs text-cyan-300"
                                                        >
                                                            {action}
                                                        </span>
                                                    )
                                                )
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    No update or delete permissions
                                                    were returned.
                                                </span>
                                            )}
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

                        {!isView && (
                            <button
                                type="submit"
                                disabled={
                                    busy ||
                                    prefixLoading ||
                                    ((isCreate || isEdit) && !prefix) ||
                                    (isCreate && schools.length === 0)
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${isDelete
                                    ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                    : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                    }`}
                            >
                                {busy || prefixLoading ? (
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : isDelete ? (
                                    <Trash2 size={16} />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}

                                {busy
                                    ? "Processing..."
                                    : prefixLoading
                                        ? "Loading prefix..."
                                        : isDelete
                                            ? "Confirm Delete"
                                            : isCreate
                                                ? "Create Department"
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
/* Main Department page                                                       */
/* -------------------------------------------------------------------------- */

export default function Departments() {
    const reduceMotion = useReducedMotion();

    const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
    const [schoolsForCreate, setSchoolsForCreate] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [schoolOptionsError, setSchoolOptionsError] = useState("");
    const [notice, setNotice] = useState("");

    /* Table filters: all applied locally to the loaded department list. */
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        department: DepartmentResponse | null;
    } | null>(null);

    /* ---------------------------------------------------------------------- */
    /* Load backend data                                                      */
    /* ---------------------------------------------------------------------- */

    const loadData = useCallback(async (background = false) => {
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError("");

        try {
            /*
             * This is the only call required to load the table.
             * Search and table filters never invoke this function.
             */
            const result = await getAllDepartments();

            setDepartments(result);
        } catch (error) {
            const message = extractErrorMessage(error);

            setPageError(message);
            toast.error(`Failed to load departments: ${message}`);
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
    /* Load creation options independently                                    */
    /* ---------------------------------------------------------------------- */

    const loadSchoolOptions = useCallback(async () => {
        setSchoolOptionsError("");

        try {
            const result = await getSchoolFilter();

            setSchoolsForCreate(uniqueDTOs(result));

            return result;
        } catch (error) {
            const message = extractErrorMessage(error);

            setSchoolOptionsError(message);
            toast.error(`Could not load school options: ${message}`);

            throw error;
        }
    }, []);

    useEffect(() => {
        void loadSchoolOptions().catch(() => {
            // The visible error state is managed by loadSchoolOptions.
        });
    }, [loadSchoolOptions]);

    /* ---------------------------------------------------------------------- */
    /* Derive table filter options from loaded departments                    */
    /* ---------------------------------------------------------------------- */

    const tableUniversities = useMemo(() => {
        return uniqueDTOs(
            departments.map((department) => department.university)
        );
    }, [departments]);

    const tableSchools = useMemo(() => {
        return uniqueDTOs(
            departments.map((department) => department.school)
        );
    }, [departments]);

    /* ---------------------------------------------------------------------- */
    /* Statistics from all loaded data, not only the current page             */
    /* ---------------------------------------------------------------------- */

    const stats = useMemo(() => {
        const total = departments.length;

        const active = departments.filter(
            (department) => department.activeStatus === "ENABLE"
        ).length;

        const inactive = departments.filter(
            (department) => department.activeStatus === "DISABLE"
        ).length;

        return [
            {
                label: "Total Departments",
                value: formatNumber(total),
                icon: Building2,
                tone: "cyan",
            },
            {
                label: "Active Departments",
                value: formatNumber(active),
                icon: GraduationCap,
                tone: "green",
            },
            {
                label: "Inactive Departments",
                value: formatNumber(inactive),
                icon: ShieldCheck,
                tone: "purple",
            },
        ];
    }, [departments]);

    /* ---------------------------------------------------------------------- */
    /* Local filtering and sorting                                            */
    /* ---------------------------------------------------------------------- */

    const filteredDepartments = useMemo(() => {
        const query = normalizeText(search);

        const result = departments.filter((department) => {
            const name = normalizeText(department.name);
            const code = normalizeText(department.code);
            const id = String(department.id ?? "");

            const schoolName = normalizeText(department.school?.name);
            const schoolCode = normalizeText(department.school?.code);

            const universityName = normalizeText(
                department.university?.name
            );

            const universityCode = normalizeText(
                department.university?.code
            );

            const academicYears = getAcademicYears(department);

            const academicYearNames = academicYears.map((year) =>
                normalizeText(year.name)
            );

            const academicYearCodes = academicYears.map((year) =>
                normalizeText(year.code)
            );

            const matchesSearch =
                !query ||
                name.includes(query) ||
                code.includes(query) ||
                id.includes(query) ||
                schoolName.includes(query) ||
                schoolCode.includes(query) ||
                universityName.includes(query) ||
                universityCode.includes(query) ||
                academicYearNames.some((value) => value.includes(query)) ||
                academicYearCodes.some((value) => value.includes(query));

            const matchesStatus =
                statusFilter === "ALL" ||
                department.activeStatus === statusFilter;

            const matchesUniversity =
                universityFilter === "ALL" ||
                department.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                department.school?.id === Number(schoolFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesUniversity &&
                matchesSchool
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
        departments,
        search,
        statusFilter,
        universityFilter,
        schoolFilter,
        sort,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Pagination                                                             */
    /* ---------------------------------------------------------------------- */

    const totalPages = Math.max(
        1,
        Math.ceil(filteredDepartments.length / PAGE_SIZE)
    );

    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const visibleDepartments = filteredDepartments.slice(
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
        sort,
    ]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "ALL" ||
        universityFilter !== "ALL" ||
        schoolFilter !== "ALL" ||
        sort !== "NEWEST";

    /* ---------------------------------------------------------------------- */
    /* Dialog handlers                                                        */
    /* ---------------------------------------------------------------------- */

    async function openCreateDialog() {
        setPageError("");
        setNotice("");

        try {
            /*
             * Refresh only the form's school options.
             * This does not reload the table data.
             */
            const result = await getSchoolFilter();
            const options = uniqueDTOs(result);

            setSchoolsForCreate(options);

            if (options.length === 0) {
                toast.error(
                    "No schools are available. A department cannot be created."
                );
                return;
            }

            setSchoolOptionsError("");
            setDialog({ mode: "CREATE", department: null });
        } catch (error) {
            const message = extractErrorMessage(error);
            setSchoolOptionsError(message);
            toast.error(`Cannot create a department: ${message}`);
        }
    }

    function openDialog(
        mode: DialogMode,
        department: DepartmentResponse | null = null
    ) {
        setPageError("");
        setNotice("");
        setDialog({ mode, department });
    }

    /* ---------------------------------------------------------------------- */
    /* CRUD handlers                                                          */
    /* ---------------------------------------------------------------------- */

    async function handleCreate(
        schoolId: number,
        request: DepartmentCreateRequest
    ) {
        setBusy(true);

        try {
            await createDepartment(schoolId, request);

            setDialog(null);
            setNotice("Department created successfully.");

            toast.success(
                `Department "${request.name}" created successfully.`
            );

            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not create department: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(request: DepartmentRequest) {
        setBusy(true);

        try {
            await updateDepartment(request);

            setDialog(null);
            setNotice("Department updated successfully.");
            toast.success("Department updated successfully.");

            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not update department: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(departmentId: number) {
        setBusy(true);

        try {
            const message = await deleteDepartment(departmentId);

            setDialog(null);
            setNotice(message || "Department deleted successfully.");
            toast.success(message || "Department deleted successfully.");

            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not delete department: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Filter reset                                                           */
    /* ---------------------------------------------------------------------- */

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
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
                    <span>Organisation</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Departments</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Department Management
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage departments, review their academic
                            associations, and control records using your
                            assigned permissions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            title="Refresh departments"
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
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Add Department
                        </button>
                    </div>
                </div>
            </section>

            {/* Errors and success messages */}
            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        title="Could not load departments"
                        message={pageError}
                        onRetry={() => void loadData()}
                        onDismiss={() => setPageError("")}
                    />
                )}

                {schoolOptionsError && (
                    <ErrorBanner
                        title="School options unavailable"
                        message={schoolOptionsError}
                        onRetry={() =>
                            void loadSchoolOptions().catch(() => undefined)
                        }
                        onDismiss={() => setSchoolOptionsError("")}
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
                aria-label="Department statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={
                                reduceMotion ? false : { opacity: 0, y: 14 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: reduceMotion ? 0 : index * 0.06,
                            }}
                            whileHover={
                                reduceMotion ? undefined : { y: -3 }
                            }
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
                                    animate={{
                                        width: loading ? "30%" : "100%",
                                    }}
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
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 xl:grid-cols-3 2xl:grid-cols-[minmax(220px,1.5fr)_170px_190px_190px_180px_auto]">
                    {/* Search */}
                    <div className="relative min-w-0">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            aria-label="Search departments"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, code, school, university..."
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

                    {/* Status */}
                    <div className="relative">
                        <select
                            aria-label="Filter by department status"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ENABLE">Active</option>
                            <option value="DISABLE">Inactive</option>
                        </select>

                        <SelectChevron />
                    </div>

                    {/* University: options from loaded department data */}
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

                            {tableUniversities.map((university) => (
                                <option
                                    key={university.id}
                                    value={university.id}
                                >
                                    {university.name}
                                    {university.code
                                        ? ` (${university.code})`
                                        : ""}
                                </option>
                            ))}
                        </select>

                        <SelectChevron />
                    </div>

                    {/* School: options from loaded department data */}
                    <div className="relative">
                        <select
                            aria-label="Filter by school"
                            value={schoolFilter}
                            onChange={(event) =>
                                setSchoolFilter(event.target.value)
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All schools</option>

                            {tableSchools.map((school) => (
                                <option key={school.id} value={school.id}>
                                    {school.name}
                                    {school.code ? ` (${school.code})` : ""}
                                </option>
                            ))}
                        </select>

                        <SelectChevron />
                    </div>


                    {/* Sort */}
                    <div className="relative">
                        <select
                            aria-label="Sort departments"
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
                    <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">
                                    Department
                                </th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">
                                    School
                                </th>
                                <th className="px-4 py-4 font-medium">
                                    University
                                </th>
                                <th className="px-4 py-4 font-medium">
                                    Academic Years
                                </th>
                                <th className="px-4 py-4 font-medium">
                                    Status
                                </th>
                                <th className="px-5 py-4 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map(
                                    (_, rowIndex) => (
                                        <tr key={`loading-${rowIndex}`}>
                                            {Array.from({ length: 8 }).map(
                                                (_, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className="px-4 py-5"
                                                    >
                                                        <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    )
                                )
                            ) : pageError && departments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>

                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load departments
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
                            ) : visibleDepartments.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleDepartments.map(
                                        (department, index) => {
                                            const initials =
                                                (department.name || "DP")
                                                    .trim()
                                                    .split(/\s+/)
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .map((part) => part[0])
                                                    .join("")
                                                    .toUpperCase() || "DP";

                                            const canUpdate = hasPermission(
                                                department,
                                                "UPDATE"
                                            );

                                            const canDelete = hasPermission(
                                                department,
                                                "DELETE"
                                            );

                                            const academicYearNames =
                                                getAcademicYears(department)
                                                    .map((year) => year.name)
                                                    .filter(Boolean);

                                            return (
                                                <motion.tr
                                                    layout={!reduceMotion}
                                                    key={department.id}
                                                    initial={
                                                        reduceMotion
                                                            ? false
                                                            : {
                                                                opacity: 0,
                                                                x: -6,
                                                            }
                                                    }
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.18,
                                                    }}
                                                    className="group transition-colors hover:bg-cyan-400/[0.035]"
                                                >
                                                    <td className="px-5 py-5 text-slate-500">
                                                        {(currentPage - 1) *
                                                            PAGE_SIZE +
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
                                                                    {department.name ||
                                                                        "Unnamed Department"}
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-slate-500">
                                                                    ID:{" "}
                                                                    {department.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-5">
                                                        <span className="inline-flex max-w-[180px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                            {department.code ||
                                                                "—"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-5">
                                                        <div className="max-w-[200px]">
                                                            <p className="truncate font-medium text-slate-200">
                                                                {department
                                                                    .school
                                                                    ?.name ||
                                                                    "—"}
                                                            </p>

                                                            {department.school
                                                                ?.code && (
                                                                    <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                                        {
                                                                            department
                                                                                .school
                                                                                .code
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-5">
                                                        <div className="max-w-[200px]">
                                                            <p className="truncate font-medium text-slate-200">
                                                                {department
                                                                    .university
                                                                    ?.name ||
                                                                    "—"}
                                                            </p>

                                                            {department
                                                                .university
                                                                ?.code && (
                                                                    <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                                        {
                                                                            department
                                                                                .university
                                                                                .code
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-5">
                                                        {academicYearNames.length >
                                                            0 ? (
                                                            <div className="flex max-w-[230px] flex-wrap gap-1.5">
                                                                {academicYearNames
                                                                    .slice(0, 2)
                                                                    .map(
                                                                        (
                                                                            yearName,
                                                                            yearIndex
                                                                        ) => (
                                                                            <span
                                                                                key={`${department.id}-${yearName}-${yearIndex}`}
                                                                                className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-xs text-slate-300"
                                                                            >
                                                                                {
                                                                                    yearName
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}

                                                                {academicYearNames.length >
                                                                    2 && (
                                                                        <span className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-xs text-slate-400">
                                                                            +
                                                                            {academicYearNames.length -
                                                                                2}
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-500">
                                                                Not linked
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-5">
                                                        <StatusBadge
                                                            status={
                                                                department.activeStatus
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-5">
                                                        <div className="flex justify-end gap-2">
                                                            {/* View is read-only. */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDialog(
                                                                        "VIEW",
                                                                        department
                                                                    )
                                                                }
                                                                aria-label={`View ${department.name}`}
                                                                title="View details"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                            >
                                                                <Eye size={17} />
                                                            </button>

                                                            {canUpdate && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openDialog(
                                                                            "EDIT",
                                                                            department
                                                                        )
                                                                    }
                                                                    aria-label={`Edit ${department.name}`}
                                                                    title="Edit department"
                                                                    className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                                >
                                                                    <Pencil
                                                                        size={17}
                                                                    />
                                                                </button>
                                                            )}

                                                            {canDelete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openDialog(
                                                                            "DELETE",
                                                                            department
                                                                        )
                                                                    }
                                                                    aria-label={`Delete ${department.name}`}
                                                                    title="Delete department"
                                                                    className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rose-400 transition hover:border-rose-400/30 hover:bg-rose-400/10"
                                                                >
                                                                    <Trash2
                                                                        size={17}
                                                                    />
                                                                </button>
                                                            )}

                                                            {!canUpdate &&
                                                                !canDelete && (
                                                                    <span className="self-center text-xs text-slate-500">
                                                                        View
                                                                        only
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        }
                                    )}
                                </AnimatePresence>
                            ) : (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Building2 size={25} />
                                        </div>

                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching departments found"
                                                : "No departments registered yet"}
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : "Departments will appear here after they are created."}
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
                                            departments.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void openCreateDialog()
                                                    }
                                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110"
                                                >
                                                    <Plus size={15} />
                                                    Add Department
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
                        {filteredDepartments.length === 0
                            ? "Showing 0 departments"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1
                            }–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredDepartments.length
                            )} of ${filteredDepartments.length} departments${hasActiveFilters &&
                                filteredDepartments.length !==
                                departments.length
                                ? ` (filtered from ${departments.length})`
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
                            onClick={() =>
                                setPage((value) => Math.max(1, value - 1))
                            }
                            aria-label="Previous page"
                            title="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={17} />
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        )
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
                                            <span className="px-1 text-slate-500">
                                                …
                                            </span>
                                        )}

                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setPage(number)}
                                        aria-current={
                                            currentPage === number
                                                ? "page"
                                                : undefined
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
                                setPage((value) =>
                                    Math.min(totalPages, value + 1)
                                )
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
                    <DepartmentDialog
                        key={`${dialog.mode}-${dialog.department?.id ?? "new"}`}
                        mode={dialog.mode}
                        department={dialog.department}
                        schools={schoolsForCreate}
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