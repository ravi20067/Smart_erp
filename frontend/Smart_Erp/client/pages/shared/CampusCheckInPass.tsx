import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  BadgeCheck,
  History,
} from "lucide-react";
import { useAuth } from "@/services/authContext";
import campusCheckInService, {
  type CampusCheckDirection,
  type CampusPersonRole,
  type CampusQrResponse,
  type CampusStatusResponse,
} from "@/services/campusCheckInService";
import useAttendanceWebSocket from "@/hooks/useAttendanceWebSocket";

interface CampusCheckInPassProps {
  role: CampusPersonRole;
}

export default function CampusCheckInPass({ role }: CampusCheckInPassProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<CampusStatusResponse | null>(null);
  const [qrData, setQrData] = useState<CampusQrResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const data =
        role === "TEACHER"
          ? await campusCheckInService.getTeacherStatus()
          : await campusCheckInService.getStudentStatus();
      setStatus(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to load campus gate status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [role]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useAttendanceWebSocket({
    topic: user?.userId ? `/topic/campus/user/${user.userId}` : "",
    enabled: Boolean(user?.userId),
    onMessage: (msg: any) => {
      loadStatus();
      if (msg?.status === "APPROVED") {
        setQrData(null);
        setCountdown(0);
        setInfoMessage(msg.message || "Security Guard approved your campus gate request.");
      } else if (msg?.status === "REJECTED") {
        setQrData(null);
        setCountdown(0);
        setErrorMessage(msg.message || "Security Guard rejected your campus gate request.");
      }
    },
  });

  const handleGenerateQr = async (direction: CampusCheckDirection) => {
    setGenerating(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      const res =
        role === "TEACHER"
          ? await campusCheckInService.generateTeacherQr(direction)
          : await campusCheckInService.generateStudentQr(direction);
      setQrData(res);
      const secondsRemaining = res.expiresAt
        ? Math.max(30, Math.round((new Date(res.expiresAt).getTime() - Date.now()) / 1000))
        : 300;
      setCountdown(secondsRemaining);
      await loadStatus();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Could not generate campus gate QR");
    } finally {
      setGenerating(false);
    }
  };

  const copyToken = () => {
    if (!qrData?.qrData) return;
    navigator.clipboard.writeText(qrData.qrData);
    setInfoMessage("Short-lived gate QR token copied to clipboard.");
    setTimeout(() => setInfoMessage(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#091c2f] via-[#0c1629] to-[#121024] p-5 sm:p-8 text-white">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <ShieldCheck size={14} />
              Campus Gate Security Verification ({role})
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Campus Check-In &amp; Check-Out Pass
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
              {role === "STUDENT"
                ? "Present this identity-bound gate QR to the Security Guard when entering or leaving campus. An approved open Campus Check-In is mandatory before classroom attendance."
                : "Present this identity-bound faculty gate QR to the Security Guard for campus entry and exit tracking (stored independently of student classroom attendance)."}
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg ${
              status?.hasActiveOpenCheckIn
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-emerald-500/10"
                : "border-slate-700 bg-slate-800/80 text-slate-300"
            }`}
          >
            {status?.hasActiveOpenCheckIn ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            {status?.hasActiveOpenCheckIn ? "INSIDE CAMPUS (Open Check-In)" : "OUTSIDE CAMPUS"}
          </div>
        </div>
      </section>

      {infoMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Verified Identity Profile ({role})
                </p>
                <h2 className="mt-0.5 text-xl font-bold text-white">{status?.fullName || "Portal User"}</h2>
              </div>
              <BadgeCheck className="text-cyan-400 shrink-0" size={26} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                <span className="text-slate-400">
                  {role === "STUDENT" ? "Enrollment / Reg. No." : "Employee ID"}
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-white break-all">
                  {status?.primaryIdentifier || "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                <span className="text-slate-400">
                  {role === "STUDENT" ? "Course / Program" : "Department"}
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {status?.departmentOrCourse || "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                <span className="text-slate-400">
                  {role === "STUDENT" ? "Section" : "Designation"}
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {status?.sectionOrDesignation || "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                <span className="text-slate-400">
                  {role === "STUDENT" ? "Academic Year / Open Entry" : "Open Gate Entry Time"}
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {status?.openCheckInTime
                    ? new Date(status.openCheckInTime).toLocaleTimeString()
                    : status?.academicYearName || "Not Checked In"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleGenerateQr("CHECK_IN")}
                disabled={generating || Boolean(status?.hasActiveOpenCheckIn)}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? <RefreshCw size={16} className="animate-spin" /> : <LogIn size={18} />}
                Generate Check-In QR
              </button>

              <button
                onClick={() => handleGenerateQr("CHECK_OUT")}
                disabled={generating || !status?.hasActiveOpenCheckIn}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? <RefreshCw size={16} className="animate-spin" /> : <LogOut size={18} />}
                Generate Check-Out QR
              </button>
            </div>
          </div>

          {qrData && countdown > 0 && (
            <div className="flex flex-col items-center rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-5 sm:p-6 text-center shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Show to Security Guard ({qrData.direction.replace("_", " ")})
              </span>
              <h3 className="mt-1 text-lg font-bold text-white">{qrData.displayName}</h3>
              <p className="text-xs text-slate-400">
                {qrData.identifierLabel}: {qrData.identifierValue}
              </p>

              <div className="mt-4 w-full max-w-[240px] rounded-2xl bg-white p-4 shadow-2xl">
                <QRCode value={qrData.qrData} size={208} level="M" className="h-auto w-full" />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
                <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 font-mono font-bold text-amber-300">
                  Expires in {countdown}s
                </span>
                <button
                  onClick={copyToken}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700"
                >
                  <Copy size={13} /> Copy QR Data
                </button>
              </div>
              <p className="mt-2 font-mono text-[11px] text-slate-500 break-all">
                {qrData.qrData}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History size={18} className="text-cyan-400 shrink-0" />
                <h3 className="font-semibold text-white">Campus Gate Entry / Exit Log</h3>
              </div>
              <button
                onClick={loadStatus}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            <div className="max-h-[480px] divide-y divide-slate-800/80 overflow-y-auto pr-1">
              {status?.recentHistory && status.recentHistory.length > 0 ? (
                status.recentHistory.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 py-3.5 text-xs sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 font-bold ${
                            item.direction === "CHECK_IN"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {item.direction === "CHECK_IN" ? "ENTRY" : "EXIT"}
                        </span>
                        <span className="text-slate-400">
                          {new Date(item.requestedAt).toLocaleString()}
                        </span>
                      </div>
                      {item.guardName && (
                        <p className="mt-1.5 text-slate-300">Verified by Guard: {item.guardName}</p>
                      )}
                      {item.rejectionReason && (
                        <p className="mt-1 text-rose-400">Reason: {item.rejectionReason}</p>
                      )}
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${
                        item.status === "APPROVED"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : item.status === "REJECTED"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {item.status === "APPROVED" ? (
                        <CheckCircle2 size={12} />
                      ) : item.status === "REJECTED" ? (
                        <XCircle size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-14 text-center text-sm text-slate-500">
                  No campus gate entry or exit records yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
