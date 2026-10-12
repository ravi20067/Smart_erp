import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Layers3,
  ArrowUpRight,
  Mail,
  MessageCircle,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const footerGroups = [
  {
    title: 'Platform',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'All Modules', href: '/modules' },
      { label: 'AI & Automation', href: '/ai-automation' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Book a Demo', href: '/book-demo' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Resources', href: '/blog' },
      { label: 'Frequently Asked Questions', href: '/faq' },
    ],
  },
  {
    title: 'Explore Modules',
    links: [
      { label: 'Academic Administration', href: '/modules/academic-administration' },
      { label: 'Student Management', href: '/modules/student-management' },
      { label: 'Teacher Management', href: '/modules/teacher-management' },
      { label: 'Attendance', href: '/modules/attendance' },
      { label: 'Reports & Analytics', href: '/modules/analytics' },
    ],
  },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut' as const,
    },
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const reduceMotion = useReducedMotion();

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/[0.08] bg-[#070b14] text-slate-300">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-[110px]" />
        <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-indigo-600/[0.09] blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.035),transparent_60%)]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        className="mx-auto max-w-[1440px] px-4 pb-6 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20"
      >
        {/* Top CTA panel */}
        <motion.div
          variants={itemVariants}
          className="relative mb-14 overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] via-slate-900/70 to-indigo-500/[0.10] p-6 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-8 lg:mb-16 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-10"
        >
          <div className="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full bg-cyan-400/[0.08] blur-3xl" />

          <div className="relative max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-semibold text-cyan-300">
              <Sparkles size={14} />
              Simplify Institution Management
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to explore Smart ERP?
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
              Discover how connected academic workflows and intelligent
              automation can support your institution.
            </p>
          </div>

          <div className="relative mt-6 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0">
            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition-all duration-300 hover:border-cyan-300/30 hover:bg-white/[0.07] hover:text-cyan-200"
            >
              Explore Features
            </Link>

            <Link
              to="/book-demo"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/20"
            >
              Book a Demo
              <ArrowUpRight
                size={17}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </motion.div>

        {/* Footer columns */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-[1.35fr_1fr_1.2fr_1fr] lg:gap-10">
          {/* Brand and description */}
          <motion.div variants={itemVariants} className="min-w-0">
            <Link
              to="/"
              aria-label="Smart ERP home"
              className="group inline-flex items-center gap-3"
            >
              <motion.span
                whileHover={
                  reduceMotion
                    ? undefined
                    : { rotate: -4, scale: 1.05 }
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400 to-indigo-600 text-white shadow-lg shadow-cyan-500/15"
              >
                <Layers3 size={23} />
              </motion.span>

              <span className="text-xl font-bold tracking-tight text-white">
                Smart <span className="text-cyan-400">ERP</span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              An intelligent ERP platform designed to connect academic
              administration, institutional workflows, and AI-assisted
              operations in one place.
            </p>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-cyan-300"
              />
              <p className="text-xs leading-6 text-slate-400">
                Role-based access and controlled workflows are part of
                the platform design. Specific security capabilities
                depend on the implemented configuration.
              </p>
            </div>
          </motion.div>

          {/* Link groups */}
          {footerGroups.slice(0, 2).map((group) => (
            <motion.div
              key={group.title}
              variants={itemVariants}
              className="min-w-0"
            >
              <h3 className="mb-5 text-sm font-bold text-white">
                {group.title}
              </h3>

              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex max-w-full items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-cyan-300"
                    >
                      <span>{link.label}</span>
                      <ChevronRight
                        size={13}
                        className="shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Module links and contact CTA */}
          <motion.div variants={itemVariants} className="min-w-0">
            <h3 className="mb-5 text-sm font-bold text-white">
              Explore Modules
            </h3>

            <ul className="space-y-3">
              {footerGroups[2].links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group inline-flex max-w-full items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-cyan-300"
                  >
                    <span>{link.label}</span>
                    <ChevronRight
                      size={13}
                      className="shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
            >
              <MessageCircle size={17} />
              Talk to our team
              <ArrowUpRight size={15} />
            </Link>
          </motion.div>
        </div>

        {/* Contact strip */}
        <motion.div
          variants={itemVariants}
          className="mt-12 grid gap-3 border-y border-white/[0.07] py-6 sm:grid-cols-2 sm:gap-5 lg:mt-14 lg:grid-cols-3"
        >
          <Link
            to="/contact"
            className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.035]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-300">
              <Mail size={18} />
            </span>
            <span>
              <span className="block text-xs text-slate-500">
                General inquiries
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-200 group-hover:text-cyan-300">
                Contact our team
              </span>
            </span>
            <ArrowUpRight
              size={15}
              className="ml-auto text-slate-600 transition-colors group-hover:text-cyan-300"
            />
          </Link>

          <Link
            to="/book-demo"
            className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.035]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-300/[0.06] text-indigo-300">
              <GraduationCap size={19} />
            </span>
            <span>
              <span className="block text-xs text-slate-500">
                Product introduction
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-200 group-hover:text-indigo-300">
                Request a demo
              </span>
            </span>
            <ArrowUpRight
              size={15}
              className="ml-auto text-slate-600 transition-colors group-hover:text-indigo-300"
            />
          </Link>

          <Link
            to="/faq"
            className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.035] sm:col-span-2 lg:col-span-1"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/[0.06] text-violet-300">
              <MessageCircle size={18} />
            </span>
            <span>
              <span className="block text-xs text-slate-500">
                Need more information?
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-200 group-hover:text-violet-300">
                Browse FAQs
              </span>
            </span>
            <ArrowUpRight
              size={15}
              className="ml-auto text-slate-600 transition-colors group-hover:text-violet-300"
            />
          </Link>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-5 pt-7 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-center text-xs leading-6 text-slate-500 sm:text-left sm:text-sm">
            © {currentYear} Smart ERP. All rights reserved.
          </p>

          <nav
            aria-label="Legal navigation"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:justify-end"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xs text-slate-500 transition-colors hover:text-cyan-300 sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-5 text-center text-[11px] leading-5 text-slate-600"
        >
          Built to support connected educational workflows.
        </motion.p>
      </motion.div>
    </footer>
  );
}