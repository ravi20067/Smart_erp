import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Bot,
    Building2,
    CalendarCheck,
    CalendarDays,
    Check,
    ChevronRight,
    GraduationCap,
    Layers3,
    LockKeyhole,
    Network,
    School,
    ShieldCheck,
    Sparkles,
    Users,
    UsersRound,
    Workflow,
    Zap,
} from "lucide-react";

import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

const solutions = [
    {
        number: "01",
        eyebrow: "ACADEMIC OPERATIONS",
        title: "Academic administration",
        description:
            "Build an organized academic foundation with academic years, courses, classes, sections, and subject-level configuration.",
        icon: GraduationCap,
        accent: "cyan",
        features: [
            "Academic year organization",
            "Course and section hierarchy",
            "Course-specific subject settings",
        ],
        href: "/modules/academic-administration",
    },
    {
        number: "02",
        eyebrow: "STUDENT EXPERIENCE",
        title: "Student management",
        description:
            "Give authorized staff a clearer way to navigate student profiles, organize records, and understand academic associations.",
        icon: Users,
        accent: "violet",
        features: [
            "Structured student profiles",
            "Organized student records",
            "Connected academic context",
        ],
        href: "/modules/student-management",
    },
    {
        number: "03",
        eyebrow: "FACULTY OPERATIONS",
        title: "Teacher management",
        description:
            "Organize faculty information and subject associations while making teaching responsibilities easier to understand.",
        icon: UsersRound,
        accent: "blue",
        features: [
            "Faculty profile organization",
            "Subject-teacher associations",
            "Teaching assignment visibility",
        ],
        href: "/modules/teacher-management",
    },
    {
        number: "04",
        eyebrow: "ATTENDANCE WORKFLOWS",
        title: "Attendance management",
        description:
            "Structure class attendance around sessions, verification, QR scanning, and attendance records.",
        icon: CalendarCheck,
        accent: "emerald",
        features: [
            "Teacher-led attendance sessions",
            "QR-based verification workflow",
            "Attendance status and records",
        ],
        href: "/modules/attendance",
    },
    {
        number: "05",
        eyebrow: "ACADEMIC PLANNING",
        title: "Timetable & scheduling",
        description:
            "Bring class schedules, subject sessions, lecture timing, and teaching assignments into a clearer planning experience.",
        icon: CalendarDays,
        accent: "amber",
        features: [
            "Timetable overview",
            "Lecture timing and duration",
            "Teacher and class context",
        ],
        href: "/modules/timetable",
    },
    {
        number: "06",
        eyebrow: "INSTITUTIONAL INSIGHTS",
        title: "Reports & analytics",
        description:
            "Present supported institutional information through structured reports, visual summaries, and trend-oriented views.",
        icon: BarChart3,
        accent: "pink",
        features: [
            "Visual reporting",
            "Time-based summaries",
            "Analytics-oriented workflows",
        ],
        href: "/modules/analytics",
    },
];

const audiences = [
    {
        icon: Building2,
        title: "Institution administrators",
        description:
            "Organize institutional structures and give authorized teams a clearer overview of academic and operational responsibilities.",
        points: [
            "Manage academic organization",
            "Coordinate institutional workflows",
            "Review supported reports",
        ],
    },
    {
        icon: GraduationCap,
        title: "Academic coordinators",
        description:
            "Work with course structures, sections, subjects, schedules, and faculty associations in a more consistent environment.",
        points: [
            "Plan academic structures",
            "Coordinate teaching assignments",
            "Review schedules and records",
        ],
    },
    {
        icon: UsersRound,
        title: "Teachers and faculty",
        description:
            "Access relevant teaching context and follow supported workflows for attendance, subjects, and schedules.",
        points: [
            "Review teaching responsibilities",
            "Use attendance workflows",
            "Navigate relevant academic information",
        ],
    },
    {
        icon: Users,
        title: "Student-facing teams",
        description:
            "Help authorized teams organize student information and navigate the records required for their responsibilities.",
        points: [
            "Review student profiles",
            "Understand academic associations",
            "Coordinate supported student workflows",
        ],
    },
];

const workflowSteps = [
    {
        number: "01",
        title: "Establish your academic structure",
        description:
            "Organize academic years, courses, sections, classes, and subjects using the institution's configured academic model.",
        icon: Layers3,
    },
    {
        number: "02",
        title: "Coordinate people and schedules",
        description:
            "Connect teacher and subject associations with the relevant academic context and scheduling workflows.",
        icon: Network,
    },
    {
        number: "03",
        title: "Manage day-to-day operations",
        description:
            "Use the implemented attendance and record-management workflows to support everyday institutional activities.",
        icon: Workflow,
    },
    {
        number: "04",
        title: "Understand the bigger picture",
        description:
            "Use supported reports and analytics to review available information and make better-informed decisions.",
        icon: BarChart3,
    },
];

const accentStyles: Record<
    string,
    { text: string; border: string; icon: string; glow: string; dot: string }
> = {
    cyan: {
        text: "text-cyan-300",
        border: "hover:border-cyan-400/25",
        icon: "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300",
        glow: "bg-cyan-400/[0.09]",
        dot: "bg-cyan-300",
    },
    violet: {
        text: "text-violet-300",
        border: "hover:border-violet-400/25",
        icon: "border-violet-400/20 bg-violet-400/[0.08] text-violet-300",
        glow: "bg-violet-400/[0.09]",
        dot: "bg-violet-300",
    },
    blue: {
        text: "text-blue-300",
        border: "hover:border-blue-400/25",
        icon: "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
        glow: "bg-blue-400/[0.09]",
        dot: "bg-blue-300",
    },
    emerald: {
        text: "text-emerald-300",
        border: "hover:border-emerald-400/25",
        icon: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
        glow: "bg-emerald-400/[0.09]",
        dot: "bg-emerald-300",
    },
    amber: {
        text: "text-amber-300",
        border: "hover:border-amber-400/25",
        icon: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
        glow: "bg-amber-400/[0.09]",
        dot: "bg-amber-300",
    },
    pink: {
        text: "text-pink-300",
        border: "hover:border-pink-400/25",
        icon: "border-pink-400/20 bg-pink-400/[0.08] text-pink-300",
        glow: "bg-pink-400/[0.09]",
        dot: "bg-pink-300",
    },
};

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.05] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 sm:text-xs">
                <Sparkles size={13} />
                {eyebrow}
            </div>

            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {title}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                {description}
            </p>
        </div>
    );
}

export default function Solutions() {
    const reduceMotion = useReducedMotion();

    const reveal = reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 22 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.12 },
            transition: { duration: 0.5, ease: "easeOut" as const },
        };

    return (
        <div className="min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
            <LandingHeader />

            <main>
                {/* HERO */}
                <section className="relative isolate px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
                    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute left-1/2 top-[-120px] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/[0.12] blur-[130px]" />
                        <div className="absolute right-[-10%] top-48 h-96 w-96 rounded-full bg-cyan-500/[0.08] blur-[120px]" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
                    </div>

                    <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                        <motion.div
                            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65, ease: "easeOut" }}
                        >
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                                <Building2 size={14} />
                                Solutions for education
                            </div>

                            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                                One institution.
                                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                                    Connected solutions.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                                Bring academic administration, student and faculty
                                management, attendance, scheduling, and reporting into a
                                connected Smart ERP experience designed around institutional
                                workflows.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <a
                                    href="#solutions"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/20"
                                >
                                    Explore solutions
                                    <ArrowRight size={16} />
                                </a>

                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.07]"
                                >
                                    Discuss your requirements
                                    <ArrowUpRight size={16} />
                                </Link>
                            </div>

                            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3">
                                {[
                                    "Connected academic workflows",
                                    "Role-aware experience",
                                    "AI-ready architecture",
                                ].map((item) => (
                                    <span
                                        key={item}
                                        className="inline-flex items-center gap-2 text-xs text-slate-400 sm:text-sm"
                                    >
                                        <Check size={14} className="text-cyan-300" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Hero visual */}
                        <motion.div
                            initial={
                                reduceMotion ? false : { opacity: 0, scale: 0.96, y: 18 }
                            }
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="relative mx-auto w-full max-w-xl"
                        >
                            <div className="pointer-events-none absolute inset-10 rounded-full bg-gradient-to-br from-cyan-500/[0.14] via-violet-500/[0.12] to-transparent blur-3xl" />

                            <div className="relative rounded-3xl border border-white/10 bg-[#0c1322]/90 p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-6">
                                <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200">
                                            <School size={22} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                Smart ERP ecosystem
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Connected solution areas
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] text-emerald-300">
                                        MODULAR
                                    </span>
                                </div>

                                <div className="relative mt-6 grid grid-cols-2 gap-3">
                                    {[
                                        {
                                            title: "Academics",
                                            detail: "Courses & sections",
                                            icon: GraduationCap,
                                            color: "text-cyan-300",
                                            border: "border-cyan-400/15",
                                        },
                                        {
                                            title: "People",
                                            detail: "Students & teachers",
                                            icon: UsersRound,
                                            color: "text-violet-300",
                                            border: "border-violet-400/15",
                                        },
                                        {
                                            title: "Operations",
                                            detail: "Attendance & timetable",
                                            icon: CalendarCheck,
                                            color: "text-emerald-300",
                                            border: "border-emerald-400/15",
                                        },
                                        {
                                            title: "Insights",
                                            detail: "Reports & analytics",
                                            icon: BarChart3,
                                            color: "text-pink-300",
                                            border: "border-pink-400/15",
                                        },
                                    ].map((item, index) => {
                                        const Icon = item.icon;

                                        return (
                                            <motion.div
                                                key={item.title}
                                                initial={
                                                    reduceMotion ? false : { opacity: 0, y: 12 }
                                                }
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: reduceMotion ? 0 : index * 0.08,
                                                }}
                                                className={`rounded-2xl border ${item.border} bg-white/[0.025] p-4 transition hover:bg-white/[0.05]`}
                                            >
                                                <Icon size={21} className={item.color} />
                                                <p className="mt-4 text-sm font-semibold text-white">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-slate-400">
                                                    {item.detail}
                                                </p>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-slate-950/40 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/[0.07] text-violet-200">
                                            <Bot size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-white">
                                                AI & Automation
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Multilingual assistance and model orchestration
                                            </p>
                                        </div>
                                        <Sparkles size={18} className="text-violet-300" />
                                    </div>
                                </div>

                                <p className="mt-4 text-center text-[10px] leading-5 text-slate-500">
                                    Conceptual overview of the Smart ERP solution areas
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* SOLUTIONS DIRECTORY */}
                <section
                    id="solutions"
                    className="scroll-mt-24 border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
                >
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow="Our solutions"
                            title="Designed around the way institutions work."
                            description="Explore each solution area to understand its purpose, key capabilities, and how it fits into the broader Smart ERP platform."
                        />

                        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {solutions.map((solution, index) => {
                                const Icon = solution.icon;
                                const accent = accentStyles[solution.accent];

                                return (
                                    <motion.article
                                        key={solution.number}
                                        {...reveal}
                                        transition={{
                                            duration: 0.45,
                                            delay: reduceMotion ? 0 : index * 0.055,
                                        }}
                                        whileHover={reduceMotion ? undefined : { y: -5 }}
                                        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition-colors duration-300 hover:bg-white/[0.045] ${accent.border}`}
                                    >
                                        <div
                                            className={`pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full blur-3xl transition-opacity group-hover:opacity-100 ${accent.glow} opacity-60`}
                                        />

                                        <div className="relative flex items-start justify-between gap-3">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accent.icon}`}
                                            >
                                                <Icon size={23} />
                                            </div>
                                            <span className="text-xs font-medium tracking-[0.15em] text-slate-600">
                                                {solution.number}
                                            </span>
                                        </div>

                                        <div className="relative mt-6">
                                            <p
                                                className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${accent.text}`}
                                            >
                                                {solution.eyebrow}
                                            </p>
                                            <h3 className="mt-3 text-xl font-semibold text-white">
                                                {solution.title}
                                            </h3>
                                            <p className="mt-3 min-h-[84px] text-sm leading-7 text-slate-400">
                                                {solution.description}
                                            </p>
                                        </div>

                                        <div className="relative mt-5 space-y-3 border-t border-white/[0.07] pt-5">
                                            {solution.features.map((feature) => (
                                                <div
                                                    key={feature}
                                                    className="flex items-start gap-2.5 text-xs leading-5 text-slate-300"
                                                >
                                                    <Check
                                                        size={14}
                                                        className={`mt-0.5 shrink-0 ${accent.text}`}
                                                    />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>

                                        <Link
                                            to={solution.href}
                                            className={`relative mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold transition-all duration-300 group-hover:gap-3 ${accent.text}`}
                                        >
                                            Explore solution
                                            <ArrowRight size={16} />
                                        </Link>
                                    </motion.article>
                                );
                            })}
                        </div>

                        <div className="mt-8 text-center">
                            <Link
                                to="/modules"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/20 hover:bg-white/[0.05] hover:text-white"
                            >
                                View all modules
                                <ArrowUpRight size={15} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* BY AUDIENCE */}
                <section className="border-y border-white/[0.06] bg-white/[0.018] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow="Solutions by role"
                            title="A more relevant experience for every team."
                            description="Different teams have different responsibilities. Smart ERP can present workflows around the roles, records, and actions each team is authorized to access."
                        />

                        <div className="mt-12 grid gap-4 md:grid-cols-2">
                            {audiences.map((audience, index) => {
                                const Icon = audience.icon;

                                return (
                                    <motion.article
                                        key={audience.title}
                                        {...reveal}
                                        transition={{
                                            duration: 0.5,
                                            delay: reduceMotion ? 0 : index * 0.07,
                                        }}
                                        className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-7"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
                                                <Icon size={22} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    {audience.title}
                                                </h3>
                                                <p className="mt-3 text-sm leading-7 text-slate-400">
                                                    {audience.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
                                            {audience.points.map((point) => (
                                                <div
                                                    key={point}
                                                    className="flex items-start gap-2 text-xs leading-5 text-slate-300"
                                                >
                                                    <Check
                                                        size={14}
                                                        className="mt-0.5 shrink-0 text-cyan-300"
                                                    />
                                                    {point}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CONNECTED WORKFLOW */}
                <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                        <motion.div {...reveal}>
                            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-300">
                                <Workflow size={15} />
                                Connected workflows
                            </div>

                            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                                From academic structure to institutional insight.
                            </h2>

                            <p className="mt-5 leading-7 text-slate-400">
                                The solution areas are designed to complement one another.
                                Establish the academic structure, coordinate people and
                                schedules, manage operational workflows, and review the
                                information your institution needs.
                            </p>

                            <div className="mt-7 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.035] p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
                                        <LockKeyhole size={19} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Authorization remains essential
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            Protected data and actions must follow the application's
                                            actual access-control rules.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/features"
                                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:gap-3"
                            >
                                Discover platform features
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>

                        <div className="relative space-y-4">
                            <div className="absolute bottom-10 left-[21px] top-10 w-px bg-gradient-to-b from-cyan-400/40 via-violet-400/30 to-transparent" />

                            {workflowSteps.map((step, index) => {
                                const Icon = step.icon;

                                return (
                                    <motion.div
                                        key={step.number}
                                        {...reveal}
                                        transition={{
                                            duration: 0.45,
                                            delay: reduceMotion ? 0 : index * 0.08,
                                        }}
                                        className="relative flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:gap-5 sm:p-6"
                                    >
                                        <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-[#0b1220] text-cyan-300">
                                            <Icon size={20} />
                                        </div>

                                        <div>
                                            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                                STEP {step.number}
                                            </div>
                                            <h3 className="font-semibold text-white">
                                                {step.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-7 text-slate-400">
                                                {step.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* AI SECTION */}
                <section className="border-y border-white/[0.06] bg-white/[0.018] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
                        <motion.div {...reveal}>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.05] px-3 py-1.5 text-xs font-semibold text-violet-300">
                                <Sparkles size={13} />
                                AI & Automation
                            </div>

                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Add an intelligent layer to your workflows.
                            </h2>

                            <p className="mt-5 leading-7 text-slate-400">
                                Explore a multilingual conversational assistant, configurable
                                LLM routing, and AI-supported workflows that can use approved
                                institutional context when the required integrations are
                                available.
                            </p>

                            <div className="mt-7 space-y-3">
                                {[
                                    "Questions in a user's preferred language",
                                    "Configurable model selection",
                                    "AI assistance grounded in approved context",
                                    "Existing authorization rules preserved",
                                ].map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-start gap-3 text-sm text-slate-300"
                                    >
                                        <Check
                                            size={16}
                                            className="mt-0.5 shrink-0 text-violet-300"
                                        />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <Link
                                to="/ai-automation"
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-400 to-blue-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                            >
                                Explore AI & Automation
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>

                        <motion.div
                            {...reveal}
                            className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1322] p-5 sm:p-7"
                        >
                            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.12] blur-3xl" />

                            <div className="relative flex items-center gap-3 border-b border-white/[0.08] pb-5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                                    <Bot size={23} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">
                                        Smart ERP AI Assistant
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Multilingual assistant concept
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-5 space-y-4">
                                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                                    <p className="text-xs text-cyan-200">You · Hinglish</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        Mujhe academic administration ka workflow samjhao.
                                    </p>
                                </div>

                                <div className="flex max-w-[94%] gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                                        <Sparkles size={15} />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.035] p-4">
                                        <p className="text-xs text-violet-300">
                                            Assistant · Example
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">
                                            Academic administration ko academic year, courses,
                                            sections, classes aur subjects mein organize kiya ja
                                            sakta hai. Actual operations aapke configured system par
                                            depend karenge.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-950/50 p-3">
                                    <Zap size={16} className="text-cyan-300" />
                                    <p className="text-xs leading-5 text-slate-400">
                                        Illustrative preview. Live AI responses require the
                                        configured AI service.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* SECURITY */}
                <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow="Built around trust"
                            title="A connected experience needs clear boundaries."
                            description="Good institutional software combines usability with dependable access controls and transparent data handling."
                        />

                        <div className="mt-10 grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: "Role-aware access",
                                    description:
                                        "Users should only see the data and actions permitted by the actual authorization system.",
                                },
                                {
                                    icon: LockKeyhole,
                                    title: "Protected information",
                                    description:
                                        "Sensitive records and consequential actions must be protected by server-side validation and permissions.",
                                },
                                {
                                    icon: Network,
                                    title: "Connected architecture",
                                    description:
                                        "Modules can share relevant academic context through their implemented relationships and integrations.",
                                },
                            ].map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <motion.div
                                        key={item.title}
                                        {...reveal}
                                        transition={{
                                            duration: 0.45,
                                            delay: reduceMotion ? 0 : index * 0.07,
                                        }}
                                        className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6"
                                    >
                                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300">
                                            <Icon size={21} />
                                        </div>
                                        <h3 className="font-semibold text-white">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-400">
                                            {item.description}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
                    <motion.div
                        {...reveal}
                        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#10192b] p-7 sm:p-10 lg:p-14"
                    >
                        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-cyan-500/[0.10] blur-3xl" />
                        <div className="pointer-events-none absolute -left-20 bottom-[-150px] h-72 w-72 rounded-full bg-violet-500/[0.10] blur-3xl" />

                        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                            <div className="max-w-2xl">
                                <div className="mb-4 text-cyan-300">
                                    <Sparkles size={25} />
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Find the right solution for your institution.
                                </h2>
                                <p className="mt-4 leading-7 text-slate-400">
                                    Explore the modules, understand your priorities, and discuss
                                    how the Smart ERP platform can support your workflows.
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                <Link
                                    to="/book-demo"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                                >
                                    Explore Smart ERP
                                    <ArrowRight size={16} />
                                </Link>

                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                                >
                                    Contact us
                                    <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
}