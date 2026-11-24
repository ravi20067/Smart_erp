import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Calendar,
    CheckCircle2,
    ClipboardCheck,
    HeartPulse,
    PhoneCall,
    UserCheck,
    Users,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

export default function CounselorDashboard() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c1f2e] via-[#091526] to-[#171028] p-5 sm:p-7 lg:p-8"
            >
                <div className="max-w-2xl">
                    <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                        <HeartPulse size={14} />
                        Student Wellbeing &amp; Counseling
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Counselor{" "}
                        <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-300 bg-clip-text text-transparent">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Wellbeing Specialist"}
                        </span>
                    </h1>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-400">
                        Confidential mental health support, academic stress counseling, and student wellbeing appointments.
                    </p>
                </div>
            </motion.section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Active Cases</span>
                    <p className="mt-2 text-2xl font-bold text-white">24</p>
                    <p className="mt-1 text-[11px] text-cyan-300">Ongoing guidance support</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Appointments Today</span>
                    <p className="mt-2 text-2xl font-bold text-white">5</p>
                    <p className="mt-1 text-[11px] text-emerald-400">All slots confirmed</p>
                </div>
                <div className="rounded-2xl border border-violet-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Wellness Workshops</span>
                    <p className="mt-2 text-2xl font-bold text-white">12</p>
                    <p className="mt-1 text-[11px] text-violet-300">Conducted this semester</p>
                </div>
                <div className="rounded-2xl border border-blue-400/20 bg-slate-900/60 p-4 backdrop-blur-xl">
                    <span className="text-xs font-medium text-slate-400">Resolved Consultations</span>
                    <p className="mt-2 text-2xl font-bold text-white">86</p>
                    <p className="mt-1 text-[11px] text-slate-400">Positive student outcomes</p>
                </div>
            </div>
        </div>
    );
}
