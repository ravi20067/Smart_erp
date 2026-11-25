import api from "@/services/axiosConfig";

/* -------------------------------------------------------------------------- */
/* Types aligned cleanly with StudentPortalController.java                    */
/* -------------------------------------------------------------------------- */

export interface StudentProfileSummary {
    studentId: number;
    enrollmentId: number | null;
    registrationNumber: string;
    rollNumber: string | null;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    photoUrl: string | null;
    courseName: string | null;
    sectionId: number | null;
    sectionName: string | null;
    sectionGroupId: number | null;
    sectionGroupName: string | null;
    specializationName: string | null;
    academicYearName: string | null;
    hasEnrolledFace: boolean;
    faceEnrolledAt: string | null;
}

export interface TimetableEntry {
    entryId: number;
    scope: "SECTION" | "SECTION_GROUP" | string;
    dayOfWeek: string;
    periodNumber: number | null;
    sequenceNumber: number | null;
    periodLabel: string | null;
    startTime: string | null;
    endTime: string | null;
    subjectId: number | null;
    subjectName: string | null;
    subjectCode: string | null;
    isPractical: boolean;
    teacherName: string | null;
    roomNumber: string | null;
    entryType: string | null;
    remarks: string | null;
}

export interface EnrolledSubjectSummary {
    subjectId: number;
    subjectName: string;
    subjectCode: string | null;
    isPractical: boolean;
    lecturesPerWeek: number | null;
    scope: "SECTION" | "SECTION_GROUP" | string;
    teacherName: string | null;
}

export interface TodayTimetableSlot {
    entryId: number | null;
    sequenceNumber: number | null;
    periodNumber: number | null;
    periodLabel: string | null;
    startTime: string | null;
    endTime: string | null;
    subject: string | null;
    teacher: string | null;
    room: string | null;
    entryType: string | null;
    note: string | null;
    overridden: boolean;
}

export interface TodayTimetableView {
    date: string;
    open: boolean;
    dayTitle: string | null;
    closureReason: string | null;
    timetableVersionId: number | null;
    versionNumber: number | null;
    versionName: string | null;
    slots: TodayTimetableSlot[];
}

export interface StudentTimetableResponse {
    sectionName: string | null;
    sectionGroupName: string | null;
    specializationName: string | null;
    sectionVersionName: string | null;
    groupVersionName: string | null;
    versionName: string | null;
    entries: TimetableEntry[];
    enrolledSubjects: EnrolledSubjectSummary[];
    todayView: TodayTimetableView | null;
}

export type CalendarDayType =
    | "REGULAR"
    | "HOLIDAY"
    | "HALF_DAY"
    | "SPECIAL"
    | "EXAMINATION"
    | "EVENT";

export interface CalendarDay {
    id: number;
    calendarDate: string;
    dayType: CalendarDayType | string;
    operatingStatus: "OPEN" | "CLOSED" | "MODIFIED" | string;
    title: string | null;
    description: string | null;
    holidayReason: string | null;
    openingTime: string | null;
    closingTime: string | null;
    instructionDay: boolean | null;
}

export interface StudentCalendarResponse {
    calendarId: number | null;
    calendarName: string | null;
    status: "DRAFT" | "PUBLISHED" | string | null;
    sectionName: string | null;
    academicYearName: string | null;
    startDate?: string | null;
    endDate?: string | null;
    defaultOpeningTime?: string | null;
    defaultClosingTime?: string | null;
    days: CalendarDay[];
}

export interface FeeComponentItem {
    id: number;
    componentName: string;
    category: string | null;
    amount: number;
    mandatory: boolean;
    refundable: boolean;
}

export interface ScholarshipItem {
    id: number;
    name: string;
    code: string | null;
    scholarshipType: string | null;
    amountType: string | null;
    value: number;
    calculatedDiscount: number;
}

export interface FeeAdjustmentItem {
    id: number;
    type: string | null;
    reason: string;
    amount: number;
    authorizedBy: string | null;
    createdAt: string | null;
}

export interface FeePaymentItem {
    id: number;
    installmentNo: number | null;
    receiptNumber: string | null;
    amountPaid: number;
    paymentDate: string | null;
    paymentMode: string | null;
    status: string | null;
    transactionReference: string | null;
    remarks: string | null;
}

export interface FeeAccountInstallment {
    feeAccountId: number;
    installmentNo: number;
    isCurrent: boolean;
    feeStructureId: number | null;
    feeStructureName: string;
    frequency: string | null;
    totalNoOfInstallments: number | null;
    academicYearName: string | null;
    dueDate: string | null;
    status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVER_PAID" | "OVERDUE" | "CANCELLED" | string;
    baseAmount: number;
    fineAmount: number;
    scholarshipDiscount: number;
    netPayableAmount: number;
    paidAmount: number;
    dueBalance: number;
    components: FeeComponentItem[];
    scholarships: ScholarshipItem[];
    adjustments: FeeAdjustmentItem[];
    payments: FeePaymentItem[];
}

export interface StudentFeesResponse {
    initialized: boolean;
    courseName: string | null;
    sectionName: string | null;
    specializationName: string | null;
    totalBaseAmount: number;
    totalFineAmount: number;
    totalScholarshipDiscount: number;
    totalFeeAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" | "NOT_INITIALIZED" | string;
    currentInstallmentNo: number | null;
    nextDueDate: string | null;
    installments: FeeAccountInstallment[];
    allPayments: FeePaymentItem[];
}

export interface RecentAttendanceItem {
    id: number;
    date: string | null;
    subjectName: string;
    teacherName: string | null;
    sessionUuid: string | null;
    status: "PRESENT" | "LATE" | "ABSENT" | "REJECTED" | "LEAVE" | string;
}

export interface DashboardOverviewResponse {
    attendanceStats: {
        totalRecords: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
        attendancePercentage: number;
        hasEnrolledFace: boolean;
    };
    feeStats: {
        initialized: boolean;
        totalNetPayable: number;
        totalPaid: number;
        totalDueBalance: number;
        nextDueDate: string | null;
        overallStatus: string;
        installmentCount: number;
    };
    todaySchedule: TodayTimetableView | null;
    upcomingEvents: CalendarDay[];
    recentAttendance: RecentAttendanceItem[];
}

export interface StudentFaceTemplateSummary {
    studentId: number;
    registrationNumber?: string | null;
    hasEnrolledFace: boolean;
    status?: string | null;
    algorithm?: string | null;
    dimension?: number | null;
    enrolledAt?: string | null;
}

export const studentPortalService = {
    async getProfileSummary(): Promise<StudentProfileSummary> {
        const res = await api.get<StudentProfileSummary>("/student/profile-summary");
        return res.data;
    },

    async getFaceTemplate(): Promise<StudentFaceTemplateSummary> {
        const res = await api.get<Record<string, unknown>>("/student/face-template");
        const data = res.data || {};
        return {
            studentId: Number(data.studentId || 0),
            registrationNumber: data.registrationNumber ? String(data.registrationNumber) : null,
            hasEnrolledFace: Boolean(data.registered ?? data.hasEnrolledFace),
            status: data.status ? String(data.status) : null,
            algorithm: data.algorithm ? String(data.algorithm) : null,
            dimension:
                data.embeddingDimension != null
                    ? Number(data.embeddingDimension)
                    : data.dimension != null
                    ? Number(data.dimension)
                    : null,
            enrolledAt: data.enrolledAt ? String(data.enrolledAt) : null,
        };
    },

    async getPhotoObjectUrl(): Promise<string | null> {
        try {
            const res = await api.get<Blob>("/student/photo", { responseType: "blob" });
            if (res.data && res.data.size > 0) {
                return URL.createObjectURL(res.data);
            }
            return null;
        } catch {
            return null;
        }
    },

    async getTimetable(): Promise<StudentTimetableResponse> {
        const res = await api.get<StudentTimetableResponse>("/student/timetable");
        return res.data;
    },

    async getAcademicCalendar(): Promise<StudentCalendarResponse> {
        const res = await api.get<StudentCalendarResponse>("/student/academic-calendar");
        return res.data;
    },

    async getFees(): Promise<StudentFeesResponse> {
        const res = await api.get<StudentFeesResponse>("/student/fees");
        return res.data;
    },

    async getDashboardOverview(): Promise<DashboardOverviewResponse> {
        const res = await api.get<DashboardOverviewResponse>("/student/dashboard-overview");
        return res.data;
    },
};
