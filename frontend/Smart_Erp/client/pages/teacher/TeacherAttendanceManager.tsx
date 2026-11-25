import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import {
  Users,
  Play,
  Square,
  RefreshCw,
  Wifi,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  Layers,
  Sparkles,
  QrCode,
  Radio,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/services/authContext";
import {
  startAttendanceSession,
  stopAttendanceSession,
  getActiveTeacherSession,
  refreshTeacherQr,
  getTeacherSessionStats,
  getAttendanceFilters,
  type AttendanceSessionDto,
  type AttendanceStatsResponse,
} from "@/services/attendanceService";
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
  const [localIp, setLocalIp] = useState("192.168.1.100");
  const [localPort, setLocalPort] = useState(8443);
  const [allowedSubnets, setAllowedSubnets] = useState("192.168.1.0/24");
  const [companionAdminToken, setCompanionAdminToken] = useState("");
  const [teacherEd25519PublicKey, setTeacherEd25519PublicKey] = useState("");
  const [teacherX25519PublicKey, setTeacherX25519PublicKey] = useState("");
  const [certFingerprint, setCertFingerprint] = useState("");
  const [companionConnected, setCompanionConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          if (active.localServerIp) setLocalIp(active.localServerIp);
          if (active.localServerPort) setLocalPort(active.localServerPort);
          if (active.allowedSubnets) setAllowedSubnets(active.allowedSubnets);
          if (active.teacherEd25519PublicKey) setTeacherEd25519PublicKey(active.teacherEd25519PublicKey);
          if (active.teacherX25519PublicKey) setTeacherX25519PublicKey(active.teacherX25519PublicKey);
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

  const handleConnectCompanion = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    if (!localIp.trim() || !companionAdminToken.trim()) {
      setErrorMessage("Enter your Companion LAN IP and Admin Control Token printed by `npm run handshake:companion`.");
      return;
    }
    try {
      const res = await fetch(`https://${localIp.trim()}:${localPort}/companion/keys`, {
        headers: {
          Authorization: `Bearer ${companionAdminToken.trim()}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to authenticate with local HTTPS companion");
      }
      setTeacherEd25519PublicKey(data.teacherEd25519PublicKey);
      setTeacherX25519PublicKey(data.teacherX25519PublicKey);
      setCertFingerprint(data.certFingerprint256 || "");
      setCompanionConnected(true);
      setStatusMessage("HTTPS Companion paired. Ephemeral Ed25519 & X25519 public keys loaded.");
    } catch (err: any) {
      setCompanionConnected(false);
      setErrorMessage(
        err.message?.includes("Failed to fetch")
          ? `Could not connect to https://${localIp.trim()}:${localPort}. Ensure the HTTPS companion is running and open https://${localIp.trim()}:${localPort}/health in a browser tab once to trust its self-signed LAN certificate.`
          : err.message || "Failed to pair HTTPS Companion"
      );
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear || !selectedCourse || !selectedSection || !selectedSubject) {
      setErrorMessage("Please select academic year, course, section, and subject.");
      return;
    }
    if (!teacherEd25519PublicKey || !teacherX25519PublicKey || !companionAdminToken.trim()) {
      setErrorMessage("Pair your local HTTPS Teacher Companion first so session cryptographic public keys are pinned.");
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      const session = await startAttendanceSession({
        academicYearId: Number(selectedYear),
        courseId: Number(selectedCourse),
        sectionId: Number(selectedSection),
        subjectId: Number(selectedSubject),
        roomNumber,
        localServerIp: localIp.trim(),
        localServerPort: localPort,
        teacherEd25519PublicKey,
        teacherX25519PublicKey,
        allowedSubnets: allowedSubnets.trim() || undefined,
      });

      const companionStart = await fetch(`https://${localIp.trim()}:${localPort}/companion/session/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${companionAdminToken.trim()}`,
        },
        body: JSON.stringify({
          sessionUuid: session.sessionUuid,
          teacherId: session.qrPayload ? JSON.parse(session.qrPayload).teacherId : user?.userId,
          backendPublicKey: session.backendPublicKey,
          allowedSubnets: session.allowedSubnets || allowedSubnets.trim(),
        }),
      });
      const companionJson = await companionStart.json();
      if (!companionStart.ok || !companionJson.ok) {
        throw new Error(companionJson.error || "Failed to arm local HTTPS companion session");
      }

      setActiveSession(session);
      setQrPayload(session.qrPayload || "");
      setCountdown(60);
      loadStats(session.sessionUuid);
      setStatusMessage("Attendance session active with Ed25519 + X25519/HKDF HTTPS Companion.");
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
      if (companionAdminToken.trim()) {
        await fetch(`https://${localIp.trim()}:${localPort}/companion/session/stop`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${companionAdminToken.trim()}`,
          },
        }).catch(() => {});
      }
      setActiveSession(null);
      setQrPayload("");
      setStats(null);
      setCompanionConnected(false);
      setTeacherEd25519PublicKey("");
      setTeacherX25519PublicKey("");
      setStatusMessage("Attendance session closed and local companion session keys wiped.");
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
              Time-limited, signed dynamic QR with biometric anti-spoof liveness & Security Guard check-in validation.
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

            <div className="relative rounded-2xl bg-white p-4 shadow-2xl">
              {qrPayload ? (
                <QRCode
                  value={qrPayload}
                  size={240}
                  level="M"
                  className="rounded"
                />
              ) : (
                <div className="flex h-60 w-60 items-center justify-center text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              )}
            </div>

            {/* Countdown Progress */}
            <div className="mt-4 w-full max-w-[240px]">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Rotating Security Signature</span>
                <span className="font-mono text-emerald-400 font-bold">{countdown}s</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${(countdown / 60) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleRefreshQr}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw size={12} />
              Manual Refresh
            </button>

            {/* LAN Companion Info */}
            <div className="mt-6 flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
              <Wifi size={18} className="text-cyan-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200">Local Handshake Server:</span>{" "}
                <span className="font-mono text-cyan-300">
                  {activeSession.localServerIp}:{activeSession.localServerPort}
                </span>
                <p className="text-[11px] text-slate-500">
                  Proximity handshake verified over campus local network.
                </p>
              </div>
            </div>
          </div>

          {/* Session Overview & Live Student Roster */}
          <div className="space-y-6 lg:col-span-7">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
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
                    <p className="text-sm">Awaiting student scans...</p>
                    <p className="text-xs">Students must complete face liveness and guard check-in to appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Setup / Start Attendance Form */
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Start New Attendance Session</h2>
            <p className="mt-1 text-sm text-slate-400">
              Select class, section, and subject to generate the secure attendance session.
            </p>
          </div>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Academic Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {filters.academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Course / Program
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {filters.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Subject / Module
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {filters.subjects.map((sb) => (
                    <option key={sb.id} value={sb.id}>
                      {sb.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Lecture Hall / Room
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. LH-201"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Companion LAN IP
                </label>
                <input
                  type="text"
                  value={localIp}
                  onChange={(e) => setLocalIp(e.target.value)}
                  placeholder="e.g. 192.168.1.100"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  HTTPS Port
                </label>
                <input
                  type="number"
                  value={localPort}
                  onChange={(e) => setLocalPort(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  HTTPS Companion Cryptographic Pairing
                </span>
                {companionConnected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                    <CheckCircle2 size={12} /> Keys Paired
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Allowed Private Subnets (CIDR CSV)
                  </label>
                  <input
                    type="text"
                    value={allowedSubnets}
                    onChange={(e) => setAllowedSubnets(e.target.value)}
                    placeholder="192.168.1.0/24"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Companion Admin Control Token
                  </label>
                  <input
                    type="password"
                    value={companionAdminToken}
                    onChange={(e) => setCompanionAdminToken(e.target.value)}
                    placeholder="Paste ephemeral token from terminal..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleConnectCompanion}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                >
                  <Wifi size={14} /> Connect &amp; Fetch Companion Keys
                </button>
                {certFingerprint && (
                  <span className="font-mono text-[10px] text-slate-400">
                    TLS SHA-256: {certFingerprint.slice(0, 29)}...
                  </span>
                )}
              </div>
              {teacherEd25519PublicKey && (
                <p className="font-mono text-[11px] text-emerald-300 truncate">
                  Ed25519 Pin: {teacherEd25519PublicKey}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50"
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
      )}
    </div>
  );
}
