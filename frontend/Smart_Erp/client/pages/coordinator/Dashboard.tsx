import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    CheckCircle2,
    Clock,
    FileBadge,
    GitBranch,
    GraduationCap,
    Layers,
    LayoutDashboard,
    Presentation,
    Workflow,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

export default function ProgramCoordinatorDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c1e34] via-[#091526] to-[#121028] p-5 sm:p-7 lg:p-8"
            >
                <div className="max-w-2xl">
                    <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                        <Workflow size={14} />
                        Program Coordination Desk
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Coordinator{" "}
                        <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Academic Lead"}
                        </span>
                    </h1>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-400">
                        Overseeing batch progression, elective choices, timetable synchronization, and course outcome attainment (CO-PO).
                    </p>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Active Batches</span>
                    <p className="mt-2 text-2xl font-bold text-white">4</p>
                    <p className="mt-1 text-[11px] text-cyan-300">Years 2023 - 2027</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Semester Readiness</span>
                    <p className="mt-2 text-2xl font-bold text-white">96%</p>
                    <p className="mt-1 text-[11px] text-emerald-400">All courses allocated</p>
                </div>
                <div className="rounded-2xl border border-violet-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">CO-PO Attainment</span>
                    <p className="mt-2 text-2xl font-bold text-white">88.4%</p>
                    <p className="mt-1 text-[11px] text-violet-300">Accreditation threshold met</p>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Timetable Clashes</span>
                    <p className="mt-2 text-2xl font-bold text-white">0</p>
                    <p className="mt-1 text-[11px] text-emerald-400">Conflicts resolved</p>
                </div>
            </div>
        </div>
    );
}
