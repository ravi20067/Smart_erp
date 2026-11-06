import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Student API contract — aligned with StudentController + uploaded DTOs       */
/* -------------------------------------------------------------------------- */

export const STUDENT_PERMISSION_ACTIONS = ["CREATE_CHILD", "READ", "UPDATE", "DELETE"] as const;
export type StudentPermissionAction = (typeof STUDENT_PERMISSION_ACTIONS)[number];

export const ENROLLMENT_STATUSES = [
    "ACTIVE",
    "COMPLETED",
    "TRANSFERRED",
    "WITHDRAWN",
    "SUSPENDED",
    "CANCELLED",
    "DISABLE",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface UserProfileRequest {
    firstName: string;
    lastName: string;
    dob: string;
    email: string;
    phone: string;
    fatherName: string;
    motherName: string;
    guardianMobileNumber: string;
    address: string;
}

export interface UserProfileResponse extends UserProfileRequest {
    userId: number;
    enabled: boolean;
    username: string;
}

export interface StudentIdentity {
    id: number;
    registrationNumber: string;
    basicDetailRequest: UserProfileResponse;
}

export interface FeeResponse {
    id?: number;
    totalAmount?: number | string;
    payableAmount?: number | string;
    paidAmount?: number | string;
    balance?: number | string;
    dueDate?: string | null;
    status?: string | null;
    frequency?: string | null;
    [key: string]: unknown;
}

export interface StudentEnrollmentResponse {
    id: number;
    rollNumber: string | null;
    status: EnrollmentStatus | string;
    scholarships: CommonDTO[];
    fees: FeeResponse[];
    university?: CommonDTO | null;
    school: CommonDTO | null;
    department: CommonDTO | null;
    academicYear: CommonDTO | null;
    course: CommonDTO | null;
    section?: CommonDTO | null;
    sectionGroup: CommonDTO | null;
    specialization?: CommonDTO | null;
    frequency?: string | null;
    student: StudentIdentity;
    permissionActions: StudentPermissionAction[];
}

export interface SectionGroupFilter {
    sectionGroup: CommonDTO;
    specialization: CommonDTO | null;
    courses: CommonDTO | null;
}

export interface StudentCreateRequest {
    sectionGroupId: number;
    status?: boolean;
    scholarshipId: number[];
    basicDetailRequest: UserProfileRequest;
    dueDate?: string;
}

export interface StudentProfileUpdateRequest extends UserProfileRequest { }

/* -------------------------------------------------------------------------- */
/* URL + error handling                                                       */
/* -------------------------------------------------------------------------- */

const getStudentBaseUrl = () => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/student`;
};

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function toPositiveId(value: unknown): number {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

function normalizeCommon(value: unknown): CommonDTO | null {
    const item = asRecord(value);
    const id = toPositiveId(item.id);
    if (!id) return null;
    return {
        id,
        name: String(item.name ?? item.title ?? `Record ${id}`),
        code: typeof item.code === "string" ? item.code : null,
    };
}

function normalizeProfile(value: unknown): UserProfileResponse {
    const item = asRecord(value);
    return {
        userId: toPositiveId(item.userId ?? item.id),
        enabled: Boolean(item.enabled),
        username: String(item.username ?? ""),
        firstName: String(item.firstName ?? ""),
        lastName: String(item.lastName ?? ""),
        dob: String(item.dob ?? ""),
        email: String(item.email ?? ""),
        phone: String(item.phone ?? ""),
        fatherName: String(item.fatherName ?? ""),
        motherName: String(item.motherName ?? ""),
        guardianMobileNumber: String(item.guardianMobileNumber ?? ""),
        address: String(item.address ?? ""),
    };
}

function normalizeStudent(value: unknown): StudentIdentity {
    const item = asRecord(value);
    return {
        id: toPositiveId(item.id),
        registrationNumber: String(item.registrationNumber ?? ""),
        basicDetailRequest: normalizeProfile(item.basicDetailRequest ?? item.profile ?? {}),
    };
}

function normalizeFee(value: unknown): FeeResponse {
    return asRecord(value) as FeeResponse;
}

export function normalizeStudentEnrollment(value: unknown): StudentEnrollmentResponse {
    const item = asRecord(value);
    const status = String(item.status ?? "ACTIVE").toUpperCase();
    return {
        id: toPositiveId(item.id),
        rollNumber: item.rollNumber == null ? null : String(item.rollNumber),
        status,
        scholarships: asArray(item.scholarships).map(normalizeCommon).filter((v): v is CommonDTO => Boolean(v)),
        fees: asArray(item.fees).map(normalizeFee),
        university: normalizeCommon(item.university) ?? normalizeCommon((item.school as Record<string, unknown> | undefined)?.university),
        school: normalizeCommon(item.school),
        department: normalizeCommon(item.department),
        academicYear: normalizeCommon(item.academicYear),
        course: normalizeCommon(item.course),
        section: normalizeCommon(item.section) ?? normalizeCommon((item.sectionGroup as Record<string, unknown> | undefined)?.section),
        sectionGroup: normalizeCommon(item.sectionGroup),
        specialization: normalizeCommon(item.specialization),
        frequency: item.frequency == null ? null : String(item.frequency),
        student: normalizeStudent(item.student),
        permissionActions: asArray(item.permissionActions)
            .map((action) => String(action).toUpperCase())
            .filter((action): action is StudentPermissionAction =>
                STUDENT_PERMISSION_ACTIONS.includes(action as StudentPermissionAction)
            ),
    };
}

export function extractStudentErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    const candidate = asRecord(error);
    const response = asRecord(candidate.response);
    const data = response.data;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data === "object") {
        const body = asRecord(data);
        for (const key of ["message", "error", "detail", "description", "title"]) {
            if (typeof body[key] === "string" && String(body[key]).trim()) return String(body[key]).trim();
        }
        if (Array.isArray(body.errors)) {
            const messages = body.errors.map((entry) => {
                if (typeof entry === "string") return entry;
                const e = asRecord(entry);
                return String(e.defaultMessage ?? e.message ?? e.field ?? "");
            }).filter(Boolean);
            if (messages.length) return messages.join(", ");
        }
    }
    const status = Number(response.status);
    if (status === 400) return "Some details are invalid. Check the form and try again.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "The student or requested record could not be found.";
    if (status === 409) return "This operation conflicts with the current enrollment state.";
    if (status === 413) return "The uploaded file is too large.";
    if (status >= 500) return "A server error occurred. Please try again later.";
    if (typeof candidate.message === "string" && candidate.message.trim()) {
        if (candidate.message.toLowerCase().includes("network error")) {
            return "Unable to connect to the server. Check your connection.";
        }
        return candidate.message.trim();
    }
    return fallback;
}

function multipartDetails<T>(details: T, file?: File | null): FormData {
    const form = new FormData();
    form.append("details", new Blob([JSON.stringify(details)], { type: "application/json" }));
    if (file) form.append("file", file);
    return form;
}

function safeId(id: number, label = "Enrollment ID"): number {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Invalid ${label.toLowerCase()}.`);
    return id;
}

/* -------------------------------------------------------------------------- */
/* API calls — endpoint names and parameters mirror StudentController         */
/* -------------------------------------------------------------------------- */

export async function getStudentEnrollments(): Promise<StudentEnrollmentResponse[]> {
    try {
        const response = await api.get<unknown>(getStudentBaseUrl());
        return asArray(response.data)
            .map(normalizeStudentEnrollment)
            .filter((item) => item.id > 0 && item.student.id > 0);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to load students."));
    }
}

export async function getStudentSectionGroups(): Promise<SectionGroupFilter[]> {
    try {
        const response = await api.get<unknown>(`${getStudentBaseUrl()}/filter/section-groups`);
        return asArray(response.data).map((raw) => {
            const item = asRecord(raw);
            return {
                sectionGroup: normalizeCommon(item.sectionGroup) ?? { id: 0, name: "Unknown section group" },
                specialization: normalizeCommon(item.specialization),
                courses: normalizeCommon(item.courses),
            };
        }).filter((item) => item.sectionGroup.id > 0);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to load section groups."));
    }
}

export async function getStudentScholarships(sectionGroupId: number): Promise<CommonDTO[]> {
    if (!Number.isSafeInteger(sectionGroupId) || sectionGroupId <= 0) return [];
    try {
        const response = await api.get<unknown>(`${getStudentBaseUrl()}/list/scholarships`, {
            params: { sectionGroupId },
        });
        return asArray(response.data).map(normalizeCommon).filter((item): item is CommonDTO => Boolean(item));
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to load scholarships."));
    }
}

export async function createStudent(
    request: StudentCreateRequest,
    file?: File | null
): Promise<StudentEnrollmentResponse> {
    if (!Number.isSafeInteger(request.sectionGroupId) || request.sectionGroupId <= 0) {
        throw new Error("Select a section group.");
    }
    if (!request.basicDetailRequest.firstName.trim() || !request.basicDetailRequest.lastName.trim()) {
        throw new Error("First name and last name are required.");
    }
    try {
        const response = await api.post<unknown>(getStudentBaseUrl(), multipartDetails(request, file));
        return normalizeStudentEnrollment(response.data);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to create student."));
    }
}

export async function updateStudentProfile(
    enrollmentId: number,
    request: StudentProfileUpdateRequest,
    file?: File | null
): Promise<UserProfileResponse> {
    safeId(enrollmentId);
    try {
        const response = await api.post<unknown>(
            `${getStudentBaseUrl()}/update/profile`,
            multipartDetails(request, file),
            { params: { enrollmentId } }
        );
        return normalizeProfile(response.data);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to update the student profile."));
    }
}

export async function updateStudentScholarships(
    enrollmentId: number,
    scholarshipIds: number[]
): Promise<StudentEnrollmentResponse> {
    safeId(enrollmentId);
    const ids = Array.from(new Set(scholarshipIds)).filter((id) => Number.isSafeInteger(id) && id > 0);
    if (ids.length === 0) {
        throw new Error("Select at least one scholarship. The current backend endpoint requires at least one scholarshipId.");
    }
    const query = new URLSearchParams();
    query.set("enrollmentId", String(enrollmentId));
    ids.forEach((id) => query.append("scholarshipId", String(id)));
    try {
        const response = await api.put<unknown>(`${getStudentBaseUrl()}/update/enrollment/scholarship?${query.toString()}`);
        return normalizeStudentEnrollment(response.data);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to update scholarships."));
    }
}

export async function changeStudentCourse(
    enrollmentId: number,
    sectionGroupId: number
): Promise<StudentEnrollmentResponse> {
    safeId(enrollmentId);
    safeId(sectionGroupId, "Section group ID");
    try {
        const response = await api.put<unknown>(`${getStudentBaseUrl()}/update/course`, null, {
            params: { enrollmentId, sectionGroupId },
        });
        return normalizeStudentEnrollment(response.data);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to change the student's program."));
    }
}

/** Fetches available sections for a given student enrollment (for section change). */
export async function filterSection(enrollmentId: number): Promise<CommonDTO[]> {
    safeId(enrollmentId);
    try {
        const response = await api.get<unknown>(`${getStudentBaseUrl()}/filter/section`, {
            params: { enrollmentId },
        });
        return asArray(response.data)
            .map(normalizeCommon)
            .filter((item): item is CommonDTO => Boolean(item));
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to load sections for this student."));
    }
}

/** Changes the student's section (sectionId is not a sectionGroupId). */
export async function changeStudentSection(
    enrollmentId: number,
    sectionId: number
): Promise<StudentEnrollmentResponse> {
    safeId(enrollmentId);
    safeId(sectionId, "Section ID");
    try {
        const response = await api.put<unknown>(`${getStudentBaseUrl()}/update/section`, null, {
            params: { enrollmentId, sectionId },
        });
        return normalizeStudentEnrollment(response.data);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to change the student's section."));
    }
}

export async function changeStudentEnrollmentStatus(
    enrollmentId: number,
    enrollmentStatus: EnrollmentStatus
): Promise<StudentEnrollmentResponse> {
    safeId(enrollmentId);
    if (!ENROLLMENT_STATUSES.includes(enrollmentStatus)) throw new Error("Select a valid enrollment status.");
    try {
        const response = await api.put<unknown>(`${getStudentBaseUrl()}/update/enrollment-status`, null, {
            params: { enrollmentId, enrollmentStatus },
        });
        return normalizeStudentEnrollment(response.data);
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to update enrollment status."));
    }
}

export async function resetStudentPassword(enrollmentId: number): Promise<string> {
    safeId(enrollmentId);
    try {
        const response = await api.post<unknown>(`${getStudentBaseUrl()}/update/profile/reset-password`, null, {
            params: { enrollmentId },
        });
        return typeof response.data === "string" ? response.data : "Password reset successfully.";
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to reset the password."));
    }
}

export async function changeStudentEnabled(enrollmentId: number, enable: boolean): Promise<string> {
    safeId(enrollmentId);
    try {
        const response = await api.post<unknown>(`${getStudentBaseUrl()}/update/profile/change-enable`, null, {
            params: { enrollmentId, enable },
        });
        return typeof response.data === "string" ? response.data : `Student account ${enable ? "enabled" : "disabled"}.`;
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to change the student account status."));
    }
}

export async function getStudentPhoto(enrollmentId: number): Promise<Blob> {
    safeId(enrollmentId);
    try {
        const response = await api.get<Blob>(`${getStudentBaseUrl()}/photo`, {
            params: { enrollmentId },
            responseType: "blob",
        });
        return response.data;
    } catch (error) {
        throw new Error(extractStudentErrorMessage(error, "Unable to load the student's photo."));
    }
}
