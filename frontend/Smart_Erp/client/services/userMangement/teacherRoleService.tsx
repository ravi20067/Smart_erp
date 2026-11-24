import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Teacher Role Assignment API contract — aligned with TeacherRoleController   */
/* -------------------------------------------------------------------------- */

export const ROLE_PERMISSION_ACTIONS = ["CREATE_CHILD", "READ", "UPDATE", "DELETE"] as const;
export type RolePermissionAction = (typeof ROLE_PERMISSION_ACTIONS)[number];

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface TeacherRoleResponse {
    id: number; // UserRole row ID
    name: string;
    description: string;
    enumValue: string;
    active: boolean;
    assignedBy?: CommonDTO | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface RoleFilter {
    id: number; // Role entity ID
    name: string;
    description: string;
    enumValue: string;
}

export interface UserRoleResponse {
    teacherId: number;
    user: CommonDTO;
    roles: TeacherRoleResponse[];
    permissionActions?: RolePermissionAction[];
}

/* -------------------------------------------------------------------------- */
/* URL builder                                                                 */
/* -------------------------------------------------------------------------- */

const getTeacherRoleBaseUrl = () => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/teacher-role`;
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

export function normalizeCommon(value: unknown): CommonDTO | null {
    const item = asRecord(value);
    const id = toPositiveId(item.id);
    if (!id) return null;
    return {
        id,
        name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : `Item #${id}`,
        code: typeof item.code === "string" ? item.code : null,
    };
}

export function normalizeTeacherRole(raw: unknown): TeacherRoleResponse {
    const r = asRecord(raw);
    return {
        id: toPositiveId(r.id),
        name: typeof r.name === "string" ? r.name : "Unnamed Role",
        description: typeof r.description === "string" ? r.description : "",
        enumValue: typeof r.enumValue === "string" ? r.enumValue : "TEACHER",
        active: Boolean(r.active ?? true),
        assignedBy: normalizeCommon(r.assignedBy),
        createdAt: typeof r.createdAt === "string" ? r.createdAt : null,
        updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null,
        createdBy: normalizeCommon(r.createdBy),
        updatedBy: normalizeCommon(r.updatedBy),
    };
}

export function normalizeUserRoleResponse(raw: unknown): UserRoleResponse {
    const r = asRecord(raw);
    const user = normalizeCommon(r.user) ?? { id: 0, name: "Unknown Teacher" };
    const teacherId = toPositiveId(r.teacherId) || user.id;

    const rawRoles = asArray(r.roles);
    const roles = rawRoles.map(normalizeTeacherRole);

    const rawActions = asArray<string>(r.permissionActions);
    const permissionActions = rawActions.filter((a): a is RolePermissionAction =>
        (ROLE_PERMISSION_ACTIONS as readonly string[]).includes(a)
    );

    return {
        teacherId,
        user,
        roles,
        permissionActions,
    };
}

export function normalizeRoleFilter(raw: unknown): RoleFilter {
    const r = asRecord(raw);
    return {
        id: toPositiveId(r.id),
        name: typeof r.name === "string" ? r.name : "Role",
        description: typeof r.description === "string" ? r.description : "",
        enumValue: typeof r.enumValue === "string" ? r.enumValue : "",
    };
}

/* -------------------------------------------------------------------------- */
/* Audit and Utility Helpers                                                   */
/* -------------------------------------------------------------------------- */

export function formatDate(dateString?: string | null): string {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatDateTime(dateString?: string | null): string {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatAuditActor(actor?: CommonDTO | null): string {
    if (!actor) return "System Administrator";
    if (actor.name && actor.code) return `${actor.name} (${actor.code})`;
    if (actor.name) return actor.name;
    if (actor.code) return actor.code;
    return `User #${actor.id}`;
}

export function getInitials(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "T";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hasRolePermission(
    record?: UserRoleResponse | null,
    action: RolePermissionAction = "UPDATE"
): boolean {
    if (!record || !record.permissionActions) return true;
    return record.permissionActions.includes(action);
}

/* -------------------------------------------------------------------------- */
/* Service Methods                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch assigned roles for all teachers, or optionally for a single teacher.
 */
export async function getTeacherRoles(teacherId?: number): Promise<UserRoleResponse[]> {
    const params: Record<string, number> = {};
    if (teacherId && teacherId > 0) {
        params.teacherId = teacherId;
    }

    const response = await api.get<unknown>(`${getTeacherRoleBaseUrl()}/get-roles`, {
        params,
    });

    const list = asArray(response.data);
    return list.map(normalizeUserRoleResponse);
}

/**
 * Assign a new role to a teacher.
 */
export async function addRoleToTeacher(
    teacherId: number,
    roleId: number
): Promise<UserRoleResponse> {
    if (!teacherId || teacherId <= 0) {
        throw new Error("Invalid teacher identifier.");
    }
    if (!roleId || roleId <= 0) {
        throw new Error("Invalid role identifier.");
    }

    const response = await api.put<unknown>(
        `${getTeacherRoleBaseUrl()}/add-role`,
        null,
        {
            params: { teacherId, roleId },
        }
    );

    return normalizeUserRoleResponse(response.data);
}

/**
 * Change the active status of an assigned role for a teacher (enable / disable).
 */
export async function changeRoleActiveStatus(
    teacherId: number,
    userRoleId: number,
    status: boolean
): Promise<UserRoleResponse> {
    if (!teacherId || teacherId <= 0) {
        throw new Error("Invalid teacher identifier.");
    }
    if (!userRoleId || userRoleId <= 0) {
        throw new Error("Invalid user-role assignment identifier.");
    }

    const response = await api.put<unknown>(
        `${getTeacherRoleBaseUrl()}/change-active-status`,
        null,
        {
            params: {
                teacherId,
                userRoleId,
                status,
            },
        }
    );

    return normalizeUserRoleResponse(response.data);
}

/**
 * Fetch the available roles that can be assigned to a teacher within their university.
 */
export async function getRoleFilter(teacherId: number): Promise<RoleFilter[]> {
    if (!teacherId || teacherId <= 0) {
        throw new Error("Invalid teacher identifier.");
    }

    const response = await api.get<unknown>(
        `${getTeacherRoleBaseUrl()}/get-role-filter`,
        {
            params: { teacherId },
        }
    );

    const list = asArray(response.data);
    return list.map(normalizeRoleFilter);
}

/* -------------------------------------------------------------------------- */
/* Error extraction utility                                                    */
/* -------------------------------------------------------------------------- */

export function extractTeacherRoleErrorMessage(
    error: unknown,
    fallback = "An unexpected error occurred while processing teacher roles."
): string {
    if (!error) return fallback;

    if (typeof error === "string") return error;

    if (error instanceof Error && error.message) return error.message;

    const axiosError = error as {
        response?: {
            data?: unknown;
            status?: number;
            statusText?: string;
        };
    };

    const data = axiosError?.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data;
    }

    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (typeof obj.message === "string" && obj.message.trim()) {
            return obj.message;
        }
        if (typeof obj.error === "string" && obj.error.trim()) {
            return obj.error;
        }
        if (typeof obj.detail === "string" && obj.detail.trim()) {
            return obj.detail;
        }
    }

    if (axiosError?.response?.statusText) {
        return `Request failed: ${axiosError.response.statusText} (${axiosError.response.status})`;
    }

    return fallback;
}
