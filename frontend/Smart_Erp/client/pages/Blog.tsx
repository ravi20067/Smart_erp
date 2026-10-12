// src/pages/Blog.tsx

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    Clock3,
    GraduationCap,
    Lightbulb,
    Search,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";
import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

type Resource = {
    id: number;
    category: string;
    title: string;
    description: string;
    readTime: string;
    date: string;
    icon: typeof BookOpen;
    accent: string;
    featured?: boolean;
};

const resources: Resource[] = [
    {
        id: 1,
        category: "Education Technology",
        title: "How a Unified ERP Can Simplify Campus Operations",
        description:
            "Explore how connected academic, administrative, and operational workflows can reduce fragmented processes across an institution.",
        readTime: "6 min read",
        date: "Editor's guide",
        icon: GraduationCap,
        accent: "from-cyan-400/25 to-blue-500/10",
        featured: true,
    },
    {
        id: 2,
        category: "Implementation",
        title: "A Practical Checklist for ERP Implementation",
        description:
            "Plan requirements, map existing processes, prepare data, onboard users, and approach implementation in manageable phases.",
        readTime: "8 min read",
        date: "Implementation guide",
        icon: BookOpen,
        accent: "from-violet-400/25 to-indigo-500/10",
    },
    {
        id: 3,
        category: "AI & Automation",
        title: "Where AI Can Help in Education Administration",
        description:
            "Understand how AI-assisted workflows can support repetitive tasks while keeping people in control of important decisions.",
        readTime: "5 min read",
        date: "Technology guide",
        icon: Sparkles,
        accent: "from-fuchsia-400/20 to-violet-500/10",
    },
    {
        id: 4,
        category: "Cybersecurity",
        title: "Protecting Student Data in Digital Campuses",
        description:
            "Learn the basics of role-based access, least privilege, secure authentication, and responsible handling of student information.",
        readTime: "7 min read",
        date: "Security guide",
        icon: ShieldCheck,
        accent: "from-emerald-400/20 to-cyan-500/10",
    },
    {
        id: 5,
        category: "Product Guides",
        title: "Making Attendance Workflows More Efficient",
        description:
            "Review the building blocks of a reliable attendance workflow, from classroom processes to review and reporting.",
        readTime: "4 min read",
        date: "Product guide",
        icon: CalendarDays,
        accent: "from-blue-400/20 to-indigo-500/10",
    },
    {
        id: 6,
        category: "Education Technology",
        title: "Turning Institutional Data into Useful Insights",
        description:
            "Discover how clear reporting and carefully designed dashboards can help teams understand trends and make informed decisions.",
        readTime: "6 min read",
        date: "Analytics guide",
        icon: Lightbulb,
        accent: "from-amber-400/20 to-orange-500/10",
    },
];

const categories = [
    "All Resources",
    "Education Technology",
    "Implementation",
    "AI & Automation",
    "Cybersecurity",
    "Product Guides",
];

const reveal = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

export default function Blog() {
    const reduceMotion = useReducedMotion();
    const [query, setQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All Resources");

    const filteredResources = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return resources.filter((resource) => {
            const matchesCategory =
                activeCategory === "All Resources" ||
                resource.category === activeCategory;

            const matchesQuery =
                !normalizedQuery ||
                `${resource.title} ${resource.description} ${resource.category}`
                    .toLowerCase()
                    .includes(normalizedQuery);

            return matchesCategory && matchesQuery;
        });
    }, [query, activeCategory]);

    const featuredResource = resources.find((resource) => resource.featured);

    return (
        <div className="min-h-screen overflow-hidden bg-[#070b17] text-slate-100">
            <LandingHeader />

            <main>
                {/* Hero */}
                <section className="relative isolate px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
                    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute left-1/2 top-0 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />
                        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />
                    </div>

                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={reduceMotion ? false : "hidden"}
                            animate="visible"
                            variants={reveal}
                            transition={{ duration: 0.65 }}
                            className="mx-auto max-w-3xl text-center"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-sm font-medium text-cyan-200">
                                <Sparkles size={15} />
                                Smart ERP Resources
                            </span>

                            <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
                                Ideas for a{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                                    smarter campus
                                </span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                                Explore practical guides, education technology insights,
                                implementation advice, AI workflows, and security
                                fundamentals for modern institutions.
                            </p>

                            <div className="mx-auto mt-9 flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-black/20 backdrop-blur-xl focus-within:border-cyan-300/40">
                                <Search className="ml-3 shrink-0 text-slate-500" size={20} />
                                <input
                                    aria-label="Search resources"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search guides, AI, cybersecurity..."
                                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => setQuery("")}
                                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <X size={17} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Featured resource */}
                {featuredResource && (
                    <section className="px-4 pb-14 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            <motion.article
                                initial={reduceMotion ? false : "hidden"}
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                variants={reveal}
                                transition={{ duration: 0.55 }}
                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-9 lg:p-12"
                            >
                                <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-400/[0.08] blur-[90px]" />

                                <div className="relative grid items-center gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
                                    <div>
                                        <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-semibold text-cyan-200">
                                            FEATURED GUIDE
                                        </span>

                                        <p className="mt-6 text-sm font-medium text-slate-400">
                                            {featuredResource.category}
                                        </p>

                                        <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                                            {featuredResource.title}
                                        </h2>

                                        <p className="mt-5 max-w-xl leading-7 text-slate-400">
                                            {featuredResource.description}
                                        </p>

                                        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                                            <Clock3 size={15} />
                                            {featuredResource.readTime}
                                        </div>

                                        <Link
                                            to="/modules"
                                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:shadow-blue-500/20"
                                        >
                                            Explore Smart ERP
                                            <ArrowRight size={17} />
                                        </Link>
                                    </div>

                                    <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.12] via-blue-500/[0.08] to-violet-500/[0.15] p-8 sm:min-h-80">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.12),transparent_65%)]" />
                                        <div className="relative flex h-40 w-40 items-center justify-center rounded-[2rem] border border-cyan-200/20 bg-[#0b1428]/80 shadow-2xl shadow-cyan-950/40 sm:h-48 sm:w-48">
                                            <div className="absolute inset-3 rounded-[1.5rem] border border-white/[0.06]" />
                                            <GraduationCap
                                                size={76}
                                                strokeWidth={1.2}
                                                className="text-cyan-200"
                                            />
                                            <Sparkles
                                                size={23}
                                                className="absolute right-4 top-5 text-violet-300"
                                            />
                                            <span className="absolute -bottom-3 rounded-full border border-white/10 bg-[#111a2d] px-4 py-1.5 text-xs font-medium text-slate-300">
                                                Learn · Improve · Grow
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        </div>
                    </section>
                )}

                {/* Searchable resource library */}
                <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                                    Resource library
                                </p>
                                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                                    Explore the latest insights
                                </h2>
                                <p className="mt-3 max-w-2xl text-slate-400">
                                    Browse topics relevant to your institution and its digital
                                    transformation journey.
                                </p>
                            </div>

                            <span className="text-sm text-slate-500">
                                {filteredResources.length}{" "}
                                {filteredResources.length === 1 ? "resource" : "resources"}
                            </span>
                        </div>

                        <div className="mt-8 flex gap-2 overflow-x-auto pb-3">
                            {categories.map((category) => {
                                const selected = activeCategory === category;

                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => setActiveCategory(category)}
                                        aria-pressed={selected}
                                        className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition ${selected
                                                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                                                : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-white"
                                            }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>

                        {filteredResources.length > 0 ? (
                            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredResources.map((resource, index) => {
                                    const Icon = resource.icon;

                                    return (
                                        <motion.article
                                            key={resource.id}
                                            initial={reduceMotion ? false : "hidden"}
                                            whileInView="visible"
                                            viewport={{ once: true, amount: 0.12 }}
                                            variants={reveal}
                                            transition={{
                                                duration: 0.45,
                                                delay: reduceMotion ? 0 : (index % 3) * 0.08,
                                            }}
                                            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.045]"
                                        >
                                            <div
                                                className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${resource.accent}`}
                                            >
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_65%)]" />
                                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-[#0b1224]/50 shadow-xl backdrop-blur-xl transition duration-300 group-hover:scale-105">
                                                    <Icon
                                                        size={38}
                                                        strokeWidth={1.4}
                                                        className="text-cyan-200"
                                                    />
                                                </div>
                                                <span className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-[#080e1c]/70 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
                                                    {resource.category}
                                                </span>
                                            </div>

                                            <div className="flex flex-1 flex-col p-6">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Clock3 size={14} />
                                                    {resource.readTime}
                                                </div>

                                                <h3 className="mt-4 text-xl font-semibold leading-snug text-white transition group-hover:text-cyan-100">
                                                    {resource.title}
                                                </h3>

                                                <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                                                    {resource.description}
                                                </p>

                                                <div className="mt-6 border-t border-white/[0.08] pt-4">
                                                    <Link
                                                        to="/contact"
                                                        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
                                                    >
                                                        Discuss this topic
                                                        <ArrowUpRight
                                                            size={16}
                                                            className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                                        />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-16 text-center">
                                <Search className="mx-auto text-slate-500" size={32} />
                                <h3 className="mt-4 text-lg font-semibold">
                                    No matching resources
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Try a different search term or select another category.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery("");
                                        setActiveCategory("All Resources");
                                    }}
                                    className="mt-5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-cyan-200 transition hover:bg-white/5"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA */}
                <section className="px-4 pb-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-r from-cyan-500/[0.09] via-blue-500/[0.08] to-violet-500/[0.1] p-8 sm:p-12 lg:p-14">
                        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
                            <div className="max-w-2xl">
                                <span className="text-sm font-semibold text-cyan-300">
                                    YOUR INSTITUTION, YOUR WORKFLOW
                                </span>
                                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                                    Have a question about Smart ERP?
                                </h2>
                                <p className="mt-4 leading-7 text-slate-400">
                                    Talk to us about your institution's needs, modules, and
                                    implementation questions.
                                </p>
                            </div>

                            <Link
                                to="/contact"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-semibold text-[#0a1020] transition hover:-translate-y-0.5 hover:bg-cyan-50"
                            >
                                Contact our team
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}