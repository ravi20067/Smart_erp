
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import LandingHeader from "@/components/LandingHeader";
import Footer from "@/components/Footer";
import { loginAuth } from "@/services/authService";
import { useAuth } from "@/services/authContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { login, isAuthenticated, getDashboardRoute } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [isAuthenticated, navigate, getDashboardRoute]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      // Preserve the existing authentication API and JWT flow.
      const data = await loginAuth(username, password);

      login(data.token);
      navigate(getDashboardRoute(), { replace: true });
    } catch (error: unknown) {
      const status =
        typeof error === "object" &&
          error !== null &&
          "response" in error
          ? (
            error as {
              response?: {
                status?: number;
              };
            }
          ).response?.status
          : undefined;

      if (status === 401 || status === 403) {
        setErrorMsg("Invalid username or password. Please try again.");
      } else {
        setErrorMsg(
          "Unable to sign in right now. Please check your connection and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#080e1c]/80 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10";

  return (
    <div className="min-h-screen overflow-hidden bg-[#070b17] text-slate-100">
      <LandingHeader />

      <main className="relative isolate px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Background atmosphere */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-cyan-500/[0.09] blur-[120px]" />
          <div className="absolute right-[5%] top-40 h-96 w-96 rounded-full bg-violet-500/[0.10] blur-[140px]" />
          <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[120px]" />
        </div>

        <div className="mx-auto max-w-6xl">
          {/* Main glass panel */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/30 backdrop-blur-2xl"
          >
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              {/* Left: Brand panel */}
              <div className="relative hidden min-h-[650px] overflow-hidden border-r border-white/[0.07] bg-gradient-to-br from-cyan-500/[0.07] via-transparent to-violet-500/[0.09] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
                <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-cyan-400/[0.07] blur-[100px]" />

                {/* Brand */}
                <div className="relative">
                  <Link to="/" className="inline-flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 to-blue-500/10 shadow-lg shadow-cyan-950/20">
                      <GraduationCap
                        size={27}
                        className="text-cyan-200"
                      />
                    </div>

                    <div>
                      <span className="block text-xl font-bold tracking-tight">
                        Smart <span className="text-cyan-300">ERP</span>
                      </span>
                      <span className="block text-xs text-slate-500">
                        Intelligent Campus Management
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Illustration */}
                <div className="relative my-10">
                  <div className="absolute inset-0 rounded-full bg-blue-500/[0.08] blur-[75px]" />

                  <div className="relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center">
                    <div className="absolute inset-5 rounded-full border border-cyan-300/[0.12]" />
                    <div className="absolute inset-12 rounded-full border border-violet-300/[0.14]" />
                    <div className="absolute inset-[4.5rem] rounded-full border border-dashed border-cyan-300/20" />

                    {!reduceMotion && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 35,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-[3.25rem] rounded-full border border-dashed border-white/[0.10]"
                      />
                    )}

                    <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-cyan-200/20 bg-[#0b1428]/90 shadow-2xl shadow-cyan-950/40">
                      <div className="absolute inset-3 rounded-[1.5rem] border border-white/[0.06]" />
                      <Workflow
                        size={64}
                        strokeWidth={1.25}
                        className="text-cyan-200"
                      />

                      <div className="absolute -right-5 -top-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-[#11182b] shadow-lg">
                        <Sparkles
                          size={22}
                          className="text-violet-200"
                        />
                      </div>

                      <div className="absolute -bottom-4 -left-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-[#11182b] shadow-lg">
                        <ShieldCheck
                          size={22}
                          className="text-emerald-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
                    <Sparkles size={13} />
                    One platform. Connected workflows.
                  </span>

                  <h1 className="mt-5 text-4xl font-bold leading-tight xl:text-5xl">
                    Everything your campus needs,{" "}
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                      in one place.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                    Access your Smart ERP workspace to manage the
                    academic and administrative workflows available to
                    your account.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-5 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck size={15} className="text-cyan-300" />
                      Role-based access
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Fingerprint size={15} className="text-violet-300" />
                      Secure sign-in
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Sign-in form */}
              <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
                <div className="w-full max-w-md">
                  {/* Compact mobile brand */}
                  <Link
                    to="/"
                    className="mb-10 inline-flex items-center gap-3 lg:hidden"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                      <GraduationCap
                        size={25}
                        className="text-cyan-200"
                      />
                    </div>

                    <div>
                      <span className="block text-lg font-bold">
                        Smart <span className="text-cyan-300">ERP</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Campus Management
                      </span>
                    </div>
                  </Link>

                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: reduceMotion ? 0 : 0.1,
                    }}
                  >
                    <div className="mb-8">
                      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                        Welcome to your workspace
                      </span>

                      <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                        Sign in to Smart ERP
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        Enter your account credentials to continue to
                        your dashboard.
                      </p>
                    </div>

                    {errorMsg && (
                      <motion.div
                        initial={
                          reduceMotion ? false : { opacity: 0, y: -6 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        role="alert"
                        aria-live="polite"
                        className="mb-6 rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm leading-6 text-red-200"
                      >
                        {errorMsg}
                      </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                      {/* Username */}
                      <div>
                        <label
                          htmlFor="login-username"
                          className="mb-2 block text-sm font-medium text-slate-300"
                        >
                          Username
                        </label>

                        <div className="relative">
                          <Mail
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                          />

                          <input
                            id="login-username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            maxLength={254}
                            value={username}
                            onChange={(event) => {
                              setUsername(event.target.value);
                              if (errorMsg) setErrorMsg("");
                            }}
                            placeholder="Enter your username / email / mobile no."
                            disabled={loading}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label
                            htmlFor="login-password"
                            className="text-sm font-medium text-slate-300"
                          >
                            Password
                          </label>

                          <Link
                            to="/contact"
                            className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                          >
                            Need help signing in?
                          </Link>
                        </div>

                        <div className="relative">
                          <LockKeyhole
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                          />

                          <input
                            id="login-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            maxLength={1024}
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              if (errorMsg) setErrorMsg("");
                            }}
                            placeholder="Enter your password"
                            disabled={loading}
                            className={`${inputClass} pr-12`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            aria-pressed={showPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b17] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        {loading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Signing you in...
                          </>
                        ) : (
                          <>
                            Sign in to your account
                            <ArrowRight
                              size={18}
                              className="transition-transform group-hover:translate-x-1"
                            />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="my-7 flex items-center gap-4">
                      <div className="h-px flex-1 bg-white/[0.08]" />
                      <span className="text-xs text-slate-600">
                        SECURE ACCESS
                      </span>
                      <div className="h-px flex-1 bg-white/[0.08]" />
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06]">
                          <ShieldCheck
                            size={18}
                            className="text-emerald-200"
                          />
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-slate-200">
                            Your account, your permissions
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Your available dashboard is determined by
                            your authenticated account and assigned role.
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-7 text-center text-xs leading-6 text-slate-500">
                      Don't have your login credentials?{" "}
                      <Link
                        to="/contact"
                        className="font-medium text-cyan-300 transition hover:text-cyan-200"
                      >
                        Contact support
                        <ArrowUpRight
                          size={12}
                          className="ml-0.5 inline"
                        />
                      </Link>
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.section>

          <p className="mt-6 text-center text-xs text-slate-600">
            Smart ERP · Institutional management platform
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
