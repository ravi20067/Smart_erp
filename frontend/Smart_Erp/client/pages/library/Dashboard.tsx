import { useState } from "react";
import { BookOpen, Library, MessageCircle, X } from "lucide-react";
import { motion } from "framer-motion";

import Copilot from "@/components/library/Copilot";
import StatsCards from "@/components/library/StatsCards";
import RecentNotifications from "@/components/library/RecentNotifications";
import { useAuth } from "@/services/authContext";

export default function Dashboard() {
    const { user } = useAuth();
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Library Welcome Banner */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#1c1409] via-[#091526] to-[#121028] p-5 sm:p-7 lg:p-8"
            >
                <div className="max-w-2xl">
                    <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                        <Library size={14} />
                        Library &amp; Learning Resource Center
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Welcome,{" "}
                        <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Librarian"}
                        </span>
                    </h1>

                    <p className="mt-2.5 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                        Manage central book catalog circulation, student member digital cards, overdue book reminders, and journal subscriptions.
                    </p>
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
                                    AI library Copilot
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Ask about stock and anything.
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
                            <Copilot />
                        </div>
                    </div>
                </>
            )}
        </div>
    );

}
