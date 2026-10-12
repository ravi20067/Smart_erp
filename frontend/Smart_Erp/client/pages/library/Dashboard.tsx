import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

import Header from "@/components/CommonHeader";
import Sidebar from "@/components/library/Sidebar";
import Copilot from "@/components/library/Copilot";
import StatsCards from "@/components/library/StatsCards";
import RecentNotifications from "@/components/library/RecentNotifications";

export default function Dashboard() {
    const [chatOpen, setChatOpen] = useState(false);
    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            {/* Header */}
            <Header />

            {/* Main Layout */}
            <div className="flex h-[calc(100vh-80px)]">

                {/* Sidebar */}
                <aside
                    className="
                    hidden lg:block
                    w-72
                    shrink-0
                    overflow-y-auto
                    border-r
                    border-slate-200
                    dark:border-slate-800
                    bg-white
                    dark:bg-slate-900
                "
                >
                    <Sidebar />
                </aside>

                {/* Main Content */}
                <main
                    className="
                    flex-1
                    overflow-y-auto
                    p-4 md:p-6
                "
                >
                    <div className="space-y-6">

                        {/* Welcome */}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Library Dashboard
                            </h1>

                            <p className="text-slate-500 mt-2">
                                Welcome back, Ravi 👋
                            </p>
                        </div>

                        {/* Stats */}
                        <StatsCards />

                        {/* Content */}
                        <div className="grid xl:grid-cols-2 gap-6">
                            <RecentNotifications />
                        </div>

                    </div>
                </main>
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
