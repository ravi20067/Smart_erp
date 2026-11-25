import { useState } from "react";
import { MessageCircle, ScanLine, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import TeacherCopilot from "@/components/teacher/Copilot";
import StatsCards from "@/components/teacher/StatsCards";
import RecentNotifications from "@/components/teacher/RecentNotifications";
import { useAuth } from "@/services/authContext";

export default function Dashboard() {
    const { user } = useAuth();
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Hero Welcome Banner */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-[#0c2419] via-[#09181a] to-[#121028] p-5 sm:p-7 lg:p-8"
            >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="max-w-2xl">
                        <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                            <Users size={14} />
                            Faculty Instruction Portal
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Welcome, Professor{" "}
                            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Faculty"}
                            </span>
                        </h1>

                        <p className="mt-2.5 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Manage your teaching timetable, launch real-time attendance sessions, review student submissions, and coordinate course sections.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                to="/teacher/attendance"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition"
                            >
                                <ScanLine size={16} />
                                Start Secure QR Attendance
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Stats */}
            <StatsCards />

            {/* Content */}
            <div className="grid xl:grid-cols-2 gap-6">
                <RecentNotifications />
            </div>

            {/* Floating Chat Button */}
            <button
                onClick={() => setChatOpen(true)}
                className="
                fixed
                bottom-6
                right-6
                z-50
                w-16
                h-16
                rounded-full
                bg-gradient-to-r
                from-primary
                to-secondary
                text-white
                shadow-xl
                hover:scale-105
                transition
                flex
                items-center
                justify-center
            "
            >
                <MessageCircle size={28} />
            </button>

            {/* Chat Drawer Overlay */}
            {chatOpen && (
                <>
                    <div
                        className="
                        fixed
                        inset-0
                        bg-black/40
                        z-40
                    "
                        onClick={() => setChatOpen(false)}
                    />

                    <div
                        className="
                        fixed
                        bottom-24
                        right-6
                        z-50

                        w-[95vw]
                        sm:w-[420px]

                        h-[75vh]
                        max-h-[700px]

                        rounded-3xl
                        overflow-hidden

                        bg-white
                        dark:bg-slate-900

                        border
                        border-slate-200
                        dark:border-slate-700

                        shadow-2xl

                        animate-in
                        slide-in-from-bottom-4
                    "
                    >
                        {/* Chat Header */}
                        <div
                            className="
                            flex
                            items-center
                            justify-between
                            px-5
                            py-4
                            border-b
                            border-slate-200
                            dark:border-slate-700
                        "
                        >
                            <div>
                                <h2 className="font-bold text-lg">
                                    AI Teacher Copilot
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Ask about attendance, students & homework
                                </p>
                            </div>

                            <button
                                onClick={() => setChatOpen(false)}
                                className="
                                p-2
                                rounded-lg
                                hover:bg-slate-100
                                dark:hover:bg-slate-800
                            "
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Content */}
                        <div className="h-[calc(100%-72px)]">
                            <TeacherCopilot />
                        </div>
                    </div>
                </>
            )}
        </div>
    );

}
