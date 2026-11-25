import { CalendarRange } from "lucide-react";
import type { CalendarDay } from "@/services/studentPortalService";

interface UpcomingExamsProps {
    events: CalendarDay[];
    loading: boolean;
}

export default function UpcomingExams({ events, loading }: UpcomingExamsProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <CalendarRange size={18} className="text-purple-500" />
                <span>Upcoming Academic Calendar & Exams</span>
            </h2>

            {loading ? (
                <p className="text-sm text-slate-500">Loading calendar events...</p>
            ) : events.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming holidays or exams scheduled in the next 60 days.</p>
            ) : (
                <div className="space-y-2.5 text-sm">
                    {events.map((ev) => (
                        <div
                            key={ev.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60"
                        >
                            <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                    {ev.title || ev.holidayReason || ev.dayType}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {ev.dayType} • {ev.operatingStatus}
                                </p>
                            </div>
                            <span className="shrink-0 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                {ev.calendarDate}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
