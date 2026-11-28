import api from "@/services/axiosConfig";

export interface StartAttendancePayload {
  academicYearId: number;
  courseId: number;
  sectionId: number;
  subjectId: number;
  roomNumber?: string;
  localServerIp?: string;
  localServerPort?: number;
  teacherEd25519PublicKey: string;
  teacherX25519PublicKey: string;
  allowedSubnets?: string;
}

export interface AttendanceSessionDto {
  id: number;
  sessionUuid: string;
  teacherName: string;
  academicYearName: string;
  courseName: string;
  sectionName: string;
  subjectName: string;
  roomNumber: string;
  status: "CREATED" | "ACTIVE" | "CLOSED" | "EXPIRED";
  localServerIp: string;
  localServerPort: number;
  teacherEd25519PublicKey?: string;
  teacherX25519PublicKey?: string;
  allowedSubnets?: string;
  backendPublicKey?: string;
  qrPayload?: string;
  startTime: string;
  expiresAt: string;
  totalPresent: number;
  totalEligible: number;
}

export interface TeacherQRPayloadObj {
  sessionId: string;
  teacherId: number;
  localServerIp: string;
  localServerPort: number;
  teacherEd25519PublicKey?: string;
  teacherX25519PublicKey?: string;
  allowedSubnets?: string;
  backendPublicKey?: string;
  timestamp: number;
  expiresAt: number;
  nonce: string;
  signature: string;
}

export interface StudentHandshakeTicketResponse {
  ticketId: string;
  sessionUuid: string;
  studentId: number;
  studentRef: string;
  studentEd25519PublicKey: string;
  studentX25519PublicKey: string;
  studentNonce: string;
  issuedAt: number;
  expiresAt: number;
  backendPublicKey: string;
  backendTicketSignature: string;
}

export interface StudentVerificationStartResponse {
  verificationSessionId: string;
  sessionUuid: string;
  currentChallenge: string;
  challengeDescription: string;
  challengeIndex: number;
  totalChallenges: number;
  expiresAt: string;
}

export interface ChallengeSubmissionResponse {
  verificationSessionId: string;
  action: string;
  accepted: boolean;
  confidence: number;
  nextChallenge?: string;
  nextChallengeDescription?: string;
  currentChallengeIndex: number;
  totalChallenges: number;
  allChallengesPassed: boolean;
  identityMatched: boolean;
  identitySimilarity?: number;
  status: string;
  message: string;
}

export interface LocalHandshakeResponse {
  receiptId: string;
  sessionUuid: string;
  verified: boolean;
  status: string;
  message: string;
  receiptSignature: string;
  attendanceMarked?: boolean;
  attendanceId?: number;
  attendanceStatus?: string;
}

export interface StudentActiveAttendanceSession {
  sessionUuid: string;
  courseName: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  roomNumber: string;
  allowedSubnets: string;
  expiresAt?: string;
  campusCheckInOpen: boolean;
  faceVerified: boolean;
  matchedSimilarity?: number;
  handshakeVerified: boolean;
  alreadyMarked: boolean;
}

export interface PythonFaceAiHealthReport {
  serviceUrl: string;
  checkedAt: string;
  latencyMs: number;
  reachable: boolean;
  application?: string;
  version?: string;
  environment?: string;
  status: string;
  modelsStatus?: string;
  device?: string;
  readiness: boolean;
  matchThreshold?: number;
  models?: Record<string, string>;
  details?: Record<string, { name: string; status: string; path: string; provider: string }>;
  error?: string;
}

export interface StudentCheckInQRResponse {
  checkInToken: string;
  sessionUuid: string;
  studentId: number;
  studentName: string;
  rollNumber: string;
  courseName: string;
  sectionName: string;
  expiresAt: string;
  qrData: string;
}

export interface GuardStudentDetailResponse {
  checkInToken: string;
  studentId: number;
  studentName: string;
  rollNumber: string;
  registrationNumber: string;
  courseName: string;
  sectionName: string;
  academicYearName: string;
  photoUrl?: string;
  hasRegisteredPhoto: boolean;
  sessionUuid: string;
  subjectName: string;
  teacherName: string;
  faceVerificationPassed: boolean;
  similarityScore?: number;
  handshakeVerified: boolean;
  guardCheckInStatus: string;
  alreadyDecided: boolean;
}

export interface GuardDecisionResponse {
  checkInToken: string;
  studentName: string;
  decision: "APPROVED" | "REJECTED";
  attendanceMarked: boolean;
  message: string;
}

export interface AttendanceStatsResponse {
  sessionUuid: string;
  totalEligible: number;
  totalPresent: number;
  totalLate: number;
  totalRejected: number;
  students: Array<{
    studentId: number;
    studentName: string;
    rollNumber: string;
    status: string;
    checkInTime: string;
    similarityScore?: number;
    guardApproved: boolean;
    guardName?: string;
    remarks?: string;
  }>;
}

export interface StudentAttendanceHistoryItem {
  id: number;
  sessionUuid: string;
  attendanceDate: string;
  checkInTime: string;
  courseName: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  status: string;
  similarityScore?: number;
  guardApproval: string;
  remarks?: string;
}

// ==================== TEACHER APIS ====================

export const getAttendanceFilters = async (): Promise<{
  academicYears: Array<{ id: number; name: string }>;
  courses: Array<{ id: number; name: string }>;
  sections: Array<{ id: number; name: string }>;
  subjects: Array<{ id: number; name: string }>;
}> => {
  const res = await api.get("/teacher/attendance/filters");
  return res.data;
};

export const startAttendanceSession = async (payload: StartAttendancePayload): Promise<AttendanceSessionDto> => {
  const res = await api.post("/teacher/attendance/sessions/start", payload);
  return res.data;
};

export const stopAttendanceSession = async (sessionUuid: string): Promise<AttendanceSessionDto> => {
  const res = await api.post(`/teacher/attendance/sessions/${sessionUuid}/stop`);
  return res.data;
};

export const getActiveTeacherSession = async (): Promise<AttendanceSessionDto | null> => {
  try {
    const res = await api.get("/teacher/attendance/sessions/active");
    if (res.status === 204 || !res.data) return null;
    return res.data;
  } catch {
    return null;
  }
};

export const refreshTeacherQr = async (sessionUuid: string): Promise<string> => {
  const res = await api.post(`/teacher/attendance/sessions/${sessionUuid}/qr/refresh`);
  return res.data.qrPayload;
};

export const getTeacherSessionStats = async (sessionUuid: string): Promise<AttendanceStatsResponse> => {
  const res = await api.get(`/teacher/attendance/sessions/${sessionUuid}/stats`);
  return res.data;
};

export const getTeacherFaceAiHealth = async (): Promise<PythonFaceAiHealthReport> => {
  const res = await api.get("/teacher/attendance/face-ai/health");
  return res.data;
};

export const analyzeFaceDiagnostics = async (imageBlob: Blob): Promise<Record<string, any>> => {
  const formData = new FormData();
  formData.append("image", imageBlob, "diagnostic.jpg");
  const res = await api.post("/teacher/attendance/face-ai/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ==================== STUDENT APIS ====================

export const getStudentActiveAttendanceSessions = async (): Promise<StudentActiveAttendanceSession[]> => {
  const res = await api.get("/student/attendance/active-sessions");
  return res.data;
};

export const startStudentVerification = async (sessionUuid: string): Promise<StudentVerificationStartResponse> => {
  const res = await api.post("/student/attendance/verification/start", { sessionUuid });
  return res.data;
};

export const submitChallengeFrames = async (
  verificationSessionId: string,
  action: string,
  sequenceNumber: number,
  frames: Blob[]
): Promise<ChallengeSubmissionResponse> => {
  const formData = new FormData();
  formData.append("action", action);
  formData.append("sequenceNumber", String(sequenceNumber));
  frames.forEach((blob, idx) => {
    formData.append("frames", blob, `frame_${idx}.jpg`);
  });

  const res = await api.post(
    `/student/attendance/verification/${verificationSessionId}/challenge`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const requestStudentHandshakeTicket = async (payload: {
  sessionUuid: string;
  studentEd25519PublicKey: string;
  studentX25519PublicKey: string;
  studentNonce: string;
}): Promise<StudentHandshakeTicketResponse> => {
  const res = await api.post("/student/attendance/handshake/ticket", payload);
  return res.data;
};

export const verifyLocalHandshake = async (payload: {
  sessionUuid: string;
  teacherId: number;
  studentRef: string;
  ticketId: string;
  nonce: string;
  teacherNonce: string;
  studentNonce: string;
  timestamp: number;
  expiresAt: number;
  studentProofTimestamp: number;
  receiptIssuedAt: number;
  receiptExpiresAt: number;
  qrSignature: string;
  clientIp: string;
  iceCandidateType?: string;
  companionReceiptId: string;
  teacherEd25519PublicKey: string;
  teacherX25519PublicKey: string;
  studentEd25519PublicKey: string;
  studentX25519PublicKey: string;
  teacherReceiptSignature: string;
  studentProofSignature: string;
  receiptHmac: string;
}): Promise<LocalHandshakeResponse> => {
  const res = await api.post("/student/attendance/handshake/verify", payload);
  return res.data;
};

export interface WebRtcSignalPayload {
  sessionUuid: string;
  ticketId: string;
  senderRole?: string;
  signalType: "OFFER" | "ANSWER" | "ICE" | "ERROR";
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number | null;
  iceType?: string;
  errorMessage?: string;
}

export const relayStudentWebRtcSignal = async (payload: WebRtcSignalPayload): Promise<void> => {
  await api.post("/student/attendance/webrtc/signal", payload);
};

export const relayTeacherWebRtcSignal = async (payload: WebRtcSignalPayload): Promise<void> => {
  await api.post("/teacher/attendance/webrtc/signal", payload);
};

export const getStudentCheckInQr = async (sessionUuid: string): Promise<StudentCheckInQRResponse> => {
  const res = await api.get(`/student/attendance/checkin/qr?sessionUuid=${encodeURIComponent(sessionUuid)}`);
  return res.data;
};

export const getStudentAttendanceHistory = async (): Promise<StudentAttendanceHistoryItem[]> => {
  const res = await api.get("/student/attendance/history");
  return res.data;
};

// ==================== SECURITY GUARD APIS ====================

export const scanGuardCheckIn = async (checkInToken: string): Promise<GuardStudentDetailResponse> => {
  const res = await api.post("/security-guard/check-in/scan", { checkInToken });
  return res.data;
};

export const makeGuardDecision = async (payload: {
  checkInToken: string;
  approved: boolean;
  rejectionReason?: string;
  deviceDetails?: string;
}): Promise<GuardDecisionResponse> => {
  const res = await api.post("/security-guard/check-in/decision", payload);
  return res.data;
};
