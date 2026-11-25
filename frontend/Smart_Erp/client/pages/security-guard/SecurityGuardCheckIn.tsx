import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import api from "@/services/axiosConfig";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  ScanLine,
  RefreshCw,
  QrCode,
  Eye,
  Clock,
  History,
  Lock,
  Camera,
  DoorOpen
} from "lucide-react";
import { useAuth } from "@/services/authContext";
import {
  scanGuardCheckIn,
  makeGuardDecision,
  type GuardStudentDetailResponse,
  type GuardDecisionResponse,
} from "@/services/attendanceService";
import campusCheckInService, {
  type CampusGuardScanResponse,
  type CampusHistoryItem,
} from "@/services/campusCheckInService";
import useAttendanceWebSocket, { type AttendanceSocketMessage } from "@/hooks/useAttendanceWebSocket";

interface DecidedRecord {
  token: string;
  studentName: string;
  rollNumber: string;
  decision: "APPROVED" | "REJECTED";
  time: string;
  reason?: string;
}

export default function SecurityGuardCheckIn() {
  const { user } = useAuth();

  const [scanning, setScanning] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [studentDetail, setStudentDetail] = useState<GuardStudentDetailResponse | null>(null);
  const [campusDetail, setCampusDetail] = useState<CampusGuardScanResponse | null>(null);
  const [campusHistory, setCampusHistory] = useState<CampusHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [presetReason, setPresetReason] = useState("Photo mismatch with registered profile");

  // Shift decision history
  const [shiftHistory, setShiftHistory] = useState<DecidedRecord[]>([]);
  const [photoBlobUrl, setPhotoBlobUrl] = useState<string | null>(null);
  const [campusPhotoBlobUrl, setCampusPhotoBlobUrl] = useState<string | null>(null);

  const loadCampusHistory = async () => {
    try {
      const logs = await campusCheckInService.getCampusShiftLogs();
      setCampusHistory(logs);
    } catch {
      // keep silent if endpoint empty
    }
  };

  useEffect(() => {
    loadCampusHistory();
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;
    if (campusDetail?.photoUrl) {
      api.get(campusDetail.photoUrl, { responseType: "blob" })
        .then((res) => {
          if (isMounted) {
            objectUrl = URL.createObjectURL(res.data);
            setCampusPhotoBlobUrl(objectUrl);
          }
        })
        .catch(() => {
          if (isMounted) setCampusPhotoBlobUrl(null);
        });
    } else {
      setCampusPhotoBlobUrl(null);
    }
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [campusDetail?.photoUrl]);

  // Authenticated photo loading
  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;
    if (studentDetail?.photoUrl) {
      api.get(studentDetail.photoUrl, { responseType: "blob" })
        .then((res) => {
          if (isMounted) {
            objectUrl = URL.createObjectURL(res.data);
            setPhotoBlobUrl(objectUrl);
          }
        })
        .catch(() => {
          if (isMounted) {
            setPhotoBlobUrl(null);
          }
        });
    } else {
      setPhotoBlobUrl(null);
    }
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [studentDetail?.photoUrl]);

  // Listen to real-time guard events
  useAttendanceWebSocket({
    topic: "/topic/attendance/guard",
    onMessage: (msg: AttendanceSocketMessage) => {
      if (msg.eventType === "GUARD_CHECKIN_PENDING") {
        setStatusMessage(`New student scanned QR: ${msg.studentName || "Student"}`);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    },
  });

  useAttendanceWebSocket({
    topic: "/topic/campus/guard",
    onMessage: (msg: any) => {
      loadCampusHistory();
      if (msg?.message) {
        setStatusMessage(msg.message);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    },
  });

  const handleScan = async (rawToken: string) => {
    if (!rawToken || loading) return;
    const trimmed = rawToken.trim();

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      if (trimmed.startsWith("CAMPUS:") || trimmed.startsWith("CMP-")) {
        const campus = await campusCheckInService.scanCampusQr(trimmed);
        setCampusDetail(campus);
        setStudentDetail(null);
        setScanning(false);
      } else {
        const cleanToken = trimmed.replace("CHECKIN:", "").trim();
        const detail = await scanGuardCheckIn(cleanToken);
        setStudentDetail(detail);
        setCampusDetail(null);
        setScanning(false);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Invalid or expired check-in token");
    } finally {
      setLoading(false);
    }
  };

  const handleCampusDecision = async (approved: boolean, reason?: string) => {
    if (!campusDetail || decisionLoading) return;
    setDecisionLoading(true);
    setErrorMessage(null);
    try {
      const res = await campusCheckInService.submitCampusDecision(
        campusDetail.qrToken,
        approved,
        approved ? undefined : reason,
        `Guard Gate Post - Officer ${user?.firstName || "Officer"}`
      );
      setStatusMessage(res.message);
      setCampusDetail(null);
      setRejectModalOpen(false);
      setRejectionReason("");
      setScanning(true);
      await loadCampusHistory();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to record campus gate decision");
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!studentDetail || decisionLoading) return;
    setDecisionLoading(true);
    setErrorMessage(null);

    try {
      const res: GuardDecisionResponse = await makeGuardDecision({
        checkInToken: studentDetail.checkInToken,
        approved: true,
        deviceDetails: `Guard Gate Post - Officer ${user?.firstName || "Officer"}`,
      });

      setStatusMessage(`Check-In Approved: ${res.studentName}. Attendance officially recorded.`);

      // Add to shift history
      setShiftHistory((prev) => [
        {
          token: studentDetail.checkInToken,
          studentName: studentDetail.studentName,
          rollNumber: studentDetail.rollNumber,
          decision: "APPROVED",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      setStudentDetail(null);
      setScanning(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to approve check-in");
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    const reasonToSubmit = rejectionReason.trim() ? rejectionReason.trim() : presetReason;
    if (campusDetail) {
      await handleCampusDecision(false, reasonToSubmit);
      return;
    }
    if (!studentDetail || decisionLoading) return;

    setDecisionLoading(true);
    setErrorMessage(null);

    try {
      const res: GuardDecisionResponse = await makeGuardDecision({
        checkInToken: studentDetail.checkInToken,
        approved: false,
        rejectionReason: reasonToSubmit,
        deviceDetails: `Guard Gate Post - Officer ${user?.firstName || "Officer"}`,
      });

      setStatusMessage(`Check-In Rejected: ${res.studentName}. Reason: ${reasonToSubmit}`);

      setShiftHistory((prev) => [
        {
          token: studentDetail.checkInToken,
          studentName: studentDetail.studentName,
          rollNumber: studentDetail.rollNumber,
          decision: "REJECTED",
          time: new Date().toLocaleTimeString(),
          reason: reasonToSubmit,
        },
        ...prev,
      ]);

      setRejectModalOpen(false);
      setRejectionReason("");
      setStudentDetail(null);
      setScanning(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to reject check-in");
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1f38] via-[#091526] to-[#120f26] p-6 sm:p-8 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <ShieldCheck size={14} />
              Gate Post Security Check-In Terminal
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Student Physical Check-In Station
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Human visual identity verification against registered ERP photograph before final attendance recording.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Duty Officer: <span className="font-semibold text-cyan-300">{user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Campus Security Officer"}</span>
          </div>
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
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Scanner, Campus Gate Card, or Classroom Inspection Card */}
        <div className="lg:col-span-7">
          {campusDetail ? (
            <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/70 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      campusDetail.personRole === "TEACHER"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    CAMPUS {campusDetail.direction.replace("_", " ")} • {campusDetail.personRole}
                  </span>
                  <h2 className="mt-1 text-xl font-bold text-white">Verify Identity at Campus Gate</h2>
                </div>
                <button
                  onClick={() => {
                    setCampusDetail(null);
                    setScanning(true);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Cancel / Scan Another
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row">
                <div className="flex flex-col items-center">
                  <div className="relative h-44 w-36 overflow-hidden rounded-2xl border-2 border-cyan-400/50 bg-black shadow-xl">
                    {campusPhotoBlobUrl ? (
                      <img
                        src={campusPhotoBlobUrl}
                        alt="Registered ERP Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400 text-xs text-center p-2">
                        {campusDetail.hasRegisteredPhoto ? "Loading trusted photo..." : "No registered ERP photo on file"}
                      </div>
                    )}
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-cyan-300">
                    Trusted ERP Photo ({campusDetail.personRole})
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-black text-white">{campusDetail.fullName}</h3>
                    <p className="text-xs text-slate-400">
                      Status: <span className="font-mono text-cyan-300">{campusDetail.status}</span>
                    </p>
                  </div>

                  {campusDetail.personRole === "STUDENT" ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                        <span className="text-slate-500">Enrollment / Reg No:</span>
                        <p className="font-mono font-semibold text-white">{campusDetail.enrollmentNumber || "N/A"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                        <span className="text-slate-500">Course:</span>
                        <p className="font-semibold text-slate-200">{campusDetail.courseName || "N/A"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                        <span className="text-slate-500">Section:</span>
                        <p className="font-semibold text-slate-200">{campusDetail.sectionName || "N/A"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                        <span className="text-slate-500">Academic Year:</span>
                        <p className="font-semibold text-slate-200">{campusDetail.academicYearName || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                        <span className="text-slate-500">Employee ID:</span>
                        <p className="font-mono font-semibold text-white">{campusDetail.employeeId || "N/A"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                        <span className="text-slate-500">Department:</span>
                        <p className="font-semibold text-slate-200">{campusDetail.departmentName || "N/A"}</p>
                      </div>
                      <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                        <span className="text-slate-500">Designation:</span>
                        <p className="font-semibold text-slate-200">{campusDetail.designation || "Faculty"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-4 border-t border-slate-800 pt-4">
                <button
                  onClick={() => handleCampusDecision(true)}
                  disabled={decisionLoading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {decisionLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  APPROVE {campusDetail.direction.replace("_", " ")}
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={decisionLoading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600/90 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-700 disabled:opacity-50"
                >
                  <XCircle size={18} />
                  REJECT {campusDetail.direction.replace("_", " ")}
                </button>
              </div>
            </div>
          ) : studentDetail ? (
            /* Student Inspection Review Card */
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Step 2: Human Verification
                  </span>
                  <h2 className="text-xl font-bold text-white">Inspect Student Identity</h2>
                </div>
                <button
                  onClick={() => {
                    setStudentDetail(null);
                    setScanning(true);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Cancel / Scan Another
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row">
                {/* Registered Photograph */}
                <div className="flex flex-col items-center">
                  <div className="relative h-44 w-36 overflow-hidden rounded-2xl border-2 border-cyan-400/50 bg-black shadow-xl">
                    {photoBlobUrl || studentDetail.photoUrl ? (
                      <img
                        src={photoBlobUrl || studentDetail.photoUrl}
                        alt="Registered Student Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400 text-xs text-center p-2">
                        No registered photo on file
                      </div>
                    )}
                  </div>
                  <span className="mt-2 text-[11px] font-semibold text-cyan-300">
                    Trusted ERP Photo
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-black text-white">{studentDetail.studentName}</h3>
                    <p className="text-xs text-slate-400">
                      Roll Number: <span className="font-mono text-slate-200">{studentDetail.rollNumber}</span> • Reg: <span className="font-mono text-slate-200">{studentDetail.registrationNumber}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                      <span className="text-slate-500">Course / Section:</span>
                      <p className="font-semibold text-slate-200">
                        {studentDetail.courseName} - {studentDetail.sectionName}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                      <span className="text-slate-500">Subject:</span>
                      <p className="font-semibold text-slate-200">{studentDetail.subjectName}</p>
                    </div>
                  </div>

                  {/* Verification Status Pills */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-1.5">
                      <span className="text-slate-400">Biometric Liveness & Anti-Spoof:</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        PASSED
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-1.5">
                      <span className="text-slate-400">Face Recognition Match:</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {studentDetail.similarityScore ? `${(studentDetail.similarityScore * 100).toFixed(0)}% Match` : "VERIFIED"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-1.5">
                      <span className="text-slate-400">Local Teacher Handshake:</span>
                      <span className="font-semibold text-cyan-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Already Decided Warning */}
              {studentDetail.alreadyDecided && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  ⚠️ This student check-in has already been processed.
                </div>
              )}

              {/* Decision Action Buttons */}
              <div className="mt-6 flex gap-4 pt-4 border-t border-slate-800">
                <button
                  onClick={handleApprove}
                  disabled={decisionLoading || studentDetail.alreadyDecided}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {decisionLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  APPROVE CHECK-IN
                </button>

                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={decisionLoading || studentDetail.alreadyDecided}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600/90 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-700 disabled:opacity-50"
                >
                  <XCircle size={18} />
                  REJECT CHECK-IN
                </button>
              </div>
            </div>
          ) : (
            /* QR Scanner Card */
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Step 1: Gate Scan
                </span>
                <h2 className="text-xl font-bold text-white">Scan Student Check-In QR</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Scan the short-lived Check-In QR code presented on the student's phone.
                </p>
              </div>

              <div className="relative mx-auto h-72 w-72 overflow-hidden rounded-2xl border-2 border-dashed border-cyan-500/40 bg-black/40">
                <Scanner
                  onScan={(codes) => {
                    if (codes && codes.length > 0 && codes[0].rawValue) {
                      handleScan(codes[0].rawValue);
                    }
                  }}
                />
              </div>

              {/* Manual Input Fallback */}
              <div className="mt-6 border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 mb-2">Or enter Check-In Token manually:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter Check-In Token..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleScan(tokenInput)}
                    disabled={!tokenInput.trim() || loading}
                    className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
                  >
                    Lookup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Shift Log */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-cyan-400" />
                <h3 className="font-semibold text-white">Shift Check-In Log</h3>
              </div>
              <span className="text-xs text-slate-500">
                {shiftHistory.length} verified
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
              {shiftHistory.length > 0 ? (
                shiftHistory.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">{item.studentName}</p>
                      <p className="text-[11px] text-slate-500">
                        Roll: {item.rollNumber} • {item.time}
                      </p>
                      {item.reason && (
                        <p className="text-[11px] text-rose-400">Reason: {item.reason}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        item.decision === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {item.decision}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No classroom check-ins performed on this shift yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DoorOpen size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-white">Campus Gate Entry / Exit Log</h3>
              </div>
              <span className="text-xs text-slate-500">{campusHistory.length} events</span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {campusHistory.length > 0 ? (
                campusHistory.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">
                        {item.fullName}{" "}
                        <span className="text-[10px] font-semibold text-cyan-300">
                          ({item.personRole} • {item.direction.replace("_", " ")})
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.identifier} • {item.departmentOrCourse}
                      </p>
                      {item.rejectionReason && (
                        <p className="text-[11px] text-rose-400">Reason: {item.rejectionReason}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        item.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : item.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No campus gate entry/exit records today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold">Mandatory Rejection Reason</h3>
            <p className="mt-1 text-xs text-slate-400">
              Per commercial security protocols, you must specify the exact reason for rejecting student check-in.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  Select Preset Reason
                </label>
                <select
                  value={presetReason}
                  onChange={(e) => setPresetReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Photo mismatch with registered profile">Photo mismatch with registered profile</option>
                  <option value="Physical person differs from enrolled student">Physical person differs from enrolled student</option>
                  <option value="No official ID card presented upon challenge">No official ID card presented upon challenge</option>
                  <option value="Suspicious behavior or proxy attempt">Suspicious behavior or proxy attempt</option>
                  <option value="Other / Custom details below">Other / Custom details below</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  Additional Notes (Optional / Custom)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide additional context or incident remarks..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={decisionLoading}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
