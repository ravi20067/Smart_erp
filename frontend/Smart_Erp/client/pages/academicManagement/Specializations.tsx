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
    createSpecialization,
    deleteSpecialization,
    extractErrorMessage,
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
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "CODE_ASC";

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

const PAGE_SIZE = 5;

const EMPTY_FORM: FormState = {
    courseId: "",
    name: "",
    code: "",
    activeStatus: "ENABLE",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
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
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${classes}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active
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
            size={15}
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
/* Specialization dialog                                                      */
/* -------------------------------------------------------------------------- */

function SpecializationDialog({
    mode,
    specialization,
    courses,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: {
    mode: DialogMode;
    specialization: SpecializationResponse | null;
    courses: CommonDTO[];
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

    const [form, setForm] = useState<FormState>(() => ({
        courseId: "",
        name: specialization?.name ?? "",
        code: specialization?.code ?? "",
        activeStatus: specialization?.activeStatus ?? "ENABLE",
    }));

    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const selectedCourse = courses.find(
        (course) => course.id === Number(form.courseId)
    );

    const displayCourse =
        selectedCourse ?? specialization?.course ?? null;

    const title: Record<DialogMode, string> = {
        CREATE: "Create Specialization",
        EDIT: "Edit Specialization",
        VIEW: "Specialization Details",
        DELETE: "Delete Specialization",
    };

    /*
     * The course is selected only during creation.
     * Existing specializations retain their original course on update.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadPrefix() {
            const courseId = isCreate
                ? Number(form.courseId)
                : Number(specialization?.course?.id);

            if (!Number.isFinite(courseId) || courseId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            setPrefix("");
            setPrefixError("");
            setPrefixLoading(true);

            try {
                const result = await getSpecializationPrefix(
                    courseId,
                    isEdit ? specialization?.id : undefined
                );

                if (cancelled) return;

                setPrefix(result);

                if (isEdit && specialization) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(specialization.code, result),
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
            setPrefix("");
            setPrefixLoading(false);
            setPrefixError("");
        }

        return () => {
            cancelled = true;
        };
    }, [
        form.courseId,
        isCreate,
        isEdit,
        specialization?.id,
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

        if (!prefix) {
            errors.code = "The fixed specialization prefix could not be loaded.";
        } else if (!code) {
            errors.code = "Specialization code is required.";
        } else if (code.length > 40) {
            errors.code = "Code cannot exceed 40 characters.";
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
            if (!specialization) {
                setDialogError("No specialization was selected for deletion.");
                return;
            }

            try {
                await onDelete(specialization.id);
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();

                setDialogError(
                    lower.includes("constraint") ||
                        lower.includes("foreign key") ||
                        lower.includes("cannot delete")
                        ? "This specialization has related records. Remove or reassign them before deleting it."
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
            setDialogError("Please wait while the specialization prefix loads.");
            return;
        }

        if (prefixError) {
            setDialogError(prefixError);
            return;
        }

        if (!validate()) return;

        const request = {
            name: form.name.trim(),
            // Never send prefix + suffix.
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
                aria-labelledby="specialization-dialog-title"
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
                            id="specialization-dialog-title"
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
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                                <p className="min-w-0 flex-1 break-words">{dialogError}</p>
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
                                        Delete this specialization?
                                    </p>
                                    <p className="mt-1 text-sm text-slate-300">
                                        You are about to delete{" "}
                                        <strong>{specialization?.name}</strong>.
                                        This action may be blocked if related records exist.
                                    </p>
                                    <p className="mt-2 break-all font-mono text-xs text-cyan-300">
                                        {specialization?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isCreate && (
                                <div>
                                    <label
                                        htmlFor="specialization-course"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Course <span className="text-cyan-400">*</span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="specialization-course"
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

                                    {courses.length === 0 && (
                                        <p className="mt-2 text-xs text-amber-300">
                                            No courses are available for creation.
                                        </p>
                                    )}
                                    <FieldError>{fieldErrors.courseId}</FieldError>
                                </div>
                            )}

                            {!isCreate && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Course
                                    </label>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                                        <p className="font-medium text-white">
                                            {displayCourse?.name ?? "—"}
                                        </p>
                                        {displayCourse?.code && (
                                            <p className="mt-1 font-mono text-xs text-cyan-300">
                                                {displayCourse.code}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="specialization-name"
                                        className="text-sm font-medium text-slate-300"
                                    >
                                        Specialization Name <span className="text-cyan-400">*</span>
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
                                    placeholder="e.g. Cybersecurity"
                                    className={inputClass}
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            <div>
                                <label
                                    htmlFor="specialization-code"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Specialization Code <span className="text-cyan-400">*</span>
                                </label>

                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[55%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading ? "Loading…" : prefix || "PREFIX"}
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
                                        placeholder="CS"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>

                                <FieldError>
                                    {fieldErrors.code || prefixError}
                                </FieldError>
                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    The prefix is fixed by the server. Only the suffix
                                    is editable and sent to the API.
                                </p>
                            </div>

                            {!isCreate && (
                                <div>
                                    <label
                                        htmlFor="specialization-status"
                                        className="mb-2 block text-sm font-medium text-slate-300"
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
                            )}

                            {isView && specialization && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Specialization Information
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {[
                                            ["ID", String(specialization.id)],
                                            ["Academic Year", specialization.academicYear?.name ?? "—"],
                                            ["Department", specialization.department?.name ?? "—"],
                                            ["School", specialization.school?.name ?? "—"],
                                            ["University", specialization.university?.name ?? "—"],
                                            ["Subjects", String(specialization.subjects.length)],
                                            ["Section Groups", String(specialization.sectionGroups.length)],
                                        ].map(([label, value]) => (
                                            <div
                                                key={label}
                                                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                                            >
                                                <p className="text-xs text-slate-500">{label}</p>
                                                <p className="mt-1 break-words font-medium text-white">
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="mb-2 text-xs text-slate-500">Available permissions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {specialization.permissionActions.length > 0 ? (
                                                specialization.permissionActions.map((action) => (
                                                    <span
                                                        key={action}
                                                        className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-xs text-cyan-300"
                                                    >
                                                        {action}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    No update or delete permissions were returned.
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
                                disabled={
                                    busy ||
                                    prefixLoading ||
                                    ((isCreate || isEdit) && !prefix) ||
                                    (isCreate && courses.length === 0)
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${isDelete
                                    ? "bg-gradient-to-r from-red-600 to-rose-500"
                                    : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500"
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
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function Specializations() {
    const reduceMotion = useReducedMotion();

    const [specializations, setSpecializations] = useState<SpecializationResponse[]>([]);
    const [courses, setCourses] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [courseOptionsError, setCourseOptionsError] = useState("");
    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [courseFilter, setCourseFilter] = useState("ALL");
    const [academicYearFilter, setAcademicYearFilter] = useState("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<DialogState | null>(null);

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

    const loadCourseOptions = useCallback(async () => {
        setCourseOptionsError("");

        try {
            const result = await getCourseFilter();
            setCourses(uniqueDTOs(result));
        } catch (error) {
            const message = extractErrorMessage(error);
            setCourseOptionsError(message);
            throw error;
        }
    }, []);

    useEffect(() => {
        void loadData();
        void loadCourseOptions().catch(() => undefined);
    }, [loadData, loadCourseOptions]);

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    /* ---------------------------------------------------------------------- */
    /* Derive table filter options following the organizational hierarchy:     */
    /* University -> School -> Department -> Academic Year -> Course          */
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

    const tableAcademicYears = useMemo(
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
                    .map((item) => item.academicYear)
            ),
        [specializations, universityFilter, schoolFilter, departmentFilter]
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
                    .filter(
                        (item) =>
                            academicYearFilter === "ALL" ||
                            item.academicYear?.id === Number(academicYearFilter)
                    )
                    .map((item) => item.course)
            ),
        [
            specializations,
            universityFilter,
            schoolFilter,
            departmentFilter,
            academicYearFilter,
        ]
    );

    /* Keep dependent hierarchy selections valid when parents change */
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

    useEffect(() => {
        if (
            courseFilter !== "ALL" &&
            !tableCourses.some(
                (course) => course.id === Number(courseFilter)
            )
        ) {
            setCourseFilter("ALL");
        }
    }, [courseFilter, tableCourses]);

    const stats = useMemo(() => [
        {
            label: "Total Specializations",
            value: specializations.length,
            icon: BookOpen,
            tone: "cyan",
        },
        {
            label: "Active",
            value: specializations.filter((item) => item.activeStatus === "ENABLE").length,
            icon: GraduationCap,
            tone: "green",
        },
        {
            label: "Inactive",
            value: specializations.filter((item) => item.activeStatus === "DISABLE").length,
            icon: ShieldCheck,
            tone: "purple",
        },
    ], [specializations]);

    const filteredSpecializations = useMemo(() => {
        const query = normalizeText(search);

        const result = specializations.filter((item) => {
            const matchesSearch =
                !query ||
                normalizeText(item.name).includes(query) ||
                normalizeText(item.code).includes(query);

            const matchesStatus =
                statusFilter === "ALL" || item.activeStatus === statusFilter;

            const matchesCourse =
                courseFilter === "ALL" ||
                item.course?.id === Number(courseFilter);

            const matchesAcademicYear =
                academicYearFilter === "ALL" ||
                item.academicYear?.id === Number(academicYearFilter);

            const matchesUniversity =
                universityFilter === "ALL" ||
                item.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                item.school?.id === Number(schoolFilter);

            const matchesDepartment =
                departmentFilter === "ALL" ||
                item.department?.id === Number(departmentFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesCourse &&
                matchesAcademicYear &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment
            );
        });

        result.sort((a, b) => {
            if (sort === "NAME_ASC") return a.name.localeCompare(b.name);
            if (sort === "NAME_DESC") return b.name.localeCompare(a.name);
            if (sort === "CODE_ASC") return a.code.localeCompare(b.code);
            return b.id - a.id;
        });

        return result;
    }, [
        specializations,
        search,
        statusFilter,
        courseFilter,
        academicYearFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
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
        courseFilter,
        academicYearFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
        sort,
    ]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "ALL" ||
        courseFilter !== "ALL" ||
        academicYearFilter !== "ALL" ||
        universityFilter !== "ALL" ||
        schoolFilter !== "ALL" ||
        departmentFilter !== "ALL" ||
        sort !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setCourseFilter("ALL");
        setAcademicYearFilter("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    async function openCreateDialog() {
        setPageError("");

        try {
            await loadCourseOptions();

            if (courses.length === 0) {
                // State updates are asynchronous; use the fetched result directly.
                const availableCourses = await getCourseFilter();
                const uniqueCourses = uniqueDTOs(availableCourses);
                setCourses(uniqueCourses);

                if (uniqueCourses.length === 0) {
                    toast.error("No courses are available for specialization creation.");
                    return;
                }
            }

            setDialog({ mode: "CREATE", specialization: null });
        } catch (error) {
            toast.error(`Cannot load courses: ${extractErrorMessage(error)}`);
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
            toast.success(`Specialization "${request.name}" created successfully.`);
            await loadData(true);
        } catch (error) {
            toast.error(`Could not create specialization: ${extractErrorMessage(error)}`);
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
            toast.error(`Could not update specialization: ${extractErrorMessage(error)}`);
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
            toast.error(`Could not delete specialization: ${extractErrorMessage(error)}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
    };

    const selectClass =
        "w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50";

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
                    <span className="text-cyan-300">Specializations</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Specialization Management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage course specializations, review academic associations,
                            and control records using your assigned permissions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-50"
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Add Specialization
                        </button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        title="Could not load specializations"
                        message={pageError}
                        onRetry={() => void loadData()}
                        onDismiss={() => setPageError("")}
                    />
                )}

                {courseOptionsError && (
                    <ErrorBanner
                        title="Course options unavailable"
                        message={courseOptionsError}
                        onRetry={() => void loadCourseOptions().catch(() => undefined)}
                        onDismiss={() => setCourseOptionsError("")}
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
                aria-label="Specialization statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
                            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-300">{stat.label}</p>
                                    <p className="mt-3 text-3xl font-bold text-white">
                                        {loading ? (
                                            <span className="inline-block h-8 w-20 animate-pulse rounded bg-white/10" />
                                        ) : (
                                            stat.value.toLocaleString("en-IN")
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
                                    transition={{ duration: 0.7, delay: index * 0.08 }}
                                    className="h-full rounded-full bg-current opacity-60"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <div className="grid gap-3.5 border-b border-white/10 p-4 sm:p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-[minmax(200px,1.3fr)_140px_160px_160px_160px_160px_160px_160px_auto]">
                    <div className="relative min-w-0 sm:col-span-2 md:col-span-1">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search specializations by name or code"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name or code..."
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
                            className={selectClass}
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
                                setCourseFilter("ALL");
                            }}
                            className={selectClass}
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

                    {/* School */}
                    <div className="relative">
                        <select
                            aria-label="Filter by school"
                            value={schoolFilter}
                            onChange={(event) => {
                                setSchoolFilter(event.target.value);
                                setDepartmentFilter("ALL");
                                setAcademicYearFilter("ALL");
                                setCourseFilter("ALL");
                            }}
                            className={selectClass}
                        >
                            <option value="ALL">All schools</option>
                            {tableSchools.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
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
                                setCourseFilter("ALL");
                            }}
                            className={selectClass}
                        >
                            <option value="ALL">All departments</option>
                            {tableDepartments.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Academic Year (comes after Departments) */}
                    <div className="relative">
                        <select
                            aria-label="Filter by academic year"
                            value={academicYearFilter}
                            onChange={(event) => {
                                setAcademicYearFilter(event.target.value);
                                setCourseFilter("ALL");
                            }}
                            className={selectClass}
                        >
                            <option value="ALL">All academic years</option>
                            {tableAcademicYears.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Courses (comes after Academic Year) */}
                    <div className="relative">
                        <select
                            aria-label="Filter by course"
                            value={courseFilter}
                            onChange={(event) => setCourseFilter(event.target.value)}
                            className={selectClass}
                        >
                            <option value="ALL">All courses</option>
                            {tableCourses.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                    {item.code ? ` (${item.code})` : ""}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Sort specializations"
                            value={sort}
                            onChange={(event) => setSort(event.target.value as SortOption)}
                            className={selectClass}
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    )}
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
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
                                Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => (
                                    <tr key={`loading-${rowIndex}`}>
                                        {Array.from({ length: 8 }).map((_, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-5">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && specializations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <AlertTriangle size={28} className="mx-auto text-rose-400" />
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load specializations
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
                            ) : visibleSpecializations.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleSpecializations.map((item, index) => {
                                        const canUpdate = hasPermission(item, "UPDATE");
                                        const canDelete = hasPermission(item, "DELETE");
                                        const initials = item.name
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
                                                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="group hover:bg-cyan-400/[0.035]"
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
                                                                {item.name || "Unnamed Specialization"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                ID: {item.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <span className="inline-flex max-w-[180px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {item.code || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {item.course?.name ?? "—"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {item.department?.name ?? "—"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="max-w-[200px]">
                                                        <p className="truncate font-medium text-slate-200">
                                                            {item.school?.name ?? "—"}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-slate-500">
                                                            {item.university?.name ?? "—"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <StatusBadge status={item.activeStatus} />
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("VIEW", item)}
                                                            aria-label={`View ${item.name}`}
                                                            title="View details"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={17} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("EDIT", item)}
                                                                aria-label={`Edit ${item.name}`}
                                                                title="Edit specialization"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil size={17} />
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("DELETE", item)}
                                                                aria-label={`Delete ${item.name}`}
                                                                title="Delete specialization"
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
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <BookOpen size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching specializations found"
                                                : "No specializations registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : "Specializations will appear here after they are created."}
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
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        {filteredSpecializations.length === 0
                            ? "Showing 0 specializations"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredSpecializations.length
                            )} of ${filteredSpecializations.length} specializations${filteredSpecializations.length !== specializations.length
                                ? ` (filtered from ${specializations.length})`
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
                            .filter((number) =>
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
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
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
            </section>

            <AnimatePresence>
                {dialog && (
                    <SpecializationDialog
                        key={`${dialog.mode}-${dialog.specialization?.id ?? "new"}`}
                        mode={dialog.mode}
                        specialization={dialog.specialization}
                        courses={courses}
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
