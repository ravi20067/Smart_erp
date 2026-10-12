import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    motion,
    useReducedMotion,
} from "framer-motion";
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    GraduationCap,
    LayoutGrid,
    Search,
    ShieldCheck,
    Sparkles,
    Users,
    UsersRound,
    X,
} from "lucide-react";

import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

type Category = "All Modules" | "Academic" | "People" | "Operations" | "Insights";

type ModuleItem = {
    title: string;
    description: string;
    href: string;
    category: Exclude<Category, "All Modules">;
    icon: typeof GraduationCap;
    accent: string;
    iconBg: string;
    highlights: string[];
    number: string;
};

const modules: ModuleItem[] = [
    {
        title: "Academic Administration",
        description:
            "Build a structured academic foundation with courses, academic years, classes, sections, and subject configuration.",
        href: "/modules/academic-administration",
        category: "Academic",
        icon: GraduationCap,
        accent: "from-cyan-400 to-blue-500",
        iconBg: "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300",
        highlights: [
            "Academic year organization",
            "Course and section structure",
            "Subject configuration",
        ],
        number: "01",
    },
    {
        title: "Student Management",
        description:
            "Organize student profiles and records in a clear workspace connected to the institution's academic structure.",
        href: "/modules/student-management",
        category: "People",
        icon: Users,
        accent: "from-violet-400 to-fuchsia-500",
        iconBg: "border-violet-400/20 bg-violet-400/[0.08] text-violet-300",
        highlights: [
            "Student profiles",
            "Structured records",
            "Academic associations",
        ],
        number: "02",
    },
    {
        title: "Teacher Management",
        description:
            "Organize faculty profiles, subject associations, and teaching responsibilities in one consistent experience.",
        href: "/modules/teacher-management",
        category: "People",
        icon: UsersRound,
        accent: "from-blue-400 to-indigo-500",
        iconBg: "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
        highlights: [
            "Teacher profiles",
            "Subject associations",
            "Teaching assignments",
        ],
        number: "03",
    },
    {
        title: "Attendance Management",
        description:
            "Present class attendance workflows with teacher-led sessions, QR scanning, verification, and attendance records.",
        href: "/modules/attendance",
        category: "Operations",
        icon: CheckCircle2,
        accent: "from-emerald-400 to-teal-500",
        iconBg: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
        highlights: [
            "Attendance sessions",
            "QR-based workflow",
            "Verification and review",
        ],
        number: "04",
    },
    {
        title: "Timetable & Scheduling",
        description:
            "Bring class schedules, subject sessions, lecture timing, and teaching assignments into a readable planning experience.",
        href: "/modules/timetable",
        category: "Operations",
        icon: CalendarDays,
        accent: "from-amber-300 to-orange-500",
        iconBg: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
        highlights: [
            "Timetable overview",
            "Lecture timing",
            "Schedule organization",
        ],
        number: "05",
    },
    {
        title: "Reports & Analytics",
        description:
            "Turn supported institutional data into understandable reports, visual summaries, and analytics-oriented views.",
        href: "/modules/analytics",
        category: "Insights",
        icon: BarChart3,
        accent: "from-pink-400 to-violet-500",
        iconBg: "border-pink-400/20 bg-pink-400/[0.08] text-pink-300",
        highlights: [
            "Visual summaries",
            "Structured reports",
            "Trend visibility",
        ],
        number: "06",
    },
];

const categories: Category[] = [
    "All Modules",
    "Academic",
    "People",
    "Operations",
    "Insights",
];

const stats = [
    { value: "06", label: "Core module areas", icon: LayoutGrid },
    { value: "01", label: "Connected platform", icon: Activity },
    { value: "360°", label: "Institutional perspective", icon: ShieldCheck },
];

export default function Modules() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] =
        useState<Category>("All Modules");
    const reduceMotion = useReducedMotion();

    const filteredModules = useMemo(() => {
        const query = search.trim().toLowerCase();

        return modules.filter((module) => {
            const matchesCategory =
                activeCategory === "All Modules" ||
                module.category === activeCategory;

            const searchableText = [
                module.title,
                module.description,
                module.category,
                ...module.highlights,
            ]
                .join(" ")
                .toLowerCase();

            return matchesCategory && searchableText.includes(query);
        });
    }, [search, activeCategory]);

    return (
        <div className="min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
            <LandingHeader />

            <main>
                {/* Hero */}
                <section className="relative isolate px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8 lg:pt-24">
                    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute left-1/2 top-0 h-[460px] w-[720px] -translate-x-1/2 rounded-full bg-blue-600/[0.12] blur-[130px]" />
                        <div className="absolute right-[-10%] top-32 h-80 w-80 rounded-full bg-cyan-500/[0.08] blur-[110px]" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
                    </div>

                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="mx-auto max-w-5xl text-center"
                    >
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-300">
                            <Sparkles size={14} />
                            Explore the Smart ERP ecosystem
                        </div>

                        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
                            Everything your institution needs.
                            <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                                Connected in one place.
                            </span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
                            Explore Smart ERP modules designed to bring academic
                            administration, people management, daily operations, and
                            institutional insights into a more organized experience.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <a
                                href="#module-directory"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20 sm:w-auto"
                            >
                                Explore all modules
                                <ArrowRight size={16} />
                            </a>

                            <Link
                                to="/book-demo"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.07] sm:w-auto"
                            >
                                Book a demo
                                <ArrowUpRight size={16} />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Platform stats */}
                    <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;

                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: reduceMotion ? 0 : 0.15 + index * 0.1,
                                    }}
                                    className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl sm:p-5"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold text-white">
                                            {stat.value}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {stat.label}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Module directory */}
                <section
                    id="module-directory"
                    className="scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
                >
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                                    Module directory
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Find the right module.
                                </h2>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                                    Browse by function or search for a specific capability.
                                </p>
                            </div>

                            <p className="text-sm text-slate-400">
                                <span className="font-semibold text-white">
                                    {filteredModules.length.toString().padStart(2, "0")}
                                </span>{" "}
                                {filteredModules.length === 1 ? "module" : "modules"} found
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
                            <div className="relative w-full lg:max-w-md">
                                <Search
                                    size={18}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search modules or capabilities..."
                                    aria-label="Search ERP modules"
                                    className="w-full rounded-xl border border-white/[0.09] bg-white/[0.035] py-3.5 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Category filters */}
                            <div
                                className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap"
                                aria-label="Filter modules by category"
                            >
                                {categories.map((category) => {
                                    const selected = activeCategory === category;

                                    return (
                                        <button
                                            key={category}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => setActiveCategory(category)}
                                            className={`shrink-0 rounded-xl border px-4 py-3 text-xs font-medium transition duration-200 ${selected
                                                    ? "border-cyan-400/25 bg-cyan-400/[0.1] text-cyan-200"
                                                    : "border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/[0.16] hover:text-white"
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cards */}
                        {filteredModules.length > 0 ? (
                            <motion.div
                                layout={!reduceMotion}
                                className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                            >
                                {filteredModules.map((module, index) => {
                                    const Icon = module.icon;

                                    return (
                                        <motion.article
                                            key={module.href}
                                            layout={!reduceMotion}
                                            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{
                                                duration: 0.35,
                                                delay: reduceMotion ? 0 : index * 0.045,
                                            }}
                                            whileHover={reduceMotion ? undefined : { y: -5 }}
                                            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.03] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.17] hover:bg-white/[0.05] sm:p-6"
                                        >
                                            <div
                                                className={`pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-gradient-to-br ${module.accent} opacity-[0.08] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.17]`}
                                            />

                                            <div className="relative flex items-start justify-between gap-4">
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${module.iconBg}`}
                                                >
                                                    <Icon size={23} />
                                                </div>

                                                <span className="text-xs font-medium tracking-widest text-slate-600">
                                                    {module.number}
                                                </span>
                                            </div>

                                            <div className="relative mt-6">
                                                <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                                    {module.category}
                                                </span>

                                                <h3 className="mt-3 text-xl font-semibold text-white">
                                                    {module.title}
                                                </h3>

                                                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">
                                                    {module.description}
                                                </p>
                                            </div>

                                            <div className="relative mt-5 space-y-3 border-t border-white/[0.07] pt-5">
                                                {module.highlights.map((highlight) => (
                                                    <div
                                                        key={highlight}
                                                        className="flex items-center gap-2.5 text-xs text-slate-300"
                                                    >
                                                        <CheckCircle2
                                                            size={14}
                                                            className="shrink-0 text-cyan-300/80"
                                                        />
                                                        {highlight}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="relative mt-auto pt-7">
                                                <Link
                                                    to={module.href}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm font-medium text-white transition group-hover:border-cyan-400/20 group-hover:bg-cyan-400/[0.05]"
                                                >
                                                    Explore module
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 transition group-hover:bg-cyan-400/10 group-hover:text-cyan-300">
                                                        <ChevronRight size={16} />
                                                    </span>
                                                </Link>
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <div className="mt-8 rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-400">
                                    <Search size={23} />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-white">
                                    No matching modules
                                </h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                                    Try another keyword or clear the selected category to see
                                    all available modules.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setActiveCategory("All Modules");
                                    }}
                                    className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/[0.12]"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Ecosystem banner */}
                <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                        whileInView="visible"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55 }}
                        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#10192b] p-7 sm:p-10 lg:p-14"
                    >
                        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-violet-500/[0.12] blur-3xl" />
                        <div className="pointer-events-none absolute -left-20 bottom-[-160px] h-80 w-80 rounded-full bg-cyan-500/[0.10] blur-3xl" />

                        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                            <div className="max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                                    <BookOpen size={18} />
                                    One platform. Connected workflows.
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Bring your institution's workflows together.
                                </h2>
                                <p className="mt-4 leading-7 text-slate-400">
                                    Explore the modules, identify the workflows that matter
                                    most, and discuss the right setup for your institution.
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                <Link
                                    to="/book-demo"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                                >
                                    Book a demo
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                                >
                                    Contact us
                                    <ArrowUpRight size={16} />
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