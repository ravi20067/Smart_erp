
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  GraduationCap,
  Home,
  Search,
  Sparkles,
} from "lucide-react";
import LandingHeader from "../components/LandingHeader";
import Footer from "../components/Footer";

export default function NotFound() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const suggestions = [
    {
      label: "Home",
      description: "Return to the main page",
      href: "/",
      icon: Home,
    },
    {
      label: "Features",
      description: "Discover Smart ERP capabilities",
      href: "/features",
      icon: Sparkles,
    },
    {
      label: "Modules",
      description: "Explore institutional workflows",
      href: "/modules",
      icon: GraduationCap,
    },
    {
      label: "Contact",
      description: "Find the right next step",
      href: "/contact",
      icon: Compass,
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#070b17] text-slate-100">
      <LandingHeader />

      <main className="relative isolate flex min-h-[75vh] items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute left-[10%] top-[15%] h-52 w-52 rounded-full bg-cyan-400/[0.08] blur-[100px]" />
          <div className="absolute bottom-[5%] right-[8%] h-64 w-64 rounded-full bg-violet-500/[0.09] blur-[110px]" />
        </div>

        <div className="mx-auto w-full max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Error illustration */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65 }}
              className="relative mx-auto flex w-full max-w-lg items-center justify-center"
            >
              <div className="absolute h-72 w-72 rounded-full border border-cyan-300/[0.08] sm:h-96 sm:w-96" />
              <div className="absolute h-56 w-56 rounded-full border border-violet-300/[0.10] sm:h-72 sm:w-72" />

              {!reduceMotion && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 35,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute h-80 w-80 rounded-full border border-dashed border-cyan-300/20 sm:h-[27rem] sm:w-[27rem]"
                  />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute right-[13%] top-[17%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.8)]"
                  />
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute bottom-[17%] left-[13%] h-2.5 w-2.5 rounded-full bg-violet-300 shadow-[0_0_20px_rgba(196,181,253,0.8)]"
                  />
                </>
              )}

              <div className="relative flex aspect-square w-full max-w-[22rem] items-center justify-center sm:max-w-[26rem]">
                <div className="absolute inset-8 rounded-[2.5rem] border border-white/10 bg-white/[0.025] shadow-2xl shadow-blue-950/40 backdrop-blur-2xl sm:inset-10" />

                <div className="relative text-center">
                  <div className="bg-gradient-to-br from-cyan-200 via-blue-400 to-violet-400 bg-clip-text text-[8rem] font-black leading-none tracking-tighter text-transparent drop-shadow-[0_0_40px_rgba(56,189,248,0.12)] sm:text-[10rem]">
                    404
                  </div>

                  <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] shadow-lg shadow-cyan-950/20">
                    <Search size={27} className="text-cyan-200" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Page not found
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Error message */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.12 }}
              className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.06] px-4 py-2 text-sm font-medium text-violet-200">
                <Sparkles size={15} />
                Looks like you've lost your way
              </span>

              <h1 className="mt-7 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                This page took an{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  unexpected detour.
                </span>
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-400">
                The page you're looking for may have moved, been removed, or
                never existed. Let's get you back to the right place in
                Smart ERP.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:shadow-blue-500/20"
                >
                  <Home size={17} />
                  Back to Home
                  <ArrowRight size={17} />
                </Link>

                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <ArrowLeft size={17} />
                  Go Back
                </button>
              </div>

              {/* Current path */}
              <div className="mt-7 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Requested address
                </p>
                <p className="mt-2 break-all font-mono text-sm text-cyan-200">
                  {location.pathname}
                  {location.search}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Suggested destinations */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.25 }}
            className="mt-20 border-t border-white/[0.08] pt-10 sm:mt-24 sm:pt-12"
          >
            <div className="text-center">
              <p className="text-sm font-medium text-cyan-300">
                YOUR NEXT DESTINATION
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Where would you like to go?
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.href}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: reduceMotion ? 0 : 0.3 + index * 0.07,
                    }}
                  >
                    <Link
                      to={item.href}
                      className="group flex h-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.05]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] transition group-hover:bg-cyan-300/[0.12]">
                        <Icon size={20} className="text-cyan-200" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <ArrowRight
                        size={16}
                        className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-200"
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
