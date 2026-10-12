import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  Menu,
  X,
  ArrowUpRight,
  Layers3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const primaryLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Features', href: '/features' },
  { label: 'AI & Automation', href: '/ai-automation' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Resources', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const moduleLinks = [
  {
    label: 'Academic Administration',
    href: '/modules/academic-administration',
    description: 'Courses, classes and sections',
  },
  {
    label: 'Student Management',
    href: '/modules/student-management',
    description: 'Student records and profiles',
  },
  {
    label: 'Teacher Management',
    href: '/modules/teacher-management',
    description: 'Staff and teaching assignments',
  },
  {
    label: 'Attendance Management',
    href: '/modules/attendance',
    description: 'Attendance workflows and verification',
  },
  {
    label: 'Timetable & Scheduling',
    href: '/modules/timetable',
    description: 'Academic schedules and planning',
  },
  {
    label: 'Reports & Analytics',
    href: '/modules/analytics',
    description: 'Institutional insights and reports',
  },
];

function isRouteActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);

  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const closeMenu = () => {
    setIsOpen(false);
    setModulesOpen(false);
  };

  const navLinkClass = (href: string) =>
    `relative whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${isRouteActive(location.pathname, href)
      ? 'text-cyan-300'
      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
    }`;

  const drawerVariants = {
    hidden: {
      opacity: 0,
      height: 0,
    },
    visible: {
      opacity: 1,
      height: 'auto' as const,
      transition: {
        duration: reduceMotion ? 0 : 0.25,
        when: 'beforeChildren' as const,
        staggerChildren: reduceMotion ? 0 : 0.04,
      },
    },
  };

  const drawerItemVariants = {
    hidden: {
      opacity: 0,
      x: reduceMotion ? 0 : -8,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.2,
      },
    },
  };

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.4,
        ease: 'easeOut',
      }}
      className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080c18]/95 text-white shadow-lg shadow-black/10 backdrop-blur-2xl"
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:min-h-20 lg:px-8"
      >
        {/* Brand */}
        <Link
          to="/"
          onClick={closeMenu}
          aria-label="Smart ERP home"
          className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
        >
          <motion.span
            whileHover={
              reduceMotion
                ? undefined
                : { rotate: -4, scale: 1.05 }
            }
            whileTap={
              reduceMotion
                ? undefined
                : { scale: 0.96 }
            }
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-cyan-500/20 sm:h-11 sm:w-11"
          >
            <Layers3
              size={23}
              className="relative z-10 text-white"
            />
            <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.span>

          <span className="flex min-w-0 flex-col">
            <span className="whitespace-nowrap text-base font-bold tracking-tight text-white sm:text-lg">
              Smart <span className="text-cyan-400">ERP</span>
            </span>

            <span className="hidden text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:block lg:tracking-[0.2em]">
              Intelligent Institution Management
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-0.5 xl:flex">
          {primaryLinks.slice(0, 3).map((item) => {
            const active = isRouteActive(
              location.pathname,
              item.href,
            );

            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? 'page' : undefined}
                className={navLinkClass(item.href)}
              >
                {item.label}

                {active && (
                  <motion.span
                    layoutId="smart-erp-nav-indicator"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}

          {/* Modules dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setModulesOpen(true)}
            onMouseLeave={() => setModulesOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={modulesOpen}
              onClick={() =>
                setModulesOpen((previous) => !previous)
              }
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setModulesOpen(false);
                }
              }}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isRouteActive(location.pathname, '/modules') ||
                  modulesOpen
                  ? 'text-cyan-300'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`}
            >
              Modules
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${modulesOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            <AnimatePresence>
              {modulesOpen && (
                <motion.div
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 8, scale: 0.98 }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { opacity: 0, y: 8, scale: 0.98 }
                  }
                  transition={{
                    duration: reduceMotion ? 0 : 0.18,
                  }}
                  className="absolute left-1/2 top-full z-50 mt-3 w-[min(380px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0b1220] p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl"
                >
                  <div className="mb-2 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      ERP Modules
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Connected tools for institution workflows
                    </p>
                  </div>

                  <div className="grid gap-1">
                    {moduleLinks.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setModulesOpen(false)}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-cyan-400/15 hover:bg-cyan-400/[0.05]"
                      >
                        <span>
                          <span className="block text-sm font-medium text-slate-200 group-hover:text-cyan-200">
                            {item.label}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {item.description}
                          </span>
                        </span>

                        <ChevronRight
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300"
                        />
                      </Link>
                    ))}
                  </div>

                  <Link
                    to="/modules"
                    onClick={() => setModulesOpen(false)}
                    className="mt-2 flex items-center justify-between rounded-xl border-t border-white/[0.07] px-3 py-3 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Explore all modules
                    <ArrowUpRight size={16} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {primaryLinks.slice(3).map((item) => {
            const active = isRouteActive(
              location.pathname,
              item.href,
            );

            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? 'page' : undefined}
                className={navLinkClass(item.href)}
              >
                {item.label}

                {active && (
                  <motion.span
                    layoutId="smart-erp-nav-indicator"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            to="/pricing"
            className="hidden rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:text-white 2xl:inline-flex"
          >
            Pricing
          </Link>

          <Link
            to="/login"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/[0.05] hover:text-cyan-300"
          >
            Login
          </Link>

          <Link
            to="/book-demo"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/20 active:translate-y-0"
          >
            Book a Demo
            <ArrowUpRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <motion.button
          type="button"
          whileTap={
            reduceMotion
              ? undefined
              : { scale: 0.92 }
          }
          onClick={() =>
            setIsOpen((previous) => !previous)
          }
          aria-label={
            isOpen
              ? 'Close navigation menu'
              : 'Open navigation menu'
          }
          aria-expanded={isOpen}
          aria-controls="smart-erp-mobile-navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isOpen ? 'close' : 'open'}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, rotate: -45 }
              }
              animate={{ opacity: 1, rotate: 0 }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, rotate: 45 }
              }
              transition={{
                duration: reduceMotion ? 0 : 0.15,
              }}
            >
              {isOpen ? <X size={21} /> : <Menu size={21} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </nav>

      {/* Mobile navigation */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="smart-erp-mobile-navigation"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden border-t border-white/[0.07] bg-[#0b1020]/[0.98] backdrop-blur-2xl lg:hidden"
          >
            <motion.div className="mx-auto max-h-[calc(100dvh-72px)] max-w-7xl space-y-1 overflow-y-auto px-4 py-4 sm:px-6">
              {primaryLinks.slice(0, 3).map((item) => {
                const active = isRouteActive(
                  location.pathname,
                  item.href,
                );

                return (
                  <motion.div
                    key={item.href}
                    variants={drawerItemVariants}
                  >
                    <Link
                      to={item.href}
                      onClick={closeMenu}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${active
                          ? 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-300'
                          : 'border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
                        }`}
                    >
                      {item.label}
                      <ChevronRight
                        size={17}
                        className={
                          active
                            ? 'text-cyan-400'
                            : 'text-slate-500'
                        }
                      />
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile modules dropdown */}
              <motion.div variants={drawerItemVariants}>
                <button
                  type="button"
                  aria-expanded={modulesOpen}
                  onClick={() =>
                    setModulesOpen((previous) => !previous)
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-3.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  Modules
                  <ChevronDown
                    size={17}
                    className={`transition-transform ${modulesOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {modulesOpen && (
                    <motion.div
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, height: 0 }
                      }
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={
                        reduceMotion
                          ? undefined
                          : { opacity: 0, height: 0 }
                      }
                      transition={{
                        duration: reduceMotion ? 0 : 0.2,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 space-y-1 border-l border-cyan-400/20 py-2 pl-3">
                        {moduleLinks.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={closeMenu}
                            className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
                          >
                            <span className="block text-sm text-slate-200">
                              {item.label}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                              {item.description}
                            </span>
                          </Link>
                        ))}

                        <Link
                          to="/modules"
                          onClick={closeMenu}
                          className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-cyan-300"
                        >
                          All modules
                          <ArrowUpRight size={15} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {primaryLinks.slice(3).map((item) => {
                const active = isRouteActive(
                  location.pathname,
                  item.href,
                );

                return (
                  <motion.div
                    key={item.href}
                    variants={drawerItemVariants}
                  >
                    <Link
                      to={item.href}
                      onClick={closeMenu}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${active
                          ? 'border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-300'
                          : 'border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
                        }`}
                    >
                      {item.label}
                      <ChevronRight size={17} className="text-slate-500" />
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                variants={drawerItemVariants}
                className="grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4"
              >
                <Link
                  to="/pricing"
                  onClick={closeMenu}
                  className="flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.05]"
                >
                  Pricing
                </Link>

                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.05]"
                >
                  Login
                </Link>

                <Link
                  to="/book-demo"
                  onClick={closeMenu}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-transform active:scale-[0.98]"
                >
                  Book a Demo
                  <ArrowUpRight size={16} />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}