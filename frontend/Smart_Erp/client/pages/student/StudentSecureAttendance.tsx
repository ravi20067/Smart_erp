import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wifi,
  QrCode,
  RefreshCw,
  Sparkles,
  UserCheck,
  History,
  ArrowRight,
  Eye,
  BookOpen,
} from "lucide-react";
import {
  startStudentVerification,
  submitChallengeFrames,
  requestStudentHandshakeTicket,
  verifyLocalHandshake,
  getStudentActiveAttendanceSessions,
  getStudentAttendanceHistory,
  type StudentActiveAttendanceSession,
  type StudentVerificationStartResponse,
  type ChallengeSubmissionResponse,
  type StudentAttendanceHistoryItem,
} from "@/services/attendanceService";
import campusCheckInService, { type CampusStatusResponse } from "@/services/campusCheckInService";
import { generateEphemeralStudentKeys } from "@/services/handshakeCrypto";
import { performStudentWebRtcHandshake } from "@/services/webrtcHandshake";
import { studentPortalService, type StudentFaceTemplateSummary } from "@/services/studentPortalService";
import useAttendanceWebSocket, { type AttendanceSocketMessage } from "@/hooks/useAttendanceWebSocket";

type WorkflowStep = "FACE_LIVENESS" | "SCAN_TEACHER_QR" | "HANDSHAKE" | "ATTENDANCE_SUCCESS";

export default function StudentSecureAttendance() {
  const [studentProfile, setStudentProfile] = useState<{ studentId: number; hasEnrolledFace: boolean; fullName: string } | null>(null);
  const [faceTemplate, setFaceTemplate] = useState<StudentFaceTemplateSummary | null>(null);
  const [campusStatus, setCampusStatus] = useState<CampusStatusResponse | null>(null);
  const [activeSessions, setActiveSessions] = useState<StudentActiveAttendanceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState<WorkflowStep>("FACE_LIVENESS");
  const [activeTab, setActiveTab] = useState<"ATTEND" | "HISTORY">("ATTEND");

  // Session & Face Verification state (Step 1)
  const [selectedSession, setSelectedSession] = useState<StudentActiveAttendanceSession | null>(null);
  const [sessionUuid, setSessionUuid] = useState<string>("");
  const [verificationSession, setVerificationSession] = useState<StudentVerificationStartResponse | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<string>("LOOK_STRAIGHT");
  const [challengeDescription, setChallengeDescription] = useState<string>("Look straight at the camera");
  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [totalChallenges, setTotalChallenges] = useState<number>(3);
  const [facePassed, setFacePassed] = useState(false);
  const [identityScore, setIdentityScore] = useState<number | null>(null);

  // Scanned Teacher QR state (Step 2)
  const [manualQrJson, setManualQrJson] = useState<string>("");

  // WebRTC & Final Token Receipt state (Step 3 -> Step 4)
  const [webrtcStage, setWebrtcStage] = useState<string>("Initializing direct WebRTC P2P handshake...");
  const [receiptId, setReceiptId] = useState<string | null>(null);

  // History state
  const [historyList, setHistoryList] = useState<StudentAttendanceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Camera video refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshPreFlightAndSessions = async () => {
    setSessionsLoading(true);
    try {
      const [res, tpl, campus, sessions] = await Promise.all([
        studentPortalService.getProfileSummary(),
        studentPortalService.getFaceTemplate().catch(() => null),
        campusCheckInService.getStudentStatus().catch(() => null),
        getStudentActiveAttendanceSessions().catch(() => []),
      ]);
      setStudentProfile({
        studentId: res.studentId,
        hasEnrolledFace: Boolean(tpl?.hasEnrolledFace ?? res.hasEnrolledFace),
        fullName: res.fullName,
      });
      if (tpl) setFaceTemplate(tpl);
      if (campus) setCampusStatus(campus);
      setActiveSessions(sessions);
      if (!selectedSession && sessions.length === 1) {
        setSelectedSession(sessions[0]);
        setSessionUuid(sessions[0].sessionUuid);
      }
    } catch {
      // ignore mount transient failure
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    refreshPreFlightAndSessions();
    return () => {
      stopCamera();
    };
  }, []);

  // Subscribe to personal Student WebSocket events
  useAttendanceWebSocket({
    topic: studentProfile?.studentId ? `/topic/attendance/student/${studentProfile.studentId}` : "",
    enabled: !!studentProfile?.studentId,
    onMessage: (msg: AttendanceSocketMessage) => {
      if (msg.eventType === "ATTENDANCE_MARKED") {
        setCurrentStep("ATTENDANCE_SUCCESS");
        setFeedbackMessage(msg.message || "Attendance officially recorded!");
      }
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorMessage("Camera access is required for biometric liveness and identity verification.");
    }
  };

  const stopCamera = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Step 1: Start Liveness + Face Identity Verification FIRST for selected active session
  const handleStartLivenessFirst = async (target: StudentActiveAttendanceSession) => {
    if (loading) return;
    setSelectedSession(target);
    setSessionUuid(target.sessionUuid);
    setErrorMessage(null);
    setFeedbackMessage(null);

    if (target.alreadyMarked) {
      setCurrentStep("ATTENDANCE_SUCCESS");
      setFeedbackMessage(`Attendance already marked PRESENT for ${target.subjectName}.`);
      return;
    }

    if (target.faceVerified) {
      setFacePassed(true);
      if (target.matchedSimilarity) setIdentityScore(target.matchedSimilarity);
      setCurrentStep("SCAN_TEACHER_QR");
      setFeedbackMessage("Face liveness & template identity already verified for this class. Scan the Teacher QR.");
      return;
    }

    setLoading(true);
    try {
      const vSession = await startStudentVerification(target.sessionUuid);
      setVerificationSession(vSession);
      setCurrentChallenge(vSession.currentChallenge);
      setChallengeDescription(vSession.challengeDescription);
      setChallengeIndex(vSession.challengeIndex);
      setTotalChallenges(vSession.totalChallenges);
      setFacePassed(false);
      setCurrentStep("FACE_LIVENESS");
      await startCamera();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to start biometric liveness check");
    } finally {
      setLoading(false);
    }
  };

  // Continuous Frame Capture Loop during Step 1 (Liveness + Old Enrolled Face Match)
  useEffect(() => {
    if (currentStep !== "FACE_LIVENESS" || !verificationSession) return;

    let seq = 1;
    let isSubmitting = false;

    captureIntervalRef.current = setInterval(async () => {
      if (isSubmitting || !videoRef.current || videoRef.current.readyState < 2) return;

      isSubmitting = true;
      try {
        const blobs = await captureFrameBatch(videoRef.current, 3);
        if (blobs.length > 0) {
          const res: ChallengeSubmissionResponse = await submitChallengeFrames(
            verificationSession.verificationSessionId,
            currentChallenge,
            seq++,
            blobs
          );

          if (res.accepted) {
            if (res.allChallengesPassed) {
              stopCamera();
              if (res.identitySimilarity) {
                setIdentityScore(res.identitySimilarity);
              }
              if (res.identityMatched === false || res.status === "IDENTITY_MISMATCH") {
                setErrorMessage(res.message || "Face did not match your enrolled template. Retry liveness.");
                setVerificationSession(null);
                return;
              }
              // Step 1 Passed -> Unlock Step 2 (Scan Teacher QR)!
              setFacePassed(true);
              setVerificationSession(null);
              setFeedbackMessage(
                `Liveness & enrolled template matched${res.identitySimilarity ? ` (${(res.identitySimilarity * 100).toFixed(0)}%)` : ""}! Now scan the Teacher's Attendance QR.`
              );
              setCurrentStep("SCAN_TEACHER_QR");
            } else if (res.nextChallenge) {
              setCurrentChallenge(res.nextChallenge);
              setChallengeDescription(res.nextChallengeDescription || res.nextChallenge);
              setChallengeIndex(res.currentChallengeIndex);
              setFeedbackMessage(`Passed! Now: ${res.nextChallengeDescription || res.nextChallenge}`);
            }
          } else {
            setFeedbackMessage(res.message);
          }
        }
      } catch (err: any) {
        if (err.response?.data?.message) {
          setErrorMessage(err.response.data.message);
        }
      } finally {
        isSubmitting = false;
      }
    }, 1500);

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [currentStep, verificationSession, currentChallenge]);

  const captureFrameBatch = async (video: HTMLVideoElement, count: number): Promise<Blob[]> => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const blobs: Blob[] = [];
    for (let i = 0; i < count; i++) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
      );
      if (blob) blobs.push(blob);
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    return blobs;
  };

  // Step 2 -> Step 3 -> Step 4: Scan Teacher QR -> WebRTC P2P Handshake -> Receive Teacher Final Token -> Verify & Mark PRESENT
  const handleTeacherQrScanAndHandshake = async (rawCode: string) => {
    if (!rawCode || loading) return;
    if (!facePassed) {
      setErrorMessage("Complete Step 1 (Biometric Liveness & Enrolled Face Match) before scanning Teacher QR.");
      setCurrentStep("FACE_LIVENESS");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawCode);
      } catch {
        throw new Error("Please scan or paste the full signed JSON payload from the Teacher QR.");
      }

      const qrSessionUuid = parsed.sessionId || parsed.sessionUuid;
      const qrTeacherId = parsed.teacherId ? Number(parsed.teacherId) : undefined;
      if (!qrSessionUuid || !qrTeacherId || !parsed.teacherEd25519PublicKey || !parsed.teacherX25519PublicKey || !parsed.signature) {
        throw new Error("Invalid Teacher QR payload: missing cryptographic keys or signature. Re-scan the live QR.");
      }

      if (sessionUuid && qrSessionUuid !== sessionUuid) {
        throw new Error("Scanned QR belongs to a different session than your face-verified class.");
      }

      const activeUuid = qrSessionUuid;
      setSessionUuid(activeUuid);
      setCurrentStep("HANDSHAKE");
      setWebrtcStage("Requesting single-use Spring Boot cryptographic ticket...");

      // 1. Generate ephemeral Ed25519 + X25519 keys strictly in browser RAM
      const ephemeral = await generateEphemeralStudentKeys();

      // 2. Obtain Spring Boot Ed25519-signed single-use ticket
      const ticket = await requestStudentHandshakeTicket({
        sessionUuid: activeUuid,
        studentEd25519PublicKey: ephemeral.ed25519PublicKeyBase64,
        studentX25519PublicKey: ephemeral.x25519PublicKeyBase64,
        studentNonce: ephemeral.studentNonce,
      });

      // 3. Direct WebRTC P2P Handshake over Wi-Fi or Teacher's Hotspot -> Teacher emits Final Signed Attendance Token
      setWebrtcStage("Connecting directly to Teacher browser via WebRTC (Wi-Fi / Hotspot)...");
      const rtcReceipt = await performStudentWebRtcHandshake({
        sessionUuid: activeUuid,
        teacherId: qrTeacherId,
        teacherEd25519PublicKey: parsed.teacherEd25519PublicKey,
        teacherX25519PublicKey: parsed.teacherX25519PublicKey,
        allowedSubnets: parsed.allowedSubnets || undefined,
        ticket,
        studentKeys: ephemeral,
        onProgress: (stage) => setWebrtcStage(stage),
      });

      setWebrtcStage("Submitting Teacher's Final Signed Token to Spring Boot for attendance marking...");
      const verifyRes = await verifyLocalHandshake({
        sessionUuid: activeUuid,
        teacherId: qrTeacherId,
        studentRef: ticket.studentRef,
        ticketId: ticket.ticketId,
        nonce: parsed.nonce || "",
        teacherNonce: rtcReceipt.teacherNonce,
        studentNonce: ticket.studentNonce,
        timestamp: parsed.timestamp || Date.now(),
        expiresAt: parsed.expiresAt || (parsed.timestamp ? parsed.timestamp + 60000 : Date.now() + 60000),
        studentProofTimestamp: rtcReceipt.studentProofTimestamp,
        receiptIssuedAt: rtcReceipt.receiptIssuedAt,
        receiptExpiresAt: rtcReceipt.receiptExpiresAt,
        qrSignature: parsed.signature || "",
        clientIp: rtcReceipt.clientIp,
        iceCandidateType: rtcReceipt.iceCandidateType,
        companionReceiptId: rtcReceipt.companionReceiptId,
        teacherEd25519PublicKey: parsed.teacherEd25519PublicKey,
        teacherX25519PublicKey: parsed.teacherX25519PublicKey,
        studentEd25519PublicKey: ticket.studentEd25519PublicKey,
        studentX25519PublicKey: ticket.studentX25519PublicKey,
        teacherReceiptSignature: rtcReceipt.teacherReceiptSignature,
        studentProofSignature: rtcReceipt.studentProofSignature,
        receiptHmac: rtcReceipt.receiptHmac,
      });

      setReceiptId(verifyRes.receiptId);
      setFeedbackMessage(verifyRes.message || "Teacher WebRTC token verified & attendance marked PRESENT!");
      setCurrentStep("ATTENDANCE_SUCCESS");
      refreshPreFlightAndSessions();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "WebRTC local/hotspot handshake failed");
      setCurrentStep("SCAN_TEACHER_QR");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getStudentAttendanceHistory();
      setHistoryList(data);
    } catch (err) {
      console.error("Failed to load attendance history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#0a1e36] via-[#091526] to-[#120f26] p-6 sm:p-8 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <ShieldCheck size={14} />
              Biometric First • WebRTC Wi-Fi &amp; Hotspot Attendance
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Student Attendance Portal
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              1. Liveness &amp; Face Match → 2. Scan Teacher QR → 3. WebRTC Token Handshake → 4. Attendance Marked
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab("ATTEND");
                refreshPreFlightAndSessions();
              }}
              className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === "ATTEND"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => {
                setActiveTab("HISTORY");
                loadHistory();
              }}
              className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === "HISTORY"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              My Attendance History
            </button>
          </div>
        </div>
      </section>

      {/* Pre-Flight Campus Check-In & Biometric Readiness Status */}
      {campusStatus && !campusStatus.hasActiveOpenCheckIn && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Campus Gate Check-In Required First</p>
              <p className="mt-0.5 text-slate-300">
                Verify your entry with the Security Guard at the Campus Gate before marking classroom attendance.
              </p>
            </div>
          </div>
          <Link
            to="/student/campus-pass"
            className="rounded-xl bg-rose-600 px-3.5 py-2 font-bold text-white hover:bg-rose-700"
          >
            Open Campus Pass
          </Link>
        </div>
      )}
      {studentProfile && !studentProfile.hasEnrolledFace && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
          <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300">Face Biometric Template Not Registered Yet</p>
            <p className="mt-0.5 text-slate-300">
              Your 128-D face biometric embedding has not been registered by the Super Admin / Registrar yet.
            </p>
          </div>
        </div>
      )}
      {studentProfile && studentProfile.hasEnrolledFace && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="shrink-0 text-emerald-400" />
            <span>
              Biometric Profile Verified • {faceTemplate?.dimension || 128}-D {faceTemplate?.algorithm || "SFACE"} face template active for {studentProfile.fullName}
            </span>
          </div>
          {faceTemplate?.enrolledAt && (
            <span className="font-mono text-[11px] text-emerald-400/80">
              Enrolled {new Date(faceTemplate.enrolledAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Notifications */}
      {typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
          <AlertCircle size={16} className="shrink-0 text-amber-400 mt-0.5" />
          <span>
            Webcam access requires HTTPS (or <code className="font-mono">localhost</code>). Start frontend with <code className="font-mono">VITE_HTTPS=true</code> on LAN devices for webcam capture.
          </span>
        </div>
      )}
      {feedbackMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
          <Sparkles size={18} className="shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "HISTORY" ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-bold text-white">Attendance Records</h2>
          {historyLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : historyList.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {historyList.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{item.subjectName}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 size={11} />
                        {item.status}
                      </span>
                    </div>
                    <p className="text-slate-400">
                      {item.attendanceDate} • <span className="font-mono">{item.checkInTime}</span>
                    </p>
                    <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/70">
                      <span>{item.sectionName} • {item.teacherName}</span>
                      <span className="font-mono text-emerald-400">
                        {item.similarityScore ? `${(item.similarityScore * 100).toFixed(0)}% Match` : "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Teacher</th>
                      <th className="py-3 px-4">Biometric Match</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-medium text-white">{item.attendanceDate}</td>
                        <td className="py-3 px-4 font-mono text-xs">{item.checkInTime}</td>
                        <td className="py-3 px-4">{item.subjectName}</td>
                        <td className="py-3 px-4">{item.sectionName}</td>
                        <td className="py-3 px-4">{item.teacherName}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">
                          {item.similarityScore ? `${(item.similarityScore * 100).toFixed(0)}%` : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 size={12} />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <History size={36} className="mx-auto mb-2 opacity-30" />
              <p>No past attendance records found.</p>
            </div>
          )}
        </div>
      ) : (
        /* Workflow Container */
        <div className="mx-auto max-w-2xl">
          {/* 4-Step Ordered Breadcrumb */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs font-semibold text-slate-400 sm:grid-cols-4 sm:gap-1">
            <span className={`rounded-xl px-2.5 py-1.5 text-center ${currentStep === "FACE_LIVENESS" ? "bg-blue-600/20 text-blue-300 border border-blue-500/30" : facePassed ? "text-emerald-400" : ""}`}>
              1. Liveness &amp; Face
            </span>
            <span className={`rounded-xl px-2.5 py-1.5 text-center ${currentStep === "SCAN_TEACHER_QR" ? "bg-blue-600/20 text-blue-300 border border-blue-500/30" : currentStep === "HANDSHAKE" || currentStep === "ATTENDANCE_SUCCESS" ? "text-emerald-400" : ""}`}>
              2. Scan QR
            </span>
            <span className={`rounded-xl px-2.5 py-1.5 text-center ${currentStep === "HANDSHAKE" ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30" : currentStep === "ATTENDANCE_SUCCESS" ? "text-emerald-400" : ""}`}>
              3. WebRTC Token
            </span>
            <span className={`rounded-xl px-2.5 py-1.5 text-center ${currentStep === "ATTENDANCE_SUCCESS" ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30" : ""}`}>
              4. Marked Present
            </span>
          </div>

          {/* STEP 1: Liveness Checking & Old Embedded Template Verification */}
          {currentStep === "FACE_LIVENESS" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl">
              {verificationSession ? (
                <div className="text-center">
                  <div className="mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      Step 1 of 4 • Challenge {challengeIndex + 1} of {totalChallenges}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{challengeDescription}</h2>
                    <p className="text-xs text-slate-400">
                      Complete active liveness — Python Face AI matches your live face with your stored enrolled template.
                    </p>
                  </div>

                  <div className="relative mx-auto aspect-square w-64 sm:w-80 overflow-hidden rounded-full border-4 border-blue-500 bg-black shadow-2xl">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover -scale-x-100"
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
                      <Eye size={18} className="animate-pulse" />
                      Action: <span className="font-mono uppercase">{currentChallenge}</span>
                    </div>
                    <button
                      onClick={() => {
                        stopCamera();
                        setVerificationSession(null);
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                        Step 1 of 4 • Biometric Verification First
                      </span>
                      <h2 className="text-xl font-bold text-white">Select Active Class &amp; Verify Face</h2>
                      <p className="mt-1 text-xs text-slate-400">
                        Pass live anti-spoof challenges &amp; 128-D face match against your enrolled template first to unlock Teacher QR scanning.
                      </p>
                    </div>
                    <button
                      onClick={refreshPreFlightAndSessions}
                      disabled={sessionsLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      <RefreshCw size={13} className={sessionsLoading ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>

                  {sessionsLoading ? (
                    <div className="flex h-32 items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                    </div>
                  ) : activeSessions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 text-center text-slate-400">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold text-slate-300">No Active Class Session Right Now</p>
                      <p className="mt-1 text-xs">
                        Ask your faculty member to start an attendance session for your enrolled section, then click Refresh.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSessions.map((sess) => (
                        <div
                          key={sess.sessionUuid}
                          className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white">{sess.subjectName}</span>
                              {sess.alreadyMarked && (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  ALREADY MARKED
                                </span>
                              )}
                              {!sess.alreadyMarked && sess.faceVerified && (
                                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                                  FACE VERIFIED
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {sess.courseName} • {sess.sectionName} • {sess.teacherName} • Room {sess.roomNumber || "Class"}
                            </p>
                          </div>

                          <button
                            onClick={() => handleStartLivenessFirst(sess)}
                            disabled={loading || !sess.campusCheckInOpen || !studentProfile?.hasEnrolledFace}
                            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"
                          >
                            {sess.alreadyMarked ? (
                              <>
                                <CheckCircle2 size={15} />
                                View Status
                              </>
                            ) : sess.faceVerified ? (
                              <>
                                <QrCode size={15} />
                                Proceed to Scan QR
                              </>
                            ) : (
                              <>
                                <Camera size={15} />
                                Start Liveness &amp; Face Check
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Scan Teacher QR (Unlocked ONLY after Liveness + Enrolled Face Verification Passes) */}
          {currentStep === "SCAN_TEACHER_QR" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 text-center shadow-xl">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Step 2 of 4 • Biometric Verified{identityScore ? ` (${(identityScore * 100).toFixed(0)}% Match)` : ""}
                </span>
                <h2 className="text-xl font-bold text-white">Scan Teacher Attendance QR</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Scan your Teacher&apos;s rotating signed QR to begin the direct WebRTC Wi-Fi / Hotspot handshake and receive the final attendance token.
                </p>
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-dashed border-blue-500/40 bg-black/40">
                <Scanner
                  onScan={(codes) => {
                    if (codes && codes.length > 0 && codes[0].rawValue) {
                      handleTeacherQrScanAndHandshake(codes[0].rawValue);
                    }
                  }}
                />
              </div>

              <div className="mt-6 border-t border-slate-800 pt-4 text-left">
                <p className="text-xs text-slate-400 mb-2">Or paste signed Teacher QR JSON manually:</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={manualQrJson}
                    onChange={(e) => setManualQrJson(e.target.value)}
                    placeholder='Paste signed Teacher QR JSON {"sessionId":...}'
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleTeacherQrScanAndHandshake(manualQrJson)}
                    disabled={!manualQrJson.trim() || loading}
                    className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Connect WebRTC
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Direct WebRTC Handshake + Teacher Final Signed Attendance Token */}
          {currentStep === "HANDSHAKE" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10 text-center">
              <Wifi size={48} className="mx-auto mb-4 animate-bounce text-cyan-400" />
              <h2 className="text-xl font-bold text-white">WebRTC Local / Hotspot Handshake</h2>
              <p className="mt-2 text-xs text-slate-300">{webrtcStage}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Direct browser-to-browser DTLS WebRTC DataChannel (Ed25519 + X25519/HKDF, <code className="font-mono">iceServers: []</code>). Teacher device signs and issues your final attendance token upon proximity proof.
              </p>
              <div className="mt-6 flex justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
              </div>
            </div>
          )}

          {/* STEP 4: Final Attendance Success (Marked immediately upon Teacher WebRTC token verification!) */}
          {currentStep === "ATTENDANCE_SUCCESS" && (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={48} />
              </div>

              <h2 className="text-2xl font-black text-white">Attendance Marked PRESENT!</h2>
              <p className="mt-2 text-sm text-slate-300">
                Verified end-to-end across Campus Gate Entry, Active Biometric Liveness &amp; Face Template Match, Teacher Signed QR, and WebRTC P2P Final Teacher Token.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                {identityScore && (
                  <div className="rounded-xl bg-slate-900/60 px-3.5 py-2 text-emerald-400 border border-emerald-500/30">
                    Face Match: {(identityScore * 100).toFixed(1)}%
                  </div>
                )}
                {receiptId && (
                  <div className="rounded-xl bg-slate-900/60 px-3.5 py-2 text-cyan-300 border border-cyan-500/30">
                    Token Receipt: {receiptId}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setCurrentStep("FACE_LIVENESS");
                    setFacePassed(false);
                    setActiveTab("HISTORY");
                    loadHistory();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  View Attendance History
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
