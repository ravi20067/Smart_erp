import { CheckCircle2, Clock } from "lucide-react";
import type { RecentAttendanceItem } from "@/services/studentPortalService";

interface RecentNotificationsProps {
    records: RecentAttendanceItem[];
    loading: boolean;
}

export default function RecentNotifications({ records, loading }: RecentNotificationsProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Clock size={18} className="text-cyan-500" />
                <span>Recent Attendance Activity</span>
            </h2>

            {loading ? (
                <p className="text-sm text-slate-500">Loading attendance logs...</p>
            ) : records.length === 0 ? (
                <p className="text-sm text-slate-500">
                    No attendance records yet. Scan your faculty QR code during class to mark attendance.
                </p>
            ) : (
                <div className="space-y-2.5 text-sm">
                    {records.map((rec) => (
                        <div
                            key={rec.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                    {rec.subjectName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {rec.date || "-"}
                                    {rec.teacherName ? ` • ${rec.teacherName}` : ""}
                                </p>
                            </div>
                            <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    rec.status === "PRESENT"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : rec.status === "LATE"
                                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                }`}
                            >
                                <CheckCircle2 size={12} /> {rec.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
