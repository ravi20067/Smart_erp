import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Activity,
    ArrowUpRight,
    Award,
    BarChart3,
    BookMarked,
    BookOpen,
    Building2,
    CalendarDays,
    CheckCircle2,
    GraduationCap,
    Layers,
    Megaphone,
    Network,
    School,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

const departmentHealth = [
    { name: "Computer Science & Engineering", faculty: 48, students: 840, completion: "94%", status: "OPTIMAL" },
    { name: "Mechanical & Automation", faculty: 36, students: 620, completion: "88%", status: "OPTIMAL" },
    { name: "Electrical & Electronics", faculty: 28, students: 480, completion: "91%", status: "OPTIMAL" },
    { name: "Civil & Environmental", faculty: 22, students: 340, completion: "85%", status: "NEEDS_REVIEW" },
];

export default function DeanDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Executive Welcome Banner */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#15102a] via-[#0c1324] to-[#121c2e] p-5 sm:p-7 lg:p-8"
            >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="max-w-2xl">
                        <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-300">
                            <School size={14} className="text-violet-300" />
                            Dean's Executive Suite
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Welcome, Dean{" "}
                            <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Executive"}
                            </span>
                        </h1>

                        <p className="mt-2.5 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Academic governance overview for all constituent schools and departments. Curriculum adherence, accreditation readiness, and faculty distribution are synced.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2.5">
                            <Link
                                to="/dean/departments"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 transition"
                            >
                                <Network size={15} />
                                View Departments
                            </Link>
                            <Link
                                to="/dean/circulars"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                            >
                                <Megaphone size={15} />
                                Issue Dean Circular
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:w-[280px] lg:shrink-0">
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <Award className="mb-2 text-violet-300" size={20} />
                            <p className="text-[11px] text-slate-400">NBA / NAAC</p>
                            <p className="mt-0.5 text-xs font-semibold text-white">Grade A++</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <Activity className="mb-2 text-cyan-300" size={20} />
                            <p className="text-[11px] text-slate-400">Curriculum</p>
                            <p className="mt-0.5 text-xs font-semibold text-cyan-300">92% On Pace</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-violet-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Total Departments</span>
                    <p className="mt-3 text-2xl font-bold text-white">8</p>
                    <p className="mt-1 text-[11px] text-emerald-400">All Academic Units Active</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Total Faculty Members</span>
                    <p className="mt-3 text-2xl font-bold text-white">164</p>
                    <p className="mt-1 text-[11px] text-cyan-300">14 Dept. Chairs &amp; Professors</p>
                </div>
                <div className="rounded-2xl border border-blue-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Enrolled Students</span>
                    <p className="mt-3 text-2xl font-bold text-white">2,480</p>
                    <p className="mt-1 text-[11px] text-slate-400">Across 12 Degree Programs</p>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <span className="text-xs font-medium text-slate-400">Research Grants Active</span>
                    <p className="mt-3 text-2xl font-bold text-white">18</p>
                    <p className="mt-1 text-[11px] text-amber-300">₹4.2 Cr In Funded Projects</p>
                </div>
            </div>

            {/* Department Progress Table */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Constituent Department Health</h3>
                        <p className="text-[11px] text-slate-400">Academic progress, syllabus completion, and manning</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="pb-3 font-semibold">Department</th>
                                <th className="pb-3 font-semibold">Faculty</th>
                                <th className="pb-3 font-semibold">Students</th>
                                <th className="pb-3 font-semibold">Syllabus Completion</th>
                                <th className="pb-3 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {departmentHealth.map((d, i) => (
                                <tr key={i} className="hover:bg-white/[0.02]">
                                    <td className="py-3 font-medium text-white">{d.name}</td>
                                    <td className="py-3">{d.faculty} Faculty</td>
                                    <td className="py-3">{d.students} Students</td>
                                    <td className="py-3 text-cyan-300 font-semibold">{d.completion}</td>
                                    <td className="py-3 text-right">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                            d.status === "OPTIMAL"
                                                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                                : "border border-amber-400/30 bg-amber-500/15 text-amber-300"
                                        }`}>
                                            {d.status}
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
