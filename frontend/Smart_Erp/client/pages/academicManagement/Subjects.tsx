
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
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    GraduationCap,
    Layers3,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from "lucide-react";

import {
    createSubject,
    deleteSubject,
    extractErrorMessage,
    getAllSubjects,
    getCourseFilter,
    getSubjectPrefix,
    getSpecializationFilter,
    uniqueCommonDTOs,
    updateSubject,
    type ActiveStatus,
    type CommonDTO,
    type CommonRequest,
    type PermissionAction,
    type SubjectRequest,
    type SubjectResponse,
    getTeacherFilter
} from "@/services/academic/subjectService";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */


const PAGE_SIZE = 5;

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
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
    questionBankTeacherId: number | "";
    lastDateQuestionBankSummit: string;
    studyMaterialTeacherId: number | "";
    lastDateStudyMaterialSummit: string;
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
    teachers: CommonDTO[];
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
    questionBankTeacherId: "",
    lastDateQuestionBankSummit: "",
    studyMaterialTeacherId: "",
    lastDateStudyMaterialSummit: "",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function numberLabel(value: number | null | undefined): string {
    return typeof value === "number" && Number.isFinite(value)
        ? new Intl.NumberFormat("en-IN").format(value)
        : "—";
}

function statusLabel(status: ActiveStatus | null): string {
    if (status === "ENABLE") return "Active";
    if (status === "DISABLE") return "Inactive";
    return "Unknown";
}

function hasPermission(
    subject: SubjectResponse,
    action: PermissionAction
): boolean {
    return Array.isArray(subject.permissionActions) &&
        subject.permissionActions.includes(action);
}

function removePrefix(code: string, prefix: string): string {
    const value = code.trim();
    return prefix && value.startsWith(prefix)
        ? value.slice(prefix.length)
        : value;
}

function getSpecializationIds(subject: SubjectResponse | null): number[] {
    return subject?.specializations?.map((item) => item.id) ?? [];
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

function SelectChevron() {
    return (
        <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function StatusBadge({ status }: { status: ActiveStatus | null }) {
    const active = status === "ENABLE";
    const inactive = status === "DISABLE";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${active
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : inactive
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                    : "border-slate-400/30 bg-slate-500/10 text-slate-300"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active
                    ? "bg-emerald-400"
                    : inactive
                        ? "bg-amber-400"
                        : "bg-slate-400"
                    }`}
            />
            {statusLabel(status)}
        </span>
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
                            className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
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
/* Subject dialog                                                             */
/* -------------------------------------------------------------------------- */

function SubjectDialog({
    mode,
    subject,
    courses,
    specializations,
    teachers,
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

    const [form, setForm] = useState<SubjectForm>(() => ({
        ...EMPTY_FORM,
        courseId: subject?.course?.id ?? "",
        name: subject?.name ?? "",
        code: subject?.code ?? "",
        lecturesPerWeek:
            subject?.lecturesPerWeek != null
                ? String(subject.lecturesPerWeek)
                : "3",
        isPracticalSubject: subject?.isPracticalSubject ?? false,
        activeStatus: subject?.activeStatus ?? "ENABLE",
        specializationIds: getSpecializationIds(subject),
        questionBankTeacherId: subject?.questionBankTeacher?.id ?? "",
        lastDateQuestionBankSummit: subject?.lastDateQuestionBankSummit ?? "",
        studyMaterialTeacherId: subject?.studyMaterialTeacher?.id ?? "",
        lastDateStudyMaterialSummit: subject?.lastDateStudyMaterialSummit ?? "",
    }));

    const [dialogTeachers, setDialogTeachers] = useState<CommonDTO[]>(teachers);
    const [teachersLoading, setTeachersLoading] = useState(false);
    const [teachersError, setTeachersError] = useState("");

    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    useEffect(() => {
        let cancelled = false;

        async function loadTeachers() {
            if (!subject?.id) return;
            setTeachersLoading(true);
            setTeachersError("");
            try {
                const list = await getTeacherFilter(subject.id);
                if (!cancelled) {
                    setDialogTeachers(uniqueCommonDTOs(list));
                }
            } catch (error) {
                if (!cancelled) {
                    setTeachersError(
                        extractErrorMessage(error, "Unable to load teacher options.")
                    );
                }
            } finally {
                if (!cancelled) {
                    setTeachersLoading(false);
                }
            }
        }

        if (isEdit && subject?.id) {
            void loadTeachers();
        }

        return () => {
            cancelled = true;
        };
    }, [isEdit, subject?.id]);

    useEffect(() => {
        if (teachers.length > 0 && dialogTeachers.length === 0) {
            setDialogTeachers(teachers);
        }
    }, [teachers, dialogTeachers.length]);

    const availableTeachers = useMemo(() => {
        const extra: CommonDTO[] = [];
        if (subject?.questionBankTeacher) extra.push(subject.questionBankTeacher);
        if (subject?.studyMaterialTeacher) extra.push(subject.studyMaterialTeacher);
        if (Array.isArray(subject?.subjectTeachers)) extra.push(...subject.subjectTeachers);

        return uniqueCommonDTOs([
            ...(dialogTeachers.length ? dialogTeachers : teachers),
            ...extra,
        ]);
    }, [dialogTeachers, teachers, subject]);

    const selectedCourse = courses.find(
        (course) => course.id === Number(form.courseId)
    );

    const courseName =
        selectedCourse?.name ?? subject?.course?.name ?? "—";

    const courseCode =
        selectedCourse?.code ?? subject?.course?.code ?? "";

    // Preserve currently assigned specializations even if they no longer
    // match the current course-code filter.
    const availableSpecializations = useMemo(() => {
        if (!isCreate && subject) {
            return uniqueCommonDTOs([
                ...specializations.filter((item) => {
                    const matches = courseCode
                        ? text(item.code).startsWith(text(courseCode))
                        : true;
                    return matches || form.specializationIds.includes(item.id);
                }),
                ...subject.specializations,
            ]);
        }

        return courseCode
            ? specializations.filter((item) =>
                text(item.code).startsWith(text(courseCode))
            )
            : [];
    }, [
        specializations,
        courseCode,
        isCreate,
        subject,
        form.specializationIds,
    ]);

    useEffect(() => {
        let cancelled = false;

        async function loadPrefix() {
            const courseId = Number(form.courseId);

            if (!Number.isSafeInteger(courseId) || courseId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            setPrefix("");
            setPrefixError("");
            setPrefixLoading(true);

            try {
                const result = await getSubjectPrefix(
                    courseId,
                    isEdit && subject ? subject.id : undefined
                );

                if (cancelled) return;

                setPrefix(result);
                setForm((current) => ({
                    ...current,
                    code: removePrefix(
                        isEdit && subject
                            ? subject.code
                            : current.code,
                        result
                    ),
                }));
            } catch (error) {
                if (!cancelled) {
                    setPrefixError(extractErrorMessage(error));
                }
            } finally {
                if (!cancelled) setPrefixLoading(false);
            }
        }

        if (isCreate || isEdit) {
            void loadPrefix();
        }

        return () => {
            cancelled = true;
        };
        // Prefix depends on selected course and selected subject.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.courseId, isCreate, isEdit, subject?.id]);

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
        } else if (name.length > 150) {
            errors.name = "Subject name cannot exceed 150 characters.";
        }

        if (!prefix) {
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
                setDialogError("No subject was selected for deletion.");
                return;
            }

            try {
                await onDelete(subject.id);
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();

                setDialogError(
                    lower.includes("constraint") ||
                        lower.includes("foreign key") ||
                        lower.includes("cannot delete")
                        ? "This subject has related records. Remove or reassign those records before deleting it."
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
            setDialogError("Please wait while the subject prefix loads.");
            return;
        }

        if (prefixError) {
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
                    questionBankTeacherId:
                        form.questionBankTeacherId === ""
                            ? null
                            : Number(form.questionBankTeacherId),
                    lastDateQuestionBankSummit:
                        form.lastDateQuestionBankSummit || null,
                    studyMaterialTeacherId:
                        form.studyMaterialTeacherId === ""
                            ? null
                            : Number(form.studyMaterialTeacherId),
                    lastDateStudyMaterialSummit:
                        form.lastDateStudyMaterialSummit || null,
                };

                await onUpdate(request);
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    const title: Record<DialogMode, string> = {
        CREATE: "Create Subject",
        EDIT: "Edit Subject",
        VIEW: "Subject Details",
        DELETE: "Delete Subject",
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
                aria-labelledby="subject-dialog-title"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c1530]/95 px-5 py-5 backdrop-blur sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · Academic Administration
                        </p>
                        <h2
                            id="subject-dialog-title"
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
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} noValidate className="space-y-5 p-5 sm:p-6">
                    <AnimatePresence>
                        {dialogError && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200"
                            >
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
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
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">
                                        Delete this subject?
                                    </p>
                                    <p className="mt-1 text-sm text-slate-300">
                                        You are about to delete{" "}
                                        <strong className="text-white">
                                            {subject?.name}
                                        </strong>
                                        . Related records may prevent deletion.
                                    </p>
                                    <p className="mt-2 font-mono text-xs text-cyan-300">
                                        {subject?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isCreate && (
                                <div>
                                    <label htmlFor="subject-course" className="mb-2 block text-sm font-medium text-slate-300">
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
                                                changeField("specializationIds", []);
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
                                    {courses.length === 0 && (
                                        <FieldError>
                                            No course options are available. Check the course filter API.
                                        </FieldError>
                                    )}
                                    <FieldError>{fieldErrors.courseId}</FieldError>
                                </div>
                            )}

                            {!isCreate && (
                                <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                                    <p className="text-xs text-slate-500">Course</p>
                                    <p className="mt-1 font-medium text-white">{courseName}</p>
                                    {courseCode && (
                                        <p className="mt-1 font-mono text-xs text-cyan-300">
                                            {courseCode}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label htmlFor="subject-name" className="mb-2 block text-sm font-medium text-slate-300">
                                    Subject Name <span className="text-cyan-400">*</span>
                                </label>
                                <input
                                    id="subject-name"
                                    value={form.name}
                                    onChange={(event) => changeField("name", event.target.value)}
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Java Programming"
                                    className={`${inputClass} ${fieldErrors.name ? "border-rose-500/60" : ""}`}
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            <div>
                                <label htmlFor="subject-code" className="mb-2 block text-sm font-medium text-slate-300">
                                    Subject Code <span className="text-cyan-400">*</span>
                                </label>
                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[55%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading ? "Loading…" : prefix || "PREFIX"}
                                        </span>
                                    </div>
                                    <input
                                        id="subject-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField("code", event.target.value.toUpperCase())
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="101"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>
                                <FieldError>{fieldErrors.code || prefixError}</FieldError>
                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    The prefix is fixed by the server. Only the suffix is entered and sent to the API.
                                </p>
                            </div>

                            {isCreate && (
                                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-slate-300">
                                    <p className="font-semibold text-cyan-300">
                                        Basic Information Only
                                    </p>
                                    <p className="mt-1 leading-relaxed text-slate-400">
                                        Only course, subject name, and subject code are required to create a subject. Additional configurations such as teachers, specializations, lectures per week, and submission deadlines can be set after creation by editing the subject.
                                    </p>
                                </div>
                            )}

                            {!isCreate && (
                                <>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="subject-lectures" className="mb-2 block text-sm font-medium text-slate-300">
                                                Lectures per week
                                            </label>
                                            <input
                                                id="subject-lectures"
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={form.lecturesPerWeek}
                                                onChange={(event) =>
                                                    changeField("lecturesPerWeek", event.target.value)
                                                }
                                                readOnly={readOnly || busy}
                                                className={`${inputClass} ${fieldErrors.lecturesPerWeek ? "border-rose-500/60" : ""}`}
                                            />
                                            <FieldError>{fieldErrors.lecturesPerWeek}</FieldError>
                                        </div>

                                        <div>
                                            <label htmlFor="subject-status" className="mb-2 block text-sm font-medium text-slate-300">
                                                Active Status
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="subject-status"
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
                                                    <option value="ENABLE">Active (Enable)</option>
                                                    <option value="DISABLE">Inactive (Disable)</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        </div>
                                    </div>

                                    <label className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 ${readOnly ? "opacity-70" : "cursor-pointer"}`}>
                                        <input
                                            type="checkbox"
                                            checked={form.isPracticalSubject}
                                            onChange={(event) =>
                                                changeField("isPracticalSubject", event.target.checked)
                                            }
                                            disabled={readOnly || busy}
                                            className="h-4 w-4 accent-cyan-400"
                                        />
                                        <span>
                                            <span className="block text-sm font-medium text-white">
                                                Practical subject
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-400">
                                                Mark this subject as practical.
                                            </span>
                                        </span>
                                    </label>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <label className="text-sm font-medium text-slate-300">
                                                Specializations
                                            </label>
                                            <span className="text-xs text-slate-500">
                                                Multiple selection
                                            </span>
                                        </div>

                                        <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 p-3">
                                            {availableSpecializations.length === 0 ? (
                                                <p className="py-2 text-sm text-slate-400">
                                                    No matching specializations are available.
                                                </p>
                                            ) : (
                                                availableSpecializations.map((item) => {
                                                    const checked = form.specializationIds.includes(item.id);

                                                    return (
                                                        <label
                                                            key={item.id}
                                                            className={`flex items-center gap-3 rounded-lg border p-3 transition ${checked
                                                                ? "border-cyan-400/30 bg-cyan-400/10"
                                                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                                                                } ${readOnly || busy ? "cursor-default opacity-70" : "cursor-pointer"}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                disabled={readOnly || busy}
                                                                onChange={() => toggleSpecialization(item.id)}
                                                                className="h-4 w-4 accent-cyan-400"
                                                            />
                                                            <span className="min-w-0 flex-1 text-sm text-slate-200">
                                                                {item.name}
                                                            </span>
                                                            {item.code && (
                                                                <span className="font-mono text-xs text-slate-500">
                                                                    {item.code}
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {form.specializationIds.length > 0 && (
                                            <p className="mt-2 text-xs text-cyan-300">
                                                {form.specializationIds.length} specialization(s) selected
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label htmlFor="question-bank-teacher" className="text-sm font-medium text-slate-300">
                                                    Question bank teacher
                                                </label>
                                                {teachersLoading && (
                                                    <span className="flex items-center gap-1 text-xs text-cyan-400">
                                                        <LoaderCircle size={12} className="animate-spin" />
                                                        Loading...
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <select
                                                    id="question-bank-teacher"
                                                    value={form.questionBankTeacherId}
                                                    onChange={(event) =>
                                                        changeField(
                                                            "questionBankTeacherId",
                                                            event.target.value ? Number(event.target.value) : ""
                                                        )
                                                    }
                                                    disabled={readOnly || busy || (teachersLoading && availableTeachers.length === 0)}
                                                    className={`${inputClass} appearance-none pr-10`}
                                                >
                                                    <option value="">Not assigned</option>
                                                    {availableTeachers.map((teacher) => (
                                                        <option key={teacher.id} value={teacher.id}>
                                                            {teacher.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <SelectChevron />
                                            </div>
                                            {teachersError && (
                                                <p className="mt-1 text-xs text-rose-400">{teachersError}</p>
                                            )}
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label htmlFor="study-material-teacher" className="text-sm font-medium text-slate-300">
                                                    Study material teacher
                                                </label>
                                                {teachersLoading && (
                                                    <span className="flex items-center gap-1 text-xs text-cyan-400">
                                                        <LoaderCircle size={12} className="animate-spin" />
                                                        Loading...
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <select
                                                    id="study-material-teacher"
                                                    value={form.studyMaterialTeacherId}
                                                    onChange={(event) =>
                                                        changeField(
                                                            "studyMaterialTeacherId",
                                                            event.target.value ? Number(event.target.value) : ""
                                                        )
                                                    }
                                                    disabled={readOnly || busy || (teachersLoading && availableTeachers.length === 0)}
                                                    className={`${inputClass} appearance-none pr-10`}
                                                >
                                                    <option value="">Not assigned</option>
                                                    {availableTeachers.map((teacher) => (
                                                        <option key={teacher.id} value={teacher.id}>
                                                            {teacher.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="question-bank-date" className="mb-2 block text-sm font-medium text-slate-300">
                                                Question bank submission date
                                            </label>
                                            <input
                                                id="question-bank-date"
                                                type="date"
                                                value={form.lastDateQuestionBankSummit}
                                                onChange={(event) =>
                                                    changeField("lastDateQuestionBankSummit", event.target.value)
                                                }
                                                disabled={readOnly || busy}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="study-material-date" className="mb-2 block text-sm font-medium text-slate-300">
                                                Study material submission date
                                            </label>
                                            <input
                                                id="study-material-date"
                                                type="date"
                                                value={form.lastDateStudyMaterialSummit}
                                                onChange={(event) =>
                                                    changeField("lastDateStudyMaterialSummit", event.target.value)
                                                }
                                                disabled={readOnly || busy}
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {isView && subject && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Academic hierarchy
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {[
                                            ["Subject ID", subject.id],
                                            ["Course", subject.course?.name],
                                            ["Academic Year", subject.academicYear?.name],
                                            ["University", subject.university?.name],
                                            ["School", subject.school?.name],
                                            ["Department", subject.department?.name],
                                            ["Question Bank Teacher", subject.questionBankTeacher?.name],
                                            ["Study Material Teacher", subject.studyMaterialTeacher?.name],
                                        ].map(([label, value]) => (
                                            <div
                                                key={String(label)}
                                                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                                            >
                                                <p className="text-xs text-slate-500">{label}</p>
                                                <p className="mt-1 break-words font-medium text-white">
                                                    {value == null || value === "" ? "—" : String(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="mb-2 text-xs text-slate-500">
                                            Available permissions
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {subject.permissionActions.length ? (
                                                subject.permissionActions.map((action) => (
                                                    <span
                                                        key={action}
                                                        className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-xs text-cyan-300"
                                                    >
                                                        {action}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    No permissions were returned.
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
                            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>

                        {!isView && (
                            <button
                                type="submit"
                                disabled={busy || prefixLoading || ((isCreate || isEdit) && !prefix)}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${isDelete
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
/* Main Subject page                                                          */
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
    const [courseOptionsError, setCourseOptionsError] = useState("");
    const [specializationOptionsError, setSpecializationOptionsError] = useState("");
    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [academicYearFilter, setAcademicYearFilter] = useState("ALL");
    const [courseFilter, setCourseFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        subject: SubjectResponse | null;
    } | null>(null);

    const loadData = useCallback(async (background = false) => {
        if (background) setRefreshing(true);
        else setLoading(true);

        setPageError("");

        try {
            setSubjects(await getAllSubjects());
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load subjects: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadFormOptions = useCallback(async () => {
        setCourseOptionsError("");
        setSpecializationOptionsError("");

        const results = await Promise.allSettled([
            getCourseFilter(),
            getSpecializationFilter(),
        ]);

        if (results[0].status === "fulfilled") {
            setCourses(uniqueCommonDTOs(results[0].value));
        } else {
            const message = extractErrorMessage(results[0].reason);
            setCourseOptionsError(message);
            toast.error(`Could not load course options: ${message}`);
        }

        if (results[1].status === "fulfilled") {
            setSpecializations(uniqueCommonDTOs(results[1].value));
        } else {
            const message = extractErrorMessage(results[1].reason);
            setSpecializationOptionsError(message);
            toast.error(`Could not load specialization options: ${message}`);
        }
    }, []);

    useEffect(() => {
        void loadData();
        void loadFormOptions();
    }, [loadData, loadFormOptions]);

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const allTeachers = useMemo(() => {
        const values: CommonDTO[] = [];

        for (const subject of subjects) {
            values.push(
                ...(subject.subjectTeachers ?? []),
                ...(subject.questionBankTeacher ? [subject.questionBankTeacher] : []),
                ...(subject.studyMaterialTeacher ? [subject.studyMaterialTeacher] : [])
            );
        }

        return uniqueCommonDTOs(values);
    }, [subjects]);

    const tableUniversities = useMemo(
        () => uniqueCommonDTOs(subjects.map((item) => item.university)),
        [subjects]
    );

    const tableSchools = useMemo(
        () => uniqueCommonDTOs(
            subjects
                .filter((item) =>
                    universityFilter === "ALL" ||
                    item.university?.id === Number(universityFilter)
                )
                .map((item) => item.school)
        ),
        [subjects, universityFilter]
    );

    const tableDepartments = useMemo(
        () => uniqueCommonDTOs(
            subjects
                .filter((item) =>
                    universityFilter === "ALL" ||
                    item.university?.id === Number(universityFilter)
                )
                .filter((item) =>
                    schoolFilter === "ALL" ||
                    item.school?.id === Number(schoolFilter)
                )
                .map((item) => item.department)
        ),
        [subjects, universityFilter, schoolFilter]
    );

    const tableAcademicYears = useMemo(
        () => uniqueCommonDTOs(
            subjects
                .filter((item) =>
                    universityFilter === "ALL" ||
                    item.university?.id === Number(universityFilter)
                )
                .filter((item) =>
                    schoolFilter === "ALL" ||
                    item.school?.id === Number(schoolFilter)
                )
                .filter((item) =>
                    departmentFilter === "ALL" ||
                    item.department?.id === Number(departmentFilter)
                )
                .map((item) => item.academicYear)
        ),
        [subjects, universityFilter, schoolFilter, departmentFilter]
    );

    const tableCourses = useMemo(
        () => uniqueCommonDTOs(
            subjects
                .filter((item) =>
                    universityFilter === "ALL" ||
                    item.university?.id === Number(universityFilter)
                )
                .filter((item) =>
                    schoolFilter === "ALL" ||
                    item.school?.id === Number(schoolFilter)
                )
                .filter((item) =>
                    departmentFilter === "ALL" ||
                    item.department?.id === Number(departmentFilter)
                )
                .filter((item) =>
                    academicYearFilter === "ALL" ||
                    item.academicYear?.id === Number(academicYearFilter)
                )
                .map((item) => item.course)
        ),
        [
            subjects,
            universityFilter,
            schoolFilter,
            departmentFilter,
            academicYearFilter,
        ]
    );

    // Keep child filter selections valid after parent filters change.
    useEffect(() => {
        if (
            schoolFilter !== "ALL" &&
            !tableSchools.some((item) => item.id === Number(schoolFilter))
        ) setSchoolFilter("ALL");
    }, [schoolFilter, tableSchools]);

    useEffect(() => {
        if (
            departmentFilter !== "ALL" &&
            !tableDepartments.some((item) => item.id === Number(departmentFilter))
        ) setDepartmentFilter("ALL");
    }, [departmentFilter, tableDepartments]);

    useEffect(() => {
        if (
            academicYearFilter !== "ALL" &&
            !tableAcademicYears.some((item) => item.id === Number(academicYearFilter))
        ) setAcademicYearFilter("ALL");
    }, [academicYearFilter, tableAcademicYears]);

    useEffect(() => {
        if (
            courseFilter !== "ALL" &&
            !tableCourses.some((item) => item.id === Number(courseFilter))
        ) setCourseFilter("ALL");
    }, [courseFilter, tableCourses]);

    const stats = useMemo(() => {
        const active = subjects.filter((item) => item.activeStatus === "ENABLE").length;
        const inactive = subjects.filter((item) => item.activeStatus === "DISABLE").length;
        const practical = subjects.filter((item) => item.isPracticalSubject).length;
        const specializationsCount = new Set(
            subjects.flatMap((item) => item.specializations.map((spec) => spec.id))
        ).size;

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
                icon: GraduationCap,
                tone: "purple",
            },
            {
                label: "Specializations Used",
                value: numberLabel(specializationsCount),
                icon: Layers3,
                tone: "blue",
            },
            {
                label: "Inactive Subjects",
                value: numberLabel(inactive),
                icon: Users,
                tone: "amber",
            },
        ];
    }, [subjects]);

    const filteredSubjects = useMemo(() => {
        const query = text(search);

        const result = subjects.filter((subject) => {
            const matchesSearch =
                !query ||
                text(subject.name).includes(query) ||
                text(subject.code).includes(query) ||
                text(subject.id).includes(query) ||
                text(subject.course?.name).includes(query) ||
                text(subject.course?.code).includes(query) ||
                subject.specializations.some(
                    (item) =>
                        text(item.name).includes(query) ||
                        text(item.code).includes(query)
                );

            const matchesStatus =
                statusFilter === "ALL" ||
                subject.activeStatus === statusFilter;

            const matchesUniversity =
                universityFilter === "ALL" ||
                subject.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                subject.school?.id === Number(schoolFilter);

            const matchesDepartment =
                departmentFilter === "ALL" ||
                subject.department?.id === Number(departmentFilter);

            const matchesYear =
                academicYearFilter === "ALL" ||
                subject.academicYear?.id === Number(academicYearFilter);

            const matchesCourse =
                courseFilter === "ALL" ||
                subject.course?.id === Number(courseFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment &&
                matchesYear &&
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
        universityFilter,
        schoolFilter,
        departmentFilter,
        academicYearFilter,
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
        universityFilter,
        schoolFilter,
        departmentFilter,
        academicYearFilter,
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
        academicYearFilter !== "ALL" ||
        courseFilter !== "ALL" ||
        sort !== "NEWEST";

    async function openCreateDialog() {
        setPageError("");
        setNotice("");

        await loadFormOptions();

        setDialog({ mode: "CREATE", subject: null });
    }

    function openDialog(
        mode: DialogMode,
        subject: SubjectResponse | null = null
    ) {
        setPageError("");
        setNotice("");
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
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setAcademicYearFilter("ALL");
        setCourseFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
        amber: "border-amber-400/20 from-amber-500/10 to-orange-500/5 text-amber-300",
    };

    const hierarchyFilters = [
        {
            label: "University",
            value: universityFilter,
            options: tableUniversities,
            allLabel: "All universities",
            onChange: (value: string) => {
                setUniversityFilter(value);
                setSchoolFilter("ALL");
                setDepartmentFilter("ALL");
                setAcademicYearFilter("ALL");
                setCourseFilter("ALL");
            },
        },
        {
            label: "School",
            value: schoolFilter,
            options: tableSchools,
            allLabel: "All schools",
            onChange: (value: string) => {
                setSchoolFilter(value);
                setDepartmentFilter("ALL");
                setAcademicYearFilter("ALL");
                setCourseFilter("ALL");
            },
        },
        {
            label: "Department",
            value: departmentFilter,
            options: tableDepartments,
            allLabel: "All departments",
            onChange: (value: string) => {
                setDepartmentFilter(value);
                setAcademicYearFilter("ALL");
                setCourseFilter("ALL");
            },
        },
        {
            label: "Academic year",
            value: academicYearFilter,
            options: tableAcademicYears,
            allLabel: "All academic years",
            onChange: (value: string) => {
                setAcademicYearFilter(value);
                setCourseFilter("ALL");
            },
        },
        {
            label: "Course",
            value: courseFilter,
            options: tableCourses,
            allLabel: "All courses",
            onChange: setCourseFilter,
        },
    ];

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-7 p-4 text-white sm:p-6 lg:p-8"
        >
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Academic Management</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Subjects</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Subject Management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage subjects, specialization assignments, weekly lectures, and academic hierarchy.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                void loadData(true);
                                void loadFormOptions();
                            }}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={loading || refreshing ? "animate-spin text-cyan-400" : ""}
                            />
                            <span className="hidden sm:inline">
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => void openCreateDialog()}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Add Subject
                        </button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        title="Could not load subjects"
                        message={pageError}
                        onRetry={() => void loadData()}
                        onDismiss={() => setPageError("")}
                    />
                )}
                {courseOptionsError && (
                    <ErrorBanner
                        title="Course options unavailable"
                        message={courseOptionsError}
                        onRetry={() => void loadFormOptions()}
                        onDismiss={() => setCourseOptionsError("")}
                    />
                )}
                {specializationOptionsError && (
                    <ErrorBanner
                        title="Specialization options unavailable"
                        message={specializationOptionsError}
                        onRetry={() => void loadFormOptions()}
                        onDismiss={() => setSpecializationOptionsError("")}
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
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
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

            <section
                aria-label="Subject statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
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
                                delay: reduceMotion ? 0 : index * 0.05,
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
                                        ) : stat.value}
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
                                    transition={{ duration: 0.7, delay: index * 0.08 }}
                                    className="h-full rounded-full bg-current opacity-60"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 xl:grid-cols-3 2xl:grid-cols-[minmax(220px,1.5fr)_160px_repeat(5,minmax(135px,1fr))_auto]">
                    <div className="relative min-w-0">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search subjects by name or code"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, code, ID..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-10 pr-9 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
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
                            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ENABLE">Active</option>
                            <option value="DISABLE">Inactive</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {hierarchyFilters.map((filter) => (
                        <div className="relative" key={filter.label}>
                            <select
                                aria-label={`Filter by ${filter.label}`}
                                value={filter.value}
                                onChange={(event) => filter.onChange(event.target.value)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                            >
                                <option value="ALL">{filter.allLabel}</option>
                                {filter.options.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                        {option.code ? ` (${option.code})` : ""}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>
                    ))}

                    <div className="relative">
                        <select
                            aria-label="Sort subjects"
                            value={sort}
                            onChange={(event) => setSort(event.target.value as SortOption)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="NEWEST">Highest ID first</option>
                            <option value="NAME_ASC">Name: A to Z</option>
                            <option value="NAME_DESC">Name: Z to A</option>
                            <option value="CODE_ASC">Code: A to Z</option>
                            <option value="LECTURES_DESC">Lectures: High to low</option>
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    )}
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Subject</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Course</th>
                                <th className="px-4 py-4 font-medium">Academic Year</th>
                                <th className="px-4 py-4 font-medium">Specializations</th>
                                <th className="px-4 py-4 font-medium">Lectures / Week</th>
                                <th className="px-4 py-4 font-medium">Status</th>
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
                            ) : pageError && subjects.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <AlertTriangle className="mx-auto text-rose-400" size={28} />
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load subjects
                                        </p>
                                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                                            {pageError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadData()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : visibleSubjects.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleSubjects.map((subject, index) => {
                                        const initials =
                                            subject.name
                                                .trim()
                                                .split(/\s+/)
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase() || "SU";

                                        const canUpdate = hasPermission(subject, "UPDATE");
                                        const canDelete = hasPermission(subject, "DELETE");

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={subject.id}
                                                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="group transition-colors hover:bg-cyan-400/[0.035]"
                                            >
                                                <td className="px-5 py-5 text-slate-500">
                                                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-cyan-200">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-xs truncate font-semibold text-slate-100">
                                                                {subject.name || "Unnamed Subject"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                ID: {subject.id}
                                                                {subject.isPracticalSubject ? " · Practical" : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <span className="inline-flex max-w-[180px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {subject.code || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {subject.course?.name || "—"}
                                                    </p>
                                                    {subject.course?.code && (
                                                        <p className="mt-1 font-mono text-xs text-slate-500">
                                                            {subject.course.code}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5 text-slate-300">
                                                    {subject.academicYear?.name || "—"}
                                                </td>

                                                <td className="px-4 py-5">
                                                    {subject.specializations.length ? (
                                                        <div className="flex max-w-[250px] flex-wrap gap-1.5">
                                                            {subject.specializations.slice(0, 2).map((item) => (
                                                                <span
                                                                    key={item.id}
                                                                    className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200"
                                                                >
                                                                    {item.name}
                                                                </span>
                                                            ))}
                                                            {subject.specializations.length > 2 && (
                                                                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">
                                                                    +{subject.specializations.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">
                                                            None assigned
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5 font-medium tabular-nums text-slate-200">
                                                    {numberLabel(subject.lecturesPerWeek)}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <StatusBadge status={subject.activeStatus} />
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("VIEW", subject)}
                                                            aria-label={`View ${subject.name}`}
                                                            title="View details"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={17} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("EDIT", subject)}
                                                                aria-label={`Edit ${subject.name}`}
                                                                title="Edit subject"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil size={17} />
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("DELETE", subject)}
                                                                aria-label={`Delete ${subject.name}`}
                                                                title="Delete subject"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10"
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
                                                ? "No matching subjects found"
                                                : "No subjects registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : "Subjects will appear here after they are created."}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                            >
                                                <RotateCcw size={14} />
                                                Clear Filters
                                            </button>
                                        )}
                                        {!hasActiveFilters && subjects.length === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => void openCreateDialog()}
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110"
                                            >
                                                <Plus size={15} />
                                                Add Subject
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        {filteredSubjects.length === 0
                            ? "Showing 0 subjects"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredSubjects.length
                            )} of ${filteredSubjects.length} subjects${hasActiveFilters &&
                                filteredSubjects.length !== subjects.length
                                ? ` (filtered from ${subjects.length})`
                                : ""
                            }`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronsLeft size={17} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            aria-label="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
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
                                    {index > 0 && number - pages[index - 1] > 1 && (
                                        <span className="px-1 text-slate-500">…</span>
                                    )}
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setPage(number)}
                                        aria-current={currentPage === number ? "page" : undefined}
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
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronRight size={17} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronsRight size={17} />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {dialog && (
                    <SubjectDialog
                        key={`${dialog.mode}-${dialog.subject?.id ?? "new"}`}
                        mode={dialog.mode}
                        subject={dialog.subject}
                        courses={courses}
                        specializations={specializations}
                        teachers={allTeachers}
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
