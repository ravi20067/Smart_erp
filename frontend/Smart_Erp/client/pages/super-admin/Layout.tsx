
import { useCallback, useEffect, useState } from "react";
import {
    AnimatePresence,
    motion,
    useReducedMotion,
} from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "@/components/SuperAdminSidebar";
import DashboardHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";

export default function SuperAdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const reduceMotion = useReducedMotion();

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    useEffect(() => {
        closeSidebar();
    }, [location.pathname, closeSidebar]);

    useEffect(() => {
        if (!sidebarOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeSidebar();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [sidebarOpen, closeSidebar]);

    return (
        <div className="fixed inset-0 isolate h-dvh w-full overflow-hidden bg-[#060D1A] text-slate-100">
            {/* Ambient background; never participates in scrolling */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-32 left-[10%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.08] blur-[150px]" />
                <div className="absolute top-1/4 -right-20 h-[600px] w-[600px] rounded-full bg-violet-600/[0.07] blur-[160px]" />
                <div className="absolute -bottom-20 left-1/3 h-[450px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[140px]" />
            </div>

            {/* Fixed header: always stays at the top */}
            <div className="fixed inset-x-0 top-0 z-[100] h-16">
                <DashboardHeader
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
            </div>

            {/* Fixed desktop sidebar; mobile drawer remains controlled by isOpen */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />

            {/* Independent main scroll pane.
          Left offset exactly matches the desktop w-72 sidebar. */}
            <div
                className="
          fixed inset-x-0 bottom-0 top-16
          flex min-h-0 flex-col
          overflow-x-hidden overflow-y-auto
          overscroll-y-contain
          erp-main-scrollbar
          lg:left-72
        "
            >
                <main className="mx-auto w-full max-w-[1800px] flex-1 p-4 sm:p-6 lg:p-8">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={location.pathname}
                            initial={
                                reduceMotion ? false : { opacity: 0, y: 12 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                                reduceMotion ? undefined : { opacity: 0, y: -5 }
                            }
                            transition={{
                                duration: reduceMotion ? 0 : 0.24,
                                ease: "easeOut",
                            }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Footer scrolls with the content, not with the viewport */}
                <CommonFooter />
            </div>
        </div>
    );
}
