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
    Hash,
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
    createSection,
    deleteSection,
    extractErrorMessage,
    formatAuditActor,
    formatDate,
    formatDateTime,
    getAllSections,
    getCourseFilter,
    getEligibleSectionGroups,
    getInitials,
    getSectionAcademicYearFilter,
    getSectionPrefix,
    getSectionSpecializationFilter,
    getSpecializationFilter,
    removePrefix,
    uniqueCommonDTOs,
    updateSection,
    type ActiveStatus,
    type EligibleSectionGroupItem,
    type CommonDTO,
    type PermissionAction,
    type SectionRequest,
    type SectionResponse,
} from "@/services/academic/sectionService";

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | ActiveStatus;
type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "CODE_ASC"
    | "CODE_DESC"
    | "CAPACITY_DESC"
    | "CAPACITY_ASC";

interface SectionForm {
    courseId: number | "";
    academicYearId: number | "";
    name: string;
    code: string; // Suffix only
    capacity: string;
    activeStatus: ActiveStatus;
    specializationIds: number[];
}

interface FieldErrors {
    courseId?: string;
    academicYearId?: string;
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
    busy: boolean;
    onClose: () => void;
    onCreate: (courseId: number, academicYearId: number, request: SectionRequest) => Promise<void>;
    onUpdate: (sectionId: number, request: SectionRequest) => Promise<void>;
    onDelete: (sectionId: number) => Promise<void>;
}

const EMPTY_FORM: SectionForm = {
    courseId: "",
    academicYearId: "",
    name: "",
    code: "",
    capacity: "60",
    activeStatus: "ENABLE",
    specializationIds: [],
};

/* -------------------------------------------------------------------------- */
/* Helpers & Visual Components                                                */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function formatNumber(value: number | null | undefined): string {
    return typeof value === "number" && Number.isFinite(value)
        ? new Intl.NumberFormat("en-IN").format(value)
        : "0";
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
    return (
        Array.isArray(section.permissionActions) &&
        section.permissionActions.includes(action)
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

function SectionDialog({
    mode,
    section,
    courses,
    specializations,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: SectionDialogProps) {
    const reduceMotion = useReducedMotion();
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<SectionForm>(() => {
        if (!section) return EMPTY_FORM;

        const specIds = Array.isArray(section.sectionGroup)
            ? section.sectionGroup
                  .map((g) => g.specialization?.id)
                  .filter((id): id is number => typeof id === "number" && id > 0)
            : [];

        return {
            courseId: section.course?.id ?? "",
            academicYearId: section.academicYear?.id ?? "",
            name: section.name ?? "",
            code: section.code ?? "",
            capacity: section.capacity != null ? String(section.capacity) : "60",
            activeStatus: section.activeStatus ?? "ENABLE",
            specializationIds: specIds,
        };
    });

    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Academic Year options loaded dynamically when course is selected (for CREATE)
    const [academicYears, setAcademicYears] = useState<CommonDTO[]>([]);
    const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);

    // Dynamic Prefix state
    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");

    // Eligible specializations for (courseId, academicYearId) that have a valid mapped FeeStructure
    const [feeMappedSpecializations, setFeeMappedSpecializations] = useState<CommonDTO[]>([]);
    const [loadingSpecializations, setLoadingSpecializations] = useState(false);

    // Calculate total students enrolled in this section
    const totalEnrolledStudents = useMemo(() => {
        if (!section || !Array.isArray(section.sectionGroup)) return 0;
        return section.sectionGroup.reduce(
            (sum, g) => sum + (g.studentCount ?? 0),
            0
        );
    }, [section]);

    // Handle ESC key
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    // In CREATE mode: when course changes, fetch academic years for that course
    useEffect(() => {
        if (!isCreate) return;
        const cId = Number(form.courseId);
        if (!Number.isFinite(cId) || cId <= 0) {
            setAcademicYears([]);
            return;
        }

        let cancelled = false;
        setLoadingAcademicYears(true);
        getSectionAcademicYearFilter(cId)
            .then((list) => {
                if (!cancelled) {
                    setAcademicYears(list);
                    // If current academicYearId is not in the list, reset or auto-pick first
                    if (list.length === 1) {
                        setForm((prev) => ({ ...prev, academicYearId: list[0].id }));
                    } else if (!list.some((y) => y.id === Number(form.academicYearId))) {
                        setForm((prev) => ({ ...prev, academicYearId: "" }));
                    }
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setAcademicYears([]);
                    setDialogError(extractErrorMessage(err, "Failed to load academic years for selected course."));
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingAcademicYears(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isCreate, form.courseId]);

    // Load prefix whenever Course and Academic Year are both selected
    useEffect(() => {
        let cancelled = false;
        const cId = Number(form.courseId);
        const aId = Number(form.academicYearId);

        if (!Number.isFinite(cId) || cId <= 0 || !Number.isFinite(aId) || aId <= 0) {
            setPrefix("");
            setPrefixError("");
            setPrefixLoading(false);
            return;
        }

        setPrefixLoading(true);
        setPrefixError("");

        getSectionPrefix(aId, cId, isEdit && section ? section.id : undefined)
            .then((fetchedPrefix) => {
                if (!cancelled) {
                    setPrefix(fetchedPrefix);
                    if (isEdit && section) {
                        setForm((prev) => ({
                            ...prev,
                            code: removePrefix(section.code, fetchedPrefix),
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
                    setPrefixError(extractErrorMessage(err, "Unable to resolve section prefix."));
                }
            })
            .finally(() => {
                if (!cancelled) setPrefixLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [form.courseId, form.academicYearId, isCreate, isEdit, section]);

    // Load specializations with a mapped FeeStructure for the selected (courseId, academicYearId)
    useEffect(() => {
        const cId = Number(form.courseId);
        const aId = Number(form.academicYearId);
        if (!Number.isFinite(cId) || cId <= 0 || !Number.isFinite(aId) || aId <= 0) {
            setFeeMappedSpecializations([]);
            setLoadingSpecializations(false);
            return;
        }
        let cancelled = false;
        setLoadingSpecializations(true);
        getSectionSpecializationFilter(cId, aId)
            .then((list) => {
                if (cancelled) return;
                setFeeMappedSpecializations(list);
                if (isCreate) {
                    const allowed = new Set(list.map((s) => s.id));
                    setForm((prev) => ({
                        ...prev,
                        specializationIds: prev.specializationIds.filter((id) => allowed.has(id)),
                    }));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setFeeMappedSpecializations([]);
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingSpecializations(false);
            });

        return () => {
            cancelled = true;
        };
    }, [form.courseId, form.academicYearId, isCreate]);

    // In VIEW mode, extract prefix and suffix from code if available
    const viewCodeDecomposition = useMemo(() => {
        if (!isView || !section) return null;
        const fullCode = section.code || "";
        const cCode = section.course?.code ?? "";
        const yCode = section.academicYear?.code ?? "";
        const uCode = section.university?.code ?? "";

        let estimatedPrefix = "";
        if (yCode && cCode) {
            const cleanYear = uCode ? yCode.replace(uCode, "") : yCode;
            estimatedPrefix = `${cleanYear}-${cCode}`;
        }

        const suffix = estimatedPrefix && fullCode.startsWith(estimatedPrefix)
            ? fullCode.slice(estimatedPrefix.length)
            : fullCode;

        return {
            fullCode,
            prefix: estimatedPrefix || "—",
            suffix: suffix || "—",
        };
    }, [isView, section]);

    // Available specializations filtered sequentially by mapped fee structure in selected course + academic year
    const availableSpecializations = useMemo(() => {
        if (feeMappedSpecializations.length > 0) {
            if (isCreate) return feeMappedSpecializations;
            const assignedSpecs = (section?.sectionGroup ?? [])
                .map((g) => g.specialization)
                .filter((spec): spec is CommonDTO => Boolean(spec));
            return uniqueCommonDTOs([...feeMappedSpecializations, ...assignedSpecs]);
        }
        if (isEdit && section?.sectionGroup) {
            return uniqueCommonDTOs(section.sectionGroup.map((g) => g.specialization));
        }
        return [];
    }, [feeMappedSpecializations, isCreate, isEdit, section]);

    // Resulting full code preview
    const fullCodePreview = useMemo(() => {
        const cleanSuffix = form.code.trim().toUpperCase();
        if (!prefix && !cleanSuffix) return "—";
        return `${prefix || ""}${cleanSuffix}`;
    }, [prefix, form.code]);

    function toggleSpecialization(specId: number) {
        if (readOnly || busy) return;
        setForm((prev) => {
            const exists = prev.specializationIds.includes(specId);
            const updated = exists
                ? prev.specializationIds.filter((id) => id !== specId)
                : [...prev.specializationIds, specId];
            return { ...prev, specializationIds: updated };
        });
        if (fieldErrors.specializationIds) {
            setFieldErrors((prev) => ({ ...prev, specializationIds: undefined }));
        }
        setDialogError("");
    }

    function validate(): boolean {
        const errors: FieldErrors = {};
        const cId = Number(form.courseId);
        const aId = Number(form.academicYearId);
        const cap = Number(form.capacity);

        if (isCreate) {
            if (!form.courseId || !Number.isFinite(cId) || cId <= 0) {
                errors.courseId = "Please select a course.";
            }
            if (!form.academicYearId || !Number.isFinite(aId) || aId <= 0) {
                errors.academicYearId = "Please select an academic year.";
            }
        }

        if (!form.name.trim()) {
            errors.name = "Section name is required (e.g. Section A).";
        } else if (form.name.trim().length > 150) {
            errors.name = "Section name cannot exceed 150 characters.";
        }

        if (!form.code.trim()) {
            errors.code = "Section suffix code is required (e.g. A or 01).";
        } else if (form.code.trim().length > 30) {
            errors.code = "Section code cannot exceed 30 characters.";
        }

        if (!form.capacity.trim() || !Number.isFinite(cap) || cap <= 0) {
            errors.capacity = "Capacity must be a positive number greater than 0.";
        } else if (isEdit && totalEnrolledStudents > cap) {
            errors.capacity = `Capacity cannot be lower than the ${totalEnrolledStudents} currently enrolled students.`;
        }

        if (form.specializationIds.length === 0) {
            errors.specializationIds = "Please associate at least one specialization group.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setDialogError("");

        if (isDelete && section) {
            if (totalEnrolledStudents > 0) {
                setDialogError(
                    `Cannot delete this section because it carries ${totalEnrolledStudents} enrolled students. Unassign students before deletion.`
                );
                return;
            }
            try {
                await onDelete(section.id);
            } catch (err) {
                setDialogError(extractErrorMessage(err, "Failed to delete section."));
            }
            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (!validate()) return;

        const requestBody: SectionRequest = {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            capacity: Number(form.capacity),
            activeStatus: form.activeStatus,
            specializationId: form.specializationIds,
        };

        try {
            if (isCreate) {
                await onCreate(
                    Number(form.courseId),
                    Number(form.academicYearId),
                    requestBody
                );
            } else if (isEdit && section) {
                await onUpdate(section.id, requestBody);
            }
        } catch (err) {
            setDialogError(extractErrorMessage(err));
        }
    }

    const titleMap: Record<DialogMode, string> = {
        CREATE: "Create Section",
        EDIT: `Edit Section · ${section?.name ?? ""}`,
        VIEW: `Section Details · ${section?.name ?? ""}`,
        DELETE: `Delete Section · ${section?.name ?? ""}`,
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
                aria-labelledby="section-dialog-title"
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
                            Academic Management · Class Cohorts
                        </p>
                        <h2
                            id="section-dialog-title"
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
                        {/* In-Dialog Error Banner */}
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
                                            Confirm Section Deletion
                                        </p>
                                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                            Are you sure you want to permanently delete section{" "}
                                            <strong className="text-white">{section?.name}</strong>{" "}
                                            (<span className="font-mono text-cyan-300">{section?.code}</span>)?
                                        </p>
                                    </div>
                                </div>

                                {totalEnrolledStudents > 0 ? (
                                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed">
                                        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
                                        <div>
                                            <p className="font-semibold text-amber-300">Enrolled Students Restriction</p>
                                            <p className="mt-0.5 text-amber-200/90">
                                                This section currently carries{" "}
                                                <strong className="text-white">{formatNumber(totalEnrolledStudents)} active student enrollments</strong> across its specialization groups.
                                                The server strictly forbids deleting sections that carry students. Please re-assign or unenroll students before proceeding.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 text-xs text-slate-400 space-y-1">
                                        <p className="font-semibold text-slate-300">Associated Section Groups:</p>
                                        <p>
                                            Deleting this section will also permanently purge all associated specialization group structures and timetable references.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CREATE / EDIT / VIEW MODES */}
                        {!isDelete && (
                            <>
                                {/* Course & Academic Year Selection (CREATE) or Read-Only Card (EDIT/VIEW) */}
                                {isCreate ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Course Selector */}
                                        <div>
                                            <label
                                                htmlFor="section-course"
                                                className="block text-xs font-semibold text-slate-300 mb-1"
                                            >
                                                Parent Course <span className="text-cyan-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="section-course"
                                                    value={form.courseId}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? Number(e.target.value) : "";
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            courseId: val,
                                                            academicYearId: "", // reset academic year when course changes
                                                        }));
                                                        if (fieldErrors.courseId) {
                                                            setFieldErrors((prev) => ({ ...prev, courseId: undefined }));
                                                        }
                                                        setDialogError("");
                                                    }}
                                                    disabled={busy}
                                                    className={`w-full appearance-none rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition ${
                                                        fieldErrors.courseId
                                                            ? "border-rose-500/60 focus:border-rose-400"
                                                            : "border-white/10 focus:border-cyan-400/60"
                                                    }`}
                                                >
                                                    <option value="" className="bg-slate-900 text-slate-400">
                                                        Select course...
                                                    </option>
                                                    {courses.map((course) => (
                                                        <option
                                                            key={course.id}
                                                            value={course.id}
                                                            className="bg-slate-900 text-white"
                                                        >
                                                            {course.name} ({course.code || `ID #${course.id}`})
                                                        </option>
                                                    ))}
                                                </select>
                                                <SelectChevron />
                                            </div>
                                            <FieldError>{fieldErrors.courseId}</FieldError>
                                        </div>

                                        {/* Academic Year Selector */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label
                                                    htmlFor="section-academic-year"
                                                    className="block text-xs font-semibold text-slate-300"
                                                >
                                                    Academic Year <span className="text-cyan-400">*</span>
                                                </label>
                                                {loadingAcademicYears && (
                                                    <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                                                        <LoaderCircle size={11} className="animate-spin" /> Loading...
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <select
                                                    id="section-academic-year"
                                                    value={form.academicYearId}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? Number(e.target.value) : "";
                                                        setForm((prev) => ({ ...prev, academicYearId: val }));
                                                        if (fieldErrors.academicYearId) {
                                                            setFieldErrors((prev) => ({ ...prev, academicYearId: undefined }));
                                                        }
                                                        setDialogError("");
                                                    }}
                                                    disabled={busy || !form.courseId || loadingAcademicYears}
                                                    className={`w-full appearance-none rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition disabled:opacity-50 ${
                                                        fieldErrors.academicYearId
                                                            ? "border-rose-500/60 focus:border-rose-400"
                                                            : "border-white/10 focus:border-cyan-400/60"
                                                    }`}
                                                >
                                                    <option value="" className="bg-slate-900 text-slate-400">
                                                        {!form.courseId
                                                            ? "Select course first..."
                                                            : academicYears.length === 0
                                                                ? "No academic years available"
                                                                : "Select academic year..."}
                                                    </option>
                                                    {academicYears.map((ay) => (
                                                        <option
                                                            key={ay.id}
                                                            value={ay.id}
                                                            className="bg-slate-900 text-white"
                                                        >
                                                            {ay.name} ({ay.code || `ID #${ay.id}`})
                                                        </option>
                                                    ))}
                                                </select>
                                                <SelectChevron />
                                            </div>
                                            <FieldError>{fieldErrors.academicYearId}</FieldError>
                                        </div>
                                    </div>
                                ) : (
                                    /* Read-only hierarchy display for EDIT / VIEW */
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Institutional Hierarchy Context
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">Course</p>
                                                <p className="font-semibold text-white truncate mt-0.5">
                                                    {section?.course?.name || "—"}
                                                </p>
                                                <p className="text-[10px] text-cyan-300 font-mono">
                                                    {section?.course?.code || `ID #${section?.course?.id || ""}`}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">Academic Year</p>
                                                <p className="font-semibold text-white truncate mt-0.5">
                                                    {section?.academicYear?.name || "—"}
                                                </p>
                                                <p className="text-[10px] text-cyan-300 font-mono">
                                                    {section?.academicYear?.code || `ID #${section?.academicYear?.id || ""}`}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">Department</p>
                                                <p className="font-semibold text-white truncate mt-0.5">
                                                    {section?.department?.name || "—"}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    {section?.department?.code || `ID #${section?.department?.id || ""}`}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">University</p>
                                                <p className="font-semibold text-white truncate mt-0.5">
                                                    {section?.university?.name || "—"}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    {section?.university?.code || `ID #${section?.university?.id || ""}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Section Name */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label
                                            htmlFor="section-name"
                                            className="text-xs font-semibold text-slate-300"
                                        >
                                            Section Name <span className="text-cyan-400">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-500">{form.name.length}/150</span>
                                    </div>
                                    <input
                                        id="section-name"
                                        value={form.name}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, name: e.target.value }));
                                            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                                            setDialogError("");
                                        }}
                                        readOnly={readOnly || busy}
                                        maxLength={150}
                                        placeholder="e.g. Section A"
                                        className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 ${
                                            fieldErrors.name
                                                ? "border-rose-500/60 focus:border-rose-400"
                                                : "border-white/10 focus:border-cyan-400/60"
                                        } read-only:opacity-75 disabled:opacity-50`}
                                    />
                                    <FieldError>{fieldErrors.name}</FieldError>
                                </div>

                                {/* Section Code Input with Dynamic Prefix Badge (CREATE / EDIT) */}
                                {!isView && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor="section-code-suffix"
                                                className="text-xs font-semibold text-slate-300"
                                            >
                                                Section Code (Suffix) <span className="text-cyan-400">*</span>
                                            </label>
                                            {prefixLoading && (
                                                <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                                                    <LoaderCircle size={11} className="animate-spin" /> Fetching prefix...
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
                                                id="section-code-suffix"
                                                value={form.code}
                                                onChange={(e) => {
                                                    setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                                                    if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: undefined }));
                                                    setDialogError("");
                                                }}
                                                readOnly={readOnly || busy}
                                                maxLength={30}
                                                placeholder="e.g. A or 01"
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
                                                <p className="text-[10px] text-slate-400 uppercase">Fixed Prefix</p>
                                                <p className="mt-1 font-mono font-bold text-slate-300 truncate">
                                                    {viewCodeDecomposition.prefix}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">Section Suffix</p>
                                                <p className="mt-1 font-mono font-bold text-cyan-300 truncate">
                                                    {viewCodeDecomposition.suffix}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
                                                <p className="text-[10px] text-cyan-300 uppercase">Composite Code</p>
                                                <p className="mt-1 font-mono font-bold text-white truncate">
                                                    {viewCodeDecomposition.fullCode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Capacity & Operational Status Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Capacity */}
                                    <div>
                                        <label
                                            htmlFor="section-capacity"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            Seat Capacity <span className="text-cyan-400">*</span>
                                        </label>
                                        <input
                                            id="section-capacity"
                                            type="number"
                                            min="1"
                                            value={form.capacity}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, capacity: e.target.value }));
                                                if (fieldErrors.capacity) setFieldErrors((prev) => ({ ...prev, capacity: undefined }));
                                                setDialogError("");
                                            }}
                                            readOnly={readOnly || busy}
                                            placeholder="e.g. 60"
                                            className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 ${
                                                fieldErrors.capacity
                                                    ? "border-rose-500/60 focus:border-rose-400"
                                                    : "border-white/10 focus:border-cyan-400/60"
                                            } read-only:opacity-75 disabled:opacity-50`}
                                        />
                                        <FieldError>{fieldErrors.capacity}</FieldError>
                                    </div>

                                    {/* Operational Status */}
                                    <div>
                                        <label
                                            htmlFor="section-status"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            Operational Status
                                        </label>
                                        {isView ? (
                                            <div className="pt-1">
                                                <StatusBadge status={form.activeStatus} />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    id="section-status"
                                                    value={form.activeStatus}
                                                    onChange={(e) => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            activeStatus: e.target.value as ActiveStatus,
                                                        }));
                                                        setDialogError("");
                                                    }}
                                                    disabled={busy}
                                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
                                                >
                                                    <option value="ENABLE" className="bg-slate-900 text-white">Active (Enable)</option>
                                                    <option value="DISABLE" className="bg-slate-900 text-white">Inactive (Disable)</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Specialization Groups Multi-Select / View Breakdown */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Layers size={13} className="text-cyan-400" />
                                            Associated Specialization Groups <span className="text-cyan-400">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            {form.specializationIds.length} selected
                                        </span>
                                    </div>

                                    {isView ? (
                                        /* Section Groups Breakdown in VIEW */
                                        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                            {Array.isArray(section?.sectionGroup) && section.sectionGroup.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {section.sectionGroup.map((group) => (
                                                        <div
                                                            key={group.id}
                                                            className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2.5 text-xs gap-2"
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <p className="font-semibold text-cyan-200 truncate">
                                                                    {group.name}
                                                                </p>
                                                                <p className="font-mono text-[10px] text-slate-400 truncate">
                                                                    {group.code || `ID #${group.id}`}
                                                                </p>
                                                                <p
                                                                    className={`text-[10px] mt-0.5 truncate ${
                                                                        group.hasFeeStructure
                                                                            ? "text-emerald-300"
                                                                            : "text-amber-300"
                                                                    }`}
                                                                >
                                                                    {group.hasFeeStructure
                                                                        ? `Fee: ${group.feeStructure?.name || "Mapped"}`
                                                                        : "No fee structure mapped"}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1 rounded-md bg-cyan-400/20 px-2 py-0.5 text-[11px] font-bold text-cyan-100 shrink-0">
                                                                <Users size={11} />
                                                                <span>{group.studentCount ?? 0}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 italic">No section groups assigned.</p>
                                            )}
                                        </div>
                                    ) : (
                                        /* Multi-select chips in CREATE / EDIT */
                                        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 max-h-40 overflow-y-auto custom-scrollbar">
                                            {loadingSpecializations ? (
                                                <div className="flex items-center gap-2 text-xs text-cyan-300 py-1">
                                                    <LoaderCircle size={13} className="animate-spin" />
                                                    <span>Loading specializations with mapped fee structures...</span>
                                                </div>
                                            ) : availableSpecializations.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableSpecializations.map((spec) => {
                                                        const isSelected = form.specializationIds.includes(spec.id);
                                                        return (
                                                            <button
                                                                key={spec.id}
                                                                type="button"
                                                                onClick={() => toggleSpecialization(spec.id)}
                                                                disabled={busy}
                                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${
                                                                    isSelected
                                                                        ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200 shadow-sm shadow-cyan-500/20"
                                                                        : "border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:text-slate-200"
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                                        isSelected ? "bg-cyan-400" : "bg-slate-600"
                                                                    }`}
                                                                />
                                                                <span>{spec.name}</span>
                                                                {spec.code && (
                                                                    <span className="font-mono text-[10px] text-cyan-400/70">
                                                                        ({spec.code})
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 italic">
                                                    {!form.courseId || !form.academicYearId
                                                        ? "Select a course and academic year first to load specializations with mapped fee structures."
                                                        : "No specializations have a valid mapped fee structure for this course and academic year."}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <FieldError>{fieldErrors.specializationIds}</FieldError>
                                </div>

                                {/* VIEW ONLY: Exact University.tsx Audit Trail & Governance Showcase */}
                                {isView && section && (
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
                                                    {section.createdAt && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(section.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                        {getInitials(section.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {section.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(section.createdBy?.code || section.createdBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {section.createdBy.code
                                                                    ? `Code: ${section.createdBy.code}`
                                                                    : `ID: #${section.createdBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {section.createdAt && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(section.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Last Modified By Card */}
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <RotateCcw size={11} /> Last Modified By
                                                    </span>
                                                    {(section.updatedAt || section.createdAt) && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(section.updatedAt || section.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                        {getInitials(section.updatedBy?.name || section.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {section.updatedBy?.name || section.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(section.updatedBy?.code || section.updatedBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {section.updatedBy.code
                                                                    ? `Code: ${section.updatedBy.code}`
                                                                    : `ID: #${section.updatedBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(section.updatedAt || section.createdAt) && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(section.updatedAt || section.createdAt)}</span>
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
                                    disabled={busy || (isDelete && totalEnrolledStudents > 0)}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                                        isDelete
                                            ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                            : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                    }`}
                                >
                                    {busy && <LoaderCircle size={14} className="animate-spin" />}
                                    <span>
                                        {isDelete
                                            ? "Delete Section"
                                            : isEdit
                                                ? "Save Changes"
                                                : "Create Section"}
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

export default function Sections() {
    const reduceMotion = useReducedMotion();

    // Data States
    const [sections, setSections] = useState<SectionResponse[]>([]);
    const [courses, setCourses] = useState<CommonDTO[]>([]);
    const [specializations, setSpecializations] = useState<CommonDTO[]>([]);

    // Loading & Status States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Modal Dialog State
    const [dialogState, setDialogState] = useState<{
        mode: DialogMode;
        section: SectionResponse | null;
    } | null>(null);

    // Filter States
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [selectedUniversityId, setSelectedUniversityId] = useState<number | "ALL">("ALL");
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | "ALL">("ALL");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "ALL">("ALL");
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | "ALL">("ALL");
    const [selectedCourseId, setSelectedCourseId] = useState<number | "ALL">("ALL");
    const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | "ALL">("ALL");
    const [eligibleGroupsOnly, setEligibleGroupsOnly] = useState<boolean>(false);
    const [eligibleGroups, setEligibleGroups] = useState<EligibleSectionGroupItem[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);

    // Initial Data Fetch
    const loadSections = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setPageError("");

        try {
            const data = await getAllSections();
            setSections(data);
        } catch (err) {
            setPageError(extractErrorMessage(err, "Failed to load sections."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadDropdownFilters = useCallback(async () => {
        try {
            const [cList, sList] = await Promise.all([
                getCourseFilter(),
                getSpecializationFilter(),
            ]);
            setCourses(cList);
            setSpecializations(sList);
        } catch (err) {
            // Silently log or let dialog handle errors
            console.warn("Failed to preload creation dropdowns:", err);
        }
    }, []);

    useEffect(() => {
        void loadSections();
        void loadDropdownFilters();
    }, [loadSections, loadDropdownFilters]);

    // Fetch backend-verified eligible section groups when filtering by specialization, academic year, or fee-mapped eligibility
    useEffect(() => {
        if (
            selectedSpecializationId === "ALL" &&
            selectedAcademicYearId === "ALL" &&
            !eligibleGroupsOnly
        ) {
            setEligibleGroups([]);
            return;
        }
        let cancelled = false;
        getEligibleSectionGroups({
            specializationId:
                selectedSpecializationId !== "ALL" ? selectedSpecializationId : undefined,
            academicYearId:
                selectedAcademicYearId !== "ALL" ? selectedAcademicYearId : undefined,
        })
            .then((list) => {
                if (!cancelled) setEligibleGroups(list);
            })
            .catch(() => {
                if (!cancelled) setEligibleGroups([]);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedSpecializationId, selectedAcademicYearId, eligibleGroupsOnly, sections]);

    // Clear notices after 5 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    // Unique Hierarchy Options derived dynamically from loaded sections
    const universityOptions = useMemo(() => {
        return uniqueCommonDTOs(sections.map((s) => s.university));
    }, [sections]);

    const schoolOptions = useMemo(() => {
        const filtered = selectedUniversityId === "ALL"
            ? sections
            : sections.filter((s) => s.university?.id === selectedUniversityId);
        return uniqueCommonDTOs(filtered.map((s) => s.school));
    }, [sections, selectedUniversityId]);

    const departmentOptions = useMemo(() => {
        let filtered = sections;
        if (selectedUniversityId !== "ALL") {
            filtered = filtered.filter((s) => s.university?.id === selectedUniversityId);
        }
        if (selectedSchoolId !== "ALL") {
            filtered = filtered.filter((s) => s.school?.id === selectedSchoolId);
        }
        return uniqueCommonDTOs(filtered.map((s) => s.department));
    }, [sections, selectedUniversityId, selectedSchoolId]);

    const academicYearOptions = useMemo(() => {
        let filtered = sections;
        if (selectedUniversityId !== "ALL") {
            filtered = filtered.filter((s) => s.university?.id === selectedUniversityId);
        }
        return uniqueCommonDTOs(filtered.map((s) => s.academicYear));
    }, [sections, selectedUniversityId]);

    const courseOptions = useMemo(() => {
        let filtered = sections;
        if (selectedDepartmentId !== "ALL") {
            filtered = filtered.filter((s) => s.department?.id === selectedDepartmentId);
        }
        return uniqueCommonDTOs(filtered.map((s) => s.course));
    }, [sections, selectedDepartmentId]);

    const specializationFilterOptions = useMemo(() => {
        let filtered = sections;
        if (selectedCourseId !== "ALL") {
            filtered = filtered.filter((s) => s.course?.id === selectedCourseId);
        }
        if (selectedAcademicYearId !== "ALL") {
            filtered = filtered.filter((s) => s.academicYear?.id === selectedAcademicYearId);
        }
        return uniqueCommonDTOs(
            filtered.flatMap((s) => (s.sectionGroup ?? []).map((g) => g.specialization))
        );
    }, [sections, selectedCourseId, selectedAcademicYearId]);

    // Reset pagination when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        statusFilter,
        selectedUniversityId,
        selectedSchoolId,
        selectedDepartmentId,
        selectedAcademicYearId,
        selectedCourseId,
        selectedSpecializationId,
        eligibleGroupsOnly,
        sortBy,
    ]);

    const eligibleGroupIdSet = useMemo(() => {
        if (
            selectedSpecializationId === "ALL" &&
            selectedAcademicYearId === "ALL" &&
            !eligibleGroupsOnly
        ) {
            return null;
        }
        return new Set(eligibleGroups.map((item) => item.sectionGroup.id));
    }, [eligibleGroups, selectedSpecializationId, selectedAcademicYearId, eligibleGroupsOnly]);

    // Filter & Sort Logic
    const filteredSections = useMemo(() => {
        const q = text(search);

        return sections.filter((s) => {
            // Text search matches section name, code, course name, academic year, department
            if (q) {
                const sName = text(s.name);
                const sCode = text(s.code);
                const cName = text(s.course?.name);
                const cCode = text(s.course?.code);
                const aName = text(s.academicYear?.name);
                const dName = text(s.department?.name);
                if (
                    !sName.includes(q) &&
                    !sCode.includes(q) &&
                    !cName.includes(q) &&
                    !cCode.includes(q) &&
                    !aName.includes(q) &&
                    !dName.includes(q)
                ) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter !== "ALL" && s.activeStatus !== statusFilter) {
                return false;
            }

            // Hierarchy filters
            if (selectedUniversityId !== "ALL" && s.university?.id !== selectedUniversityId) {
                return false;
            }
            if (selectedSchoolId !== "ALL" && s.school?.id !== selectedSchoolId) {
                return false;
            }
            if (selectedDepartmentId !== "ALL" && s.department?.id !== selectedDepartmentId) {
                return false;
            }
            if (selectedAcademicYearId !== "ALL" && s.academicYear?.id !== selectedAcademicYearId) {
                return false;
            }
            if (selectedCourseId !== "ALL" && s.course?.id !== selectedCourseId) {
                return false;
            }
            if (selectedSpecializationId !== "ALL" || eligibleGroupsOnly) {
                const groups = s.sectionGroup ?? [];
                const hasEligibleMatch = groups.some((g) => {
                    const specMatches =
                        selectedSpecializationId === "ALL" ||
                        g.specialization?.id === selectedSpecializationId;
                    const eligibleByBackend = eligibleGroupIdSet
                        ? eligibleGroupIdSet.has(g.id)
                        : Boolean(g.hasFeeStructure);
                    return specMatches && (eligibleByBackend || Boolean(g.hasFeeStructure));
                });
                if (!hasEligibleMatch) return false;
            }

            return true;
        });
    }, [
        sections,
        search,
        statusFilter,
        selectedUniversityId,
        selectedSchoolId,
        selectedDepartmentId,
        selectedAcademicYearId,
        selectedCourseId,
        selectedSpecializationId,
        eligibleGroupsOnly,
        eligibleGroupIdSet,
    ]);

    const sortedSections = useMemo(() => {
        return [...filteredSections].sort((a, b) => {
            switch (sortBy) {
                case "NAME_ASC":
                    return (a.name || "").localeCompare(b.name || "");
                case "NAME_DESC":
                    return (b.name || "").localeCompare(a.name || "");
                case "CODE_ASC":
                    return (a.code || "").localeCompare(b.code || "");
                case "CODE_DESC":
                    return (b.code || "").localeCompare(a.code || "");
                case "CAPACITY_DESC":
                    return (b.capacity ?? 0) - (a.capacity ?? 0);
                case "CAPACITY_ASC":
                    return (a.capacity ?? 0) - (b.capacity ?? 0);
                case "NEWEST":
                default:
                    return b.id - a.id;
            }
        });
    }, [filteredSections, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedSections.length / PAGE_SIZE));
    const paginatedSections = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedSections.slice(start, start + PAGE_SIZE);
    }, [sortedSections, currentPage]);

    // Statistics metrics
    const metrics = useMemo(() => {
        const total = sections.length;
        const active = sections.filter((s) => s.activeStatus === "ENABLE").length;
        const inactive = sections.filter((s) => s.activeStatus === "DISABLE").length;
        const totalCap = sections.reduce((sum, s) => sum + (s.capacity ?? 0), 0);
        return { total, active, inactive, totalCap };
    }, [sections]);

    const hasActiveFilters =
        Boolean(search.trim()) ||
        statusFilter !== "ALL" ||
        selectedUniversityId !== "ALL" ||
        selectedSchoolId !== "ALL" ||
        selectedDepartmentId !== "ALL" ||
        selectedAcademicYearId !== "ALL" ||
        selectedCourseId !== "ALL" ||
        selectedSpecializationId !== "ALL" ||
        eligibleGroupsOnly;

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setSelectedUniversityId("ALL");
        setSelectedSchoolId("ALL");
        setSelectedDepartmentId("ALL");
        setSelectedAcademicYearId("ALL");
        setSelectedCourseId("ALL");
        setSelectedSpecializationId("ALL");
        setEligibleGroupsOnly(false);
        setSortBy("NEWEST");
    }

    // Modal Operations
    function openDialog(mode: DialogMode, section: SectionResponse | null = null) {
        setDialogState({ mode, section });
    }

    function closeDialog() {
        setDialogState(null);
    }

    async function handleCreate(courseId: number, academicYearId: number, request: SectionRequest) {
        setBusy(true);
        try {
            const created = await createSection(courseId, academicYearId, request);
            setSections((prev) => [created, ...prev]);
            closeDialog();
            setNotice(`Section "${created.name}" created successfully.`);
            toast.success("Section created successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(sectionId: number, request: SectionRequest) {
        setBusy(true);
        try {
            const updated = await updateSection(sectionId, request);
            setSections((prev) => prev.map((s) => (s.id === sectionId ? updated : s)));
            closeDialog();
            setNotice(`Section "${updated.name}" updated successfully.`);
            toast.success("Section updated successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(sectionId: number) {
        setBusy(true);
        try {
            await deleteSection(sectionId);
            setSections((prev) => prev.filter((s) => s.id !== sectionId));
            closeDialog();
            setNotice("Section deleted successfully.");
            toast.success("Section deleted successfully");
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
            {/* Header & Breadcrumb */}
            <section className="space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span className="truncate">Academic Management</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Sections</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Course Cohorts & Group Allocation
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Sections
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Configure section cohorts, manage seating capacities, map specialization groups, and oversee classroom student allocations.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadSections(true)}
                            disabled={loading || refreshing}
                            title="Refresh sections list"
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
                            <span>Create Section</span>
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
                                    onClick={() => void loadSections()}
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
                aria-label="Section statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    {
                        label: "Total Sections",
                        value: formatNumber(metrics.total),
                        sub: "Across all courses",
                        icon: Layers,
                        color: "from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30",
                    },
                    {
                        label: "Active Cohorts",
                        value: formatNumber(metrics.active),
                        sub: "Accepting enrollments",
                        icon: CheckCircle2,
                        color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
                    },
                    {
                        label: "Inactive Cohorts",
                        value: formatNumber(metrics.inactive),
                        sub: "Suspended or archived",
                        icon: AlertCircle,
                        color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
                    },
                    {
                        label: "Total Capacity",
                        value: formatNumber(metrics.totalCap),
                        sub: "Total classroom seats",
                        icon: Users,
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
                                {stat.value}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 truncate">{stat.sub}</p>
                    </GlassCard>
                ))}
            </section>

            {/* Filter Toolbar Card (Derived dynamically from data) */}
            <GlassCard className="p-3.5 sm:p-4">
                <div className="space-y-3">
                    {/* Top Row: Search + Sort + Reset */}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search section name, code, course, academic year..."
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

                        {/* Status Filter */}
                        <div className="relative min-w-[130px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
                                <option value="ENABLE" className="bg-slate-900 text-white">Active Only</option>
                                <option value="DISABLE" className="bg-slate-900 text-white">Inactive Only</option>
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
                                <option value="CODE_ASC" className="bg-slate-900 text-white">Code (A-Z)</option>
                                <option value="CODE_DESC" className="bg-slate-900 text-white">Code (Z-A)</option>
                                <option value="CAPACITY_DESC" className="bg-slate-900 text-white">Capacity (High-Low)</option>
                                <option value="CAPACITY_ASC" className="bg-slate-900 text-white">Capacity (Low-High)</option>
                            </select>
                            <ArrowDownUp size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Clear Filters Button */}
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

                    {/* Secondary Row: Cascading Hierarchy Filters (Auto-derived from loaded sections) */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-white/5">
                        {/* University */}
                        <div className="relative">
                            <select
                                value={selectedUniversityId}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSelectedUniversityId(val);
                                    setSelectedSchoolId("ALL");
                                    setSelectedDepartmentId("ALL");
                                    setSelectedAcademicYearId("ALL");
                                    setSelectedCourseId("ALL");
                                    setSelectedSpecializationId("ALL");
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
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

                        {/* School */}
                        <div className="relative">
                            <select
                                value={selectedSchoolId}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSelectedSchoolId(val);
                                    setSelectedDepartmentId("ALL");
                                    setSelectedCourseId("ALL");
                                    setSelectedSpecializationId("ALL");
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Schools</option>
                                {schoolOptions.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Department */}
                        <div className="relative">
                            <select
                                value={selectedDepartmentId}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSelectedDepartmentId(val);
                                    setSelectedCourseId("ALL");
                                    setSelectedSpecializationId("ALL");
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Departments</option>
                                {departmentOptions.map((d) => (
                                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Academic Year */}
                        <div className="relative">
                            <select
                                value={selectedAcademicYearId}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSelectedAcademicYearId(val);
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Academic Years</option>
                                {academicYearOptions.map((ay) => (
                                    <option key={ay.id} value={ay.id} className="bg-slate-900 text-white">
                                        {ay.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Course */}
                        <div className="relative">
                            <select
                                value={selectedCourseId}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSelectedCourseId(val);
                                    setSelectedSpecializationId("ALL");
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Courses</option>
                                {courseOptions.map((c) => (
                                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Specialization (Fee Structure Eligibility) */}
                        <div className="relative">
                            <select
                                value={selectedSpecializationId}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSelectedSpecializationId(val);
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Specializations</option>
                                {specializationFilterOptions.map((sp) => (
                                    <option key={sp.id} value={sp.id} className="bg-slate-900 text-white">
                                        {sp.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={eligibleGroupsOnly}
                                onChange={(e) => setEligibleGroupsOnly(e.target.checked)}
                                className="rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-cyan-400/40"
                            />
                            <span>Show only sections having groups eligible with a valid mapped fee structure</span>
                        </label>
                        {(selectedSpecializationId !== "ALL" || eligibleGroupsOnly) && (
                            <span className="font-mono text-cyan-300">
                                {eligibleGroups.length} eligible section group{eligibleGroups.length === 1 ? "" : "s"}
                            </span>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* List & Dual-View Presentation */}
            <GlassCard>
                {/* Desktop Table View (hidden on sm/mobile) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th scope="col" className="px-5 py-4 w-12 text-center">#</th>
                                <th scope="col" className="px-4 py-4 min-w-[200px]">Section & Creator</th>
                                <th scope="col" className="px-4 py-4 min-w-[130px]">Code</th>
                                <th scope="col" className="px-4 py-4 min-w-[180px]">Course & Academic Year</th>
                                <th scope="col" className="px-4 py-4 min-w-[160px]">Department</th>
                                <th scope="col" className="px-4 py-4">Status</th>
                                <th scope="col" className="px-4 py-4 text-center">Capacity / Students</th>
                                <th scope="col" className="px-4 py-4 text-center">Groups</th>
                                <th scope="col" className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center">
                                        <div className="inline-flex flex-col items-center justify-center gap-3">
                                            <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                                            <p className="font-semibold text-slate-200">Loading sections...</p>
                                            <p className="text-xs text-slate-400">Fetching academic cohorts and allocations</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageError && sections.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">Failed to load sections</p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">{pageError}</p>
                                        <button
                                            type="button"
                                            onClick={() => void loadSections()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : paginatedSections.length > 0 ? (
                                paginatedSections.map((s, index) => {
                                    const totalStudents = Array.isArray(s.sectionGroup)
                                        ? s.sectionGroup.reduce((sum, g) => sum + (g.studentCount ?? 0), 0)
                                        : 0;
                                    const visibleGroups =
                                        selectedSpecializationId !== "ALL" || eligibleGroupsOnly
                                            ? (s.sectionGroup ?? []).filter((g) => {
                                                  const specMatch =
                                                      selectedSpecializationId === "ALL" ||
                                                      g.specialization?.id === selectedSpecializationId;
                                                  const eligibleMatch = eligibleGroupIdSet
                                                      ? eligibleGroupIdSet.has(g.id)
                                                      : Boolean(g.hasFeeStructure);
                                                  return specMatch && (eligibleMatch || Boolean(g.hasFeeStructure));
                                              })
                                            : (s.sectionGroup ?? []);
                                    const groupsCount = visibleGroups.length;
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
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                        {getInitials(s.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {s.name || "Unnamed Section"}
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

                                            {/* Section Code */}
                                            <td className="px-4 py-4">
                                                <span className="inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-200">
                                                    {s.code || "—"}
                                                </span>
                                            </td>

                                            {/* Course & Academic Year */}
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-200">
                                                        {s.course?.name || "—"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-mono truncate">
                                                        {s.academicYear?.name || "Academic Year —"}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Department & University */}
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="truncate text-slate-300">
                                                        {s.department?.name || "—"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        {s.university?.name || "—"}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-4">
                                                <StatusBadge status={s.activeStatus} />
                                            </td>

                                            {/* Capacity / Enrolled */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-semibold text-white">
                                                        {formatNumber(totalStudents)}{" "}
                                                        <span className="text-slate-500 text-xs">/ {formatNumber(s.capacity)}</span>
                                                    </span>
                                                    <div className="w-16 bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className={`h-full ${
                                                                s.capacity && totalStudents > s.capacity
                                                                    ? "bg-rose-500"
                                                                    : "bg-cyan-400"
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(100, s.capacity ? (totalStudents / s.capacity) * 100 : 0)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Groups Count */}
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300">
                                                    <Layers size={12} className="text-cyan-400" />
                                                    {groupsCount}
                                                </span>
                                            </td>

                                            {/* Action Buttons with strict h-8 w-8 shrink-0 */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("VIEW", s)}
                                                        aria-label={`View details of ${s.name}`}
                                                        title="View details"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("EDIT", s)}
                                                            aria-label={`Edit ${s.name}`}
                                                            title="Edit section"
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
                                                            title="Delete section"
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
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Layers size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters ? "No matching sections found" : "No sections created yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search terms, changing the hierarchy filter, or resetting filter criteria."
                                                : "Get started by creating your academic program's first student section."}
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
                                                    Create Section
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
                            <p className="mt-3 text-xs font-semibold text-slate-200">Loading sections...</p>
                        </div>
                    ) : pageError && sections.length === 0 ? (
                        <div className="p-6 text-center">
                            <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                            <p className="mt-2 text-xs font-semibold text-white">Failed to load sections</p>
                            <button
                                type="button"
                                onClick={() => void loadSections()}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                            >
                                <RefreshCw size={13} /> Retry
                            </button>
                        </div>
                    ) : paginatedSections.length > 0 ? (
                        paginatedSections.map((s) => {
                            const totalStudents = Array.isArray(s.sectionGroup)
                                ? s.sectionGroup.reduce((sum, g) => sum + (g.studentCount ?? 0), 0)
                                : 0;
                            const visibleGroups =
                                selectedSpecializationId !== "ALL" || eligibleGroupsOnly
                                    ? (s.sectionGroup ?? []).filter((g) => {
                                          const specMatch =
                                              selectedSpecializationId === "ALL" ||
                                              g.specialization?.id === selectedSpecializationId;
                                          const eligibleMatch = eligibleGroupIdSet
                                              ? eligibleGroupIdSet.has(g.id)
                                              : Boolean(g.hasFeeStructure);
                                          return specMatch && (eligibleMatch || Boolean(g.hasFeeStructure));
                                      })
                                    : (s.sectionGroup ?? []);
                            const groupsCount = visibleGroups.length;
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
                                        <StatusBadge status={s.activeStatus} />
                                    </div>

                                    {/* Hierarchy & Course Info */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Course:</span>
                                            <span className="font-medium text-white truncate max-w-[200px]">{s.course?.name || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Academic Year:</span>
                                            <span className="font-mono text-cyan-300">{s.academicYear?.name || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Department:</span>
                                            <span className="text-slate-400 truncate max-w-[200px]">{s.department?.name || "—"}</span>
                                        </div>
                                    </div>

                                    {/* Capacity & Groups Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                            <span className="text-[10px] text-slate-400 uppercase">Enrollment</span>
                                            <p className="font-bold text-white mt-0.5">
                                                {formatNumber(totalStudents)} / {formatNumber(s.capacity)} seats
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                            <span className="text-[10px] text-slate-400 uppercase">Specialization Groups</span>
                                            <p className="font-bold text-cyan-300 mt-0.5">{groupsCount} assigned</p>
                                        </div>
                                    </div>

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
                            No sections match your criteria.
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {sortedSections.length === 0
                            ? "Showing 0 sections"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                                  currentPage * PAGE_SIZE,
                                  sortedSections.length
                              )} of ${sortedSections.length} section${
                                  sortedSections.length === 1 ? "" : "s"
                              }`}
                    </p>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Section pagination"
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
                    <SectionDialog
                        mode={dialogState.mode}
                        section={dialogState.section}
                        courses={courses}
                        specializations={specializations}
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
