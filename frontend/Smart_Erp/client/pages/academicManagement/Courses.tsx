// src/pages/academicManagement/Courses.tsx

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
    Clock,
    Eye,
    GraduationCap,
    Info,
    Layers,
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
    createCourse,
    deleteCourse,
    extractErrorMessage,
    formatAuditActor,
    getAllCourses,
    getCoursePrefix,
    getDepartmentFilter,
    hasCoursePermission,
    normalizeSearch,
    uniqueDTOs,
    updateCourse,
    type ActiveStatus,
    type CommonDTO,
    type CourseCreateRequest,
    type CourseRequest,
    type CourseResponse,
    type PermissionAction,
} from "@/services/academic/courseService";

/* -------------------------------------------------------------------------- */
/* Types and constants                                                        */
/* -------------------------------------------------------------------------- */

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
type EnrollmentFilter = "ALL" | "ALLOWED" | "CLOSED";
type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "CODE_ASC"
    | "CODE_DESC";

interface CourseForm {
    departmentId: number | "";
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    newEnrollmentAllowed: boolean;
}

interface FieldErrors {
    departmentId?: string;
    name?: string;
    code?: string;
}

interface CourseDialogProps {
    mode: DialogMode;
    course: CourseResponse | null;
    defaultDepartmentId?: number | "";
    departments: CommonDTO[];
    departmentsLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (
        departmentId: number,
        request: CourseCreateRequest
    ) => Promise<void>;
    onUpdate: (request: CourseRequest) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

const PAGE_SIZE = 8;

/* -------------------------------------------------------------------------- */
/* General helpers                                                            */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "0";
    }
    return new Intl.NumberFormat("en-IN").format(value);
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

function removePrefix(code: string | null | undefined, prefix: string): string {
    const value = (code ?? "").trim();
    if (prefix && value.startsWith(prefix)) {
        return value.slice(prefix.length).trim();
    }
    return value;
}

function statusLabel(status: ActiveStatus | null | undefined): string {
    if (status === "ENABLE") return "Active";
    if (status === "DISABLE") return "Inactive";
    return "Unknown";
}

function getInitials(name?: string): string {
    if (!name) return "CR";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "CR";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
            className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

function SelectChevron() {
    return (
        <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function StatusBadge({ status }: { status: ActiveStatus }) {
    const active = status === "ENABLE";
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

function EnrollmentBadge({ allowed }: { allowed: boolean | null | undefined }) {
    if (allowed === true) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                <CheckCircle2 size={11} className="shrink-0" />
                Open
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/50 bg-slate-800/40 px-2 py-0.5 text-xs font-medium text-slate-400">
            <X size={11} className="shrink-0" />
            Closed
        </span>
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

function InfoField({
    label,
    value,
    subValue,
}: {
    label: string;
    value: string;
    subValue?: string;
}) {
    return (
        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 text-xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {label}
            </span>
            <p className="mt-1 font-semibold text-white break-words">{value}</p>
            {subValue && (
                <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    {subValue}
                </p>
            )}
        </div>
    );
}

function AssociationList({
    title,
    items,
    emptyText = "None associated",
}: {
    title: string;
    items: CommonDTO[];
    emptyText?: string;
}) {
    return (
        <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="font-semibold text-slate-300">{title}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                    {items.length}
                </span>
            </div>
            {items.length === 0 ? (
                <p className="mt-2 text-slate-500 italic text-[11px]">{emptyText}</p>
            ) : (
                <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto custom-scrollbar">
                    {items.map((item) => (
                        <span
                            key={item.id}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-200"
                            title={item.code ? `Code: ${item.code}` : undefined}
                        >
                            <span>{item.name}</span>
                            {item.code && (
                                <span className="text-[10px] text-cyan-300 font-mono">
                                    ({item.code})
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Course Dialog Component                                                    */
/* -------------------------------------------------------------------------- */

function CourseDialog({
    mode,
    course,
    defaultDepartmentId,
    departments,
    departmentsLoading,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: CourseDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const initialDepartmentId: number | "" = isCreate
        ? defaultDepartmentId && Number(defaultDepartmentId) > 0
            ? Number(defaultDepartmentId)
            : departments.length === 1
                ? departments[0].id
                : ""
        : course?.department?.id ?? "";

    const initialPrefix = course?.department?.code ?? "";

    const [form, setForm] = useState<CourseForm>(() => ({
        departmentId: initialDepartmentId,
        name: course?.name ?? "",
        code:
            (isEdit || isView) && course && initialPrefix
                ? removePrefix(course.code, initialPrefix)
                : course?.code ?? "",
        activeStatus: course?.activeStatus ?? "ENABLE",
        newEnrollmentAllowed: course?.newEnrollmentAllowed ?? true,
    }));

    const [prefix, setPrefix] = useState(initialPrefix);
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const selectedDepartment = useMemo(() => {
        const dId = Number(form.departmentId);
        if (!dId || dId <= 0) return null;
        return departments.find((dept) => dept.id === dId) || course?.department || null;
    }, [form.departmentId, departments, course?.department]);

    const departmentName = selectedDepartment?.name ?? course?.department?.name ?? "—";
    const departmentCode = selectedDepartment?.code ?? course?.department?.code ?? "";

    const schoolName = course?.school?.name ?? "—";
    const universityName = course?.university?.name ?? "—";

    const title: Record<DialogMode, string> = {
        CREATE: "Create Course",
        EDIT: "Edit Course",
        VIEW: "Course Details",
        DELETE: "Delete Course",
    };

    /*
     * Resolve prefix:
     * First try instant local department.code, then verify via backend /prefix endpoint.
     * Works for CREATE, EDIT, and VIEW modes so prefix is always cleanly handled.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadPrefix() {
            const deptId = Number(form.departmentId);

            if (!deptId || deptId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            // Local fallback from selected Department DTO or course.department
            const matchingDept =
                departments.find((d) => d.id === deptId) || course?.department;
            if (matchingDept?.code) {
                setPrefix(matchingDept.code);
            }

            setPrefixLoading(true);

            try {
                const result = await getCoursePrefix(
                    deptId,
                    (isEdit || isView) && course ? course.id : undefined
                );

                if (cancelled) return;

                const resolvedPrefix = result || matchingDept?.code || "";
                if (resolvedPrefix) {
                    setPrefix(resolvedPrefix);
                }

                if ((isEdit || isView) && course && resolvedPrefix) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(course.code, resolvedPrefix),
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    if (matchingDept?.code) {
                        setPrefix(matchingDept.code);
                    } else {
                        setPrefixError(extractErrorMessage(error));
                    }
                }
            } finally {
                if (!cancelled) setPrefixLoading(false);
            }
        }

        void loadPrefix();

        return () => {
            cancelled = true;
        };
    }, [form.departmentId, isCreate, isEdit, isView, departments, course?.id, course?.code, course?.department]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof CourseForm>(
        key: K,
        value: CourseForm[K]
    ) {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
        setDialogError("");
    }

    function validate(): boolean {
        const errors: FieldErrors = {};
        const name = form.name.trim();
        const code = form.code.trim();

        if (isCreate) {
            const deptId = Number(form.departmentId);
            if (!deptId || deptId <= 0) {
                errors.departmentId = "Please select a department first.";
            } else if (!departments.some((dept) => dept.id === deptId)) {
                errors.departmentId =
                    "The selected department is no longer available.";
            }
        }

        if (!name) {
            errors.name = "Course name is required.";
        } else if (name.length < 2) {
            errors.name = "Course name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "Course name cannot exceed 150 characters.";
        }

        if (!code) {
            errors.code = "Course code suffix is required.";
        } else if (code.length > 40) {
            errors.code = "Course code suffix cannot exceed 40 characters.";
        } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
            errors.code = "Use only letters, numbers, hyphens, and underscores.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!course) {
                setDialogError("No course was selected for deletion.");
                return;
            }

            try {
                await onDelete(course.id);
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();
                setDialogError(
                    lower.includes("constraint") ||
                        lower.includes("foreign key") ||
                        lower.includes("remove its specializations") ||
                        lower.includes("cannot delete")
                        ? "This course has associated subjects, sections, or specializations. Remove them first."
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

        const code = form.code.trim();
        const name = form.name.trim();

        try {
            if (isCreate) {
                // Controller contract: @RequestParam Long departmentId, @RequestBody CommonRequest { name, code }
                await onCreate(Number(form.departmentId), {
                    name,
                    code,
                });
            } else if (isEdit && course) {
                // Controller contract: @RequestBody CourseRequest { id, name, code, activeStatus, newEnrollmentAllowed }
                await onUpdate({
                    id: course.id,
                    name,
                    code,
                    activeStatus: form.activeStatus,
                    newEnrollmentAllowed: form.newEnrollmentAllowed,
                });
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-50";

    const hasDependents =
        course &&
        (course.subjects.length > 0 ||
            course.sections.length > 0 ||
            course.specializations.length > 0);

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) {
                    onClose();
                }
            }}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="course-dialog-title"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                {/* Dialog Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · Academic Management
                        </p>
                        <h2
                            id="course-dialog-title"
                            className="mt-1 text-lg sm:text-xl font-bold text-white"
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
                    className="max-h-[80vh] space-y-4 sm:space-y-5 overflow-y-auto p-4 sm:p-6 custom-scrollbar"
                >
                    {/* Error message */}
                    <AnimatePresence>
                        {dialogError && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs sm:text-sm text-rose-200"
                            >
                                <AlertCircle
                                    size={17}
                                    className="mt-0.5 shrink-0 text-rose-400"
                                />
                                <p className="min-w-0 flex-1 break-words leading-relaxed">
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
                        <div className="space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-rose-500/15 p-2.5 sm:p-3 text-rose-400 shrink-0">
                                    <Trash2 size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-white text-sm sm:text-base">
                                        Delete this course?
                                    </p>
                                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300">
                                        Are you sure you want to delete{" "}
                                        <strong className="text-white">
                                            {course?.name}
                                        </strong>
                                        ? This action cannot be reversed.
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-cyan-300">
                                        <span>Code: {course?.code}</span>
                                        <span>·</span>
                                        <span>ID #{course?.id}</span>
                                    </div>
                                </div>
                            </div>

                            {hasDependents && (
                                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle
                                            size={15}
                                            className="mt-0.5 shrink-0 text-amber-400"
                                        />
                                        <div>
                                            <p className="font-semibold text-amber-300">
                                                Active Dependents Detected
                                            </p>
                                            <p className="mt-0.5 leading-relaxed text-amber-200/90">
                                                This course is currently linked to{" "}
                                                <strong>{course?.subjects.length}</strong> subjects,{" "}
                                                <strong>{course?.sections.length}</strong> sections, and{" "}
                                                <strong>{course?.specializations.length}</strong> specializations.
                                                The backend requires removing or reassigning these child records first.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Select Department (CREATE mode) */}
                            {isCreate && (
                                <div>
                                    <label
                                        htmlFor="course-department"
                                        className="mb-2 block text-xs sm:text-sm font-medium text-slate-300"
                                    >
                                        Department{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="course-department"
                                            value={form.departmentId}
                                            onChange={(event) => {
                                                const dId = event.target.value
                                                    ? Number(event.target.value)
                                                    : "";
                                                changeField("departmentId", dId);
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
                                                    : "Select Department"}
                                            </option>
                                            {departments.map((dept) => (
                                                <option
                                                    key={dept.id}
                                                    value={dept.id}
                                                >
                                                    {dept.name}
                                                    {dept.code
                                                        ? ` (${dept.code})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                    </div>

                                    <FieldError>
                                        {fieldErrors.departmentId}
                                    </FieldError>
                                </div>
                            )}

                            {/* Department Info & Hierarchy (EDIT mode) */}
                            {!isCreate && (
                                <div className="grid gap-2.5 sm:grid-cols-3">
                                    <InfoField
                                        label="Department"
                                        value={departmentName}
                                        subValue={departmentCode ? `Code: ${departmentCode}` : undefined}
                                    />
                                    <InfoField
                                        label="School"
                                        value={schoolName}
                                    />
                                    <InfoField
                                        label="University"
                                        value={universityName}
                                    />
                                </div>
                            )}

                            {/* Course Name */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="course-name"
                                        className="text-xs sm:text-sm font-medium text-slate-300"
                                    >
                                        Course Name <span className="text-cyan-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        {form.name.length}/150
                                    </span>
                                </div>
                                <input
                                    id="course-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        changeField("name", event.target.value)
                                    }
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Bachelor of Technology (Computer Science)"
                                    className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white outline-none transition placeholder:text-slate-500 ${
                                        fieldErrors.name
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : "border-white/10 focus:border-cyan-400/60"
                                    } read-only:opacity-75`}
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            {/* Course Code with Fixed Department Prefix */}
                            <div>
                                <label
                                    htmlFor="course-code"
                                    className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                >
                                    Course Code <span className="text-cyan-400">*</span>
                                </label>
                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[55%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-xs sm:text-sm text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading
                                                ? "Loading..."
                                                : prefix || departmentCode || "DEPT_PREFIX"}
                                        </span>
                                    </div>
                                    <input
                                        id="course-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="BTECH"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-xs sm:text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>
                                <FieldError>
                                    {fieldErrors.code || prefixError}
                                </FieldError>
                                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                                    <span>Fixed department prefix is auto-applied by backend.</span>
                                    {(prefix || departmentCode) && form.code.trim() && (
                                        <span className="font-mono text-cyan-400">
                                            Resulting Code: <strong>{prefix || departmentCode}{form.code.trim()}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Active Status & Enrollment (EDIT mode) */}
                            {!isCreate && (
                                <div className="space-y-3.5">
                                    <div>
                                        <label
                                            htmlFor="course-status"
                                            className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                        >
                                            Active Status
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="course-status"
                                                value={form.activeStatus}
                                                onChange={(event) =>
                                                    changeField(
                                                        "activeStatus",
                                                        event.target.value as ActiveStatus
                                                    )
                                                }
                                                disabled={readOnly || busy}
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-xs sm:text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-70"
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

                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5 sm:p-4 transition hover:bg-white/[0.04]">
                                        <input
                                            type="checkbox"
                                            checked={form.newEnrollmentAllowed}
                                            onChange={(event) =>
                                                changeField(
                                                    "newEnrollmentAllowed",
                                                    event.target.checked
                                                )
                                            }
                                            disabled={readOnly || busy}
                                            className="mt-0.5 h-4 w-4 rounded accent-cyan-400"
                                        />
                                        <div>
                                            <span className="block text-xs sm:text-sm font-medium text-slate-200">
                                                Allow New Enrollment
                                            </span>
                                            <span className="mt-0.5 block text-[11px] sm:text-xs leading-relaxed text-slate-400">
                                                When enabled, new students can register and enroll into this course offering.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* VIEW Mode Details & Audit Showcase */}
                            {isView && course && (
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <InfoField
                                            label="Course ID"
                                            value={`#${course.id}`}
                                        />
                                        <InfoField
                                            label="Active Status"
                                            value={statusLabel(course.activeStatus)}
                                        />
                                        <InfoField
                                            label="New Enrollment"
                                            value={
                                                course.newEnrollmentAllowed === null
                                                    ? "Not specified"
                                                    : course.newEnrollmentAllowed
                                                        ? "Allowed (Open)"
                                                        : "Not allowed (Closed)"
                                            }
                                        />
                                        <InfoField
                                            label="Full Course Code"
                                            value={course.code || "—"}
                                        />
                                        <InfoField
                                            label="Department Prefix"
                                            value={prefix || departmentCode || "—"}
                                        />
                                        <InfoField
                                            label="Course Suffix"
                                            value={
                                                removePrefix(
                                                    course.code,
                                                    prefix || departmentCode
                                                ) || "—"
                                            }
                                        />
                                    </div>

                                    {/* Associated Child Entities */}
                                    <div className="space-y-2.5">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Curricular Components
                                        </p>
                                        <div className="grid gap-2.5 sm:grid-cols-3">
                                            <AssociationList
                                                title="Subjects"
                                                items={course.subjects}
                                                emptyText="No subjects configured"
                                            />
                                            <AssociationList
                                                title="Sections"
                                                items={course.sections}
                                                emptyText="No sections assigned"
                                            />
                                            <AssociationList
                                                title="Specializations"
                                                items={course.specializations}
                                                emptyText="No specializations assigned"
                                            />
                                        </div>
                                    </div>

                                    {/* Audit Trail & Governance Showcase */}
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
                                                    {course.createdAt && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(course.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                        {getInitials(course.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {course.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(course.createdBy?.code || course.createdBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {course.createdBy.code ? `Code: ${course.createdBy.code}` : `ID: #${course.createdBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {course.createdAt && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(course.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Updated By Card */}
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <RotateCcw size={11} /> Last Modified By
                                                    </span>
                                                    {(course.updatedAt || course.createdAt) && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(course.updatedAt || course.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                        {getInitials(course.updatedBy?.name || course.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {course.updatedBy?.name || course.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(course.updatedBy?.code || course.updatedBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {course.updatedBy.code ? `Code: ${course.updatedBy.code}` : `ID: #${course.updatedBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(course.updatedAt || course.createdAt) && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(course.updatedAt || course.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permission Pills */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3">
                                        <p className="mb-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                            Assigned User Permissions
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {course.permissionActions.length > 0 ? (
                                                course.permissionActions.map((action) => (
                                                    <span
                                                        key={action}
                                                        className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-[11px] text-cyan-300"
                                                    >
                                                        {action}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    No direct modification permissions granted.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Dialog Actions Footer */}
                    <div className="flex flex-col-reverse gap-2.5 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="rounded-xl border border-white/10 px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>

                        {!isView && (
                            <button
                                type="submit"
                                disabled={
                                    busy ||
                                    prefixLoading ||
                                    (isCreate &&
                                        (departmentsLoading ||
                                            departments.length === 0 ||
                                            !form.departmentId))
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isDelete
                                        ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                        : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                }`}
                            >
                                {busy || prefixLoading ? (
                                    <LoaderCircle size={16} className="animate-spin" />
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
                                                ? "Create Course"
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
/* Main Courses Page Component                                                */
/* -------------------------------------------------------------------------- */

export default function Courses() {
    const reduceMotion = useReducedMotion();

    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [departments, setDepartments] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [departmentsLoading, setDepartmentsLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    /* Table search and filters */
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        course: CourseResponse | null;
        defaultDepartmentId?: number | "";
    } | null>(null);

    /* ---------------------------------------------------------------------- */
    /* Load courses and department options (Common Controller for CREATE)     */
    /* ---------------------------------------------------------------------- */

    const loadDepartments = useCallback(async () => {
        setDepartmentsLoading(true);

        try {
            const result = await getDepartmentFilter();
            const opts = uniqueDTOs(result);
            setDepartments(opts);
            return opts;
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not load departments: ${message}`);
            return [];
        } finally {
            setDepartmentsLoading(false);
        }
    }, []);

    const loadCourses = useCallback(async (background = false) => {
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError("");

        try {
            const result = await getAllCourses();
            setCourses(Array.isArray(result) ? result : []);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load courses: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Load courses on mount
    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    /* ---------------------------------------------------------------------- */
    /* Filter options derived from loaded courses data                       */
    /* ---------------------------------------------------------------------- */

    const tableDepartments = useMemo(
        () =>
            uniqueDTOs(
                courses
                    .filter(
                        (course) =>
                            schoolFilter === "ALL" ||
                            course.school?.id === Number(schoolFilter)
                    )
                    .map((course) => course.department)
            ),
        [courses, schoolFilter]
    );

    const tableSchools = useMemo(
        () =>
            uniqueDTOs(
                courses
                    .filter(
                        (course) =>
                            universityFilter === "ALL" ||
                            course.university?.id === Number(universityFilter)
                    )
                    .map((course) => course.school)
            ),
        [courses, universityFilter]
    );

    const tableUniversities = useMemo(
        () => uniqueDTOs(courses.map((course) => course.university)),
        [courses]
    );

    /* ---------------------------------------------------------------------- */
    /* Statistics cards metrics                                               */
    /* ---------------------------------------------------------------------- */

    const stats = useMemo(() => {
        const list = Array.isArray(courses) ? courses : [];
        const active = list.filter((course) => course.activeStatus === "ENABLE").length;
        const enrollmentOpen = list.filter((course) => course.newEnrollmentAllowed === true).length;
        const deptSet = new Set(
            list.map((c) => c.department?.id).filter((id): id is number => typeof id === "number" && id > 0)
        );

        return [
            {
                label: "Total Courses",
                value: formatNumber(list.length),
                icon: BookOpen,
                tone: "cyan",
            },
            {
                label: "Active Courses",
                value: formatNumber(active),
                icon: GraduationCap,
                tone: "green",
            },
            {
                label: "Departments",
                value: formatNumber(deptSet.size || departments.length),
                icon: Building2,
                tone: "purple",
            },
            {
                label: "Enrollment Open",
                value: formatNumber(enrollmentOpen),
                icon: ShieldCheck,
                tone: "blue",
            },
        ];
    }, [courses, departments]);

    /* ---------------------------------------------------------------------- */
    /* Filtering and sorting                                                  */
    /* ---------------------------------------------------------------------- */

    const filteredCourses = useMemo(() => {
        const query = normalizeSearch(search);

        const result = courses.filter((course) => {
            const matchesSearch =
                !query ||
                normalizeSearch(course.name).includes(query) ||
                normalizeSearch(course.code).includes(query) ||
                String(course.id).includes(query) ||
                normalizeSearch(course.department?.name).includes(query) ||
                normalizeSearch(course.department?.code).includes(query) ||
                normalizeSearch(course.school?.name).includes(query) ||
                normalizeSearch(course.school?.code).includes(query) ||
                normalizeSearch(course.university?.name).includes(query) ||
                normalizeSearch(course.createdBy?.name).includes(query) ||
                normalizeSearch(course.updatedBy?.name).includes(query);

            const matchesStatus =
                statusFilter === "ALL" || course.activeStatus === statusFilter;

            const matchesDepartment =
                departmentFilter === "ALL" ||
                course.department?.id === Number(departmentFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                course.school?.id === Number(schoolFilter);

            const matchesUniversity =
                universityFilter === "ALL" ||
                course.university?.id === Number(universityFilter);

            const matchesEnrollment =
                enrollmentFilter === "ALL" ||
                (enrollmentFilter === "ALLOWED" && course.newEnrollmentAllowed === true) ||
                (enrollmentFilter === "CLOSED" && course.newEnrollmentAllowed !== true);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesDepartment &&
                matchesSchool &&
                matchesUniversity &&
                matchesEnrollment
            );
        });

        result.sort((a, b) => {
            switch (sort) {
                case "NAME_ASC":
                    return a.name.localeCompare(b.name);
                case "NAME_DESC":
                    return b.name.localeCompare(a.name);
                case "CODE_ASC":
                    return a.code.localeCompare(b.code);
                case "CODE_DESC":
                    return b.code.localeCompare(a.code);
                case "NEWEST":
                default:
                    return (b.id ?? 0) - (a.id ?? 0);
            }
        });

        return result;
    }, [
        courses,
        search,
        statusFilter,
        departmentFilter,
        schoolFilter,
        universityFilter,
        enrollmentFilter,
        sort,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Pagination                                                             */
    /* ---------------------------------------------------------------------- */

    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const visibleCourses = filteredCourses.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [
        search,
        statusFilter,
        departmentFilter,
        schoolFilter,
        universityFilter,
        enrollmentFilter,
        sort,
    ]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        departmentFilter !== "ALL" ||
        schoolFilter !== "ALL" ||
        universityFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        enrollmentFilter !== "ALL" ||
        sort !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setDepartmentFilter("ALL");
        setSchoolFilter("ALL");
        setUniversityFilter("ALL");
        setStatusFilter("ALL");
        setEnrollmentFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    /* ---------------------------------------------------------------------- */
    /* CRUD & Dialog Handlers                                                 */
    /* ---------------------------------------------------------------------- */

    function openCreateDialog() {
        setPageError("");
        setNotice("");

        // Load departments from common controller if not loaded
        if (departments.length === 0) {
            void loadDepartments();
        }

        // Pre-select the department if chosen in table filter
        const defaultDept = departmentFilter !== "ALL" ? Number(departmentFilter) : "";
        setDialog({
            mode: "CREATE",
            course: null,
            defaultDepartmentId: defaultDept,
        });
    }

    function openDialog(
        mode: DialogMode,
        course: CourseResponse | null = null
    ) {
        setPageError("");
        setNotice("");
        setDialog({ mode, course });
    }

    async function handleCreate(
        departmentId: number,
        request: CourseCreateRequest
    ) {
        setBusy(true);
        try {
            await createCourse(departmentId, request);
            setDialog(null);
            setNotice(`Course "${request.name}" created successfully.`);
            toast.success(`Course "${request.name}" created successfully.`);
            await loadCourses(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not create course: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(request: CourseRequest) {
        setBusy(true);
        try {
            await updateCourse(request);
            setDialog(null);
            setNotice("Course updated successfully.");
            toast.success("Course updated successfully.");
            await loadCourses(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not update course: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(courseId: number) {
        setBusy(true);
        try {
            const message = await deleteCourse(courseId);
            setDialog(null);
            setNotice(message || "Course deleted successfully.");
            toast.success(message || "Course deleted successfully.");
            await loadCourses(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not delete course: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
    };

    /* ---------------------------------------------------------------------- */
    /* Render Page                                                            */
    /* ---------------------------------------------------------------------- */

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
                    <span className="truncate">Academic Management</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Courses</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Infrastructure &amp; Curriculum
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Course Management
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Manage department-scoped courses, configure active statuses, monitor enrollment permissions, and track audit history.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                void loadDepartments();
                                void loadCourses(true);
                            }}
                            disabled={loading || refreshing}
                            title="Refresh course list"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-3 sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={
                                    refreshing || loading
                                        ? "animate-spin text-cyan-400"
                                        : ""
                                }
                            />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreateDialog}
                            disabled={loading || refreshing}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Add Course</span>
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
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm ${
                            pageError
                                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        }`}
                    >
                        <div className="flex items-start gap-2.5">
                            {pageError ? (
                                <AlertTriangle
                                    size={18}
                                    className="mt-0.5 shrink-0 text-rose-400"
                                />
                            ) : (
                                <CheckCircle2
                                    size={18}
                                    className="mt-0.5 shrink-0 text-emerald-400"
                                />
                            )}
                            <div>
                                <p className="font-semibold text-white">
                                    {pageError ? "Action Required" : "Success"}
                                </p>
                                <p className="mt-0.5 leading-relaxed">
                                    {pageError || notice}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {pageError && (
                                <button
                                    type="button"
                                    onClick={() => void loadCourses()}
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
                aria-label="Course statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
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
                            whileHover={reduceMotion ? undefined : { y: -3 }}
                            className={`rounded-2xl border bg-gradient-to-br p-3.5 sm:p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-300 truncate sm:text-sm">
                                        {stat.label}
                                    </p>
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

            {/* Main Data Container: Secondary Filters + Table + Mobile Cards */}
            <GlassCard>
                {/* Secondary Search & Filter Toolbar */}
                <div className="grid gap-2.5 sm:gap-3 border-b border-white/10 p-3 sm:p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    {/* Search Field */}
                    <div className="relative min-w-0 sm:col-span-2 md:col-span-1">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                            aria-label="Search courses"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, code, author..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-9 pr-8 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50"
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

                    {/* Department Filter (from loaded courses data) */}
                    <div className="relative">
                        <select
                            aria-label="Filter by department"
                            value={departmentFilter}
                            onChange={(event) =>
                                setDepartmentFilter(event.target.value)
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 pr-8 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All Departments</option>
                            {tableDepartments.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* School Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by school"
                            value={schoolFilter}
                            onChange={(event) => setSchoolFilter(event.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 pr-8 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All Schools</option>
                            {tableSchools.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
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
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 pr-8 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ENABLE">Active</option>
                            <option value="DISABLE">Inactive</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Enrollment Allowed Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by enrollment"
                            value={enrollmentFilter}
                            onChange={(event) =>
                                setEnrollmentFilter(event.target.value as EnrollmentFilter)
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 pr-8 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All Enrollments</option>
                            <option value="ALLOWED">Enrollment Open</option>
                            <option value="CLOSED">Enrollment Closed</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Sort Filter */}
                    <div className="relative flex items-center gap-2">
                        <div className="relative w-full">
                            <select
                                aria-label="Sort courses"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value as SortOption)
                                }
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 pr-8 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50"
                            >
                                <option value="NEWEST">Newest First</option>
                                <option value="NAME_ASC">Name (A to Z)</option>
                                <option value="NAME_DESC">Name (Z to A)</option>
                                <option value="CODE_ASC">Code (A to Z)</option>
                                <option value="CODE_DESC">Code (Z to A)</option>
                            </select>
                            <ArrowDownUp
                                size={14}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                title="Reset all filters"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 1. Desktop Table View (>= lg) */}
                <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Course</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Department</th>
                                <th className="px-4 py-4 font-medium">School</th>
                                <th className="px-4 py-4 font-medium">University</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-4 py-4 font-medium">Enrollment</th>
                                <th className="px-4 py-4 font-medium">Curricula</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`loading-${i}`}>
                                        {Array.from({ length: 10 }).map((__, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && courses.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load courses
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                                            {pageError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadCourses()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : visibleCourses.length > 0 ? (
                                visibleCourses.map((course, index) => {
                                    const initials = getInitials(course.name);
                                    const canUpdate = hasCoursePermission(course, "UPDATE");
                                    const canDelete = hasCoursePermission(course, "DELETE");
                                    const curriculaCount =
                                        course.subjects.length +
                                        course.sections.length +
                                        course.specializations.length;

                                    return (
                                        <motion.tr
                                            key={course.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.035]"
                                        >
                                            <td className="px-5 py-4 text-slate-500 text-xs font-mono">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>

                                            {/* Course Name & Audit Pill */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0 max-w-[240px]">
                                                        <p className="truncate font-semibold text-slate-100">
                                                            {course.name || "Unnamed Course"}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                ID #{course.id}
                                                            </span>
                                                            <span className="text-slate-600">·</span>
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                title={`Created by: ${formatAuditActor(course.createdBy)}${course.createdAt ? ` on ${formatDate(course.createdAt)}` : ""}${course.updatedBy?.name ? ` | Modified by: ${formatAuditActor(course.updatedBy)}` : ""}`}
                                                            >
                                                                <UserCheck size={11} className="text-emerald-400 shrink-0" />
                                                                <span className="truncate max-w-[120px] font-medium text-slate-300">
                                                                    {course.createdBy?.name || "System"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1 font-mono text-xs text-cyan-200">
                                                    {course.code || "—"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="min-w-0 max-w-[170px]">
                                                    <p className="truncate font-medium text-slate-200">
                                                        {course.department?.name || "—"}
                                                    </p>
                                                    {course.department?.code && (
                                                        <span className="font-mono text-[11px] text-cyan-400">
                                                            {course.department.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="min-w-0 max-w-[150px]">
                                                    <p className="truncate font-medium text-slate-300">
                                                        {course.school?.name || "—"}
                                                    </p>
                                                    {course.school?.code && (
                                                        <span className="font-mono text-[11px] text-slate-500">
                                                            {course.school.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="min-w-0 max-w-[150px]">
                                                    <p className="truncate font-medium text-slate-300">
                                                        {course.university?.name || "—"}
                                                    </p>
                                                    {course.university?.code && (
                                                        <span className="font-mono text-[11px] text-slate-500">
                                                            {course.university.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <StatusBadge status={course.activeStatus} />
                                            </td>

                                            <td className="px-4 py-4">
                                                <EnrollmentBadge allowed={course.newEnrollmentAllowed} />
                                            </td>

                                            <td className="px-4 py-4">
                                                <span
                                                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300"
                                                    title={`${course.subjects.length} Subjects, ${course.sections.length} Sections, ${course.specializations.length} Specializations`}
                                                >
                                                    <Layers size={12} className="text-cyan-400" />
                                                    {curriculaCount} units
                                                </span>
                                            </td>

                                            {/* Action Buttons: Strict h-8 w-8 preventing pill distortion */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("VIEW", course)}
                                                        aria-label={`View details of ${course.name}`}
                                                        title="View details & audit"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10 active:scale-95"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {canUpdate && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("EDIT", course)}
                                                            aria-label={`Edit ${course.name}`}
                                                            title="Edit course"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 active:scale-95"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("DELETE", course)}
                                                            aria-label={`Delete ${course.name}`}
                                                            title="Delete course"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-rose-400 transition hover:border-rose-400/30 hover:bg-rose-400/10 active:scale-95"
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
                                    <td colSpan={10} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <BookOpen size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching courses found"
                                                : "No courses registered yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search term, changing filters, or clearing search criteria."
                                                : "Get started by adding your department's first course."}
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
                                                    onClick={openCreateDialog}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plus size={14} />
                                                    Add Course
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
                    ) : visibleCourses.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <BookOpen size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-300">No courses found</p>
                            <p className="mt-1 text-xs text-slate-500">
                                {hasActiveFilters ? "Try clearing active filters." : "No courses added yet."}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                                >
                                    <RotateCcw size={13} />
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        visibleCourses.map((course) => {
                            const initials = getInitials(course.name);
                            const canUpdate = hasCoursePermission(course, "UPDATE");
                            const canDelete = hasCoursePermission(course, "DELETE");

                            return (
                                <article
                                    key={course.id}
                                    className="min-w-0 space-y-3 p-3.5 sm:p-5"
                                >
                                    {/* Card Top Header */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                            {initials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-white break-words">
                                                    {course.name}
                                                </h3>
                                                <StatusBadge status={course.activeStatus} />
                                                <EnrollmentBadge allowed={course.newEnrollmentAllowed} />
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                                                <span>
                                                    Code: <strong className="text-cyan-300">{course.code}</strong>
                                                </span>
                                                <span>·</span>
                                                <span>ID #{course.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary 4-cell Grid */}
                                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs sm:grid-cols-4 sm:p-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Department</p>
                                            <p className="font-semibold text-white mt-0.5 truncate">
                                                {course.department?.name || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">School</p>
                                            <p className="font-semibold text-slate-300 mt-0.5 truncate">
                                                {course.school?.name || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">University</p>
                                            <p className="font-semibold text-slate-300 mt-0.5 truncate">
                                                {course.university?.name || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Curricula</p>
                                            <p className="font-semibold text-cyan-300 mt-0.5">
                                                {course.subjects.length} sub · {course.sections.length} sec
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Audit Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-1.5 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                {course.createdBy?.name || "System"}
                                            </span>
                                            {course.createdAt && (
                                                <span className="text-slate-500 font-mono text-[10px]">
                                                    · {formatDate(course.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {course.updatedBy?.name && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="text-slate-500">Updated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {course.updatedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons Toolbar */}
                                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openDialog("VIEW", course)}
                                                aria-label={`View details of ${course.name}`}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {canUpdate && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDialog("EDIT", course)}
                                                    aria-label={`Edit ${course.name}`}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => openDialog("DELETE", course)}
                                                    aria-label={`Delete ${course.name}`}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-rose-400"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>

                                        <span className="text-[11px] text-slate-400 font-mono">
                                            ID #{course.id}
                                        </span>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>

                {/* Footer Pagination Controls */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {filteredCourses.length === 0
                            ? "Showing 0 courses"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                  currentPage * PAGE_SIZE,
                                  filteredCourses.length
                              )} of ${filteredCourses.length} courses`}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            title="First page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsLeft size={15} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((v) => Math.max(1, v - 1))}
                            aria-label="Previous page"
                            title="Previous page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={15} />
                        </button>

                        {/* Compact on mobile (<sm), full buttons on sm+ */}
                        <span className="flex sm:hidden items-center px-2 text-xs font-semibold text-cyan-300">
                            {currentPage} / {totalPages}
                        </span>

                        <span className="hidden sm:inline-flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(
                                    (n) =>
                                        n === 1 ||
                                        n === totalPages ||
                                        Math.abs(n - currentPage) <= 1
                                )
                                .map((n, i, pages) => (
                                    <span key={n} className="contents">
                                        {i > 0 && n - pages[i - 1] > 1 && (
                                            <span className="px-1 text-slate-500 text-xs">
                                                …
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setPage(n)}
                                            aria-current={
                                                currentPage === n ? "page" : undefined
                                            }
                                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition ${
                                                currentPage === n
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
                            onClick={() =>
                                setPage((v) => Math.min(totalPages, v + 1))
                            }
                            aria-label="Next page"
                            title="Next page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={15} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            title="Last page"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsRight size={15} />
                        </button>
                    </div>
                </footer>
            </GlassCard>

            {/* Modal Dialog */}
            <AnimatePresence>
                {dialog && (
                    <CourseDialog
                        key={`${dialog.mode}-${dialog.course?.id ?? "new"}`}
                        mode={dialog.mode}
                        course={dialog.course}
                        defaultDepartmentId={dialog.defaultDepartmentId}
                        departments={departments}
                        departmentsLoading={departmentsLoading}
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
