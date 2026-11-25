import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, GraduationCap, PartyPopper, Sparkles, XCircle } from "lucide-react";
import { studentPortalService, type StudentCalendarResponse } from "@/services/studentPortalService";

const FILTER_TABS = ["ALL", "HOLIDAY", "EXAMINATION", "HALF_DAY", "SPECIAL", "EVENT"] as const;

export default function StudentAcademicCalendar() {
    const [data, setData] = useState<StudentCalendarResponse | null>(null);
    const [filter, setFilter] = useState<string>("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        studentPortalService
            .getAcademicCalendar()
            .then(setData)
            .catch((e) => setError(e?.response?.data?.message || e?.message || "Failed to load calendar"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="p-8 text-slate-400">Loading your bound section academic calendar...</div>;
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

    const days = (data?.days || []).filter((d) => filter === "ALL" || d.dayType === filter);

    const getDayBadge = (dayType: string, operatingStatus: string) => {
        if (dayType === "HOLIDAY" || operatingStatus === "CLOSED") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                    <PartyPopper size={12} /> {dayType}
                </span>
            );
        }
        if (dayType === "EXAMINATION") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
                    <GraduationCap size={12} /> EXAMINATION
                </span>
            );
        }
        if (dayType === "HALF_DAY") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                    <Clock size={12} /> HALF DAY
                </span>
            );
        }
        if (dayType === "EVENT" || dayType === "SPECIAL") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
                    <Sparkles size={12} /> {dayType}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={12} /> WORKING DAY
            </span>
        );
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <CalendarDays className="text-purple-400" />
                        <span>Academic Calendar</span>
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {data?.calendarName || "Bound Section Calendar"} • Section {data?.sectionName || "-"}
                        {data?.academicYearName ? ` • ${data.academicYearName}` : ""}
                        {data?.status ? ` • Status: ${data.status}` : ""}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {FILTER_TABS.map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                filter === f
                                    ? "bg-indigo-600 text-white"
                                    : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                            }`}
                        >
                            {f.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </header>

            {days.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                    No calendar days configured for your section matching "{filter.replace("_", " ")}".
                </div>
            ) : (
                <div className="grid gap-3">
                    {days.map((d) => (
                        <div
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="min-w-[115px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-center font-mono text-sm font-bold text-indigo-300">
                                    {d.calendarDate}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {getDayBadge(d.dayType, d.operatingStatus)}
                                        <span className="font-semibold text-white">
                                            {d.title || (d.operatingStatus === "CLOSED" ? "College Closed" : "Regular Classes")}
                                        </span>
                                    </div>
                                    {(d.description || d.holidayReason) && (
                                        <p className="mt-1 text-xs text-slate-400">
                                            {d.holidayReason || d.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                {d.openingTime && d.closingTime && d.operatingStatus !== "CLOSED" && (
                                    <span className="font-mono text-slate-300">
                                        {d.openingTime.slice(0, 5)} – {d.closingTime.slice(0, 5)}
                                    </span>
                                )}
                                {d.operatingStatus === "CLOSED" && (
                                    <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                                        <XCircle size={13} /> Closed
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
