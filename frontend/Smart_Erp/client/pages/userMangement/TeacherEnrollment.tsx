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
    AlertTriangle,
    ArrowDownUp,
    BookCheck,
    BookOpen,
    BookUser,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CircleUserRound,
    Clock,
    Eye,
    Layers,
    LoaderCircle,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import {
    addSubjectToEnrollment,
    createTeacherEnrollment,
    deleteTeacherEnrollment,
    extractTeacherEnrollmentErrorMessage,
    formatAuditActor,
    formatDate,
    formatDateTime,
    getInitials,
    getSubjectsForTeacherEnrollment,
    getTeacherEnrollments,
    hasEnrollmentPermission,
    removeSubjectFromEnrollment,
    uniqueCommonDTOs,
    type CommonDTO,
    type EnrollmentResponseItem,
    type TeacherEnrollmentRequest,
    type TeacherEnrollmentResponse,
} from "@/services/userMangement/teacherEnrollmentService";
import { getTeachers, type TeacherResponse } from "@/services/userMangement/teacherService";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 8;

type SortMode = "NAME_ASC" | "NAME_DESC" | "SUBJECTS_DESC" | "ENROLLMENTS_DESC";
type DialogMode = "CREATE" | "ADD_SUBJECT" | "REMOVE_SUBJECT" | "DELETE_ENROLLMENT" | "VIEW";

function statusTone(status: string) {
    switch (status.toUpperCase()) {
        case "ACTIVE":
            return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
        case "COMPLETED":
            return "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
        case "SUSPENDED":
            return "border-amber-400/30 bg-amber-500/10 text-amber-300";
        case "WITHDRAWN":
        case "CANCELLED":
        case "DISABLE":
            return "border-rose-400/30 bg-rose-500/10 text-rose-300";
        default:
            return "border-white/10 bg-white/5 text-slate-300";
    }
}

/* -------------------------------------------------------------------------- */
/* Visual Containers                                                          */
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
            className={`rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
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

/* -------------------------------------------------------------------------- */
/* Modal Shell Component                                                      */
/* -------------------------------------------------------------------------- */

function ModalShell({
    title,
    subtitle,
    onClose,
    children,
    wide = false,
    icon: Icon = BookUser,
    iconTone = "cyan",
    busy = false,
}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
    icon?: typeof BookUser;
    iconTone?: "cyan" | "emerald" | "rose" | "purple" | "amber";
    busy?: boolean;
}) {
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, busy]);

    const toneClasses = {
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (!busy) onClose();
                }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.section
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                transition={{ duration: 0.2 }}
                className={`relative z-10 my-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/70 ${wide ? "max-w-3xl" : "max-w-xl"
                    }`}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`rounded-xl border p-2 shrink-0 ${toneClasses[iconTone]}`}>
                            <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-bold tracking-tight text-white truncate sm:text-lg">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
                    {children}
                </div>
            </motion.section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Teacher Enrollment Page Component                                     */
/* -------------------------------------------------------------------------- */

export default function TeacherEnrollment() {
    const reduceMotion = useReducedMotion();

    // Data State
    const [enrollments, setEnrollments] = useState<TeacherEnrollmentResponse[]>([]);
    const [teachersList, setTeachersList] = useState<TeacherResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Filter & Search State
    const [search, setSearch] = useState("");
    const [universityFilter, setUniversityFilter] = useState<number | "ALL">("ALL");
    const [subjectFilter, setSubjectFilter] = useState<number | "ALL">("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<SortMode>("NAME_ASC");
    const [currentPage, setCurrentPage] = useState(1);

    // Active Dialog State
    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        teacherEnrollment?: TeacherEnrollmentResponse;
        enrollmentItem?: EnrollmentResponseItem;
        targetSubject?: CommonDTO;
    } | null>(null);
    const [busy, setBusy] = useState(false);
    const [viewTab, setViewTab] = useState<"allocations" | "audit">("allocations");

    // Create Enrollment Form State
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
    const [availableSubjects, setAvailableSubjects] = useState<CommonDTO[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
    const [subjectSearch, setSubjectSearch] = useState("");

    // Add Subject Dialog State
    const [addSubjectId, setAddSubjectId] = useState<number | "">("");

    // Initial Data Fetching
    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setPageError("");

        try {
            const [enrollmentData, teacherData] = await Promise.all([
                getTeacherEnrollments(),
                getTeachers().catch(() => []),
            ]);
            setEnrollments(enrollmentData);
            setTeachersList(teacherData);
        } catch (error) {
            setPageError(
                extractTeacherEnrollmentErrorMessage(error, "Unable to load teacher enrollments.")
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Unique options for filters
    const universityOptions = useMemo(() => {
        return uniqueCommonDTOs(enrollments.map((e) => e.university).filter(Boolean));
    }, [enrollments]);

    const subjectOptions = useMemo(() => {
        const allSubjects = enrollments.flatMap((e) =>
            e.enrollmentResponses.flatMap((enr) => enr.subjects)
        );
        return uniqueCommonDTOs(allSubjects);
    }, [enrollments]);

    // Active Filters Check
    const hasActiveFilters =
        Boolean(search.trim()) ||
        universityFilter !== "ALL" ||
        subjectFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        sortBy !== "NAME_ASC";

    const resetFilters = () => {
        setSearch("");
        setUniversityFilter("ALL");
        setSubjectFilter("ALL");
        setStatusFilter("ALL");
        setSortBy("NAME_ASC");
        setCurrentPage(1);
    };

    // Filter & Sort Pipeline
    const filteredEnrollments = useMemo(() => {
        const q = search.trim().toLowerCase();

        return enrollments.filter((entry) => {
            const allSubjects = entry.enrollmentResponses.flatMap((e) => e.subjects);

            if (q) {
                const teacherName = entry.teacher.name.toLowerCase();
                const teacherCode = (entry.teacher.code || "").toLowerCase();
                const uniName = (entry.university?.name || "").toLowerCase();
                const subjectNames = allSubjects.map((s) => s.name.toLowerCase()).join(" ");

                const matches =
                    teacherName.includes(q) ||
                    teacherCode.includes(q) ||
                    uniName.includes(q) ||
                    subjectNames.includes(q);

                if (!matches) return false;
            }

            if (universityFilter !== "ALL") {
                if (entry.university?.id !== universityFilter) return false;
            }

            if (subjectFilter !== "ALL") {
                const hasSubject = allSubjects.some((s) => s.id === subjectFilter);
                if (!hasSubject) return false;
            }

            if (statusFilter !== "ALL") {
                const hasStatus = entry.enrollmentResponses.some(
                    (item) => item.status.toUpperCase() === statusFilter
                );
                if (!hasStatus) return false;
            }

            return true;
        });
    }, [enrollments, search, universityFilter, subjectFilter, statusFilter]);

    const sortedEnrollments = useMemo(() => {
        return [...filteredEnrollments].sort((a, b) => {
            if (sortBy === "NAME_ASC") return a.teacher.name.localeCompare(b.teacher.name);
            if (sortBy === "NAME_DESC") return b.teacher.name.localeCompare(a.teacher.name);
            if (sortBy === "SUBJECTS_DESC") {
                const countA = a.enrollmentResponses.reduce((acc, e) => acc + e.subjects.length, 0);
                const countB = b.enrollmentResponses.reduce((acc, e) => acc + e.subjects.length, 0);
                return countB - countA;
            }
            if (sortBy === "ENROLLMENTS_DESC") {
                return b.enrollmentResponses.length - a.enrollmentResponses.length;
            }
            return b.teacher.id - a.teacher.id;
        });
    }, [filteredEnrollments, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedEnrollments.length / PAGE_SIZE));
    const paginatedEnrollments = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedEnrollments.slice(start, start + PAGE_SIZE);
    }, [sortedEnrollments, currentPage]);

    // Overall Metrics
    const metrics = useMemo(() => {
        const totalFaculty = enrollments.length;
        const totalAllocations = enrollments.reduce(
            (acc, e) => acc + e.enrollmentResponses.length,
            0
        );
        const activeAllocations = enrollments.reduce(
            (acc, e) =>
                acc +
                e.enrollmentResponses.filter((item) => item.status.toUpperCase() === "ACTIVE").length,
            0
        );
        const totalAssignedSubjects = enrollments.reduce(
            (acc, e) =>
                acc + e.enrollmentResponses.reduce((subAcc, item) => subAcc + item.subjects.length, 0),
            0
        );
        const uniqueInstitutions = new Set(
            enrollments.map((e) => e.university?.id).filter(Boolean)
        ).size;

        return {
            totalFaculty,
            totalAllocations,
            activeAllocations,
            totalAssignedSubjects,
            uniqueInstitutions,
        };
    }, [enrollments]);

    // Teacher select in create modal
    const handleTeacherSelect = async (teacherIdStr: string) => {
        const id = teacherIdStr ? Number(teacherIdStr) : "";
        setSelectedTeacherId(id);
        setSelectedSubjectIds([]);
        setAvailableSubjects([]);
        if (!id) return;

        const selectedTeacher = teachersList.find((t) => t.id === id);
        const uniId = selectedTeacher?.university?.id;
        if (!uniId) {
            toast.error("The selected faculty member has no university assigned.");
            return;
        }

        setSubjectsLoading(true);
        try {
            const list = await getSubjectsForTeacherEnrollment(uniId);
            setAvailableSubjects(list);
        } catch (error) {
            toast.error(
                extractTeacherEnrollmentErrorMessage(error, "Unable to load subjects for this institution.")
            );
        } finally {
            setSubjectsLoading(false);
        }
    };

    // Add subject dialog for specific enrollment
    const openAddSubjectDialog = async (
        teacherEnrollment: TeacherEnrollmentResponse,
        enrollmentItem: EnrollmentResponseItem
    ) => {
        setDialog({ mode: "ADD_SUBJECT", teacherEnrollment, enrollmentItem });
        setAddSubjectId("");
        setAvailableSubjects([]);
        const uniId = teacherEnrollment.university?.id;
        if (!uniId) {
            toast.error("University information not found for this enrollment.");
            return;
        }

        setSubjectsLoading(true);
        try {
            const list = await getSubjectsForTeacherEnrollment(uniId);
            const existingIds = new Set(enrollmentItem.subjects.map((s) => s.id));
            setAvailableSubjects(list.filter((s) => !existingIds.has(s.id)));
        } catch (error) {
            toast.error(
                extractTeacherEnrollmentErrorMessage(error, "Unable to load subjects.")
            );
        } finally {
            setSubjectsLoading(false);
        }
    };

    // Submit Create Enrollment
    const handleCreateEnrollment = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedTeacherId) {
            toast.error("Please select a faculty member.");
            return;
        }
        if (selectedSubjectIds.length === 0) {
            toast.error("Please select at least one subject to enroll.");
            return;
        }

        setBusy(true);
        try {
            const requestPayload: TeacherEnrollmentRequest = {
                teacherId: Number(selectedTeacherId),
                subjectIds: selectedSubjectIds,
            };
            const response = await createTeacherEnrollment(requestPayload);
            setEnrollments((current) => {
                const idx = current.findIndex((item) => item.teacher.id === response.teacher.id);
                if (idx >= 0) {
                    const next = [...current];
                    next[idx] = response;
                    return next;
                }
                return [response, ...current];
            });
            toast.success(`Enrollment for ${response.teacher.name} created successfully.`);
            setNotice(
                `Teacher enrollment for ${response.teacher.name} created with ${selectedSubjectIds.length} subject(s).`
            );
            setDialog(null);
            setSelectedTeacherId("");
            setSelectedSubjectIds([]);
        } catch (error) {
            toast.error(
                extractTeacherEnrollmentErrorMessage(error, "Failed to create teacher enrollment.")
            );
        } finally {
            setBusy(false);
        }
    };

    // Submit Add Subject
    const handleAddSubjectSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!dialog?.teacherEnrollment || !dialog.enrollmentItem || !addSubjectId) return;
        setBusy(true);

        try {
            const updated = await addSubjectToEnrollment(
                dialog.teacherEnrollment.teacher.id,
                Number(addSubjectId),
                dialog.enrollmentItem.id
            );
            setEnrollments((current) =>
                current.map((item) => (item.teacher.id === updated.teacher.id ? updated : item))
            );
            toast.success("Subject added to enrollment successfully.");
            setDialog({
                mode: "VIEW",
                teacherEnrollment: updated,
            });
        } catch (error) {
            toast.error(extractTeacherEnrollmentErrorMessage(error, "Failed to add subject."));
        } finally {
            setBusy(false);
        }
    };

    // Confirm Remove Subject
    const handleRemoveSubjectConfirmed = async () => {
        if (!dialog?.teacherEnrollment || !dialog.enrollmentItem || !dialog.targetSubject) return;
        setBusy(true);

        try {
            const updated = await removeSubjectFromEnrollment(
                dialog.teacherEnrollment.teacher.id,
                dialog.targetSubject.id,
                dialog.enrollmentItem.id
            );
            setEnrollments((current) =>
                current.map((item) => (item.teacher.id === updated.teacher.id ? updated : item))
            );
            toast.success(`Subject ${dialog.targetSubject.name} removed from enrollment.`);
            setDialog({
                mode: "VIEW",
                teacherEnrollment: updated,
            });
        } catch (error) {
            toast.error(extractTeacherEnrollmentErrorMessage(error, "Failed to remove subject."));
        } finally {
            setBusy(false);
        }
    };

    // Confirm Delete Entire Allocation
    const handleDeleteEnrollmentConfirmed = async () => {
        if (!dialog?.teacherEnrollment || !dialog.enrollmentItem) return;
        setBusy(true);

        try {
            const updated = await deleteTeacherEnrollment(
                dialog.teacherEnrollment.teacher.id,
                dialog.enrollmentItem.id
            );
            setEnrollments((current) =>
                current.map((item) => (item.teacher.id === updated.teacher.id ? updated : item))
            );
            toast.success("Allocation deleted successfully.");
            if (updated.enrollmentResponses && updated.enrollmentResponses.length > 0) {
                setDialog({
                    mode: "VIEW",
                    teacherEnrollment: updated,
                });
            } else {
                setDialog(null);
            }
        } catch (error) {
            toast.error(extractTeacherEnrollmentErrorMessage(error, "Failed to delete allocation."));
        } finally {
            setBusy(false);
        }
    };

    // Filter available subjects in create modal
    const filteredAvailableSubjects = useMemo(() => {
        if (!subjectSearch.trim()) return availableSubjects;
        const q = subjectSearch.toLowerCase().trim();
        return availableSubjects.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                (s.code && s.code.toLowerCase().includes(q))
        );
    }, [availableSubjects, subjectSearch]);

    const toggleSelectAllSubjects = () => {
        if (selectedSubjectIds.length === filteredAvailableSubjects.length) {
            setSelectedSubjectIds([]);
        } else {
            setSelectedSubjectIds(filteredAvailableSubjects.map((s) => s.id));
        }
    };

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-5 p-3 text-slate-100 sm:space-y-6 sm:p-5 lg:p-7"
        >
            {/* Header Section */}
            <section className="space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span className="truncate">User Management</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Teacher Subject Enrollments</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Faculty Workload &amp; Academic Course Allocation
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Teacher Enrollments
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Manage faculty teaching assignments, subject allocations, course workloads, and governance audit trails.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            title="Refresh allocations"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-3 sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={refreshing || loading ? "animate-spin text-cyan-400" : ""}
                            />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setDialog({ mode: "CREATE" });
                                setSelectedTeacherId("");
                                setSelectedSubjectIds([]);
                                setAvailableSubjects([]);
                                setSubjectSearch("");
                            }}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Enroll Faculty</span>
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
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm ${pageError
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
                                <p className="font-semibold text-white">
                                    {pageError ? "Action Required" : "Success"}
                                </p>
                                <p className="mt-0.5 leading-relaxed">{pageError || notice}</p>
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

            {/* Metric Statistics Cards */}
            <section
                aria-label="Enrollment statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    {
                        label: "Enrolled Faculty",
                        value: loading ? "—" : metrics.totalFaculty.toLocaleString("en-IN"),
                        sub: "Active workload profiles",
                        icon: Users,
                        color: "border-blue-400/30 bg-blue-500/10 text-blue-300",
                    },
                    {
                        label: "Total Allocations",
                        value: loading ? "—" : metrics.totalAllocations.toLocaleString("en-IN"),
                        sub: "Active teaching blocks",
                        icon: Layers,
                        color: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
                    },
                    {
                        label: "Active Allocations",
                        value: loading ? "—" : metrics.activeAllocations.toLocaleString("en-IN"),
                        sub: "Current semester active",
                        icon: BookCheck,
                        color: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
                    },
                    {
                        label: "Subjects Assigned",
                        value: loading ? "—" : metrics.totalAssignedSubjects.toLocaleString("en-IN"),
                        sub: "Total course mappings",
                        icon: BookOpen,
                        color: "border-purple-400/30 bg-purple-500/10 text-purple-300",
                    },
                ].map((stat) => (
                    <GlassCard key={stat.label} className="p-3.5 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 truncate">
                                {stat.label}
                            </span>
                            <div
                                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border ${stat.color} shrink-0`}
                            >
                                <stat.icon size={17} />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                                {stat.value}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 truncate">{stat.sub}</p>
                    </GlassCard>
                ))}
            </section>

            {/* Filter Toolbar Card */}
            <GlassCard className="p-3.5 sm:p-4">
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* Search Input */}
                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search faculty name, code, subject..."
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

                        {/* Institution Filter */}
                        <div className="relative">
                            <select
                                value={universityFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setUniversityFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Institutions
                                </option>
                                {universityOptions.map((u) => (
                                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Subject Filter */}
                        <div className="relative">
                            <select
                                value={subjectFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSubjectFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Subjects
                                </option>
                                {subjectOptions.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                                        {s.name} {s.code ? `(${s.code})` : ""}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Sort & Reset */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortMode)}
                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                                >
                                    <option value="NAME_ASC" className="bg-slate-900 text-white">
                                        Faculty (A-Z)
                                    </option>
                                    <option value="NAME_DESC" className="bg-slate-900 text-white">
                                        Faculty (Z-A)
                                    </option>
                                    <option value="SUBJECTS_DESC" className="bg-slate-900 text-white">
                                        Most Subjects
                                    </option>
                                    <option value="ENROLLMENTS_DESC" className="bg-slate-900 text-white">
                                        Most Allocations
                                    </option>
                                </select>
                                <ArrowDownUp
                                    size={13}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                            </div>

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
                    </div>
                </div>
            </GlassCard>

            {/* List Presentation: Dual-View (Desktop Table + Mobile Cards) */}
            <GlassCard>
                {/* 1. Desktop Table View (hidden on sm/mobile) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th scope="col" className="px-5 py-4 w-12 text-center">
                                    #
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[220px]">
                                    Faculty &amp; Auditor
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[150px]">
                                    Institution
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[150px]">
                                    Allocations &amp; Status
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[220px]">
                                    Assigned Teaching Subjects
                                </th>
                                <th scope="col" className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="inline-flex flex-col items-center justify-center gap-3">
                                            <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                                            <p className="font-semibold text-slate-200">
                                                Loading teacher enrollments...
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Fetching workload allocations and subject mappings
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageError && enrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load teacher enrollments
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
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
                            ) : paginatedEnrollments.length > 0 ? (
                                paginatedEnrollments.map((entry, index) => {
                                    const primaryEnr = entry.enrollmentResponses[0];
                                    const totalSubjectsCount = entry.enrollmentResponses.reduce(
                                        (sum, enr) => sum + enr.subjects.length,
                                        0
                                    );

                                    return (
                                        <motion.tr
                                            key={entry.teacher.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.035]"
                                        >
                                            {/* Index */}
                                            <td className="px-5 py-4 text-slate-500 text-xs text-center font-mono">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>

                                            {/* Faculty Profile & Creator Pill (Exact University.tsx Matching) */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                        {getInitials(entry.teacher.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {entry.teacher.name}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                ID #{entry.teacher.id}
                                                            </span>
                                                            {entry.teacher.code && (
                                                                <>
                                                                    <span className="text-slate-600">·</span>
                                                                    <span className="font-mono text-[11px] text-cyan-400 truncate max-w-[100px]">
                                                                        @{entry.teacher.code}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {primaryEnr?.createdBy?.name && (
                                                                <>
                                                                    <span className="text-slate-600">·</span>
                                                                    <span
                                                                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                        title={`Allocated by: ${formatAuditActor(
                                                                            primaryEnr.createdBy
                                                                        )}${primaryEnr.createdAt
                                                                                ? ` on ${formatDate(
                                                                                    primaryEnr.createdAt
                                                                                )}`
                                                                                : ""
                                                                            }${primaryEnr.updatedBy?.name
                                                                                ? ` | Modified by: ${formatAuditActor(
                                                                                    primaryEnr.updatedBy
                                                                                )}`
                                                                                : ""
                                                                            }`}
                                                                    >
                                                                        <UserCheck
                                                                            size={11}
                                                                            className="text-emerald-400 shrink-0"
                                                                        />
                                                                        <span className="truncate max-w-[110px] font-medium text-slate-300">
                                                                            {primaryEnr.createdBy.name}
                                                                        </span>
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Institution */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={13} className="text-cyan-400 shrink-0" />
                                                    <span className="font-medium text-slate-200 truncate max-w-[160px]">
                                                        {entry.university?.name || "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Allocations & Status */}
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <span className="text-xs font-semibold text-cyan-300">
                                                        {entry.enrollmentResponses.length} allocation(s)
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {entry.enrollmentResponses.map((enr) => (
                                                            <span
                                                                key={enr.id}
                                                                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${statusTone(
                                                                    enr.status
                                                                )}`}
                                                            >
                                                                #{enr.id} · {enr.status}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned Subjects */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[320px]">
                                                    {entry.enrollmentResponses
                                                        .flatMap((e) => e.subjects)
                                                        .slice(0, 3)
                                                        .map((s) => (
                                                            <span
                                                                key={s.id}
                                                                className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200 truncate max-w-[120px]"
                                                                title={s.name}
                                                            >
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                    {totalSubjectsCount > 3 && (
                                                        <span className="text-xs text-slate-500 self-center">
                                                            +{totalSubjectsCount - 3} more
                                                        </span>
                                                    )}
                                                    {totalSubjectsCount === 0 && (
                                                        <span className="text-xs text-slate-500 italic">
                                                            No subjects assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions with strict h-8 w-8 shrink-0 */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View Details */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setViewTab("allocations");
                                                            setDialog({
                                                                mode: "VIEW",
                                                                teacherEnrollment: entry,
                                                            });
                                                        }}
                                                        aria-label={`View allocations of ${entry.teacher.name}`}
                                                        title="View Overview & Audit Details"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Add Subject to Allocation (if primary allocation exists) */}
                                                    {primaryEnr && hasEnrollmentPermission(primaryEnr, "UPDATE") && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void openAddSubjectDialog(entry, primaryEnr)
                                                            }
                                                            aria-label={`Add subject for ${entry.teacher.name}`}
                                                            title="Add Subject to Allocation"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                        >
                                                            <Plus size={15} />
                                                        </button>
                                                    )}

                                                    {/* Delete Allocation */}
                                                    {primaryEnr && hasEnrollmentPermission(primaryEnr, "UPDATE") && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDialog({
                                                                    mode: "DELETE_ENROLLMENT",
                                                                    teacherEnrollment: entry,
                                                                    enrollmentItem: primaryEnr,
                                                                })
                                                            }
                                                            aria-label={`Delete allocation for ${entry.teacher.name}`}
                                                            title="Delete Allocation"
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
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <BookOpen size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching enrollments found"
                                                : "No teacher enrollments registered yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search terms or resetting your filters."
                                                : "Get started by allocating faculty members to teaching subjects."}
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
                                                    onClick={() => {
                                                        setDialog({ mode: "CREATE" });
                                                        setSelectedTeacherId("");
                                                        setSelectedSubjectIds([]);
                                                        setAvailableSubjects([]);
                                                        setSubjectSearch("");
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plus size={14} />
                                                    Enroll Faculty
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. Mobile Card View (sm:hidden) */}
                <div className="divide-y divide-white/5 sm:hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <LoaderCircle size={28} className="animate-spin text-cyan-400 mx-auto" />
                            <p className="mt-3 text-xs font-semibold text-slate-200">
                                Loading teacher enrollments...
                            </p>
                        </div>
                    ) : pageError && enrollments.length === 0 ? (
                        <div className="p-6 text-center">
                            <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                            <p className="mt-2 text-xs font-semibold text-white">
                                Failed to load enrollments
                            </p>
                            <button
                                type="button"
                                onClick={() => void loadData()}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                            >
                                <RefreshCw size={13} /> Retry
                            </button>
                        </div>
                    ) : paginatedEnrollments.length > 0 ? (
                        paginatedEnrollments.map((entry) => {
                            const primaryEnr = entry.enrollmentResponses[0];
                            const totalSubjectsCount = entry.enrollmentResponses.reduce(
                                (sum, enr) => sum + enr.subjects.length,
                                0
                            );

                            return (
                                <article key={entry.teacher.id} className="p-3.5 space-y-3">
                                    {/* Header: Faculty + Institution */}
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                {getInitials(entry.teacher.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-white text-sm truncate">
                                                    {entry.teacher.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                                                    <span className="font-mono text-[11px] text-slate-500">
                                                        ID #{entry.teacher.id}
                                                    </span>
                                                    {entry.teacher.code && (
                                                        <>
                                                            <span>·</span>
                                                            <span className="font-mono text-[11px] text-cyan-400 truncate">
                                                                @{entry.teacher.code}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {entry.university && (
                                            <span className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 truncate max-w-[120px]">
                                                {entry.university.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Breakdown Grid */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Allocations:</span>
                                            <span className="font-semibold text-cyan-300">
                                                {entry.enrollmentResponses.length} active
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Assigned Subjects:</span>
                                            <span className="font-semibold text-white">
                                                {totalSubjectsCount} subject(s)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Subject Tags */}
                                    <div className="flex flex-wrap gap-1">
                                        {entry.enrollmentResponses
                                            .flatMap((e) => e.subjects)
                                            .slice(0, 4)
                                            .map((s) => (
                                                <span
                                                    key={s.id}
                                                    className="rounded border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200"
                                                >
                                                    {s.name}
                                                </span>
                                            ))}
                                        {totalSubjectsCount > 4 && (
                                            <span className="text-[10px] text-slate-500 self-center">
                                                +{totalSubjectsCount - 4} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Mobile Audit Showcase Bar (Matching University.tsx) */}
                                    {primaryEnr?.createdBy?.name && (
                                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                                <span className="text-slate-500">Allocated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {primaryEnr.createdBy.name}
                                                </span>
                                                {primaryEnr.createdAt && (
                                                    <span className="text-slate-500 font-mono text-[10px]">
                                                        · {formatDate(primaryEnr.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            {primaryEnr.updatedBy?.name && (
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                    <span className="text-slate-500">Updated:</span>
                                                    <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                        {primaryEnr.updatedBy.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setViewTab("allocations");
                                                setDialog({
                                                    mode: "VIEW",
                                                    teacherEnrollment: entry,
                                                });
                                            }}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                                        >
                                            <Eye size={13} /> Details
                                        </button>
                                        {primaryEnr && hasEnrollmentPermission(primaryEnr, "UPDATE") && (
                                            <button
                                                type="button"
                                                onClick={() => void openAddSubjectDialog(entry, primaryEnr)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                            >
                                                <Plus size={13} /> Add Subject
                                            </button>
                                        )}
                                        {primaryEnr && hasEnrollmentPermission(primaryEnr, "UPDATE") && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDialog({
                                                        mode: "DELETE_ENROLLMENT",
                                                        teacherEnrollment: entry,
                                                        enrollmentItem: primaryEnr,
                                                    })
                                                }
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300"
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
                            No enrollments match your criteria.
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {sortedEnrollments.length === 0
                            ? "Showing 0 faculty enrollments"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                                currentPage * PAGE_SIZE,
                                sortedEnrollments.length
                            )} of ${sortedEnrollments.length} faculty record${sortedEnrollments.length === 1 ? "" : "s"
                            }`}
                    </p>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Teacher enrollment pagination"
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

            {/* Modals Container */}
            <AnimatePresence>
                {/* 1. CREATE ENROLLMENT MODAL */}
                {dialog?.mode === "CREATE" && (
                    <ModalShell
                        title="Enroll Faculty in Subjects"
                        subtitle="Assign teaching subjects and initialize workload allocation."
                        onClose={() => setDialog(null)}
                        wide
                        icon={BookUser}
                        iconTone="cyan"
                        busy={busy}
                    >
                        <form onSubmit={handleCreateEnrollment} className="space-y-4">
                            {/* Step 1: Select Faculty Member */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Faculty Member <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        disabled={busy}
                                        value={selectedTeacherId}
                                        onChange={(e) => void handleTeacherSelect(e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                    >
                                        <option value="" className="bg-slate-900 text-white">
                                            Select Faculty Member...
                                        </option>
                                        {teachersList.map((t) => (
                                            <option
                                                key={t.id}
                                                value={t.id}
                                                className="bg-slate-900 text-white"
                                            >
                                                {t.basicDetailRequest.firstName}{" "}
                                                {t.basicDetailRequest.lastName}{" "}
                                                ({t.basicDetailRequest.username || `#${t.id}`})
                                                {t.university ? ` · ${t.university.name}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <SelectChevron />
                                </div>
                                <span className="block text-[11px] text-slate-500">
                                    Selecting a faculty member automatically loads available subjects for their affiliated institution.
                                </span>
                            </div>

                            {/* Step 2: Subject Picker */}
                            {selectedTeacherId && (
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                            Select Subjects to Assign <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {filteredAvailableSubjects.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={toggleSelectAllSubjects}
                                                    className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition"
                                                >
                                                    {selectedSubjectIds.length ===
                                                        filteredAvailableSubjects.length
                                                        ? "Deselect All"
                                                        : "Select All"}
                                                </button>
                                            )}
                                            <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 text-xs text-cyan-300 font-semibold">
                                                {selectedSubjectIds.length} selected
                                            </span>
                                        </div>
                                    </div>

                                    {/* Subject Search */}
                                    <div className="relative">
                                        <Search
                                            size={14}
                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            value={subjectSearch}
                                            onChange={(e) => setSubjectSearch(e.target.value)}
                                            placeholder="Filter subjects by name or code..."
                                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                                        />
                                    </div>

                                    {subjectsLoading ? (
                                        <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2">
                                            <LoaderCircle size={16} className="animate-spin text-cyan-400" />
                                            Loading eligible subjects...
                                        </div>
                                    ) : availableSubjects.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                                            No available subjects found for this faculty member&apos;s institution.
                                        </div>
                                    ) : (
                                        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60 p-2.5 custom-scrollbar">
                                            {filteredAvailableSubjects.map((subject) => {
                                                const checked = selectedSubjectIds.includes(subject.id);
                                                return (
                                                    <label
                                                        key={subject.id}
                                                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl p-2.5 transition ${checked
                                                                ? "border border-cyan-400/40 bg-cyan-500/15"
                                                                : "border border-transparent bg-slate-900/60 hover:bg-white/5"
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) =>
                                                                setSelectedSubjectIds((prev) =>
                                                                    e.target.checked
                                                                        ? [...prev, subject.id]
                                                                        : prev.filter(
                                                                            (id) => id !== subject.id
                                                                        )
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <span className="block truncate text-xs sm:text-sm font-semibold text-slate-100">
                                                                {subject.name}
                                                            </span>
                                                            {subject.code && (
                                                                <span className="block text-[10px] font-mono text-cyan-300">
                                                                    {subject.code}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {checked && (
                                                            <Check size={16} className="shrink-0 text-cyan-400" />
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy || !selectedTeacherId || selectedSubjectIds.length === 0}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition disabled:opacity-50"
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={14} className="animate-spin" />
                                            <span>Enrolling...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={14} />
                                            <span>Create Enrollment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {/* 2. ADD SUBJECT TO ALLOCATION MODAL */}
                {dialog?.mode === "ADD_SUBJECT" &&
                    dialog.teacherEnrollment &&
                    dialog.enrollmentItem && (
                        <ModalShell
                            title="Add Subject to Allocation"
                            subtitle={`Allocation #${dialog.enrollmentItem.id} · ${dialog.teacherEnrollment.teacher.name}`}
                            onClose={() =>
                                dialog.teacherEnrollment
                                    ? setDialog({
                                          mode: "VIEW",
                                          teacherEnrollment: dialog.teacherEnrollment,
                                      })
                                    : setDialog(null)
                            }
                            icon={BookOpen}
                            iconTone="cyan"
                            busy={busy}
                        >
                            <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
                                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-200">
                                    Adding a subject to this active faculty allocation binds the subject syllabus and classroom workload to this teacher.
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Select Subject <span className="text-rose-400">*</span>
                                    </label>
                                    {subjectsLoading ? (
                                        <div className="flex items-center justify-center p-6 text-xs text-slate-400 gap-2">
                                            <LoaderCircle size={15} className="animate-spin text-cyan-400" />
                                            Loading eligible subjects...
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                required
                                                disabled={busy}
                                                value={addSubjectId}
                                                onChange={(e) =>
                                                    setAddSubjectId(
                                                        e.target.value ? Number(e.target.value) : ""
                                                    )
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                            >
                                                <option value="" className="bg-slate-900 text-white">
                                                    Select a subject to add...
                                                </option>
                                                {availableSubjects.map((s) => (
                                                    <option
                                                        key={s.id}
                                                        value={s.id}
                                                        className="bg-slate-900 text-white"
                                                    >
                                                        {s.name} {s.code ? `(${s.code})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dialog.teacherEnrollment
                                                ? setDialog({
                                                      mode: "VIEW",
                                                      teacherEnrollment: dialog.teacherEnrollment,
                                                  })
                                                : setDialog(null)
                                        }
                                        disabled={busy}
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy || !addSubjectId}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={14} />
                                                <span>Add Subject</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </ModalShell>
                    )}

                {/* 3. REMOVE SUBJECT CONFIRMATION MODAL */}
                {dialog?.mode === "REMOVE_SUBJECT" &&
                    dialog.teacherEnrollment &&
                    dialog.enrollmentItem &&
                    dialog.targetSubject && (
                        <ModalShell
                            title="Remove Subject Allocation"
                            subtitle={`Allocation #${dialog.enrollmentItem.id} · ${dialog.teacherEnrollment.teacher.name}`}
                            onClose={() =>
                                dialog.teacherEnrollment
                                    ? setDialog({
                                          mode: "VIEW",
                                          teacherEnrollment: dialog.teacherEnrollment,
                                      })
                                    : setDialog(null)
                            }
                            icon={AlertTriangle}
                            iconTone="amber"
                            busy={busy}
                        >
                            <div className="space-y-4 text-xs">
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 leading-relaxed text-amber-200">
                                    <p className="font-semibold text-white text-sm">Confirm Subject Removal</p>
                                    <p className="mt-1">
                                        Are you sure you want to remove{" "}
                                        <strong className="text-white">{dialog.targetSubject.name}</strong> from{" "}
                                        <strong className="text-white">
                                            {dialog.teacherEnrollment.teacher.name}
                                        </strong>
                                        &apos;s active allocation?
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dialog.teacherEnrollment
                                                ? setDialog({
                                                      mode: "VIEW",
                                                      teacherEnrollment: dialog.teacherEnrollment,
                                                  })
                                                : setDialog(null)
                                        }
                                        disabled={busy}
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleRemoveSubjectConfirmed()}
                                        disabled={busy}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500 transition disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Removing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <X size={14} />
                                                <span>Confirm Remove</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </ModalShell>
                    )}

                {/* 4. DELETE ENROLLMENT CONFIRMATION MODAL */}
                {dialog?.mode === "DELETE_ENROLLMENT" &&
                    dialog.teacherEnrollment &&
                    dialog.enrollmentItem && (
                        <ModalShell
                            title="Delete Entire Allocation"
                            subtitle={`Allocation #${dialog.enrollmentItem.id} · ${dialog.teacherEnrollment.teacher.name}`}
                            onClose={() =>
                                dialog.teacherEnrollment
                                    ? setDialog({
                                          mode: "VIEW",
                                          teacherEnrollment: dialog.teacherEnrollment,
                                      })
                                    : setDialog(null)
                            }
                            icon={Trash2}
                            iconTone="rose"
                            busy={busy}
                        >
                            <div className="space-y-4 text-xs">
                                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 leading-relaxed text-rose-200">
                                    <p className="font-semibold text-white text-sm">Permanent Deletion Warning</p>
                                    <p className="mt-1">
                                        Deleting this allocation will unbind all{" "}
                                        <strong>{dialog.enrollmentItem.subjects.length} subject(s)</strong> assigned
                                        under allocation #{dialog.enrollmentItem.id} for{" "}
                                        <strong className="text-white">
                                            {dialog.teacherEnrollment.teacher.name}
                                        </strong>
                                        . This action cannot be undone.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dialog.teacherEnrollment
                                                ? setDialog({
                                                      mode: "VIEW",
                                                      teacherEnrollment: dialog.teacherEnrollment,
                                                  })
                                                : setDialog(null)
                                        }
                                        disabled={busy}
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDeleteEnrollmentConfirmed()}
                                        disabled={busy}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={14} />
                                                <span>Delete Allocation</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </ModalShell>
                    )}

                {/* 5. VIEW DETAILS MODAL */}
                {dialog?.mode === "VIEW" && dialog.teacherEnrollment && (
                    <ModalShell
                        title="Faculty Allocation Details"
                        subtitle={dialog.teacherEnrollment.teacher.name}
                        onClose={() => setDialog(null)}
                        wide
                        icon={Eye}
                        iconTone="cyan"
                    >
                        <div className="space-y-4">
                            {/* Identity Header */}
                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/25 to-violet-500/20 font-bold text-sm text-cyan-200">
                                            {getInitials(dialog.teacherEnrollment.teacher.name)}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">
                                                {dialog.teacherEnrollment.teacher.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                ID #{dialog.teacherEnrollment.teacher.id}{" "}
                                                {dialog.teacherEnrollment.teacher.code &&
                                                    `· Code: ${dialog.teacherEnrollment.teacher.code}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {dialog.teacherEnrollment.university && (
                                            <span className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                                                {dialog.teacherEnrollment.university.name}
                                            </span>
                                        )}
                                        <span className="rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300">
                                            {dialog.teacherEnrollment.enrollmentResponses.length} Allocation(s)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* View Tab Navigation (Matching Teacher.tsx) */}
                            <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setViewTab("allocations")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                                        viewTab === "allocations"
                                            ? "border-cyan-400 text-cyan-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <BookOpen size={13} />
                                    <span>Allocations &amp; Workload</span>
                                    <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] text-cyan-300 font-mono">
                                        {dialog.teacherEnrollment.enrollmentResponses.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab("audit")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                                        viewTab === "audit"
                                            ? "border-cyan-400 text-cyan-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <ShieldCheck size={13} className="text-emerald-400" />
                                    <span>Audit Trail &amp; Governance</span>
                                </button>
                            </div>

                            {/* Tab 1: Allocations & Workload */}
                            {viewTab === "allocations" && (
                                <div className="space-y-4">
                                    {dialog.teacherEnrollment.enrollmentResponses.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                                            No active allocation blocks for this faculty member yet.
                                        </div>
                                    ) : (
                                        dialog.teacherEnrollment.enrollmentResponses.map((item) => (
                                            <div
                                                key={item.id}
                                                className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-3"
                                            >
                                                {/* Allocation Header */}
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white">
                                                            Allocation #{item.id}
                                                        </span>
                                                        <span
                                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                                                                item.status
                                                            )}`}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {hasEnrollmentPermission(item, "UPDATE") && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void openAddSubjectDialog(
                                                                            dialog.teacherEnrollment!,
                                                                            item
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                                                    title="Add subject to this allocation"
                                                                >
                                                                    <Plus size={12} />
                                                                    <span>Add Subject</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setDialog({
                                                                            mode: "DELETE_ENROLLMENT",
                                                                            teacherEnrollment: dialog.teacherEnrollment,
                                                                            enrollmentItem: item,
                                                                        })
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20"
                                                                    title="Delete this allocation block"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Subjects Section */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                                        <span className="font-semibold text-slate-300">
                                                            Assigned Subjects ({item.subjects.length})
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            Click &times; to unbind subject
                                                        </span>
                                                    </div>

                                                    {item.subjects.length === 0 ? (
                                                        <p className="text-xs text-slate-500 italic py-1">
                                                            No subjects mapped to this allocation block.
                                                        </p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.subjects.map((sub) => (
                                                                <div
                                                                    key={sub.id}
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200"
                                                                >
                                                                    <span className="font-medium">{sub.name}</span>
                                                                    {sub.code && (
                                                                        <span className="font-mono text-cyan-300 text-[10px]">
                                                                            ({sub.code})
                                                                        </span>
                                                                    )}
                                                                    {hasEnrollmentPermission(item, "UPDATE") && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setDialog({
                                                                                    mode: "REMOVE_SUBJECT",
                                                                                    teacherEnrollment: dialog.teacherEnrollment,
                                                                                    enrollmentItem: item,
                                                                                    targetSubject: sub,
                                                                                })
                                                                            }
                                                                            title={`Remove ${sub.name} from this allocation`}
                                                                            className="ml-0.5 rounded p-0.5 text-cyan-400/70 hover:bg-rose-500/20 hover:text-rose-300 transition"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Audit Trail & Governance Showcase (EXACT University.tsx Match) */}
                                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                                        <ShieldCheck size={13} className="text-emerald-400" />
                                                        Audit Trail &amp; Governance
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
                                                            {item.createdAt && (
                                                                <span className="text-slate-400 font-mono text-[10px]">
                                                                    {formatDate(item.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                                {getInitials(item.createdBy?.name || "System")}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                                    {item.createdBy?.name || "System Administrator"}
                                                                </p>
                                                                {(item.createdBy?.code || item.createdBy?.id) && (
                                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                        {item.createdBy.code
                                                                            ? `Code: ${item.createdBy.code}`
                                                                            : `ID: #${item.createdBy.id}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.createdAt && (
                                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                                <span className="truncate">
                                                                    Timestamp: {formatDateTime(item.createdAt)}
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
                                                            {(item.updatedAt || item.createdAt) && (
                                                                <span className="text-slate-400 font-mono text-[10px]">
                                                                    {formatDate(item.updatedAt || item.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                                {getInitials(
                                                                    item.updatedBy?.name ||
                                                                    item.createdBy?.name ||
                                                                    "System"
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                                    {item.updatedBy?.name ||
                                                                        item.createdBy?.name ||
                                                                        "System Administrator"}
                                                                </p>
                                                                {(item.updatedBy?.code || item.updatedBy?.id) && (
                                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                        {item.updatedBy.code
                                                                            ? `Code: ${item.updatedBy.code}`
                                                                            : `ID: #${item.updatedBy.id}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {(item.updatedAt || item.createdAt) && (
                                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                                <span className="truncate">
                                                                    Timestamp:{" "}
                                                                    {formatDateTime(
                                                                        item.updatedAt || item.createdAt
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Tab 2: Dedicated Audit Trail & Governance */}
                        {viewTab === "audit" && (
                            <div className="space-y-4">
                                {/* Institutional Governance Authority Card */}
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-emerald-400" />
                                            Institutional Governance Authority
                                        </span>
                                        <span className="rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                            Active RBAC
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg bg-slate-900/60 p-2.5 space-y-1">
                                            <span className="text-[10px] uppercase text-slate-500 block">Affiliated Institution</span>
                                            <span className="font-semibold text-white block">
                                                {dialog.teacherEnrollment.university?.name || "Global University System"}
                                            </span>
                                            {dialog.teacherEnrollment.university?.code && (
                                                <span className="font-mono text-[10px] text-cyan-300 block">
                                                    Code: {dialog.teacherEnrollment.university.code}
                                                </span>
                                            )}
                                        </div>

                                        <div className="rounded-lg bg-slate-900/60 p-2.5 space-y-1">
                                            <span className="text-[10px] uppercase text-slate-500 block">Target Resource</span>
                                            <span className="font-semibold text-white block">
                                                TEACHER · #{dialog.teacherEnrollment.teacher.id}
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-400 block">
                                                {dialog.teacherEnrollment.teacher.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Allocations Audit Records */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Allocation Governance Trails ({dialog.teacherEnrollment.enrollmentResponses.length})
                                        </p>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            BaseAuditableEntity Records
                                        </span>
                                    </div>

                                    {dialog.teacherEnrollment.enrollmentResponses.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                                            No allocation history records available.
                                        </div>
                                    ) : (
                                        dialog.teacherEnrollment.enrollmentResponses.map((item) => (
                                            <div
                                                key={item.id}
                                                className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-3"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white">
                                                            Allocation Block #{item.id}
                                                        </span>
                                                        <span
                                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                                                                item.status
                                                            )}`}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    {/* Permission Badges */}
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        <span className="text-[10px] text-slate-500 mr-1">Permissions:</span>
                                                        {item.permissionActions.map((perm) => (
                                                            <span
                                                                key={perm}
                                                                className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300"
                                                            >
                                                                {perm}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Audit Cards Grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                    {/* Created By */}
                                                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1.5">
                                                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <UserCheck size={11} /> Created By
                                                            </span>
                                                            {item.createdAt && (
                                                                <span className="text-slate-400 font-mono text-[10px]">
                                                                    {formatDate(item.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                                {getInitials(item.createdBy?.name || "System")}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                                    {item.createdBy?.name || "System Administrator"}
                                                                </p>
                                                                {(item.createdBy?.code || item.createdBy?.id) && (
                                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                        {item.createdBy.code
                                                                            ? `Code: ${item.createdBy.code}`
                                                                            : `ID: #${item.createdBy.id}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.createdAt && (
                                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                                <span className="truncate">
                                                                    Timestamp: {formatDateTime(item.createdAt)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Last Modified By */}
                                                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                        <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <RotateCcw size={11} /> Last Modified By
                                                            </span>
                                                            {(item.updatedAt || item.createdAt) && (
                                                                <span className="text-slate-400 font-mono text-[10px]">
                                                                    {formatDate(item.updatedAt || item.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                                {getInitials(
                                                                    item.updatedBy?.name ||
                                                                        item.createdBy?.name ||
                                                                        "System"
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                                    {item.updatedBy?.name ||
                                                                        item.createdBy?.name ||
                                                                        "System Administrator"}
                                                                </p>
                                                                {(item.updatedBy?.code || item.updatedBy?.id) && (
                                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                        {item.updatedBy.code
                                                                            ? `Code: ${item.updatedBy.code}`
                                                                            : `ID: #${item.updatedBy.id}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {(item.updatedAt || item.createdAt) && (
                                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                                <span className="truncate">
                                                                    Timestamp:{" "}
                                                                    {formatDateTime(
                                                                        item.updatedAt || item.createdAt
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Audit Compliance Footer Note */}
                                <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 text-xs text-slate-400 flex items-start gap-2.5">
                                    <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">
                                        All teacher enrollments and subject assignments adhere to system-wide audit logging. Each modification record persists the operator ID, role authority, and timestamp for institutional accreditation and inspection.
                                    </p>
                                </div>
                            </div>
                        )}

                            <div className="flex justify-end border-t border-white/10 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
