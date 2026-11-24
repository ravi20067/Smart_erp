import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    CalendarCheck2,
    Clock,
    FileSpreadsheet,
    UserCheck,
    UserPlus,
    Users,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

export default function HRDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#1c122b] via-[#091526] to-[#141028] p-5 sm:p-7 lg:p-8"
            >
                <div className="max-w-2xl">
                    <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-300">
                        <Users size={14} />
                        Human Resources &amp; Staff Operations
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        HR Desk:{" "}
                        <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Staff Administrator"}
                        </span>
                    </h1>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-400">
                        Manage faculty hiring pipelines, leave authorizations, staff biometric logs, and employee onboarding documentation.
                    </p>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-violet-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Total University Staff</span>
                    <p className="mt-2 text-2xl font-bold text-white">284</p>
                    <p className="mt-1 text-[11px] text-violet-300">164 Faculty · 120 Operational</p>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Pending Leave Requests</span>
                    <p className="mt-2 text-2xl font-bold text-white">8</p>
                    <p className="mt-1 text-[11px] text-amber-300">Awaiting dean/hod review</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Faculty Openings</span>
                    <p className="mt-2 text-2xl font-bold text-white">6</p>
                    <p className="mt-1 text-[11px] text-cyan-300">Active hiring rounds</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Biometric Attendance Today</span>
                    <p className="mt-2 text-2xl font-bold text-white">97.2%</p>
                    <p className="mt-1 text-[11px] text-emerald-400">Normal check-in compliance</p>
                </div>
            </div>
        </div>
    );
}
