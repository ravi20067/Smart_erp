import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
    motion,
    AnimatePresence,
    useReducedMotion,
} from "framer-motion";
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    Check,
    ChevronDown,
    ClipboardCheck,
    GraduationCap,
    Layers3,
    LockKeyhole,
    MessageSquareText,
    Network,
    Play,
    ShieldCheck,
    Sparkles,
    Users,
    Zap,
} from "lucide-react";

import LandingHeader from "../LandingHeader";
import Footer from "../Footer";

export interface ModuleFeature {
    icon: ReactNode;
    title: string;
    description: string;
}

export interface ModuleStep {
    number: string;
    title: string;
    description: string;
}

export interface ModulePageConfig {
    eyebrow: string;
    title: string;
    highlightedTitle: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    icon: ReactNode;
    accent: "cyan" | "violet" | "blue" | "emerald" | "amber" | "pink";
    benefits: string[];
    featuresTitle: string;
    featuresDescription: string;
    features: ModuleFeature[];
    workflowTitle: string;
    workflowDescription: string;
    workflow: ModuleStep[];
    useCases: string[];
    faqs: { question: string; answer: string }[];
}

const accentClasses = {
    cyan: {
        text: "text-cyan-300",
        border: "border-cyan-400/20",
        glow: "from-cyan-500/20 via-blue-500/10 to-transparent",
        icon: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20",
        button:
            "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:shadow-cyan-500/20",
        dot: "bg-cyan-300",
    },
    violet: {
        text: "text-violet-300",
        border: "border-violet-400/20",
        glow: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
        icon: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
        button:
            "bg-gradient-to-r from-violet-400 to-fuchsia-500 text-white hover:shadow-violet-500/20",
        dot: "bg-violet-300",
    },
    blue: {
        text: "text-blue-300",
        border: "border-blue-400/20",
        glow: "from-blue-500/20 via-indigo-500/10 to-transparent",
        icon: "bg-blue-400/10 text-blue-300 ring-blue-400/20",
        button:
            "bg-gradient-to-r from-blue-400 to-indigo-500 text-white hover:shadow-blue-500/20",
        dot: "bg-blue-300",
    },
    emerald: {
        text: "text-emerald-300",
        border: "border-emerald-400/20",
        glow: "from-emerald-500/20 via-cyan-500/10 to-transparent",
        icon: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
        button:
            "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:shadow-emerald-500/20",
        dot: "bg-emerald-300",
    },
    amber: {
        text: "text-amber-300",
        border: "border-amber-400/20",
        glow: "from-amber-500/20 via-orange-500/10 to-transparent",
        icon: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
        button:
            "bg-gradient-to-r from-amber-300 to-orange-500 text-slate-950 hover:shadow-amber-500/20",
        dot: "bg-amber-300",
    },
    pink: {
        text: "text-pink-300",
        border: "border-pink-400/20",
        glow: "from-pink-500/20 via-violet-500/10 to-transparent",
        icon: "bg-pink-400/10 text-pink-300 ring-pink-400/20",
        button:
            "bg-gradient-to-r from-pink-400 to-violet-500 text-white hover:shadow-pink-500/20",
        dot: "bg-pink-300",
    },
};

const defaultFaqs = [
    {
        question: "Can this module work with other Smart ERP modules?",
        answer:
            "The module is designed as part of the wider Smart ERP platform. Its exact integrations depend on the capabilities configured and implemented in your deployment.",
    },
    {
        question: "Can our institution customize the workflow?",
        answer:
            "The module page describes the intended capabilities. Specific workflow customization depends on the final product configuration and implementation.",
    },
    {
        question: "Does this page display live institutional data?",
        answer:
            "No. The visual examples on this page are illustrative marketing previews, not live records or connected dashboard data.",
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
};

function SectionLabel({
    children,
    accent,
}: {
    children: ReactNode;
    accent: keyof typeof accentClasses;
}) {
    return (
        <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full border ${accentClasses[accent].border} bg-white/[0.035] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${accentClasses[accent].text}`}
        >
            <Sparkles size={13} />
            {children}
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
            className={`rounded-2xl border border-white/[0.09] bg-white/[0.035] shadow-[0_16px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

function DashboardPreview({
    config,
}: {
    config: ModulePageConfig;
}) {
    const accent = accentClasses[config.accent];

    return (
        <GlassCard className="relative overflow-hidden p-4 sm:p-5">
            <div
                className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br ${accent.glow} blur-3xl`}
            />

            <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${accent.icon}`}
                    >
                        {config.icon}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">
                            Smart ERP Workspace
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                            {config.eyebrow}
                        </p>
                    </div>
                </div>

                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    UI PREVIEW
                </span>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3">
                {[
                    { label: "Workspace", value: "Organized", icon: Layers3 },
                    { label: "Workflow", value: "Structured", icon: Network },
                    { label: "Visibility", value: "Centralized", icon: BarChart3 },
                    { label: "Access", value: "Role-aware", icon: ShieldCheck },
                ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: index * 0.08,
                                duration: 0.4,
                            }}
                            className="rounded-xl border border-white/[0.08] bg-slate-950/45 p-3 sm:p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-slate-400">{item.label}</span>
                                <Icon size={15} className={accent.text} />
                            </div>
                            <p className="mt-3 text-base font-semibold text-white sm:text-lg">
                                {item.value}
                            </p>
                            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${55 + index * 11}%` }}
                                    transition={{ duration: 0.8, delay: 0.25 + index * 0.08 }}
                                    className={`h-full rounded-full ${accent.dot}`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="relative mt-4 rounded-xl border border-white/[0.08] bg-slate-950/40 p-4">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                        Module capabilities
                    </span>
                    <span className={`text-xs ${accent.text}`}>Overview</span>
                </div>

                <div className="space-y-3">
                    {config.benefits.slice(0, 4).map((benefit, index) => (
                        <motion.div
                            key={benefit}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + index * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${accent.icon}`}
                            >
                                <Check size={13} />
                            </span>
                            <span className="text-xs text-slate-300 sm:text-sm">
                                {benefit}
                            </span>
                            <ArrowUpRight
                                size={14}
                                className="ml-auto shrink-0 text-slate-500"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                <div className={`rounded-lg p-2 ${accent.icon}`}>
                    <LockKeyhole size={16} />
                </div>
                <div>
                    <p className="text-xs font-medium text-white">
                        Designed for institutional workflows
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                        Illustrative interface · No live data
                    </p>
                </div>
            </div>
        </GlassCard>
    );
}

export default function ModuleLandingPage({
    config,
}: {
    config: ModulePageConfig;
}) {
    const reduceMotion = useReducedMotion();
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const accent = accentClasses[config.accent];

    const motionProps = reduceMotion
        ? {}
        : {
            variants: fadeUp,
            initial: "hidden" as const,
            whileInView: "visible" as const,
            viewport: { once: true, amount: 0.15 },
            transition: { duration: 0.55, ease: "easeOut" as const },
        };

    return (
        <div className="min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
            <LandingHeader />

            <main>
                {/* Hero */}
                <section className="relative isolate px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
                    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/[0.10] blur-[130px]" />
                        <div
                            className={`absolute right-[-10%] top-20 h-96 w-96 rounded-full bg-gradient-to-br ${accent.glow} blur-[100px]`}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
                    </div>

                    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
                        <motion.div {...motionProps}>
                            <Link
                                to="/modules"
                                className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                            >
                                <ArrowLeft size={15} />
                                All modules
                            </Link>

                            <div>
                                <SectionLabel accent={config.accent}>
                                    {config.eyebrow}
                                </SectionLabel>
                            </div>

                            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                                {config.title}{" "}
                                <span
                                    className={`bg-gradient-to-r ${accent.glow} bg-clip-text text-transparent`}
                                >
                                    {config.highlightedTitle}
                                </span>
                            </h1>

                            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                                {config.description}
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    to="/book-demo"
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${accent.button}`}
                                >
                                    {config.primaryCta}
                                    <ArrowRight size={16} />
                                </Link>

                                <a
                                    href="#features"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.07]"
                                >
                                    {config.secondaryCta}
                                    <ArrowDown size={15} />
                                </a>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
                                {config.benefits.slice(0, 3).map((benefit) => (
                                    <span
                                        key={benefit}
                                        className="inline-flex items-center gap-2 text-xs text-slate-400 sm:text-sm"
                                    >
                                        <Check size={14} className={accent.text} />
                                        {benefit}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="relative mx-auto w-full max-w-xl"
                        >
                            <div
                                className={`pointer-events-none absolute inset-8 rounded-full bg-gradient-to-br ${accent.glow} blur-3xl`}
                            />
                            <div className="relative">
                                <DashboardPreview config={config} />
                                <motion.div
                                    animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-white/10 bg-[#10182a]/95 p-3 shadow-2xl backdrop-blur-xl sm:flex"
                                >
                                    <div className={`rounded-lg p-2 ${accent.icon}`}>
                                        <Zap size={17} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white">
                                            One connected platform
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Built around your workflows
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features */}
                <section
                    id="features"
                    className="scroll-mt-24 border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
                >
                    <div className="mx-auto max-w-7xl">
                        <motion.div {...motionProps} className="max-w-3xl">
                            <SectionLabel accent={config.accent}>
                                Built for everyday work
                            </SectionLabel>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Everything your team needs,{" "}
                                <span className={accent.text}>in one workspace.</span>
                            </h2>
                            <p className="mt-4 leading-7 text-slate-400">
                                {config.featuresDescription}
                            </p>
                        </motion.div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {config.features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    {...motionProps}
                                    transition={{
                                        duration: 0.45,
                                        delay: reduceMotion ? 0 : index * 0.06,
                                    }}
                                    whileHover={reduceMotion ? undefined : { y: -5 }}
                                >
                                    <GlassCard className="group h-full p-6 transition-colors duration-300 hover:border-white/[0.16] hover:bg-white/[0.055]">
                                        <div
                                            className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${accent.icon}`}
                                        >
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-400">
                                            {feature.description}
                                        </p>
                                        <div
                                            className={`mt-5 h-px w-12 transition-all duration-300 group-hover:w-20 ${accent.dot}`}
                                        />
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Workflow */}
                <section className="border-y border-white/[0.06] bg-white/[0.018] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
                        <motion.div {...motionProps}>
                            <SectionLabel accent={config.accent}>
                                How it fits together
                            </SectionLabel>
                            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                                {config.workflowTitle}
                            </h2>
                            <p className="mt-5 leading-7 text-slate-400">
                                {config.workflowDescription}
                            </p>
                            <Link
                                to="/contact"
                                className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${accent.text} transition hover:gap-3`}
                            >
                                Discuss your requirements
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>

                        <div className="space-y-4">
                            {config.workflow.map((step, index) => (
                                <motion.div
                                    key={step.number}
                                    {...motionProps}
                                    transition={{
                                        duration: 0.45,
                                        delay: reduceMotion ? 0 : index * 0.08,
                                    }}
                                >
                                    <GlassCard className="flex gap-4 p-5 sm:gap-5 sm:p-6">
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${accent.border} bg-white/[0.035] text-sm font-bold ${accent.text}`}
                                        >
                                            {step.number}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">
                                                {step.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-7 text-slate-400">
                                                {step.description}
                                            </p>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Use cases */}
                <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
                        <motion.div {...motionProps}>
                            <SectionLabel accent={config.accent}>
                                Designed for institutions
                            </SectionLabel>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Flexible enough for your{" "}
                                <span className={accent.text}>institution's needs.</span>
                            </h2>
                            <p className="mt-4 leading-7 text-slate-400">
                                Organize responsibilities, make processes easier to follow,
                                and give teams a clearer view of their work.
                            </p>
                        </motion.div>

                        <motion.div
                            {...motionProps}
                            className="grid gap-3 sm:grid-cols-2"
                        >
                            {config.useCases.map((useCase) => (
                                <div
                                    key={useCase}
                                    className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                                >
                                    <span
                                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${accent.icon}`}
                                    >
                                        <Check size={13} />
                                    </span>
                                    <span className="text-sm leading-6 text-slate-300">
                                        {useCase}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
                        <motion.div {...motionProps}>
                            <SectionLabel accent={config.accent}>
                                Common questions
                            </SectionLabel>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Questions about this module
                            </h2>
                            <p className="mt-4 leading-7 text-slate-400">
                                Need to discuss a specific institutional workflow? Our team
                                can help you evaluate the requirements.
                            </p>
                            <Link
                                to="/contact"
                                className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${accent.text}`}
                            >
                                Contact the team
                                <ArrowRight size={15} />
                            </Link>
                        </motion.div>

                        <div className="space-y-3">
                            {config.faqs.map((faq, index) => {
                                const isOpen = openFaq === index;

                                return (
                                    <GlassCard key={faq.question} className="overflow-hidden">
                                        <button
                                            type="button"
                                            aria-expanded={isOpen}
                                            onClick={() =>
                                                setOpenFaq(isOpen ? null : index)
                                            }
                                            className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                                        >
                                            <span className="text-sm font-medium leading-6 text-white sm:text-base">
                                                {faq.question}
                                            </span>
                                            <ChevronDown
                                                size={18}
                                                className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="px-5 pb-5 text-sm leading-7 text-slate-400 sm:px-6 sm:pb-6">
                                                        {faq.answer}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
                    <motion.div
                        {...motionProps}
                        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#10192b] p-7 sm:p-10 lg:p-14"
                    >
                        <div
                            className={`pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-gradient-to-br ${accent.glow} blur-3xl`}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.035),transparent_60%)]" />

                        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                            <div className="max-w-2xl">
                                <div className={`mb-4 ${accent.text}`}>
                                    <Sparkles size={24} />
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Bring more structure to your institution.
                                </h2>
                                <p className="mt-4 max-w-xl leading-7 text-slate-400">
                                    Explore how Smart ERP can support your workflows and fit
                                    into your institution's broader management system.
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                <Link
                                    to="/book-demo"
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${accent.button}`}
                                >
                                    {config.primaryCta}
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                                >
                                    Talk to us
                                    <MessageSquareText size={15} />
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

export { defaultFaqs };