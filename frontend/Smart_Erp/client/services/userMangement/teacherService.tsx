import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Teacher API contract — aligned with TeacherController                      */
/* -------------------------------------------------------------------------- */

export const TEACHER_PERMISSION_ACTIONS = ["CREATE_CHILD", "READ", "UPDATE", "DELETE"] as const;
export type TeacherPermissionAction = (typeof TEACHER_PERMISSION_ACTIONS)[number];

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
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface TeacherResponse {
    id: number;
    basicDetailRequest: UserProfileResponse;
    university?: CommonDTO | null;
    department?: CommonDTO | null;
    subjects?: CommonDTO[];
    permissionActions: TeacherPermissionAction[];
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface TeacherRequest {
    status?: boolean;
    basicDetailRequest: UserProfileRequest;
    subjectIds?: number[];
}

/* -------------------------------------------------------------------------- */
/* URL builder                                                                 */
/* -------------------------------------------------------------------------- */

const getTeacherBaseUrl = () => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/teacher`;
};

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                            */
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
        createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
        createdBy: normalizeCommon(item.createdBy),
        updatedBy: normalizeCommon(item.updatedBy),
    };
}

export function normalizeTeacherResponse(value: unknown): TeacherResponse {
    const item = asRecord(value);
    const profile = normalizeProfile(item.basicDetailRequest ?? item.profile ?? {});
    return {
        id: toPositiveId(item.id) || profile.userId,
        basicDetailRequest: profile,
        university: normalizeCommon(item.university),
        department: normalizeCommon(item.department),
        subjects: asArray(item.subjects)
            .map(normalizeCommon)
            .filter((v): v is CommonDTO => Boolean(v)),
        permissionActions: asArray(item.permissionActions)
            .map((a) => String(a).toUpperCase())
            .filter((a): a is TeacherPermissionAction =>
                TEACHER_PERMISSION_ACTIONS.includes(a as TeacherPermissionAction)
            ),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : (profile.createdAt ?? null),
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : (profile.updatedAt ?? null),
        createdBy: normalizeCommon(item.createdBy) || profile.createdBy || null,
        updatedBy: normalizeCommon(item.updatedBy) || profile.updatedBy || null,
    };
}

/* -------------------------------------------------------------------------- */
/* Error extraction                                                           */
/* -------------------------------------------------------------------------- */

export function extractTeacherErrorMessage(
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
    if (status === 400) return "Some details are invalid. Check the form and try again.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "The teacher or requested record could not be found.";
    if (status === 409) return "This operation conflicts with the current teacher record state.";
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

function safeId(id: number, label = "Teacher ID"): number {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Invalid ${label.toLowerCase()}.`);
    return id;
}

/* -------------------------------------------------------------------------- */
/* API functions — mirror TeacherController endpoints                         */
/* -------------------------------------------------------------------------- */

/** GET /{role}/teacher — list all teachers */
export async function getTeachers(): Promise<TeacherResponse[]> {
    try {
        const response = await api.get<unknown>(getTeacherBaseUrl());
        return asArray(response.data)
            .map(normalizeTeacherResponse)
            .filter((t) => t.id > 0);
    } catch (error) {
        throw new Error(extractTeacherErrorMessage(error, "Unable to load teachers."));
    }
}

/** GET /{role}/teacher/photo?userId={userId} — fetch teacher photo blob */
export async function getTeacherPhoto(userId: number): Promise<Blob> {
    safeId(userId, "User ID");
    try {
        const response = await api.get<Blob>(`${getTeacherBaseUrl()}/photo`, {
            params: { userId },
            responseType: "blob",
        });
        return response.data;
    } catch (error) {
        throw new Error(extractTeacherErrorMessage(error, "Unable to load the teacher's photo."));
    }
}

/** POST /{role}/teacher?universityID={id} (multipart) — create teacher */
export async function createTeacher(
    universityID: number,
    request: TeacherRequest,
    file?: File | null
): Promise<TeacherResponse> {
    safeId(universityID, "University ID");
    if (!request.basicDetailRequest.firstName.trim() || !request.basicDetailRequest.lastName.trim()) {
        throw new Error("First name and last name are required.");
    }
    try {
        const response = await api.post<unknown>(
            getTeacherBaseUrl(),
            multipartDetails(request, file),
            { params: { universityID } }
        );
        return normalizeTeacherResponse(response.data);
    } catch (error) {
        throw new Error(extractTeacherErrorMessage(error, "Unable to create teacher."));
    }
}

/** POST /{role}/teacher/update/profile?teacherId={id} (multipart) — update profile */
export async function updateTeacherProfile(
    teacherId: number,
    request: UserProfileRequest,
    file?: File | null
): Promise<UserProfileResponse> {
    safeId(teacherId);
    try {
        const response = await api.post<unknown>(
            `${getTeacherBaseUrl()}/update/profile`,
            multipartDetails(request, file),
            { params: { teacherId } }
        );
        return normalizeProfile(response.data);
    } catch (error) {
        throw new Error(extractTeacherErrorMessage(error, "Unable to update the teacher profile."));
    }
}

/** POST /{role}/teacher/update/profile/change-enable?teacherId={id}&enable={bool} */
export async function changeTeacherEnabled(teacherId: number, enable: boolean): Promise<string> {
    safeId(teacherId);
    try {
        const response = await api.post<unknown>(
            `${getTeacherBaseUrl()}/update/profile/change-enable`,
            null,
            { params: { teacherId, enable } }
        );
        return typeof response.data === "string"
            ? response.data
            : `Teacher account ${enable ? "enabled" : "disabled"}.`;
    } catch (error) {
        throw new Error(extractTeacherErrorMessage(error, "Unable to change the teacher account status."));
    }
}

/** POST /{role}/teacher/update/profile/reset-password?teacherId={id} */
export async function resetTeacherPassword(teacherId: number): Promise<string> {
    safeId(teacherId);
    try {
        const response = await api.post<unknown>(
            `${getTeacherBaseUrl()}/update/profile/reset-password`,
            null,
            { params: { teacherId } }
        );
        return typeof response.data === "string" ? response.data : "Password reset successfully.";
    } catch (error) {
        throw new Error(extractTeacherErrorMessage(error, "Unable to reset the password."));
    }
}

/** GET /{role}/teacher/filter/university — university filter options */
export async function getTeacherUniversityFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getTeacherBaseUrl()}/filter/university`);
        return asArray(response.data)
            .map(normalizeCommon)
            .filter((item): item is CommonDTO => Boolean(item));
    } catch (error) {
        throw new Error(extractTeacherErrorMessage(error, "Unable to load university filters."));
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
    if (!name) return "TC";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "TC";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hasTeacherPermission(
    teacher: TeacherResponse,
    action: TeacherPermissionAction
): boolean {
    return (
        Array.isArray(teacher.permissionActions) &&
        teacher.permissionActions.includes(action)
    );
}

export function getTeacherFullName(teacher?: TeacherResponse | null): string {
    if (!teacher) return "Unnamed Faculty";
    const profile = teacher.basicDetailRequest;
    const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
    return name || profile.username || `Teacher #${teacher.id}`;
}
