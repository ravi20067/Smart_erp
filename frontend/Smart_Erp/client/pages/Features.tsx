import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    motion,
    AnimatePresence,
    useReducedMotion,
} from "framer-motion";
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BellRing,
    BookOpen,
    BrainCircuit,
    CalendarDays,
    Check,
    ChevronDown,
    ClipboardCheck,
    Fingerprint,
    GraduationCap,
    Layers3,
    LockKeyhole,
    MessageSquareText,
    Search,
    Settings2,
    ShieldCheck,
    Sparkles,
    Users,
    UserRoundCheck,
    Workflow,
    Zap,
    type LucideIcon,
} from "lucide-react";

import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

type FeatureCategory =
    | "All"
    | "Administration"
    | "Academics"
    | "Intelligence"
    | "Security";

interface Feature {
    id: string;
    title: string;
    description: string;
    category: Exclude<FeatureCategory, "All">;
    icon: LucideIcon;
    highlights: string[];
    href: string;
    accent: string;
}

const categories: {
    label: FeatureCategory;
    description: string;
}[] = [
        {
            label: "All",
            description: "Explore the complete feature landscape.",
        },
        {
            label: "Administration",
            description: "Organize institutional operations.",
        },
        {
            label: "Academics",
            description: "Connect teaching and learning workflows.",
        },
        {
            label: "Intelligence",
            description: "Explore AI-assisted workflows and insights.",
        },
        {
            label: "Security",
            description: "Understand access control and accountability.",
        },
    ];

const features: Feature[] = [
    {
        id: "academic-administration",
        title: "Academic Administration",
        description:
            "Organize academic years, courses, classes, sections, and institutional structures in a connected workspace.",
        category: "Administration",
        icon: GraduationCap,
        highlights: [
            "Academic year organization",
            "Course and section structure",
            "Connected academic records",
        ],
        href: "/modules/academic-administration",
        accent: "cyan",
    },
    {
        id: "student-management",
        title: "Student Management",
        description:
            "Bring student information and academic relationships into a structured institutional workflow.",
        category: "Administration",
        icon: Users,
        highlights: [
            "Student information workflows",
            "Academic associations",
            "Centralized record organization",
        ],
        href: "/modules/student-management",
        accent: "violet",
    },
    {
        id: "teacher-management",
        title: "Teacher Management",
        description:
            "Organize teacher records, subject associations, and academic responsibilities around institutional needs.",
        category: "Administration",
        icon: UserRoundCheck,
        highlights: [
            "Teacher and subject relationships",
            "Academic responsibility mapping",
            "Connected workflows",
        ],
        href: "/modules/teacher-management",
        accent: "blue",
    },
    {
        id: "smart-attendance",
        title: "Smart Attendance",
        description:
            "Explore attendance workflows designed around classroom sessions, authentication, and timely updates.",
        category: "Academics",
        icon: ClipboardCheck,
        highlights: [
            "Session-oriented attendance",
            "QR-based workflow concepts",
            "Attendance record visibility",
        ],
        href: "/modules/attendance",
        accent: "emerald",
    },
    {
        id: "timetable",
        title: "Timetable & Scheduling",
        description:
            "Bring academic schedules, class organization, and teaching requirements into a coordinated workflow.",
        category: "Academics",
        icon: CalendarDays,
        highlights: [
            "Class scheduling concepts",
            "Teaching workload considerations",
            "Academic coordination",
        ],
        href: "/modules/timetable",
        accent: "orange",
    },
    {
        id: "learning-resources",
        title: "Learning Resources",
        description:
            "Connect subjects with chapters, learning units, and associated educational materials.",
        category: "Academics",
        icon: BookOpen,
        highlights: [
            "Subject-based organization",
            "Chapter and mini-chapter structure",
            "Learning material associations",
        ],
        href: "/modules/learning-resources",
        accent: "cyan",
    },
    {
        id: "examinations",
        title: "Examinations & Results",
        description:
            "Explore a structured approach to assessment workflows, academic outcomes, and result organization.",
        category: "Academics",
        icon: Layers3,
        highlights: [
            "Assessment workflow concepts",
            "Academic outcome organization",
            "Result analysis opportunities",
        ],
        href: "/modules/examinations",
        accent: "pink",
    },
    {
        id: "analytics",
        title: "Analytics & Reporting",
        description:
            "Turn institutional records into clearer reporting workflows and opportunities for data-informed decisions.",
        category: "Intelligence",
        icon: BarChart3,
        highlights: [
            "Structured reporting",
            "Academic trend exploration",
            "Decision-support opportunities",
        ],
        href: "/modules/analytics",
        accent: "violet",
    },
    {
        id: "ai-assistant",
        title: "AI Assistance",
        description:
            "Explore natural-language assistance for institutional questions, academic analysis, and report preparation.",
        category: "Intelligence",
        icon: BrainCircuit,
        highlights: [
            "Natural-language interaction",
            "AI-assisted analysis concepts",
            "Report-generation opportunities",
        ],
        href: "/ai-automation",
        accent: "cyan",
    },
    {
        id: "workflow-automation",
        title: "Workflow Automation",
        description:
            "Identify repetitive institutional tasks that could benefit from rule-based workflows and intelligent assistance.",
        category: "Intelligence",
        icon: Workflow,
        highlights: [
            "Rule-based workflow concepts",
            "Notification opportunities",
            "Reduced repetitive work",
        ],
        href: "/ai-automation",
        accent: "orange",
    },
    {
        id: "access-control",
        title: "Authentication & Permissions",
        description:
            "Structure access around users, roles, permissions, and the resources each user is authorized to access.",
        category: "Security",
        icon: ShieldCheck,
        highlights: [
            "Role-aware access",
            "Resource-level permission concepts",
            "Controlled feature visibility",
        ],
        href: "/modules/permissions-security",
        accent: "emerald",
    },
    {
        id: "live-updates",
        title: "Notifications & Live Updates",
        description:
            "Explore timely notifications and real-time update workflows for connected institutional activities.",
        category: "Administration",
        icon: BellRing,
        highlights: [
            "Event notification concepts",
            "Timely workflow updates",
            "Connected user experiences",
        ],
        href: "/modules/notifications",
        accent: "blue",
    },
    {
        id: "institution-customization",
        title: "Institution Customization",
        description:
            "Explore configuration possibilities that help adapt academic structures and selected modules to institutional needs.",
        category: "Administration",
        icon: Settings2,
        highlights: [
            "Configurable academic structures",
            "Module-oriented organization",
            "Institution-specific workflows",
        ],
        href: "/solutions",
        accent: "pink",
    },
    {
        id: "smart-communication",
        title: "Connected Communication",
        description:
            "Explore how connected modules can make institutional information easier to organize and access.",
        category: "Academics",
        icon: MessageSquareText,
        highlights: [
            "Connected information workflows",
            "Communication opportunities",
            "Context-aware assistance",
        ],
        href: "/modules",
        accent: "violet",
    },
    {
        id: "data-governance",
        title: "Data Access & Governance",
        description:
            "Explore permission-aware access patterns and responsible handling of institution-related information.",
        category: "Security",
        icon: LockKeyhole,
        highlights: [
            "Permission-aware workflows",
            "Controlled information access",
            "Security-conscious design",
        ],
        href: "/modules/permissions-security",
        accent: "cyan",
    },
];

const accentClasses: Record<
    string,
    { icon: string; glow: string; line: string }
> = {
    cyan: {
        icon: "bg-cyan-400/10 text-cyan-300 ring-cyan-300/20",
        glow: "group-hover:shadow-cyan-500/10",
        line: "from-cyan-400 to-blue-500",
    },
    violet: {
        icon: "bg-violet-400/10 text-violet-300 ring-violet-300/20",
        glow: "group-hover:shadow-violet-500/10",
        line: "from-violet-400 to-fuchsia-500",
    },
    blue: {
        icon: "bg-blue-400/10 text-blue-300 ring-blue-300/20",
        glow: "group-hover:shadow-blue-500/10",
        line: "from-blue-400 to-cyan-500",
    },
    emerald: {
        icon: "bg-emerald-400/10 text-emerald-300 ring-emerald-300/20",
        glow: "group-hover:shadow-emerald-500/10",
        line: "from-emerald-400 to-cyan-500",
    },
    orange: {
        icon: "bg-orange-400/10 text-orange-300 ring-orange-300/20",
        glow: "group-hover:shadow-orange-500/10",
        line: "from-orange-400 to-pink-500",
    },
    pink: {
        icon: "bg-pink-400/10 text-pink-300 ring-pink-300/20",
        glow: "group-hover:shadow-pink-500/10",
        line: "from-pink-400 to-violet-500",
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

export default function Features() {
    const reduceMotion = useReducedMotion();
    const [activeCategory, setActiveCategory] =
        useState<FeatureCategory>("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFeatures = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return features.filter((feature) => {
            const matchesCategory =
                activeCategory === "All" ||
                feature.category === activeCategory;

            const searchableText = [
                feature.title,
                feature.description,
                feature.category,
                ...feature.highlights,
            ]
                .join(" ")
                .toLowerCase();

            return matchesCategory && searchableText.includes(query);
        });
    }, [activeCategory, searchQuery]);

    const motionProps = reduceMotion
        ? {}
        : {
            initial: "hidden" as const,
            whileInView: "visible" as const,
            viewport: { once: true, amount: 0.12 },
            variants: fadeUp,
            transition: { duration: 0.55, ease: "easeOut" as const },
        };

    return (
        <div className="min-h-screen overflow-x-clip bg-[#050816] text-slate-100 selection:bg-cyan-400/30">
            <LandingHeader />

            <main>
                {/* Ambient background */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
                >
                    <div className="absolute -left-40 top-32 h-96 w-96 rounded-full bg-cyan-500/[0.08] blur-[120px]" />
                    <div className="absolute -right-40 top-[35rem] h-[32rem] w-[32rem] rounded-full bg-violet-600/[0.10] blur-[140px]" />
                    <div className="absolute left-1/3 top-[75rem] h-80 w-80 rounded-full bg-blue-600/[0.07] blur-[120px]" />
                </div>

                {/* Hero */}
                <section className="relative z-10 px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-32">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            {...motionProps}
                            className="mx-auto max-w-4xl text-center"
                        >
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-xs font-semibold tracking-wide text-cyan-200 sm:text-sm">
                                <Sparkles size={15} />
                                THE SMART ERP ECOSYSTEM
                                <span className="h-1 w-1 rounded-full bg-cyan-300" />
                                Connected by design
                            </div>

                            <h1 className="text-balance text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                Everything your institution needs.
                                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                                    Connected intelligently.
                                </span>
                            </h1>

                            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                                Explore a connected approach to academic administration,
                                learning workflows, institutional insights, access control,
                                and AI-assisted operations — designed around the way
                                educational institutions work.
                            </p>

                            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                                <Link
                                    to="/book-demo"
                                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
                                >
                                    Explore Smart ERP
                                    <ArrowUpRight
                                        size={18}
                                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    />
                                </Link>

                                <a
                                    href="#feature-directory"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3 font-semibold text-slate-200 transition duration-300 hover:border-cyan-300/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                >
                                    Browse all features
                                    <ArrowDownRight size={18} />
                                </a>
                            </div>
                        </motion.div>

                        {/* Feature summary panel */}
                        <motion.div
                            {...motionProps}
                            className="relative mx-auto mt-16 max-w-5xl sm:mt-20"
                        >
                            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-violet-500/15 opacity-70 blur-xl" />

                            <div className="relative grid gap-px overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/10 shadow-2xl shadow-black/30 sm:grid-cols-3">
                                {[
                                    {
                                        icon: Layers3,
                                        title: "Connected modules",
                                        text: "Academic workflows in one ecosystem",
                                        color: "text-cyan-300",
                                    },
                                    {
                                        icon: BrainCircuit,
                                        title: "AI-ready architecture",
                                        text: "Assistance where it adds value",
                                        color: "text-violet-300",
                                    },
                                    {
                                        icon: ShieldCheck,
                                        title: "Access-conscious design",
                                        text: "Permissions remain part of the workflow",
                                        color: "text-blue-300",
                                    },
                                ].map((item, index) => {
                                    const Icon = item.icon;

                                    return (
                                        <motion.div
                                            key={item.title}
                                            initial={
                                                reduceMotion ? false : { opacity: 0, y: 14 }
                                            }
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{
                                                delay: reduceMotion ? 0 : index * 0.1,
                                                duration: 0.45,
                                            }}
                                            className="flex items-start gap-4 bg-[#0a1022]/95 p-5 sm:p-6"
                                        >
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] ${item.color}`}
                                            >
                                                <Icon size={21} />
                                            </div>

                                            <div>
                                                <h2 className="font-semibold text-white">
                                                    {item.title}
                                                </h2>
                                                <p className="mt-1 text-sm leading-6 text-slate-400">
                                                    {item.text}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Directory introduction and filters */}
                <section
                    id="feature-directory"
                    className="relative z-10 scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
                >
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            {...motionProps}
                            className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
                        >
                            <div className="max-w-2xl">
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                                    Feature directory
                                </p>

                                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                                    Explore the building blocks
                                    <span className="block text-slate-400">
                                        of a smarter institution.
                                    </span>
                                </h2>

                                <p className="mt-4 max-w-xl leading-7 text-slate-400">
                                    Find the capabilities relevant to your institution.
                                    Search by topic or browse by functional area.
                                </p>
                            </div>

                            <div className="relative w-full lg:max-w-sm">
                                <Search
                                    size={19}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                />

                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search features..."
                                    aria-label="Search features"
                                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/[0.08]"
                                />
                            </div>
                        </motion.div>

                        {/* Category filters */}
                        <div
                            className="mb-8 flex gap-2 overflow-x-auto pb-3"
                            aria-label="Filter features by category"
                        >
                            {categories.map((category) => {
                                const isActive = activeCategory === category.label;

                                return (
                                    <button
                                        key={category.label}
                                        type="button"
                                        onClick={() => setActiveCategory(category.label)}
                                        aria-pressed={isActive}
                                        className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isActive
                                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-lg shadow-cyan-950/20"
                                            : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                                            }`}
                                    >
                                        {category.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <p
                                className="text-sm text-slate-500"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                Showing{" "}
                                <span className="font-semibold text-slate-300">
                                    {filteredFeatures.length}
                                </span>{" "}
                                {filteredFeatures.length === 1 ? "feature" : "features"}
                                {activeCategory !== "All" &&
                                    ` in ${activeCategory}`}
                            </p>

                            {(searchQuery || activeCategory !== "All") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveCategory("All");
                                    }}
                                    className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {/* Feature cards */}
                        <motion.div
                            layout={!reduceMotion}
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredFeatures.map((feature, index) => {
                                    const Icon = feature.icon;
                                    const accent =
                                        accentClasses[feature.accent] ?? accentClasses.cyan;

                                    return (
                                        <motion.article
                                            key={feature.id}
                                            layout={!reduceMotion}
                                            initial={
                                                reduceMotion
                                                    ? false
                                                    : { opacity: 0, y: 18, scale: 0.985 }
                                            }
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={
                                                reduceMotion
                                                    ? undefined
                                                    : { opacity: 0, y: 10, scale: 0.98 }
                                            }
                                            transition={{
                                                duration: reduceMotion ? 0 : 0.3,
                                                delay: reduceMotion ? 0 : (index % 3) * 0.045,
                                            }}
                                            className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.085] bg-gradient-to-br from-white/[0.055] to-white/[0.018] p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:shadow-2xl sm:p-6 ${accent.glow}`}
                                        >
                                            <div
                                                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent.line} opacity-0 transition duration-300 group-hover:opacity-100`}
                                            />

                                            <div className="flex items-start justify-between gap-4">
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition duration-300 group-hover:scale-105 ${accent.icon}`}
                                                >
                                                    <Icon size={23} strokeWidth={1.8} />
                                                </div>

                                                <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                    {feature.category}
                                                </span>
                                            </div>

                                            <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
                                                {feature.title}
                                            </h3>

                                            <p className="mt-3 text-sm leading-7 text-slate-400">
                                                {feature.description}
                                            </p>

                                            <ul className="mt-5 space-y-3">
                                                {feature.highlights.map((highlight) => (
                                                    <li
                                                        key={highlight}
                                                        className="flex items-start gap-2.5 text-sm text-slate-300"
                                                    >
                                                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-300">
                                                            <Check size={11} strokeWidth={2.5} />
                                                        </span>
                                                        <span>{highlight}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="mt-auto pt-7">
                                                <Link
                                                    to={feature.href}
                                                    className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition duration-300 hover:gap-3 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                                >
                                                    Explore capability
                                                    <ArrowRight
                                                        size={16}
                                                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                                                    />
                                                </Link>
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>

                        {filteredFeatures.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center"
                            >
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                    <Search size={24} />
                                </div>

                                <h3 className="mt-5 text-lg font-semibold text-white">
                                    No matching features found
                                </h3>

                                <p className="mt-2 text-sm text-slate-400">
                                    Try another search term or choose a different category.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveCategory("All");
                                    }}
                                    className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                >
                                    Show all features
                                </button>
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* AI spotlight */}
                <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                    <motion.div
                        {...motionProps}
                        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-[#11132c] via-[#0b1225] to-[#07101d] p-6 shadow-2xl shadow-violet-950/20 sm:p-10 lg:p-14"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-500/15 blur-[100px]"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]"
                        />

                        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-violet-200">
                                    <Zap size={14} />
                                    Intelligence layer
                                </div>

                                <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                                    More than management.
                                    <span className="mt-2 block bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                                        A more intelligent workflow.
                                    </span>
                                </h2>

                                <p className="mt-5 max-w-xl leading-8 text-slate-400">
                                    Smart ERP explores how AI assistance can complement
                                    institutional workflows — from natural-language questions
                                    and report preparation to rule-based automation and
                                    permission-aware information access.
                                </p>

                                <Link
                                    to="/ai-automation"
                                    className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[0.08] px-5 py-3 font-semibold text-violet-100 transition duration-300 hover:border-violet-300/40 hover:bg-violet-300/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                                >
                                    Discover AI & Automation
                                    <ArrowUpRight
                                        size={18}
                                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    />
                                </Link>
                            </div>

                            {/* Conceptual architecture illustration */}
                            <div className="relative mx-auto w-full max-w-md">
                                <div className="absolute inset-8 rounded-full bg-violet-500/10 blur-3xl" />

                                <div className="relative space-y-3">
                                    <div className="rounded-2xl border border-cyan-300/20 bg-[#0c1b2b]/90 p-4 shadow-lg shadow-cyan-950/20">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                                                <GraduationCap size={21} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">
                                                    Smart ERP
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Institutional workflows and records
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center text-cyan-300/60">
                                        <ArrowDownRight size={22} />
                                    </div>

                                    <div className="rounded-2xl border border-blue-300/20 bg-[#10172d]/95 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-300/10 text-blue-300">
                                                <Fingerprint size={21} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">
                                                    Authorization layer
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Permission-aware access concept
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center text-violet-300/60">
                                        <ArrowDownRight size={22} />
                                    </div>

                                    <div className="rounded-2xl border border-violet-300/20 bg-[#17142d]/95 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-300/10 text-violet-300">
                                                <BrainCircuit size={21} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">
                                                    AI gateway & model routing
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Conceptual AI integration architecture
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center text-violet-300/60">
                                        <ArrowDownRight size={22} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
                                            <p className="text-sm font-semibold text-slate-200">
                                                Cloud models
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                When configured
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
                                            <p className="text-sm font-semibold text-slate-200">
                                                Local models
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                When configured
                                            </p>
                                        </div>
                                    </div>

                                    <p className="pt-2 text-center text-xs leading-5 text-slate-500">
                                        Illustrative architecture only. Actual integrations
                                        depend on implementation and configuration.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Workflow benefits */}
                <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            {...motionProps}
                            className="mx-auto mb-12 max-w-2xl text-center"
                        >
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                                Designed to work together
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Connected workflows.
                                <span className="block text-slate-400">
                                    Clearer institutional operations.
                                </span>
                            </h2>

                            <p className="mt-4 leading-7 text-slate-400">
                                The value comes from how different capabilities relate to
                                each other — not just from a collection of disconnected tools.
                            </p>
                        </motion.div>

                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    step: "01",
                                    title: "Organize",
                                    icon: Layers3,
                                    description:
                                        "Structure courses, sections, subjects, people, and academic information around institutional requirements.",
                                    color: "text-cyan-300",
                                },
                                {
                                    step: "02",
                                    title: "Coordinate",
                                    icon: Workflow,
                                    description:
                                        "Connect related workflows so academic activities and institutional responsibilities are easier to follow.",
                                    color: "text-blue-300",
                                },
                                {
                                    step: "03",
                                    title: "Understand",
                                    icon: BarChart3,
                                    description:
                                        "Explore reporting and AI-assisted insights to support informed decisions when the relevant capabilities are configured.",
                                    color: "text-violet-300",
                                },
                            ].map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <motion.article
                                        key={item.step}
                                        initial={
                                            reduceMotion ? false : { opacity: 0, y: 22 }
                                        }
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{
                                            duration: 0.45,
                                            delay: reduceMotion ? 0 : index * 0.1,
                                        }}
                                        className="group rounded-2xl border border-white/[0.085] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.04] sm:p-7"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold tracking-[0.2em] text-slate-600">
                                                {item.step}
                                            </span>
                                            <Icon
                                                size={23}
                                                className={`${item.color} transition-transform duration-300 group-hover:scale-110`}
                                            />
                                        </div>

                                        <h3 className="mt-8 text-xl font-semibold text-white">
                                            {item.title}
                                        </h3>

                                        <p className="mt-3 text-sm leading-7 text-slate-400">
                                            {item.description}
                                        </p>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                        <motion.div {...motionProps}>
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                                Common questions
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Before you explore further.
                            </h2>

                            <p className="mt-4 max-w-md leading-7 text-slate-400">
                                Understand how the feature directory relates to the Smart ERP
                                product and its evolving capabilities.
                            </p>

                            <Link
                                to="/contact"
                                className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                            >
                                Ask us a question
                                <ArrowRight
                                    size={16}
                                    className="transition-transform duration-300 group-hover:translate-x-1"
                                />
                            </Link>
                        </motion.div>

                        <div className="space-y-3">
                            {[
                                {
                                    question: "Are all listed capabilities available today?",
                                    answer:
                                        "This page describes the Smart ERP capability landscape. Availability depends on the implementation status of each module. Confirmed release statuses should be maintained from verified project information rather than assumed from marketing copy.",
                                },
                                {
                                    question: "Can institutions choose relevant modules?",
                                    answer:
                                        "The product direction supports institution-oriented configuration. The exact module selection, dependencies, and customization options should be confirmed for the deployment being discussed.",
                                },
                                {
                                    question: "How does AI fit into Smart ERP?",
                                    answer:
                                        "The AI direction includes module-specific assistance, natural-language interaction, analysis, report preparation, workflow automation, and model routing. Specific integrations depend on the configured models, permissions, and implemented services.",
                                },
                                {
                                    question: "Does this page change the ERP backend?",
                                    answer:
                                        "No. This is a public-facing feature directory. Its search, filters, animations, and navigation operate in the frontend and do not modify backend APIs or authentication.",
                                },
                            ].map((item, index) => (
                                <FeatureFaq
                                    key={item.question}
                                    question={item.question}
                                    answer={item.answer}
                                    reduceMotion={Boolean(reduceMotion)}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative z-10 px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
                    <motion.div
                        {...motionProps}
                        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#0b1324] px-6 py-12 text-center sm:px-10 sm:py-16 lg:px-16 lg:py-20"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-20 -top-28 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-violet-500/15 blur-[110px]"
                        />

                        <div className="relative mx-auto max-w-3xl">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                                <Sparkles size={26} />
                            </div>

                            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                                Find the right fit for your institution.
                            </h2>

                            <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-400">
                                Explore the modules, discuss your academic workflows, and
                                understand which Smart ERP capabilities align with your
                                institution's requirements.
                            </p>

                            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                                <Link
                                    to="/book-demo"
                                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1324]"
                                >
                                    Book a Demo
                                    <ArrowUpRight
                                        size={18}
                                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    />
                                </Link>

                                <Link
                                    to="/modules"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3 font-semibold text-slate-200 transition duration-300 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                >
                                    Explore Modules
                                    <ArrowRight size={18} />
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

interface FeatureFaqProps {
    question: string;
    answer: string;
    reduceMotion: boolean;
    index: number;
}

function FeatureFaq({
    question,
    answer,
    reduceMotion,
    index,
}: FeatureFaqProps) {
    const [isOpen, setIsOpen] = useState(index === 0);
    const answerId = `feature-faq-answer-${index}`;

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                duration: 0.35,
                delay: reduceMotion ? 0 : index * 0.06,
            }}
            className={`overflow-hidden rounded-xl border transition-colors duration-300 ${isOpen
                ? "border-cyan-300/20 bg-cyan-300/[0.035]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                }`}
        >
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:p-6"
            >
                <span className="font-medium leading-6 text-slate-100">
                    {question}
                </span>

                <ChevronDown
                    size={19}
                    className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-cyan-300" : ""
                        }`}
                />
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        id={answerId}
                        initial={
                            reduceMotion ? false : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={
                            reduceMotion
                                ? undefined
                                : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: reduceMotion ? 0 : 0.25 }}
                        className="overflow-hidden"
                    >
                        <p className="px-5 pb-5 text-sm leading-7 text-slate-400 sm:px-6 sm:pb-6">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}