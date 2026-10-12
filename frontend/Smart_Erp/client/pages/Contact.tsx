// src/pages/Contact.tsx

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Handshake,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

const inquiryTypes = [
  "General inquiry",
  "Sales and product information",
  "Request a demo",
  "Technical support",
  "Partnership",
  "Other",
];

const contactOptions = [
  {
    icon: MessageSquare,
    title: "General inquiries",
    description:
      "Questions about Smart ERP, its capabilities, or how it fits your institution.",
    tag: "GET INFORMATION",
    accent: "from-cyan-400/20 to-blue-500/10",
  },
  {
    icon: Building2,
    title: "Sales and demos",
    description:
      "Discuss your institution's requirements and explore relevant ERP modules.",
    tag: "EXPLORE THE PRODUCT",
    accent: "from-violet-400/20 to-indigo-500/10",
  },
  {
    icon: Headphones,
    title: "Technical support",
    description:
      "Get help with a product issue or identify the right support channel.",
    tag: "GET HELP",
    accent: "from-emerald-400/20 to-cyan-500/10",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    description:
      "Discuss integrations, collaboration opportunities, and institutional partnerships.",
    tag: "WORK TOGETHER",
    accent: "from-fuchsia-400/20 to-violet-500/10",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Contact() {
  const reduceMotion = useReducedMotion();

  const [form, setForm] = useState({
    name: "",
    email: "",
    institution: "",
    inquiryType: "General inquiry",
    subject: "",
    message: "",
    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof typeof form,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Do not simulate a successful submission or invent a backend endpoint.
    // Connect this handler to the existing contact service when available.
    setIsSubmitting(false);

    toast.info("Contact form is not connected yet", {
      description:
        "Your message has not been sent. Connect the form to your existing contact API before accepting submissions.",
    });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#070b17] text-slate-100">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
            <div className="absolute right-0 top-36 h-72 w-72 rounded-full bg-violet-500/10 blur-[110px]" />
            <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-blue-500/[0.08] blur-[100px]" />
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
                <MessageSquare size={15} />
                Contact Smart ERP
              </span>

              <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
                Let's start a{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  conversation
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                Whether you're exploring ERP for your institution, planning
                an implementation, or looking for technical guidance, start
                by telling us what you need.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={16} className="text-cyan-300" />
                  Institution-focused solutions
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-300" />
                  Explore AI-assisted workflows
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact categories */}
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {contactOptions.map((option, index) => {
                const Icon = option.icon;

                return (
                  <motion.div
                    key={option.title}
                    initial={reduceMotion ? false : "hidden"}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={reveal}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : index * 0.07,
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.045]"
                  >
                    <div
                      className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br ${option.accent}`}
                    >
                      <Icon size={23} className="text-cyan-200" />
                    </div>

                    <p className="text-[10px] font-semibold tracking-[0.16em] text-cyan-300">
                      {option.tag}
                    </p>

                    <h2 className="mt-3 text-lg font-semibold">
                      {option.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {option.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        updateField("inquiryType", option.title === "General inquiries"
                          ? "General inquiry"
                          : option.title === "Sales and demos"
                            ? "Request a demo"
                            : option.title === "Technical support"
                              ? "Technical support"
                              : "Partnership");

                        document
                          .getElementById("contact-form")
                          ?.scrollIntoView({
                            behavior: reduceMotion ? "auto" : "smooth",
                            block: "start",
                          });
                      }}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-cyan-200"
                    >
                      Send an inquiry
                      <ArrowRight
                        size={15}
                        className="transition group-hover:translate-x-1"
                      />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact form + information */}
        <section
          id="contact-form"
          className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            {/* Left panel */}
            <motion.aside
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={reveal}
              transition={{ duration: 0.55 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/[0.09] via-white/[0.025] to-violet-500/[0.08] p-7 sm:p-9"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/[0.09] blur-[75px]" />

              <div className="relative">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  Get in touch
                </span>

                <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
                  Tell us about your institution.
                </h2>

                <p className="mt-5 leading-7 text-slate-400">
                  Share your requirements, the challenges you're facing, or
                  the workflows you'd like to improve. Choose the inquiry
                  type that best matches your question.
                </p>

                <div className="mt-9 space-y-5">
                  <div className="flex gap-4 rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
                      <Mail size={19} />
                    </div>
                    <div>
                      <h3 className="font-medium">Email communication</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Contact details can be added here once the official
                        support or sales email is confirmed.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200">
                      <Clock3 size={19} />
                    </div>
                    <div>
                      <h3 className="font-medium">Response expectations</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Official support hours and response times should be
                        published here after they are established.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    <Sparkles size={17} />
                    Exploring the platform?
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Review the available ERP modules and AI capabilities
                    before sending your inquiry.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      to="/modules"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-cyan-200"
                    >
                      View modules
                      <ArrowUpRight size={15} />
                    </Link>
                    <Link
                      to="/ai-automation"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-cyan-200"
                    >
                      AI features
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Form */}
            <motion.div
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={reveal}
              transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.08 }}
              className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-xl sm:p-9"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Send us an inquiry
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Complete the details below. The form interface is ready;
                  message delivery must be connected to your existing
                  backend service.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Full name <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-white/10 bg-[#0a1020]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Work email <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={form.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      placeholder="you@institution.edu"
                      className="w-full rounded-xl border border-white/10 bg-[#0a1020]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-institution"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Institution / organization
                  </label>
                  <input
                    id="contact-institution"
                    name="institution"
                    autoComplete="organization"
                    maxLength={200}
                    value={form.institution}
                    onChange={(event) =>
                      updateField("institution", event.target.value)
                    }
                    placeholder="Your school, college, or organization"
                    className="w-full rounded-xl border border-white/10 bg-[#0a1020]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-type"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Inquiry type <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      id="contact-type"
                      name="inquiryType"
                      required
                      value={form.inquiryType}
                      onChange={(event) =>
                        updateField("inquiryType", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#0a1020] px-4 py-3.5 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Subject <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      required
                      maxLength={200}
                      value={form.subject}
                      onChange={(event) =>
                        updateField("subject", event.target.value)
                      }
                      placeholder="What would you like to discuss?"
                      className="w-full rounded-xl border border-white/10 bg-[#0a1020]/80 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Message <span className="text-cyan-300">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={6}
                    value={form.message}
                    onChange={(event) =>
                      updateField("message", event.target.value)
                    }
                    placeholder="Tell us about your requirements, questions, or the challenges you want to solve..."
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#0a1020]/80 px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
                  />
                  <p className="mt-2 text-right text-xs text-slate-500">
                    {form.message.length}/5000 characters
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    checked={form.consent}
                    onChange={(event) =>
                      updateField("consent", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                  />
                  <span className="text-sm leading-6 text-slate-400">
                    I agree that the information I provide may be used to
                    respond to this inquiry, subject to the applicable
                    privacy policy.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
                >
                  <Send size={17} />
                  Send inquiry
                  <ArrowRight size={16} />
                </button>

                <p className="text-xs leading-5 text-slate-500">
                  This form currently runs in UI-only mode. Submitting it
                  will not send or store your message.
                </p>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/[0.08]">
              <CheckCircle2 size={27} className="text-violet-200" />
            </div>

            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
              Still exploring your options?
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Learn about Smart ERP's capabilities and discover which
              modules align with your institution's needs.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/solutions"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#0a1020] transition hover:bg-cyan-50"
              >
                Explore solutions
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                View features
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}