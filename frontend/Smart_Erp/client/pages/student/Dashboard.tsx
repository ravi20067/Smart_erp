import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    CalendarDays,
    CalendarRange,
    CheckCircle2,
    Clock,
    CreditCard,
    GraduationCap,
    ScanLine,
    ShieldCheck,
} from "lucide-react";

import StatsCards from "@/components/student/StatsCards";
import UpcomingExams from "@/components/student/UpcomingExams";
import RecentNotifications from "@/components/student/RecentNotifications";
import {
    studentPortalService,
    type DashboardOverviewResponse,
    type StudentProfileSummary,
} from "@/services/studentPortalService";

export default function StudentDashboard() {
    const [profile, setProfile] = useState<StudentProfileSummary | null>(null);
    const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let activeUrl: string | null = null;

        async function loadDashboard() {
            try {
                const [prof, ov] = await Promise.all([
                    studentPortalService.getProfileSummary(),
                    studentPortalService.getDashboardOverview(),
                ]);
                setProfile(prof);
                setOverview(ov);

                if (prof.photoUrl) {
                    const objUrl = await studentPortalService.getPhotoObjectUrl();
                    activeUrl = objUrl;
                    setPhotoUrl(objUrl);
                }
            } catch {
                // Keep partial fallback silently if an endpoint fails
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();

        return () => {
            if (activeUrl) {
                URL.revokeObjectURL(activeUrl);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 p-4 dark:bg-slate-950 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Student Profile Hero Header */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={profile?.fullName || "Student"}
                                    className="h-16 w-16 rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                    <GraduationCap size={28} />
                                </div>
                            )}

                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {profile ? `Welcome, ${profile.fullName}` : "Student Academic Portal"}
                                </h1>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    {profile ? (
                                        <>
                                            Reg: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{profile.registrationNumber}</span>
                                            {profile.rollNumber ? ` • Roll: ${profile.rollNumber}` : ""}
                                            {profile.courseName ? ` • ${profile.courseName}` : ""}
                                            {profile.sectionName ? ` • Section ${profile.sectionName}` : ""}
                                            {profile.specializationName ? ` (${profile.specializationName})` : ""}
                                        </>
                                    ) : (
                                        "Loading student academic identity..."
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Biometric Readiness Pill */}
                        {profile && (
                            <div
                                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                                    profile.hasEnrolledFace
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}
                            >
                                {profile.hasEnrolledFace ? (
                                    <>
                                        <ShieldCheck size={16} />
                                        <span>Face Biometrics Active</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle size={16} />
                                        <span>Face Biometrics Pending (Visit Admin)</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Action Navigation Links */}
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Link
                            to="/student/attendance"
                            className="flex items-center gap-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300"
                        >
                            <ScanLine size={18} />
                            <span>Mark QR Attendance</span>
                        </Link>
                        <Link
                            to="/student/timetable"
                            className="flex items-center gap-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/20 dark:text-indigo-300"
                        >
                            <CalendarDays size={18} />
                            <span>Weekly Timetable</span>
                        </Link>
                        <Link
                            to="/student/calendar"
                            className="flex items-center gap-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-500/20 dark:text-purple-300"
                        >
                            <CalendarRange size={18} />
                            <span>Academic Calendar</span>
                        </Link>
                        <Link
                            to="/student/fees"
                            className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                        >
                            <CreditCard size={18} />
                            <span>Fee Account & Receipts</span>
                        </Link>
                    </div>
                </section>

                {/* Live KPI Cards */}
                <StatsCards overview={overview} loading={loading} />

                {/* Today's Classes Snapshot */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                            <Clock size={18} className="text-indigo-500" />
                            <span>Today&apos;s Classes</span>
                        </h2>
                        <Link
                            to="/student/timetable"
                            className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            View Full Timetable →
                        </Link>
                    </div>

                    {loading ? (
                        <p className="text-sm text-slate-500">Loading today&apos;s classes...</p>
                    ) : !overview?.todaySchedule ? (
                        <p className="text-sm text-slate-500">No published timetable schedule for today.</p>
                    ) : !overview.todaySchedule.open ? (
                        <p className="text-sm font-medium text-rose-500">
                            {overview.todaySchedule.closureReason || "Institution is closed today."}
                        </p>
                    ) : overview.todaySchedule.slots.length === 0 ? (
                        <p className="text-sm text-slate-500">No lectures scheduled for today.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {overview.todaySchedule.slots.map((slot, idx) => (
                                <div
                                    key={slot.entryId ?? idx}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60"
                                >
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                            {slot.startTime?.slice(0, 5)} – {slot.endTime?.slice(0, 5)}
                                        </span>
                                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {slot.entryType || "THEORY"}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 font-semibold text-slate-900 dark:text-white">
                                        {slot.subject}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {slot.teacher || "Faculty"} • {slot.room || "Room TBA"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Upcoming Calendar Events + Recent Attendance Activity */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <UpcomingExams events={overview?.upcomingEvents || []} loading={loading} />
                    <RecentNotifications records={overview?.recentAttendance || []} loading={loading} />
                </div>
            </div>
        </div>
    );
}
