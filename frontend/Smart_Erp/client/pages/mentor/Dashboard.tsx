import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    CheckCircle2,
    HeartPulse,
    PhoneCall,
    ShieldAlert,
    UserCheck,
    Users,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

const mentees = [
    { name: "Rahul Sharma", roll: "22CS045", attendance: "68%", risk: "HIGH", alert: "Attendance warning sent" },
    { name: "Neha Patel", roll: "22CS082", attendance: "91%", risk: "LOW", alert: "Academic excellence" },
    { name: "Aman Gupta", roll: "22CS104", attendance: "74%", risk: "MEDIUM", alert: "Parent meeting scheduled" },
    { name: "Divya Nair", roll: "22CS029", attendance: "84%", risk: "LOW", alert: "On track" },
];

export default function MentorDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-[#0c2419] via-[#09181a] to-[#121028] p-5 sm:p-7 lg:p-8"
            >
                <div className="max-w-2xl">
                    <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        <HeartPulse size={14} />
                        Student Mentorship Center
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Mentor{" "}
                        <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Faculty Advisor"}
                        </span>
                    </h1>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-400">
                        Guidance hub for assigned student mentees. Track attendance intervention triggers, academic risk flags, and counseling session notes.
                    </p>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Assigned Mentees</span>
                    <p className="mt-2 text-2xl font-bold text-white">32</p>
                    <p className="mt-1 text-[11px] text-emerald-400">Batch of 2022-2026</p>
                </div>
                <div className="rounded-2xl border border-rose-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">At-Risk Students (&lt;75%)</span>
                    <p className="mt-2 text-2xl font-bold text-white">4</p>
                    <p className="mt-1 text-[11px] text-rose-300">Requires attendance review</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Guidance Sessions This Month</span>
                    <p className="mt-2 text-2xl font-bold text-white">18</p>
                    <p className="mt-1 text-[11px] text-cyan-300">Logged in mentor portal</p>
                </div>
                <div className="rounded-2xl border border-blue-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Average Mentee Attendance</span>
                    <p className="mt-2 text-2xl font-bold text-white">83.5%</p>
                    <p className="mt-1 text-[11px] text-slate-400">Department average: 81.2%</p>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white">Mentee Risk &amp; Performance Overview</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="pb-3 font-semibold">Student Name</th>
                                <th className="pb-3 font-semibold">Roll Number</th>
                                <th className="pb-3 font-semibold">Attendance</th>
                                <th className="pb-3 font-semibold">Status Note</th>
                                <th className="pb-3 font-semibold text-right">Risk Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {mentees.map((m, i) => (
                                <tr key={i} className="hover:bg-white/[0.02]">
                                    <td className="py-3 font-medium text-white">{m.name}</td>
                                    <td className="py-3 font-mono text-slate-400">{m.roll}</td>
                                    <td className="py-3 text-cyan-300 font-semibold">{m.attendance}</td>
                                    <td className="py-3 text-slate-400">{m.alert}</td>
                                    <td className="py-3 text-right">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                            m.risk === "LOW"
                                                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                                : m.risk === "MEDIUM"
                                                ? "border border-amber-400/30 bg-amber-500/15 text-amber-300"
                                                : "border border-rose-400/30 bg-rose-500/15 text-rose-300"
                                        }`}>
                                            {m.risk} RISK
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
