import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    BarChart3,
    BookOpen,
    Building2,
    CalendarDays,
    ChevronDown,
    ClipboardList,
    Database,
    FileBarChart,
    FileQuestion,
    FolderOpen,
    GraduationCap,
    History,
    Image as ImageIcon,
    LayoutDashboard,
    Mail,
    Megaphone,
    Network,
    ScanLine,
    School,
    Settings,
    ShieldCheck,
    Sparkles,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";

interface MenuItem {
    label: string;
    path: string;
    icon: LucideIcon;
    badge?: string;
}

interface MenuGroup {
    title: string;
    items: MenuItem[];
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menu: MenuGroup[] = [
    {
        title: "OVERVIEW",
        items: [
            {
                label: "Dashboard Overview",
                path: "/super-admin",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        title: "ORGANIZATION",
        items: [
            { label: "Universities", path: "/super-admin/universities", icon: Building2 },
            { label: "Schools", path: "/super-admin/schools", icon: School },
            { label: "Departments", path: "/super-admin/departments", icon: Network },
        ],
    },
    {
        title: "ACADEMIC MANAGEMENT",
        items: [
            { label: "Courses", path: "/super-admin/courses", icon: BookOpen },
            { label: "Subjects", path: "/super-admin/subjects", icon: BookOpen },
            { label: "Classes", path: "/super-admin/classes", icon: GraduationCap },
            { label: "Timetable", path: "/super-admin/timetable", icon: CalendarDays },
        ],
    },
    {
        title: "USER MANAGEMENT",
        items: [
            { label: "Students", path: "/super-admin/students", icon: GraduationCap },
            { label: "Teachers", path: "/super-admin/teachers", icon: Users },
            { label: "Devices", path: "/super-admin/devices", icon: ScanLine },
        ],
    },
    {
        title: "ACADEMIC RESOURCES",
        items: [
            {
                label: "Study Material",
                path: "/super-admin/study-material",
                icon: FolderOpen,
            },
            { label: "Chapters", path: "/super-admin/chapters", icon: BookOpen },
            {
                label: "Question Bank",
                path: "/super-admin/question-bank",
                icon: FileQuestion,
            },
        ],
    },
    {
        title: "COMMUNICATION",
        items: [
            {
                label: "Announcements",
                path: "/super-admin/announcements",
                icon: Megaphone,
                badge: "Live",
            },
            { label: "Events", path: "/super-admin/events", icon: CalendarDays },
            { label: "Gallery", path: "/super-admin/gallery", icon: ImageIcon },
            {
                label: "Website Content",
                path: "/super-admin/website-content",
                icon: Activity,
            },
            {
                label: "Contact Queries",
                path: "/super-admin/contact-queries",
                icon: Mail,
            },
        ],
    },
    {
        title: "EXAMINATION",
        items: [
            { label: "Exams", path: "/super-admin/exams", icon: ClipboardList },
            {
                label: "Exam Results",
                path: "/super-admin/exam-results",
                icon: FileBarChart,
            },
            {
                label: "Examination Reports",
                path: "/super-admin/reports/examination",
                icon: BarChart3,
            },
        ],
    },
    {
        title: "REPORTS",
        items: [
            {
                label: "Student Reports",
                path: "/super-admin/reports/student",
                icon: FileBarChart,
            },
            {
                label: "Staff Reports",
                path: "/super-admin/reports/staff",
                icon: FileBarChart,
            },
            {
                label: "Academic Reports",
                path: "/super-admin/reports/academic",
                icon: BarChart3,
            },
        ],
    },
    {
        title: "SYSTEM MANAGEMENT",
        items: [
            {
                label: "Roles & Permissions",
                path: "/super-admin/roles-permissions",
                icon: ShieldCheck,
            },
            { label: "Settings", path: "/super-admin/settings", icon: Settings },
            {
                label: "Backup & Restore",
                path: "/super-admin/backup-restore",
                icon: Database,
            },
            { label: "Audit Logs", path: "/super-admin/audit-logs", icon: History },
        ],
    },
];

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();

    const [expandedGroups, setExpandedGroups] = useState<string[]>([
        "OVERVIEW",
        "ORGANIZATION",
        "ACADEMIC MANAGEMENT",
        "USER MANAGEMENT",
    ]);

    const toggleGroup = (title: string) => {
        setExpandedGroups((current) =>
            current.includes(title)
                ? current.filter((group) => group !== title)
                : [...current, title]
        );
    };

    const isActive = (path: string) =>
        path === "/super-admin"
            ? location.pathname === "/super-admin"
            : location.pathname === path || location.pathname.startsWith(`${path}/`);

    // Automatically expand group containing active path
    useEffect(() => {
        const activeGroup = menu.find((group) =>
            group.items.some((item) => isActive(item.path))
        );

        if (activeGroup && !expandedGroups.includes(activeGroup.title)) {
            setExpandedGroups((current) => [...current, activeGroup.title]);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const sidebarContent = (
        <div className="flex h-full min-h-0 flex-col bg-[#081223]/90 text-slate-300 backdrop-blur-2xl">
            {/* Mobile-only brand header (On desktop, CommonHeader already displays the brand) */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] px-5 lg:hidden">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-violet-500/20 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                        <GraduationCap size={22} className="text-cyan-300" />
                        <span className="absolute inset-x-1 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">Smart ERP</p>
                        <p className="mt-0.5 text-[10px] tracking-[0.14em] text-slate-500">
                            ADMIN WORKSPACE
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

            {/* Control Center Status Capsule */}
            <div className="mx-3.5 mt-3.5 rounded-xl border border-cyan-400/15 bg-gradient-to-r from-cyan-500/[0.08] via-blue-500/[0.04] to-transparent p-3 shadow-[inset_0_0_15px_rgba(6,182,212,0.03)]">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                        <LayoutDashboard size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-200">
                            Control Center
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                            Institutional Administration
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
                aria-label="Admin navigation"
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 erp-scrollbar"
            >
                {menu.map((section) => {
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
                                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-0" : "-rotate-90"
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
                                                    end={item.path === "/super-admin"}
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
                                                        size={17}
                                                        strokeWidth={active ? 2.2 : 1.8}
                                                        className={`shrink-0 transition-colors ${active
                                                            ? "text-cyan-300"
                                                            : "text-slate-500 group-hover:text-cyan-200"
                                                            }`}
                                                    />

                                                    <span className="min-w-0 flex-1 truncate">
                                                        {item.label}
                                                    </span>

                                                    {item.badge && (
                                                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-300">
                                                            {item.badge}
                                                        </span>
                                                    )}

                                                    {active && !item.badge && (
                                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
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

            {/* Sidebar Bottom Status */}
            <div className="shrink-0 border-t border-white/[0.08] p-3.5 bg-white/[0.01]">
                <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                        <ShieldCheck size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-200">
                            Administrator
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                            Enterprise Security
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.button
                        type="button"
                        aria-label="Close navigation overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[65] cursor-default bg-black/70 backdrop-blur-md lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Mobile drawer and desktop sidebar */}
            <aside
                id="admin-sidebar"
                className={[
                    "fixed bottom-0 left-0 top-0 z-[70] h-screen",
                    "w-[min(288px,86vw)] overflow-hidden border-r border-white/[0.08]",
                    "shadow-2xl transition-transform duration-300 ease-out",
                    "lg:z-50 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
            >
                {sidebarContent}
            </aside>
        </>
    );
}