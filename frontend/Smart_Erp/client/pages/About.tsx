import { useState, type ReactNode } from "react";
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
  BookOpen,
  BrainCircuit,
  Building2,
  Check,
  ChevronDown,
  Compass,
  Fingerprint,
  GraduationCap,
  HeartHandshake,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Network,
  Puzzle,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

const principles = [
  {
    number: "01",
    title: "Connected, not fragmented",
    description:
      "Academic structures, institutional information, and related workflows should work together rather than exist as disconnected processes.",
    icon: Network,
    color: "cyan",
  },
  {
    number: "02",
    title: "Built around real workflows",
    description:
      "Product decisions should reflect the practical needs of administrators, teachers, students, and institutional leadership.",
    icon: Workflow,
    color: "violet",
  },
  {
    number: "03",
    title: "Flexible by design",
    description:
      "Different institutions have different structures. The product direction emphasizes configurable modules and adaptable academic relationships.",
    icon: Puzzle,
    color: "blue",
  },
  {
    number: "04",
    title: "Intelligence with responsibility",
    description:
      "AI should assist people while respecting permissions, institutional context, and the importance of human oversight.",
    icon: BrainCircuit,
    color: "emerald",
  },
];

const challenges = [
  {
    icon: Layers3,
    title: "Fragmented information",
    description:
      "Academic structures and institutional records can become difficult to coordinate when workflows are disconnected.",
    color: "cyan",
  },
  {
    icon: Workflow,
    title: "Repetitive processes",
    description:
      "Routine institutional activities can consume time that could otherwise be spent on teaching, coordination, and planning.",
    color: "violet",
  },
  {
    icon: BarChartIcon,
    title: "Limited operational visibility",
    description:
      "Decision-makers need organized information and meaningful reporting to better understand institutional activities.",
    color: "blue",
  },
];

const architecture = [
  {
    step: "01",
    title: "Institutional workflows",
    description: "Academic records, modules, and related activities.",
    icon: Building2,
    color: "cyan",
  },
  {
    step: "02",
    title: "Authorization",
    description: "Identity, roles, permissions, and resource access.",
    icon: Fingerprint,
    color: "blue",
  },
  {
    step: "03",
    title: "AI integration layer",
    description: "A conceptual gateway for task-oriented AI assistance.",
    icon: BrainCircuit,
    color: "violet",
  },
  {
    step: "04",
    title: "Configured AI models",
    description: "Cloud or local models, when configured and supported.",
    icon: Network,
    color: "emerald",
  },
];

const aboutFaqs = [
  {
    question: "What is the main purpose of Smart ERP?",
    answer:
      "Smart ERP aims to bring academic administration, institutional workflows, learning resources, reporting, access control, and AI-assisted capabilities into a connected educational ERP ecosystem.",
  },
  {
    question: "Which institutions is Smart ERP intended for?",
    answer:
      "The product direction focuses on educational institutions, particularly schools and colleges. Larger institutions may also be relevant depending on their requirements and the capabilities available in a specific deployment.",
  },
  {
    question: "How is AI intended to be used?",
    answer:
      "The AI direction includes natural-language assistance, academic analysis, report preparation, workflow automation, and model routing. The availability of each capability depends on implemented integrations and configuration.",
  },
  {
    question: "Can Smart ERP adapt to different institutions?",
    answer:
      "The product philosophy emphasizes modularity and configurable academic structures. Exact customization options and module availability should be confirmed for the relevant deployment.",
  },
  {
    question: "Is every capability on this page already available?",
    answer:
      "No such assumption should be made. This page explains the product vision and design principles. Specific release status must be established from verified implementation information.",
  },
];

const iconColor: Record<string, string> = {
  cyan: "border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-300",
  violet: "border-violet-300/15 bg-violet-300/[0.08] text-violet-300",
  blue: "border-blue-300/15 bg-blue-300/[0.08] text-blue-300",
  emerald:
    "border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300",
};

const revealVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.055] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-200">
      <Sparkles size={14} />
      {children}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  gradient,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  gradient?: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={`${centered ? "mx-auto text-center" : ""} max-w-3xl`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.23em] text-cyan-300 sm:text-sm">
        {eyebrow}
      </p>

      <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
        {gradient && (
          <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            {gradient}
          </span>
        )}
      </h2>

      <p className="mt-5 text-base leading-8 text-slate-400 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function BarChartIcon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M8 15v3" />
      <path d="M13 10v8" />
      <path d="M18 5v13" />
    </svg>
  );
}

export default function About() {
  const reduceMotion = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const revealProps = reduceMotion
    ? {}
    : {
      initial: "hidden" as const,
      whileInView: "visible" as const,
      viewport: { once: true, amount: 0.15 },
      variants: revealVariants,
      transition: {
        duration: 0.55,
        ease: "easeOut" as const,
      },
    };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050816] text-slate-100 selection:bg-cyan-300/30">
      <LandingHeader />

      <main>
        {/* Ambient glassmorphism background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
        >
          <div className="absolute -left-48 top-24 h-[32rem] w-[32rem] rounded-full bg-cyan-500/[0.075] blur-[135px]" />
          <div className="absolute -right-48 top-[40rem] h-[34rem] w-[34rem] rounded-full bg-violet-600/[0.09] blur-[140px]" />
          <div className="absolute left-1/4 top-[95rem] h-[30rem] w-[30rem] rounded-full bg-blue-500/[0.06] blur-[130px]" />
        </div>

        {/* 1. ABOUT HERO */}
        <section className="relative z-10 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <motion.div {...revealProps}>
              <SectionEyebrow>About Smart ERP</SectionEyebrow>

              <h1 className="text-balance text-4xl font-bold leading-[1.12] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Education deserves
                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  connected thinking.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                Smart ERP is being shaped around a simple idea: institutional
                management should feel connected, academic workflows should
                be easier to coordinate, and technology should help people
                focus on meaningful work.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Our product direction brings educational administration,
                structured academic information, responsible access control,
                and AI-assisted possibilities into one cohesive ecosystem.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/features"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-3 font-semibold text-[#06101d] shadow-lg shadow-cyan-500/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
                >
                  Explore our features
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3 font-semibold text-slate-200 transition duration-300 hover:border-cyan-300/25 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Talk to us
                  <ArrowRight size={17} />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-500 sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <Check size={15} className="text-cyan-300" />
                  Connected workflows
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check size={15} className="text-cyan-300" />
                  Modular thinking
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check size={15} className="text-cyan-300" />
                  Responsible AI direction
                </span>
              </div>
            </motion.div>

            {/* Abstract product vision visual */}
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, x: 25, scale: 0.97 }
              }
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.7,
                delay: 0.1,
              }}
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-cyan-500/10 via-blue-500/[0.05] to-violet-500/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-[#0a1020]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950">
                      <GraduationCap size={23} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Smart ERP</p>
                      <p className="mt-1 text-xs text-slate-500">
                        One connected ecosystem
                      </p>
                    </div>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-cyan-300">
                    <Sparkles size={17} />
                  </div>
                </div>

                <div className="py-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Our product philosophy
                  </p>
                  <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                    Connect the pieces.
                    <span className="block text-cyan-300">
                      Simplify the picture.
                    </span>
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    A conceptual view of how academic management, workflows,
                    permissions, and intelligence can fit together.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      title: "Academic administration",
                      detail: "Courses · Classes · Subjects",
                      icon: Layers3,
                      color: "cyan",
                    },
                    {
                      title: "Connected operations",
                      detail: "People · Activities · Workflows",
                      icon: Workflow,
                      color: "blue",
                    },
                    {
                      title: "Intelligence & access",
                      detail: "AI assistance · Permissions",
                      icon: BrainCircuit,
                      color: "violet",
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        initial={
                          reduceMotion
                            ? false
                            : { opacity: 0, x: 12 }
                        }
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.4,
                          delay: reduceMotion ? 0 : 0.25 + index * 0.1,
                        }}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 transition duration-300 hover:border-white/[0.16] hover:bg-white/[0.045] sm:p-4"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconColor[item.color]}`}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.detail}
                          </p>
                        </div>

                        <ArrowUpRight
                          size={16}
                          className="ml-auto shrink-0 text-slate-600"
                        />
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3.5">
                  <p className="text-xs leading-6 text-slate-400">
                    Product vision illustration — this graphic does not
                    represent live data or confirm the availability of
                    individual capabilities.
                  </p>
                </div>
              </div>

              {!reduceMotion && (
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -right-2 top-12 hidden rounded-2xl border border-violet-300/20 bg-[#13152c]/95 p-3 shadow-xl shadow-black/30 sm:block lg:-right-5"
                >
                  <BrainCircuit
                    size={21}
                    className="text-violet-300"
                  />
                  <p className="mt-2 text-xs font-semibold text-white">
                    Intelligence
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Designed to assist
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* 2. THE PROBLEM WE WANT TO ADDRESS */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps} className="mb-12">
              <SectionTitle
                eyebrow="Why this matters"
                title="Institutional complexity"
                gradient="shouldn't create unnecessary friction."
                description="Educational institutions manage interconnected responsibilities. Smart ERP's product direction focuses on making those relationships easier to organize and understand."
              />
            </motion.div>

            <div className="grid gap-4 md:grid-cols-3">
              {challenges.map((item, index) => {
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
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.085] bg-gradient-to-br from-white/[0.045] to-transparent p-6 transition duration-300 hover:-translate-y-1 hover:border-white/[0.16] sm:p-7"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${iconColor[item.color]}`}
                    >
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>

                    <div className="pointer-events-none absolute -bottom-16 -right-12 h-32 w-32 rounded-full bg-cyan-400/[0.035] blur-3xl transition duration-500 group-hover:bg-cyan-400/[0.08]" />
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. MISSION & VISION */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              {...revealProps}
              className="mb-12 text-center"
            >
              <SectionTitle
                eyebrow="Our direction"
                title="Purpose first."
                gradient="Technology with intention."
                description="A clear product direction helps keep every capability connected to a meaningful institutional need."
                centered
              />
            </motion.div>

            <div className="grid gap-5 lg:grid-cols-2">
              <motion.article
                initial={
                  reduceMotion ? false : { opacity: 0, x: -18 }
                }
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.07] via-[#0a1423] to-[#080d19] p-7 sm:p-9 lg:p-10"
              >
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/[0.08] blur-3xl" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                    <Target size={27} />
                  </div>

                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.23em] text-cyan-300">
                    Our mission
                  </p>

                  <h3 className="mt-3 text-2xl font-bold leading-snug text-white sm:text-3xl">
                    Make institutional work more connected and manageable.
                  </h3>

                  <p className="mt-5 leading-8 text-slate-400">
                    We aim to shape an educational ERP experience that
                    connects academic administration, relevant institutional
                    workflows, and useful technology in a coherent and
                    practical way.
                  </p>
                </div>
              </motion.article>

              <motion.article
                initial={
                  reduceMotion ? false : { opacity: 0, x: 18 }
                }
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.1 }}
                className="relative overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-300/[0.07] via-[#101126] to-[#080d19] p-7 sm:p-9 lg:p-10"
              >
                <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-violet-400/[0.09] blur-3xl" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-300">
                    <Compass size={27} />
                  </div>

                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.23em] text-violet-300">
                    Our vision
                  </p>

                  <h3 className="mt-3 text-2xl font-bold leading-snug text-white sm:text-3xl">
                    A more intelligent and adaptable education ecosystem.
                  </h3>

                  <p className="mt-5 leading-8 text-slate-400">
                    We envision a platform where structured institutional
                    information, configurable modules, responsible AI, and
                    clear access boundaries can work together to support
                    evolving educational needs.
                  </p>
                </div>
              </motion.article>
            </div>
          </div>
        </section>

        {/* 4. PRODUCT PHILOSOPHY */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps} className="mb-12">
              <SectionTitle
                eyebrow="What guides our product"
                title="Principles behind"
                gradient="the platform."
                description="These principles describe the intended product philosophy, not a claim that every capability has already been released."
              />
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {principles.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.number}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 18 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : (index % 2) * 0.08,
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.085] bg-white/[0.025] p-6 transition duration-300 hover:border-white/[0.16] hover:bg-white/[0.04] sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border ${iconColor[item.color]}`}
                      >
                        <Icon size={23} />
                      </div>

                      <span className="text-sm font-semibold tracking-[0.18em] text-slate-600">
                        {item.number}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>

                    <div className="mt-6 h-px w-12 bg-gradient-to-r from-cyan-300/60 to-violet-300/40 transition-all duration-300 group-hover:w-24" />
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. CONNECTED ECOSYSTEM */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <motion.div {...revealProps}>
              <SectionEyebrow>One connected ecosystem</SectionEyebrow>

              <SectionTitle
                eyebrow="How the pieces fit together"
                title="More than separate modules."
                gradient="A connected product direction."
                description="Academic structures, people, teaching activities, learning resources, and reporting are related parts of institutional operations. Smart ERP is designed around those relationships."
              />

              <div className="mt-7 space-y-4">
                {[
                  "Academic administration and structured records",
                  "Student, teacher, course, and subject relationships",
                  "Learning resources and academic workflows",
                  "Reporting and AI-assisted opportunities",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-300">
                      <Check size={13} />
                    </span>
                    {text}
                  </div>
                ))}
              </div>

              <Link
                to="/modules"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Explore the modules
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            {/* Conceptual relationship diagram */}
            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.97 }
              }
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/[0.08] to-violet-500/[0.08] blur-2xl" />

              <div className="relative rounded-3xl border border-white/10 bg-[#0a1020]/95 p-5 shadow-2xl shadow-black/30 sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Ecosystem map
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      Connected by relationships
                    </h3>
                  </div>
                  <Network size={23} className="text-cyan-300" />
                </div>

                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.055] p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        Institution
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Academic and operational context
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mx-auto h-7 w-px bg-gradient-to-b from-cyan-300/50 to-blue-300/40" />

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: GraduationCap,
                      title: "Academics",
                      detail: "Courses & subjects",
                      color: "cyan",
                    },
                    {
                      icon: Users,
                      title: "People",
                      detail: "Students & teachers",
                      color: "violet",
                    },
                    {
                      icon: BookOpen,
                      title: "Learning",
                      detail: "Chapters & materials",
                      color: "blue",
                    },
                    {
                      icon: BarChartIcon,
                      title: "Insights",
                      detail: "Reports & analysis",
                      color: "emerald",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 transition duration-300 hover:border-white/[0.16] sm:p-4"
                      >
                        <Icon
                          size={21}
                          className={
                            item.color === "cyan"
                              ? "text-cyan-300"
                              : item.color === "violet"
                                ? "text-violet-300"
                                : item.color === "blue"
                                  ? "text-blue-300"
                                  : "text-emerald-300"
                          }
                        />
                        <p className="mt-3 text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mx-auto h-7 w-px bg-gradient-to-b from-violet-300/40 to-violet-300/10" />

                <div className="rounded-xl border border-violet-300/15 bg-violet-300/[0.045] p-4">
                  <div className="flex items-center gap-3">
                    <BrainCircuit
                      size={22}
                      className="shrink-0 text-violet-300"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Intelligence & automation
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        AI opportunities depend on implementation,
                        permissions, and configuration.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                  Conceptual ecosystem illustration, not a live system
                  diagram.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6. AI AND RESPONSIBILITY */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            {...revealProps}
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-[#11132b] via-[#0b1223] to-[#07101b] p-6 sm:p-10 lg:p-14"
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-violet-500/15 blur-[110px]" />
            <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div>
                <SectionEyebrow>AI with context</SectionEyebrow>

                <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  Intelligence should
                  <span className="mt-2 block bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    support people.
                  </span>
                </h2>

                <p className="mt-5 leading-8 text-slate-400">
                  AI is part of the Smart ERP product vision, not a
                  replacement for institutional accountability. The intended
                  approach combines useful assistance with clear permission
                  boundaries and configurable integrations.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    "Natural-language interaction",
                    "Academic analysis and report preparation",
                    "Rule-based automation opportunities",
                    "Configurable cloud and local model integrations",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 text-sm text-slate-300"
                    >
                      <Check
                        size={17}
                        className="mt-0.5 shrink-0 text-violet-300"
                      />
                      {item}
                    </div>
                  ))}
                </div>

                <Link
                  to="/ai-automation"
                  className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[0.07] px-5 py-3 font-semibold text-violet-100 transition duration-300 hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-violet-300/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  Discover AI & Automation
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </div>

              {/* Architecture layers */}
              <div className="space-y-3">
                {architecture.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.step}>
                      <motion.div
                        initial={
                          reduceMotion
                            ? false
                            : { opacity: 0, x: 16 }
                        }
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          delay: reduceMotion ? 0 : index * 0.08,
                        }}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-[#0a1020]/85 p-4 sm:gap-4 sm:p-5"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconColor[item.color]}`}
                        >
                          <Icon size={21} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        <span className="text-xs font-semibold tracking-widest text-slate-600">
                          {item.step}
                        </span>
                      </motion.div>

                      {index < architecture.length - 1 && (
                        <div className="flex h-4 justify-center">
                          <div className="w-px bg-gradient-to-b from-white/15 to-cyan-300/30" />
                        </div>
                      )}
                    </div>
                  );
                })}

                <p className="pt-2 text-xs leading-6 text-slate-500">
                  Illustrative architecture. Actual model providers,
                  integrations, and permission enforcement must be verified
                  against the deployed system.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 7. INSTITUTIONAL FLEXIBILITY */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps} className="mb-12">
              <SectionTitle
                eyebrow="Designed for institutional needs"
                title="Different institutions."
                gradient="Room for different workflows."
                description="A school's academic structure may differ from a college's. Smart ERP's product direction emphasizes configuration and modularity rather than assuming every institution works the same way."
              />
            </motion.div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  title: "Schools",
                  description:
                    "Explore academic organization, classroom workflows, attendance, and learning resources.",
                  tags: ["Academic structure", "Attendance", "Learning"],
                  color: "cyan",
                },
                {
                  icon: GraduationCap,
                  title: "Colleges",
                  description:
                    "Explore course-oriented structures, subjects, faculty relationships, and academic coordination.",
                  tags: ["Courses", "Subjects", "Faculty"],
                  color: "violet",
                },
                {
                  icon: Building2,
                  title: "Larger institutions",
                  description:
                    "Explore how modular structures and permission-aware workflows could support more complex needs.",
                  tags: ["Modules", "Permissions", "Configuration"],
                  color: "blue",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 18 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : index * 0.08,
                    }}
                    className="rounded-2xl border border-white/[0.085] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/[0.16] sm:p-7"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${iconColor[item.color]}`}
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

        {/* 8. PRODUCT PRINCIPLES */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <motion.div
              {...revealProps}
              className="mb-12 text-center"
            >
              <SectionTitle
                eyebrow="Our commitments"
                title="A thoughtful approach"
                gradient="to building software."
                description="A strong product is not only about what it offers. It is also about how it handles complexity, information, and people."
                centered
              />
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: HeartHandshake,
                  title: "People-centered",
                  description:
                    "Technology should support educators and institutional teams.",
                },
                {
                  icon: Puzzle,
                  title: "Modular thinking",
                  description:
                    "Organize capabilities around related institutional needs.",
                },
                {
                  icon: ShieldCheck,
                  title: "Security-conscious",
                  description:
                    "Respect identity, authorization, and controlled access.",
                },
                {
                  icon: Lightbulb,
                  title: "Continuous learning",
                  description:
                    "Evolve the product through thoughtful design and validated needs.",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 16 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: reduceMotion ? 0 : index * 0.07,
                    }}
                    className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-5 sm:p-6"
                  >
                    <Icon size={23} className="text-cyan-300" />
                    <h3 className="mt-5 font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. FAQ */}
        <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <motion.div {...revealProps}>
              <SectionEyebrow>Frequently asked questions</SectionEyebrow>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get to know
                <span className="mt-1 block text-slate-400">
                  Smart ERP.
                </span>
              </h2>

              <p className="mt-5 max-w-md leading-8 text-slate-400">
                Learn about our product direction, institutional focus,
                modular approach, and vision for AI-assisted workflows.
              </p>

              <Link
                to="/contact"
                className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Have another question?
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <div className="space-y-3">
              {aboutFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                const answerId = `about-faq-${index}`;

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

        {/* 10. FINAL CTA */}
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
                Let's build a connected future
              </p>

              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Your institution's needs
                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  deserve a conversation.
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-400">
                Explore the Smart ERP product direction, discuss your
                institutional workflows, and identify the capabilities
                relevant to your requirements.
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
                  to="/features"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3 font-semibold text-slate-200 transition duration-300 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Explore Features
                  <ArrowRight size={17} />
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