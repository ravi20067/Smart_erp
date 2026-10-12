import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Bell,
    BookOpen,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileBarChart,
    GraduationCap,
    Layers3,
    Plus,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Users,
    type LucideIcon,
} from "lucide-react";

const stats: {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    color: string;
}[] = [
        {
            title: "Universities",
            value: "12",
            description: "Sample display value",
            icon: Building2,
            color: "cyan",
        },
        {
            title: "Schools",
            value: "86",
            description: "Sample display value",
            icon: Layers3,
            color: "violet",
        },
        {
            title: "Students",
            value: "24,548",
            description: "Sample display value",
            icon: GraduationCap,
            color: "blue",
        },
        {
            title: "Teachers",
            value: "1,286",
            description: "Sample display value",
            icon: Users,
            color: "emerald",
        },
    ];

const quickActions: {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
}[] = [
        {
            title: "Institutions",
            description: "Manage universities and schools",
            icon: Building2,
            href: "/admin/schools",
            color: "cyan",
        },
        {
            title: "Academic Structure",
            description: "Manage courses and subjects",
            icon: BookOpen,
            href: "/admin/courses",
            color: "violet",
        },
        {
            title: "People",
            description: "Manage student records",
            icon: Users,
            href: "/admin/students",
            color: "blue",
        },
        {
            title: "Reports",
            description: "Open academic reports",
            icon: FileBarChart,
            href: "/admin/reports/academic",
            color: "emerald",
        },
    ];

const weeklyActivity = [
    { day: "Mon", value: 45 },
    { day: "Tue", value: 68 },
    { day: "Wed", value: 53 },
    { day: "Thu", value: 84 },
    { day: "Fri", value: 63 },
    { day: "Sat", value: 92 },
    { day: "Sun", value: 39 },
];

const managementAreas: {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
}[] = [
        {
            title: "Organization",
            description: "Universities, schools and departments",
            icon: Building2,
            href: "/admin/universities",
            color: "cyan",
        },
        {
            title: "Academic structure",
            description: "Courses, subjects and classes",
            icon: BookOpen,
            href: "/admin/courses",
            color: "violet",
        },
        {
            title: "User administration",
            description: "Student and teacher records",
            icon: Users,
            href: "/admin/students",
            color: "blue",
        },
        {
            title: "Security and access",
            description: "Roles and permission settings",
            icon: ShieldCheck,
            href: "/admin/roles-permissions",
            color: "emerald",
        },
    ];

const colorStyles: Record<string, string> = {
    cyan: "border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-300",
    violet: "border-violet-300/15 bg-violet-300/[0.08] text-violet-300",
    blue: "border-blue-300/15 bg-blue-300/[0.08] text-blue-300",
    emerald: "border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300",
};

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
}) {
    return (
        <div className="min-w-0">
            {eyebrow && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-300/80">
                    {eyebrow}
                </p>
            )}
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                {title}
            </h2>
            {description && (
                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    {description}
                </p>
            )}
        </div>
    );
}

function GlassCard({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`min-w-0 rounded-2xl border border-white/[0.08] bg-[#0B1628]/85 shadow-[0_12px_45px_rgba(0,0,0,0.12)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <div className="mx-auto max-w-[1600px] space-y-7 pb-8">
            {/* Welcome banner */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative isolate overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-[#10263F] via-[#0D1B31] to-[#17152F] p-5 sm:p-7 lg:p-9"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/[0.12] blur-[90px]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-28 right-1/3 -z-10 h-64 w-64 rounded-full bg-violet-500/[0.10] blur-[90px]"
                />

                <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[11px] font-medium text-cyan-200">
                            <Sparkles size={14} />
                            Smart ERP Control Center
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Your institution.
                            <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                                One intelligent workspace.
                            </span>
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                            Oversee your academic ecosystem, manage institutional resources,
                            and navigate your administration tools from one place.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                to="/admin/universities"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-[#04111F] shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:shadow-cyan-400/20"
                            >
                                Explore institutions
                                <ArrowRight size={16} />
                            </Link>

                            <Link
                                to="/admin/reports/academic"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
                            >
                                View reports
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:w-[280px] lg:shrink-0">
                        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4 backdrop-blur-md">
                            <Building2 className="mb-4 text-cyan-300" size={21} />
                            <p className="text-xs text-slate-400">Organization</p>
                            <p className="mt-1 text-sm font-semibold text-white">
                                Overview
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4 backdrop-blur-md">
                            <ShieldCheck className="mb-4 text-violet-300" size={21} />
                            <p className="text-xs text-slate-400">Administration</p>
                            <p className="mt-1 text-sm font-semibold text-white">Control</p>
                        </div>

                        <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/10 p-4 backdrop-blur-md">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    Centralized management
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Navigate your modules from one workspace
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Overview heading */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <SectionHeading
                    eyebrow="Dashboard overview"
                    title="Institutional snapshot"
                    description="A quick overview of your platform's key areas."
                />

                <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                    <CalendarDays size={15} className="text-cyan-300" />
                    Current overview
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.07, duration: 0.35 }}
                            whileHover={{ y: -4 }}
                            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B1628]/85 p-5 transition-colors hover:border-cyan-300/20 sm:p-6"
                        >
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/[0.035] blur-2xl transition group-hover:bg-cyan-400/[0.08]"
                            />

                            <div className="relative flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-400 sm:text-sm">
                                        {stat.title}
                                    </p>
                                    <p className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                        {stat.value}
                                    </p>
                                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                                        {stat.description}
                                    </p>
                                </div>

                                <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorStyles[stat.color]}`}
                                >
                                    <Icon size={21} />
                                </div>
                            </div>

                            <div className="relative mt-5 flex items-center gap-1.5 border-t border-white/[0.06] pt-4">
                                <Activity size={14} className="text-cyan-300" />
                                <span className="text-[11px] font-medium text-slate-500">
                                    Illustrative UI data
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick actions */}
            <section className="space-y-4">
                <SectionHeading
                    eyebrow="Shortcuts"
                    title="Quick actions"
                    description="Jump directly to frequently used administration modules."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;

                        return (
                            <motion.div
                                key={action.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                whileHover={{ y: -3 }}
                            >
                                <Link
                                    to={action.href}
                                    className="group flex h-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0B1628]/75 p-4 transition hover:border-cyan-300/20 hover:bg-[#101E32]"
                                >
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorStyles[action.color]}`}
                                    >
                                        <Icon size={20} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-100">
                                            {action.title}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>

                                    <ArrowRight
                                        size={16}
                                        className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300"
                                    />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Analytics and management */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                {/* Weekly activity */}
                <GlassCard className="p-5 sm:p-6 xl:col-span-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <SectionHeading
                            eyebrow="Platform analytics"
                            title="Weekly activity"
                            description="Illustrative activity distribution across the week."
                        />

                        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-cyan-300" />
                            Sample activity
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
                            {weeklyActivity.map((day, index) => (
                                <div
                                    key={day.day}
                                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
                                >
                                    <div className="flex h-full w-full items-end justify-center">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${day.value}%` }}
                                            transition={{
                                                duration: 0.65,
                                                delay: index * 0.07,
                                                ease: "easeOut",
                                            }}
                                            title={`${day.day}: illustrative value ${day.value}`}
                                            className={`relative w-full max-w-10 overflow-hidden rounded-t-lg border border-cyan-300/10 ${index === 5
                                                    ? "bg-gradient-to-t from-blue-600/80 to-cyan-300"
                                                    : "bg-gradient-to-t from-blue-600/50 to-cyan-300/70"
                                                }`}
                                        >
                                            <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
                                        </motion.div>
                                    </div>

                                    <span className="text-[11px] text-slate-500">{day.day}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <Sparkles
                                size={16}
                                className="mt-0.5 shrink-0 text-violet-300"
                            />
                            <p className="text-xs leading-5 text-slate-400">
                                This chart uses sample values for the visual layout. Connect
                                your existing analytics data to show actual activity.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Management areas */}
                <GlassCard className="p-5 sm:p-6 xl:col-span-2">
                    <SectionHeading
                        eyebrow="Workspace"
                        title="Management areas"
                        description="Common areas to review and maintain."
                    />

                    <div className="mt-5 space-y-2">
                        {managementAreas.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.title}
                                    to={item.href}
                                    className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-white/[0.07] hover:bg-white/[0.035]"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colorStyles[item.color]}`}
                                    >
                                        <Icon size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-slate-200">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                            {item.description}
                                        </p>
                                    </div>

                                    <ArrowRight
                                        size={15}
                                        className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300"
                                    />
                                </Link>
                            );
                        })}
                    </div>
                </GlassCard>
            </div>

            {/* Notifications and announcements */}
            <GlassCard className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <SectionHeading
                        eyebrow="Stay informed"
                        title="Notifications & updates"
                        description="A place for announcements, approvals and institutional alerts."
                    />

                    <Link
                        to="/admin/announcements"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-300/[0.06]"
                    >
                        View announcements
                        <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.015] px-5 py-9 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-300">
                        <Bell size={22} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-200">
                        Your updates will appear here
                    </p>

                    <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
                        Connect your existing announcements and notification data to
                        populate this panel with real information.
                    </p>

                    <Link
                        to="/admin/announcements"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/20 hover:text-cyan-200"
                    >
                        <Plus size={15} />
                        Open announcements
                    </Link>
                </div>
            </GlassCard>

            {/* Dashboard footer */}
            <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <p>Smart ERP · Administration workspace</p>
                <div className="flex items-center gap-2">
                    <Clock3 size={13} />
                    <span>Dashboard overview</span>
                </div>
            </div>
        </div>
    );
}