import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import QRCode from "react-qr-code";
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wifi,
  QrCode,
  RefreshCw,
  Clock,
  Sparkles,
  UserCheck,
  History,
  Lock,
  ArrowRight,
  Eye,
  RotateCw
} from "lucide-react";
import { useAuth } from "@/services/authContext";
import {
  startStudentVerification,
  submitChallengeFrames,
  requestStudentHandshakeTicket,
  verifyLocalHandshake,
  getStudentCheckInQr,
  getStudentAttendanceHistory,
  type StudentVerificationStartResponse,
  type ChallengeSubmissionResponse,
  type StudentCheckInQRResponse,
  type StudentAttendanceHistoryItem,
} from "@/services/attendanceService";
import campusCheckInService, { type CampusStatusResponse } from "@/services/campusCheckInService";
import {
  generateEphemeralStudentKeys,
  verifyEd25519Signature,
  deriveSessionHmacKey,
  signEd25519,
  computeHmacSha256Base64,
  buildChallengeTranscript,
  buildStudentProofMessage,
  buildCompanionReceiptMessage,
} from "@/services/handshakeCrypto";
import { studentPortalService, type StudentFaceTemplateSummary } from "@/services/studentPortalService";
import useAttendanceWebSocket, { type AttendanceSocketMessage } from "@/hooks/useAttendanceWebSocket";

type WorkflowStep = "SCAN_TEACHER_QR" | "FACE_LIVENESS" | "HANDSHAKE" | "GUARD_CHECKIN_QR" | "ATTENDANCE_SUCCESS" | "HISTORY";

export default function StudentSecureAttendance() {
  const { user } = useAuth();

  const [studentProfile, setStudentProfile] = useState<{ studentId: number; hasEnrolledFace: boolean; fullName: string } | null>(null);
  const [faceTemplate, setFaceTemplate] = useState<StudentFaceTemplateSummary | null>(null);
  const [campusStatus, setCampusStatus] = useState<CampusStatusResponse | null>(null);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("SCAN_TEACHER_QR");
  const [activeTab, setActiveTab] = useState<"ATTEND" | "HISTORY">("ATTEND");

  // Scanned Teacher QR details
  const [sessionUuid, setSessionUuid] = useState<string>("");
  const [teacherId, setTeacherId] = useState<number | undefined>(undefined);
  const [teacherServerIp, setTeacherServerIp] = useState<string>("192.168.1.100");
  const [teacherServerPort, setTeacherServerPort] = useState<number>(8443);
  const [teacherEd25519PublicKey, setTeacherEd25519PublicKey] = useState<string>("");
  const [teacherX25519PublicKey, setTeacherX25519PublicKey] = useState<string>("");
  const [qrNonce, setQrNonce] = useState<string>("");
  const [qrTimestamp, setQrTimestamp] = useState<number>(0);
  const [qrExpiresAt, setQrExpiresAt] = useState<number>(0);
  const [qrSignature, setQrSignature] = useState<string>("");

  // Verification state
  const [verificationSession, setVerificationSession] = useState<StudentVerificationStartResponse | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<string>("LOOK_STRAIGHT");
  const [challengeDescription, setChallengeDescription] = useState<string>("Look straight at the camera");
  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [totalChallenges, setTotalChallenges] = useState<number>(3);
  const [identityScore, setIdentityScore] = useState<number | null>(null);

  // Guard Check-in state
  const [checkInQrData, setCheckInQrData] = useState<StudentCheckInQRResponse | null>(null);

  // History state
  const [historyList, setHistoryList] = useState<StudentAttendanceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Camera video and canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load authentic Student ID, Campus Check-In status & Biometric Enrollment readiness on mount
  useEffect(() => {
    Promise.all([
      studentPortalService.getProfileSummary(),
      studentPortalService.getFaceTemplate().catch(() => null),
      campusCheckInService.getStudentStatus().catch(() => null),
    ])
      .then(([res, tpl, campus]) => {
        setStudentProfile({
          studentId: res.studentId,
          hasEnrolledFace: Boolean(tpl?.hasEnrolledFace ?? res.hasEnrolledFace),
          fullName: res.fullName,
        });
        if (tpl) setFaceTemplate(tpl);
        if (campus) setCampusStatus(campus);
      })
      .catch(() => {});
  }, []);

  // Subscribe to personal Student WebSocket events using the true Student entity ID
  useAttendanceWebSocket({
    topic: studentProfile?.studentId ? `/topic/attendance/student/${studentProfile.studentId}` : "",
    enabled: !!studentProfile?.studentId,
    onMessage: (msg: AttendanceSocketMessage) => {
      if (msg.eventType === "ATTENDANCE_MARKED") {
        setCurrentStep("ATTENDANCE_SUCCESS");
        setFeedbackMessage(msg.message || "Attendance officially recorded!");
      } else if (msg.eventType === "GUARD_REJECTED") {
        setErrorMessage(msg.message || "Security Guard rejected your check-in.");
      }
    },
  });

  // Stop media stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
    } catch (err: any) {
      setErrorMessage("Camera access is required for biometric face authentication.");
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

  // Step 1: Handle Teacher QR Scan
  const handleTeacherQrScan = async (rawCode: string) => {
    if (!rawCode || loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawCode);
      } catch {
        throw new Error("Please scan or paste the full signed JSON payload from the Teacher QR.");
      }

      const sId = parsed.sessionId || parsed.sessionUuid;
      if (!sId || !parsed.teacherEd25519PublicKey || !parsed.teacherX25519PublicKey || !parsed.signature) {
        throw new Error("Invalid Teacher QR payload: missing cryptographic keys or signature. Re-scan the live QR.");
      }
      setSessionUuid(sId);
      setTeacherId(parsed.teacherId ? Number(parsed.teacherId) : undefined);
      setTeacherServerIp(parsed.localServerIp || "192.168.1.100");
      setTeacherServerPort(parsed.localServerPort || 8443);
      setTeacherEd25519PublicKey(parsed.teacherEd25519PublicKey || "");
      setTeacherX25519PublicKey(parsed.teacherX25519PublicKey || "");
      setQrNonce(parsed.nonce || "");
      setQrTimestamp(parsed.timestamp || Date.now());
      setQrExpiresAt(parsed.expiresAt || (parsed.timestamp ? parsed.timestamp + 60000 : Date.now() + 60000));
      setQrSignature(parsed.signature || "");

      // Initiate Face Verification Session with Spring Boot (validates enrolled template first)
      const vSession = await startStudentVerification(sId);
      setVerificationSession(vSession);
      setCurrentChallenge(vSession.currentChallenge);
      setChallengeDescription(vSession.challengeDescription);
      setChallengeIndex(vSession.challengeIndex);
      setTotalChallenges(vSession.totalChallenges);

      setCurrentStep("FACE_LIVENESS");
      await startCamera();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to initiate verification for this QR");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Continuous Frame Capture Loop during Face Liveness
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
              // Liveness & Identity verification passed!
              stopCamera();
              if (res.identitySimilarity) {
                setIdentityScore(res.identitySimilarity);
              }
              // Proceed to Step 4: Local Network Handshake
              performLocalHandshake();
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

  // Helper to capture a burst of frames from HTML5 Video
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

  // Step 3: Cryptographic HTTPS Local Network Proximity Handshake (Ed25519 + X25519 + HKDF-SHA256)
  const performLocalHandshake = async () => {
    setCurrentStep("HANDSHAKE");
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!teacherEd25519PublicKey || !teacherX25519PublicKey || !teacherId) {
        throw new Error("Teacher QR is missing cryptographic public keys or teacherId. Re-scan the live QR.");
      }

      // 1. Generate ephemeral in-memory student WebCrypto Ed25519 & X25519 keys + CSPRNG nonce
      const ephemeral = await generateEphemeralStudentKeys();

      // 2. Obtain Spring Boot Ed25519-signed single-use handshake ticket
      const ticket = await requestStudentHandshakeTicket({
        sessionUuid,
        studentEd25519PublicKey: ephemeral.ed25519PublicKeyBase64,
        studentX25519PublicKey: ephemeral.x25519PublicKeyBase64,
        studentNonce: ephemeral.studentNonce,
      });

      const companionBase = `https://${teacherServerIp}:${teacherServerPort}`;

      // 3. Challenge Teacher's HTTPS LAN Companion
      let challengeRes: Response;
      try {
        challengeRes = await fetch(`${companionBase}/handshake/challenge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ticket),
        });
      } catch {
        throw new Error(
          `Cannot reach Teacher HTTPS Companion at ${companionBase}. Connect to classroom Wi-Fi (no VPN/proxy), ensure the companion is running, and open ${companionBase}/health once in this browser to accept its ephemeral TLS certificate.`
        );
      }

      const challengeJson = await challengeRes.json();
      if (!challengeRes.ok || !challengeJson.ok) {
        throw new Error(challengeJson.error || "Teacher companion rejected handshake challenge");
      }

      // 4. Verify Teacher's Ed25519 challenge signature against pinned QR key
      if (challengeJson.teacherEd25519PublicKey !== teacherEd25519PublicKey) {
        throw new Error("Security mismatch: Companion Ed25519 public key differs from signed Teacher QR");
      }
      const challengeTranscript = buildChallengeTranscript({
        sessionUuid,
        ticketId: ticket.ticketId,
        studentNonce: ticket.studentNonce,
        teacherNonce: challengeJson.teacherNonce,
        challengeExpiresAt: challengeJson.challengeExpiresAt,
      });
      const challengeSigValid = await verifyEd25519Signature(
        teacherEd25519PublicKey,
        challengeTranscript,
        challengeJson.teacherChallengeSignature
      );
      if (!challengeSigValid) {
        throw new Error("Invalid Ed25519 challenge signature from Teacher Companion");
      }

      // 5. Derive X25519 + HKDF-SHA256 session HMAC key and sign student proof
      const sessionHmacKey = await deriveSessionHmacKey(
        ephemeral.x25519Pair.privateKey,
        teacherX25519PublicKey,
        ticket.ticketId,
        sessionUuid
      );
      const studentProofTimestamp = Date.now();
      const proofMsg = buildStudentProofMessage({
        sessionUuid,
        ticketId: ticket.ticketId,
        studentRef: ticket.studentRef,
        studentNonce: ticket.studentNonce,
        teacherNonce: challengeJson.teacherNonce,
        teacherEd25519PublicKey,
        teacherX25519PublicKey,
        studentProofTimestamp,
      });
      const studentProofSignature = await signEd25519(ephemeral.ed25519Pair.privateKey, proofMsg);
      const studentHmacProof = await computeHmacSha256Base64(sessionHmacKey, proofMsg);

      // 6. Complete handshake with Teacher HTTPS Companion to get signed receipt
      const completeRes = await fetch(`${companionBase}/handshake/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.ticketId,
          studentProofTimestamp,
          studentProofSignature,
          studentHmacProof,
        }),
      });
      const receipt = await completeRes.json();
      if (!completeRes.ok || !receipt.ok) {
        throw new Error(receipt.error || "Teacher companion rejected handshake completion");
      }

      // Verify companion Ed25519 receipt signature before submitting to Spring Boot
      const receiptMsg = buildCompanionReceiptMessage({
        companionReceiptId: receipt.companionReceiptId,
        sessionUuid,
        teacherId,
        studentRef: ticket.studentRef,
        ticketId: ticket.ticketId,
        teacherNonce: receipt.teacherNonce,
        studentNonce: ticket.studentNonce,
        clientIp: receipt.clientIp,
        teacherEd25519PublicKey,
        teacherX25519PublicKey,
        studentEd25519PublicKey: ticket.studentEd25519PublicKey,
        studentX25519PublicKey: ticket.studentX25519PublicKey,
        receiptIssuedAt: receipt.receiptIssuedAt,
        receiptExpiresAt: receipt.receiptExpiresAt,
      });
      const receiptSigValid = await verifyEd25519Signature(
        teacherEd25519PublicKey,
        receiptMsg,
        receipt.teacherReceiptSignature
      );
      if (!receiptSigValid) {
        throw new Error("Companion receipt Ed25519 signature verification failed");
      }

      // 7. Submit signed receipt + cryptographic proof chain to Spring Boot
      await verifyLocalHandshake({
        sessionUuid,
        teacherId,
        studentRef: ticket.studentRef,
        ticketId: ticket.ticketId,
        nonce: qrNonce,
        teacherNonce: receipt.teacherNonce,
        studentNonce: ticket.studentNonce,
        timestamp: qrTimestamp,
        expiresAt: qrExpiresAt,
        studentProofTimestamp,
        receiptIssuedAt: receipt.receiptIssuedAt,
        receiptExpiresAt: receipt.receiptExpiresAt,
        qrSignature,
        clientIp: receipt.clientIp,
        companionReceiptId: receipt.companionReceiptId,
        teacherEd25519PublicKey,
        teacherX25519PublicKey,
        studentEd25519PublicKey: ticket.studentEd25519PublicKey,
        studentX25519PublicKey: ticket.studentX25519PublicKey,
        teacherReceiptSignature: receipt.teacherReceiptSignature,
        studentProofSignature,
        receiptHmac: receipt.receiptHmac,
      });

      // 8. Handshake verified! Generate Student Check-In QR for Security Guard
      const checkInQr = await getStudentCheckInQr(sessionUuid);
      setCheckInQrData(checkInQr);
      setCurrentStep("GUARD_CHECKIN_QR");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Cryptographic local network handshake failed");
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
              Biometric & Secure QR Attendance
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Student Attendance Portal
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Active liveness challenge verification, local LAN handshake, and security gate check-in.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab("ATTEND");
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
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
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
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
                You do not hold an approved active Campus Check-In today. Verify your entry with the Security Guard at the gate before starting classroom attendance.
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
              Your 128-D face biometric embedding has not been registered by the Super Admin / Registrar yet. You can view attendance history below, and once an administrator enrolls your face in the Super Admin console, you can mark attendance here.
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
      {feedbackMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
          <Sparkles size={18} />
          <span>{feedbackMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "HISTORY" ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Attendance Records</h2>
          {historyLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : historyList.length > 0 ? (
            <div className="overflow-x-auto">
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
          ) : (
            <div className="py-12 text-center text-slate-500">
              <History size={36} className="mx-auto mb-2 opacity-30" />
              <p>No past attendance records found.</p>
            </div>
          )}
        </div>
      ) : (
        /* Workflow Container */
        <div className="mx-auto max-w-xl">
          {/* Workflow Progress Breadcrumb */}
          <div className="mb-6 flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
            <span className={currentStep === "SCAN_TEACHER_QR" ? "text-blue-400 font-bold" : ""}>
              1. Scan Teacher QR
            </span>
            <span>→</span>
            <span className={currentStep === "FACE_LIVENESS" ? "text-blue-400 font-bold" : ""}>
              2. Face Liveness
            </span>
            <span>→</span>
            <span className={currentStep === "GUARD_CHECKIN_QR" ? "text-blue-400 font-bold" : ""}>
              3. Guard Gate Check-In
            </span>
          </div>

          {/* STEP 1: Scan Teacher QR */}
          {currentStep === "SCAN_TEACHER_QR" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Step 1 of 3
                </span>
                <h2 className="text-xl font-bold text-white">Scan Teacher Attendance QR</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Point your camera at the teacher's screen to retrieve session parameters.
                </p>
              </div>

              <div className="relative mx-auto h-72 w-72 overflow-hidden rounded-2xl border-2 border-dashed border-blue-500/40 bg-black/40">
                <Scanner
                  onScan={(codes) => {
                    if (codes && codes.length > 0 && codes[0].rawValue) {
                      handleTeacherQrScan(codes[0].rawValue);
                    }
                  }}
                />
              </div>

              {/* Manual Input Fallback */}
              <div className="mt-6 border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 mb-2">Or paste full signed Teacher QR JSON manually:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionUuid}
                    onChange={(e) => setSessionUuid(e.target.value)}
                    placeholder='Paste signed Teacher QR JSON {"sessionId":...}'
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleTeacherQrScan(sessionUuid)}
                    disabled={!sessionUuid.trim() || loading}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Face Liveness Challenges */}
          {currentStep === "FACE_LIVENESS" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Challenge {challengeIndex + 1} of {totalChallenges}
                </span>
                <h2 className="text-2xl font-black text-white">{challengeDescription}</h2>
                <p className="text-xs text-slate-400">
                  Position your face inside the guide oval and perform the action.
                </p>
              </div>

              {/* Video Camera Container with Oval Guide */}
              <div className="relative mx-auto h-80 w-80 overflow-hidden rounded-full border-4 border-blue-500 bg-black shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover -scale-x-100"
                />
                {/* Visual pulse ring */}
                <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
              </div>

              {/* Challenge Instruction Card */}
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
                <Eye size={18} className="animate-pulse" />
                Action: <span className="font-mono uppercase">{currentChallenge}</span>
              </div>
            </div>
          )}

          {/* STEP 3: Local Handshake Processing */}
          {currentStep === "HANDSHAKE" && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <Wifi size={48} className="mx-auto mb-4 animate-bounce text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Verifying Local LAN Proximity</h2>
              <p className="mt-2 text-xs text-slate-400">
                Exchanging cryptographic handshake with Teacher Device at{" "}
                <span className="font-mono text-cyan-300">
                  {teacherServerIp}:{teacherServerPort}
                </span>
              </p>
              <div className="mt-6 flex justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
              </div>
            </div>
          )}

          {/* STEP 4: Guard Check-In QR Display */}
          {currentStep === "GUARD_CHECKIN_QR" && checkInQrData && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Biometrics & Handshake Verified!
                </span>
                <h2 className="text-xl font-bold text-white">Present QR to Security Guard</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Show this Check-In QR to the Security Officer at the gate or classroom entrance.
                </p>
              </div>

              {/* Check-In QR Code */}
              <div className="relative mx-auto w-fit rounded-2xl bg-white p-4 shadow-2xl">
                <QRCode
                  value={checkInQrData.qrData}
                  size={220}
                  level="M"
                  className="rounded"
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                <p className="font-bold text-white">{checkInQrData.studentName}</p>
                <p className="text-slate-400">
                  Roll: {checkInQrData.rollNumber} • {checkInQrData.courseName}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-emerald-400 font-semibold">
                  <Clock size={14} />
                  <span>Valid for 5 minutes • Awaiting Guard Approval</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Final Attendance Success */}
          {currentStep === "ATTENDANCE_SUCCESS" && (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={48} />
              </div>

              <h2 className="text-2xl font-black text-white">Attendance Marked!</h2>
              <p className="mt-2 text-sm text-slate-300">
                Your presence has been officially validated across Biometrics, Teacher Local Network Handshake, and Security Guard Check-In.
              </p>

              {identityScore && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900/60 px-4 py-2 text-xs font-mono text-emerald-400 border border-emerald-500/30">
                  <span>Biometric Cosine Similarity: {(identityScore * 100).toFixed(1)}%</span>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => {
                    setCurrentStep("SCAN_TEACHER_QR");
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
