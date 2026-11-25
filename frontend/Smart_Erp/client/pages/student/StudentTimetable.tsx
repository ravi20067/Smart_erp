import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Calendar,
    Clock,
    FlaskConical,
    GitBranch,
    MapPin,
    Sparkles,
    User,
    XCircle,
} from "lucide-react";
import {
    studentPortalService,
    type StudentTimetableResponse,
    type TimetableEntry,
} from "@/services/studentPortalService";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function StudentTimetable() {
    const [data, setData] = useState<StudentTimetableResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        studentPortalService
            .getTimetable()
            .then(setData)
            .catch((e) => setError(e?.response?.data?.message || e?.message || "Failed to load timetable"))
            .finally(() => setLoading(false));
    }, []);

    const byDay = useMemo(() => {
        const grouped: Record<string, TimetableEntry[]> = {};
        DAYS.forEach((d) => (grouped[d] = []));
        (data?.entries || []).forEach((e) => {
            if (!grouped[e.dayOfWeek]) grouped[e.dayOfWeek] = [];
            grouped[e.dayOfWeek].push(e);
        });
        Object.values(grouped).forEach((arr) =>
            arr.sort((a, b) => (a.sequenceNumber || a.periodNumber || 0) - (b.sequenceNumber || b.periodNumber || 0))
        );
        return grouped;
    }, [data]);

    if (loading) {
        return <div className="p-8 text-slate-400">Loading your core and specialization timetable...</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                    {error}
                </div>
            </div>
        );
    }

    const todayView = data?.todayView;

    return (
        <div className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <Calendar className="text-indigo-400" />
                        <span>Weekly Timetable & Class Schedule</span>
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Section {data?.sectionName || "-"}
                        {data?.sectionGroupName ? ` • Group ${data.sectionGroupName}` : ""}
                        {data?.specializationName ? ` (${data.specializationName})` : ""}
                        {data?.versionName ? ` • Schedule: ${data.versionName}` : ""}
                    </p>
                </div>
            </header>

            {/* Today's Live Schedule + Overrides */}
            {todayView && (
                <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-cyan-400" />
                            <h2 className="font-bold text-white">
                                Today ({todayView.date}) — {todayView.dayTitle || (todayView.open ? "Classes Active" : "Closed")}
                            </h2>
                        </div>
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                                todayView.open
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-rose-500/20 text-rose-300"
                            }`}
                        >
                            {todayView.open ? "OPEN" : "CLOSED"}
                        </span>
                    </div>

                    {!todayView.open ? (
                        <div className="mt-4 flex items-center gap-2 text-sm text-rose-300">
                            <XCircle size={16} />
                            <span>{todayView.closureReason || "No classes scheduled today per Academic Calendar."}</span>
                        </div>
                    ) : todayView.slots.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-400">No lectures scheduled for today.</p>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {todayView.slots.map((slot, idx) => (
                                <div
                                    key={slot.entryId ?? idx}
                                    className={`rounded-xl border p-3 ${
                                        slot.overridden
                                            ? "border-amber-400/40 bg-amber-500/10"
                                            : "border-slate-800 bg-slate-950/70"
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span className="font-mono text-indigo-300">
                                            {slot.startTime?.slice(0, 5)} – {slot.endTime?.slice(0, 5)}
                                        </span>
                                        {slot.overridden && (
                                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                                Overridden
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 font-semibold text-white">{slot.subject}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {slot.teacher || "Faculty"} • {slot.room || "Room TBA"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Enrolled Core + Specialization Subjects Summary */}
            {data?.enrolledSubjects && data.enrolledSubjects.length > 0 && (
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                        <BookOpen size={15} className="text-sky-400" />
                        <span>Active Subjects & Assigned Faculty ({data.enrolledSubjects.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {data.enrolledSubjects.map((s) => (
                            <div
                                key={s.subjectId}
                                className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 text-xs"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-white">{s.subjectName}</span>
                                    <span
                                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                            s.scope === "SECTION_GROUP"
                                                ? "bg-purple-500/20 text-purple-300"
                                                : "bg-sky-500/20 text-sky-300"
                                        }`}
                                    >
                                        {s.scope === "SECTION_GROUP" ? "Specialization" : "Core"}
                                    </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-slate-400">
                                    {s.subjectCode && <span className="font-mono">{s.subjectCode}</span>}
                                    {s.teacherName && <span>Prof. {s.teacherName}</span>}
                                    {s.isPractical && (
                                        <span className="inline-flex items-center gap-1 text-amber-300">
                                            <FlaskConical size={12} /> Practical Lab
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Weekly Schedule Cards */}
            {!data?.entries?.length ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                    No published timetable found for your section yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {DAYS.map((day) => {
                        const list = byDay[day] || [];
                        return (
                            <div
                                key={day}
                                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                            >
                                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
                                    <span className="font-bold text-indigo-400">{day}</span>
                                    <span className="text-xs text-slate-500">
                                        {list.length} {list.length === 1 ? "lecture" : "lectures"}
                                    </span>
                                </div>
                                <div className="space-y-3 p-4">
                                    {list.length === 0 ? (
                                        <p className="text-xs text-slate-500">No scheduled classes</p>
                                    ) : (
                                        list.map((slot) => (
                                            <div
                                                key={slot.entryId}
                                                className={`space-y-1.5 rounded-xl border p-3 ${
                                                    slot.scope === "SECTION_GROUP"
                                                        ? "border-purple-500/30 bg-purple-950/20"
                                                        : "border-slate-800 bg-slate-950/60"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                    <span className="flex items-center gap-1 font-mono text-indigo-300">
                                                        <Clock size={12} />
                                                        {slot.startTime?.slice(0, 5)} – {slot.endTime?.slice(0, 5)}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {slot.scope === "SECTION_GROUP" && (
                                                            <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                                                                <GitBranch size={10} /> Spec.
                                                            </span>
                                                        )}
                                                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                                                            {slot.entryType || "THEORY"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-white">
                                                    {slot.subjectName || "Lecture"}
                                                    {slot.subjectCode ? (
                                                        <span className="ml-1.5 text-xs font-normal text-slate-400">
                                                            ({slot.subjectCode})
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} /> {slot.teacherName || "Faculty"}
                                                    </span>
                                                    {slot.roomNumber && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={12} /> Room {slot.roomNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
