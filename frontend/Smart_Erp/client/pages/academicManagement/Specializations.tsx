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
    X,
} from "lucide-react";

import {
    createSpecialization,
    deleteSpecialization,
    extractErrorMessage,
    formatAuditActor,
    getAllSpecializations,
    getCourseFilter,
    getSpecializationPrefix,
    hasPermission,
    normalizeText,
    removePrefix,
    uniqueDTOs,
    updateSpecialization,
    type ActiveStatus,
    type CommonDTO,
    type SpecializationCreateRequest,
    type SpecializationRequest,
    type SpecializationResponse,
} from "@/services/academic/specializationService";

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

interface FormState {
    courseId: number | "";
    name: string;
    code: string;
    activeStatus: ActiveStatus;
}

interface FieldErrors {
    courseId?: string;
    name?: string;
    code?: string;
}

interface DialogState {
    mode: DialogMode;
    specialization: SpecializationResponse | null;
}

const PAGE_SIZE = 6;

/* -------------------------------------------------------------------------- */
/* UI Helpers & Components                                                    */
/* -------------------------------------------------------------------------- */

function getStatusLabel(status: ActiveStatus | null | undefined): string {
    if (status === "ENABLE") return "Active";
    if (status === "DISABLE") return "Inactive";
    return "Unknown";
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
    if (!name) return "SP";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SP";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
/* Specialization Dialog                                                      */
/* -------------------------------------------------------------------------- */

function SpecializationDialog({
    mode,
    specialization,
    courses,
    coursesLoading,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: {
    mode: DialogMode;
    specialization: SpecializationResponse | null;
    courses: CommonDTO[];
    coursesLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (
        courseId: number,
        request: SpecializationCreateRequest
    ) => Promise<void>;
    onUpdate: (request: SpecializationRequest) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const initialCoursePrefix = specialization?.course?.code ?? "";

    const [form, setForm] = useState<FormState>(() => ({
        courseId: isCreate
            ? courses.length === 1
                ? courses[0].id
                : ""
            : specialization?.course?.id ?? "",
        name: specialization?.name ?? "",
        // In EDIT and VIEW modes, initialize code stripped of the course prefix
        code:
            (isEdit || isView) && specialization && initialCoursePrefix
                ? removePrefix(specialization.code, initialCoursePrefix)
                : specialization?.code ?? "",
        activeStatus: specialization?.activeStatus ?? "ENABLE",
    }));

    const [prefix, setPrefix] = useState(initialCoursePrefix);
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const selectedCourse = useMemo(() => {
        const cId = Number(form.courseId);
        if (!cId || cId <= 0) return specialization?.course ?? null;
        return (
            courses.find((course) => course.id === cId) ??
            specialization?.course ??
            null
        );
    }, [form.courseId, courses, specialization?.course]);

    const title: Record<DialogMode, string> = {
        CREATE: "Create Specialization",
        EDIT: "Edit Specialization",
        VIEW: "Specialization Details",
        DELETE: "Delete Specialization",
    };

    /*
     * Resolve prefix:
     * Fast local fallback from course.code, verified via backend GET /prefix?courseId=...
     * Works seamlessly for CREATE, EDIT, and VIEW modes.
     */
    useEffect(() => {
        let cancelled = false;

        async function resolvePrefix() {
            const courseId = isCreate
                ? Number(form.courseId)
                : Number(specialization?.course?.id);

            if (!Number.isFinite(courseId) || courseId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            const fallbackCourse =
                courses.find((c) => c.id === courseId) ??
                specialization?.course;
            if (fallbackCourse?.code) {
                setPrefix(fallbackCourse.code);
            }

            setPrefixLoading(true);
            setPrefixError("");

            try {
                const result = await getSpecializationPrefix(
                    courseId,
                    (isEdit || isView) && specialization
                        ? specialization.id
                        : undefined
                );

                if (cancelled) return;

                const resolvedPrefix =
                    result || fallbackCourse?.code || "";

                if (resolvedPrefix) {
                    setPrefix(resolvedPrefix);
                }

                if ((isEdit || isView) && specialization && resolvedPrefix) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(
                            specialization.code,
                            resolvedPrefix
                        ),
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
        specialization,
        specialization?.id,
        specialization?.code,
        specialization?.course,
        specialization?.course?.id,
    ]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof FormState>(
        key: K,
        value: FormState[K]
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
            const courseId = Number(form.courseId);

            if (!form.courseId || courseId <= 0) {
                errors.courseId = "Please select a course.";
            } else if (!courses.some((course) => course.id === courseId)) {
                errors.courseId =
                    "The selected course is no longer available. Refresh the options.";
            }
        }

        if (!name) {
            errors.name = "Specialization name is required.";
        } else if (name.length < 2) {
            errors.name = "Name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "Name cannot exceed 150 characters.";
        }

        if (!prefix && !selectedCourse?.code) {
            errors.code =
                "The fixed course code prefix could not be determined.";
        } else if (!code) {
            errors.code = "Specialization code suffix is required.";
        } else if (code.length > 40) {
            errors.code = "Code cannot exceed 40 characters.";
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
            if (!specialization) {
                setDialogError("No specialization selected for deletion.");
                return;
            }

            try {
                await onDelete(specialization.id);
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
            setDialogError(
                "Please wait while the parent course prefix loads."
            );
            return;
        }

        if (prefixError && !prefix) {
            setDialogError(prefixError);
            return;
        }

        if (!validate()) return;

        const request = {
            name: form.name.trim(),
            // Backend sets code = course.code + request.code
            // Send only the suffix
            code: form.code.trim(),
        };

        try {
            if (isCreate) {
                await onCreate(Number(form.courseId), request);
            } else if (isEdit && specialization) {
                await onUpdate({
                    id: specialization.id,
                    ...request,
                    activeStatus: form.activeStatus,
                });
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    const hasDependents =
        Boolean(specialization?.subjects && specialization.subjects.length > 0) ||
        Boolean(
            specialization?.sectionGroups &&
                specialization.sectionGroups.length > 0
        );

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
                aria-labelledby="specialization-dialog-title"
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
                            id="specialization-dialog-title"
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

                {/* Form / Content with scroll if needed */}
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
                                        Delete Specialization?
                                    </p>
                                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300">
                                        Are you sure you want to permanently
                                        delete{" "}
                                        <strong className="text-white">
                                            {specialization?.name}
                                        </strong>
                                        ?
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-cyan-300">
                                        <span>Code: {specialization?.code}</span>
                                        <span>·</span>
                                        <span>ID #{specialization?.id}</span>
                                    </div>
                                </div>
                            </div>

                            {hasDependents && (
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle
                                            size={16}
                                            className="mt-0.5 shrink-0 text-amber-400"
                                        />
                                        <div>
                                            <p className="font-semibold text-amber-300">
                                                Active Dependents Detected
                                            </p>
                                            <p className="mt-0.5 leading-relaxed text-amber-200/90">
                                                This specialization is currently
                                                linked to{" "}
                                                <strong>
                                                    {
                                                        specialization?.subjects
                                                            .length
                                                    }
                                                </strong>{" "}
                                                subjects and{" "}
                                                <strong>
                                                    {
                                                        specialization
                                                            ?.sectionGroups
                                                            .length
                                                    }
                                                </strong>{" "}
                                                section groups. The backend requires
                                                removing or reassigning these child
                                                records first.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Course Selection (CREATE Mode) */}
                            {isCreate && (
                                <div>
                                    <label
                                        htmlFor="specialization-course"
                                        className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                    >
                                        Course{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="specialization-course"
                                            value={form.courseId}
                                            onChange={(event) => {
                                                changeField(
                                                    "courseId",
                                                    event.target.value
                                                        ? Number(
                                                              event.target
                                                                  .value
                                                          )
                                                        : ""
                                                );
                                                changeField("code", "");
                                            }}
                                            disabled={
                                                busy ||
                                                coursesLoading ||
                                                courses.length === 0
                                            }
                                            className={`${inputClass} appearance-none pr-10`}
                                        >
                                            <option value="">
                                                {coursesLoading
                                                    ? "Loading courses..."
                                                    : "Select Course"}
                                            </option>
                                            {courses.map((course) => (
                                                <option
                                                    key={course.id}
                                                    value={course.id}
                                                >
                                                    {course.name}
                                                    {course.code
                                                        ? ` (${course.code})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                    </div>

                                    {courses.length === 0 && !coursesLoading && (
                                        <p className="mt-1.5 text-xs text-amber-300">
                                            No courses available under your
                                            assigned permissions.
                                        </p>
                                    )}
                                    <FieldError>
                                        {fieldErrors.courseId}
                                    </FieldError>
                                </div>
                            )}

                            {/* Parent Hierarchy Card (EDIT and VIEW modes) */}
                            {!isCreate && specialization && (
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
                                                    {specialization.course
                                                        ?.name ?? "—"}
                                                </span>
                                            </div>
                                            {specialization.course?.code && (
                                                <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300">
                                                    Prefix:{" "}
                                                    {specialization.course.code}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                            {specialization.department?.name && (
                                                <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                                                    <Building2 size={11} />
                                                    {specialization.department.name}
                                                </span>
                                            )}
                                            {specialization.school?.name && (
                                                <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                                                    <Library size={11} />
                                                    {specialization.school.name}
                                                </span>
                                            )}
                                            {specialization.university?.name && (
                                                <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                                                    <BookOpen size={11} />
                                                    {specialization.university.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Specialization Name */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="specialization-name"
                                        className="text-xs sm:text-sm font-medium text-slate-300"
                                    >
                                        Specialization Name{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        {form.name.length}/150
                                    </span>
                                </div>

                                <input
                                    id="specialization-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        changeField("name", event.target.value)
                                    }
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Artificial Intelligence & Data Science"
                                    className={`${inputClass} ${
                                        fieldErrors.name
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : ""
                                    }`}
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            {/* Specialization Code Suffix with Course Prefix */}
                            <div>
                                <label
                                    htmlFor="specialization-code"
                                    className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                >
                                    Specialization Code{" "}
                                    <span className="text-cyan-400">*</span>
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
                                        id="specialization-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="AI"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-xs sm:text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>

                                <FieldError>
                                    {fieldErrors.code || prefixError}
                                </FieldError>

                                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                                    <span>
                                        Fixed course code prefix is automatically
                                        attached.
                                    </span>
                                    {previewFullCode && (
                                        <span className="font-mono text-cyan-400">
                                            Resulting Code:{" "}
                                            <strong>{previewFullCode}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Active Status (EDIT mode) */}
                            {!isCreate && (
                                <div>
                                    <label
                                        htmlFor="specialization-status"
                                        className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-300"
                                    >
                                        Active Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="specialization-status"
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
                            )}

                            {/* VIEW Mode: Complete Breakdown & Governance */}
                            {isView && specialization && (
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
                                                    {specialization.code || "—"}
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
                                                    Specialization Suffix
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
                                            label="Specialization ID"
                                            value={`#${specialization.id}`}
                                        />
                                        <InfoItem
                                            label="Status"
                                            value={
                                                <StatusBadge
                                                    status={
                                                        specialization.activeStatus
                                                    }
                                                />
                                            }
                                        />
                                        <InfoItem
                                            label="Subjects Linked"
                                            value={`${specialization.subjects.length} Subjects`}
                                            icon={Layers}
                                        />
                                        <InfoItem
                                            label="Section Groups"
                                            value={`${specialization.sectionGroups.length} Groups`}
                                            icon={GraduationCap}
                                        />
                                    </div>

                                    {/* Child Subjects Chips */}
                                    {specialization.subjects.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-slate-400">
                                                Linked Subjects (
                                                {specialization.subjects.length}
                                                )
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                {specialization.subjects.map(
                                                    (subj) => (
                                                        <span
                                                            key={subj.id}
                                                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                                                        >
                                                            {subj.code ? (
                                                                <strong className="text-cyan-300 font-mono mr-1">
                                                                    {subj.code}
                                                                </strong>
                                                            ) : null}
                                                            {subj.name}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Child Section Groups Chips */}
                                    {specialization.sectionGroups.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-slate-400">
                                                Linked Section Groups (
                                                {
                                                    specialization.sectionGroups
                                                        .length
                                                }
                                                )
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                {specialization.sectionGroups.map(
                                                    (group) => (
                                                        <span
                                                            key={group.id}
                                                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                                                        >
                                                            {group.code ? (
                                                                <strong className="text-violet-300 font-mono mr-1">
                                                                    {group.code}
                                                                </strong>
                                                            ) : null}
                                                            {group.name}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Audit & Governance Showcase (Matching University Design) */}
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
                                                    {specialization.createdAt && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(specialization.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                        {getInitials(specialization.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {specialization.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(specialization.createdBy?.code || specialization.createdBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {specialization.createdBy.code
                                                                    ? `Code: ${specialization.createdBy.code}`
                                                                    : `ID: #${specialization.createdBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {specialization.createdAt && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            Timestamp: {formatDateTime(specialization.createdAt)}
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
                                                    {(specialization.updatedAt || specialization.createdAt) && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(specialization.updatedAt || specialization.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                        {getInitials(
                                                            specialization.updatedBy?.name ||
                                                            specialization.createdBy?.name ||
                                                            "System"
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {specialization.updatedBy?.name ||
                                                                specialization.createdBy?.name ||
                                                                "System Administrator"}
                                                        </p>
                                                        {(specialization.updatedBy?.code || specialization.updatedBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {specialization.updatedBy.code
                                                                    ? `Code: ${specialization.updatedBy.code}`
                                                                    : `ID: #${specialization.updatedBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(specialization.updatedAt || specialization.createdAt) && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            Timestamp: {formatDateTime(specialization.updatedAt || specialization.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Permissions */}
                                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            Your Permissions
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {specialization.permissionActions
                                                .length > 0 ? (
                                                specialization.permissionActions.map(
                                                    (action) => (
                                                        <span
                                                            key={action}
                                                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 font-mono text-[11px] text-cyan-300"
                                                        >
                                                            {action}
                                                        </span>
                                                    )
                                                )
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
                                    : prefixLoading && !prefix
                                        ? "Loading prefix..."
                                        : isDelete
                                            ? "Confirm Delete"
                                            : isCreate
                                                ? "Create Specialization"
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
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function Specializations() {
    const reduceMotion = useReducedMotion();

    const [specializations, setSpecializations] = useState<
        SpecializationResponse[]
    >([]);
    const [courses, setCourses] = useState<CommonDTO[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Secondary table filters (derived entirely from loaded specializations)
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [courseFilter, setCourseFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<DialogState | null>(null);

    // Initial load: loads all authorized specializations directly
    const loadData = useCallback(async (background = false) => {
        if (background) setRefreshing(true);
        else setLoading(true);

        setPageError("");

        try {
            const result = await getAllSpecializations();
            setSpecializations(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load specializations: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Course options for creation: fetched only on demand
    const loadCourseOptions = useCallback(async () => {
        setCoursesLoading(true);
        try {
            const result = await getCourseFilter();
            setCourses(uniqueDTOs(result));
            return result;
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Cannot load course options: ${message}`);
            throw error;
        } finally {
            setCoursesLoading(false);
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
    /* Filter options derived directly from specializations records:          */
    /* University -> School -> Department -> Course                           */
    /* ---------------------------------------------------------------------- */

    const tableUniversities = useMemo(
        () => uniqueDTOs(specializations.map((item) => item.university)),
        [specializations]
    );

    const tableSchools = useMemo(
        () =>
            uniqueDTOs(
                specializations
                    .filter(
                        (item) =>
                            universityFilter === "ALL" ||
                            item.university?.id === Number(universityFilter)
                    )
                    .map((item) => item.school)
            ),
        [specializations, universityFilter]
    );

    const tableDepartments = useMemo(
        () =>
            uniqueDTOs(
                specializations
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
        [specializations, universityFilter, schoolFilter]
    );

    const tableCourses = useMemo(
        () =>
            uniqueDTOs(
                specializations
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
        [
            specializations,
            universityFilter,
            schoolFilter,
            departmentFilter,
        ]
    );

    // Keep child filter selections valid
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
            courseFilter !== "ALL" &&
            !tableCourses.some((course) => course.id === Number(courseFilter))
        ) {
            setCourseFilter("ALL");
        }
    }, [courseFilter, tableCourses]);

    // Statistics
    const stats = useMemo(
        () => [
            {
                label: "Total Specializations",
                value: specializations.length,
                icon: BookOpen,
                tone: "cyan",
            },
            {
                label: "Active Specializations",
                value: specializations.filter(
                    (item) => item.activeStatus === "ENABLE"
                ).length,
                icon: GraduationCap,
                tone: "green",
            },
            {
                label: "Inactive Specializations",
                value: specializations.filter(
                    (item) => item.activeStatus === "DISABLE"
                ).length,
                icon: ShieldCheck,
                tone: "purple",
            },
            {
                label: "Linked Subjects",
                value: specializations.reduce(
                    (acc, curr) => acc + (curr.subjects?.length || 0),
                    0
                ),
                icon: Layers,
                tone: "blue",
            },
        ],
        [specializations]
    );

    // Filtered & sorted specializations
    const filteredSpecializations = useMemo(() => {
        const query = normalizeText(search);

        const result = specializations.filter((item) => {
            const matchesSearch =
                !query ||
                normalizeText(item.name).includes(query) ||
                normalizeText(item.code).includes(query) ||
                normalizeText(item.course?.name).includes(query) ||
                normalizeText(item.department?.name).includes(query) ||
                normalizeText(item.createdBy?.name).includes(query);

            const matchesStatus =
                statusFilter === "ALL" || item.activeStatus === statusFilter;

            const matchesUniversity =
                universityFilter === "ALL" ||
                item.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                item.school?.id === Number(schoolFilter);

            const matchesDepartment =
                departmentFilter === "ALL" ||
                item.department?.id === Number(departmentFilter);

            const matchesCourse =
                courseFilter === "ALL" ||
                item.course?.id === Number(courseFilter);

            return (
                matchesSearch &&
                matchesStatus &&
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
            if (sort === "CODE_DESC") return b.code.localeCompare(a.code);
            return b.id - a.id;
        });

        return result;
    }, [
        specializations,
        search,
        statusFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
        courseFilter,
        sort,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSpecializations.length / PAGE_SIZE)
    );

    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const visibleSpecializations = filteredSpecializations.slice(
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
        courseFilter,
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
        courseFilter !== "ALL" ||
        sort !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setCourseFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    async function openCreateDialog() {
        setPageError("");

        try {
            const availableCourses = await loadCourseOptions();
            const unique = uniqueDTOs(availableCourses);

            if (unique.length === 0) {
                toast.error(
                    "No courses are available for specialization creation."
                );
                return;
            }

            setDialog({ mode: "CREATE", specialization: null });
        } catch (error) {
            // Already toasted in loadCourseOptions
        }
    }

    function openDialog(
        mode: DialogMode,
        specialization: SpecializationResponse
    ) {
        setDialog({ mode, specialization });
    }

    async function handleCreate(
        courseId: number,
        request: SpecializationCreateRequest
    ) {
        setBusy(true);

        try {
            await createSpecialization(courseId, request);
            setDialog(null);
            setNotice("Specialization created successfully.");
            toast.success(
                `Specialization "${request.name}" created successfully.`
            );
            await loadData(true);
        } catch (error) {
            toast.error(
                `Could not create specialization: ${extractErrorMessage(error)}`
            );
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(request: SpecializationRequest) {
        setBusy(true);

        try {
            await updateSpecialization(request);
            setDialog(null);
            setNotice("Specialization updated successfully.");
            toast.success("Specialization updated successfully.");
            await loadData(true);
        } catch (error) {
            toast.error(
                `Could not update specialization: ${extractErrorMessage(error)}`
            );
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setBusy(true);

        try {
            const message = await deleteSpecialization(id);
            setDialog(null);
            setNotice(message);
            toast.success(message);
            await loadData(true);
        } catch (error) {
            toast.error(
                `Could not delete specialization: ${extractErrorMessage(error)}`
            );
            throw error;
        } finally {
            setBusy(false);
        }
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-blue-300",
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
                    <span className="text-cyan-300">Specializations</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>
                        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                            Specialization Management
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
                            Manage course specializations, track academic associations,
                            and control active status with automatic prefix synchronization.
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
                            disabled={loading || refreshing || coursesLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {coursesLoading ? (
                                <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                                <Plus size={17} />
                            )}
                            Add Specialization
                        </button>
                    </div>
                </div>
            </section>

            {/* Error or Notice Banners */}
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
                aria-label="Specialization statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4"
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
                                            stat.value.toLocaleString("en-IN")
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

            {/* Main Content Card: Filter Toolbar + Responsive Table & Mobile Cards */}
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                {/* Secondary Search & Filter Toolbar */}
                <div className="grid gap-2.5 sm:gap-3 border-b border-white/10 p-3 sm:p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
                    {/* Search Field */}
                    <div className="relative min-w-0 sm:col-span-2 md:col-span-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search specializations"
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
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                            className={selectClass}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ENABLE">Active</option>
                            <option value="DISABLE">Inactive</option>
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
                            onChange={(event) =>
                                setCourseFilter(event.target.value)
                            }
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
                                aria-label="Sort specializations"
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
                    ) : visibleSpecializations.length > 0 ? (
                        visibleSpecializations.map((item) => {
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
                                        <StatusBadge status={item.activeStatus} />
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
                                                Department
                                            </span>
                                            <span className="text-slate-200 truncate block">
                                                {item.department?.name ?? "—"}
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
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openDialog("VIEW", item)
                                                }
                                                aria-label={`View ${item.name}`}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                            >
                                                <Eye size={15} />
                                            </button>

                                            {canUpdate && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDialog("EDIT", item)
                                                    }
                                                    aria-label={`Edit ${item.name}`}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDialog("DELETE", item)
                                                    }
                                                    aria-label={`Delete ${item.name}`}
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/20"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : null}
                </div>

                {/* Desktop Table View (hidden on sm screens) */}
                <div className="hidden sm:block w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[950px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Specialization</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Course</th>
                                <th className="px-4 py-4 font-medium">Department</th>
                                <th className="px-4 py-4 font-medium">School / University</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map(
                                    (_, rowIndex) => (
                                        <tr key={`loading-${rowIndex}`}>
                                            {Array.from({ length: 8 }).map(
                                                (__, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className="px-4 py-4"
                                                    >
                                                        <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    )
                                )
                            ) : pageError && specializations.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-16 text-center"
                                    >
                                        <AlertTriangle
                                            size={28}
                                            className="mx-auto text-rose-400"
                                        />
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load specializations
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
                            ) : visibleSpecializations.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleSpecializations.map((item, index) => {
                                        const canUpdate = hasPermission(
                                            item,
                                            "UPDATE"
                                        );
                                        const canDelete = hasPermission(
                                            item,
                                            "DELETE"
                                        );
                                        const initials =
                                            item.name
                                                .trim()
                                                .split(/\s+/)
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase() || "SP";

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={item.id}
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
                                                className="group hover:bg-cyan-400/[0.035]"
                                            >
                                                {/* Serial Number */}
                                                <td className="px-5 py-4 text-xs text-slate-500">
                                                    {(currentPage - 1) *
                                                        PAGE_SIZE +
                                                        index +
                                                        1}
                                                </td>

                                                {/* Specialization Name & Avatar */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-[220px] truncate font-semibold text-slate-100 text-xs sm:text-sm">
                                                                {item.name ||
                                                                    "Unnamed"}
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
                                                            {item.course?.name ??
                                                                "—"}
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
                                                        {item.department?.name ??
                                                            "—"}
                                                    </p>
                                                </td>

                                                {/* School & University */}
                                                <td className="px-4 py-4">
                                                    <div className="max-w-[180px]">
                                                        <p className="truncate font-medium text-slate-200 text-xs sm:text-sm">
                                                            {item.school?.name ??
                                                                "—"}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                                            {item.university
                                                                ?.name ?? "—"}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-4 py-4">
                                                    <StatusBadge
                                                        status={
                                                            item.activeStatus
                                                        }
                                                    />
                                                </td>

                                                {/* Actions with strict h-8 w-8 shrink-0 buttons to prevent stretching */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDialog(
                                                                    "VIEW",
                                                                    item
                                                                )
                                                            }
                                                            aria-label={`View ${item.name}`}
                                                            title="View details"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={15} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDialog(
                                                                        "EDIT",
                                                                        item
                                                                    )
                                                                }
                                                                aria-label={`Edit ${item.name}`}
                                                                title="Edit specialization"
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDialog(
                                                                        "DELETE",
                                                                        item
                                                                    )
                                                                }
                                                                aria-label={`Delete ${item.name}`}
                                                                title="Delete specialization"
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/20"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}

                                                        {!canUpdate &&
                                                            !canDelete && (
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
                                    <td
                                        colSpan={8}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <BookOpen size={24} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching specializations found"
                                                : "No specializations registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try broadening your search or resetting filters."
                                                : "Specializations created under authorized courses will appear here."}
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
                        {filteredSpecializations.length === 0
                            ? "Showing 0 specializations"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                  currentPage * PAGE_SIZE,
                                  filteredSpecializations.length
                              )} of ${filteredSpecializations.length} specializations${
                                  filteredSpecializations.length !==
                                  specializations.length
                                      ? ` (filtered from ${specializations.length})`
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
                            onClick={() =>
                                setPage((value) => Math.max(1, value - 1))
                            }
                            aria-label="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
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
                                setPage((value) =>
                                    Math.min(totalPages, value + 1)
                                )
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

            {/* Specialization Dialog Modal */}
            <AnimatePresence>
                {dialog && (
                    <SpecializationDialog
                        key={`${dialog.mode}-${
                            dialog.specialization?.id ?? "new"
                        }`}
                        mode={dialog.mode}
                        specialization={dialog.specialization}
                        courses={courses}
                        coursesLoading={coursesLoading}
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
