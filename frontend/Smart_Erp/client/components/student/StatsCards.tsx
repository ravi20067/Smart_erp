import type { DashboardOverviewResponse } from "@/services/studentPortalService";

interface StatsCardsProps {
    overview: DashboardOverviewResponse | null;
    loading: boolean;
}

export default function StatsCards({ overview, loading }: StatsCardsProps) {
    const attendancePct = overview?.attendanceStats.attendancePercentage ?? 0;
    const totalAttRecords = overview?.attendanceStats.totalRecords ?? 0;
    const attended =
        (overview?.attendanceStats.presentCount ?? 0) + (overview?.attendanceStats.lateCount ?? 0);

    const todayClasses = overview?.todaySchedule?.open
        ? overview.todaySchedule.slots.length
        : 0;

    const feeInitialized = overview?.feeStats.initialized ?? false;
    const feeDue = overview?.feeStats.totalDueBalance ?? 0;
    const feeStatus = overview?.feeStats.overallStatus ?? "PENDING";

    const upcomingCount = overview?.upcomingEvents?.length ?? 0;

    const stats = [
        {
            title: "Attendance Rate",
            value: loading ? "…" : totalAttRecords > 0 ? `${attendancePct}%` : "No Logs Yet",
            subtitle:
                totalAttRecords > 0
                    ? `${attended} of ${totalAttRecords} verified sessions`
                    : "Mark QR attendance in class",
            accent: attendancePct >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
        },
        {
            title: "Today's Lectures",
            value: loading
                ? "…"
                : overview?.todaySchedule && !overview.todaySchedule.open
                  ? "Closed"
                  : String(todayClasses),
            subtitle: overview?.todaySchedule?.dayTitle || "Published section + group slots",
            accent: "text-blue-600 dark:text-blue-400",
        },
        {
            title: "Fee Account Due",
            value: loading
                ? "…"
                : feeInitialized
                  ? `₹${Number(feeDue).toLocaleString("en-IN")}`
                  : "Pending Setup",
            subtitle: feeInitialized
                ? `${feeStatus} • ${overview?.feeStats.installmentCount || 1} installment(s)`
                : "Awaiting finance ledger",
            accent: Number(feeDue) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Upcoming Calendar Events",
            value: loading ? "…" : String(upcomingCount),
            subtitle: "Holidays, exams & half-days (next 60d)",
            accent: "text-purple-600 dark:text-purple-400",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
                <div
                    key={s.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {s.title}
                    </p>
                    <p className={`mt-2 text-2xl font-bold ${s.accent}`}>{s.value}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{s.subtitle}</p>
                </div>
            ))}
        </div>
    );
}
