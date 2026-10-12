import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bell,
    ChevronDown,
    Compass,
    LogOut,
    Menu,
    Settings,
    Shield,
    X,
    GraduationCap,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

interface DashboardHeaderProps {
    sidebarOpen?: boolean;
    setSidebarOpen?: (open: boolean) => void;
}

export default function CommonHeader({
    sidebarOpen = false,
    setSidebarOpen,
}: DashboardHeaderProps) {
    const { logout, user, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const pathParts = location.pathname.split("/").filter(Boolean);
    const dashboardRoot = `/${pathParts[0] || "admin"}`;

    const pageTitle =
        pathParts.length <= 1
            ? "Dashboard Overview"
            : pathParts[pathParts.length - 1]
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase());

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            navigate("/login", { replace: true });
        }
    };

    return (
        <header className="relative h-16 w-full border-b border-white/[0.08] bg-[#081223]/80 shadow-[0_4px_30px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="flex h-full items-center justify-between">
                {/* Brand Section: On desktop, exactly matches sidebar width (w-72 = 288px) and has border-r to perfectly align with sidebar right border */}
                <div className="flex h-full items-center gap-3 px-4 sm:px-5 lg:w-72 lg:shrink-0 lg:border-r lg:border-white/[0.08]">
                    {/* Mobile menu trigger */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen?.(!sidebarOpen)}
                        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.08] hover:text-cyan-200 active:scale-95 lg:hidden"
                    >
                        {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
                    </button>

                    {/* Logo & Brand */}
                    <Link
                        to={dashboardRoot}
                        className="flex items-center gap-3 min-w-0 group"
                    >
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-violet-500/20 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition group-hover:scale-105">
                            <GraduationCap size={20} className="text-cyan-300" />
                            <span className="absolute inset-x-1 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-bold tracking-tight text-white">
                                    Smart <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">ERP</span>
                                </span>
                                <span className="hidden sm:inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-300">
                                    v2.4
                                </span>
                            </div>
                            <p className="truncate text-[9px] font-medium tracking-[0.16em] text-slate-500">
                                INTELLIGENT CAMPUS
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Right Top Area: Breadcrumbs, Notifications, User Profile */}
                <div className="flex h-full flex-1 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 min-w-0">
                    {/* Breadcrumbs / Page Title */}
                    <div className="min-w-0 hidden md:block">
                        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Link
                                to={dashboardRoot}
                                className="inline-flex items-center gap-1 text-slate-400 transition hover:text-cyan-300"
                            >
                                <Compass size={13} className="text-cyan-400" />
                                <span>Admin</span>
                            </Link>
                            <span className="text-slate-600">/</span>
                            <span className="truncate font-medium text-slate-200">{pageTitle}</span>
                        </nav>
                        <h1 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                            {pageTitle}
                        </h1>
                    </div>

                    {/* Mobile Title (shown only on small screens) */}
                    <div className="min-w-0 md:hidden">
                        <h1 className="truncate text-sm font-bold text-white">
                            {pageTitle}
                        </h1>
                    </div>

                    {/* Right Controls: Notifications & Profile Capsule */}
                    <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                        {/* Notifications */}
                        <div className="relative" ref={notifRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setNotificationsOpen((prev) => !prev);
                                    setProfileOpen(false);
                                }}
                                aria-label="Notifications"
                                aria-expanded={notificationsOpen}
                                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition duration-200 ${notificationsOpen
                                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.18)]"
                                    : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-cyan-200"
                                    }`}
                            >
                                <Bell size={17} />
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] ring-2 ring-[#081223]" />
                            </button>

                            <AnimatePresence>
                                {notificationsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.16 }}
                                        className="absolute right-0 top-11 z-[80] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#0c182d]/95 p-0 shadow-2xl shadow-black/50 backdrop-blur-2xl"
                                    >
                                        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-white/[0.02]">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                                                    <Bell size={13} />
                                                </span>
                                                <p className="text-xs font-semibold text-white">Notifications</p>
                                            </div>
                                            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.2 text-[9px] font-semibold text-cyan-300">
                                                Active
                                            </span>
                                        </div>

                                        <div className="p-3.5 space-y-2">
                                            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
                                                <p className="text-xs font-semibold text-cyan-200">Campus Cloud Online</p>
                                                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                                    All institutional databases and services are running in sync.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Account Capsule Menu */}
                        <div className="relative" ref={profileRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setProfileOpen((prev) => !prev);
                                    setNotificationsOpen(false);
                                }}
                                aria-label="Account menu"
                                aria-expanded={profileOpen}
                                className={`flex h-9 items-center gap-2 rounded-xl border p-1 transition sm:gap-2.5 sm:pr-2.5 ${profileOpen
                                    ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_15px_rgba(6,182,212,0.18)]"
                                    : "border-white/[0.08] bg-white/[0.03] hover:border-cyan-400/30 hover:bg-white/[0.06]"
                                    }`}
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-bold text-xs shadow-md">
                                    A
                                </span>

                                <div className="hidden text-left sm:block">
                                    <p className="truncate text-xs font-semibold text-white leading-tight">
                                        {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "System Admin"}
                                    </p>
                                    <p className="text-[9px] font-medium tracking-wide text-cyan-300/80">
                                        {role ? role.replace("ROLE_", "") : "ADMIN"}
                                    </p>
                                </div>

                                <ChevronDown
                                    size={13}
                                    className={`text-slate-400 transition-transform duration-200 sm:block ${profileOpen ? "rotate-180 text-cyan-300" : ""
                                        }`}
                                />
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.16 }}
                                        className="absolute right-0 top-11 z-[80] w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0c182d]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl"
                                    >
                                        <div className="mb-1 border-b border-white/[0.08] px-3 py-2.5 bg-white/[0.02] rounded-xl">
                                            <p className="text-xs font-semibold text-white">Administrator</p>
                                            <p className="text-[10px] text-slate-400">admin@smarterp.edu</p>
                                        </div>

                                        <Link
                                            to={`${dashboardRoot}/settings`}
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                                        >
                                            <Settings size={15} className="text-cyan-300" />
                                            Settings
                                        </Link>

                                        <Link
                                            to={`${dashboardRoot}/roles-permissions`}
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                                        >
                                            <Shield size={15} className="text-violet-300" />
                                            Roles & Permissions
                                        </Link>

                                        <div className="border-t border-white/[0.08] mt-1 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                                            >
                                                <LogOut size={15} />
                                                Sign out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}