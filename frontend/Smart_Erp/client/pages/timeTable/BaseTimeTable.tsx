import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownUp,
    Bell,
    Building2,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Coffee,
    Eye,
    Layers,
    ListOrdered,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    School as SchoolIcon,
    Search,
    ShieldAlert,
    Sparkles,
    Trash2,
    Utensils,
    X,
} from "lucide-react";

import {
    createBaseTemplate,
    extractErrorMessage,
    formatAuditActor,
    formatDate,
    formatTimeDisplay,
    getAllBaseTemplates,
    getBaseTemplate,
    getSchoolFilter,
    type BasePeriodType,
    type BaseTimeTableRequest,
    type BaseTimeTableResponse,
    type CommonDTO,
    type PeriodRequest,
    type PeriodResponse,
    BASE_PERIOD_TYPES,
} from "@/services/timetable/baseTimetableService";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

type DialogMode = "CREATE" | "VIEW" | null;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "PERIODS_DESC";

interface FormPeriodState {
    id: string; // client-side key
    sequenceNumber: number;
    periodNumber: number | "";
    periodType: BasePeriodType;
    label: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    active: boolean;
}

interface BaseTemplateFormState {
    name: string;
    description: string;
    schoolId: number | "";
    dayStartTime: string;
    dayEndTime: string;
    periodsPerDay: number | "";
    defaultPeriodDurationMinutes: number | "";
    defaultBreakDurationMinutes: number | "";
    assemblyStartTime: string;
    assemblyEndTime: string;
    active: boolean;
    periods: FormPeriodState[];
}

const DEFAULT_FORM: BaseTemplateFormState = {
    name: "",
    description: "",
    schoolId: "",
    dayStartTime: "08:30",
    dayEndTime: "15:30",
    periodsPerDay: 7,
    defaultPeriodDurationMinutes: 45,
    defaultBreakDurationMinutes: 15,
    assemblyStartTime: "08:30",
    assemblyEndTime: "08:50",
    active: true,
    periods: [],
};

interface FormErrors {
    name?: string;
    schoolId?: string;
    dayStartTime?: string;
    dayEndTime?: string;
    periodsPerDay?: string;
    periods?: string;
}

/* -------------------------------------------------------------------------- */
/* Helper Functions                                                           */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
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

function StatusBadge({ active }: { active: boolean }) {
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

function PeriodTypeBadge({ type }: { type: BasePeriodType }) {
    switch (type) {
        case "CLASS":
            return (
                <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                    <Clock size={11} /> Class
                </span>
            );
        case "BREAK":
            return (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                    <Coffee size={11} /> Break
                </span>
            );
        case "LUNCH":
            return (
                <span className="inline-flex items-center gap-1 rounded-md border border-rose-400/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                    <Utensils size={11} /> Lunch
                </span>
            );
        case "ASSEMBLY":
            return (
                <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-300">
                    <Bell size={11} /> Assembly
                </span>
            );
        case "ACTIVITY":
            return (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <Sparkles size={11} /> Activity
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    {type}
                </span>
            );
    }
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
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                <div className="min-w-0">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 break-words text-xs sm:text-sm">{message}</p>
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

// Convert "HH:mm" to minutes from midnight
function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}

// Convert minutes from midnight to "HH:mm"
function minutesToTime(m: number): string {
    const hours = Math.floor(m / 60) % 24;
    const mins = m % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function BaseTimeTablePage() {
    const [templates, setTemplates] = useState<BaseTimeTableResponse[]>([]);
    const [schools, setSchools] = useState<CommonDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [schoolsLoading, setSchoolsLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [schoolFilter, setSchoolFilter] = useState<number | "ALL">("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sortOption, setSortOption] = useState<SortOption>("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);

    // Dialog state
    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<BaseTimeTableResponse | null>(null);
    const [formState, setFormState] = useState<BaseTemplateFormState>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    /* ---------------------------------------------------------------------- */
    /* Data Fetching                                                          */
    /* ---------------------------------------------------------------------- */

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const data = await getAllBaseTemplates();
            setTemplates(data);
        } catch (err) {
            setErrorMessage(extractErrorMessage(err, "Failed to load base timetable templates."));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSchools = useCallback(async () => {
        setSchoolsLoading(true);
        try {
            const data = await getSchoolFilter();
            setSchools(data);
        } catch {
            setSchools([]);
        } finally {
            setSchoolsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
        loadSchools();
    }, [loadTemplates, loadSchools]);

    /* ---------------------------------------------------------------------- */
    /* Filtering and Sorting                                                  */
    /* ---------------------------------------------------------------------- */

    const filteredTemplates = useMemo(() => {
        return templates.filter((t) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchesName = t.name.toLowerCase().includes(q);
                const matchesDesc = (t.description ?? "").toLowerCase().includes(q);
                const matchesSchool = (t.school?.name ?? "").toLowerCase().includes(q);
                if (!matchesName && !matchesDesc && !matchesSchool) return false;
            }

            if (schoolFilter !== "ALL" && t.school?.id !== schoolFilter) {
                return false;
            }

            if (statusFilter === "ACTIVE" && !t.active) return false;
            if (statusFilter === "INACTIVE" && t.active) return false;

            return true;
        });
    }, [templates, searchQuery, schoolFilter, statusFilter]);

    const sortedTemplates = useMemo(() => {
        const list = [...filteredTemplates];
        switch (sortOption) {
            case "NAME_ASC":
                return list.sort((a, b) => a.name.localeCompare(b.name));
            case "NAME_DESC":
                return list.sort((a, b) => b.name.localeCompare(a.name));
            case "PERIODS_DESC":
                return list.sort((a, b) => b.periodsPerDay - a.periodsPerDay);
            case "NEWEST":
            default:
                return list.sort((a, b) => b.id - a.id);
        }
    }, [filteredTemplates, sortOption]);

    const totalPages = Math.max(1, Math.ceil(sortedTemplates.length / PAGE_SIZE));
    const paginatedTemplates = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedTemplates.slice(start, start + PAGE_SIZE);
    }, [sortedTemplates, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, schoolFilter, statusFilter, sortOption]);

    /* ---------------------------------------------------------------------- */
    /* Stats                                                                  */
    /* ---------------------------------------------------------------------- */

    const stats = useMemo(() => {
        const total = templates.length;
        const activeCount = templates.filter((t) => t.active).length;
        const totalPeriods = templates.reduce((sum, t) => sum + (t.periodsPerDay || 0), 0);
        const avgPeriods = total > 0 ? (totalPeriods / total).toFixed(1) : "0";
        const uniqueSchools = new Set(templates.map((t) => t.school?.id).filter(Boolean)).size;

        return { total, activeCount, avgPeriods, uniqueSchools };
    }, [templates]);

    /* ---------------------------------------------------------------------- */
    /* Period Auto-Generator                                                  */
    /* ---------------------------------------------------------------------- */

    const handleAutoGeneratePeriods = () => {
        const startMin = timeToMinutes(formState.dayStartTime);
        const endMin = timeToMinutes(formState.dayEndTime);
        const periodsCount = Number(formState.periodsPerDay) || 7;
        const periodDur = Number(formState.defaultPeriodDurationMinutes) || 45;
        const breakDur = Number(formState.defaultBreakDurationMinutes) || 15;

        if (endMin <= startMin) {
            toast.error("Day end time must be after day start time.");
            return;
        }

        const generated: FormPeriodState[] = [];
        let curMin = startMin;
        let seq = 1;
        let classNumber = 1;

        // Optional Assembly
        if (formState.assemblyStartTime && formState.assemblyEndTime) {
            const asmStart = timeToMinutes(formState.assemblyStartTime);
            const asmEnd = timeToMinutes(formState.assemblyEndTime);
            if (asmEnd > asmStart) {
                generated.push({
                    id: `gen-asm-${seq}`,
                    sequenceNumber: seq++,
                    periodNumber: "",
                    periodType: "ASSEMBLY",
                    label: "Morning Assembly",
                    startTime: formState.assemblyStartTime,
                    endTime: formState.assemblyEndTime,
                    durationMinutes: asmEnd - asmStart,
                    active: true,
                });
                curMin = Math.max(curMin, asmEnd);
            }
        }

        // Divide class periods with smart breaks:
        // Halfway lunch, and short break after period 2 or 3
        const breakAfter = Math.min(3, Math.floor(periodsCount / 3) || 2);
        const lunchAfter = Math.min(5, Math.ceil(periodsCount / 2));

        for (let i = 1; i <= periodsCount; i++) {
            const pStart = curMin;
            const pEnd = curMin + periodDur;

            generated.push({
                id: `gen-class-${i}`,
                sequenceNumber: seq++,
                periodNumber: classNumber,
                periodType: "CLASS",
                label: `Period ${classNumber}`,
                startTime: minutesToTime(pStart),
                endTime: minutesToTime(pEnd),
                durationMinutes: periodDur,
                active: true,
            });

            classNumber++;
            curMin = pEnd;

            // Insert Morning Break
            if (i === breakAfter && i < periodsCount) {
                const bEnd = curMin + breakDur;
                generated.push({
                    id: `gen-brk-${seq}`,
                    sequenceNumber: seq++,
                    periodNumber: "",
                    periodType: "BREAK",
                    label: "Recess Break",
                    startTime: minutesToTime(curMin),
                    endTime: minutesToTime(bEnd),
                    durationMinutes: breakDur,
                    active: true,
                });
                curMin = bEnd;
            }

            // Insert Lunch
            if (i === lunchAfter && i < periodsCount) {
                const lunchDur = Math.max(30, breakDur * 2);
                const lEnd = curMin + lunchDur;
                generated.push({
                    id: `gen-lunch-${seq}`,
                    sequenceNumber: seq++,
                    periodNumber: "",
                    periodType: "LUNCH",
                    label: "Lunch Interval",
                    startTime: minutesToTime(curMin),
                    endTime: minutesToTime(lEnd),
                    durationMinutes: lunchDur,
                    active: true,
                });
                curMin = lEnd;
            }
        }

        setFormState((prev) => ({
            ...prev,
            periods: generated,
            dayEndTime: minutesToTime(curMin),
        }));

        toast.success(`Generated ${generated.length} period slots (${periodsCount} class periods).`);
    };

    /* ---------------------------------------------------------------------- */
    /* Form Handlers                                                          */
    /* ---------------------------------------------------------------------- */

    const openCreateDialog = () => {
        setFormState({
            ...DEFAULT_FORM,
            schoolId: schools.length > 0 ? schools[0].id : "",
        });
        setFormErrors({});
        setDialogMode("CREATE");
    };

    const openViewDialog = async (template: BaseTimeTableResponse) => {
        setSelectedTemplate(template);
        setDialogMode("VIEW");
        // Fresh fetch
        try {
            const fresh = await getBaseTemplate(template.id);
            setSelectedTemplate(fresh);
        } catch {
            // Keep preview
        }
    };

    const closeDialog = () => {
        setDialogMode(null);
        setSelectedTemplate(null);
        setFormErrors({});
    };

    const addManualPeriod = () => {
        setFormState((prev) => {
            const nextSeq = prev.periods.length + 1;
            const lastPeriod = prev.periods[prev.periods.length - 1];
            const startTime = lastPeriod ? lastPeriod.endTime : prev.dayStartTime;
            const dur = Number(prev.defaultPeriodDurationMinutes) || 45;
            const startMin = timeToMinutes(startTime);
            const endTime = minutesToTime(startMin + dur);

            const classCount = prev.periods.filter((p) => p.periodType === "CLASS").length + 1;

            const newPeriod: FormPeriodState = {
                id: `manual-${Date.now()}`,
                sequenceNumber: nextSeq,
                periodNumber: classCount,
                periodType: "CLASS",
                label: `Period ${classCount}`,
                startTime,
                endTime,
                durationMinutes: dur,
                active: true,
            };

            return {
                ...prev,
                periods: [...prev.periods, newPeriod],
            };
        });
    };

    const removePeriod = (index: number) => {
        setFormState((prev) => {
            const updated = prev.periods.filter((_, i) => i !== index);
            // Re-sequence
            let classIdx = 1;
            const resequenced = updated.map((p, idx) => {
                const isClass = p.periodType === "CLASS";
                return {
                    ...p,
                    sequenceNumber: idx + 1,
                    periodNumber: isClass ? classIdx++ : "",
                    label: isClass && p.label.startsWith("Period ") ? `Period ${classIdx - 1}` : p.label,
                };
            });
            return {
                ...prev,
                periods: resequenced,
            };
        });
    };

    const updatePeriodField = (
        index: number,
        field: keyof FormPeriodState,
        val: unknown
    ) => {
        setFormState((prev) => {
            const updated = [...prev.periods];
            const current = { ...updated[index], [field]: val };

            // When start or end time changes, recalculate duration
            if (field === "startTime" || field === "endTime") {
                const s = timeToMinutes(field === "startTime" ? String(val) : current.startTime);
                const e = timeToMinutes(field === "endTime" ? String(val) : current.endTime);
                if (e > s) {
                    current.durationMinutes = e - s;
                }
            }

            // If changing to non-class, clear periodNumber
            if (field === "periodType") {
                if (val !== "CLASS") {
                    current.periodNumber = "";
                } else if (!current.periodNumber) {
                    const classCount = updated.filter((p, i) => i !== index && p.periodType === "CLASS").length + 1;
                    current.periodNumber = classCount;
                }
            }

            updated[index] = current;
            return { ...prev, periods: updated };
        });
    };

    const handleSubmitCreate = async (e: FormEvent) => {
        e.preventDefault();
        const errors: FormErrors = {};

        if (!formState.name.trim()) errors.name = "Template name is required.";
        if (!formState.schoolId) errors.schoolId = "Please select a school.";
        if (!formState.dayStartTime) errors.dayStartTime = "Start time is required.";
        if (!formState.dayEndTime) errors.dayEndTime = "End time is required.";
        if (timeToMinutes(formState.dayEndTime) <= timeToMinutes(formState.dayStartTime)) {
            errors.dayEndTime = "Day end time must be after day start time.";
        }

        const periodsPerDay = Number(formState.periodsPerDay);
        if (!periodsPerDay || periodsPerDay <= 0) {
            errors.periodsPerDay = "Number of periods per day must be at least 1.";
        }

        if (formState.periods.length === 0) {
            errors.periods = "Please define at least one period or click 'Auto-Generate Schedule'.";
        } else {
            const classPeriodsCount = formState.periods.filter((p) => p.periodType === "CLASS").length;
            if (classPeriodsCount !== periodsPerDay) {
                errors.periods = `periodsPerDay (${periodsPerDay}) must match the exact number of CLASS rows (${classPeriodsCount}).`;
            }
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error("Please fix the validation errors before saving.");
            return;
        }

        const payload: BaseTimeTableRequest = {
            name: formState.name.trim(),
            description: formState.description.trim() || undefined,
            schoolId: Number(formState.schoolId),
            dayStartTime: formState.dayStartTime,
            dayEndTime: formState.dayEndTime,
            periodsPerDay,
            defaultPeriodDurationMinutes: Number(formState.defaultPeriodDurationMinutes) || 45,
            defaultBreakDurationMinutes: Number(formState.defaultBreakDurationMinutes) || 15,
            assemblyStartTime: formState.assemblyStartTime || null,
            assemblyEndTime: formState.assemblyEndTime || null,
            active: formState.active,
            periods: formState.periods.map((p, idx) => ({
                sequenceNumber: idx + 1,
                periodNumber: p.periodNumber ? Number(p.periodNumber) : null,
                periodType: p.periodType,
                label: p.label.trim() || `Period ${idx + 1}`,
                startTime: p.startTime,
                endTime: p.endTime,
                durationMinutes: p.durationMinutes > 0 ? p.durationMinutes : 45,
                active: p.active,
            })),
        };

        setBusy(true);
        try {
            await createBaseTemplate(payload);
            toast.success("Base timetable template created successfully!");
            closeDialog();
            await loadTemplates();
        } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to create template."));
        } finally {
            setBusy(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/30 p-4 text-slate-100 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
                                <CalendarDays size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    Base Timetable Templates
                                </h1>
                                <p className="text-xs text-slate-400 sm:text-sm">
                                    Define school-level bell schedules, period durations, breaks, and daily timing foundations.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => loadTemplates()}
                            disabled={loading}
                            aria-label="Refresh templates"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreateDialog}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-95"
                        >
                            <Plus size={16} />
                            <span>New Template</span>
                        </button>
                    </div>
                </header>

                {/* Error Banner */}
                {errorMessage && (
                    <ErrorBanner
                        title="Failed to load templates"
                        message={errorMessage}
                        onRetry={loadTemplates}
                        onDismiss={() => setErrorMessage("")}
                    />
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-medium uppercase tracking-wider">Templates</span>
                            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-300">
                                <CalendarDays size={16} />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-white">{stats.total}</p>
                        <p className="mt-0.5 text-xs text-slate-400">Total registered</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-medium uppercase tracking-wider">Active</span>
                            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2 text-emerald-300">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-300">{stats.activeCount}</p>
                        <p className="mt-0.5 text-xs text-slate-400">Currently in use</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-medium uppercase tracking-wider">Avg Periods</span>
                            <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-2 text-purple-300">
                                <Clock size={16} />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-purple-300">{stats.avgPeriods}</p>
                        <p className="mt-0.5 text-xs text-slate-400">Periods / day</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-medium uppercase tracking-wider">Schools</span>
                            <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-2 text-amber-300">
                                <SchoolIcon size={16} />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-amber-300">{stats.uniqueSchools}</p>
                        <p className="mt-0.5 text-xs text-slate-400">Covered institutions</p>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search by template name, description, school..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 sm:text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* School Filter */}
                        <div className="relative min-w-[170px]">
                            <select
                                aria-label="Filter by School"
                                value={schoolFilter}
                                onChange={(e) =>
                                    setSchoolFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
                                }
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 pr-8 text-xs text-slate-200 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            >
                                <option value="ALL">All Schools</option>
                                {schools.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Status Filter */}
                        <div className="relative min-w-[130px]">
                            <select
                                aria-label="Filter by Status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 pr-8 text-xs text-slate-200 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active only</option>
                                <option value="INACTIVE">Inactive only</option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Sort Option */}
                        <div className="relative min-w-[140px]">
                            <select
                                aria-label="Sort by"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 pr-8 text-xs text-slate-200 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            >
                                <option value="NEWEST">Newest first</option>
                                <option value="NAME_ASC">Name (A-Z)</option>
                                <option value="NAME_DESC">Name (Z-A)</option>
                                <option value="PERIODS_DESC">Most Periods</option>
                            </select>
                            <SelectChevron />
                        </div>
                    </div>
                </div>

                {/* Templates Grid / Cards */}
                {loading ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-slate-400">
                        <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                        <p className="mt-3 text-sm">Loading base timetable templates...</p>
                    </div>
                ) : paginatedTemplates.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center text-slate-400">
                        <CalendarDays size={40} className="text-slate-600" />
                        <p className="mt-3 text-base font-semibold text-slate-200">No timetable templates found</p>
                        <p className="mt-1 text-xs text-slate-500">
                            {searchQuery || schoolFilter !== "ALL" || statusFilter !== "ALL"
                                ? "Try adjusting your filters or search keywords."
                                : "Get started by creating your school's first base timetable template."}
                        </p>
                        <button
                            type="button"
                            onClick={openCreateDialog}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-600"
                        >
                            <Plus size={14} /> Create Template
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedTemplates.map((template) => {
                            const classCount = template.periods.filter((p) => p.periodType === "CLASS").length;
                            const breakCount = template.periods.filter(
                                (p) => p.periodType === "BREAK" || p.periodType === "LUNCH"
                            ).length;

                            return (
                                <motion.div
                                    key={template.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-md transition-all hover:border-cyan-400/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div>
                                        {/* Card Top: School & Status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                                                    <SchoolIcon size={13} className="shrink-0" />
                                                    <span className="truncate font-medium">
                                                        {template.school?.name || "Unassigned School"}
                                                    </span>
                                                </div>
                                                <h3 className="mt-1 truncate text-lg font-bold text-white transition group-hover:text-cyan-200">
                                                    {template.name}
                                                </h3>
                                            </div>
                                            <StatusBadge active={template.active} />
                                        </div>

                                        {template.description && (
                                            <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                                                {template.description}
                                            </p>
                                        )}

                                        {/* Timing details */}
                                        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-slate-950/50 p-2.5 text-xs">
                                            <div>
                                                <span className="block text-[11px] text-slate-500">Day Timing</span>
                                                <span className="font-semibold text-slate-200">
                                                    {formatTimeDisplay(template.dayStartTime)} – {formatTimeDisplay(template.dayEndTime)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] text-slate-500">Periods / Day</span>
                                                <span className="font-semibold text-cyan-300">
                                                    {template.periodsPerDay} periods ({template.defaultPeriodDurationMinutes}m)
                                                </span>
                                            </div>
                                            {template.assemblyStartTime && (
                                                <div className="col-span-2 pt-1">
                                                    <span className="block text-[11px] text-slate-500">Morning Assembly</span>
                                                    <span className="font-medium text-purple-300">
                                                        {formatTimeDisplay(template.assemblyStartTime)} – {formatTimeDisplay(template.assemblyEndTime)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Period preview chips */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                <span>Schedule Layout ({template.periods.length} slots)</span>
                                                <span className="text-[10px] text-slate-500">
                                                    {classCount} Classes • {breakCount} Breaks
                                                </span>
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap gap-1.5 overflow-hidden">
                                                {template.periods.slice(0, 5).map((p, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                                            p.periodType === "CLASS"
                                                                ? "bg-cyan-500/10 text-cyan-300 border border-cyan-400/20"
                                                                : p.periodType === "LUNCH"
                                                                ? "bg-rose-500/10 text-rose-300 border border-rose-400/20"
                                                                : "bg-amber-500/10 text-amber-300 border border-amber-400/20"
                                                        }`}
                                                    >
                                                        {p.label || `P${p.sequenceNumber}`} ({p.durationMinutes}m)
                                                    </span>
                                                ))}
                                                {template.periods.length > 5 && (
                                                    <span className="rounded-md border border-white/5 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                                                        +{template.periods.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3">
                                        <span className="text-[11px] text-slate-500">
                                            ID #{template.id}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => openViewDialog(template)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <Eye size={13} />
                                            <span>View Details</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-400">
                        <span>
                            Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                            {Math.min(currentPage * PAGE_SIZE, sortedTemplates.length)} of{" "}
                            {sortedTemplates.length} templates
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-40"
                                aria-label="First page"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-40"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-2 text-slate-200">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-40"
                                aria-label="Next page"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-40"
                                aria-label="Last page"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================== */}
            {/* VIEW TEMPLATE DETAILS MODAL                                    */}
            {/* ============================================================== */}
            {dialogMode === "VIEW" && selectedTemplate && (
                createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={closeDialog}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                        >
                            <header className="flex items-start justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2.5 text-cyan-300">
                                        <CalendarDays size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {selectedTemplate.name}
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            {selectedTemplate.school?.name} • ID #{selectedTemplate.id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </header>

                            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
                                {/* Summary banner */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                                        <span className="text-[11px] text-slate-500">Day Operating Hours</span>
                                        <p className="mt-1 font-semibold text-slate-100">
                                            {formatTimeDisplay(selectedTemplate.dayStartTime)} – {formatTimeDisplay(selectedTemplate.dayEndTime)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                                        <span className="text-[11px] text-slate-500">Class Periods / Day</span>
                                        <p className="mt-1 font-semibold text-cyan-300">
                                            {selectedTemplate.periodsPerDay} periods
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                                        <span className="text-[11px] text-slate-500">Period Duration</span>
                                        <p className="mt-1 font-semibold text-purple-300">
                                            {selectedTemplate.defaultPeriodDurationMinutes} minutes
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                                        <span className="text-[11px] text-slate-500">Break Duration</span>
                                        <p className="mt-1 font-semibold text-amber-300">
                                            {selectedTemplate.defaultBreakDurationMinutes ?? 15} minutes
                                        </p>
                                    </div>
                                </div>

                                {selectedTemplate.description && (
                                    <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3.5 text-xs text-slate-300">
                                        <span className="font-semibold text-white">Description: </span>
                                        {selectedTemplate.description}
                                    </div>
                                )}

                                {/* Period Schedule Table */}
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-white">
                                        Period Breakdown & Sequence ({selectedTemplate.periods.length} Slots)
                                    </h3>
                                    <div className="overflow-x-auto rounded-xl border border-white/10">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                <tr>
                                                    <th className="px-4 py-2.5">Seq #</th>
                                                    <th className="px-4 py-2.5">Class Period</th>
                                                    <th className="px-4 py-2.5">Type</th>
                                                    <th className="px-4 py-2.5">Label</th>
                                                    <th className="px-4 py-2.5">Time Interval</th>
                                                    <th className="px-4 py-2.5">Duration</th>
                                                    <th className="px-4 py-2.5">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedTemplate.periods.map((p) => (
                                                    <tr key={p.sequenceNumber} className="hover:bg-white/[0.02]">
                                                        <td className="px-4 py-2.5 font-mono font-medium text-slate-400">
                                                            #{p.sequenceNumber}
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            {p.periodNumber ? (
                                                                <span className="font-semibold text-cyan-300">
                                                                    Period {p.periodNumber}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <PeriodTypeBadge type={p.periodType} />
                                                        </td>
                                                        <td className="px-4 py-2.5 font-medium text-slate-200">
                                                            {p.label}
                                                        </td>
                                                        <td className="px-4 py-2.5 font-mono text-slate-300">
                                                            {formatTimeDisplay(p.startTime)} – {formatTimeDisplay(p.endTime)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-slate-400">
                                                            {p.durationMinutes} min
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <StatusBadge active={p.active} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Audit footer */}
                                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 text-[11px] text-slate-400 flex flex-wrap justify-between gap-2">
                                    <span>Created by: {formatAuditActor(selectedTemplate.createdBy)}</span>
                                    <span>Created: {formatDate(selectedTemplate.createdAt)}</span>
                                    {selectedTemplate.updatedAt && (
                                        <span>Last modified: {formatDate(selectedTemplate.updatedAt)}</span>
                                    )}
                                </div>
                            </div>

                            <footer className="flex justify-end border-t border-white/10 bg-slate-900/90 p-4">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                                >
                                    Close
                                </button>
                            </footer>
                        </motion.div>
                    </div>,
                    document.body
                )
            )}

            {/* ============================================================== */}
            {/* CREATE TEMPLATE MODAL                                          */}
            {/* ============================================================== */}
            {dialogMode === "CREATE" && (
                createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={closeDialog}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                        >
                            <header className="flex items-start justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2.5 text-cyan-300">
                                        <Plus size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Create Base Timetable Template</h2>
                                        <p className="text-xs text-slate-400">
                                            Define the school bell times and configure daily periods.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </header>

                            <form onSubmit={handleSubmitCreate} className="flex min-h-0 flex-1 flex-col">
                                <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
                                    {/* School & Template Name */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-300">
                                                School Institution <span className="text-rose-400">*</span>
                                            </label>
                                            <div className="relative mt-1.5">
                                                <select
                                                    value={formState.schoolId}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            schoolId: Number(e.target.value) || "",
                                                        }))
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 pr-8 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                                >
                                                    <option value="">Select a School...</option>
                                                    {schools.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <SelectChevron />
                                            </div>
                                            <FieldError>{formErrors.schoolId}</FieldError>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-300">
                                                Template Name <span className="text-rose-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Standard High School Bell Schedule"
                                                value={formState.name}
                                                onChange={(e) =>
                                                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                            />
                                            <FieldError>{formErrors.name}</FieldError>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">Description</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Optional notes or description of this bell schedule..."
                                            value={formState.description}
                                            onChange={(e) =>
                                                setFormState((prev) => ({ ...prev, description: e.target.value }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                        />
                                    </div>

                                    {/* Day Timings & Rules */}
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                                            Timing & Period Defaults
                                        </h3>

                                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400">
                                                    Day Start Time <span className="text-rose-400">*</span>
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formState.dayStartTime}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            dayStartTime: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                                <FieldError>{formErrors.dayStartTime}</FieldError>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-400">
                                                    Day End Time <span className="text-rose-400">*</span>
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formState.dayEndTime}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            dayEndTime: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                                <FieldError>{formErrors.dayEndTime}</FieldError>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-400">
                                                    Class Periods / Day <span className="text-rose-400">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={15}
                                                    value={formState.periodsPerDay}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            periodsPerDay: Number(e.target.value) || "",
                                                        }))
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                                <FieldError>{formErrors.periodsPerDay}</FieldError>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-400">
                                                    Period Duration (min) <span className="text-rose-400">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min={15}
                                                    max={180}
                                                    value={formState.defaultPeriodDurationMinutes}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            defaultPeriodDurationMinutes: Number(e.target.value) || "",
                                                        }))
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400">
                                                    Break Duration (min)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={5}
                                                    max={60}
                                                    value={formState.defaultBreakDurationMinutes}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            defaultBreakDurationMinutes: Number(e.target.value) || "",
                                                        }))
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-400">
                                                    Assembly Start (Optional)
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formState.assemblyStartTime}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            assemblyStartTime: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-400">
                                                    Assembly End (Optional)
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formState.assemblyEndTime}
                                                    onChange={(e) =>
                                                        setFormState((prev) => ({
                                                            ...prev,
                                                            assemblyEndTime: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Auto Generator Button */}
                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                                            <p className="text-xs text-slate-400">
                                                Generate period rows automatically based on the parameters above:
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleAutoGeneratePeriods}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 active:scale-95"
                                            >
                                                <Sparkles size={14} className="text-cyan-300" />
                                                <span>Auto-Generate Period Schedule</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Period Rows Table */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-white">
                                                    Periods Configuration ({formState.periods.length} rows)
                                                </h3>
                                                <p className="text-xs text-slate-400">
                                                    Requires exactly {formState.periodsPerDay || "N"} CLASS periods.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addManualPeriod}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                            >
                                                <Plus size={13} />
                                                <span>Add Slot</span>
                                            </button>
                                        </div>

                                        <FieldError>{formErrors.periods}</FieldError>

                                        {formState.periods.length === 0 ? (
                                            <div className="mt-3 rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                                                No periods configured yet. Click{" "}
                                                <strong className="text-cyan-300">
                                                    "Auto-Generate Period Schedule"
                                                </strong>{" "}
                                                above to create slots instantly.
                                            </div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {formState.periods.map((period, index) => (
                                                    <div
                                                        key={period.id}
                                                        className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-slate-950/60 p-2.5 text-xs sm:flex-nowrap"
                                                    >
                                                        <span className="w-8 shrink-0 font-mono font-medium text-slate-400">
                                                            #{period.sequenceNumber}
                                                        </span>

                                                        <div className="w-28 shrink-0">
                                                            <select
                                                                aria-label="Period Type"
                                                                value={period.periodType}
                                                                onChange={(e) =>
                                                                    updatePeriodField(
                                                                        index,
                                                                        "periodType",
                                                                        e.target.value as BasePeriodType
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                            >
                                                                {BASE_PERIOD_TYPES.map((type) => (
                                                                    <option key={type} value={type}>
                                                                        {type}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="flex-1 min-w-[120px]">
                                                            <input
                                                                type="text"
                                                                placeholder="Label (e.g. Period 1, Lunch)"
                                                                value={period.label}
                                                                onChange={(e) =>
                                                                    updatePeriodField(index, "label", e.target.value)
                                                                }
                                                                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                            />
                                                        </div>

                                                        <div className="w-24 shrink-0">
                                                            <input
                                                                type="time"
                                                                aria-label="Start time"
                                                                value={period.startTime}
                                                                onChange={(e) =>
                                                                    updatePeriodField(index, "startTime", e.target.value)
                                                                }
                                                                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                            />
                                                        </div>

                                                        <span className="text-slate-500">–</span>

                                                        <div className="w-24 shrink-0">
                                                            <input
                                                                type="time"
                                                                aria-label="End time"
                                                                value={period.endTime}
                                                                onChange={(e) =>
                                                                    updatePeriodField(index, "endTime", e.target.value)
                                                                }
                                                                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                                            />
                                                        </div>

                                                        <div className="w-16 shrink-0 text-center font-mono text-slate-400">
                                                            {period.durationMinutes}m
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => removePeriod(index)}
                                                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                                                            title="Delete Slot"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <footer className="flex items-center justify-end gap-3 border-t border-white/10 bg-slate-900/90 p-4">
                                    <button
                                        type="button"
                                        onClick={closeDialog}
                                        disabled={busy}
                                        className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={15} />
                                                <span>Create Template</span>
                                            </>
                                        )}
                                    </button>
                                </footer>
                            </form>
                        </motion.div>
                    </div>,
                    document.body
                )
            )}
        </div>
    );
}
