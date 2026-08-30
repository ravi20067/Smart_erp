import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";
import StatsCards from "@/components/admin/StatsCards";
import RecentNotifications from "@/components/admin/RecentNotifications";

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            {/* =====================================================
                HEADER
            ====================================================== */}
            <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />


            {/* =====================================================
                MAIN AREA
            ====================================================== */}
            <div className="h-[calc(100vh-64px)]">

                {/* Sidebar
                    Sidebar is fixed/overlay.
                    It does NOT occupy layout space.
                */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />


                {/* =================================================
                    MAIN CONTENT
                ================================================== */}
                <main
                    className="
                        w-full
                        min-w-0
                        h-full
                        overflow-y-auto
                        p-4
                        md:p-6
                    "
                >
                    <div
                        className="
                            w-full
                            max-w-[1600px]
                            mx-auto
                            space-y-6
                        "
                    >

                        {/* =========================================
                            WELCOME
                        ========================================== */}
                        <section>
                            <h1
                                className="
                                    text-2xl
                                    md:text-3xl
                                    font-bold
                                    text-slate-900
                                    dark:text-white
                                "
                            >
                                Administrator Dashboard
                            </h1>

                            <p className="text-slate-500 mt-2">
                                Welcome back, Ravi 👋
                            </p>
                        </section>


                        {/* =========================================
                            STATISTICS
                        ========================================== */}
                        <StatsCards />


                        {/* =========================================
                            DASHBOARD CONTENT
                        ========================================== */}
                        <section
                            className="
                                grid
                                grid-cols-1
                                xl:grid-cols-2
                                gap-6
                            "
                        >
                            <RecentNotifications />
                        </section>

                    </div>
                </main>

            </div>


            {/* =====================================================
                FLOATING CHAT BUTTON
            ====================================================== */}
            {!chatOpen && (
                <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    aria-label="Open AI Administrator Copilot"
                    className="
                        fixed
                        bottom-5
                        right-5
                        md:bottom-6
                        md:right-6
                        z-40

                        w-14
                        h-14
                        md:w-16
                        md:h-16

                        rounded-full

                        bg-gradient-to-r
                        from-primary
                        to-secondary

                        text-white
                        shadow-xl

                        hover:scale-105
                        active:scale-95

                        transition-transform
                        duration-200

                        flex
                        items-center
                        justify-center
                    "
                >
                    <MessageCircle
                        size={26}
                        className="md:w-7 md:h-7"
                    />
                </button>
            )}


            {/* =====================================================
                CHAT DRAWER
            ====================================================== */}
            {chatOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="
                            fixed
                            inset-0
                            z-40
                            bg-black/40
                            backdrop-blur-[1px]
                        "
                        onClick={() => setChatOpen(false)}
                    />


                    {/* Chat Window */}
                    <div
                        className="
                            fixed
                            z-50

                            bottom-4
                            right-4
                            left-4

                            sm:left-auto

                            sm:right-6
                            sm:bottom-6

                            w-auto
                            sm:w-[420px]

                            h-[75vh]
                            max-h-[700px]

                            rounded-2xl
                            md:rounded-3xl

                            overflow-hidden

                            bg-white
                            dark:bg-slate-900

                            border
                            border-slate-200
                            dark:border-slate-700

                            shadow-2xl

                            animate-in
                            slide-in-from-bottom-4
                            duration-200
                        "
                    >

                        {/* =========================================
                            CHAT HEADER
                        ========================================== */}
                        <div
                            className="
                                h-[72px]

                                flex
                                items-center
                                justify-between

                                px-4
                                md:px-5

                                border-b
                                border-slate-200
                                dark:border-slate-700
                            "
                        >
                            <div className="min-w-0">

                                <h2
                                    className="
                                        font-bold
                                        text-base
                                        md:text-lg
                                        text-slate-900
                                        dark:text-white
                                        truncate
                                    "
                                >
                                    AI Administrator Copilot
                                </h2>

                                <p
                                    className="
                                        text-xs
                                        text-slate-500
                                        mt-0.5
                                    "
                                >
                                    Ask anything.
                                </p>

                            </div>


                            {/* Close Chat */}
                            <button
                                type="button"
                                onClick={() => setChatOpen(false)}
                                aria-label="Close AI Copilot"
                                className="
                                    flex
                                    items-center
                                    justify-center

                                    w-9
                                    h-9

                                    rounded-lg

                                    hover:bg-slate-100
                                    dark:hover:bg-slate-800

                                    transition
                                "
                            >
                                <X size={20} />
                            </button>

                        </div>


                        {/* =========================================
                            CHAT CONTENT
                        ========================================== */}
                        <div className="h-[calc(100%-72px)]">
                            <Copilot />
                        </div>

                    </div>
                </>
            )}

        </div>
    );
}