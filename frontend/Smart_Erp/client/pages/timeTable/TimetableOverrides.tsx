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
    ArrowRightLeft,
    Ban,
    BookOpen,
    Building2,
    Calendar,
    CalendarCheck,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    DoorClosed,
    DoorOpen,
    Eye,
    GitBranch,
    GraduationCap,
    Info,
    Layers,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    UserX,
    Users,
    X,
} from "lucide-react";

import {
    approveTimetableOverride,
    extractErrorMessage,
    getDailyTimetable,
    getSubjectFilter,
    getTeacherFilter,
    rejectTimetableOverride,
    submitTimetableOverride,
    type CommonDTO,
    type OverrideAction,
    type OverrideApprovalMode,
    type OverrideRequest,
    type OverrideResponse,
    type TimetableEntryType,
    type TimetableSlotView,
    type TimetableView,
    OVERRIDE_ACTIONS,
    OVERRIDE_APPROVAL_MODES,
    TIMETABLE_ENTRY_TYPES,
} from "@/services/timetable/timetableService";

import {
    getSectionFilter,
} from "@/services/timetable/sectionCalendarService";

import {
    getAllRooms,
    type RoomResponse,
} from "@/services/timetable/RoomService";

import {
    getAllBaseTemplates,
    type BaseTimeTableResponse,
} from "@/services/timetable/baseTimetableService";

/* -------------------------------------------------------------------------- */
/* Helpers & Types                                                            */
/* -------------------------------------------------------------------------- */

interface OverrideFormState {
    sectionId: number | "";
    sectionGroupId: number | "";
    overrideDate: string;
    action: OverrideAction;
    approvalMode: OverrideApprovalMode;
    originalEntryId: number | "";
    reason: string;
    basePeriodId: number | "";
    subjectId: number | "";
    teacherEnrollmentId: number | "";
    roomId: number | "";
    entryType: TimetableEntryType;
    remarks: string;
}

const DEFAULT_OVERRIDE_FORM: OverrideFormState = {
    sectionId: "",
    sectionGroupId: "",
    overrideDate: new Date().toISOString().split("T")[0],
    action: "REPLACE",
    approvalMode: "IMMEDIATE",
    originalEntryId: "",
    reason: "",
    basePeriodId: "",
    subjectId: "",
    teacherEnrollmentId: "",
    roomId: "",
    entryType: "THEORY",
    remarks: "",
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
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function TimetableOverridesPage() {
    // Selectors
    const [sections, setSections] = useState<CommonDTO[]>([]);
    const [subjects, setSubjects] = useState<CommonDTO[]>([]);
    const [teachers, setTeachers] = useState<CommonDTO[]>([]);
    const [rooms, setRooms] = useState<RoomResponse[]>([]);
    const [baseTemplates, setBaseTemplates] = useState<BaseTimeTableResponse[]>([]);

    const [selectedSectionId, setSelectedSectionId] = useState<number | "">("");
    const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );

    // Live Timetable data
    const [dailySchedule, setDailySchedule] = useState<TimetableView | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Modal
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [overrideForm, setOverrideForm] = useState<OverrideFormState>(DEFAULT_OVERRIDE_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    /* ---------------------------------------------------------------------- */
    /* Load Initial Data                                                      */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        async function fetchInitial() {
            try {
                const [secs, subs, tch, rms, bts] = await Promise.all([
                    getSectionFilter(),
                    getSubjectFilter(),
                    getTeacherFilter(),
                    getAllRooms(),
                    getAllBaseTemplates(),
                ]);
                setSections(secs);
                setSubjects(subs);
                setTeachers(tch);
                setRooms(rms);
                setBaseTemplates(bts);

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
    /* Load Daily Timetable                                                   */
    /* ---------------------------------------------------------------------- */

    const loadDaily = useCallback(async () => {
        if (!selectedSectionId) return;
        setLoading(true);
        setErrorMessage("");

        try {
            const data = await getDailyTimetable(
                Number(selectedSectionId),
                selectedDate,
                selectedGroupId ? Number(selectedGroupId) : null
            );
            setDailySchedule(data);
        } catch (err) {
            setErrorMessage(extractErrorMessage(err, "Failed to load daily timetable view."));
            setDailySchedule(null);
        } finally {
            setLoading(false);
        }
    }, [selectedSectionId, selectedGroupId, selectedDate]);

    useEffect(() => {
        loadDaily();
    }, [loadDaily]);

    /* ---------------------------------------------------------------------- */
    /* Quick Date Switchers                                                   */
    /* ---------------------------------------------------------------------- */

    const setToday = () => {
        setSelectedDate(new Date().toISOString().split("T")[0]);
    };

    const setTomorrow = () => {
        const d = new Date(Date.now() + 86400000);
        setSelectedDate(d.toISOString().split("T")[0]);
    };

    /* ---------------------------------------------------------------------- */
    /* Override Modal Openers                                                 */
    /* ---------------------------------------------------------------------- */

    const handleOpenNewOverride = () => {
        setOverrideForm({
            ...DEFAULT_OVERRIDE_FORM,
            sectionId: selectedSectionId,
            sectionGroupId: selectedGroupId,
            overrideDate: selectedDate,
            subjectId: subjects[0]?.id || "",
            teacherEnrollmentId: teachers[0]?.id || "",
            roomId: rooms[0]?.id || "",
        });
        setFormErrors({});
        setIsOverrideModalOpen(true);
    };

    const handleSubstituteSlot = (slot: TimetableSlotView) => {
        setOverrideForm({
            ...DEFAULT_OVERRIDE_FORM,
            sectionId: selectedSectionId,
            sectionGroupId: selectedGroupId,
            overrideDate: selectedDate,
            action: "REPLACE",
            originalEntryId: slot.entryId || "",
            reason: `Substitution for ${slot.periodLabel} (${slot.subject || "Class"})`,
            subjectId: subjects[0]?.id || "",
            teacherEnrollmentId: teachers[0]?.id || "",
            roomId: rooms[0]?.id || "",
            entryType: slot.entryType || "THEORY",
        });
        setFormErrors({});
        setIsOverrideModalOpen(true);
    };

    const handleCancelSlot = (slot: TimetableSlotView) => {
        setOverrideForm({
            ...DEFAULT_OVERRIDE_FORM,
            sectionId: selectedSectionId,
            sectionGroupId: selectedGroupId,
            overrideDate: selectedDate,
            action: "CANCEL",
            originalEntryId: slot.entryId || "",
            reason: `Period canceled for ${slot.periodLabel}`,
        });
        setFormErrors({});
        setIsOverrideModalOpen(true);
    };

    /* ---------------------------------------------------------------------- */
    /* Submit Override                                                        */
    /* ---------------------------------------------------------------------- */

    const handleSubmitOverride = async (e: FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!overrideForm.sectionId) errors.sectionId = "Please select a section.";
        if (!overrideForm.overrideDate) errors.overrideDate = "Override date is required.";
        if (!overrideForm.reason.trim()) errors.reason = "Please state the reason for this substitution/override.";

        if (overrideForm.action === "REPLACE" || overrideForm.action === "ADD") {
            if (!overrideForm.subjectId) errors.subjectId = "Please select a replacement subject.";
            if (!overrideForm.teacherEnrollmentId) errors.teacherEnrollmentId = "Please select a replacement teacher.";
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setBusy(true);
        try {
            const payload: OverrideRequest = {
                sectionId: Number(overrideForm.sectionId),
                sectionGroupId: overrideForm.sectionGroupId ? Number(overrideForm.sectionGroupId) : null,
                overrideDate: overrideForm.overrideDate,
                action: overrideForm.action,
                approvalMode: overrideForm.approvalMode,
                originalEntryId: overrideForm.originalEntryId ? Number(overrideForm.originalEntryId) : null,
                reason: overrideForm.reason.trim(),
                basePeriodId: overrideForm.basePeriodId ? Number(overrideForm.basePeriodId) : null,
                subjectId: overrideForm.subjectId ? Number(overrideForm.subjectId) : null,
                teacherEnrollmentId: overrideForm.teacherEnrollmentId ? Number(overrideForm.teacherEnrollmentId) : null,
                roomId: overrideForm.roomId ? Number(overrideForm.roomId) : null,
                entryType: overrideForm.entryType,
                remarks: overrideForm.remarks.trim() || null,
            };

            await submitTimetableOverride(payload);
            toast.success("Timetable override submitted successfully!");
            setIsOverrideModalOpen(false);
            await loadDaily();
        } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to submit override."));
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
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300 shadow-lg shadow-rose-500/10">
                            <ArrowRightLeft size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                Daily Schedule & Substitutions
                            </h1>
                            <p className="text-xs text-slate-400 sm:text-sm">
                                View resolved day-level timetable, assign teacher substitutions, and handle lecture overrides.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => loadDaily()}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenNewOverride}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 active:scale-95"
                        >
                            <Plus size={16} />
                            <span>Submit Substitution</span>
                        </button>
                    </div>
                </header>

                {/* Filter and Date Selector Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[200px]">
                            <select
                                aria-label="Select Section"
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(Number(e.target.value) || "")}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-xs text-white focus:border-rose-400 focus:outline-none"
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

                        <div className="min-w-[140px]">
                            <input
                                type="number"
                                placeholder="Group ID (Optional)"
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(Number(e.target.value) || "")}
                                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1 text-xs">
                            <button
                                type="button"
                                onClick={setToday}
                                className="rounded-lg px-2.5 py-1 font-semibold text-slate-300 hover:text-white"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={setTomorrow}
                                className="rounded-lg px-2.5 py-1 font-semibold text-slate-300 hover:text-white"
                            >
                                Tomorrow
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type="date"
                                aria-label="Selected Date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-xs text-white focus:border-rose-400 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Operating Status Banner */}
                {dailySchedule && (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                                        dailySchedule.open
                                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
                                            : "border-rose-400/30 bg-rose-500/10 text-rose-400"
                                    }`}
                                >
                                    {dailySchedule.open ? <DoorOpen size={20} /> : <DoorClosed size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-white">
                                            {dailySchedule.dayTitle || `Schedule for ${dailySchedule.date}`}
                                        </h3>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                                dailySchedule.open
                                                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                    : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                                            }`}
                                        >
                                            {dailySchedule.open ? "School Open" : "School Closed"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {dailySchedule.open ? (
                                            <>
                                                Resolved Timetable:{" "}
                                                <strong className="text-white">
                                                    {dailySchedule.versionName || `Version #${dailySchedule.timetableVersionId}`}
                                                </strong>{" "}
                                                (v{dailySchedule.versionNumber})
                                            </>
                                        ) : (
                                            <span className="text-rose-300 font-medium">
                                                Reason: {dailySchedule.closureReason || "No instruction scheduled on this day."}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <span className="rounded-lg border border-white/5 bg-slate-950/40 px-3 py-1.5 text-slate-300">
                                    Total Periods:{" "}
                                    <strong className="text-white font-mono">
                                        {dailySchedule.slots.length}
                                    </strong>
                                </span>
                                <span className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-amber-300">
                                    Overridden:{" "}
                                    <strong className="font-mono">
                                        {dailySchedule.slots.filter((s) => s.overridden).length}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Slots List */}
                {loading ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-slate-400">
                        <LoaderCircle size={32} className="animate-spin text-rose-400" />
                        <p className="mt-3 text-sm">Loading daily resolved schedule...</p>
                    </div>
                ) : !dailySchedule || dailySchedule.slots.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center text-slate-400">
                        <CalendarCheck size={40} className="text-slate-600" />
                        <p className="mt-3 text-base font-semibold text-slate-200">
                            No classes scheduled for {selectedDate}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {dailySchedule && !dailySchedule.open
                                ? dailySchedule.closureReason || "The section calendar has marked this day as closed/holiday."
                                : "Make sure a published timetable version is active for this section."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {dailySchedule.slots.map((slot) => {
                            return (
                                <motion.div
                                    key={slot.sequenceNumber}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 backdrop-blur-md transition sm:flex-row sm:items-center ${
                                        slot.overridden
                                            ? "border-amber-400/40 bg-amber-500/[0.08]"
                                            : "border-white/10 bg-slate-900/70 hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Sequence & Period Number */}
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 p-2.5 min-w-[64px]">
                                            <span className="text-[10px] uppercase font-bold text-slate-500">
                                                Slot
                                            </span>
                                            <span className="text-base font-bold text-white font-mono">
                                                #{slot.sequenceNumber}
                                            </span>
                                        </div>

                                        {/* Period info & Timing */}
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-base font-bold text-white">
                                                    {slot.periodLabel}
                                                </h4>
                                                <span className="rounded-md border border-white/10 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                                                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                                </span>
                                                {slot.entryType && (
                                                    <span className="rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                                                        {slot.entryType}
                                                    </span>
                                                )}
                                                {slot.overridden && (
                                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                                        <Sparkles size={11} /> Overridden / Substituted
                                                    </span>
                                                )}
                                            </div>

                                            {/* Details: Subject, Teacher, Room */}
                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                                                {slot.subject && (
                                                    <div className="flex items-center gap-1.5 font-medium text-white">
                                                        <BookOpen size={14} className="text-rose-400" />
                                                        <span>{slot.subject}</span>
                                                    </div>
                                                )}
                                                {slot.teacher && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <UserCheck size={14} className="text-emerald-400" />
                                                        <span>Faculty ID: {slot.teacher}</span>
                                                    </div>
                                                )}
                                                {slot.room && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <DoorOpen size={14} className="text-purple-400" />
                                                        <span>Room: {slot.room}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {slot.note && (
                                                <p className="mt-1 text-xs italic text-slate-400">
                                                    Note: "{slot.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-3 flex items-center gap-2 sm:mt-0">
                                        <button
                                            type="button"
                                            onClick={() => handleSubstituteSlot(slot)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                                        >
                                            <ArrowRightLeft size={13} />
                                            <span>Substitute</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancelSlot(slot)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                                        >
                                            <Ban size={13} />
                                            <span>Cancel Slot</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ============================================================== */}
            {/* SUBMIT OVERRIDE / SUBSTITUTION MODAL                           */}
            {/* ============================================================== */}
            {isOverrideModalOpen && (
                createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={() => setIsOverrideModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                        >
                            <header className="flex items-start justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-2.5 text-rose-300">
                                        <ArrowRightLeft size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {overrideForm.action === "CANCEL"
                                                ? "Cancel Lecture Period"
                                                : "Teacher / Period Substitution"}
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Apply changes to scheduled classes for {overrideForm.overrideDate}.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOverrideModalOpen(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </header>

                            <form onSubmit={handleSubmitOverride} className="p-5 space-y-4 text-xs">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-slate-300 font-medium">
                                            Override Action <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative mt-1">
                                            <select
                                                value={overrideForm.action}
                                                onChange={(e) =>
                                                    setOverrideForm((prev) => ({
                                                        ...prev,
                                                        action: e.target.value as OverrideAction,
                                                    }))
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                                            >
                                                {OVERRIDE_ACTIONS.map((a) => (
                                                    <option key={a} value={a}>
                                                        {a === "REPLACE"
                                                            ? "Replace / Substitute"
                                                            : a === "CANCEL"
                                                            ? "Cancel Class"
                                                            : "Add Extra Class"}
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-medium">
                                            Approval Mode <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative mt-1">
                                            <select
                                                value={overrideForm.approvalMode}
                                                onChange={(e) =>
                                                    setOverrideForm((prev) => ({
                                                        ...prev,
                                                        approvalMode: e.target.value as OverrideApprovalMode,
                                                    }))
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                                            >
                                                <option value="IMMEDIATE">Immediate (Apply Now)</option>
                                                <option value="REQUIRES_APPROVAL">Requires Approval</option>
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-medium">
                                        Reason for Substitution / Cancellation <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Faculty medical absence, Lab maintenance"
                                        value={overrideForm.reason}
                                        onChange={(e) =>
                                            setOverrideForm((prev) => ({ ...prev, reason: e.target.value }))
                                        }
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                                    />
                                    <FieldError>{formErrors.reason}</FieldError>
                                </div>

                                {overrideForm.action !== "CANCEL" && (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-slate-300 font-medium">
                                                    Substitute Subject <span className="text-rose-400">*</span>
                                                </label>
                                                <div className="relative mt-1">
                                                    <select
                                                        value={overrideForm.subjectId}
                                                        onChange={(e) =>
                                                            setOverrideForm((prev) => ({
                                                                ...prev,
                                                                subjectId: Number(e.target.value) || "",
                                                            }))
                                                        }
                                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                                                    >
                                                        <option value="">Select Subject...</option>
                                                        {subjects.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <SelectChevron />
                                                </div>
                                                <FieldError>{formErrors.subjectId}</FieldError>
                                            </div>

                                            <div>
                                                <label className="block text-slate-300 font-medium">
                                                    Substitute Teacher <span className="text-rose-400">*</span>
                                                </label>
                                                <div className="relative mt-1">
                                                    <select
                                                        value={overrideForm.teacherEnrollmentId}
                                                        onChange={(e) =>
                                                            setOverrideForm((prev) => ({
                                                                ...prev,
                                                                teacherEnrollmentId: Number(e.target.value) || "",
                                                            }))
                                                        }
                                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                                                    >
                                                        <option value="">Select Faculty...</option>
                                                        {teachers.map((t) => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <SelectChevron />
                                                </div>
                                                <FieldError>{formErrors.teacherEnrollmentId}</FieldError>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-slate-300 font-medium">Room</label>
                                                <div className="relative mt-1">
                                                    <select
                                                        value={overrideForm.roomId}
                                                        onChange={(e) =>
                                                            setOverrideForm((prev) => ({
                                                                ...prev,
                                                                roomId: Number(e.target.value) || "",
                                                            }))
                                                        }
                                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                                                    >
                                                        <option value="">Select Classroom...</option>
                                                        {rooms.map((r) => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.roomNumber} ({r.buildingName || "Main"})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <SelectChevron />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-slate-300 font-medium">Lecture Type</label>
                                                <div className="relative mt-1">
                                                    <select
                                                        value={overrideForm.entryType}
                                                        onChange={(e) =>
                                                            setOverrideForm((prev) => ({
                                                                ...prev,
                                                                entryType: e.target.value as TimetableEntryType,
                                                            }))
                                                        }
                                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                                                    >
                                                        {TIMETABLE_ENTRY_TYPES.map((t) => (
                                                            <option key={t} value={t}>
                                                                {t}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <SelectChevron />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-slate-300 font-medium">Remarks</label>
                                    <input
                                        type="text"
                                        placeholder="Optional instructions for students and staff..."
                                        value={overrideForm.remarks}
                                        onChange={(e) =>
                                            setOverrideForm((prev) => ({ ...prev, remarks: e.target.value }))
                                        }
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                                    />
                                </div>

                                <footer className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsOverrideModalOpen(false)}
                                        className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 hover:brightness-110 disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={14} />
                                                <span>Apply Override</span>
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
