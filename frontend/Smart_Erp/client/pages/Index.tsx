import { useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

const modules: {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href: string;
}[] = [
    {
      title: "Academic Administration",
      description:
        "Organize academic years, courses, classes, sections, and subjects in a connected structure.",
      icon: GraduationCap,
      color: "cyan",
      href: "/modules/academic-administration",
    },
    {
      title: "Student Management",
      description:
        "Bring student information and academic relationships into a structured workflow.",
      icon: Users,
      color: "violet",
      href: "/modules/student-management",
    },
    {
      title: "Attendance",
      description:
        "Explore session-based attendance and authentication workflows.",
      icon: ClipboardCheck,
      color: "emerald",
      href: "/modules/attendance",
    },
    {
      title: "Learning Resources",
      description:
        "Organize subjects, chapters, learning units, and associated materials.",
      icon: BookOpen,
      color: "blue",
      href: "/modules/learning-resources",
    },
    {
      title: "Timetable & Scheduling",
      description:
        "Coordinate academic schedules, classes, and teaching requirements.",
      icon: CalendarDays,
      color: "orange",
      href: "/modules/timetable",
    },
    {
      title: "Reports & Analytics",
      description:
        "Explore reporting workflows and opportunities for data-informed decisions.",
      icon: BarChart3,
      color: "pink",
      href: "/modules/analytics",
    },
  ];

const colorClasses: Record<string, string> = {
  cyan: "bg-cyan-400/10 text-cyan-300 border-cyan-300/15",
  violet: "bg-violet-400/10 text-violet-300 border-violet-300/15",
  emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-300/15",
  blue: "bg-blue-400/10 text-blue-300 border-blue-300/15",
  orange: "bg-orange-400/10 text-orange-300 border-orange-300/15",
  pink: "bg-pink-400/10 text-pink-300 border-pink-300/15",
};

const faqs = [
  {
    question: "What is Smart ERP?",
    answer:
      "Smart ERP is an educational ERP platform concept designed to connect academic administration, institutional workflows, learning resources, reporting, permissions, and AI-assisted capabilities.",
  },
  {
    question: "Who is Smart ERP designed for?",
    answer:
      "The platform is intended for educational institutions, including schools and colleges. Specific workflows and configurations depend on institutional requirements and the capabilities implemented for each deployment.",
  },
  {
    question: "Can an institution use selected modules?",
    answer:
      "The product direction supports modular, institution-oriented configuration. The exact module selection and availability should be confirmed for the relevant deployment.",
  },
  {
    question: "How does AI fit into Smart ERP?",
    answer:
      "The AI vision includes natural-language assistance, academic analysis, report preparation, model routing, and workflow automation. Actual availability depends on configured models, permissions, and implemented integrations.",
  },
  {
    question: "Are all features available right now?",
    answer:
      "Not necessarily. The home page describes the product direction and capability areas. Each module should be marked Available, In Development, or Planned according to its verified implementation status.",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
      <Sparkles size={14} />
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  center?: boolean;
}) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300 sm:text-sm">
        {eyebrow}
      </p>

      <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
        {accent && (
          <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            {accent}
          </span>
        )}
      </h2>

      <p className="mt-5 text-base leading-8 text-slate-400 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

/**
 * Illustrative dashboard preview.
 * Replace the preview values with real application data only if
 * you intentionally connect this component to existing API data.
 */
function DashboardPreview({
  reduceMotion,
}: {
  reduceMotion: boolean;
}) {
  const [activeTab, setActiveTab] = useState("Overview");

  const stats = [
    {
      title: "Academic structure",
      value: "Connected",
      detail: "Courses · Classes · Sections",
      icon: Layers3,
      color: "text-cyan-300",
    },
    {
      title: "Learning workflows",
      value: "Organized",
      detail: "Subjects · Chapters · Materials",
      icon: BookOpen,
      color: "text-violet-300",
    },
    {
      title: "Access control",
      value: "Permission-aware",
      detail: "Users · Roles · Resources",
      icon: ShieldCheck,
      color: "text-emerald-300",
    },
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 35, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.15 }}
      className="relative mx-auto w-full max-w-6xl"
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 blur-2xl sm:-inset-7" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0a1020]/95 shadow-2xl shadow-black/40 sm:rounded-3xl">
        {/* Window top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.025] px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
              <GraduationCap size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Smart ERP
              </p>
              <p className="text-[11px] text-slate-500">
                Institutional workspace preview
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span className="text-xs text-emerald-200">
              Illustrative interface
            </span>
          </div>
        </div>

        <div className="grid min-h-[430px] md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)]">
          {/* Preview sidebar */}
          <aside className="hidden border-r border-white/[0.07] bg-[#080d1a] p-4 md:block">
            <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Workspace
            </p>

            {[
              { label: "Overview", icon: Layers3 },
              { label: "Academics", icon: GraduationCap },
              { label: "Attendance", icon: ClipboardCheck },
              { label: "Learning", icon: BookOpen },
              { label: "Analytics", icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.label;

              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${selected
                    ? "border border-cyan-300/10 bg-cyan-300/[0.09] text-cyan-200"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}

            <div className="mt-8 rounded-xl border border-violet-300/10 bg-violet-300/[0.04] p-3">
              <BrainCircuit size={19} className="text-violet-300" />
              <p className="mt-3 text-xs font-semibold text-white">
                AI assistance
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Conceptual integration preview
              </p>
            </div>
          </aside>

          {/* Preview main panel */}
          <div className="min-w-0 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  Workspace / {activeTab}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  Your institution, connected.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  A preview of the Smart ERP design direction.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300">
                <Bell size={18} />
              </div>
            </div>

            {/* Illustrative stat cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.title}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 12 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.4,
                      delay: reduceMotion ? 0 : 0.25 + index * 0.08,
                    }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition duration-300 hover:border-white/15 hover:bg-white/[0.045]"
                  >
                    <Icon size={19} className={stat.color} />
                    <p className="mt-4 text-xs text-slate-500">
                      {stat.title}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-white">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-[10px] leading-5 text-slate-500">
                      {stat.detail}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Illustrative workflow */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Connected academic workflow
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Conceptual relationship overview
                    </p>
                  </div>
                  <Workflow size={19} className="text-cyan-300" />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {["Course", "Section", "Class", "Subject"].map(
                    (label, index) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-2 text-xs text-cyan-100">
                          {label}
                        </span>
                        {index < 3 && (
                          <ArrowRight
                            size={13}
                            className="text-slate-600"
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{
                      duration: reduceMotion ? 0 : 1.1,
                      delay: reduceMotion ? 0 : 0.35,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
                  />
                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-500">
                  Illustration only — not a live data visualization or a
                  claim of completed setup.
                </p>
              </div>

              <div className="rounded-xl border border-violet-300/10 bg-gradient-to-br from-violet-300/[0.07] to-cyan-300/[0.025] p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={19} className="text-violet-300" />
                  <h4 className="text-sm font-semibold text-white">
                    AI-ready vision
                  </h4>
                </div>

                <p className="mt-3 text-xs leading-6 text-slate-400">
                  A conceptual view of how an AI gateway, authorization
                  layer, and selected language models could work together.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["Assist", "Analyze", "Automate"].map((label) => (
                    <span
                      key={label}
                      className="rounded-lg border border-violet-300/15 bg-violet-300/[0.06] px-2.5 py-1.5 text-[11px] text-violet-200"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="relative mt-4 text-center text-xs leading-5 text-slate-500">
        Product preview for design illustration. Values and diagrams are
        not live institutional data.
      </p>
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const revealProps = reduceMotion
    ? {}
    : {
      initial: "hidden" as const,
      whileInView: "visible" as const,
      viewport: { once: true, amount: 0.15 },
      variants: reveal,
      transition: { duration: 0.6, ease: "easeOut" as const },
    };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050816] text-slate-100 selection:bg-cyan-300/30">
      <LandingHeader />

      <main>
        {/* Ambient background lights */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
        >
          <div className="absolute -left-48 top-20 h-[32rem] w-[32rem] rounded-full bg-cyan-500/[0.09] blur-[130px]" />
          <div className="absolute -right-48 top-[36rem] h-[35rem] w-[35rem] rounded-full bg-violet-600/[0.10] blur-[140px]" />
          <div className="absolute left-1/3 top-[90rem] h-[28rem] w-[28rem] rounded-full bg-blue-500/[0.06] blur-[130px]" />
        </div>

        {/* 1. HERO */}
        <section className="relative z-10 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              {...revealProps}
              className="mx-auto max-w-5xl text-center"
            >
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-xs font-semibold text-cyan-200 sm:text-sm">
                <span className="relative flex h-2 w-2">
                  {!reduceMotion && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-50" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                </span>
                SMART ERP · CONNECTED INSTITUTION MANAGEMENT
                <ArrowUpRight size={14} />
              </div>

              <h1 className="text-balance text-4xl font-bold leading-[1.12] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.3rem]">
                One Intelligent Platform.
                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Your Entire Institution.
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg lg:text-xl lg:leading-9">
                Connect academic administration, learning workflows,
                institutional insights, and AI-assisted operations in one
                thoughtfully designed ERP ecosystem.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/book-demo"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3 font-semibold text-[#06101d] shadow-lg shadow-cyan-500/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
                >
                  Book a Demo
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  to="/features"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3 font-semibold text-slate-200 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Explore Features
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <Check size={15} className="text-cyan-300" />
                  Modular product direction
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-700 sm:block" />
                <span className="inline-flex items-center gap-2">
                  <Check size={15} className="text-cyan-300" />
                  AI-assisted workflows
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-700 sm:block" />
                <span className="inline-flex items-center gap-2">
                  <Check size={15} className="text-cyan-300" />
                  Permission-aware design
                </span>
              </div>
            </motion.div>

            {/* 2. PRODUCT PREVIEW */}
            <div className="mt-14 sm:mt-20 lg:mt-24">
              <DashboardPreview reduceMotion={Boolean(reduceMotion)} />
            </div>

            <div className="mt-12 flex justify-center">
              <a
                href="#capabilities"
                className="group inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:text-sm"
              >
                Discover the platform
                <ArrowDown
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-y-1"
                />
              </a>
            </div>
          </div>
        </section>

        {/* 3. PRODUCT CAPABILITIES */}
        <section
          id="capabilities"
          className="relative z-10 scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps} className="mb-12">
              <SectionHeading
                eyebrow="The connected ecosystem"
                title="The essential building blocks."
                accent="One institutional vision."
                description="Bring academic structures, people, teaching workflows, institutional information, and responsible AI into a connected product experience."
              />
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Layers3,
                  title: "Connected administration",
                  description:
                    "Structure courses, academic years, classes, sections, and subjects.",
                  color: "text-cyan-300",
                },
                {
                  icon: Users,
                  title: "People & responsibilities",
                  description:
                    "Connect student and teacher records with their academic context.",
                  color: "text-violet-300",
                },
                {
                  icon: Workflow,
                  title: "Coordinated workflows",
                  description:
                    "Bring related institutional activities into a clearer workflow.",
                  color: "text-blue-300",
                },
                {
                  icon: BrainCircuit,
                  title: "AI-assisted direction",
                  description:
                    "Explore assistance, analysis, and automation where appropriate.",
                  color: "text-emerald-300",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 20 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : index * 0.08,
                    }}
                    className="group rounded-2xl border border-white/[0.085] bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.045] sm:p-6"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] ${item.color} transition duration-300 group-hover:scale-105`}
                    >
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-6 text-lg font-semibold text-white">
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

        {/* 4. CORE MODULES */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              {...revealProps}
              className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
              <SectionHeading
                eyebrow="Explore the modules"
                title="Built around the way"
                accent="institutions operate."
                description="Discover the major academic and administrative capability areas in the Smart ERP ecosystem."
              />

              <Link
                to="/modules"
                className="group inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:self-auto"
              >
                View all modules
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 24 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.12 }}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : (index % 3) * 0.08,
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.085] bg-[#0b1020]/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/[0.17] hover:shadow-xl hover:shadow-black/20"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colorClasses[item.color]} transition duration-300 group-hover:scale-105`}
                    >
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 min-h-[72px] text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>

                    <Link
                      to={item.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition duration-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      Explore module
                      <ArrowUpRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </Link>

                    <div className="pointer-events-none absolute -bottom-16 -right-12 h-32 w-32 rounded-full bg-cyan-400/[0.035] blur-3xl transition duration-500 group-hover:bg-cyan-400/[0.09]" />
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. AI AND AUTOMATION */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              {...revealProps}
              className="relative overflow-hidden rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-[#11132b] via-[#0a1122] to-[#07101b] p-6 sm:p-10 lg:p-14"
            >
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-500/15 blur-[110px]" />
              <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

              <div className="relative grid items-center gap-12 lg:grid-cols-2">
                <div>
                  <SectionLabel>Intelligence layer</SectionLabel>

                  <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                    Make room for
                    <span className="mt-2 block bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                      more intelligent work.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-xl leading-8 text-slate-400">
                    Explore an AI-enabled approach to institutional
                    assistance, natural-language questions, academic analysis,
                    report preparation, and rule-based workflow automation.
                  </p>

                  <div className="mt-7 space-y-4">
                    {[
                      "Module-specific AI assistance",
                      "AI-assisted academic analysis",
                      "Report preparation opportunities",
                      "Configurable model-routing architecture",
                      "Permission-aware access concepts",
                    ].map((text) => (
                      <div
                        key={text}
                        className="flex items-start gap-3 text-sm text-slate-300"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-300/10 text-violet-200">
                          <Check size={13} />
                        </span>
                        {text}
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/ai-automation"
                    className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-400 to-blue-400 px-5 py-3 font-semibold text-[#0a0b1b] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                  >
                    Explore AI & Automation
                    <ArrowUpRight
                      size={18}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>

                {/* AI architecture illustration */}
                <div className="relative mx-auto w-full max-w-lg">
                  <div className="absolute inset-8 rounded-full bg-violet-500/10 blur-3xl" />

                  <div className="relative space-y-3">
                    {[
                      {
                        icon: GraduationCap,
                        title: "Smart ERP",
                        detail: "Institutional workflows",
                        color: "cyan",
                      },
                      {
                        icon: LockKeyhole,
                        title: "Authorization layer",
                        detail: "Access-aware processing concept",
                        color: "blue",
                      },
                      {
                        icon: BrainCircuit,
                        title: "AI gateway & model router",
                        detail: "Task-oriented model selection",
                        color: "violet",
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.title}>
                          <motion.div
                            initial={
                              reduceMotion
                                ? false
                                : { opacity: 0, x: 18 }
                            }
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.45,
                              delay: reduceMotion ? 0 : index * 0.12,
                            }}
                            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0c1325]/90 p-4 shadow-lg shadow-black/10 sm:p-5"
                          >
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color === "cyan"
                                ? "bg-cyan-300/10 text-cyan-300"
                                : item.color === "blue"
                                  ? "bg-blue-300/10 text-blue-300"
                                  : "bg-violet-300/10 text-violet-300"
                                }`}
                            >
                              <Icon size={22} />
                            </div>

                            <div>
                              <h3 className="font-semibold text-white">
                                {item.title}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.detail}
                              </p>
                            </div>
                          </motion.div>

                          {index < 2 && (
                            <div className="flex h-8 items-center justify-center">
                              <div className="h-full w-px bg-gradient-to-b from-white/15 to-cyan-300/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-center">
                        <Zap
                          size={20}
                          className="mx-auto text-cyan-300"
                        />
                        <p className="mt-2 text-sm font-semibold text-white">
                          Cloud models
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          When configured
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-center">
                        <BrainCircuit
                          size={20}
                          className="mx-auto text-violet-300"
                        />
                        <p className="mt-2 text-sm font-semibold text-white">
                          Local models
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          When configured
                        </p>
                      </div>
                    </div>

                    <p className="pt-2 text-center text-xs leading-5 text-slate-500">
                      Conceptual architecture. Actual capabilities depend
                      on configured and verified integrations.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6. ACADEMIC WORKFLOW */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div {...revealProps}>
              <SectionLabel>Connected academic workflows</SectionLabel>

              <SectionHeading
                eyebrow="From structure to learning"
                title="Make academic relationships"
                accent="easier to understand."
                description="Connect the concepts that shape an institution — from academic years and courses to sections, subjects, chapters, and learning resources."
              />

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "Organize academic structures",
                    text: "Create a clearer relationship between courses, classes, sections, and subjects.",
                  },
                  {
                    title: "Connect learning resources",
                    text: "Associate subjects with chapters, learning units, and relevant materials.",
                  },
                  {
                    title: "Support coordinated operations",
                    text: "Give related academic workflows a consistent structure to build upon.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={
                      reduceMotion ? false : { opacity: 0, x: -12 }
                    }
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: reduceMotion ? 0 : index * 0.08,
                    }}
                    className="flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition duration-300 hover:border-cyan-300/15 hover:bg-white/[0.035]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
                      <Check size={17} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link
                to="/features"
                className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Discover all features
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            {/* Relationship visualization */}
            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.97 }
              }
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.07] blur-2xl" />

              <div className="relative rounded-3xl border border-white/10 bg-[#0a1020]/95 p-5 shadow-2xl shadow-black/25 sm:p-7">
                <div className="mb-7 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Academic structure
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      Connected by design
                    </h3>
                  </div>
                  <Layers3 size={22} className="text-cyan-300" />
                </div>

                <div className="mx-auto max-w-sm space-y-3">
                  {[
                    {
                      title: "Academic Year",
                      detail: "Institutional time structure",
                      icon: CalendarDays,
                      color: "cyan",
                    },
                    {
                      title: "Course",
                      detail: "Academic program",
                      icon: GraduationCap,
                      color: "blue",
                    },
                    {
                      title: "Section & Class",
                      detail: "Organized teaching groups",
                      icon: Users,
                      color: "violet",
                    },
                    {
                      title: "Subject & Learning Material",
                      detail: "Teaching and learning structure",
                      icon: BookOpen,
                      color: "emerald",
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title}>
                        <motion.div
                          initial={
                            reduceMotion
                              ? false
                              : { opacity: 0, y: 10 }
                          }
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.35,
                            delay: reduceMotion ? 0 : index * 0.08,
                          }}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 sm:p-4"
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.color === "cyan"
                              ? "bg-cyan-300/10 text-cyan-300"
                              : item.color === "blue"
                                ? "bg-blue-300/10 text-blue-300"
                                : item.color === "violet"
                                  ? "bg-violet-300/10 text-violet-300"
                                  : "bg-emerald-300/10 text-emerald-300"
                              }`}
                          >
                            <Icon size={20} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-white">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.detail}
                            </p>
                          </div>
                        </motion.div>

                        {index < 3 && (
                          <div className="flex h-5 justify-center">
                            <div className="w-px bg-gradient-to-b from-cyan-300/30 to-violet-300/20" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                  Conceptual relationship view based on the Smart ERP
                  academic structure.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 7. SECURITY */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <motion.div
              {...revealProps}
              className="grid gap-8 overflow-hidden rounded-3xl border border-emerald-300/10 bg-gradient-to-br from-[#0b1b1b] via-[#09131d] to-[#0a1020] p-6 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:p-12"
            >
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-300">
                  <ShieldCheck size={27} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Security-conscious design
                </p>

                <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Access should follow
                  <span className="block text-emerald-200">
                    responsibility.
                  </span>
                </h2>

                <p className="mt-5 leading-8 text-slate-400">
                  Build institutional workflows around identity, roles,
                  permissions, and the resources each user is allowed to
                  access. Security behavior remains governed by your
                  verified backend authorization rules.
                </p>

                <Link
                  to="/modules/permissions-security"
                  className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Explore permissions
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: LockKeyhole,
                    title: "Role-aware access",
                    text: "Organize user access around defined responsibilities.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Resource permissions",
                    text: "Consider access at the resource level where supported.",
                  },
                  {
                    icon: Users,
                    title: "Identity context",
                    text: "Keep user identity connected to relevant workflows.",
                  },
                  {
                    icon: ClipboardCheck,
                    title: "Accountability",
                    text: "Support clear operational responsibility and review.",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.title}
                      initial={
                        reduceMotion ? false : { opacity: 0, y: 12 }
                      }
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: reduceMotion ? 0 : index * 0.08,
                      }}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition duration-300 hover:border-emerald-300/20 hover:bg-white/[0.04]"
                    >
                      <Icon size={21} className="text-emerald-300" />
                      <h3 className="mt-4 text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-6 text-slate-400">
                        {item.text}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 8. HOW IT WORKS */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps} className="mb-14">
              <SectionHeading
                eyebrow="A connected approach"
                title="From daily operations"
                accent="to informed decisions."
                description="A simple way to understand the intended product flow — without assuming that every workflow or integration is already deployed."
                center
              />
            </motion.div>

            <div className="relative grid gap-5 md:grid-cols-3">
              <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-cyan-300/20 via-blue-300/30 to-violet-300/20 md:block" />

              {[
                {
                  number: "01",
                  icon: Layers3,
                  title: "Structure",
                  description:
                    "Organize academic records, institutional relationships, and module configurations.",
                  color: "cyan",
                },
                {
                  number: "02",
                  icon: Workflow,
                  title: "Coordinate",
                  description:
                    "Connect relevant workflows and make responsibilities easier to follow.",
                  color: "blue",
                },
                {
                  number: "03",
                  icon: BarChart3,
                  title: "Understand",
                  description:
                    "Use available reports and appropriately configured intelligence tools to support decisions.",
                  color: "violet",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.number}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 22 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : index * 0.1,
                    }}
                    className="relative rounded-2xl border border-white/[0.08] bg-[#0a1020]/85 p-6 sm:p-7"
                  >
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0b1325] text-cyan-200">
                      <Icon size={23} />
                    </div>

                    <p className="mt-7 text-xs font-semibold tracking-[0.2em] text-slate-600">
                      STEP {item.number}
                    </p>

                    <h3 className="mt-2 text-xl font-semibold text-white">
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

        {/* 9. SOLUTIONS */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              {...revealProps}
              className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
              <SectionHeading
                eyebrow="Designed for education"
                title="Different institutions."
                accent="Connected possibilities."
                description="Explore how an adaptable ERP approach can align with the organizational structure and workflows of different educational institutions."
              />

              <Link
                to="/solutions"
                className="group inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:self-auto"
              >
                Explore solutions
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  title: "Schools",
                  description:
                    "Explore organized academic records, classroom workflows, attendance, and learning resources.",
                  tags: ["Academic structure", "Attendance", "Learning"],
                  accent: "cyan",
                },
                {
                  icon: GraduationCap,
                  title: "Colleges",
                  description:
                    "Explore course-oriented structures, subjects, faculty relationships, and connected academic administration.",
                  tags: ["Courses", "Faculty", "Subjects"],
                  accent: "violet",
                },
                {
                  icon: Layers3,
                  title: "Larger institutions",
                  description:
                    "Explore how modular configuration can help represent more complex academic structures and responsibilities.",
                  tags: ["Configuration", "Permissions", "Workflows"],
                  accent: "blue",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 20 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : index * 0.08,
                    }}
                    className="group rounded-2xl border border-white/[0.085] bg-gradient-to-br from-white/[0.045] to-transparent p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15 sm:p-7"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] ${item.accent === "cyan"
                        ? "bg-cyan-300/10 text-cyan-300"
                        : item.accent === "violet"
                          ? "bg-violet-300/10 text-violet-300"
                          : "bg-blue-300/10 text-blue-300"
                        }`}
                    >
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 10. FAQ */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <motion.div {...revealProps}>
              <SectionLabel>Frequently asked questions</SectionLabel>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Questions before
                <span className="mt-1 block text-slate-400">
                  getting started?
                </span>
              </h2>

              <p className="mt-5 max-w-md leading-8 text-slate-400">
                Learn more about the Smart ERP product direction, modules,
                AI opportunities, and institution-oriented configuration.
              </p>

              <Link
                to="/contact"
                className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Contact our team
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                const answerId = `home-faq-${index}`;

                return (
                  <motion.div
                    key={faq.question}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 12 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.35,
                      delay: reduceMotion ? 0 : index * 0.05,
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
                      onClick={() =>
                        setOpenFaq(isOpen ? null : index)
                      }
                      className="flex w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:p-6"
                    >
                      <span className="text-sm font-semibold leading-6 text-slate-100 sm:text-base">
                        {faq.question}
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
                            reduceMotion
                              ? false
                              : { height: 0, opacity: 0 }
                          }
                          animate={{ height: "auto", opacity: 1 }}
                          exit={
                            reduceMotion
                              ? undefined
                              : { height: 0, opacity: 0 }
                          }
                          transition={{
                            duration: reduceMotion ? 0 : 0.25,
                          }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-sm leading-7 text-slate-400 sm:px-6 sm:pb-6">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11. FINAL CTA */}
        <section className="relative z-10 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-32">
          <motion.div
            {...revealProps}
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#0b1324] px-6 py-12 text-center shadow-2xl shadow-black/20 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
          >
            <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-violet-500/15 blur-[110px]" />

            <div className="relative mx-auto max-w-3xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                <Sparkles size={26} />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300 sm:text-sm">
                Your institution. One connected vision.
              </p>

              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to explore
                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Smart ERP?
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-400">
                Start a conversation about your institution's workflows,
                explore relevant modules, and understand the capabilities
                that fit your requirements.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/book-demo"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3 font-semibold text-[#06101d] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1324]"
                >
                  Book a Demo
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3 font-semibold text-slate-200 transition duration-300 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Talk to Us
                  <MessageSquareText size={17} />
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