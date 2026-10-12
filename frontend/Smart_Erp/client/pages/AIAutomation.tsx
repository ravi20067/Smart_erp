import { useState } from "react";
import { Link } from "react-router-dom";
import {
    motion,
    useReducedMotion,
} from "framer-motion";
import {
    ArrowRight,
    ArrowUpRight,
    Bot,
    BrainCircuit,
    Check,
    ChevronRight,
    Cpu,
    Globe2,
    Languages,
    LockKeyhole,
    MessageCircle,
    Network,
    Orbit,
    Send,
    ShieldCheck,
    Sparkles,
    Workflow,
    Zap,
} from "lucide-react";

import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

const capabilities = [
    {
        icon: MessageCircle,
        title: "Multilingual AI assistant",
        description:
            "Give users a conversational interface designed for questions in their preferred language, including English and Hindi. Additional languages depend on the configured AI model.",
        tag: "Natural conversation",
    },
    {
        icon: BrainCircuit,
        title: "Intelligent model routing",
        description:
            "Design an orchestration layer that selects an appropriate configured LLM for a request, based on your rules, model capabilities, and available resources.",
        tag: "LLM orchestration",
    },
    {
        icon: Workflow,
        title: "Workflow assistance",
        description:
            "Help users understand processes, navigate supported workflows, and prepare routine tasks while leaving sensitive operations to authorized application services.",
        tag: "Task assistance",
    },
    {
        icon: Cpu,
        title: "Local LLM direction",
        description:
            "Explore connecting locally hosted models through Ollama when suitable, with model selection guided by your configuration and infrastructure.",
        tag: "Local AI option",
    },
    {
        icon: Network,
        title: "ERP-aware answers",
        description:
            "Ground responses in approved Smart ERP documentation and authorized institutional context when the required retrieval and permission integrations are available.",
        tag: "Context-aware AI",
    },
    {
        icon: ShieldCheck,
        title: "Permission-conscious design",
        description:
            "Keep AI assistance separate from authorization decisions. Protected records and actions must continue to respect your existing backend permissions.",
        tag: "Security first",
    },
];

const stages = [
    {
        number: "01",
        title: "Understand the request",
        description:
            "Receive a question in the user's language and identify the intended task and relevant context.",
    },
    {
        number: "02",
        title: "Apply your routing rules",
        description:
            "Choose from the configured AI models or tools according to your rule book and the capabilities available.",
    },
    {
        number: "03",
        title: "Use approved context",
        description:
            "Retrieve relevant documentation or permitted ERP context when those integrations are configured.",
    },
    {
        number: "04",
        title: "Return a useful response",
        description:
            "Present the result in the chat interface, with clear feedback when the request needs clarification or cannot be completed.",
    },
];

const languages = [
    "Auto-detect",
    "English",
    "हिन्दी",
    "Hinglish",
    "বাংলা",
    "தமிழ்",
    "తెలుగు",
    "मराठी",
    "ગુજરાતી",
    "ਪੰਜਾਬੀ",
    "اردو",
    "Español",
    "Français",
    "العربية",
];

export default function AIAutomation() {
    const reduceMotion = useReducedMotion();
    const [selectedLanguage, setSelectedLanguage] = useState("Auto-detect");

    const reveal = reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 22 },
            whileInView: { opacity: 1, y: 0 },
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
                        <div className="absolute left-1/2 top-0 h-[500px] w-[760px] -translate-x-1/2 rounded-full bg-violet-600/[0.12] blur-[130px]" />
                        <div className="absolute right-[-8%] top-28 h-96 w-96 rounded-full bg-cyan-500/[0.09] blur-[120px]" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
                    </div>

                    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                        <motion.div
                            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65 }}
                        >
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                                <Sparkles size={14} />
                                Smart ERP intelligence
                            </div>

                            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Meet your institution's
                                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                                    AI-powered assistant.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                                Make institutional workflows easier to understand with
                                conversational assistance, multilingual interactions, and
                                an AI architecture designed to work with configured language
                                models and approved ERP context.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <a
                                    href="#ai-assistant"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20"
                                >
                                    Explore the AI assistant
                                    <ArrowRight size={16} />
                                </a>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                                >
                                    Discuss AI integration
                                    <ArrowUpRight size={16} />
                                </Link>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-400 sm:text-sm">
                                {[
                                    "Multilingual interaction",
                                    "Configurable model routing",
                                    "Permission-aware architecture",
                                ].map((item) => (
                                    <span key={item} className="inline-flex items-center gap-2">
                                        <Check size={14} className="text-cyan-300" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Illustrative AI workspace */}
                        <motion.div
                            initial={
                                reduceMotion ? false : { opacity: 0, scale: 0.96, y: 18 }
                            }
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="relative mx-auto w-full max-w-xl"
                        >
                            <div className="pointer-events-none absolute inset-10 rounded-full bg-gradient-to-br from-cyan-500/15 via-violet-500/15 to-transparent blur-3xl" />

                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1322]/90 p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-6">
                                <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-200">
                                            <Bot size={22} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                Smart ERP AI
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Multilingual assistant concept
                                            </p>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1 text-[10px] text-amber-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                                        UI CONCEPT
                                    </span>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm border border-cyan-400/15 bg-cyan-400/[0.07] p-4">
                                        <p className="text-xs text-cyan-200">You · Hinglish</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-200">
                                            Mujhe attendance workflow samjhao.
                                        </p>
                                    </div>

                                    <div className="flex max-w-[94%] gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                                            <Sparkles size={15} />
                                        </div>
                                        <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.035] p-4">
                                            <p className="text-xs text-violet-300">
                                                Smart ERP AI · Example
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                                Attendance workflow ko session creation, student
                                                verification, aur attendance recording mein divide
                                                kiya ja sakta hai. Actual steps configured system par
                                                depend karenge.
                                            </p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {["Session", "Verification", "Record"].map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-slate-950/50 p-3">
                                    <div className="flex items-center gap-2">
                                        <Globe2 size={16} className="text-cyan-300" />
                                        <span className="text-xs font-medium text-slate-300">
                                            Language preference
                                        </span>
                                        <select
                                            aria-label="Choose AI preview language"
                                            value={selectedLanguage}
                                            onChange={(event) =>
                                                setSelectedLanguage(event.target.value)
                                            }
                                            className="ml-auto max-w-[155px] rounded-lg border border-white/10 bg-[#101827] px-2 py-2 text-xs text-white outline-none focus:border-cyan-400/40"
                                        >
                                            {languages.map((language) => (
                                                <option key={language} value={language}>
                                                    {language}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                                        Preview only. Selecting a language here does not change an
                                        AI model's response until connected to the real assistant.
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400">
                                        <LockKeyhole size={15} />
                                    </div>
                                    <p className="text-[11px] leading-5 text-slate-400">
                                        Existing backend authorization remains responsible for
                                        protected data and actions.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Capabilities */}
                <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto max-w-7xl">
                        <motion.div {...reveal} className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-300">
                                <Orbit size={15} />
                                AI capabilities
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                More than a chat box.
                                <span className="block text-slate-400">
                                    A configurable AI experience.
                                </span>
                            </h2>
                            <p className="mt-4 leading-7 text-slate-400">
                                Build a useful assistant around your models, institutional
                                context, rules, and the tasks users are authorized to perform.
                            </p>
                        </motion.div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {capabilities.map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <motion.article
                                        key={item.title}
                                        {...reveal}
                                        transition={{
                                            duration: 0.5,
                                            delay: reduceMotion ? 0 : index * 0.06,
                                        }}
                                        whileHover={reduceMotion ? undefined : { y: -5 }}
                                        className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-colors duration-300 hover:border-cyan-400/20 hover:bg-white/[0.045]"
                                    >
                                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.10] to-violet-500/[0.10] text-cyan-200 transition group-hover:border-cyan-400/30">
                                            <Icon size={22} />
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-300">
                                            {item.tag}
                                        </span>
                                        <h3 className="mt-3 text-lg font-semibold text-white">
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

                {/* Architecture */}
                <section className="border-y border-white/[0.06] bg-white/[0.018] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                        <motion.div {...reveal}>
                            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-violet-300">
                                <Network size={15} />
                                How it works
                            </div>
                            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                                One assistant.
                                <span className="block text-slate-400">
                                    The right model for the task.
                                </span>
                            </h2>
                            <p className="mt-5 leading-7 text-slate-400">
                                Your planned architecture can use a routing layer to select
                                between configured LLMs, including local Ollama models where
                                suitable. Model routing, retrieval, and task execution must be
                                implemented in the connected AI service.
                            </p>

                            <div className="mt-7 rounded-2xl border border-violet-400/15 bg-violet-400/[0.04] p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                                        <Languages size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Language-flexible experience
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Automatic detection or user-selected language
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm leading-7 text-slate-400">
                                    The UI can accept questions in different languages. Actual
                                    language detection, translation, and response quality depend
                                    on the model and the integration.
                                </p>
                            </div>
                        </motion.div>

                        <div className="space-y-4">
                            {stages.map((stage, index) => (
                                <motion.div
                                    key={stage.number}
                                    {...reveal}
                                    transition={{
                                        duration: 0.45,
                                        delay: reduceMotion ? 0 : index * 0.08,
                                    }}
                                    className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:gap-5 sm:p-6"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-sm font-bold text-cyan-300">
                                        {stage.number}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{stage.title}</h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-400">
                                            {stage.description}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        size={17}
                                        className="ml-auto mt-1 hidden shrink-0 text-slate-600 sm:block"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Chatbot preview / shared feature */}
                <section
                    id="ai-assistant"
                    className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
                >
                    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                        <motion.div {...reveal}>
                            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-300">
                                <MessageCircle size={15} />
                                Available across the experience
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                A helpful AI companion on every page.
                            </h2>
                            <p className="mt-5 leading-7 text-slate-400">
                                A shared, responsive chat assistant can stay available while
                                users explore Home, About, Features, Modules, and other public
                                pages. It can accept questions in different languages and
                                present answers from the configured AI service.
                            </p>

                            <div className="mt-7 space-y-4">
                                {[
                                    "Responsive floating chat window for mobile and desktop",
                                    "Language preference and multilingual input",
                                    "Clear loading, error, and connection states",
                                    "Accessible keyboard controls and reduced-motion support",
                                    "No bypass of existing authentication or permissions",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                                    >
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                                            <Check size={12} />
                                        </span>
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <Link
                                to="/contact"
                                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:gap-3"
                            >
                                Discuss your AI setup
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>

                        <motion.div {...reveal}>
                            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c1322] shadow-2xl shadow-black/20">
                                <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-400/15 text-cyan-200">
                                            <Bot size={21} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                Smart ERP Assistant
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Example interface
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">
                                        PREVIEW
                                    </span>
                                </div>

                                <div className="space-y-5 p-5 sm:p-6">
                                    <div className="flex gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-200">
                                            <Sparkles size={15} />
                                        </div>
                                        <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.035] p-4">
                                            <p className="text-xs text-violet-300">Assistant</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                                Namaste! You can ask a question in your preferred
                                                language. Your connected AI service determines the
                                                answer.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                                        <p className="text-xs text-cyan-200">You</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">
                                            Explain a feature in simple Hindi.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                                        <p className="text-xs font-medium text-amber-200">
                                            Integration note
                                        </p>
                                        <p className="mt-2 text-xs leading-6 text-slate-400">
                                            This is a static product preview. Live answers require
                                            connecting the chatbot component to your existing AI
                                            service.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-950/50 p-3">
                                        <span className="flex-1 text-sm text-slate-500">
                                            Ask in any supported language...
                                        </span>
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950">
                                            <Send size={16} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Responsible AI */}
                <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto max-w-7xl">
                        <motion.div {...reveal} className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-emerald-300">
                                <ShieldCheck size={15} />
                                Responsible integration
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Useful AI, with boundaries.
                            </h2>
                            <p className="mt-4 leading-7 text-slate-400">
                                An assistant can discuss a wide range of topics, but it should
                                be transparent about uncertainty, respect data permissions,
                                and avoid claiming access to information it has not received.
                            </p>
                        </motion.div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    title: "Broad questions",
                                    text: "Support general questions within the configured model's capabilities and safety constraints.",
                                },
                                {
                                    title: "Private ERP information",
                                    text: "Only retrieve or expose institutional information through authorized, verified data access.",
                                },
                                {
                                    title: "Sensitive actions",
                                    text: "Require the application's normal authorization and confirmation rules for consequential operations.",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    {...reveal}
                                    transition={{
                                        duration: 0.5,
                                        delay: reduceMotion ? 0 : index * 0.07,
                                    }}
                                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
                                >
                                    <h3 className="font-semibold text-white">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-400">
                                        {item.text}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
                    <motion.div
                        {...reveal}
                        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#10192b] p-7 sm:p-10 lg:p-14"
                    >
                        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-violet-500/[0.12] blur-3xl" />
                        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                            <div className="max-w-2xl">
                                <div className="mb-4 text-cyan-300">
                                    <Sparkles size={25} />
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Make AI part of your Smart ERP experience.
                                </h2>
                                <p className="mt-4 leading-7 text-slate-400">
                                    Plan the assistant, model routing, language support, and
                                    approved integrations around your institution's real needs.
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