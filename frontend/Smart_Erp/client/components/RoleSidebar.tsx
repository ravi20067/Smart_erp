import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    GraduationCap,
    X,
} from "lucide-react";

import { useAuth } from "@/services/authContext";
import {
    getRoleConfig,
    type MenuGroup,
    type MenuItem,
} from "@/config/RoleNavigation";

interface RoleSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    role?: string;
}

export default function RoleSidebar({
    isOpen,
    onClose,
    role: explicitRole,
}: RoleSidebarProps) {
    const location = useLocation();
    const { role: authRole } = useAuth();
    const roleConfig = getRoleConfig(explicitRole || authRole, location.pathname);

    const [expandedGroups, setExpandedGroups] = useState<string[]>(() =>
        roleConfig.menu.map((g) => g.title)
    );

    const toggleGroup = (title: string) => {
        setExpandedGroups((prev) =>
            prev.includes(title)
                ? prev.filter((t) => t !== title)
                : [...prev, title]
        );
    };

    const isActive = (path: string) => {
        if (path === roleConfig.dashboardPath) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    // Auto-expand group containing active route
    useEffect(() => {
        const activeGroup = roleConfig.menu.find((group) =>
            group.items.some((item) => isActive(item.path))
        );

        if (activeGroup && !expandedGroups.includes(activeGroup.title)) {
            setExpandedGroups((curr) => [...curr, activeGroup.title]);
        }
    }, [location.pathname, roleConfig]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const RoleIcon = roleConfig.icon;

    const toneClasses = {
        cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
        emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
        violet: "border-violet-400/20 bg-violet-500/10 text-violet-300",
        amber: "border-amber-400/20 bg-amber-500/10 text-amber-300",
        blue: "border-blue-400/20 bg-blue-500/10 text-blue-300",
        rose: "border-rose-400/20 bg-rose-500/10 text-rose-300",
    };

    const sidebarContent = (
        <div className="flex h-full min-h-0 flex-col bg-[#081223]/90 text-slate-300 backdrop-blur-2xl">
            {/* Mobile-only brand header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] px-5 lg:hidden">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-violet-500/20 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                        <GraduationCap size={22} className="text-cyan-300" />
                        <span className="absolute inset-x-1 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">Smart ERP</p>
                        <p className="mt-0.5 text-[10px] tracking-[0.14em] text-cyan-400 font-semibold uppercase">
                            {roleConfig.roleTitle}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close sidebar"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                >
                    <X size={19} />
                </button>
            </div>

            {/* Role Control Center Capsule */}
            <div className="mx-3.5 mt-3.5 rounded-xl border border-cyan-400/15 bg-gradient-to-r from-cyan-500/[0.08] via-blue-500/[0.04] to-transparent p-3 shadow-[inset_0_0_15px_rgba(6,182,212,0.03)]">
                <div className="flex items-center gap-2.5">
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                            toneClasses[roleConfig.badgeTone] || toneClasses.cyan
                        }`}
                    >
                        <RoleIcon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-200">
                            {roleConfig.roleTitle}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                            {roleConfig.roleSubtitle}
                        </p>
                    </div>

                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                </div>
            </div>

            {/* Navigation links */}
            <nav
                aria-label="Role navigation"
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 erp-scrollbar"
            >
                {roleConfig.menu.map((section) => {
                    const expanded = expandedGroups.includes(section.title);
                    const hasActiveItem = section.items.some((item) => isActive(item.path));

                    return (
                        <div key={section.title} className="space-y-1">
                            <button
                                type="button"
                                onClick={() => toggleGroup(section.title)}
                                aria-expanded={expanded}
                                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[10px] font-bold tracking-[0.16em] text-slate-400 transition hover:text-cyan-300"
                            >
                                <span className={hasActiveItem ? "text-cyan-300 font-semibold" : ""}>
                                    {section.title}
                                </span>

                                <ChevronDown
                                    size={13}
                                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                                        expanded ? "rotate-0" : "-rotate-90"
                                    }`}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {expanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="space-y-1 overflow-hidden"
                                    >
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.path);

                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    end={item.path === roleConfig.dashboardPath}
                                                    onClick={onClose}
                                                    className={[
                                                        "group relative flex min-h-[38px] items-center gap-3 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200",
                                                        active
                                                            ? "border-cyan-400/25 bg-gradient-to-r from-cyan-400/[0.14] via-blue-500/[0.08] to-transparent text-cyan-200 font-semibold shadow-[inset_0_0_20px_rgba(6,182,212,0.06)]"
                                                            : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-100",
                                                    ].join(" ")}
                                                >
                                                    {active && (
                                                        <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                                                    )}

                                                    <Icon
                                                        size={16}
                                                        className={`shrink-0 transition-colors ${
                                                            active
                                                                ? "text-cyan-300"
                                                                : "text-slate-500 group-hover:text-slate-300"
                                                        }`}
                                                    />

                                                    <span className="truncate">{item.label}</span>

                                                    {item.badge && (
                                                        <span className="ml-auto rounded-full border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-300">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <>
            {/* Desktop fixed sidebar */}
            <aside
                aria-label="Role desktop sidebar"
                className="fixed bottom-0 top-16 z-30 hidden w-72 border-r border-white/[0.08] lg:block"
            >
                {sidebarContent}
            </aside>

            {/* Mobile drawer with backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 27, stiffness: 280 }}
                            className="relative flex h-full w-[85%] max-w-sm flex-col border-r border-white/[0.08] shadow-2xl"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
