import api from "@/services/axiosConfig";
import { getBaseUrl, getRoleFromToken } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Teacher Enrollment API contract — aligned with EnrollmentController        */
/* -------------------------------------------------------------------------- */

export const ENROLLMENT_PERMISSION_ACTIONS = ["CREATE_CHILD", "READ", "UPDATE", "DELETE"] as const;
export type EnrollmentPermissionAction = (typeof ENROLLMENT_PERMISSION_ACTIONS)[number];

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

export interface EnrollmentResponseItem {
    id: number;
    status: EnrollmentStatus | string;
    subjects: CommonDTO[];
    permissionActions: EnrollmentPermissionAction[];
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface TeacherEnrollmentResponse {
    teacher: CommonDTO;
    enrollmentResponses: EnrollmentResponseItem[];
    university?: CommonDTO | null;
}

export interface TeacherEnrollmentRequest {
    teacherId: number;
    subjectIds: number[];
}

/* -------------------------------------------------------------------------- */
/* URL builder                                                                 */
/* -------------------------------------------------------------------------- */

export const getTeacherEnrollmentBaseUrl = () => {
    const role = getRoleFromToken();
    if (role === "DEAN") return "/dean/teacher-enrollment";
    if (role === "HEAD_OF_DEPARTMENT" || role === "HOD") return "/head-of-department/teacher-enrollment";
    if (role === "ADMIN") return "/admin/teacher-enrollment";
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/teacher-enrollment`;
};

/* -------------------------------------------------------------------------- */
/* Internal normalization helpers                                              */
/* -------------------------------------------------------------------------- */

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
    if (!value || typeof value !== "object") return null;
    const item = asRecord(value);
    const id = toPositiveId(item.id);
    if (!id) return null;
    return {
        id,
        name: String(item.name ?? item.title ?? `Record ${id}`),
        code: typeof item.code === "string" ? item.code : null,
    };
}

export function normalizeEnrollmentItem(value: unknown): EnrollmentResponseItem {
    const item = asRecord(value);
    return {
        id: toPositiveId(item.id),
        status: String(item.status ?? "ACTIVE").toUpperCase(),
        subjects: asArray(item.subjects)
            .map(normalizeCommon)
            .filter((s): s is CommonDTO => Boolean(s)),
        permissionActions: asArray(item.permissionActions)
            .map((a) => String(a).toUpperCase())
            .filter((a): a is EnrollmentPermissionAction =>
                ENROLLMENT_PERMISSION_ACTIONS.includes(a as EnrollmentPermissionAction)
            ),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
        createdBy: normalizeCommon(item.createdBy),
        updatedBy: normalizeCommon(item.updatedBy),
    };
}

export function normalizeTeacherEnrollmentResponse(value: unknown): TeacherEnrollmentResponse {
    const item = asRecord(value);
    const teacher = normalizeCommon(item.teacher) ?? { id: 0, name: "Unknown Faculty" };
    const university = normalizeCommon(item.university);
    const enrollmentResponses = asArray(item.enrollmentResponses)
        .map(normalizeEnrollmentItem)
        .filter((e) => e.id > 0);

    return {
        teacher,
        university,
        enrollmentResponses,
    };
}

/* -------------------------------------------------------------------------- */
/* Error extraction                                                            */
/* -------------------------------------------------------------------------- */

export function extractTeacherEnrollmentErrorMessage(
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
            const messages = body.errors
                .map((entry) => {
                    if (typeof entry === "string") return entry;
                    const e = asRecord(entry);
                    return String(e.defaultMessage ?? e.message ?? e.field ?? "");
                })
                .filter(Boolean);
            if (messages.length) return messages.join(", ");
        }
    }
    const status = Number(response.status);
    if (status === 400) return "Some enrollment details are invalid. Please check and try again.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to manage this teacher enrollment.";
    if (status === 404) return "The requested enrollment, teacher, or subject was not found.";
    if (status === 409) return "This operation conflicts with the current enrollment state.";
    if (status >= 500) return "A server error occurred. Please try again later.";
    if (typeof candidate.message === "string" && candidate.message.trim()) {
        if (candidate.message.toLowerCase().includes("network error")) {
            return "Unable to connect to the server. Check your connection.";
        }
        return candidate.message.trim();
    }
    return fallback;
}

function safeId(id: number, label = "ID"): number {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Invalid ${label.toLowerCase()}.`);
    return id;
}

/* -------------------------------------------------------------------------- */
/* API functions — mirror EnrollmentController endpoints                       */
/* -------------------------------------------------------------------------- */

/** GET /{role}/teacher-enrollment — get all teacher enrollments */
export async function getTeacherEnrollments(): Promise<TeacherEnrollmentResponse[]> {
    try {
        const response = await api.get<unknown>(getTeacherEnrollmentBaseUrl());
        return asArray(response.data)
            .map(normalizeTeacherEnrollmentResponse)
            .filter((item) => item.teacher.id > 0);
    } catch (error) {
        throw new Error(extractTeacherEnrollmentErrorMessage(error, "Unable to load teacher enrollments."));
    }
}

/** POST /{role}/teacher-enrollment — create a new teacher enrollment with subjects */
export async function createTeacherEnrollment(
    request: TeacherEnrollmentRequest
): Promise<TeacherEnrollmentResponse> {
    safeId(request.teacherId, "Teacher ID");
    if (!Array.isArray(request.subjectIds) || request.subjectIds.length === 0) {
        throw new Error("Select at least one subject for enrollment.");
    }
    try {
        const response = await api.post<unknown>(getTeacherEnrollmentBaseUrl(), request);
        return normalizeTeacherEnrollmentResponse(response.data);
    } catch (error) {
        throw new Error(extractTeacherEnrollmentErrorMessage(error, "Unable to create teacher enrollment."));
    }
}

/** PUT /{role}/teacher-enrollment/add-subject?teacherId={id}&subjectId={id}&enrollmentId={id} */
export async function addSubjectToEnrollment(
    teacherId: number,
    subjectId: number,
    enrollmentId: number
): Promise<TeacherEnrollmentResponse> {
    safeId(teacherId, "Teacher ID");
    safeId(subjectId, "Subject ID");
    safeId(enrollmentId, "Enrollment ID");
    try {
        const response = await api.put<unknown>(
            `${getTeacherEnrollmentBaseUrl()}/add-subject`,
            null,
            { params: { teacherId, subjectId, enrollmentId } }
        );
        return normalizeTeacherEnrollmentResponse(response.data);
    } catch (error) {
        throw new Error(extractTeacherEnrollmentErrorMessage(error, "Unable to add subject to enrollment."));
    }
}

/** DELETE /{role}/teacher-enrollment/remove-subject?teacherId={id}&subjectId={id}&enrollmentId={id} */
export async function removeSubjectFromEnrollment(
    teacherId: number,
    subjectId: number,
    enrollmentId: number
): Promise<TeacherEnrollmentResponse> {
    safeId(teacherId, "Teacher ID");
    safeId(subjectId, "Subject ID");
    safeId(enrollmentId, "Enrollment ID");
    try {
        const response = await api.delete<unknown>(
            `${getTeacherEnrollmentBaseUrl()}/remove-subject`,
            { params: { teacherId, subjectId, enrollmentId } }
        );
        return normalizeTeacherEnrollmentResponse(response.data);
    } catch (error) {
        throw new Error(extractTeacherEnrollmentErrorMessage(error, "Unable to remove subject from enrollment."));
    }
}

/** DELETE /{role}/teacher-enrollment/delete?teacherId={id}&enrollmentId={id} */
export async function deleteTeacherEnrollment(
    teacherId: number,
    enrollmentId: number
): Promise<TeacherEnrollmentResponse> {
    safeId(teacherId, "Teacher ID");
    safeId(enrollmentId, "Enrollment ID");
    try {
        const response = await api.delete<unknown>(
            `${getTeacherEnrollmentBaseUrl()}/delete`,
            { params: { teacherId, enrollmentId } }
        );
        return normalizeTeacherEnrollmentResponse(response.data);
    } catch (error) {
        throw new Error(extractTeacherEnrollmentErrorMessage(error, "Unable to delete enrollment."));
    }
}

/** GET /{role}/teacher-enrollment/subjects?universityId={id} — subjects for university */
export async function getSubjectsForTeacherEnrollment(
    universityId: number
): Promise<CommonDTO[]> {
    safeId(universityId, "University ID");
    try {
        const response = await api.get<unknown>(
            `${getTeacherEnrollmentBaseUrl()}/subjects`,
            { params: { universityId } }
        );
        return asArray(response.data)
            .map(normalizeCommon)
            .filter((s): s is CommonDTO => Boolean(s));
    } catch (error) {
        throw new Error(extractTeacherEnrollmentErrorMessage(error, "Unable to load subjects for this university."));
    }
}

/* -------------------------------------------------------------------------- */
/* Shared Helpers                                                             */
/* -------------------------------------------------------------------------- */

export function uniqueCommonDTOs(
    items: Array<CommonDTO | null | undefined>
): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();
    for (const item of items) {
        if (
            item &&
            Number.isFinite(Number(item.id)) &&
            Number(item.id) > 0 &&
            typeof item.name === "string"
        ) {
            const id = Number(item.id);
            if (!unique.has(id)) {
                unique.set(id, { ...item, id });
            }
        }
    }
    return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

export function formatAuditActor(actor?: CommonDTO | null): string {
    if (!actor) return "System";
    const name = actor.name?.trim();
    const code = actor.code?.trim();
    if (name && code) return `${name} (${code})`;
    if (name) return name;
    if (code) return code;
    if (actor.id) return `ID: #${actor.id}`;
    return "System";
}

export function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(d);
    } catch {
        return "—";
    }
}

export function formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return "—";
    }
}

export function getInitials(name?: string): string {
    if (!name) return "TE";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "TE";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hasEnrollmentPermission(
    item?: EnrollmentResponseItem | null,
    action: EnrollmentPermissionAction = "UPDATE"
): boolean {
    if (!item) return false;
    if (
        Array.isArray(item.permissionActions) &&
        item.permissionActions.includes(action)
    ) {
        return true;
    }
    const role = getRoleFromToken();
    if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
    return false;
}
