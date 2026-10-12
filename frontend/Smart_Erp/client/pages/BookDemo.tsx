// src/pages/BookDemo.tsx

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Bot,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    Layers3,
    Monitor,
    ShieldCheck,
    Sparkles,
    Users,
    Video,
} from "lucide-react";
import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

const modules = [
    "Academic Administration",
    "Student Management",
    "Teacher Management",
    "Attendance & QR Authentication",
    "Timetable & Scheduling",
    "Examinations & Results",
    "Finance & Fee Management",
    "Library Management",
    "Reports & Analytics",
    "AI Automation & Chatbot",
];

const demoModes = [
    {
        value: "online",
        title: "Online demo",
        description: "Explore Smart ERP remotely",
        icon: Video,
    },
    {
        value: "personalized",
        title: "Personalized walkthrough",
        description: "Focus on your institution's needs",
        icon: Monitor,
    },
];

const reveal = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0 },
};

type DemoForm = {
    name: string;
    email: string;
    phone: string;
    institution: string;
    institutionType: string;
    role: string;
    institutionSize: string;
    demoMode: string;
    date: string;
    time: string;
    selectedModules: string[];
    requirements: string;
    consent: boolean;
};

const initialForm: DemoForm = {
    name: "",
    email: "",
    phone: "",
    institution: "",
    institutionType: "",
    role: "",
    institutionSize: "",
    demoMode: "online",
    date: "",
    time: "",
    selectedModules: [],
    requirements: "",
    consent: false,
};

export default function BookDemo() {
    const reduceMotion = useReducedMotion();
    const [form, setForm] = useState<DemoForm>(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = <K extends keyof DemoForm>(
        field: K,
        value: DemoForm[K],
    ) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const toggleModule = (module: string) => {
        setForm((current) => ({
            ...current,
            selectedModules: current.selectedModules.includes(module)
                ? current.selectedModules.filter((item) => item !== module)
                : [...current.selectedModules, module],
        }));
    };

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // Connect this handler to the existing demo-booking API when its
        // endpoint and request contract are available.
        setIsSubmitting(false);

        toast.info("Demo booking is not connected yet", {
            description:
                "Your details have not been submitted. Connect the existing backend service to complete a demo request.",
        });
    }

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-[#090f20]/90 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10";

    const labelClass = "mb-2 block text-sm font-medium text-slate-300";

    return (
        <div className="min-h-screen overflow-hidden bg-[#070b17] text-slate-100">
            <LandingHeader />

            <main>
                {/* Hero */}
                <section className="relative isolate px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8">
                    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute left-1/2 top-0 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-cyan-500/[0.12] blur-[140px]" />
                        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-violet-500/10 blur-[110px]" />
                    </div>

                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={reduceMotion ? false : "hidden"}
                            animate="visible"
                            variants={reveal}
                            transition={{ duration: 0.6 }}
                            className="mx-auto max-w-3xl text-center"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-sm font-medium text-cyan-200">
                                <Sparkles size={15} />
                                Experience Smart ERP
                            </span>

                            <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
                                See your campus{" "}
                                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                                    work smarter.
                                </span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                                Explore how Smart ERP can bring academic administration,
                                student services, attendance, analytics, and AI-assisted
                                workflows together in one platform.
                            </p>

                            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-400">
                                <span className="inline-flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-300" />
                                    Institution-focused walkthrough
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-300" />
                                    Explore relevant modules
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-300" />
                                    Discuss your requirements
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Main demo section */}
                <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
                    <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
                        {/* Left information panel */}
                        <motion.aside
                            initial={reduceMotion ? false : "hidden"}
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.15 }}
                            variants={reveal}
                            transition={{ duration: 0.55 }}
                            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.09] via-white/[0.025] to-violet-500/[0.09] p-7 sm:p-9 lg:sticky lg:top-24"
                        >
                            <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-blue-400/[0.09] blur-[80px]" />

                            <div className="relative">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                                    <GraduationCap size={29} className="text-cyan-200" />
                                </div>

                                <h2 className="mt-6 text-3xl font-bold leading-tight">
                                    A closer look at your future ERP.
                                </h2>

                                <p className="mt-4 text-sm leading-7 text-slate-400">
                                    Tell us about your institution so a demo can be tailored
                                    around your workflows and operational requirements.
                                </p>

                                <div className="mt-8 space-y-5">
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                            <Layers3 size={19} className="text-cyan-200" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Explore ERP modules</h3>
                                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                                Review academic, administrative, finance, and
                                                reporting workflows.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                            <Bot size={19} className="text-violet-200" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Discover AI capabilities</h3>
                                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                                Learn about AI-assisted queries, automation, and
                                                multilingual assistance.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                            <Users size={19} className="text-emerald-200" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Discuss your requirements</h3>
                                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                                Identify the features and workflows most relevant
                                                to your organization.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-9 rounded-2xl border border-white/10 bg-[#080d1b]/70 p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                                        <ShieldCheck size={17} className="text-cyan-300" />
                                        Your institution's requirements
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Share only the information needed to discuss your
                                        prospective ERP setup. Do not enter student records,
                                        passwords, or other sensitive personal data.
                                    </p>
                                </div>

                                <Link
                                    to="/solutions"
                                    className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                                >
                                    Explore our solutions
                                    <ArrowUpRight size={16} />
                                </Link>
                            </div>
                        </motion.aside>

                        {/* Form */}
                        <motion.div
                            initial={reduceMotion ? false : "hidden"}
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.1 }}
                            variants={reveal}
                            transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.08 }}
                            className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl sm:p-8 lg:p-10"
                        >
                            <div className="mb-8">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                                    Demo request
                                </p>
                                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                                    Tell us what you need
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                    Fill in the details below to prepare your demo request.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Personal information */}
                                <div>
                                    <h3 className="mb-5 flex items-center gap-2 font-semibold">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">
                                            01
                                        </span>
                                        Contact information
                                    </h3>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="demo-name" className={labelClass}>
                                                Full name <span className="text-cyan-300">*</span>
                                            </label>
                                            <input
                                                id="demo-name"
                                                name="name"
                                                autoComplete="name"
                                                required
                                                maxLength={120}
                                                value={form.name}
                                                onChange={(e) => updateField("name", e.target.value)}
                                                placeholder="Your full name"
                                                className={inputClass}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="demo-email" className={labelClass}>
                                                Work email <span className="text-cyan-300">*</span>
                                            </label>
                                            <input
                                                id="demo-email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                maxLength={254}
                                                value={form.email}
                                                onChange={(e) => updateField("email", e.target.value)}
                                                placeholder="you@institution.edu"
                                                className={inputClass}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="demo-phone" className={labelClass}>
                                                Phone number
                                            </label>
                                            <input
                                                id="demo-phone"
                                                name="phone"
                                                type="tel"
                                                autoComplete="tel"
                                                maxLength={30}
                                                value={form.phone}
                                                onChange={(e) => updateField("phone", e.target.value)}
                                                placeholder="Your contact number"
                                                className={inputClass}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="demo-role" className={labelClass}>
                                                Your role <span className="text-cyan-300">*</span>
                                            </label>
                                            <select
                                                id="demo-role"
                                                name="role"
                                                required
                                                value={form.role}
                                                onChange={(e) => updateField("role", e.target.value)}
                                                className={inputClass}
                                            >
                                                <option value="" disabled>
                                                    Select your role
                                                </option>
                                                <option value="Owner / Director">
                                                    Owner / Director
                                                </option>
                                                <option value="Principal / Dean">
                                                    Principal / Dean
                                                </option>
                                                <option value="Administrator">Administrator</option>
                                                <option value="IT / Technical team">
                                                    IT / Technical team
                                                </option>
                                                <option value="Faculty / Teacher">
                                                    Faculty / Teacher
                                                </option>
                                                <option value="Procurement">Procurement</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/[0.08]" />

                                {/* Institution details */}
                                <div>
                                    <h3 className="mb-5 flex items-center gap-2 font-semibold">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">
                                            02
                                        </span>
                                        Institution details
                                    </h3>

                                    <div className="space-y-5">
                                        <div>
                                            <label
                                                htmlFor="demo-institution"
                                                className={labelClass}
                                            >
                                                Institution name{" "}
                                                <span className="text-cyan-300">*</span>
                                            </label>
                                            <input
                                                id="demo-institution"
                                                name="institution"
                                                autoComplete="organization"
                                                required
                                                maxLength={200}
                                                value={form.institution}
                                                onChange={(e) =>
                                                    updateField("institution", e.target.value)
                                                }
                                                placeholder="School, college, university, or organization"
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="demo-institution-type"
                                                    className={labelClass}
                                                >
                                                    Institution type{" "}
                                                    <span className="text-cyan-300">*</span>
                                                </label>
                                                <select
                                                    id="demo-institution-type"
                                                    name="institutionType"
                                                    required
                                                    value={form.institutionType}
                                                    onChange={(e) =>
                                                        updateField("institutionType", e.target.value)
                                                    }
                                                    className={inputClass}
                                                >
                                                    <option value="" disabled>
                                                        Select institution type
                                                    </option>
                                                    <option value="School">School</option>
                                                    <option value="College">College</option>
                                                    <option value="University">University</option>
                                                    <option value="Coaching institute">
                                                        Coaching institute
                                                    </option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="demo-size"
                                                    className={labelClass}
                                                >
                                                    Approximate student count
                                                </label>
                                                <select
                                                    id="demo-size"
                                                    name="institutionSize"
                                                    value={form.institutionSize}
                                                    onChange={(e) =>
                                                        updateField("institutionSize", e.target.value)
                                                    }
                                                    className={inputClass}
                                                >
                                                    <option value="">Select student count</option>
                                                    <option value="Below 500">Below 500</option>
                                                    <option value="500–2000">500–2,000</option>
                                                    <option value="2001–5000">2,001–5,000</option>
                                                    <option value="5001–10000">5,001–10,000</option>
                                                    <option value="Above 10000">Above 10,000</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/[0.08]" />

                                {/* Demo preferences */}
                                <div>
                                    <h3 className="mb-5 flex items-center gap-2 font-semibold">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">
                                            03
                                        </span>
                                        Demo preferences
                                    </h3>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {demoModes.map((mode) => {
                                            const Icon = mode.icon;
                                            const selected = form.demoMode === mode.value;

                                            return (
                                                <button
                                                    key={mode.value}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() =>
                                                        updateField("demoMode", mode.value)
                                                    }
                                                    className={`rounded-2xl border p-5 text-left transition ${selected
                                                            ? "border-cyan-300/40 bg-cyan-300/[0.07] ring-1 ring-cyan-300/10"
                                                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                                            <Icon
                                                                size={20}
                                                                className={
                                                                    selected
                                                                        ? "text-cyan-200"
                                                                        : "text-slate-400"
                                                                }
                                                            />
                                                        </div>

                                                        {selected && (
                                                            <CheckCircle2
                                                                size={19}
                                                                className="text-cyan-300"
                                                            />
                                                        )}
                                                    </div>

                                                    <h4 className="mt-4 font-semibold">
                                                        {mode.title}
                                                    </h4>
                                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                                        {mode.description}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="demo-date" className={labelClass}>
                                                Preferred date
                                            </label>
                                            <div className="relative">
                                                <CalendarDays
                                                    size={17}
                                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                                />
                                                <input
                                                    id="demo-date"
                                                    name="date"
                                                    type="date"
                                                    min={new Date().toLocaleDateString("en-CA")}
                                                    value={form.date}
                                                    onChange={(e) =>
                                                        updateField("date", e.target.value)
                                                    }
                                                    className={`${inputClass} pl-11`}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="demo-time" className={labelClass}>
                                                Preferred time
                                            </label>
                                            <div className="relative">
                                                <Clock3
                                                    size={17}
                                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                                />
                                                <select
                                                    id="demo-time"
                                                    name="time"
                                                    value={form.time}
                                                    onChange={(e) =>
                                                        updateField("time", e.target.value)
                                                    }
                                                    className={`${inputClass} pl-11`}
                                                >
                                                    <option value="">Select a time</option>
                                                    <option value="09:00">9:00 AM</option>
                                                    <option value="10:00">10:00 AM</option>
                                                    <option value="11:00">11:00 AM</option>
                                                    <option value="12:00">12:00 PM</option>
                                                    <option value="13:00">1:00 PM</option>
                                                    <option value="14:00">2:00 PM</option>
                                                    <option value="15:00">3:00 PM</option>
                                                    <option value="16:00">4:00 PM</option>
                                                    <option value="17:00">5:00 PM</option>
                                                </select>
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Times are preferences, not confirmed availability.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/[0.08]" />

                                {/* Module selection */}
                                <div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h3 className="flex items-center gap-2 font-semibold">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">
                                                    04
                                                </span>
                                                Modules to explore
                                            </h3>
                                            <p className="mt-3 text-sm leading-6 text-slate-400">
                                                Select the areas you'd like to see during the demo.
                                            </p>
                                        </div>

                                        <span className="text-xs text-cyan-200">
                                            {form.selectedModules.length} selected
                                        </span>
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        {modules.map((module) => {
                                            const selected = form.selectedModules.includes(module);
                                            const checkboxId = `module-${module
                                                .toLowerCase()
                                                .replace(/[^a-z0-9]+/g, "-")}`;

                                            return (
                                                <label
                                                    key={module}
                                                    htmlFor={checkboxId}
                                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${selected
                                                            ? "border-cyan-300/30 bg-cyan-300/[0.06]"
                                                            : "border-white/[0.08] bg-white/[0.015] hover:border-white/20"
                                                        }`}
                                                >
                                                    <input
                                                        id={checkboxId}
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() => toggleModule(module)}
                                                        className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-400"
                                                    />
                                                    <span className="text-sm leading-5 text-slate-300">
                                                        {module}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="h-px bg-white/[0.08]" />

                                {/* Requirements */}
                                <div>
                                    <h3 className="mb-5 flex items-center gap-2 font-semibold">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">
                                            05
                                        </span>
                                        Additional requirements
                                    </h3>

                                    <label htmlFor="demo-requirements" className={labelClass}>
                                        What would you like us to focus on?
                                    </label>
                                    <textarea
                                        id="demo-requirements"
                                        name="requirements"
                                        rows={5}
                                        maxLength={3000}
                                        value={form.requirements}
                                        onChange={(e) =>
                                            updateField("requirements", e.target.value)
                                        }
                                        placeholder="Describe your current workflow, challenges, required integrations, or specific features you want to explore..."
                                        className={`${inputClass} resize-y leading-6`}
                                    />
                                    <p className="mt-2 text-right text-xs text-slate-500">
                                        {form.requirements.length}/3000 characters
                                    </p>
                                </div>

                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.015] p-4">
                                    <input
                                        type="checkbox"
                                        name="consent"
                                        required
                                        checked={form.consent}
                                        onChange={(e) =>
                                            updateField("consent", e.target.checked)
                                        }
                                        className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                                    />
                                    <span className="text-sm leading-6 text-slate-400">
                                        I agree that my information may be used to respond to
                                        this demo inquiry in accordance with the applicable
                                        privacy policy.
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Request a demo
                                    <ArrowRight
                                        size={18}
                                        className="transition group-hover:translate-x-1"
                                    />
                                </button>

                                <p className="text-center text-xs leading-5 text-slate-500">
                                    This request is not submitted or booked until the
                                    existing demo service is connected.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="px-4 pb-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center sm:p-12">
                        <h2 className="text-2xl font-bold sm:text-3xl">
                            Want to explore Smart ERP first?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
                            Discover the platform's modules, features, and AI capabilities
                            before deciding what to include in your walkthrough.
                        </p>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/modules"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#0a1020] transition hover:bg-cyan-50"
                            >
                                Explore modules
                                <ArrowRight size={17} />
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold text-slate-200 transition hover:bg-white/[0.07]"
                            >
                                Contact us
                                <ArrowLeft size={16} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}