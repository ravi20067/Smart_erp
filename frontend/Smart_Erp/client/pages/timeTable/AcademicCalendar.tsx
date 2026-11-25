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
    Calendar as CalendarIcon,
    CalendarCheck,
    CalendarDays,
    CalendarRange,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    DoorClosed,
    DoorOpen,
    Eye,
    GraduationCap,
    Info,
    Layers,
    LoaderCircle,
    PartyPopper,
    Pencil,
    Plus,
    Presentation,
    RefreshCw,
    Search,
    Sparkles,
    Sun,
    X,
} from "lucide-react";

import {
    createCalendar,
    extractErrorMessage,
    getAcademicYearFilter,
    getCalendar,
    getCalendarBySection,
    getCalendarDays,
    getSectionFilter,
    publishCalendar,
    upsertCalendarDay,
    type CalendarDayRequest,
    type CalendarDayResponse,
    type CalendarDayType,
    type CalendarRequest,
    type CalendarResponse,
    type CalendarStatus,
    type CommonDTO,
    type OperatingStatus,
    CALENDAR_DAY_TYPES,
} from "@/services/timetable/sectionCalendarService";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CreateCalendarForm {
    name: string;
    sectionId: number | "";
    academicYearId: number | "";
    startDate: string;
    endDate: string;
    defaultOpeningTime: string;
    defaultClosingTime: string;
}

const DEFAULT_CALENDAR_FORM: CreateCalendarForm = {
    name: "",
    sectionId: "",
    academicYearId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
    defaultOpeningTime: "08:30",
    defaultClosingTime: "15:30",
};

interface DayFormState {
    calendarDate: string;
    dayType: CalendarDayType;
    operatingStatus: OperatingStatus;
    title: string;
    description: string;
    holidayReason: string;
    openingTime: string;
    closingTime: string;
    appliedTimetableVersionId: string;
    instructionDay: boolean;
}

function formatTime(t?: string | null): string {
    if (!t) return "";
    const parts = t.split(":");
    if (parts.length < 2) return t;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const p = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}:${m} ${p}`;
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

function DayTypeBadge({ type }: { type: CalendarDayType }) {
    switch (type) {
        case "HOLIDAY":
            return (
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <PartyPopper size={10} /> Holiday
                </span>
            );
        case "HALF_DAY":
            return (
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Sun size={10} /> Half-Day
                </span>
            );
        case "EXAMINATION":
            return (
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <GraduationCap size={10} /> Exam
                </span>
            );
        case "SPECIAL":
        case "EVENT":
            return (
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Sparkles size={10} /> {type === "EVENT" ? "Event" : "Special"}
                </span>
            );
        case "REGULAR":
        default:
            return (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 border border-white/5">
                    Regular
                </span>
            );
    }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AcademicCalendarPage() {
    // Dropdown filters
    const [sections, setSections] = useState<CommonDTO[]>([]);
    const [academicYears, setAcademicYears] = useState<CommonDTO[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<number | "">("");
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | "">("");

    // Active calendar state (logically bound 1:1 to selected section)
    const [currentCalendarId, setCurrentCalendarId] = useState<number | null>(null);
    const [activeCalendar, setActiveCalendar] = useState<CalendarResponse | null>(null);
    const [calendarDays, setCalendarDays] = useState<Record<string, CalendarDayResponse>>({});

    const formatLocalYmd = useCallback((d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    // Date navigation
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateCalendarForm>(DEFAULT_CALENDAR_FORM);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState<string>("");
    const [dayForm, setDayForm] = useState<DayFormState>({
        calendarDate: "",
        dayType: "REGULAR",
        operatingStatus: "OPEN",
        title: "",
        description: "",
        holidayReason: "",
        openingTime: "08:30",
        closingTime: "15:30",
        appliedTimetableVersionId: "",
        instructionDay: true,
    });

    /* ---------------------------------------------------------------------- */
    /* Load Initial Options                                                   */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        async function fetchOptions() {
            try {
                const [secs, ays] = await Promise.all([
                    getSectionFilter(),
                    getAcademicYearFilter(),
                ]);
                setSections(secs);
                setAcademicYears(ays);

                if (secs.length > 0 && !selectedSectionId) {
                    setSelectedSectionId(secs[0].id);
                }
                if (ays.length > 0 && !selectedAcademicYearId) {
                    setSelectedAcademicYearId(ays[0].id);
                }
            } catch {
                // Silently fallback to empty
            }
        }
        fetchOptions();
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Auto-Bind Single Section Calendar on Section Selection                 */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (!selectedSectionId) {
            setCurrentCalendarId(null);
            setActiveCalendar(null);
            setCalendarDays({});
            return;
        }
        let cancelled = false;
        async function resolveSectionCalendar() {
            setLoading(true);
            setErrorMessage("");
            try {
                const boundCal = await getCalendarBySection(Number(selectedSectionId));
                if (cancelled) return;
                if (boundCal) {
                    setCurrentCalendarId(boundCal.id);
                    setActiveCalendar(boundCal);
                    if (boundCal.academicYearId) {
                        setSelectedAcademicYearId(boundCal.academicYearId);
                    }
                } else {
                    setCurrentCalendarId(null);
                    setActiveCalendar(null);
                    setCalendarDays({});
                }
            } catch (err) {
                if (!cancelled) {
                    setErrorMessage(extractErrorMessage(err, "Failed to resolve section calendar."));
                    setCurrentCalendarId(null);
                    setActiveCalendar(null);
                    setCalendarDays({});
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        resolveSectionCalendar();
        return () => {
            cancelled = true;
        };
    }, [selectedSectionId]);

    /* ---------------------------------------------------------------------- */
    /* Load Active Calendar & Month Days                                      */
    /* ---------------------------------------------------------------------- */

    const loadCalendarInfo = useCallback(async () => {
        if (!currentCalendarId) return;
        setLoading(true);
        setErrorMessage("");

        try {
            const cal = await getCalendar(currentCalendarId);
            setActiveCalendar(cal);

            // Determine date range for currently viewed month using local timezone dates
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const fromStr = formatLocalYmd(firstDay);
            const toStr = formatLocalYmd(lastDay);

            const days = await getCalendarDays(cal.id, fromStr, toStr);
            const daysMap: Record<string, CalendarDayResponse> = {};
            for (const d of days) {
                daysMap[d.calendarDate] = d;
            }
            setCalendarDays(daysMap);
        } catch (err) {
            setErrorMessage(extractErrorMessage(err, "Failed to load calendar days."));
        } finally {
            setLoading(false);
        }
    }, [currentCalendarId, viewDate, formatLocalYmd]);

    useEffect(() => {
        if (currentCalendarId) {
            loadCalendarInfo();
        }
    }, [currentCalendarId, viewDate, loadCalendarInfo]);

    /* ---------------------------------------------------------------------- */
    /* Month Grid Computations                                                */
    /* ---------------------------------------------------------------------- */

    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);

        const startDayOfWeek = firstOfMonth.getDay(); // 0 = Sun
        const totalDays = lastOfMonth.getDate();

        const cells: Array<{
            dateStr: string;
            dayNumber: number;
            isCurrentMonth: boolean;
            isToday: boolean;
        }> = [];

        // Leading days from previous month
        const prevMonthLastDate = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDate - i;
            const d = new Date(year, month - 1, dayNum);
            cells.push({
                dateStr: formatLocalYmd(d),
                dayNumber: dayNum,
                isCurrentMonth: false,
                isToday: false,
            });
        }

        // Current month days
        const todayStr = formatLocalYmd(new Date());
        for (let day = 1; day <= totalDays; day++) {
            const d = new Date(year, month, day);
            const dateStr = formatLocalYmd(d);
            cells.push({
                dateStr,
                dayNumber: day,
                isCurrentMonth: true,
                isToday: dateStr === todayStr,
            });
        }

        // Trailing days to fill 5 or 6 weeks (multiple of 7)
        const totalCells = cells.length;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            const needed = 7 - remainder;
            for (let i = 1; i <= needed; i++) {
                const d = new Date(year, month + 1, i);
                cells.push({
                    dateStr: formatLocalYmd(d),
                    dayNumber: i,
                    isCurrentMonth: false,
                    isToday: false,
                });
            }
        }

        return cells;
    }, [viewDate, formatLocalYmd]);

    /* ---------------------------------------------------------------------- */
    /* Create Calendar Handler                                                */
    /* ---------------------------------------------------------------------- */

    const handleOpenCreateCalendar = () => {
        const sec = sections.find((s) => s.id === selectedSectionId);
        const ay = academicYears.find((a) => a.id === selectedAcademicYearId);

        setCreateForm({
            ...DEFAULT_CALENDAR_FORM,
            sectionId: selectedSectionId || (sections[0]?.id ?? ""),
            academicYearId: selectedAcademicYearId || (academicYears[0]?.id ?? ""),
            name: sec && ay ? `${sec.name} Calendar (${ay.name})` : "Section Academic Calendar",
        });
        setCreateErrors({});
        setIsCreateModalOpen(true);
    };

    const handleCreateCalendarSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!createForm.name.trim()) errors.name = "Calendar name is required.";
        if (!createForm.sectionId) errors.sectionId = "Please select a section.";
        if (!createForm.academicYearId) errors.academicYearId = "Please select an academic year.";
        if (!createForm.startDate) errors.startDate = "Start date is required.";
        if (!createForm.endDate) errors.endDate = "End date is required.";

        setCreateErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setBusy(true);
        try {
            const res = await createCalendar({
                name: createForm.name.trim(),
                sectionId: Number(createForm.sectionId),
                academicYearId: Number(createForm.academicYearId),
                startDate: createForm.startDate,
                endDate: createForm.endDate,
                defaultOpeningTime: createForm.defaultOpeningTime || null,
                defaultClosingTime: createForm.defaultClosingTime || null,
            });

            toast.success("Section calendar created successfully!");
            setCurrentCalendarId(res.id);
            setActiveCalendar(res);
            setIsCreateModalOpen(false);
        } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to create calendar."));
        } finally {
            setBusy(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Day Editing Handler                                                    */
    /* ---------------------------------------------------------------------- */

    const handleCellClick = (dateStr: string) => {
        if (!currentCalendarId) {
            toast.info("Please create or select an Academic Calendar first.");
            return;
        }

        setSelectedDateStr(dateStr);
        const existing = calendarDays[dateStr];

        if (existing) {
            setDayForm({
                calendarDate: dateStr,
                dayType: existing.dayType,
                operatingStatus: existing.operatingStatus,
                title: existing.title || "",
                description: existing.description || "",
                holidayReason: existing.holidayReason || "",
                openingTime: existing.openingTime || activeCalendar?.defaultOpeningTime || "08:30",
                closingTime: existing.closingTime || activeCalendar?.defaultClosingTime || "15:30",
                appliedTimetableVersionId: existing.appliedTimetableVersionId
                    ? String(existing.appliedTimetableVersionId)
                    : "",
                instructionDay: existing.instructionDay,
            });
        } else {
            // Check if Sunday: default to closed holiday
            const isSunday = new Date(dateStr).getDay() === 0;
            setDayForm({
                calendarDate: dateStr,
                dayType: isSunday ? "HOLIDAY" : "REGULAR",
                operatingStatus: isSunday ? "CLOSED" : "OPEN",
                title: isSunday ? "Sunday Weekend" : "",
                description: "",
                holidayReason: isSunday ? "Weekly Holiday" : "",
                openingTime: activeCalendar?.defaultOpeningTime || "08:30",
                closingTime: activeCalendar?.defaultClosingTime || "15:30",
                appliedTimetableVersionId: "",
                instructionDay: !isSunday,
            });
        }

        setIsDayModalOpen(true);
    };

    const handleSaveDay = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentCalendarId) return;

        setBusy(true);
        try {
            const payload: CalendarDayRequest = {
                calendarDate: dayForm.calendarDate,
                dayType: dayForm.dayType,
                operatingStatus: dayForm.operatingStatus,
                title: dayForm.title.trim() || undefined,
                description: dayForm.description.trim() || undefined,
                holidayReason: dayForm.holidayReason.trim() || undefined,
                openingTime: dayForm.openingTime || undefined,
                closingTime: dayForm.closingTime || undefined,
                appliedTimetableVersionId: dayForm.appliedTimetableVersionId
                    ? Number(dayForm.appliedTimetableVersionId)
                    : undefined,
                instructionDay: dayForm.instructionDay,
            };

            const updated = await upsertCalendarDay(currentCalendarId, payload);
            setCalendarDays((prev) => ({
                ...prev,
                [updated.calendarDate]: updated,
            }));

            toast.success(`Schedule saved for ${dayForm.calendarDate}!`);
            setIsDayModalOpen(false);
        } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to save calendar day."));
        } finally {
            setBusy(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Month Navigators                                                       */
    /* ---------------------------------------------------------------------- */

    const prevMonth = () => {
        setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    };

    const gotoToday = () => {
        setViewDate(new Date());
    };

    const handlePublishCalendar = async () => {
        if (!activeCalendar) return;
        setBusy(true);
        try {
            const published = await publishCalendar(activeCalendar.id);
            setActiveCalendar(published);
            toast.success("Academic calendar published! Attendance and timetable overrides are now bound to it.");
        } catch (err) {
            toast.error(extractErrorMessage(err, "Failed to publish academic calendar."));
        } finally {
            setBusy(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Month Summary Statistics                                               */
    /* ---------------------------------------------------------------------- */

    const monthStats = useMemo(() => {
        const days = Object.values(calendarDays);
        const holidays = days.filter((d) => d.dayType === "HOLIDAY" || d.operatingStatus === "CLOSED").length;
        const exams = days.filter((d) => d.dayType === "EXAMINATION").length;
        const instructionDays = days.filter((d) => d.instructionDay).length;
        return { holidays, exams, instructionDays };
    }, [calendarDays]);

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
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-500/10">
                                <CalendarRange size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    Section Academic Calendar
                                </h1>
                                <p className="text-xs text-slate-400 sm:text-sm">
                                    Schedule term working days, holidays, examination dates, and custom daily operating hours.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {activeCalendar && activeCalendar.status === "DRAFT" && (
                            <button
                                type="button"
                                onClick={handlePublishCalendar}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                                <CheckCircle2 size={16} />
                                <span>Publish Calendar</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleOpenCreateCalendar}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 active:scale-95"
                        >
                            <Plus size={16} />
                            <span>New Academic Calendar</span>
                        </button>
                    </div>
                </header>

                {/* Calendar Selector / Setup Banner */}
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                            <Presentation size={15} className="text-cyan-400" />
                            <span>Section:</span>
                        </div>
                        <div className="relative min-w-[180px]">
                            <select
                                aria-label="Select Section"
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(Number(e.target.value) || "")}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-purple-400 focus:outline-none"
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

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 ml-2">
                            <CalendarIcon size={15} className="text-purple-400" />
                            <span>Academic Year:</span>
                        </div>
                        <div className="relative min-w-[180px]">
                            <select
                                aria-label="Select Academic Year"
                                value={selectedAcademicYearId}
                                onChange={(e) => setSelectedAcademicYearId(Number(e.target.value) || "")}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-purple-400 focus:outline-none"
                            >
                                <option value="">Select Academic Year...</option>
                                {academicYears.map((ay) => (
                                    <option key={ay.id} value={ay.id}>
                                        {ay.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeCalendar ? (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                <span
                                    className={`rounded-md border px-2.5 py-1 font-semibold ${
                                        activeCalendar.status === "PUBLISHED"
                                            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                            : "border-amber-400/30 bg-amber-500/15 text-amber-300"
                                    }`}
                                >
                                    {activeCalendar.status} • #{activeCalendar.id}
                                </span>
                                <span className="text-slate-300 font-medium">
                                    {activeCalendar.name}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-amber-300">
                                <AlertTriangle size={15} />
                                <span>
                                    {selectedSectionId
                                        ? "No calendar bound to this section yet. Click \"New Academic Calendar\"."
                                        : "Select a section to view or create its single academic calendar."}
                                </span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={loadCalendarInfo}
                            disabled={!currentCalendarId || loading}
                            className="rounded-lg border border-white/10 bg-slate-800 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                            title="Refresh calendar"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Month Navigation & Stats Banner */}
                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">
                            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </h2>
                        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                                aria-label="Previous Month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={gotoToday}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                                aria-label="Next Month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Month Metrics */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-rose-300">
                            <PartyPopper size={13} />
                            <span>{monthStats.holidays} Holidays / Closed</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-purple-300">
                            <GraduationCap size={13} />
                            <span>{monthStats.exams} Exams</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                            <CheckCircle2 size={13} />
                            <span>{monthStats.instructionDays} Instruction Days</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid Table */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b border-white/10 bg-slate-950/70 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {WEEK_DAYS.map((day) => (
                            <div key={day} className="py-3">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Date cells grid */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-white/5">
                        {calendarGrid.map((cell, idx) => {
                            const dayData = calendarDays[cell.dateStr];
                            const isClosed = dayData?.operatingStatus === "CLOSED";
                            const isHoliday = dayData?.dayType === "HOLIDAY" || isClosed;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleCellClick(cell.dateStr)}
                                    className={`group relative min-h-[105px] cursor-pointer p-2.5 transition-all hover:bg-white/[0.04] ${
                                        cell.isCurrentMonth ? "bg-slate-900/40" : "bg-slate-950/40 opacity-40"
                                    } ${cell.isToday ? "ring-1 ring-inset ring-purple-400/50 bg-purple-500/[0.05]" : ""}`}
                                >
                                    {/* Top cell row: day number + status icon */}
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                cell.isToday
                                                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                                                    : cell.isCurrentMonth
                                                    ? "text-slate-200"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            {cell.dayNumber}
                                        </span>

                                        {dayData && (
                                            <div className="flex items-center gap-1">
                                                {isClosed ? (
                                                    <span title="Closed">
                                                        <DoorClosed size={12} className="text-rose-400" />
                                                    </span>
                                                ) : (
                                                    <span title="Open">
                                                        <DoorOpen size={12} className="text-emerald-400" />
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Day content badges */}
                                    <div className="mt-2 space-y-1">
                                        {dayData ? (
                                            <>
                                                <div className="flex items-center justify-between gap-1">
                                                    <DayTypeBadge type={dayData.dayType} />
                                                    {dayData.instructionDay && (
                                                        <span className="text-[10px] text-emerald-400 font-mono">
                                                            ● Inst
                                                        </span>
                                                    )}
                                                </div>

                                                {dayData.title && (
                                                    <p className="truncate text-[11px] font-semibold text-white">
                                                        {dayData.title}
                                                    </p>
                                                )}

                                                {dayData.holidayReason && (
                                                    <p className="truncate text-[10px] text-rose-300">
                                                        {dayData.holidayReason}
                                                    </p>
                                                )}

                                                {dayData.openingTime && dayData.closingTime && !isClosed && (
                                                    <p className="text-[10px] font-mono text-slate-400">
                                                        {formatTime(dayData.openingTime)} - {formatTime(dayData.closingTime)}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pt-3 text-[11px] text-slate-500">
                                                <Plus size={13} className="mr-0.5" /> Configure
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* CREATE SECTION CALENDAR MODAL                                  */}
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
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                        >
                            <header className="flex items-start justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-2.5 text-purple-300">
                                        <CalendarRange size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Create Academic Calendar</h2>
                                        <p className="text-xs text-slate-400">
                                            Establish term duration and calendar boundaries for a section.
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

                            <form onSubmit={handleCreateCalendarSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">
                                        Calendar Name <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.name}
                                        onChange={(e) =>
                                            setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="e.g. Grade 10 - Section A Term 1 Calendar"
                                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                                    />
                                    <FieldError>{createErrors.name}</FieldError>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Section <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative mt-1.5">
                                            <select
                                                value={createForm.sectionId}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        sectionId: Number(e.target.value) || "",
                                                    }))
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-purple-400 focus:outline-none"
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
                                        <FieldError>{createErrors.sectionId}</FieldError>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Academic Year <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative mt-1.5">
                                            <select
                                                value={createForm.academicYearId}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        academicYearId: Number(e.target.value) || "",
                                                    }))
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-purple-400 focus:outline-none"
                                            >
                                                <option value="">Select Academic Year...</option>
                                                {academicYears.map((ay) => (
                                                    <option key={ay.id} value={ay.id}>
                                                        {ay.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        <FieldError>{createErrors.academicYearId}</FieldError>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Start Date <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.startDate}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({ ...prev, startDate: e.target.value }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                                        />
                                        <FieldError>{createErrors.startDate}</FieldError>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            End Date <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.endDate}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                                        />
                                        <FieldError>{createErrors.endDate}</FieldError>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Default Opening Time
                                        </label>
                                        <input
                                            type="time"
                                            value={createForm.defaultOpeningTime}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    defaultOpeningTime: e.target.value,
                                                }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Default Closing Time
                                        </label>
                                        <input
                                            type="time"
                                            value={createForm.defaultClosingTime}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    defaultClosingTime: e.target.value,
                                                }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <footer className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600 disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={14} />
                                                <span>Create Calendar</span>
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
            {/* CONFIGURE CALENDAR DAY MODAL                                   */}
            {/* ============================================================== */}
            {isDayModalOpen && (
                createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={() => setIsDayModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                        >
                            <header className="flex items-start justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-2.5 text-purple-300">
                                        <CalendarCheck size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Configure Date Schedule</h2>
                                        <p className="text-xs text-slate-400">
                                            {selectedDateStr} • Set holiday, exam, or operating hours
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDayModalOpen(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </header>

                            <form onSubmit={handleSaveDay} className="p-5 space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Operating Status <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative mt-1.5">
                                            <select
                                                value={dayForm.operatingStatus}
                                                onChange={(e) =>
                                                    setDayForm((prev) => ({
                                                        ...prev,
                                                        operatingStatus: e.target.value as OperatingStatus,
                                                        instructionDay: e.target.value === "OPEN",
                                                    }))
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-purple-400 focus:outline-none"
                                            >
                                                <option value="OPEN">Open (Operating)</option>
                                                <option value="CLOSED">Closed (No Classes)</option>
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Day Category <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative mt-1.5">
                                            <select
                                                value={dayForm.dayType}
                                                onChange={(e) =>
                                                    setDayForm((prev) => ({
                                                        ...prev,
                                                        dayType: e.target.value as CalendarDayType,
                                                    }))
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 pr-8 text-xs text-white focus:border-purple-400 focus:outline-none"
                                            >
                                                {CALENDAR_DAY_TYPES.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t.replace(/_/g, " ")}
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300">
                                        Day Title / Event Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Independence Day, Annual Science Fair"
                                        value={dayForm.title}
                                        onChange={(e) =>
                                            setDayForm((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                                    />
                                </div>

                                {(dayForm.dayType === "HOLIDAY" || dayForm.operatingStatus === "CLOSED") && (
                                    <div>
                                        <label className="block text-xs font-medium text-rose-300">
                                            Closure / Holiday Reason
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Reason for closure or holiday notification..."
                                            value={dayForm.holidayReason}
                                            onChange={(e) =>
                                                setDayForm((prev) => ({
                                                    ...prev,
                                                    holidayReason: e.target.value,
                                                }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-white placeholder-rose-300/50 focus:border-rose-400 focus:outline-none"
                                        />
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Opening Time
                                        </label>
                                        <input
                                            type="time"
                                            value={dayForm.openingTime}
                                            onChange={(e) =>
                                                setDayForm((prev) => ({
                                                    ...prev,
                                                    openingTime: e.target.value,
                                                }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            Closing Time
                                        </label>
                                        <input
                                            type="time"
                                            value={dayForm.closingTime}
                                            onChange={(e) =>
                                                setDayForm((prev) => ({
                                                    ...prev,
                                                    closingTime: e.target.value,
                                                }))
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300">
                                        Special Applied Timetable Version ID (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Leave blank to use default published version..."
                                        value={dayForm.appliedTimetableVersionId}
                                        onChange={(e) =>
                                            setDayForm((prev) => ({
                                                ...prev,
                                                appliedTimetableVersionId: e.target.value,
                                            }))
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="inst-day"
                                        checked={dayForm.instructionDay}
                                        onChange={(e) =>
                                            setDayForm((prev) => ({
                                                ...prev,
                                                instructionDay: e.target.checked,
                                            }))
                                        }
                                        className="h-4 w-4 rounded border-white/20 bg-slate-950 text-purple-500 focus:ring-purple-400"
                                    />
                                    <label htmlFor="inst-day" className="text-xs text-slate-300 cursor-pointer">
                                        Count as Teaching / Instruction Day for Attendance
                                    </label>
                                </div>

                                <footer className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsDayModalOpen(false)}
                                        className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600 disabled:opacity-50"
                                    >
                                        {busy ? (
                                            <>
                                                <LoaderCircle size={14} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={14} />
                                                <span>Save Schedule</span>
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
