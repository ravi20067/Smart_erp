import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import {
  Play,
  Square,
  RefreshCw,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  QrCode,
  Radio,
  Cpu,
  Activity,
} from "lucide-react";
import { useAuth } from "@/services/authContext";
import {
  startAttendanceSession,
  stopAttendanceSession,
  getActiveTeacherSession,
  refreshTeacherQr,
  getTeacherSessionStats,
  getAttendanceFilters,
  getTeacherFaceAiHealth,
  type AttendanceSessionDto,
  type AttendanceStatsResponse,
  type PythonFaceAiHealthReport,
} from "@/services/attendanceService";
import { generateEphemeralStudentKeys } from "@/services/handshakeCrypto";
import { TeacherWebRtcHost } from "@/services/webrtcHandshake";
import useAttendanceWebSocket, { type AttendanceSocketMessage } from "@/hooks/useAttendanceWebSocket";

export default function TeacherAttendanceManager() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<AttendanceSessionDto | null>(null);
  const [qrPayload, setQrPayload] = useState<string>("");
  const [stats, setStats] = useState<AttendanceStatsResponse | null>(null);

  // Filters
  const [filters, setFilters] = useState<{
    academicYears: Array<{ id: number; name: string }>;
    courses: Array<{ id: number; name: string }>;
    sections: Array<{ id: number; name: string }>;
    subjects: Array<{ id: number; name: string }>;
  }>({
    academicYears: [],
    courses: [],
    sections: [],
    subjects: [],
  });

  // Start Form State
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [roomNumber, setRoomNumber] = useState("LH-201");
  const [allowedSubnets, setAllowedSubnets] = useState("");
  const [webrtcHostActive, setWebrtcHostActive] = useState(false);
  const [webrtcPeersVerified, setWebrtcPeersVerified] = useState(0);
  const [issuedTokens, setIssuedTokens] = useState<Array<{ studentRef: string; receiptId: string; issuedAt: string }>>([]);
  const [faceAiHealth, setFaceAiHealth] = useState<PythonFaceAiHealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const webrtcHostRef = useRef<TeacherWebRtcHost | null>(null);

  const loadFaceAiHealth = async () => {
    setHealthLoading(true);
    try {
      const report = await getTeacherFaceAiHealth();
      setFaceAiHealth(report);
    } catch {
      setFaceAiHealth({
        serviceUrl: "http://127.0.0.1:8001",
        checkedAt: new Date().toISOString(),
        latencyMs: 0,
        reachable: false,
        status: "DOWN",
        readiness: false,
        error: "Unable to reach Spring Boot Face AI health proxy",
      });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadFaceAiHealth();
    const healthTimer = setInterval(loadFaceAiHealth, 30000);
    return () => {
      clearInterval(healthTimer);
      webrtcHostRef.current?.destroy();
      webrtcHostRef.current = null;
    };
  }, []);

  // Countdown timer for QR refresh
  const [countdown, setCountdown] = useState(60);

  // Fetch initial data & active session
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [active, filterData] = await Promise.all([
          getActiveTeacherSession(),
          getAttendanceFilters().catch(() => ({
            academicYears: [{ id: 1, name: "2026-2027" }],
            courses: [{ id: 1, name: "B.Tech Computer Science" }],
            sections: [{ id: 1, name: "Section A" }],
            subjects: [{ id: 1, name: "Data Structures & Algorithms" }],
          })),
        ]);

        setFilters(filterData);
        if (filterData.academicYears.length > 0) setSelectedYear(String(filterData.academicYears[0].id));
        if (filterData.courses.length > 0) setSelectedCourse(String(filterData.courses[0].id));
        if (filterData.sections.length > 0) setSelectedSection(String(filterData.sections[0].id));
        if (filterData.subjects.length > 0) setSelectedSubject(String(filterData.subjects[0].id));

        if (active) {
          setActiveSession(active);
          setQrPayload(active.qrPayload || "");
          if (active.allowedSubnets) setAllowedSubnets(active.allowedSubnets);
          loadStats(active.sessionUuid);
        }
      } catch (err: any) {
        console.error("Failed to load initial attendance data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadStats = async (sessionUuid: string) => {
    try {
      const data = await getTeacherSessionStats(sessionUuid);
      setStats(data);
    } catch (e) {
      console.error("Failed to load session stats:", e);
    }
  };

  // 60-Second QR Refresh Countdown
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefreshQr();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Handle incoming live WebSocket events
  useAttendanceWebSocket({
    topic: activeSession ? `/topic/attendance/session/${activeSession.sessionUuid}` : "",
    enabled: !!activeSession,
    onMessage: (msg: AttendanceSocketMessage) => {
      if (activeSession) {
        loadStats(activeSession.sessionUuid);
      }
      if (msg.message) {
        setStatusMessage(msg.message);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    },
  });

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear || !selectedCourse || !selectedSection || !selectedSubject) {
      setErrorMessage("Please select academic year, course, section, and subject.");
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      // Generate fresh ephemeral Ed25519 & X25519 keys strictly in Teacher browser RAM
      const ephemeralTeacherKeys = await generateEphemeralStudentKeys();

      const session = await startAttendanceSession({
        academicYearId: Number(selectedYear),
        courseId: Number(selectedCourse),
        sectionId: Number(selectedSection),
        subjectId: Number(selectedSubject),
        roomNumber,
        teacherEd25519PublicKey: ephemeralTeacherKeys.ed25519PublicKeyBase64,
        teacherX25519PublicKey: ephemeralTeacherKeys.x25519PublicKeyBase64,
        allowedSubnets: allowedSubnets.trim() || undefined,
      });

      webrtcHostRef.current?.destroy();
      const parsedQr = session.qrPayload ? JSON.parse(session.qrPayload) : {};
      webrtcHostRef.current = new TeacherWebRtcHost({
        sessionUuid: session.sessionUuid,
        teacherId: Number(parsedQr.teacherId || user?.userId || 0),
        backendPublicKey: session.backendPublicKey || "",
        teacherKeys: ephemeralTeacherKeys,
        allowedSubnets: session.allowedSubnets || allowedSubnets.trim() || undefined,
        onPeerVerified: (studentRef, companionReceiptId) => {
          setWebrtcPeersVerified((n) => n + 1);
          if (companionReceiptId) {
            setIssuedTokens((prev) => [
              { studentRef, receiptId: companionReceiptId, issuedAt: new Date().toLocaleTimeString() },
              ...prev.slice(0, 7),
            ]);
          }
        },
        onHostError: (err) => setErrorMessage(err),
      });
      setWebrtcHostActive(true);
      setWebrtcPeersVerified(0);
      setIssuedTokens([]);
      setActiveSession(session);
      setQrPayload(session.qrPayload || "");
      setCountdown(60);
      loadStats(session.sessionUuid);
      setStatusMessage("Attendance session active — direct WebRTC P2P host (Wi-Fi & Teacher Hotspot ready).");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to start attendance session");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    if (!window.confirm("Are you sure you want to close this attendance session?")) return;

    setActionLoading(true);
    try {
      await stopAttendanceSession(activeSession.sessionUuid);
      webrtcHostRef.current?.destroy();
      webrtcHostRef.current = null;
      setWebrtcHostActive(false);
      setActiveSession(null);
      setQrPayload("");
      setStats(null);
      setStatusMessage("Attendance session closed and in-memory WebRTC cryptographic keys wiped.");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to close session");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    if (!activeSession) return;
    try {
      const newPayload = await refreshTeacherQr(activeSession.sessionUuid);
      setQrPayload(newPayload);
      setCountdown(60);
    } catch (err: any) {
      console.error("Failed to refresh QR:", err);
    }
  };

  const handleCopyQrPayload = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setStatusMessage("Signed Teacher QR JSON copied to clipboard.");
    setTimeout(() => setStatusMessage(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#062419] via-[#091526] to-[#0c1f38] p-6 sm:p-8 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <ShieldCheck size={14} />
              Secure QR Attendance Terminal
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Faculty Classroom Attendance
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Live Python Face AI health diagnostics, rotating signed QR &amp; WebRTC Wi-Fi / Hotspot final token issuance.
            </p>
          </div>

          {activeSession && (
            <button
              onClick={handleStopSession}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-700 disabled:opacity-50"
            >
              <Square size={16} />
              End Attendance
            </button>
          )}
        </div>
      </section>

      {/* Notifications */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Python Face AI Microservice Health & Models Panel */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${faceAiHealth?.reachable && faceAiHealth?.readiness ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-rose-500/40 bg-rose-500/10 text-rose-400"}`}>
              <Cpu size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">Python Face AI Engine</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${faceAiHealth?.reachable && faceAiHealth?.readiness ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/15 text-rose-300 border border-rose-500/30"}`}>
                  <Activity size={11} />
                  {faceAiHealth ? (faceAiHealth.reachable ? `${faceAiHealth.status} • ${faceAiHealth.modelsStatus || "READY"}` : "OFFLINE") : "CHECKING..."}
                </span>
                {typeof faceAiHealth?.latencyMs === "number" && (
                  <span className="font-mono text-[11px] text-slate-400">
                    {faceAiHealth.latencyMs}ms
                  </span>
                )}
                {typeof faceAiHealth?.matchThreshold === "number" && (
                  <span className="font-mono text-[11px] text-cyan-300">
                    SFace Threshold: {faceAiHealth.matchThreshold}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {faceAiHealth?.error
                  ? faceAiHealth.error
                  : `${faceAiHealth?.application || "Smart ERP Face AI"} v${faceAiHealth?.version || "1.0.0"} (${faceAiHealth?.device || "CPU"}) — Anti-Spoof, Liveness & 128-D Matching`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadFaceAiHealth}
            disabled={healthLoading}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw size={12} className={healthLoading ? "animate-spin" : ""} />
            Check Health
          </button>
        </div>

        {faceAiHealth?.models && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(faceAiHealth.models).map(([key, st]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs"
              >
                <span className="font-mono uppercase text-slate-300">{key}</span>
                <span className={`font-bold ${st === "LOADED" ? "text-emerald-400" : "text-amber-400"}`}>
                  {st}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Attendance Session Active Screen */}
      {activeSession ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* QR Display Card */}
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-5">
            <div className="mb-3 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Live Attendance QR
              </span>
              <h2 className="text-lg font-bold text-white">Scan with Student App</h2>
            </div>

            <div className="relative w-full max-w-[260px] rounded-2xl bg-white p-4 shadow-2xl">
              {qrPayload ? (
                <QRCode
                  value={qrPayload}
                  size={228}
                  level="M"
                  className="h-auto w-full rounded"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              )}
            </div>

            {/* Countdown Progress */}
            <div className="mt-4 w-full max-w-[260px]">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Rotating Security Signature</span>
                <span className="font-mono text-emerald-400 font-bold">{countdown}s</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${(countdown / 60) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleRefreshQr}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw size={12} />
                Manual Refresh
              </button>
              <button
                onClick={handleCopyQrPayload}
                disabled={!qrPayload}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
              >
                <Copy size={12} />
                Copy Signed QR JSON
              </button>
            </div>

            {/* WebRTC Local/Hotspot Host Info & Issued Final Tokens */}
            <div className="mt-6 w-full space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <Wifi size={18} className={webrtcHostActive ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"} />
                <div>
                  <span className="font-semibold text-slate-200">
                    {webrtcHostActive ? "WebRTC Direct P2P Host Active" : "Page Reloaded — Restart Session for WebRTC Keys"}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {webrtcHostActive
                      ? `Wi-Fi & Teacher Hotspot ready (ICE host-only, zero STUN/TURN) • ${webrtcPeersVerified} final attendance tokens issued`
                      : "In-memory Ed25519/X25519 private keys reset on browser reload. Click End Attendance and start a fresh session."}
                  </p>
                </div>
              </div>
              {issuedTokens.length > 0 && (
                <div className="border-t border-slate-800/80 pt-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Recent WebRTC Final Tokens Sent
                  </span>
                  {issuedTokens.slice(0, 4).map((t) => (
                    <div key={t.receiptId} className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                      <span>{t.studentRef}</span>
                      <span className="text-emerald-400">{t.receiptId} • {t.issuedAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Session Overview & Live Student Roster */}
          <div className="space-y-6 lg:col-span-7">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs text-slate-400">Eligible Enrolled</span>
                <p className="mt-1 text-2xl font-bold text-white">
                  {stats ? stats.totalEligible : activeSession.totalEligible}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <span className="text-xs text-emerald-400">Verified Present</span>
                <p className="mt-1 text-2xl font-bold text-emerald-300">
                  {stats ? stats.totalPresent : activeSession.totalPresent}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs text-slate-400">Room / Hall</span>
                <p className="mt-1 text-xl font-bold text-slate-200">
                  {activeSession.roomNumber || "LH-201"}
                </p>
              </div>
            </div>

            {/* Live Student Feed */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-emerald-400 animate-pulse" />
                  <h3 className="font-semibold text-white">Live Attendance Roster</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {activeSession.courseName} — {activeSession.sectionName}
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {stats && stats.students && stats.students.length > 0 ? (
                  <div className="divide-y divide-slate-800/80">
                    {stats.students.map((student) => (
                      <div
                        key={student.studentId}
                        className="flex items-center justify-between py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                            {student.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{student.studentName}</p>
                            <p className="text-xs text-slate-400">
                              Roll: {student.rollNumber} • {student.checkInTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 size={12} />
                            {student.status}
                          </span>
                          {student.similarityScore && (
                            <span className="text-xs font-mono text-slate-400" title="Biometric Similarity">
                              {(student.similarityScore * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <QrCode size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Awaiting verified student check-ins...</p>
                    <p className="text-xs">Students must hold Campus Gate Check-In, pass Liveness &amp; Face Match, scan QR, and receive WebRTC Teacher Token.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Responsive Setup Grid: Start Attendance Session + WebRTC Security Overview */
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8 shadow-xl xl:col-span-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Start New Attendance Session</h2>
              <p className="mt-1 text-sm text-slate-400">
                Select class, section, and subject to issue a rotating signed QR and host direct WebRTC peer handshakes.
              </p>
            </div>

            <form onSubmit={handleStartSession} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Academic Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {filters.academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Course / Program
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {filters.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {filters.sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Subject / Module
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {filters.subjects.map((sb) => (
                      <option key={sb.id} value={sb.id}>
                        {sb.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Lecture Hall / Room
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. LH-201"
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Restrict Wi-Fi / Hotspot Subnets (Optional CIDR)
                  </label>
                  <input
                    type="text"
                    value={allowedSubnets}
                    onChange={(e) => setAllowedSubnets(e.target.value)}
                    placeholder="Blank allows all RFC1918 Wi-Fi & Hotspots"
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <Play size={18} />
                    Start Secure Attendance Session
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8 shadow-xl xl:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Wifi size={14} />
              Zero-Config Wi-Fi &amp; Hotspot P2P
            </div>
            <h3 className="text-lg font-bold text-white">Cryptographic Proximity Architecture</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Your browser acts directly as the local classroom peer over encrypted DTLS WebRTC DataChannels with zero external companion servers or IP setup required.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5">
                <p className="font-semibold text-emerald-300">1. Ephemeral In-Browser Keys (Ed25519 + X25519)</p>
                <p className="mt-1 text-slate-400">
                  Fresh non-persisted keypairs are generated when you click Start and wiped immediately when attendance stops.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5">
                <p className="font-semibold text-cyan-300">2. Host-Only ICE (iceServers: [])</p>
                <p className="mt-1 text-slate-400">
                  Rejects public STUN/TURN relays so students must be on the same classroom Wi-Fi subnet or connected to your mobile/laptop Hotspot.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5">
                <p className="font-semibold text-amber-300">3. Mandatory Campus Check-In Prerequisite</p>
                <p className="mt-1 text-slate-400">
                  Students must already have an approved open Campus Gate Check-In and pass live 3-step anti-spoof face verification before shaking hands.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
