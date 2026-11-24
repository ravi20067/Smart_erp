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
    BookOpen,
    Building2,
    Calendar,
    CalendarDays,
    CalendarRange,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    DoorOpen,
    Eye,
    GraduationCap,
    Info,
    Layers,
    LayoutDashboard,
    ListOrdered,
    LoaderCircle,
    Megaphone,
    Pencil,
    Plus,
    Presentation,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import {
    createTimetableVersion,
    extractErrorMessage,
    getGroupTimetableVersions,
    getSectionTimetableVersions,
    getSubjectFilter,
    getTeacherFilter,
    publishTimetableVersion,
    type CommonDTO,
    type EntryRequest,
    type EntryResponse,
    type TimetableEntryType,
    type TimetableScope,
    type TimetableVersionRequest,
    type TimetableVersionResponse,
    type TimetableVersionStatus,
    type WeekDay,
    TIMETABLE_ENTRY_TYPES,
    TIMETABLE_SCOPES,
    WEEK_DAYS,
} from "@/services/timetable/timetableService";

import {
    getAllBaseTemplates,
    type BaseTimeTableResponse,
    type PeriodResponse,
} from "@/services/timetable/baseTimetableService";

import {
    getAllRooms,
    type RoomResponse,
} from "@/services/timetable/RoomService";

import {
    getSectionFilter,
} from "@/services/timetable/sectionCalendarService";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const DISPLAY_WEEK_DAYS: WeekDay[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
];

interface CreateVersionFormState {
    name: string;
    description: string;
    scope: TimetableScope;
    sectionId: number | "";
    sectionGroupId: number | "";
    baseTimeTableId: number | "";
    effectiveFrom: string;
    effectiveUntil: string;
    entries: EntryRequest[];
}

const DEFAULT_VERSION_FORM: CreateVersionFormState = {
    name: "",
    description: "",
    scope: "SECTION",
    sectionId: "",
    sectionGroupId: "",
    baseTimeTableId: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveUntil: "",
    entries: [],
};

function formatTime(timeStr?: string | null): string {
    if (!timeStr) return "--:--";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const p = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}:${m} ${p}`;
}

function VersionStatusBadge({ status }: { status: TimetableVersionStatus }) {
    switch (status) {
        case "PUBLISHED":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Published
                </span>
            );
        case "DRAFT":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Draft
                </span>
            );
        case "SUPERSEDED":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
                    Superseded
                </span>
            );
        case "ARCHIVED":
        default:
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
                    Archived
                </span>
            );
    }
}

function EntryTypeBadge({ type }: { type: TimetableEntryType }) {
    switch (type) {
        case "PRACTICAL":
        case "LABORATORY":
            return (
                <span className="rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                    {type}
                </span>
            );
        case "TUTORIAL":
            return (
                <span className="rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                    TUTORIAL
                </span>
            );
        case "ACTIVITY":
            return (
                <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    ACTIVITY
                </span>
            );
        case "THEORY":
        default:
            return (
                <span className="rounded bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                    THEORY
                </span>
            );
    }
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

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function TimetableBuilderPage() {
    // Selectors
    const [sections, setSections] = useState<CommonDTO[]>([]);
    const [baseTemplates, setBaseTemplates] = useState<BaseTimeTableResponse[]>([]);
    const [subjects, setSubjects] = useState<CommonDTO[]>([]);
    const [teachers, setTeachers] = useState<CommonDTO[]>([]);
    const [rooms, setRooms] = useState<RoomResponse[]>([]);

    // Navigation & selection
    const [scope, setScope] = useState<TimetableScope>("SECTION");
    const [selectedSectionId, setSelectedSectionId] = useState<number | "">("");
    const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");

    // Versions
    const [versions, setVersions] = useState<TimetableVersionResponse[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Create Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateVersionFormState>(DEFAULT_VERSION_FORM);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    // Slot Edit Dialog (inside create modal or view)
    const [activeSlotTarget, setActiveSlotTarget] = useState<{
        dayOfWeek: WeekDay;
        basePeriodId: number;
        periodLabel: string;
    } | null>(null);

    const [slotAssignment, setSlotAssignment] = useState<{
        subjectId: number | "";
        teacherEnrollmentId: number | "";
        roomId: number | "";
        entryType: TimetableEntryType;
        remarks: string;
    }>({
        subjectId: "",
        teacherEnrollmentId: "",
        roomId: "",
        entryType: "THEORY",
        remarks: "",
    });

    /* ---------------------------------------------------------------------- */
    /* Load Reference Data                                                    */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        async function fetchInitial() {
            try {
                const [secs, bts, subs, tch, rms] = await Promise.all([
                    getSectionFilter(),
                    getAllBaseTemplates(),
                    getSubjectFilter(),
                    getTeacherFilter(),
                    getAllRooms(),
                ]);

                setSections(secs);
                setBaseTemplates(bts);
                setSubjects(subs);
                setTeachers(tch);
                setRooms(rms);

                if (secs.length > 0 && !selectedSectionId) {
                    setSelectedSectionId(secs[0].id);
                }
            } catch {
                // Silently fallback
            }
        }
        fetchInitial();
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Load Versions for Selected Target                                      */
    /* ---------------------------------------------------------------------- */

    const loadVersions = useCallback(async () => {
        if (scope === "SECTION" && !selectedSectionId) return;
        if (scope === "SECTION_GROUP" && !selectedGroupId) return;

        setLoading(true);
        setErrorMessage("");

        try {
            let list: TimetableVersionResponse[] = [];
            if (scope === "SECTION") {
                list = await getSectionTimetableVersions(Number(selectedSectionId));
            } else {
                list = await getGroupTimetableVersions(Number(selectedGroupId));
            }

            setVersions(list);
            if (list.length > 0) {
                // Prefer published version, else latest
                const pub = list.find((v) => v.status === "PUBLISHED");
                setSelectedVersionId(pub ? pub.id : list[0].id);
            } else {
                setSelectedVersionId(null);
            }
        } catch (err) {
            setErrorMessage(extractErrorMessage(err, "Failed to load timetable versions."));
        } finally {
            setLoading(false);
        }
    }, [scope, selectedSectionId, selectedGroupId]);

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    const activeVersion = useMemo(() => {
        return versions.find((v) => v.id === selectedVersionId) || null;
    }, [versions, selectedVersionId]);

    // Get Base Template associated with current active version
    const activeBaseTemplate = useMemo(() => {
        if (!activeVersion) return baseTemplates[0] || null;
        return (
            baseTemplates.find((b) => b.id === activeVersion.baseTimeTableId) ||
            baseTemplates[0] ||
            null
        );
    }, [activeVersion, baseTemplates]);

    // Fast entry lookup by `${dayOfWeek}_${basePeriodId}`
    const activeEntriesMap = useMemo(() => {
        const map = new Map<string, EntryResponse>();
        if (!activeVersion) return map;
        for (const e of activeVersion.entries) {
            map.set(`${e.dayOfWeek}_${e.basePeriodId}`, e);
        }
        return map;
    }, [activeVersion]);

    // Fast lookup dictionaries for Subject, Teacher, Room names
    const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
    const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t.name])), [teachers]);
    const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, `${r.roomNumber} (${r.buildingName || "Main"})`])), [rooms]);

    /* ---------------------------------------------------------------------- */
    /* Version Actions                                                        */
    /* ---------------------------------------------------------------------- */

    const handlePublish = async () => {
        if (!activeVersion) return;
        setBusy(true);
        try {
            await publishTimetableVersion(activeVersion.id);
            toast.success(`Timetable Version ${activeVersion.name} published successfully!`);
            await loadVersions();
        } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to publish timetable version."));
        } finally {
            setBusy(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Create Version Handlers                                                */
    /* ---------------------------------------------------------------------- */

    const handleOpenCreateModal = () => {
        const defaultBase = baseTemplates.find((b) => b.active) || baseTemplates[0];
        setCreateForm({
            ...DEFAULT_VERSION_FORM,
            name: `Semester Schedule ${new Date().getFullYear()}`,
            scope,
            sectionId: selectedSectionId || (sections[0]?.id ?? ""),
            sectionGroupId: selectedGroupId || "",
            baseTimeTableId: defaultBase?.id || "",
            entries: [],
        });
        setCreateErrors({});
        setIsCreateModalOpen(true);
    };

    // When constructing a new version, this is the selected template
    const createBaseTemplate = useMemo(() => {
        return (
            baseTemplates.find((b) => b.id === createForm.baseTimeTableId) ||
            baseTemplates[0] ||
            null
        );
    }, [baseTemplates, createForm.baseTimeTableId]);

    const createEntriesMap = useMemo(() => {
        const map = new Map<string, EntryRequest>();
        for (const e of createForm.entries) {
            map.set(`${e.dayOfWeek}_${e.basePeriodId}`, e);
        }
        return map;
    }, [createForm.entries]);

    const handleOpenSlotAssign = (day: WeekDay, period: PeriodResponse) => {
        setActiveSlotTarget({
            dayOfWeek: day,
            basePeriodId: period.id || period.sequenceNumber,
            periodLabel: period.label || `Period ${period.sequenceNumber}`,
        });

        const key = `${day}_${period.id || period.sequenceNumber}`;
        const existing = createEntriesMap.get(key);

        if (existing) {
            setSlotAssignment({
                subjectId: existing.subjectId,
                teacherEnrollmentId: existing.teacherId || existing.teacherEnrollmentId,
                roomId: existing.roomId || "",
                entryType: existing.entryType,
                remarks: existing.remarks || "",
            });
        } else {
            setSlotAssignment({
                subjectId: subjects[0]?.id || "",
                teacherEnrollmentId: teachers[0]?.id || "",
                roomId: rooms[0]?.id || "",
                entryType: "THEORY",
                remarks: "",
            });
        }
    };

    const handleSaveSlotAssign = () => {
        if (!activeSlotTarget) return;
        if (!slotAssignment.subjectId) {
            toast.error("Please select a subject.");
            return;
        }
        if (!slotAssignment.teacherEnrollmentId) {
            toast.error("Please select a faculty teacher.");
            return;
        }

        const newEntry: EntryRequest = {
            dayOfWeek: activeSlotTarget.dayOfWeek,
            basePeriodId: activeSlotTarget.basePeriodId,
            subjectId: Number(slotAssignment.subjectId),
            teacherEnrollmentId: Number(slotAssignment.teacherEnrollmentId),
            roomId: slotAssignment.roomId ? Number(slotAssignment.roomId) : null,
            entryType: slotAssignment.entryType,
            remarks: slotAssignment.remarks.trim() || undefined,
        };

        setCreateForm((prev) => {
            const filtered = prev.entries.filter(
                (e) =>
                    !(
                        e.dayOfWeek === activeSlotTarget.dayOfWeek &&
                        e.basePeriodId === activeSlotTarget.basePeriodId
                    )
            );
            return {
                ...prev,
                entries: [...filtered, newEntry],
            };
        });

        setActiveSlotTarget(null);
    };

    const handleRemoveSlotAssign = () => {
        if (!activeSlotTarget) return;
        setCreateForm((prev) => ({
            ...prev,
            entries: prev.entries.filter(
                (e) =>
                    !(
                        e.dayOfWeek === activeSlotTarget.dayOfWeek &&
                        e.basePeriodId === activeSlotTarget.basePeriodId
                    )
            ),
        }));
        setActiveSlotTarget(null);
    };

    const handleSubmitCreateVersion = async (e: FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!createForm.name.trim()) errors.name = "Version name is required.";
        if (!createForm.baseTimeTableId) errors.baseTimeTableId = "Please select a base timetable template.";
        if (createForm.scope === "SECTION" && !createForm.sectionId) {
            errors.sectionId = "Please select a section.";
        }
        if (createForm.scope === "SECTION_GROUP" && !createForm.sectionGroupId) {
            errors.sectionGroupId = "Please select a section group.";
        }
        if (!createForm.effectiveFrom) errors.effectiveFrom = "Effective from date is required.";

        if (createForm.entries.length === 0) {
            errors.entries = "Please assign at least one period slot in the weekly matrix.";
        }

        setCreateErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error("Please correct the errors in the form.");
            return;
        }

        const payload: TimetableVersionRequest = {
            scope: createForm.scope,
            sectionId: createForm.scope === "SECTION" ? Number(createForm.sectionId) : null,
            sectionGroupId: createForm.scope === "SECTION_GROUP" ? Number(createForm.sectionGroupId) : null,
            baseTimeTableId: Number(createForm.baseTimeTableId),
            name: createForm.name.trim(),
            description: createForm.description.trim() || null,
            effectiveFrom: createForm.effectiveFrom,
            effectiveUntil: createForm.effectiveUntil || null,
            entries: createForm.entries,
        };

        setBusy(true);
        try {
            const created = await createTimetableVersion(payload);
            toast.success(`Timetable version "${created.name}" created successfully!`);
            setIsCreateModalOpen(false);
            await loadVersions();
            setSelectedVersionId(created.id);
        } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to create timetable version."));
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
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-lg shadow-sky-500/10">
                            <LayoutDashboard size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                Timetable Builder & Versions
                            </h1>
                            <p className="text-xs text-slate-400 sm:text-sm">
                                Construct weekly schedules, allocate teachers and classrooms, and publish verified timetables.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => loadVersions()}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110 active:scale-95"
                        >
                            <Plus size={16} />
                            <span>New Timetable Version</span>
                        </button>
                    </div>
                </header>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-rose-400" />
                            <p className="font-semibold text-white">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Top Selector Panel */}
                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Scope Toggle */}
                        <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/60 p-1">
                            <button
                                type="button"
                                onClick={() => setScope("SECTION")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    scope === "SECTION"
                                        ? "bg-sky-500 text-white shadow"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Section Timetable
                            </button>
                            <button
                                type="button"
                                onClick={() => setScope("SECTION_GROUP")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    scope === "SECTION_GROUP"
                                        ? "bg-sky-500 text-white shadow"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                Group Timetable
                            </button>
                        </div>

                        {/* Section Selector */}
                        <div className="relative min-w-[200px]">
                            <select
                                aria-label="Select Section"
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(Number(e.target.value) || "")}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-sky-400 focus:outline-none"
                            >
                                <option value="">Select Section...</option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code || `#${s.id}`})
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Section Group ID if group scope */}
                        {scope === "SECTION_GROUP" && (
                            <div className="min-w-[150px]">
                                <input
                                    type="number"
                                    placeholder="Section Group ID"
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(Number(e.target.value) || "")}
                                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Version Selector & Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <Layers size={15} className="text-sky-400" />
                            <span>Version:</span>
                        </div>
                        <div className="relative min-w-[220px]">
                            <select
                                aria-label="Select Timetable Version"
                                value={selectedVersionId || ""}
                                onChange={(e) => setSelectedVersionId(Number(e.target.value) || null)}
                                disabled={versions.length === 0}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-sky-400 focus:outline-none disabled:opacity-50"
                            >
                                {versions.length === 0 ? (
                                    <option value="">No versions found</option>
                                ) : (
                                    versions.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            v{v.versionNumber}: {v.name} ({v.status})
                                        </option>
                                    ))
                                )}
                            </select>
                            <SelectChevron />
                        </div>

                        {activeVersion && activeVersion.status === "DRAFT" && (
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {busy ? (
                                    <LoaderCircle size={14} className="animate-spin" />
                                ) : (
                                    <Megaphone size={14} />
                                )}
                                <span>Publish Version</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Version Info Card */}
                {activeVersion && (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-white">
                                            {activeVersion.name}
                                        </h3>
                                        <span className="rounded-md border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 font-mono text-xs text-sky-300">
                                            v{activeVersion.versionNumber}
                                        </span>
                                        <VersionStatusBadge status={activeVersion.status} />
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Base Template: {activeBaseTemplate?.name || `#${activeVersion.baseTimeTableId}`} • Scope: {activeVersion.scope}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                                <div className="rounded-lg border border-white/5 bg-slate-950/40 px-3 py-1.5">
                                    <span className="text-slate-500">Effective: </span>
                                    <span className="font-semibold text-slate-200">
                                        {activeVersion.effectiveFrom}
                                    </span>
                                    {activeVersion.effectiveUntil && (
                                        <span className="text-slate-200">
                                            {" "}to {activeVersion.effectiveUntil}
                                        </span>
                                    )}
                                </div>
                                <div className="rounded-lg border border-white/5 bg-slate-950/40 px-3 py-1.5">
                                    <span className="text-slate-500">Allocated Slots: </span>
                                    <span className="font-bold text-sky-400">
                                        {activeVersion.entries.length} slots
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weekly Matrix Grid */}
                {!activeVersion ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center text-slate-400">
                        <CalendarRange size={40} className="text-slate-600" />
                        <p className="mt-3 text-base font-semibold text-slate-200">
                            No timetable versions for this {scope.toLowerCase().replace(/_/g, " ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Create a new timetable version to start placing lectures, labs, and teachers.
                        </p>
                        <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600"
                        >
                            <Plus size={14} /> Create First Version
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md">
                        <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                            <thead className="bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="w-40 border-b border-white/10 px-4 py-3">
                                        Period / Bell Timing
                                    </th>
                                    {DISPLAY_WEEK_DAYS.map((day) => (
                                        <th
                                            key={day}
                                            className="border-b border-l border-white/10 px-4 py-3 text-center"
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(activeBaseTemplate?.periods || []).map((period) => {
                                    const isBreak =
                                        period.periodType === "BREAK" ||
                                        period.periodType === "LUNCH" ||
                                        period.periodType === "ASSEMBLY";

                                    return (
                                        <tr
                                            key={period.sequenceNumber}
                                            className={isBreak ? "bg-slate-950/40" : "hover:bg-white/[0.02]"}
                                        >
                                            {/* Left period header */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-semibold text-slate-200">
                                                    {period.label || `Period ${period.sequenceNumber}`}
                                                </div>
                                                <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                                                    {formatTime(period.startTime)} – {formatTime(period.endTime)}
                                                </div>
                                                <div className="mt-1">
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {period.durationMinutes} min
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Days cells */}
                                            {DISPLAY_WEEK_DAYS.map((day) => {
                                                const key = `${day}_${period.id || period.sequenceNumber}`;
                                                const entry = activeEntriesMap.get(key);

                                                if (isBreak) {
                                                    return (
                                                        <td
                                                            key={day}
                                                            className="border-l border-white/5 px-3 py-3 text-center align-middle"
                                                        >
                                                            <span className="rounded bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-400">
                                                                {period.periodType}
                                                            </span>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td
                                                        key={day}
                                                        className="border-l border-white/5 p-2 align-top"
                                                    >
                                                        {entry ? (
                                                            <div className="group relative rounded-xl border border-sky-400/20 bg-sky-500/[0.08] p-2.5 transition hover:border-sky-400/40 hover:bg-sky-500/15">
                                                                <div className="flex items-start justify-between gap-1">
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1 font-semibold text-white">
                                                                            <BookOpen size={13} className="shrink-0 text-sky-400" />
                                                                            <span className="truncate">
                                                                                {subjectMap.get(entry.subjectId) || `Subject #${entry.subjectId}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <EntryTypeBadge type={entry.entryType} />
                                                                </div>

                                                                <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                                                                    <div className="flex items-center gap-1 text-slate-400">
                                                                        <UserCheck size={12} className="shrink-0 text-emerald-400" />
                                                                        <span className="truncate">
                                                                            {entry.teacherName || (entry.teacherId ? teacherMap.get(entry.teacherId) : null) || teacherMap.get(entry.teacherEnrollmentId) || `Faculty #${entry.teacherEnrollmentId}`}
                                                                        </span>
                                                                    </div>

                                                                    {entry.roomId && (
                                                                        <div className="flex items-center gap-1 text-slate-400">
                                                                            <DoorOpen size={12} className="shrink-0 text-purple-400" />
                                                                            <span className="truncate">
                                                                                {entry.roomNumber || roomMap.get(entry.roomId) || `Room #${entry.roomId}`}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {entry.remarks && (
                                                                    <p className="mt-1.5 line-clamp-1 text-[10px] italic text-slate-400">
                                                                        "{entry.remarks}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-full min-h-[72px] items-center justify-center rounded-xl border border-dashed border-white/5 bg-slate-950/20 text-[11px] text-slate-600">
                                                                <span>Free Slot</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ============================================================== */}
            {/* CREATE TIMETABLE VERSION MODAL                                 */}
            {/* ============================================================== */}
            {isCreateModalOpen && (
                createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                        >
                            <header className="flex items-start justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-2.5 text-sky-300">
                                        <Plus size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Create Timetable Version</h2>
                                        <p className="text-xs text-slate-400">
                                            Select bell schedule template and click slots in the matrix below to assign lectures.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </header>

                            <form onSubmit={handleSubmitCreateVersion} className="flex min-h-0 flex-1 flex-col">
                                <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
                                    {/* Parameters grid */}
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-300">
                                                Version Name <span className="text-rose-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Fall 2026 Regular Schedule"
                                                value={createForm.name}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                                            />
                                            <FieldError>{createErrors.name}</FieldError>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-300">
                                                Base Bell Template <span className="text-rose-400">*</span>
                                            </label>
                                            <div className="relative mt-1.5">
                                                <select
                                                    value={createForm.baseTimeTableId}
                                                    onChange={(e) =>
                                                        setCreateForm((prev) => ({
                                                            ...prev,
                                                            baseTimeTableId: Number(e.target.value) || "",
                                                        }))
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-sky-400 focus:outline-none"
                                                >
                                                    <option value="">Select Base Template...</option>
                                                    {baseTemplates.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name} ({b.periodsPerDay} periods)
                                                        </option>
                                                    ))}
                                                </select>
                                                <SelectChevron />
                                            </div>
                                            <FieldError>{createErrors.baseTimeTableId}</FieldError>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-300">
                                                Target Scope & Section
                                            </label>
                                            <div className="mt-1.5 flex gap-2">
                                                <select
                                                    value={createForm.sectionId}
                                                    onChange={(e) =>
                                                        setCreateForm((prev) => ({
                                                            ...prev,
                                                            sectionId: Number(e.target.value) || "",
                                                        }))
                                                    }
                                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                                                >
                                                    <option value="">Select Section...</option>
                                                    {sections.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-300">
                                                Effective From <span className="text-rose-400">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={createForm.effectiveFrom}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        effectiveFrom: e.target.value,
                                                    }))
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                                            />
                                            <FieldError>{createErrors.effectiveFrom}</FieldError>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-300">
                                                Effective Until (Optional)
                                            </label>
                                            <input
                                                type="date"
                                                value={createForm.effectiveUntil}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        effectiveUntil: e.target.value,
                                                    }))
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Matrix Allocator Canvas */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-white">
                                                    Slot Allocation Grid ({createForm.entries.length} slots assigned)
                                                </h3>
                                                <p className="text-xs text-slate-400">
                                                    Click any cell to assign Subject, Faculty, Classroom, and Lecture Type.
                                                </p>
                                            </div>
                                        </div>

                                        <FieldError>{createErrors.entries}</FieldError>

                                        {createBaseTemplate ? (
                                            <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50">
                                                <table className="w-full min-w-[850px] border-collapse text-xs">
                                                    <thead className="bg-slate-950 text-slate-400 uppercase text-[11px]">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">Period</th>
                                                            {DISPLAY_WEEK_DAYS.map((day) => (
                                                                <th
                                                                    key={day}
                                                                    className="px-3 py-2 text-center border-l border-white/5"
                                                                >
                                                                    {day}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {createBaseTemplate.periods.map((period) => {
                                                            const isBreak =
                                                                period.periodType === "BREAK" ||
                                                                period.periodType === "LUNCH" ||
                                                                period.periodType === "ASSEMBLY";

                                                            return (
                                                                <tr key={period.sequenceNumber}>
                                                                    <td className="px-3 py-2 text-left font-medium text-slate-300">
                                                                        {period.label || `P${period.sequenceNumber}`}
                                                                        <span className="block text-[10px] text-slate-500 font-mono">
                                                                            {formatTime(period.startTime)}
                                                                        </span>
                                                                    </td>

                                                                    {DISPLAY_WEEK_DAYS.map((day) => {
                                                                        const key = `${day}_${period.id || period.sequenceNumber}`;
                                                                        const entry = createEntriesMap.get(key);

                                                                        if (isBreak) {
                                                                            return (
                                                                                <td
                                                                                    key={day}
                                                                                    className="border-l border-white/5 bg-slate-950/60 p-2 text-center text-[10px] text-slate-500 font-semibold"
                                                                                >
                                                                                    {period.periodType}
                                                                                </td>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <td
                                                                                key={day}
                                                                                onClick={() =>
                                                                                    handleOpenSlotAssign(day, period)
                                                                                }
                                                                                className="border-l border-white/5 p-1.5 cursor-pointer hover:bg-white/[0.04]"
                                                                            >
                                                                                {entry ? (
                                                                                    <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-1.5">
                                                                                        <p className="font-semibold text-white truncate">
                                                                                            {entry.subjectName || subjectMap.get(entry.subjectId) || `#${entry.subjectId}`}
                                                                                        </p>
                                                                                        <p className="text-[10px] text-slate-400 truncate">
                                                                                            {entry.teacherName || (entry.teacherId ? teacherMap.get(entry.teacherId) : null) || teacherMap.get(entry.teacherEnrollmentId) || `#${entry.teacherEnrollmentId}`}
                                                                                        </p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-white/10 text-slate-600 hover:border-sky-400/40 hover:text-sky-300">
                                                                                        <Plus size={14} />
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="mt-3 rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                                                Select a Base Template above to populate the weekly scheduling canvas.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <footer className="flex items-center justify-end gap-3 border-t border-white/10 bg-slate-900/90 p-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:brightness-110 disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={14} />
                                                <span>Create Timetable Version</span>
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

            {/* ============================================================== */}
            {/* MINI SLOT ASSIGNMENT DIALOG                                    */}
            {/* ============================================================== */}
            {activeSlotTarget && (
                createPortal(
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={() => setActiveSlotTarget(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl space-y-4"
                        >
                            <div className="flex items-start justify-between border-b border-white/10 pb-3">
                                <div>
                                    <h4 className="text-base font-bold text-white">Assign Slot</h4>
                                    <p className="text-xs text-slate-400">
                                        {activeSlotTarget.dayOfWeek} • {activeSlotTarget.periodLabel}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSlotTarget(null)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-medium">Subject *</label>
                                    <select
                                        value={slotAssignment.subjectId}
                                        onChange={(e) =>
                                            setSlotAssignment((prev) => ({
                                                ...prev,
                                                subjectId: Number(e.target.value) || "",
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                                    >
                                        <option value="">Select Subject...</option>
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-medium">Faculty Teacher *</label>
                                    <select
                                        value={slotAssignment.teacherEnrollmentId}
                                        onChange={(e) =>
                                            setSlotAssignment((prev) => ({
                                                ...prev,
                                                teacherEnrollmentId: Number(e.target.value) || "",
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                                    >
                                        <option value="">Select Teacher...</option>
                                        {teachers.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} {t.code ? `(${t.code})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    {teachers.length === 0 && (
                                        <p className="mt-1 text-[11px] text-amber-400">
                                            No faculty members found. Ensure teachers exist in the system.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-slate-300 font-medium">Room</label>
                                        <select
                                            value={slotAssignment.roomId}
                                            onChange={(e) =>
                                                setSlotAssignment((prev) => ({
                                                    ...prev,
                                                    roomId: Number(e.target.value) || "",
                                                }))
                                            }
                                            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                                        >
                                            <option value="">Select Room...</option>
                                            {rooms.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.roomNumber} ({r.buildingName || "Main"})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-medium">Lecture Type</label>
                                        <select
                                            value={slotAssignment.entryType}
                                            onChange={(e) =>
                                                setSlotAssignment((prev) => ({
                                                    ...prev,
                                                    entryType: e.target.value as TimetableEntryType,
                                                }))
                                            }
                                            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                                        >
                                            {TIMETABLE_ENTRY_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-medium">Remarks / Note</label>
                                    <input
                                        type="text"
                                        placeholder="Optional notes for this slot..."
                                        value={slotAssignment.remarks}
                                        onChange={(e) =>
                                            setSlotAssignment((prev) => ({ ...prev, remarks: e.target.value }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                <button
                                    type="button"
                                    onClick={handleRemoveSlotAssign}
                                    className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                                >
                                    Clear Slot
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSlotTarget(null)}
                                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveSlotAssign}
                                        className="rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
                                    >
                                        Set Slot
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )
            )}
        </div>
    );
}
