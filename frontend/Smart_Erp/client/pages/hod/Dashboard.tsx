import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Activity,
    BookOpen,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    GraduationCap,
    Network,
    Presentation,
    ShieldAlert,
    Users,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

const facultyWorkload = [
    { name: "Dr. K. V. Sharma", subjects: "Data Structures, Algorithms", hours: "18 hrs/wk", status: "NORMAL" },
    { name: "Prof. Priya Nair", subjects: "Database Management, SQL Lab", hours: "16 hrs/wk", status: "NORMAL" },
    { name: "Prof. Amit Verma", subjects: "Operating Systems, Distributed Systems", hours: "20 hrs/wk", status: "OVERLOAD" },
    { name: "Dr. Sneha Paul", subjects: "Computer Networks", hours: "14 hrs/wk", status: "AVAILABLE" },
];

export default function HODDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* HOD Welcome Banner */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#1c160b] via-[#0c1424] to-[#14122e] p-5 sm:p-7 lg:p-8"
            >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="max-w-2xl">
                        <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                            <Network size={14} className="text-amber-300" />
                            Head of Department Console
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Welcome, HOD{" "}
                            <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Department Leader"}
                            </span>
                        </h1>

                        <p className="mt-2.5 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Monitor teaching workloads, classroom allocations, curriculum timelines, and laboratory readiness across your department sections.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2.5">
                            <Link
                                to="/head-of-department/faculty"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
                            >
                                <Users size={15} />
                                Faculty Allocation
                            </Link>
                            <Link
                                to="/head-of-department/timetable"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                            >
                                <CalendarDays size={15} />
                                Review Timetable
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:w-[280px] lg:shrink-0">
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <Presentation className="mb-2 text-amber-300" size={20} />
                            <p className="text-[11px] text-slate-400">Class Sections</p>
                            <p className="mt-0.5 text-xs font-semibold text-white">16 Active</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <Building2 className="mb-2 text-emerald-300" size={20} />
                            <p className="text-[11px] text-slate-400">Laboratories</p>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-300">8 Online</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-amber-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Department Faculty</span>
                    <p className="mt-3 text-2xl font-bold text-white">42</p>
                    <p className="mt-1 text-[11px] text-emerald-400">100% Assigned to Sections</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Today's Lectures</span>
                    <p className="mt-3 text-2xl font-bold text-white">38</p>
                    <p className="mt-1 text-[11px] text-cyan-300">0 Timetable Conflicts</p>
                </div>
                <div className="rounded-2xl border border-rose-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Attendance Risk (&lt;75%)</span>
                    <p className="mt-3 text-2xl font-bold text-white">14</p>
                    <p className="mt-1 text-[11px] text-rose-300">Students Flagged for Mentor Review</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Syllabus Completion</span>
                    <p className="mt-3 text-2xl font-bold text-white">89%</p>
                    <p className="mt-1 text-[11px] text-emerald-300">Mid-term targets met</p>
                </div>
            </div>

            {/* Faculty Workload Table */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white">Faculty Workload Distribution</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="pb-3 font-semibold">Faculty Name</th>
                                <th className="pb-3 font-semibold">Assigned Subjects</th>
                                <th className="pb-3 font-semibold">Weekly Load</th>
                                <th className="pb-3 font-semibold text-right">Workload Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {facultyWorkload.map((f, i) => (
                                <tr key={i} className="hover:bg-white/[0.02]">
                                    <td className="py-3 font-medium text-white">{f.name}</td>
                                    <td className="py-3 text-slate-400">{f.subjects}</td>
                                    <td className="py-3 font-semibold text-cyan-300">{f.hours}</td>
                                    <td className="py-3 text-right">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                            f.status === "NORMAL"
                                                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                                : f.status === "OVERLOAD"
                                                ? "border border-rose-400/30 bg-rose-500/15 text-rose-300"
                                                : "border border-cyan-400/30 bg-cyan-500/15 text-cyan-300"
                                        }`}>
                                            {f.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
