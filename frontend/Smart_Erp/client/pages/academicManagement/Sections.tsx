
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
    GraduationCap,
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
    Eye,
    Layers3,
} from "lucide-react";

import {
    createSection,
    deleteSection,
    extractErrorMessage,
    getAllSections,
    getCourseFilter,
    getNumericSectionId,
    getSectionPrefix,
    getSpecializationFilter,
    uniqueCommonDTOs,
    updateSection,
    type ActiveStatus,
    type CommonDTO,
    type PermissionAction,
    type SectionGroupResponse,
    type SectionRequest,
    type SectionResponse,
} from "@/services/academic/sectionService";

/* -------------------------------------------------------------------------- */
/* Constants and types                                                        */
/* -------------------------------------------------------------------------- */

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "CODE_ASC"
    | "CAPACITY_DESC";

const PAGE_SIZE = 5;

interface SectionForm {
    courseId: number | "";
    name: string;
    code: string;
    capacity: string;
    activeStatus: ActiveStatus;
    specializationIds: number[];
}

interface FieldErrors {
    courseId?: string;
    name?: string;
    code?: string;
    capacity?: string;
    specializationIds?: string;
}

interface SectionDialogProps {
    mode: DialogMode;
    section: SectionResponse | null;
    courses: CommonDTO[];
    specializations: CommonDTO[];
    coursesLoading: boolean;
    specializationsLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (courseId: number, request: SectionRequest) => Promise<void>;
    onUpdate: (
        sectionId: number,
        request: SectionRequest
    ) => Promise<void>;
    onDelete: (sectionId: number) => Promise<void>;
}

const EMPTY_FORM: SectionForm = {
    courseId: "",
    name: "",
    code: "",
    capacity: "",
    activeStatus: "ENABLE",
    specializationIds: [],
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function formatNumber(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "—";
    }

    return new Intl.NumberFormat("en-IN").format(value);
}

function getStatusLabel(status: ActiveStatus | null | undefined): string {
    if (status === "ENABLE") return "Active";
    if (status === "DISABLE") return "Inactive";
    return "Unknown";
}

function hasPermission(
    section: SectionResponse,
    action: PermissionAction
): boolean {
    return Array.isArray(section.permissionActions) &&
        section.permissionActions.includes(action);
}

/**
 * The prefix is fixed by the server.
 * Remove it from the displayed editable code if the response contains it.
 */
function removePrefix(
    code: string | null | undefined,
    prefix: string
): string {
    const value = (code ?? "").trim();

    if (prefix && value.startsWith(prefix)) {
        return value.slice(prefix.length).trim();
    }

    return value;
}

function sectionIdNumber(section: SectionResponse): number {
    return getNumericSectionId(section);
}

function getGroupNames(section: SectionResponse): string[] {
    return Array.isArray(section.sectionGroup)
        ? section.sectionGroup
            .map((group) => group.specialization?.name ?? group.name)
            .filter((name): name is string => Boolean(name))
        : [];
}

function getGroupIds(section: SectionResponse): number[] {
    if (!Array.isArray(section.sectionGroup)) return [];

    return Array.from(
        new Set(
            section.sectionGroup
                .map((group) => group.specialization?.id)
                .filter(
                    (id): id is number =>
                        typeof id === "number" &&
                        Number.isFinite(id) &&
                        id > 0
                )
        )
    );
}

function getUniqueDTOsFromSections(
    sections: SectionResponse[],
    selector: (section: SectionResponse) => CommonDTO | null | undefined
): CommonDTO[] {
    return uniqueCommonDTOs(sections.map(selector));
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

function StatusBadge({
    status,
}: {
    status: ActiveStatus | null | undefined;
}) {
    const active = status === "ENABLE";
    const inactive = status === "DISABLE";

    const styles = active
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
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${styles}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {getStatusLabel(status)}
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
/* Section dialog                                                             */
/* -------------------------------------------------------------------------- */

function SectionDialog({
    mode,
    section,
    courses,
    specializations,
    coursesLoading,
    specializationsLoading,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: SectionDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<SectionForm>(() => ({
        courseId:
            section?.course?.id && Number.isFinite(section.course.id)
                ? section.course.id
                : "",
        name: section?.name ?? "",
        code: section?.code ?? "",
        capacity:
            section?.capacity !== null && section?.capacity !== undefined
                ? String(section.capacity)
                : "",
        activeStatus: section?.activeStatus ?? "ENABLE",
        specializationIds: section ? getGroupIds(section) : [],
    }));

    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const selectedCourse = courses.find(
        (course) => course.id === Number(form.courseId)
    );

    const courseName =
        selectedCourse?.name ?? section?.course?.name ?? "—";

    const courseCode =
        selectedCourse?.code ?? section?.course?.code ?? "";

    const availableSpecializations = useMemo(() => {
        const normalizedCourseCode = normalizeText(courseCode);
        if (!normalizedCourseCode) {
            return isCreate ? [] : specializations;
        }

        return specializations.filter((item) => {
            const itemCode = normalizeText(item.code);
            const matchesCode = itemCode.startsWith(normalizedCourseCode);
            const isCurrentlyAssigned = form.specializationIds.includes(item.id);
            return matchesCode || (!isCreate && isCurrentlyAssigned);
        });
    }, [specializations, courseCode, isCreate, form.specializationIds]);

    const totalEnrolledStudents = useMemo(() => {
        if (!section || !Array.isArray(section.sectionGroup)) return 0;
        return section.sectionGroup.reduce(
            (sum, g) => sum + (g.studentCount ?? 0),
            0
        );
    }, [section]);

    useEffect(() => {
        let cancelled = false;

        async function loadPrefix() {
            const courseId = Number(form.courseId);

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
                const result = await getSectionPrefix(
                    courseId,
                    isEdit && section
                        ? Number(section.id)
                        : undefined
                );

                if (cancelled) return;

                setPrefix(result);

                if (isEdit && section) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(section.code, result),
                    }));
                } else if (isCreate) {
                    setForm((current) => ({
                        ...current,
                        code: removePrefix(current.code, result),
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

        if (isCreate || isEdit) {
            void loadPrefix();
        } else {
            setPrefixLoading(false);
        }

        return () => {
            cancelled = true;
        };
        // Prefix depends on the selected course and section.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.courseId, isCreate, isEdit, section?.id]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof SectionForm>(
        key: K,
        value: SectionForm[K]
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
        const capacity = Number(form.capacity);

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
            errors.name = "Section name is required.";
        } else if (name.length < 1) {
            errors.name = "Enter a valid section name.";
        } else if (name.length > 150) {
            errors.name = "Section name cannot exceed 150 characters.";
        }

        if (!prefix) {
            errors.code = "The fixed section prefix could not be loaded.";
        } else if (!code) {
            errors.code = "Section code is required.";
        } else if (code.length > 40) {
            errors.code = "Section code cannot exceed 40 characters.";
        } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
            errors.code =
                "Use only letters, numbers, hyphens, and underscores.";
        }

        if (form.capacity.trim() === "") {
            errors.capacity = "Capacity is required.";
        } else if (!Number.isInteger(capacity) || capacity <= 0) {
            errors.capacity = "Capacity must be a positive whole number.";
        } else if (capacity > 1000000) {
            errors.capacity = "Capacity is too large.";
        }

        if (
            form.specializationIds.some(
                (id) =>
                    !Number.isFinite(id) ||
                    id <= 0 ||
                    !availableSpecializations.some((item) => item.id === id)
            )
        ) {
            errors.specializationIds =
                "One or more selected specializations are no longer valid for this course.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!section) {
                setDialogError("No section was selected for deletion.");
                return;
            }

            try {
                await onDelete(sectionIdNumber(section));
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();

                setDialogError(
                    lower.includes("constraint") ||
                        lower.includes("foreign key") ||
                        lower.includes("cannot delete")
                        ? "This section has related records. Remove or reassign those records before deleting it."
                        : message
                );
            }

            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (coursesLoading || specializationsLoading) {
            setDialogError(
                "Please wait until the required options finish loading."
            );
            return;
        }

        if (prefixLoading) {
            setDialogError("Please wait while the section prefix loads.");
            return;
        }

        if (prefixError) {
            setDialogError(prefixError);
            return;
        }

        if (!validate()) return;

        /*
         * IMPORTANT:
         * Send only the code suffix. Do not send prefix + suffix.
         */
        const request: SectionRequest = {
            name: form.name.trim(),
            code: form.code.trim(),
            capacity: Number(form.capacity),
            activeStatus: form.activeStatus,
            specializationId: [...new Set(form.specializationIds)],
        };

        try {
            if (isCreate) {
                await onCreate(Number(form.courseId), request);
            } else if (isEdit && section) {
                await onUpdate(sectionIdNumber(section), request);
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    const title: Record<DialogMode, string> = {
        CREATE: "Create Section",
        EDIT: "Edit Section",
        VIEW: "Section Details",
        DELETE: "Delete Section",
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
                if (event.target === event.currentTarget && !busy) {
                    onClose();
                }
            }}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="section-dialog-title"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c1530]/95 px-5 py-5 backdrop-blur sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · Academic Administration
                        </p>
                        <h2
                            id="section-dialog-title"
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
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">
                                        Delete this section?
                                    </p>
                                    <p className="mt-1 text-sm text-slate-300">
                                        You are about to delete{" "}
                                        <strong className="text-white">
                                            {section?.name}
                                        </strong>
                                        . This operation may be blocked if
                                        related records exist.
                                    </p>
                                    <p className="mt-2 font-mono text-xs text-cyan-300">
                                        {section?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label
                                    htmlFor="section-course"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Course {isCreate && <span className="text-cyan-400">*</span>}
                                </label>

                                {isCreate ? (
                                    <>
                                        <div className="relative">
                                            <select
                                                id="section-course"
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
                                                disabled={busy || coursesLoading || courses.length === 0}
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

                                        {coursesLoading && (
                                            <p className="mt-2 text-xs text-slate-400">
                                                Loading courses...
                                            </p>
                                        )}

                                        {!coursesLoading && courses.length === 0 && (
                                            <p className="mt-2 text-xs text-amber-300">
                                                No courses are available. Section creation is unavailable.
                                            </p>
                                        )}

                                        <FieldError>{fieldErrors.courseId}</FieldError>
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                                        <p className="font-medium text-white">{courseName}</p>
                                        {courseCode && (
                                            <p className="mt-1 font-mono text-xs text-cyan-300">
                                                {courseCode}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="section-name"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Section Name <span className="text-cyan-400">*</span>
                                </label>
                                <input
                                    id="section-name"
                                    value={form.name}
                                    onChange={(event) => changeField("name", event.target.value)}
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Section A"
                                    className={`${inputClass} ${fieldErrors.name ? "border-rose-500/60" : ""}`}
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            <div>
                                <label
                                    htmlFor="section-code"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Section Code <span className="text-cyan-400">*</span>
                                </label>
                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[55%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading ? "Loading…" : prefix || "PREFIX"}
                                        </span>
                                    </div>
                                    <input
                                        id="section-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField("code", event.target.value.toUpperCase())
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="A"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>
                                <FieldError>{fieldErrors.code || prefixError}</FieldError>
                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    The prefix is fixed by the server. Only the suffix is entered and sent to the API.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="section-capacity"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Capacity <span className="text-cyan-400">*</span>
                                </label>
                                <input
                                    id="section-capacity"
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={form.capacity}
                                    onChange={(event) => changeField("capacity", event.target.value)}
                                    readOnly={readOnly || busy}
                                    placeholder="e.g. 60"
                                    className={`${inputClass} ${fieldErrors.capacity ? "border-rose-500/60" : ""}`}
                                />
                                <FieldError>{fieldErrors.capacity}</FieldError>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label className="text-sm font-medium text-slate-300">
                                        Specializations
                                    </label>
                                    <span className="text-xs text-slate-500">
                                        Multiple selection allowed
                                    </span>
                                </div>

                                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 p-3">
                                    {specializationsLoading ? (
                                        <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
                                            <LoaderCircle size={15} className="animate-spin" />
                                            Loading specializations...
                                        </div>
                                    ) : isCreate && !form.courseId ? (
                                        <p className="py-2 text-sm text-slate-400">
                                            Please select a course first to view matching specializations.
                                        </p>
                                    ) : availableSpecializations.length === 0 ? (
                                        <p className="py-2 text-sm text-slate-400">
                                            {courseCode
                                                ? `No specializations starting with code "${courseCode}" found.`
                                                : "No specializations available for this course."}
                                        </p>
                                    ) : (
                                        availableSpecializations.map((specialization) => {
                                            const checked = form.specializationIds.includes(specialization.id);

                                            return (
                                                <label
                                                    key={specialization.id}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${checked
                                                        ? "border-cyan-400/30 bg-cyan-400/10"
                                                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                                                        } ${readOnly || busy ? "cursor-default opacity-70" : ""}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={readOnly || busy}
                                                        onChange={() => toggleSpecialization(specialization.id)}
                                                        className="h-4 w-4 accent-cyan-400"
                                                    />
                                                    <span className="min-w-0 flex-1 text-sm text-slate-200">
                                                        {specialization.name}
                                                    </span>
                                                    {specialization.code && (
                                                        <span className="font-mono text-xs text-slate-500">
                                                            {specialization.code}
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                                <FieldError>{fieldErrors.specializationIds}</FieldError>
                                {form.specializationIds.length > 0 && (
                                    <p className="mt-2 text-xs text-cyan-300">
                                        {form.specializationIds.length} specialization(s) selected
                                    </p>
                                )}
                            </div>

                            {!isCreate && (
                                <div>
                                    <label
                                        htmlFor="section-status"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Active Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="section-status"
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

                            {isView && section && (
                                <div className="space-y-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Section Information
                                    </p>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {[
                                            ["Section ID", section.id],
                                            ["Capacity", formatNumber(section.capacity)],
                                            ["University", section.university?.name ?? "—"],
                                            ["School", section.school?.name ?? "—"],
                                            ["Department", section.department?.name ?? "—"],
                                            ["Academic Year", section.academicYear?.name ?? "—"],
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

                                    {/* Section Groups */}
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Layers3 size={16} className="text-cyan-400" />
                                                <h3 className="text-sm font-semibold text-white">
                                                    Section Groups
                                                </h3>
                                                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                                                    {section.sectionGroup?.length ?? 0}
                                                </span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                                                <Users size={13} className="text-cyan-400" />
                                                <span className="font-semibold text-white">
                                                    {totalEnrolledStudents}
                                                </span>
                                                <span className="text-slate-400">
                                                    / {formatNumber(section.capacity)} students
                                                </span>
                                            </div>
                                        </div>

                                        {Array.isArray(section.sectionGroup) && section.sectionGroup.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                                {section.sectionGroup.map((group) => (
                                                    <div
                                                        key={group.id}
                                                        className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-cyan-400/30 hover:bg-white/[0.05]"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <p className="truncate font-semibold text-white">
                                                                    {group.name}
                                                                </p>
                                                                {group.code && (
                                                                    <p className="mt-0.5 font-mono text-xs text-cyan-300">
                                                                        {group.code}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {typeof group.studentCount === "number" && (
                                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300">
                                                                    <Users size={12} />
                                                                    {group.studentCount}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                                                            <span className="text-slate-500">Specialization:</span>
                                                            <span className="max-w-[170px] truncate font-medium text-slate-300">
                                                                {group.specialization?.name ?? "General / Unassigned"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-400">
                                                No section groups are associated with this section.
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="mb-2 text-xs text-slate-500">
                                            Available permissions
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {section.permissionActions?.length ? (
                                                section.permissionActions.map((action) => (
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
                                    (isCreate && (coursesLoading || courses.length === 0)) ||
                                    specializationsLoading
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${isDelete
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
                                                ? "Create Section"
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
/* Main Sections page                                                         */
/* -------------------------------------------------------------------------- */

export default function Sections() {
    const reduceMotion = useReducedMotion();

    const [sections, setSections] = useState<SectionResponse[]>([]);
    const [courses, setCourses] = useState<CommonDTO[]>([]);
    const [specializations, setSpecializations] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [courseOptionsError, setCourseOptionsError] = useState("");
    const [specializationOptionsError, setSpecializationOptionsError] = useState("");
    const [notice, setNotice] = useState("");

    /* All table filters are applied locally to loaded sections. */
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
        section: SectionResponse | null;
    } | null>(null);

    /* ---------------------------------------------------------------------- */
    /* Load table data                                                        */
    /* ---------------------------------------------------------------------- */

    const loadData = useCallback(async (background = false) => {
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError("");

        try {
            const result = await getAllSections();
            setSections(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load sections: ${message}`);
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
    /* Load options for create/update forms                                   */
    /* ---------------------------------------------------------------------- */

    const loadFormOptions = useCallback(async () => {
        setCourseOptionsError("");
        setSpecializationOptionsError("");

        const results = await Promise.allSettled([
            getCourseFilter(),
            getSpecializationFilter(),
        ]);

        const courseResult = results[0];
        const specializationResult = results[1];

        if (courseResult.status === "fulfilled") {
            setCourses(uniqueCommonDTOs(courseResult.value));
        } else {
            const message = extractErrorMessage(courseResult.reason);
            setCourseOptionsError(message);
            toast.error(`Could not load course options: ${message}`);
        }

        if (specializationResult.status === "fulfilled") {
            setSpecializations(uniqueCommonDTOs(specializationResult.value));
        } else {
            const message = extractErrorMessage(specializationResult.reason);
            setSpecializationOptionsError(message);
            toast.error(`Could not load specialization options: ${message}`);
        }
    }, []);

    useEffect(() => {
        void loadFormOptions();
    }, [loadFormOptions]);

    /* ---------------------------------------------------------------------- */
    /* Hierarchy options derived from the loaded sections                      */
    /* No API calls are made when table filters change.                       */
    /* ---------------------------------------------------------------------- */

    const tableUniversities = useMemo(
        () => getUniqueDTOsFromSections(sections, (item) => item.university),
        [sections]
    );

    const tableSchools = useMemo(
        () =>
            uniqueCommonDTOs(
                sections
                    .filter(
                        (item) =>
                            universityFilter === "ALL" ||
                            item.university?.id === Number(universityFilter)
                    )
                    .map((item) => item.school)
            ),
        [sections, universityFilter]
    );

    const tableDepartments = useMemo(
        () =>
            uniqueCommonDTOs(
                sections
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
        [sections, universityFilter, schoolFilter]
    );

    const tableAcademicYears = useMemo(
        () =>
            uniqueCommonDTOs(
                sections
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
        [sections, universityFilter, schoolFilter, departmentFilter]
    );

    const tableCourses = useMemo(
        () =>
            uniqueCommonDTOs(
                sections
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
            sections,
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

    /* ---------------------------------------------------------------------- */
    /* Statistics                                                             */
    /* ---------------------------------------------------------------------- */

    const stats = useMemo(() => {
        const active = sections.filter(
            (item) => item.activeStatus === "ENABLE"
        ).length;

        const inactive = sections.filter(
            (item) => item.activeStatus === "DISABLE"
        ).length;

        const totalCapacity = sections.reduce(
            (sum, item) => sum + (item.capacity ?? 0),
            0
        );

        const students = sections.reduce(
            (sum, item) =>
                sum +
                (Array.isArray(item.sectionGroup)
                    ? item.sectionGroup.reduce(
                        (groupSum, group) =>
                            groupSum + (group.studentCount ?? 0),
                        0
                    )
                    : 0),
            0
        );

        return [
            {
                label: "Total Sections",
                value: formatNumber(sections.length),
                icon: Layers3,
                tone: "cyan",
            },
            {
                label: "Active Sections",
                value: formatNumber(active),
                icon: ShieldCheck,
                tone: "green",
            },
            {
                label: "Total Capacity",
                value: formatNumber(totalCapacity),
                icon: Users,
                tone: "purple",
            },
            {
                label: "Students Assigned",
                value: formatNumber(students),
                icon: GraduationCap,
                tone: "blue",
            },
            {
                label: "Inactive Sections",
                value: formatNumber(inactive),
                icon: BookOpen,
                tone: "amber",
            },
        ];
    }, [sections]);

    /* ---------------------------------------------------------------------- */
    /* Local search, filters, and sorting                                     */
    /* ---------------------------------------------------------------------- */

    const filteredSections = useMemo(() => {
        const query = normalizeText(search);

        const result = sections.filter((section) => {
            const matchesSearch =
                !query ||
                normalizeText(section.name).includes(query) ||
                normalizeText(section.code).includes(query) ||
                normalizeText(section.id).includes(query) ||
                (Array.isArray(section.sectionGroup) &&
                    section.sectionGroup.some(
                        (g) =>
                            normalizeText(g.name).includes(query) ||
                            normalizeText(g.code).includes(query) ||
                            normalizeText(g.specialization?.name).includes(query)
                    ));

            const matchesStatus =
                statusFilter === "ALL" ||
                section.activeStatus === statusFilter;

            const matchesUniversity =
                universityFilter === "ALL" ||
                section.university?.id === Number(universityFilter);

            const matchesSchool =
                schoolFilter === "ALL" ||
                section.school?.id === Number(schoolFilter);

            const matchesDepartment =
                departmentFilter === "ALL" ||
                section.department?.id === Number(departmentFilter);

            const matchesAcademicYear =
                academicYearFilter === "ALL" ||
                section.academicYear?.id === Number(academicYearFilter);

            const matchesCourse =
                courseFilter === "ALL" ||
                section.course?.id === Number(courseFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment &&
                matchesAcademicYear &&
                matchesCourse
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

            if (sort === "CAPACITY_DESC") {
                return (b.capacity ?? 0) - (a.capacity ?? 0);
            }

            return Number(b.id) - Number(a.id);
        });

        return result;
    }, [
        sections,
        search,
        statusFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
        academicYearFilter,
        courseFilter,
        sort,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSections.length / PAGE_SIZE)
    );

    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const visibleSections = filteredSections.slice(
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

    /* ---------------------------------------------------------------------- */
    /* Dialog and CRUD handlers                                               */
    /* ---------------------------------------------------------------------- */

    async function openCreateDialog() {
        setPageError("");
        setNotice("");

        try {
            await loadFormOptions();

            setDialog({
                mode: "CREATE",
                section: null,
            });
        } catch (error) {
            toast.error(extractErrorMessage(error));
        }
    }

    function openDialog(
        mode: DialogMode,
        section: SectionResponse | null = null
    ) {
        setPageError("");
        setNotice("");
        setDialog({ mode, section });
    }

    async function handleCreate(
        courseId: number,
        request: SectionRequest
    ) {
        setBusy(true);

        try {
            await createSection(courseId, request);
            setDialog(null);
            setNotice("Section created successfully.");
            toast.success(`Section "${request.name}" created successfully.`);
            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not create section: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(
        sectionId: number,
        request: SectionRequest
    ) {
        setBusy(true);

        try {
            await updateSection(sectionId, request);
            setDialog(null);
            setNotice("Section updated successfully.");
            toast.success("Section updated successfully.");
            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not update section: ${message}`);
            throw error;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(sectionId: number) {
        setBusy(true);

        try {
            const message = await deleteSection(sectionId);
            setDialog(null);
            setNotice(message || "Section deleted successfully.");
            toast.success(message || "Section deleted successfully.");
            await loadData(true);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error(`Could not delete section: ${message}`);
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
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Academic Management</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Sections</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Section Management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage sections, capacities, specializations, and academic hierarchy using your assigned permissions.
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
                            title="Refresh sections"
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Add Section
                        </button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        title="Could not load sections"
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

            <section
                aria-label="Section statistics"
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

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                {/* Local filters */}
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 xl:grid-cols-3 2xl:grid-cols-[minmax(220px,1.5fr)_160px_repeat(6,minmax(135px,1fr))_auto]">
                    <div className="relative min-w-0">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search sections by name or code"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, code, ID..."
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
                            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ENABLE">Active</option>
                            <option value="DISABLE">Inactive</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {[
                        {
                            label: "University",
                            value: universityFilter,
                            onChange: (value: string) => {
                                setUniversityFilter(value);
                                setSchoolFilter("ALL");
                                setDepartmentFilter("ALL");
                                setAcademicYearFilter("ALL");
                                setCourseFilter("ALL");
                            },
                            options: tableUniversities,
                            allLabel: "All universities",
                        },
                        {
                            label: "School",
                            value: schoolFilter,
                            onChange: (value: string) => {
                                setSchoolFilter(value);
                                setDepartmentFilter("ALL");
                                setAcademicYearFilter("ALL");
                                setCourseFilter("ALL");
                            },
                            options: tableSchools,
                            allLabel: "All schools",
                        },
                        {
                            label: "Department",
                            value: departmentFilter,
                            onChange: (value: string) => {
                                setDepartmentFilter(value);
                                setAcademicYearFilter("ALL");
                                setCourseFilter("ALL");
                            },
                            options: tableDepartments,
                            allLabel: "All departments",
                        },
                        {
                            label: "Academic year",
                            value: academicYearFilter,
                            onChange: (value: string) => {
                                setAcademicYearFilter(value);
                                setCourseFilter("ALL");
                            },
                            options: tableAcademicYears,
                            allLabel: "All academic years",
                        },
                        {
                            label: "Course",
                            value: courseFilter,
                            onChange: (value: string) => {
                                setCourseFilter(value);
                            },
                            options: tableCourses,
                            allLabel: "All courses",
                        },
                    ].map((filter) => (
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
                            aria-label="Sort sections"
                            value={sort}
                            onChange={(event) => setSort(event.target.value as SortOption)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="NEWEST">Highest ID first</option>
                            <option value="NAME_ASC">Name: A to Z</option>
                            <option value="NAME_DESC">Name: Z to A</option>
                            <option value="CODE_ASC">Code: A to Z</option>
                            <option value="CAPACITY_DESC">Capacity: High to low</option>
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
                                <th className="px-4 py-4 font-medium">Section</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Course</th>
                                <th className="px-4 py-4 font-medium">Academic Year</th>
                                <th className="px-4 py-4 font-medium">Department</th>
                                <th className="px-4 py-4 font-medium">Section Groups</th>
                                <th className="px-4 py-4 font-medium">Capacity</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => (
                                    <tr key={`loading-${rowIndex}`}>
                                        {Array.from({ length: 10 }).map((__, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-5">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && sections.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center">
                                        <AlertTriangle className="mx-auto text-rose-400" size={28} />
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load sections
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
                            ) : visibleSections.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleSections.map((section, index) => {
                                        const initials =
                                            (section.name || "SC")
                                                .trim()
                                                .split(/\s+/)
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase() || "SC";

                                        const canUpdate = hasPermission(section, "UPDATE");
                                        const canDelete = hasPermission(section, "DELETE");

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={section.id}
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
                                                                {section.name || "Unnamed Section"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                ID: {section.id || "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <span className="inline-flex max-w-[180px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {section.code || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="max-w-[180px] truncate font-medium text-slate-200">
                                                        {section.course?.name || "—"}
                                                    </p>
                                                    {section.course?.code && (
                                                        <p className="mt-1 font-mono text-xs text-slate-500">
                                                            {section.course.code}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5 text-slate-300">
                                                    {section.academicYear?.name || "—"}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="max-w-[180px]">
                                                        <p className="truncate font-medium text-slate-200">
                                                            {section.department?.name || "—"}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-slate-500">
                                                            {section.school?.name || "No school"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    {Array.isArray(section.sectionGroup) && section.sectionGroup.length > 0 ? (
                                                        <div className="flex max-w-[280px] flex-col gap-1.5">
                                                            {section.sectionGroup.slice(0, 2).map((group) => (
                                                                <div
                                                                    key={group.id}
                                                                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs transition hover:border-cyan-400/30"
                                                                >
                                                                    <div className="min-w-0 flex-1 truncate">
                                                                        <div className="flex items-center gap-1.5 truncate">
                                                                            <span className="font-semibold text-slate-200 truncate">
                                                                                {group.name}
                                                                            </span>
                                                                            {group.code && (
                                                                                <span className="font-mono text-[10px] text-cyan-300">
                                                                                    [{group.code}]
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {group.specialization?.name && (
                                                                            <p className="truncate text-[11px] text-slate-400">
                                                                                {group.specialization.name}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {typeof group.studentCount === "number" && (
                                                                        <span
                                                                            title={`${group.studentCount} students enrolled`}
                                                                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[11px] font-semibold text-cyan-300"
                                                                        >
                                                                            <Users size={11} />
                                                                            {group.studentCount}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {section.sectionGroup.length > 2 && (
                                                                <span
                                                                    title={section.sectionGroup
                                                                        .slice(2)
                                                                        .map(
                                                                            (g) =>
                                                                                `${g.name}${g.code ? ` [${g.code}]` : ""}${g.specialization?.name ? ` (${g.specialization.name})` : ""}${typeof g.studentCount === "number" ? ` — ${g.studentCount} students` : ""}`
                                                                        )
                                                                        .join("\n")}
                                                                    className="cursor-pointer text-[11px] font-medium text-cyan-400 hover:text-cyan-300"
                                                                >
                                                                    +{section.sectionGroup.length - 2} more group{section.sectionGroup.length - 2 > 1 ? "s" : ""}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">No groups</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5 font-medium tabular-nums text-slate-200">
                                                    {formatNumber(section.capacity)}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <StatusBadge status={section.activeStatus} />
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("VIEW", section)}
                                                            aria-label={`View ${section.name}`}
                                                            title="View details"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={17} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("EDIT", section)}
                                                                aria-label={`Edit ${section.name}`}
                                                                title="Edit section"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil size={17} />
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDialog("DELETE", section)}
                                                                aria-label={`Delete ${section.name}`}
                                                                title="Delete section"
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
                                    <td colSpan={10} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Layers3 size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching sections found"
                                                : "No sections registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : "Sections will appear here after they are created."}
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
                                        {!hasActiveFilters && !loading && sections.length === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => void openCreateDialog()}
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110"
                                            >
                                                <Plus size={15} />
                                                Add Section
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
                        {filteredSections.length === 0
                            ? "Showing 0 sections"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredSections.length
                            )} of ${filteredSections.length} sections${hasActiveFilters && filteredSections.length !== sections.length
                                ? ` (filtered from ${sections.length})`
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
            </div>

            <AnimatePresence>
                {dialog && (
                    <SectionDialog
                        key={`${dialog.mode}-${dialog.section?.id ?? "new"}`}
                        mode={dialog.mode}
                        section={dialog.section}
                        courses={courses}
                        specializations={specializations}
                        coursesLoading={false}
                        specializationsLoading={false}
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
