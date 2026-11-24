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
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Eye,
    FlaskConical,
    GraduationCap,
    Layers,
    Library,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    User,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import {
    createSubject,
    deleteSubject,
    extractErrorMessage,
    formatAuditActor,
    getAllSubjects,
    getCourseFilter,
    getSpecializationFilter,
    getSubjectPrefix,
    getTeacherFilter,
    removePrefix,
    uniqueCommonDTOs,
    updateSubject,
    type ActiveStatus,
    type CommonDTO,
    type CommonRequest,
    type PermissionAction,
    type SubjectRequest,
    type SubjectResponse,
} from "@/services/academic/subjectService";

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
type TypeFilter = "ALL" | "THEORY" | "PRACTICAL";
type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "CODE_ASC"
    | "LECTURES_DESC";

interface SubjectForm {
    courseId: number | "";
    name: string;
    code: string;
    lecturesPerWeek: string;
    isPracticalSubject: boolean;
    activeStatus: ActiveStatus;
    specializationIds: number[];
}

interface FieldErrors {
    courseId?: string;
    name?: string;
    code?: string;
    lecturesPerWeek?: string;
}

interface DialogProps {
    mode: DialogMode;
    subject: SubjectResponse | null;
    courses: CommonDTO[];
    specializations: CommonDTO[];
    busy: boolean;
    onClose: () => void;
    onCreate: (courseId: number, request: CommonRequest) => Promise<SubjectResponse>;
    onUpdate: (request: SubjectRequest) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

const EMPTY_FORM: SubjectForm = {
    courseId: "",
    name: "",
    code: "",
    lecturesPerWeek: "3",
    isPracticalSubject: false,
    activeStatus: "ENABLE",
    specializationIds: [],
};

/* -------------------------------------------------------------------------- */
/* Helpers & Visual Utilities                                                 */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function numberLabel(value: number | null | undefined): string {
    return typeof value === "number" && Number.isFinite(value)
        ? new Intl.NumberFormat("en-IN").format(value)
        : "—";
}

function getStatusLabel(status: ActiveStatus | null | undefined): string {
    if (status === "ENABLE") return "Active";
    if (status === "DISABLE") return "Inactive";
    return "Unknown";
}

function hasPermission(
    subject: SubjectResponse,
    action: PermissionAction
): boolean {
    return (
        Array.isArray(subject.permissionActions) &&
        subject.permissionActions.includes(action)
    );
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
    if (!name) return "SU";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SU";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StatusBadge({ status }: { status: ActiveStatus | null | undefined }) {
    const active = status === "ENABLE";
    const inactive = status === "DISABLE";

    const classes = active
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
        : inactive
            ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
            : "border-slate-400/30 bg-slate-500/10 text-slate-300";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    active
                        ? "bg-emerald-400"
                        : inactive
                            ? "bg-amber-400"
                            : "bg-slate-400"
                }`}
            />
            {getStatusLabel(status)}
        </span>
    );
}

function TypeBadge({ isPractical }: { isPractical: boolean }) {
    return isPractical ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-300">
            <FlaskConical size={12} />
            Practical
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-300">
            <BookOpen size={12} />
            Theory
        </span>
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
            className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-400"
            role="alert"
        >
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </motion.p>
    );
}

function InfoItem({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: ReactNode;
    icon?: typeof Building2;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/15">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {Icon && <Icon size={13} className="text-cyan-400" />}
                <span>{label}</span>
            </div>
            <div className="mt-1 break-words font-medium text-white text-xs sm:text-sm">
                {value || "—"}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Subject Dialog Modal                                                       */
/* -------------------------------------------------------------------------- */

function SubjectDialog({
    mode,
    subject,
    courses,
    specializations,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: DialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const initialCoursePrefix = subject?.course?.code ?? "";

    const [form, setForm] = useState<SubjectForm>(() => ({
        ...EMPTY_FORM,
        courseId: isCreate
            ? courses.length === 1
                ? courses[0].id
                : ""
            : subject?.course?.id ?? "",
        name: subject?.name ?? "",
        // In EDIT and VIEW modes, extract suffix from full code
        code:
            (isEdit || isView) && subject && initialCoursePrefix
                ? removePrefix(subject.code, initialCoursePrefix)
                : subject?.code ?? "",
        lecturesPerWeek:
            subject?.lecturesPerWeek != null
                ? String(subject.lecturesPerWeek)
                : "3",
        isPracticalSubject: subject?.isPracticalSubject ?? false,
        activeStatus: subject?.activeStatus ?? "ENABLE",
        specializationIds: subject?.specializations?.map((s) => s.id) ?? [],
    }));

    const [prefix, setPrefix] = useState(initialCoursePrefix);
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const selectedCourse = useMemo(() => {
        const cId = Number(form.courseId);
        if (!cId || cId <= 0) return subject?.course ?? null;
        return (
            courses.find((course) => course.id === cId) ??
            subject?.course ??
            null
        );
    }, [form.courseId, courses, subject?.course]);

    const title: Record<DialogMode, string> = {
        CREATE: "Create Subject",
        EDIT: "Edit Subject",
        VIEW: "Subject Details",
        DELETE: "Delete Subject",
    };

    /*
     * Resolve prefix across CREATE, EDIT, and VIEW modes.
     * Uses local fallback from course.code and verifies with GET /prefix.
     */
    useEffect(() => {
        let cancelled = false;

        async function resolvePrefix() {
            const courseId = isCreate
                ? Number(form.courseId)
                : Number(subject?.course?.id);

            if (!Number.isSafeInteger(courseId) || courseId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            const fallbackCourse =
                courses.find((c) => c.id === courseId) ?? subject?.course;
            if (fallbackCourse?.code) {
                setPrefix(fallbackCourse.code);
            }

            setPrefixLoading(true);
            setPrefixError("");

            try {
                const result = await getSubjectPrefix(
                    courseId,
                    (isEdit || isView) && subject ? subject.id : undefined
                );

                if (cancelled) return;

                const resolvedPrefix =
                    result || fallbackCourse?.code || "";

                if (resolvedPrefix) {
                    setPrefix(resolvedPrefix);
                }

                if ((isEdit || isView) && subject && resolvedPrefix) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(subject.code, resolvedPrefix),
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    if (fallbackCourse?.code) {
                        setPrefix(fallbackCourse.code);
                    } else {
                        setPrefixError(extractErrorMessage(error));
                    }
                }
            } finally {
                if (!cancelled) {
                    setPrefixLoading(false);
                }
            }
        }

        void resolvePrefix();

        return () => {
            cancelled = true;
        };
    }, [
        form.courseId,
        isCreate,
        isEdit,
        isView,
        courses,
        subject,
        subject?.id,
        subject?.code,
        subject?.course,
        subject?.course?.id,
    ]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof SubjectForm>(
        key: K,
        value: SubjectForm[K]
    ) {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
        setDialogError("");
    }

    function toggleSpecialization(id: number) {
        if (readOnly || busy) return;

        const next = form.specializationIds.includes(id)
            ? form.specializationIds.filter((item) => item !== id)
            : [...form.specializationIds, id];

        changeField("specializationIds", next);
    }

    function validate(): boolean {
        const errors: FieldErrors = {};
        const name = form.name.trim();
        const code = form.code.trim();
        const lectures = Number(form.lecturesPerWeek);

        if (isCreate) {
            const courseId = Number(form.courseId);
            if (!Number.isSafeInteger(courseId) || courseId <= 0) {
                errors.courseId = "Please select a course.";
            } else if (!courses.some((course) => course.id === courseId)) {
                errors.courseId =
                    "The selected course is no longer available. Refresh the options.";
            }
        }

        if (!name) {
            errors.name = "Subject name is required.";
        } else if (name.length < 2) {
            errors.name = "Subject name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "Subject name cannot exceed 150 characters.";
        }

        if (!prefix && !selectedCourse?.code) {
            errors.code = "The fixed subject prefix could not be loaded.";
        } else if (!code) {
            errors.code = "Subject code suffix is required.";
        } else if (code.length > 40) {
            errors.code = "Subject code suffix cannot exceed 40 characters.";
        } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
            errors.code =
                "Use only letters, numbers, hyphens, and underscores.";
        }

        if (
            !isCreate &&
            form.lecturesPerWeek.trim() !== "" &&
            (!Number.isInteger(lectures) || lectures < 0 || lectures > 100)
        ) {
            errors.lecturesPerWeek =
                "Lectures per week must be a whole number between 0 and 100.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!subject) {
                setDialogError("No subject selected for deletion.");
                return;
            }

            try {
                await onDelete(subject.id);
            } catch (error) {
                setDialogError(extractErrorMessage(error));
            }
            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (prefixLoading && !prefix) {
            setDialogError("Please wait while the subject prefix loads.");
            return;
        }

        if (prefixError && !prefix) {
            setDialogError(prefixError);
            return;
        }

        if (!validate()) return;

        const suffix = form.code.trim();

        try {
            if (isCreate) {
                await onCreate(Number(form.courseId), {
                    name: form.name.trim(),
                    code: suffix,
                });
            } else if (isEdit && subject) {
                const lectures = form.lecturesPerWeek.trim()
                    ? Number(form.lecturesPerWeek)
                    : null;

                const request: SubjectRequest = {
                    id: subject.id,
                    name: form.name.trim(),
                    code: suffix,
                    lecturesPerWeek: lectures,
                    isPracticalSubject: form.isPracticalSubject,
                    activeStatus: form.activeStatus,
                    specializationsId: [...new Set(form.specializationIds)],
                };

                await onUpdate(request);
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    const effectivePrefix = prefix || selectedCourse?.code || "";
    const previewFullCode =
        effectivePrefix && form.code.trim()
            ? `${effectivePrefix}${form.code.trim().toUpperCase()}`
            : "";

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 disabled:opacity-60 read-only:opacity-75";

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
                aria-labelledby="subject-dialog-title"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · Academic Management
                        </p>
                        <h2
                            id="subject-dialog-title"
                            className="mt-1 text-lg sm:text-xl font-semibold text-white"
                        >
                            {title[mode]}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form / Content with scroll */}
                <form
                    onSubmit={submit}
                    noValidate
                    className="flex-1 overflow-y-auto space-y-4 p-5 sm:p-6"
                >
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
                                    size={18}
                                    className="mt-0.5 shrink-0 text-rose-400"
                                />
                                <p className="min-w-0 flex-1 break-words">
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
                        <div className="space-y-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400 shrink-0">
                                    <Trash2 size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-white text-base">
                                        Delete Subject?
                                    </p>
                                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300">
                                        Are you sure you want to permanently delete{" "}
                                        <strong className="text-white">
                                            {subject?.name}
                                        </strong>
                                        ?
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-cyan-300">
                                        <span>Code: {subject?.code}</span>
                                        <span>·</span>
                                        <span>ID #{subject?.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Course Selection (CREATE Mode) */}
                            {isCreate && (
                                <div>
                                    <label
                                        htmlFor="subject-course"
                                        className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                    >
                                        Course <span className="text-cyan-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="subject-course"
                                            value={form.courseId}
                                            onChange={(event) => {
                                                changeField(
                                                    "courseId",
                                                    event.target.value
                                                        ? Number(event.target.value)
                                                        : ""
                                                );
                                                changeField("code", "");
                                            }}
                                            disabled={busy || courses.length === 0}
                                            className={`${inputClass} appearance-none pr-10`}
                                        >
                                            <option value="">Select course</option>
                                            {courses.map((course) => (
                                                <option key={course.id} value={course.id}>
                                                    {course.name}
                                                    {course.code ? ` (${course.code})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                    </div>
                                    <FieldError>{fieldErrors.courseId}</FieldError>
                                </div>
                            )}

                            {/* Parent Hierarchy Card (EDIT and VIEW modes) */}
                            {!isCreate && subject && (
                                <div>
                                    <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300">
                                        Parent Course & Hierarchy
                                    </label>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap
                                                    size={16}
                                                    className="text-cyan-400 shrink-0"
                                                />
                                                <span className="font-semibold text-white text-xs sm:text-sm">
                                                    {subject.course?.name ?? "—"}
                                                </span>
                                            </div>
                                            {subject.course?.code && (
                                                <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300">
                                                    Prefix: {subject.course.code}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                            {subject.department?.name && (
                                                <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                                                    <Building2 size={11} />
                                                    {subject.department.name}
                                                </span>
                                            )}
                                            {subject.school?.name && (
                                                <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                                                    <Library size={11} />
                                                    {subject.school.name}
                                                </span>
                                            )}
                                            {subject.university?.name && (
                                                <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                                                    <BookOpen size={11} />
                                                    {subject.university.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Subject Name */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="subject-name"
                                        className="text-xs sm:text-sm font-medium text-slate-300"
                                    >
                                        Subject Name <span className="text-cyan-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        {form.name.length}/150
                                    </span>
                                </div>
                                <input
                                    id="subject-name"
                                    value={form.name}
                                    onChange={(event) => changeField("name", event.target.value)}
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Data Structures & Algorithms"
                                    className={`${inputClass} ${
                                        fieldErrors.name
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : ""
                                    }`}
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            {/* Subject Code with Fixed Course Prefix */}
                            <div>
                                <label
                                    htmlFor="subject-code"
                                    className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                >
                                    Subject Code <span className="text-cyan-400">*</span>
                                </label>
                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[50%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-xs sm:text-sm font-bold text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading
                                                ? "Loading…"
                                                : effectivePrefix || "COURSE_PREFIX"}
                                        </span>
                                    </div>
                                    <input
                                        id="subject-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="101"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-xs sm:text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>
                                <FieldError>{fieldErrors.code || prefixError}</FieldError>
                                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                                    <span>
                                        Fixed course code prefix is automatically attached.
                                    </span>
                                    {previewFullCode && (
                                        <span className="font-mono text-cyan-400">
                                            Resulting Code: <strong>{previewFullCode}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Non-create Fields: Status, Lectures, Practical, Specializations */}
                            {!isCreate && (
                                <>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="subject-lectures"
                                                className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                            >
                                                Lectures per week
                                            </label>
                                            <input
                                                id="subject-lectures"
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={form.lecturesPerWeek}
                                                onChange={(event) =>
                                                    changeField(
                                                        "lecturesPerWeek",
                                                        event.target.value
                                                    )
                                                }
                                                readOnly={readOnly || busy}
                                                className={`${inputClass} ${
                                                    fieldErrors.lecturesPerWeek
                                                        ? "border-rose-500/60"
                                                        : ""
                                                }`}
                                            />
                                            <FieldError>
                                                {fieldErrors.lecturesPerWeek}
                                            </FieldError>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="subject-status"
                                                className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                            >
                                                Active Status
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="subject-status"
                                                    value={form.activeStatus}
                                                    onChange={(event) =>
                                                        changeField(
                                                            "activeStatus",
                                                            event.target
                                                                .value as ActiveStatus
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
                                    </div>

                                    {/* Practical Checkbox */}
                                    <label
                                        className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5 transition hover:bg-white/[0.04] ${
                                            readOnly ? "opacity-75" : "cursor-pointer"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.isPracticalSubject}
                                            onChange={(event) =>
                                                changeField(
                                                    "isPracticalSubject",
                                                    event.target.checked
                                                )
                                            }
                                            disabled={readOnly || busy}
                                            className="h-4 w-4 rounded accent-cyan-400"
                                        />
                                        <div>
                                            <span className="block text-xs sm:text-sm font-medium text-white">
                                                Practical Subject
                                            </span>
                                            <span className="mt-0.5 block text-[11px] text-slate-400">
                                                Check if this subject involves lab sessions or practical examinations.
                                            </span>
                                        </div>
                                    </label>

                                    {/* Specializations selection */}
                                    {specializations.length > 0 && !isView && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                                <span className="font-medium text-slate-300">
                                                    Assign Specializations
                                                </span>
                                                <span className="text-[11px] text-cyan-300">
                                                    {form.specializationIds.length} selected
                                                </span>
                                            </div>

                                            <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 p-2.5">
                                                {specializations.map((spec) => {
                                                    const checked =
                                                        form.specializationIds.includes(
                                                            spec.id
                                                        );
                                                    return (
                                                        <label
                                                            key={spec.id}
                                                            className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-xs transition ${
                                                                checked
                                                                    ? "border-cyan-400/30 bg-cyan-400/10 text-white"
                                                                    : "border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"
                                                            } ${
                                                                readOnly || busy
                                                                    ? "cursor-default"
                                                                    : "cursor-pointer"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    disabled={readOnly || busy}
                                                                    onChange={() =>
                                                                        toggleSpecialization(
                                                                            spec.id
                                                                        )
                                                                    }
                                                                    className="h-3.5 w-3.5 rounded accent-cyan-400"
                                                                />
                                                                <span className="truncate">
                                                                    {spec.name}
                                                                </span>
                                                            </div>
                                                            {spec.code && (
                                                                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                                                                    {spec.code}
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* VIEW Mode: Complete Breakdown & Governance Showcase */}
                            {isView && subject && (
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    {/* Code decomposition */}
                                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                                            Code Architecture
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                                                <p className="text-[10px] text-slate-400">
                                                    Full Code
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs font-bold text-white">
                                                    {subject.code || "—"}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                                                <p className="text-[10px] text-cyan-300">
                                                    Course Prefix
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs font-bold text-cyan-200">
                                                    {effectivePrefix || "—"}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-violet-400/20 bg-violet-500/10 p-2">
                                                <p className="text-[10px] text-violet-300">
                                                    Subject Suffix
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs font-bold text-violet-200">
                                                    {form.code || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Details Grid */}
                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                                        <InfoItem
                                            label="Subject ID"
                                            value={`#${subject.id}`}
                                        />
                                        <InfoItem
                                            label="Status"
                                            value={<StatusBadge status={subject.activeStatus} />}
                                        />
                                        <InfoItem
                                            label="Category"
                                            value={<TypeBadge isPractical={subject.isPracticalSubject} />}
                                        />
                                        <InfoItem
                                            label="Weekly Lectures"
                                            value={`${subject.lecturesPerWeek ?? "—"} Lectures`}
                                            icon={Clock}
                                        />
                                    </div>

                                    {/* Assigned Specializations */}
                                    {subject.specializations.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-slate-400">
                                                Assigned Specializations ({subject.specializations.length})
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                {subject.specializations.map((spec) => (
                                                    <span
                                                        key={spec.id}
                                                        className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-200"
                                                    >
                                                        {spec.code ? (
                                                            <strong className="text-cyan-300 font-mono mr-1">
                                                                {spec.code}
                                                            </strong>
                                                        ) : null}
                                                        {spec.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assigned Subject Teachers */}
                                    {subject.subjectTeachers.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-slate-400">
                                                Assigned Faculty Teachers ({subject.subjectTeachers.length})
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                {subject.subjectTeachers.map((teacher) => (
                                                    <span
                                                        key={teacher.id}
                                                        className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200"
                                                    >
                                                        {teacher.code ? (
                                                            <strong className="text-emerald-300 font-mono mr-1">
                                                                {teacher.code}
                                                            </strong>
                                                        ) : null}
                                                        {teacher.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Audit & Governance Showcase (Matching University.tsx & Specializations.tsx) */}
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                                <ShieldCheck
                                                    size={13}
                                                    className="text-emerald-400"
                                                />
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
                                                    {subject.createdAt && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(subject.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                        {getInitials(subject.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {subject.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(subject.createdBy?.code || subject.createdBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {subject.createdBy.code
                                                                    ? `Code: ${subject.createdBy.code}`
                                                                    : `ID: #${subject.createdBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {subject.createdAt && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            Timestamp: {formatDateTime(subject.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Updated By Card */}
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <RotateCcw size={11} /> Last Modified By
                                                    </span>
                                                    {(subject.updatedAt || subject.createdAt) && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(subject.updatedAt || subject.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                        {getInitials(
                                                            subject.updatedBy?.name ||
                                                            subject.createdBy?.name ||
                                                            "System"
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {subject.updatedBy?.name ||
                                                                subject.createdBy?.name ||
                                                                "System Administrator"}
                                                        </p>
                                                        {(subject.updatedBy?.code || subject.updatedBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {subject.updatedBy.code
                                                                    ? `Code: ${subject.updatedBy.code}`
                                                                    : `ID: #${subject.updatedBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(subject.updatedAt || subject.createdAt) && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            Timestamp: {formatDateTime(subject.updatedAt || subject.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permissions */}
                                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            Your Permissions
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {subject.permissionActions.length > 0 ? (
                                                subject.permissionActions.map((action) => (
                                                    <span
                                                        key={action}
                                                        className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 font-mono text-[11px] text-cyan-300"
                                                    >
                                                        {action}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    Read only access.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col-reverse gap-2.5 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="rounded-xl border border-white/10 px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>

                        {!isView && (
                            <button
                                type="submit"
                                disabled={
                                    busy ||
                                    (prefixLoading && !prefix) ||
                                    ((isCreate || isEdit) &&
                                        !prefix &&
                                        !selectedCourse?.code) ||
                                    (isCreate && courses.length === 0)
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isDelete
                                        ? "bg-gradient-to-r from-red-600 to-rose-500"
                                        : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500"
                                }`}
                            >
                                {busy || (prefixLoading && !prefix) ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                ) : isDelete ? (
                                    <Trash2 size={16} />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                {busy
                                    ? "Processing..."
                                    : prefixLoading && !prefix
                                        ? "Loading prefix..."
                                        : isDelete
                                            ? "Confirm Delete"
                                            : isCreate
                                                ? "Create Subject"
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
/* Main Subject Page Component                                                */
/* -------------------------------------------------------------------------- */

export default function Subjects() {
    const reduceMotion = useReducedMotion();

    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [courses, setCourses] = useState<CommonDTO[]>([]);
    const [specializations, setSpecializations] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Toolbar filters (derived directly from loaded subjects)
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [courseFilter, setCourseFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        subject: SubjectResponse | null;
    } | null>(null);

    // Initial load: loads all authorized subjects directly
    const loadData = useCallback(async (background = false) => {
        if (background) setRefreshing(true);
        else setLoading(true);

        setPageError("");

        try {
            const result = await getAllSubjects();
            setSubjects(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load subjects: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Course and specialization options for forms
    const loadFormOptions = useCallback(async () => {
        try {
            const [courseList, specList] = await Promise.all([
                getCourseFilter().catch(() => []),
                getSpecializationFilter().catch(() => []),
            ]);
            setCourses(uniqueCommonDTOs(courseList));
            setSpecializations(uniqueCommonDTOs(specList));
        } catch {
            // Handled gracefully
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
    /* Filter options derived directly from loaded subjects                   */
    /* ---------------------------------------------------------------------- */

    const tableUniversities = useMemo(
        () => uniqueCommonDTOs(subjects.map((item) => item.university)),
        [subjects]
    );

    const tableSchools = useMemo(
        () =>
            uniqueCommonDTOs(
                subjects
                    .filter(
                        (item) =>
                            universityFilter === "ALL" ||
                            item.university?.id === Number(universityFilter)
                    )
                    .map((item) => item.school)
            ),
        [subjects, universityFilter]
    );

    const tableDepartments = useMemo(
        () =>
            uniqueCommonDTOs(
                subjects
                    .filter(
                        (item) =>
                            universityFilter === "ALL" ||
                            item.university?.id === Number(universityFilter)
                    )
                    .filter(
                        (item) =>
                            schoolFilter === "ALL" ||
                            item.school?.id === Number(schoolFilter)
                    )
                    .map((item) => item.department)
            ),
        [subjects, universityFilter, schoolFilter]
    );

    const tableCourses = useMemo(
        () =>
            uniqueCommonDTOs(
                subjects
                    .filter(
                        (item) =>
                            universityFilter === "ALL" ||
                            item.university?.id === Number(universityFilter)
                    )
                    .filter(
                        (item) =>
                            schoolFilter === "ALL" ||
                            item.school?.id === Number(schoolFilter)
                    )
                    .filter(
                        (item) =>
                            departmentFilter === "ALL" ||
                            item.department?.id === Number(departmentFilter)
                    )
                    .map((item) => item.course)
            ),
        [subjects, universityFilter, schoolFilter, departmentFilter]
    );

    // Filter validation cascading
    useEffect(() => {
        if (
            schoolFilter !== "ALL" &&
            !tableSchools.some((item) => item.id === Number(schoolFilter))
        )
            setSchoolFilter("ALL");
    }, [schoolFilter, tableSchools]);

    useEffect(() => {
        if (
            departmentFilter !== "ALL" &&
            !tableDepartments.some((item) => item.id === Number(departmentFilter))
        )
            setDepartmentFilter("ALL");
    }, [departmentFilter, tableDepartments]);

    useEffect(() => {
        if (
            courseFilter !== "ALL" &&
            !tableCourses.some((item) => item.id === Number(courseFilter))
        )
            setCourseFilter("ALL");
    }, [courseFilter, tableCourses]);

    // Top Metric Stats
    const stats = useMemo(() => {
        const active = subjects.filter((item) => item.activeStatus === "ENABLE").length;
        const inactive = subjects.filter((item) => item.activeStatus === "DISABLE").length;
        const practical = subjects.filter((item) => item.isPracticalSubject).length;
        const theory = subjects.length - practical;

        return [
            {
                label: "Total Subjects",
                value: numberLabel(subjects.length),
                icon: BookOpen,
                tone: "cyan",
            },
            {
                label: "Active Subjects",
                value: numberLabel(active),
                icon: ShieldCheck,
                tone: "green",
            },
            {
                label: "Practical Subjects",
                value: numberLabel(practical),
                icon: FlaskConical,
                tone: "purple",
            },
            {
                label: "Theory Subjects",
                value: numberLabel(theory),
                icon: GraduationCap,
                tone: "blue",
            },
        ];
    }, [subjects]);

    // Filtered & Sorted Subjects
    const filteredSubjects = useMemo(() => {
        const query = text(search);

        const result = subjects.filter((subject) => {
            const matchesSearch =
                !query ||
                text(subject.name).includes(query) ||
                text(subject.code).includes(query) ||
                text(subject.course?.name).includes(query) ||
                text(subject.course?.code).includes(query) ||
                text(subject.department?.name).includes(query) ||
                text(subject.createdBy?.name).includes(query) ||
                subject.specializations.some(
                    (item) =>
                        text(item.name).includes(query) ||
                        text(item.code).includes(query)
                );

            const matchesStatus =
                statusFilter === "ALL" || subject.activeStatus === statusFilter;

            const matchesType =
                typeFilter === "ALL" ||
                (typeFilter === "PRACTICAL" && subject.isPracticalSubject) ||
                (typeFilter === "THEORY" && !subject.isPracticalSubject);

            const matchesUniversity =
                universityFilter === "ALL" ||
                subject.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                subject.school?.id === Number(schoolFilter);

            const matchesDepartment =
                departmentFilter === "ALL" ||
                subject.department?.id === Number(departmentFilter);

            const matchesCourse =
                courseFilter === "ALL" ||
                subject.course?.id === Number(courseFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment &&
                matchesCourse
            );
        });

        result.sort((a, b) => {
            if (sort === "NAME_ASC") return a.name.localeCompare(b.name);
            if (sort === "NAME_DESC") return b.name.localeCompare(a.name);
            if (sort === "CODE_ASC") return a.code.localeCompare(b.code);
            if (sort === "LECTURES_DESC") {
                return (b.lecturesPerWeek ?? 0) - (a.lecturesPerWeek ?? 0);
            }
            return b.id - a.id;
        });

        return result;
    }, [
        subjects,
        search,
        statusFilter,
        typeFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
        courseFilter,
        sort,
    ]);

    const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const visibleSubjects = filteredSubjects.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [
        search,
        statusFilter,
        typeFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
        courseFilter,
        sort,
    ]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "ALL" ||
        typeFilter !== "ALL" ||
        universityFilter !== "ALL" ||
        schoolFilter !== "ALL" ||
        departmentFilter !== "ALL" ||
        courseFilter !== "ALL" ||
        sort !== "NEWEST";

    async function openCreateDialog() {
        setPageError("");
        setNotice("");
        await loadFormOptions();
        setDialog({ mode: "CREATE", subject: null });
    }

    async function openDialog(
        mode: DialogMode,
        subject: SubjectResponse | null = null
    ) {
        setPageError("");
        setNotice("");
        if (mode === "EDIT") {
            await loadFormOptions();
        }
        setDialog({ mode, subject });
    }

    async function handleCreate(
        courseId: number,
        request: CommonRequest
    ): Promise<SubjectResponse> {
        setBusy(true);

        try {
            const created = await createSubject(courseId, request);
            setDialog(null);
            setNotice("Subject created successfully.");
            toast.success(`Subject "${request.name}" created successfully.`);
            await loadData(true);
            return created;
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not create subject: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(request: SubjectRequest) {
        setBusy(true);

        try {
            await updateSubject(request);
            setDialog(null);
            setNotice("Subject updated successfully.");
            toast.success("Subject updated successfully.");
            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not update subject: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(subjectId: number) {
        setBusy(true);

        try {
            const message = await deleteSubject(subjectId);
            setDialog(null);
            setNotice(message || "Subject deleted successfully.");
            toast.success(message || "Subject deleted successfully.");
            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not delete subject: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setTypeFilter("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setCourseFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
    };

    const selectClass =
        "w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-8 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50";

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-6 p-4 text-white sm:p-6 lg:p-8"
        >
            {/* Header Section */}
            <section>
                <div className="mb-3 flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                    <span>Academic Management</span>
                    <ChevronRight size={14} />
                    <span className="text-cyan-300">Subjects</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>
                        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                            Subject Management
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
                            Manage curriculum subjects, practical laboratories, specialization
                            assignments, and faculty teaching units.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={
                                    loading || refreshing ? "animate-spin text-cyan-400" : ""
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            <Plus size={17} />
                            Add Subject
                        </button>
                    </div>
                </div>
            </section>

            {/* Error & Notice Banners */}
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

            {/* Metrics & Statistics */}
            <section
                aria-label="Subject statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4"
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
                            className={`rounded-2xl border bg-gradient-to-br p-3.5 sm:p-5 shadow-lg backdrop-blur-xl ${
                                tones[stat.tone]
                            }`}
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
                                    <Icon
                                        size={18}
                                        className="sm:w-[22px] sm:h-[22px]"
                                    />
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

            {/* Main Content Card: Filter Toolbar + Responsive Table & Mobile Cards */}
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                {/* Secondary Search & Filter Toolbar */}
                <div className="grid gap-2.5 sm:gap-3 border-b border-white/10 p-3 sm:p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8">
                    {/* Search Field */}
                    <div className="relative min-w-0 sm:col-span-2 md:col-span-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search subjects"
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

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by status"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as StatusFilter)
                            }
                            className={selectClass}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ENABLE">Active</option>
                            <option value="DISABLE">Inactive</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by type"
                            value={typeFilter}
                            onChange={(event) =>
                                setTypeFilter(event.target.value as TypeFilter)
                            }
                            className={selectClass}
                        >
                            <option value="ALL">All Types</option>
                            <option value="THEORY">Theory Only</option>
                            <option value="PRACTICAL">Practical Only</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* University Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by university"
                            value={universityFilter}
                            onChange={(event) => {
                                setUniversityFilter(event.target.value);
                                setSchoolFilter("ALL");
                                setDepartmentFilter("ALL");
                                setCourseFilter("ALL");
                            }}
                            className={selectClass}
                        >
                            <option value="ALL">All Universities</option>
                            {tableUniversities.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
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
                            onChange={(event) => {
                                setSchoolFilter(event.target.value);
                                setDepartmentFilter("ALL");
                                setCourseFilter("ALL");
                            }}
                            className={selectClass}
                        >
                            <option value="ALL">All Schools</option>
                            {tableSchools.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Department Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by department"
                            value={departmentFilter}
                            onChange={(event) => {
                                setDepartmentFilter(event.target.value);
                                setCourseFilter("ALL");
                            }}
                            className={selectClass}
                        >
                            <option value="ALL">All Departments</option>
                            {tableDepartments.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Course Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by course"
                            value={courseFilter}
                            onChange={(event) => setCourseFilter(event.target.value)}
                            className={selectClass}
                        >
                            <option value="ALL">All Courses</option>
                            {tableCourses.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Sort Filter & Reset */}
                    <div className="relative flex items-center gap-2">
                        <div className="relative w-full">
                            <select
                                aria-label="Sort subjects"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value as SortOption)
                                }
                                className={selectClass}
                            >
                                <option value="NEWEST">Newest First</option>
                                <option value="NAME_ASC">Name (A to Z)</option>
                                <option value="NAME_DESC">Name (Z to A)</option>
                                <option value="CODE_ASC">Code (A to Z)</option>
                                <option value="LECTURES_DESC">
                                    Lectures (High to Low)
                                </option>
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
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Cards View (sm:hidden) */}
                <div className="divide-y divide-white/10 sm:hidden">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={`m-loading-${i}`} className="p-4 space-y-3">
                                <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
                                <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
                            </div>
                        ))
                    ) : visibleSubjects.length > 0 ? (
                        visibleSubjects.map((item) => {
                            const canUpdate = hasPermission(item, "UPDATE");
                            const canDelete = hasPermission(item, "DELETE");

                            return (
                                <div
                                    key={`mobile-${item.id}`}
                                    className="p-4 space-y-3 bg-white/[0.015]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-white text-sm">
                                                {item.name}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs text-cyan-300">
                                                {item.code || "—"}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge status={item.activeStatus} />
                                            <TypeBadge isPractical={item.isPracticalSubject} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                        <div>
                                            <span className="text-[11px] text-slate-500 block">
                                                Course
                                            </span>
                                            <span className="text-slate-200 truncate block">
                                                {item.course?.name ?? "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-500 block">
                                                Weekly Lectures
                                            </span>
                                            <span className="text-slate-200 font-medium block">
                                                {item.lecturesPerWeek ?? "—"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Audit & Governance Showcase (Matching University Design) */}
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                {item.createdBy?.name || "System"}
                                            </span>
                                            {item.createdAt && (
                                                <span className="text-slate-500 font-mono text-[10px]">
                                                    · {formatDate(item.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {item.updatedBy?.name && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="text-slate-500">Updated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {item.updatedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons: Strict h-8 w-8 shrink-0 */}
                                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => openDialog("VIEW", item)}
                                            aria-label={`View ${item.name}`}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                        >
                                            <Eye size={15} />
                                        </button>

                                        {canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("EDIT", item)}
                                                aria-label={`Edit ${item.name}`}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("DELETE", item)}
                                                aria-label={`Delete ${item.name}`}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/20"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : null}
                </div>

                {/* Desktop Table View (hidden on sm screens) */}
                <div className="hidden sm:block w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Subject</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Course</th>
                                <th className="px-4 py-4 font-medium">Department</th>
                                <th className="px-4 py-4 font-medium">Lectures</th>
                                <th className="px-4 py-4 font-medium">Type</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => (
                                    <tr key={`loading-${rowIndex}`}>
                                        {Array.from({ length: 9 }).map((__, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-4">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && subjects.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <AlertTriangle
                                            className="mx-auto text-rose-400"
                                            size={28}
                                        />
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load subjects
                                        </p>
                                        <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-slate-400">
                                            {pageError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadData()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs sm:text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={14} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : visibleSubjects.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleSubjects.map((item, index) => {
                                        const initials = getInitials(item.name);
                                        const canUpdate = hasPermission(item, "UPDATE");
                                        const canDelete = hasPermission(item, "DELETE");

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={item.id}
                                                initial={
                                                    reduceMotion
                                                        ? false
                                                        : { opacity: 0, x: -6 }
                                                }
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="group hover:bg-cyan-400/[0.035]"
                                            >
                                                {/* Serial Number */}
                                                <td className="px-5 py-4 text-xs text-slate-500">
                                                    {(currentPage - 1) * PAGE_SIZE +
                                                        index +
                                                        1}
                                                </td>

                                                {/* Subject Name & Audit Pill */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-[220px] truncate font-semibold text-slate-100 text-xs sm:text-sm">
                                                                {item.name || "Unnamed"}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                                <span className="font-mono text-[11px] text-slate-500">
                                                                    ID #{item.id}
                                                                </span>
                                                                <span className="text-slate-600">·</span>
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                    title={`Created by: ${formatAuditActor(item.createdBy)}${item.createdAt ? ` on ${formatDate(item.createdAt)}` : ""}${item.updatedBy?.name ? ` | Modified by: ${formatAuditActor(item.updatedBy)}` : ""}`}
                                                                >
                                                                    <UserCheck size={11} className="text-emerald-400 shrink-0" />
                                                                    <span className="truncate max-w-[120px] font-medium text-slate-300">
                                                                        {item.createdBy?.name || "System"}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Code Badge */}
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex max-w-[160px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1 font-mono text-xs font-semibold text-cyan-300">
                                                        {item.code || "—"}
                                                    </span>
                                                </td>

                                                {/* Course */}
                                                <td className="px-4 py-4">
                                                    <div className="max-w-[170px]">
                                                        <p className="truncate font-medium text-slate-200 text-xs sm:text-sm">
                                                            {item.course?.name ?? "—"}
                                                        </p>
                                                        {item.course?.code && (
                                                            <p className="mt-0.5 font-mono text-[11px] text-slate-400 truncate">
                                                                {item.course.code}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Department */}
                                                <td className="px-4 py-4">
                                                    <p className="max-w-[160px] truncate font-medium text-slate-200 text-xs sm:text-sm">
                                                        {item.department?.name ?? "—"}
                                                    </p>
                                                </td>

                                                {/* Weekly Lectures */}
                                                <td className="px-4 py-4 font-mono text-xs text-slate-200">
                                                    {item.lecturesPerWeek != null
                                                        ? `${item.lecturesPerWeek}/wk`
                                                        : "—"}
                                                </td>

                                                {/* Category Type */}
                                                <td className="px-4 py-4">
                                                    <TypeBadge isPractical={item.isPracticalSubject} />
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={item.activeStatus} />
                                                </td>

                                                {/* Actions with strict h-8 w-8 shrink-0 buttons to prevent stretching */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("VIEW", item)}
                                                            aria-label={`View ${item.name}`}
                                                            title="View details"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={15} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("EDIT", item)}
                                                                aria-label={`Edit ${item.name}`}
                                                                title="Edit subject"
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("DELETE", item)}
                                                                aria-label={`Delete ${item.name}`}
                                                                title="Delete subject"
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/20"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}

                                                        {!canUpdate && !canDelete && (
                                                            <span className="self-center text-xs text-slate-500">
                                                                Read only
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
                                            <BookOpen size={24} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching subjects found"
                                                : "No subjects registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try broadening your search or resetting filters."
                                                : "Subjects created under authorized courses will appear here."}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                            >
                                                <RotateCcw size={13} />
                                                Clear Filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:px-5 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-slate-400">
                    <p>
                        {filteredSubjects.length === 0
                            ? "Showing 0 subjects"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                  currentPage * PAGE_SIZE,
                                  filteredSubjects.length
                              )} of ${filteredSubjects.length} subjects${
                                  filteredSubjects.length !== subjects.length
                                      ? ` (filtered from ${subjects.length})`
                                      : ""
                              }`}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            aria-label="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
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
                                    {index > 0 && number - pages[index - 1] > 1 && (
                                        <span className="px-1 text-slate-500">…</span>
                                    )}
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setPage(number)}
                                        aria-current={
                                            currentPage === number ? "page" : undefined
                                        }
                                        className={`min-w-8 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                                            currentPage === number
                                                ? "border-cyan-300/40 bg-gradient-to-r from-violet-600 to-blue-500 font-semibold text-white"
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
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Subject Dialog */}
            <AnimatePresence>
                {dialog && (
                    <SubjectDialog
                        key={`${dialog.mode}-${dialog.subject?.id ?? "new"}`}
                        mode={dialog.mode}
                        subject={dialog.subject}
                        courses={courses}
                        specializations={specializations}
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
