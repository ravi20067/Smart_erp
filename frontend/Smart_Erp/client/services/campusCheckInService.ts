import api from "@/services/axiosConfig";

export type CampusPersonRole = "STUDENT" | "TEACHER";
export type CampusCheckDirection = "CHECK_IN" | "CHECK_OUT";

export interface CampusHistoryItem {
  id: number;
  personRole: CampusPersonRole;
  direction: CampusCheckDirection;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  fullName: string;
  identifier: string;
  departmentOrCourse: string;
  guardName?: string;
  rejectionReason?: string;
  requestedAt: string;
  actionTime?: string;
  checkedOut: boolean;
  linkedCheckInId?: number;
}

export interface CampusStatusResponse {
  personRole: CampusPersonRole;
  campusStatus: string;
  hasActiveOpenCheckIn: boolean;
  openCheckInId?: number;
  openCheckInTime?: string;
  fullName: string;
  primaryIdentifier: string;
  recentHistory: CampusHistoryItem[];
}

export interface CampusQrResponse {
  qrToken: string;
  qrData: string;
  direction: CampusCheckDirection;
  personRole: CampusPersonRole;
  displayName: string;
  identifierLabel: string;
  identifierValue: string;
  expiresAt: string;
  currentCampusStatus: string;
  openCheckInId?: number;
  openCheckInTime?: string;
}

export interface CampusGuardScanResponse {
  qrToken: string;
  personRole: CampusPersonRole;
  direction: CampusCheckDirection;
  status: string;
  alreadyDecided: boolean;
  userId: number;
  studentId?: number;
  teacherId?: number;
  fullName: string;
  photoUrl?: string;
  hasRegisteredPhoto: boolean;
  enrollmentNumber?: string;
  courseName?: string;
  sectionName?: string;
  academicYearName?: string;
  employeeId?: string;
  departmentName?: string;
  designation?: string;
  openCheckInTime?: string;
  requestedAt: string;
  expiresAt: string;
}

export interface CampusDecisionResponse {
  qrToken: string;
  personRole: CampusPersonRole;
  direction: CampusCheckDirection;
  decision: string;
  fullName: string;
  actionTime: string;
  message: string;
}

const campusCheckInService = {
  // Student endpoints
  getStudentStatus: async (): Promise<CampusStatusResponse> => {
    const res = await api.get("/student/campus-check-in/status");
    return res.data;
  },
  generateStudentQr: async (direction: CampusCheckDirection): Promise<CampusQrResponse> => {
    const res = await api.post("/student/campus-check-in/qr", { direction });
    return res.data;
  },

  // Teacher endpoints
  getTeacherStatus: async (): Promise<CampusStatusResponse> => {
    const res = await api.get("/teacher/campus-check-in/status");
    return res.data;
  },
  generateTeacherQr: async (direction: CampusCheckDirection): Promise<CampusQrResponse> => {
    const res = await api.post("/teacher/campus-check-in/qr", { direction });
    return res.data;
  },

  // Security Guard endpoints
  scanCampusQr: async (qrToken: string): Promise<CampusGuardScanResponse> => {
    const res = await api.post("/security-guard/campus-check-in/scan", { qrToken });
    return res.data;
  },
  submitCampusDecision: async (
    qrToken: string,
    approved: boolean,
    rejectionReason?: string,
    deviceDetails?: string
  ): Promise<CampusDecisionResponse> => {
    const res = await api.post("/security-guard/campus-check-in/decision", {
      qrToken,
      approved,
      rejectionReason: rejectionReason || null,
      deviceDetails: deviceDetails || "Security Guard Gate Terminal",
    });
    return res.data;
  },
  getCampusShiftLogs: async (): Promise<CampusHistoryItem[]> => {
    const res = await api.get("/security-guard/campus-check-in/recent");
    return res.data;
  },
};

export default campusCheckInService;
