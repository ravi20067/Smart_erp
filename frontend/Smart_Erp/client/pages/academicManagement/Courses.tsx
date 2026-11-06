
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
    createCourse,
    deleteCourse,
    extractErrorMessage,
    getAcademicYearFilter,
    getAllCourses,
    getCoursePrefix,
    hasCoursePermission,
    normalizeSearch,
    uniqueDTOs,
    updateCourse,
    type ActiveStatus,
    type CommonDTO,
    type CourseCreateRequest,
    type CourseRequest,
    type CourseResponse,
} from "@/services/academic/courseService";

/* -------------------------------------------------------------------------- */
/* Types and constants                                                        */
/* -------------------------------------------------------------------------- */

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "CODE_ASC"
    | "CODE_DESC";

interface CourseForm {
    academicYearId: number | "";
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    newEnrollmentAllowed: boolean;
}

interface FieldErrors {
    academicYearId?: string;
    name?: string;
    code?: string;
}

interface CourseDialogProps {
    mode: DialogMode;
    course: CourseResponse | null;
    academicYears: CommonDTO[];
    busy: boolean;
    onClose: () => void;
    onCreate: (
        academicYearId: number,
        request: CourseCreateRequest
    ) => Promise<void>;
    onUpdate: (request: CourseRequest) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

const PAGE_SIZE = 8;

const EMPTY_FORM: CourseForm = {
    academicYearId: "",
    name: "",
    code: "",
    activeStatus: "ENABLE",
    newEnrollmentAllowed: true,
};

/* -------------------------------------------------------------------------- */
/* General helpers                                                            */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-IN").format(value);
}

function removePrefix(code: string, prefix: string): string {
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

function getInitials(name: string): string {
    return (
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "CR"
    );
}

/* -------------------------------------------------------------------------- */
/* Reusable UI components                                                     */
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

function SelectChevron() {
    return (
        <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function StatusBadge({ status }: { status: ActiveStatus }) {
    const active = status === "ENABLE";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${active
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-amber-400"
                    }`}
            />
            {statusLabel(status)}
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
                className="shrink-0 text-slate-400 hover:text-white"
            >
                <X size={17} />
            </button>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Course dialog                                                              */
/* -------------------------------------------------------------------------- */

function CourseDialog({
    mode,
    course,
    academicYears,
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

    const [form, setForm] = useState<CourseForm>(() => ({
        academicYearId: course?.academicYear?.id ?? "",
        name: course?.name ?? "",
        code: course?.code ?? "",
        activeStatus: course?.activeStatus ?? "ENABLE",
        newEnrollmentAllowed: course?.newEnrollmentAllowed ?? true,
    }));

    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const selectedAcademicYear = academicYears.find(
        (year) => year.id === Number(form.academicYearId)
    );

    const academicYearName =
        selectedAcademicYear?.name ?? course?.academicYear?.name ?? "—";

    const universityName = course?.university?.name ?? "—";
    const schoolName = course?.school?.name ?? "—";
    const departmentName = course?.department?.name ?? "—";

    const title: Record<DialogMode, string> = {
        CREATE: "Create Course",
        EDIT: "Edit Course",
        VIEW: "Course Details",
        DELETE: "Delete Course",
    };

    /*
     * The prefix is supplied by the backend.
     * It is displayed separately and never included in the submitted code.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadPrefix() {
            const yearId = Number(form.academicYearId);

            if ((!isCreate && !isEdit) || !yearId || yearId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            setPrefix("");
            setPrefixError("");
            setPrefixLoading(true);

            try {
                const result = await getCoursePrefix(
                    yearId,
                    isEdit && course ? course.id : undefined
                );

                if (cancelled) return;

                setPrefix(result);

                if (isEdit && course) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(course.code, result),
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    setPrefixError(extractErrorMessage(error));
                }
            } finally {
                if (!cancelled) setPrefixLoading(false);
            }
        }

        void loadPrefix();

        return () => {
            cancelled = true;
        };
    }, [
        form.academicYearId,
        isCreate,
        isEdit,
        course?.id,
        course?.code,
    ]);

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
            const yearId = Number(form.academicYearId);

            if (!yearId || yearId <= 0) {
                errors.academicYearId = "Please select an academic year.";
            } else if (!academicYears.some((year) => year.id === yearId)) {
                errors.academicYearId =
                    "The selected academic year is no longer available.";
            }
        }

        if (!name) {
            errors.name = "Course name is required.";
        } else if (name.length < 2) {
            errors.name = "Course name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "Course name cannot exceed 150 characters.";
        }

        if (!prefix) {
            errors.code = "The fixed course-code prefix could not be loaded.";
        } else if (!code) {
            errors.code = "Course code suffix is required.";
        } else if (code.length > 40) {
            errors.code = "Course code suffix cannot exceed 40 characters.";
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
                        lower.includes("cannot delete")
                        ? "This course has related records. Reassign or remove those records before deleting the course."
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
            setDialogError("Please wait while the course prefix loads.");
            return;
        }

        if (prefixError) {
            setDialogError(prefixError);
            return;
        }

        if (!validate()) return;

        /*
         * IMPORTANT:
         * Submit only the editable suffix.
         * The backend adds the fixed prefix.
         */
        const code = form.code.trim();
        const name = form.name.trim();

        try {
            if (isCreate) {
                await onCreate(Number(form.academicYearId), {
                    name,
                    code,
                });
            } else if (isEdit && course) {
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
                aria-labelledby="course-dialog-title"
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
                            id="course-dialog-title"
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
                    className="max-h-[78vh] space-y-5 overflow-y-auto p-5 sm:p-6"
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

                                <div className="min-w-0">
                                    <p className="font-semibold text-white">
                                        Delete this course?
                                    </p>

                                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                                        You are about to delete{" "}
                                        <strong className="text-white">
                                            {course?.name}
                                        </strong>
                                        . This action may be blocked if related
                                        records exist.
                                    </p>

                                    <p className="mt-2 break-all font-mono text-xs text-cyan-300">
                                        {course?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isCreate && (
                                <div>
                                    <label
                                        htmlFor="course-academic-year"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Academic Year{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="course-academic-year"
                                            value={form.academicYearId}
                                            onChange={(event) => {
                                                changeField(
                                                    "academicYearId",
                                                    event.target.value
                                                        ? Number(event.target.value)
                                                        : ""
                                                );
                                                changeField("code", "");
                                            }}
                                            disabled={busy || academicYears.length === 0}
                                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-60"
                                        >
                                            <option value="">
                                                Select academic year
                                            </option>

                                            {academicYears.map((year) => (
                                                <option
                                                    key={year.id}
                                                    value={year.id}
                                                >
                                                    {year.name}
                                                    {year.code ? ` (${year.code})` : ""}
                                                </option>
                                            ))}
                                        </select>

                                        <SelectChevron />
                                    </div>

                                    {academicYears.length === 0 && (
                                        <p className="mt-2 text-xs text-amber-300">
                                            No academic years are available.
                                            Course creation is unavailable.
                                        </p>
                                    )}

                                    <FieldError>
                                        {fieldErrors.academicYearId}
                                    </FieldError>
                                </div>
                            )}

                            {!isCreate && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoField
                                        label="Academic Year"
                                        value={academicYearName}
                                    />
                                    <InfoField
                                        label="Department"
                                        value={departmentName}
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

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="course-name"
                                        className="text-sm font-medium text-slate-300"
                                    >
                                        Course Name{" "}
                                        <span className="text-cyan-400">*</span>
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
                                    placeholder="e.g. Bachelor of Technology"
                                    className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 ${fieldErrors.name
                                        ? "border-rose-500/60 focus:border-rose-400"
                                        : "border-white/10 focus:border-cyan-400/60"
                                        } read-only:opacity-75`}
                                />

                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            <div>
                                <label
                                    htmlFor="course-code"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Course Code{" "}
                                    <span className="text-cyan-400">*</span>
                                </label>

                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[55%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading
                                                ? "Loading..."
                                                : prefix || "PREFIX"}
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
                                        placeholder="CSE"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>

                                <FieldError>
                                    {fieldErrors.code || prefixError}
                                </FieldError>

                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    The prefix is fixed by the server. Only
                                    the suffix is entered and sent to the API.
                                </p>
                            </div>

                            {!isCreate && (
                                <>
                                    <div>
                                        <label
                                            htmlFor="course-status"
                                            className="mb-2 block text-sm font-medium text-slate-300"
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

                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
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
                                            className="mt-1 h-4 w-4 accent-cyan-400"
                                        />

                                        <span>
                                            <span className="block text-sm font-medium text-slate-200">
                                                Allow new enrollment
                                            </span>
                                            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                                                Allow new students to enroll
                                                in this course.
                                            </span>
                                        </span>
                                    </label>
                                </>
                            )}

                            {isView && course && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Course Information
                                    </p>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <InfoField
                                            label="Course ID"
                                            value={String(course.id)}
                                        />
                                        <InfoField
                                            label="Status"
                                            value={statusLabel(course.activeStatus)}
                                        />
                                        <InfoField
                                            label="New Enrollment"
                                            value={
                                                course.newEnrollmentAllowed === null
                                                    ? "Not specified"
                                                    : course.newEnrollmentAllowed
                                                        ? "Allowed"
                                                        : "Not allowed"
                                            }
                                        />
                                        <InfoField
                                            label="Subjects"
                                            value={String(course.subjects.length)}
                                        />
                                        <InfoField
                                            label="Sections"
                                            value={String(course.sections.length)}
                                        />
                                        <InfoField
                                            label="Specializations"
                                            value={String(course.specializations.length)}
                                        />
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <AssociationList
                                            title="Subjects"
                                            items={course.subjects}
                                        />
                                        <AssociationList
                                            title="Sections"
                                            items={course.sections}
                                        />
                                        <AssociationList
                                            title="Specializations"
                                            items={course.specializations}
                                        />
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="mb-2 text-xs text-slate-500">
                                            Available permissions
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {course.permissionActions.length ? (
                                                course.permissionActions.map(
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
                                                    No update or delete
                                                    permissions were returned.
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
                                    (isCreate && academicYears.length === 0)
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

function InfoField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-medium text-slate-200">
                {value || "—"}
            </p>
        </div>
    );
}

function AssociationList({
    title,
    items,
}: {
    title: string;
    items: CommonDTO[];
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <p className="mb-2 text-xs font-semibold text-slate-400">
                {title} ({items.length})
            </p>

            {items.length ? (
                <div className="space-y-2">
                    {items.slice(0, 5).map((item) => (
                        <div key={item.id} className="min-w-0">
                            <p className="truncate text-xs text-slate-200">
                                {item.name || "Unnamed"}
                            </p>
                            {item.code && (
                                <p className="truncate font-mono text-[10px] text-slate-500">
                                    {item.code}
                                </p>
                            )}
                        </div>
                    ))}

                    {items.length > 5 && (
                        <p className="text-[10px] text-slate-500">
                            +{items.length - 5} more
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-xs text-slate-500">No records linked</p>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Courses page                                                          */
/* -------------------------------------------------------------------------- */

export default function Courses() {
    const reduceMotion = useReducedMotion();

    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [academicYears, setAcademicYears] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [academicYearError, setAcademicYearError] = useState("");
    const [notice, setNotice] = useState("");

    /* All table filters are local. */
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [academicYearFilter, setAcademicYearFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        course: CourseResponse | null;
    } | null>(null);

    /* ---------------------------------------------------------------------- */
    /* Load the complete hierarchical response once                          */
    /* ---------------------------------------------------------------------- */

    const loadCourses = useCallback(async (background = false) => {
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError("");

        try {
            const result = await getAllCourses();
            setCourses(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load courses: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadAcademicYears = useCallback(async () => {
        setAcademicYearError("");

        try {
            const result = await getAcademicYearFilter();
            setAcademicYears(uniqueDTOs(result));
        } catch (error) {
            const message = extractErrorMessage(error);
            setAcademicYearError(message);
            toast.error(`Could not load academic years: ${message}`);
        }
    }, []);

    useEffect(() => {
        void loadCourses();
        void loadAcademicYears();
    }, [loadCourses, loadAcademicYears]);

    useEffect(() => {
        if (!notice) return;

        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    /* ---------------------------------------------------------------------- */
    /* Hierarchical filter options from already-loaded course data            */
    /* University -> School -> Department -> Academic Year                    */
    /* ---------------------------------------------------------------------- */

    const tableUniversities = useMemo(
        () => uniqueDTOs(courses.map((course) => course.university)),
        [courses]
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

    const tableDepartments = useMemo(
        () =>
            uniqueDTOs(
                courses
                    .filter(
                        (course) =>
                            universityFilter === "ALL" ||
                            course.university?.id === Number(universityFilter)
                    )
                    .filter(
                        (course) =>
                            schoolFilter === "ALL" ||
                            course.school?.id === Number(schoolFilter)
                    )
                    .map((course) => course.department)
            ),
        [courses, universityFilter, schoolFilter]
    );

    const tableAcademicYears = useMemo(
        () =>
            uniqueDTOs(
                courses
                    .filter(
                        (course) =>
                            universityFilter === "ALL" ||
                            course.university?.id === Number(universityFilter)
                    )
                    .filter(
                        (course) =>
                            schoolFilter === "ALL" ||
                            course.school?.id === Number(schoolFilter)
                    )
                    .filter(
                        (course) =>
                            departmentFilter === "ALL" ||
                            course.department?.id === Number(departmentFilter)
                    )
                    .map((course) => course.academicYear)
            ),
        [courses, universityFilter, schoolFilter, departmentFilter]
    );

    /* Keep dependent hierarchy selections valid. */
    useEffect(() => {
        if (
            schoolFilter !== "ALL" &&
            !tableSchools.some((school) => school.id === Number(schoolFilter))
        ) {
            setSchoolFilter("ALL");
        }
    }, [schoolFilter, tableSchools]);

    useEffect(() => {
        if (
            departmentFilter !== "ALL" &&
            !tableDepartments.some(
                (department) => department.id === Number(departmentFilter)
            )
        ) {
            setDepartmentFilter("ALL");
        }
    }, [departmentFilter, tableDepartments]);

    useEffect(() => {
        if (
            academicYearFilter !== "ALL" &&
            !tableAcademicYears.some(
                (year) => year.id === Number(academicYearFilter)
            )
        ) {
            setAcademicYearFilter("ALL");
        }
    }, [academicYearFilter, tableAcademicYears]);

    /* ---------------------------------------------------------------------- */
    /* Statistics from all loaded records                                     */
    /* ---------------------------------------------------------------------- */

    const stats = useMemo(() => {
        const active = courses.filter(
            (course) => course.activeStatus === "ENABLE"
        ).length;

        const inactive = courses.filter(
            (course) => course.activeStatus === "DISABLE"
        ).length;

        const enrollmentAllowed = courses.filter(
            (course) => course.newEnrollmentAllowed === true
        ).length;

        return [
            {
                label: "Total Courses",
                value: formatNumber(courses.length),
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
                label: "Inactive Courses",
                value: formatNumber(inactive),
                icon: ShieldCheck,
                tone: "purple",
            },
            {
                label: "Enrollment Allowed",
                value: formatNumber(enrollmentAllowed),
                icon: Building2,
                tone: "blue",
            },
        ];
    }, [courses]);

    /* ---------------------------------------------------------------------- */
    /* Local search, filters and sorting                                      */
    /* ---------------------------------------------------------------------- */

    const filteredCourses = useMemo(() => {
        const query = normalizeSearch(search);

        const result = courses.filter((course) => {
            const matchesSearch =
                !query ||
                normalizeSearch(course.name).includes(query) ||
                normalizeSearch(course.code).includes(query) ||
                String(course.id).includes(query) ||
                normalizeSearch(course.academicYear?.name).includes(query) ||
                normalizeSearch(course.academicYear?.code).includes(query) ||
                normalizeSearch(course.department?.name).includes(query) ||
                normalizeSearch(course.department?.code).includes(query) ||
                normalizeSearch(course.school?.name).includes(query) ||
                normalizeSearch(course.school?.code).includes(query) ||
                normalizeSearch(course.university?.name).includes(query) ||
                normalizeSearch(course.university?.code).includes(query);

            const matchesStatus =
                statusFilter === "ALL" ||
                course.activeStatus === statusFilter;

            const matchesUniversity =
                universityFilter === "ALL" ||
                course.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                course.school?.id === Number(schoolFilter);

            const matchesDepartment =
                departmentFilter === "ALL" ||
                course.department?.id === Number(departmentFilter);

            const matchesAcademicYear =
                academicYearFilter === "ALL" ||
                course.academicYear?.id === Number(academicYearFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment &&
                matchesAcademicYear
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
                    return b.id - a.id;
            }
        });

        return result;
    }, [
        courses,
        search,
        statusFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
        academicYearFilter,
        sort,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Pagination                                                             */
    /* ---------------------------------------------------------------------- */

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCourses.length / PAGE_SIZE)
    );

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
        universityFilter,
        schoolFilter,
        departmentFilter,
        academicYearFilter,
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
        academicYearFilter !== "ALL" ||
        sort !== "NEWEST";

    /* ---------------------------------------------------------------------- */
    /* Dialog and CRUD handlers                                               */
    /* ---------------------------------------------------------------------- */

    async function openCreateDialog() {
        setPageError("");
        setNotice("");

        /* Refresh form options only; do not reload the course table. */
        try {
            const result = await getAcademicYearFilter();
            const options = uniqueDTOs(result);

            setAcademicYears(options);

            if (options.length === 0) {
                toast.error(
                    "No academic years are available for course creation."
                );
                return;
            }

            setAcademicYearError("");
            setDialog({ mode: "CREATE", course: null });
        } catch (error) {
            const message = extractErrorMessage(error);
            setAcademicYearError(message);
            toast.error(`Cannot create a course: ${message}`);
        }
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
        academicYearId: number,
        request: CourseCreateRequest
    ) {
        setBusy(true);

        try {
            await createCourse(academicYearId, request);

            setDialog(null);
            setNotice("Course created successfully.");
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

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setAcademicYearFilter("ALL");
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
                    <span>Academic Management</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Courses</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Course Management
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage courses across your academic hierarchy,
                            inspect linked academic records, and control
                            course access using your assigned permissions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void loadCourses(true)}
                            disabled={loading || refreshing}
                            title="Refresh courses"
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
                            Add Course
                        </button>
                    </div>
                </div>
            </section>

            {/* Error and success messages */}
            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        title="Could not load courses"
                        message={pageError}
                        onRetry={() => void loadCourses()}
                        onDismiss={() => setPageError("")}
                    />
                )}

                {academicYearError && (
                    <ErrorBanner
                        title="Academic-year options unavailable"
                        message={academicYearError}
                        onRetry={() =>
                            void loadAcademicYears()
                        }
                        onDismiss={() => setAcademicYearError("")}
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
                aria-label="Course statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
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

            {/* Filters and table */}
            <GlassCard>
                <div className="grid gap-3.5 border-b border-white/10 p-4 sm:p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-[minmax(200px,1.4fr)_140px_160px_160px_160px_160px_170px_auto]">
                    {/* Search */}
                    <div className="relative min-w-0 sm:col-span-2 md:col-span-1">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            aria-label="Search courses"
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

                    {/* Status */}
                    <div className="relative">
                        <select
                            aria-label="Filter by status"
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

                    {/* University */}
                    <div className="relative">
                        <select
                            aria-label="Filter by university"
                            value={universityFilter}
                            onChange={(event) => {
                                setUniversityFilter(event.target.value);
                                setSchoolFilter("ALL");
                                setDepartmentFilter("ALL");
                                setAcademicYearFilter("ALL");
                            }}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All universities</option>
                            {tableUniversities.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* School */}
                    <div className="relative">
                        <select
                            aria-label="Filter by school"
                            value={schoolFilter}
                            onChange={(event) => {
                                setSchoolFilter(event.target.value);
                                setDepartmentFilter("ALL");
                                setAcademicYearFilter("ALL");
                            }}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All schools</option>
                            {tableSchools.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Department */}
                    <div className="relative">
                        <select
                            aria-label="Filter by department"
                            value={departmentFilter}
                            onChange={(event) => {
                                setDepartmentFilter(event.target.value);
                                setAcademicYearFilter("ALL");
                            }}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All departments</option>
                            {tableDepartments.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Academic Year (comes after Department) */}
                    <div className="relative">
                        <select
                            aria-label="Filter by academic year"
                            value={academicYearFilter}
                            onChange={(event) =>
                                setAcademicYearFilter(event.target.value)
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All academic years</option>
                            {tableAcademicYears.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            aria-label="Sort courses"
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
                            <option value="CODE_DESC">Code: Z to A</option>
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
                    <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Course</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Academic Year</th>
                                <th className="px-4 py-4 font-medium">Department</th>
                                <th className="px-4 py-4 font-medium">School</th>
                                <th className="px-4 py-4 font-medium">University</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map(
                                    (_, rowIndex) => (
                                        <tr key={`loading-${rowIndex}`}>
                                            {Array.from({ length: 9 }).map(
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
                            ) : pageError && courses.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>

                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load courses
                                        </p>

                                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
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
                                <AnimatePresence mode="popLayout">
                                    {visibleCourses.map((course, index) => {
                                        const canUpdate = hasCoursePermission(
                                            course,
                                            "UPDATE"
                                        );

                                        const canDelete = hasCoursePermission(
                                            course,
                                            "DELETE"
                                        );

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={course.id}
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
                                                    {(currentPage - 1) *
                                                        PAGE_SIZE +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-cyan-200">
                                                            {getInitials(course.name)}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="max-w-xs truncate font-semibold text-slate-100">
                                                                {course.name ||
                                                                    "Unnamed Course"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                ID: {course.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <span className="inline-flex max-w-[180px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {course.code || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {course.academicYear?.name || "—"}
                                                    </p>
                                                    {course.academicYear?.code && (
                                                        <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                            {course.academicYear.code}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {course.department?.name || "—"}
                                                    </p>
                                                    {course.department?.code && (
                                                        <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                            {course.department.code}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {course.school?.name || "—"}
                                                    </p>
                                                    {course.school?.code && (
                                                        <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                            {course.school.code}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {course.university?.name || "—"}
                                                    </p>
                                                    {course.university?.code && (
                                                        <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                            {course.university.code}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <StatusBadge
                                                        status={course.activeStatus}
                                                    />
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDialog("VIEW", course)
                                                            }
                                                            aria-label={`View ${course.name}`}
                                                            title="View details"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={17} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDialog("EDIT", course)
                                                                }
                                                                aria-label={`Edit ${course.name}`}
                                                                title="Edit course"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil size={17} />
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDialog("DELETE", course)
                                                                }
                                                                aria-label={`Delete ${course.name}`}
                                                                title="Delete course"
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
                                                ? "No matching courses found"
                                                : "No courses registered yet"}
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : "Courses will appear here after they are created."}
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
                                            courses.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void openCreateDialog()
                                                    }
                                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110"
                                                >
                                                    <Plus size={15} />
                                                    Add Course
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
                        {filteredCourses.length === 0
                            ? "Showing 0 courses"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1
                            }–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredCourses.length
                            )} of ${filteredCourses.length} courses${filteredCourses.length !== courses.length
                                ? ` (filtered from ${courses.length})`
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
                    <CourseDialog
                        key={`${dialog.mode}-${dialog.course?.id ?? "new"}`}
                        mode={dialog.mode}
                        course={dialog.course}
                        academicYears={academicYears}
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
