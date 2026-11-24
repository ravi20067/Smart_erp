import api from "@/services/axiosConfig";
import { getBaseUrl, getRoleFromToken } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Security Guard API contract — aligned with SecurityGuardController         */
/* -------------------------------------------------------------------------- */

export const SECURITY_GUARD_PERMISSION_ACTIONS = [
    "CREATE_CHILD",
    "READ",
    "UPDATE",
    "DELETE",
] as const;
export type SecurityGuardPermissionAction =
    (typeof SECURITY_GUARD_PERMISSION_ACTIONS)[number];

export const GUARD_SHIFTS = ["DAY", "NIGHT", "ROTATIONAL", "EVENING"] as const;
export type GuardShift = (typeof GUARD_SHIFTS)[number];

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

export interface SecurityGuardResponse {
    id: number;
    badgeNumber: string;
    assignedGate: string;
    shift: string;
    emergencyContact?: string | null;
    joiningDate?: string | null;
    basicDetailRequest: UserProfileResponse;
    university?: CommonDTO | null;
    permissionActions: SecurityGuardPermissionAction[];
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface SecurityGuardRequest {
    badgeNumber?: string;
    assignedGate?: string;
    shift?: string;
    emergencyContact?: string;
    joiningDate?: string;
    status?: boolean;
    basicDetailRequest: UserProfileRequest;
}

/* -------------------------------------------------------------------------- */
/* URL builder                                                                 */
/* -------------------------------------------------------------------------- */

export const getSecurityGuardBaseUrl = () => {
    const role = getRoleFromToken();
    if (role === "DEAN") return "/dean/security-guard";
    if (role === "HEAD_OF_DEPARTMENT" || role === "HOD")
        return "/head-of-department/security-guard";
    if (role === "ADMIN") return "/admin/security-guard";
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/security-guard`;
};

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                            */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
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
        dob: typeof item.dob === "string" ? item.dob : "",
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

export function normalizeSecurityGuardResponse(
    value: unknown
): SecurityGuardResponse {
    const item = asRecord(value);
    const basicDetail = normalizeProfile(item.basicDetailRequest);

    return {
        id: toPositiveId(item.id),
        badgeNumber: String(item.badgeNumber ?? `SG-${item.id ?? ""}`),
        assignedGate: String(item.assignedGate ?? "Main Gate"),
        shift: String(item.shift ?? "DAY").toUpperCase(),
        emergencyContact:
            typeof item.emergencyContact === "string"
                ? item.emergencyContact
                : null,
        joiningDate:
            typeof item.joiningDate === "string" ? item.joiningDate : null,
        basicDetailRequest: basicDetail,
        university: normalizeCommon(item.university),
        permissionActions: asArray(item.permissionActions)
            .map((a) => String(a).toUpperCase())
            .filter((a): a is SecurityGuardPermissionAction =>
                SECURITY_GUARD_PERMISSION_ACTIONS.includes(
                    a as SecurityGuardPermissionAction
                )
            ),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
        createdBy: normalizeCommon(item.createdBy),
        updatedBy: normalizeCommon(item.updatedBy),
    };
}

/* -------------------------------------------------------------------------- */
/* Error extraction                                                            */
/* -------------------------------------------------------------------------- */

export function extractSecurityGuardErrorMessage(
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
            if (typeof body[key] === "string" && String(body[key]).trim())
                return String(body[key]).trim();
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
    if (status === 400)
        return "Some details are invalid. Check the form and try again.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403)
        return "You do not have permission to manage security guards.";
    if (status === 404)
        return "The security guard or requested record was not found.";
    if (status === 409)
        return "This badge number or username conflicts with an existing record.";
    if (status === 413) return "The uploaded photo is too large.";
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
    form.append(
        "details",
        new Blob([JSON.stringify(details)], { type: "application/json" })
    );
    if (file) form.append("file", file);
    return form;
}

function safeId(id: number, label = "Security Guard ID"): number {
    if (!Number.isSafeInteger(id) || id <= 0)
        throw new Error(`Invalid ${label.toLowerCase()}.`);
    return id;
}

/* -------------------------------------------------------------------------- */
/* API functions — mirror SecurityGuardController endpoints                    */
/* -------------------------------------------------------------------------- */

/** GET /{role}/security-guard — list all security guards */
export async function getSecurityGuards(): Promise<SecurityGuardResponse[]> {
    try {
        const response = await api.get<unknown>(getSecurityGuardBaseUrl());
        return asArray(response.data)
            .map(normalizeSecurityGuardResponse)
            .filter((g) => g.id > 0);
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to load security guards."
            )
        );
    }
}

/** GET /{role}/security-guard/photo?userId={userId} — fetch guard photo blob */
export async function getSecurityGuardPhoto(userId: number): Promise<Blob> {
    safeId(userId, "User ID");
    try {
        const response = await api.get<Blob>(
            `${getSecurityGuardBaseUrl()}/photo`,
            {
                params: { userId },
                responseType: "blob",
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to load security guard photo."
            )
        );
    }
}

/** POST /{role}/security-guard?universityID={id} (multipart) — create guard */
export async function createSecurityGuard(
    universityID: number,
    request: SecurityGuardRequest,
    file?: File | null
): Promise<SecurityGuardResponse> {
    safeId(universityID, "University ID");
    if (
        !request.basicDetailRequest.firstName.trim() ||
        !request.basicDetailRequest.lastName.trim()
    ) {
        throw new Error("First name and last name are required.");
    }
    try {
        const response = await api.post<unknown>(
            getSecurityGuardBaseUrl(),
            multipartDetails(request, file),
            { params: { universityID } }
        );
        return normalizeSecurityGuardResponse(response.data);
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to create security guard."
            )
        );
    }
}

/** POST /{role}/security-guard/update/profile?guardId={id} (multipart) — update profile */
export async function updateSecurityGuardProfile(
    guardId: number,
    request: UserProfileRequest,
    file?: File | null
): Promise<UserProfileResponse> {
    safeId(guardId);
    try {
        const response = await api.post<unknown>(
            `${getSecurityGuardBaseUrl()}/update/profile`,
            multipartDetails(request, file),
            { params: { guardId } }
        );
        return normalizeProfile(response.data);
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to update guard profile."
            )
        );
    }
}

/** PUT /{role}/security-guard/update/details?guardId={id} (JSON) — update badge/gate/shift */
export async function updateSecurityGuardDetails(
    guardId: number,
    request: SecurityGuardRequest
): Promise<SecurityGuardResponse> {
    safeId(guardId);
    try {
        const response = await api.put<unknown>(
            `${getSecurityGuardBaseUrl()}/update/details`,
            request,
            { params: { guardId } }
        );
        return normalizeSecurityGuardResponse(response.data);
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to update guard details."
            )
        );
    }
}

/** POST /{role}/security-guard/update/profile/change-enable?guardId={id}&enable={bool} */
export async function changeSecurityGuardEnabled(
    guardId: number,
    enable: boolean
): Promise<string> {
    safeId(guardId);
    try {
        const response = await api.post<unknown>(
            `${getSecurityGuardBaseUrl()}/update/profile/change-enable`,
            null,
            { params: { guardId, enable } }
        );
        return typeof response.data === "string"
            ? response.data
            : `Security guard account ${enable ? "enabled" : "disabled"}.`;
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to change guard account status."
            )
        );
    }
}

/** POST /{role}/security-guard/update/profile/reset-password?guardId={id} */
export async function resetSecurityGuardPassword(
    guardId: number
): Promise<string> {
    safeId(guardId);
    try {
        const response = await api.post<unknown>(
            `${getSecurityGuardBaseUrl()}/update/profile/reset-password`,
            null,
            { params: { guardId } }
        );
        return typeof response.data === "string"
            ? response.data
            : "Password reset successfully.";
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to reset guard password."
            )
        );
    }
}

/** DELETE /{role}/security-guard?guardId={id} */
export async function deleteSecurityGuard(guardId: number): Promise<string> {
    safeId(guardId);
    try {
        const response = await api.delete<unknown>(getSecurityGuardBaseUrl(), {
            params: { guardId },
        });
        return typeof response.data === "string"
            ? response.data
            : "Security guard record deleted successfully.";
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to delete security guard."
            )
        );
    }
}

/** GET /{role}/security-guard/filter/university — university filter options */
export async function getSecurityGuardUniversityFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(
            `${getSecurityGuardBaseUrl()}/filter/university`
        );
        return asArray(response.data)
            .map(normalizeCommon)
            .filter((item): item is CommonDTO => Boolean(item));
    } catch (error) {
        throw new Error(
            extractSecurityGuardErrorMessage(
                error,
                "Unable to load university filters."
            )
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Shared Helpers (Matching University.tsx & Teacher.tsx)                    */
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
    if (!name) return "SG";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SG";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hasSecurityGuardPermission(
    item?: SecurityGuardResponse | null,
    action: SecurityGuardPermissionAction = "UPDATE"
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
