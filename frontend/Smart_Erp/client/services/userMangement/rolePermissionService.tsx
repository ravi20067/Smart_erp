import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                         */
/* -------------------------------------------------------------------------- */

export const PERMISSION_ACTIONS = ["CREATE_CHILD", "READ", "UPDATE", "DELETE"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** Mirrors User/Enum/ResourceType.java in the uploaded backend. */
export const RESOURCE_TYPES = [
    "UNIVERSITY", "USER", "STAFF", "ROLE", "SCHOOL", "ROOM", "DEPARTMENT",
    "ACADEMIC_YEAR", "COURSE", "SUBJECT", "TEACHER_ENROLLMENT", "SECTION",
    "SECTION_GROUP", "TIMETABLE", "STUDENT_ENROLLMENT", "SPECIALIZATION",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** Mirrors ResourceType.getParent() from the backend enum. */
export const RESOURCE_PARENT: Readonly<Partial<Record<ResourceType, ResourceType>>> = {
    USER: "UNIVERSITY",
    ROLE: "UNIVERSITY",
    SCHOOL: "UNIVERSITY",
    ROOM: "SCHOOL",
    DEPARTMENT: "SCHOOL",
    ACADEMIC_YEAR: "DEPARTMENT",
    COURSE: "ACADEMIC_YEAR",
    SUBJECT: "COURSE",
    TEACHER_ENROLLMENT: "SUBJECT",
    SECTION: "COURSE",
    SECTION_GROUP: "SECTION",
    TIMETABLE: "SECTION_GROUP",
    STUDENT_ENROLLMENT: "SECTION_GROUP",
    SPECIALIZATION: "COURSE",
};

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface UserRoleResponse {
    name: string;
    enumValue: string;
}

export interface Permission {
    /** Database permission row ID; never synthesize this value. */
    id: number;
    resourceType: ResourceType;
    action: PermissionAction;
    /** Exact resource instance this permission row controls, when supplied by backend. */
    resourceId?: number;
    name?: string;
    children: Permission[];
    /** Assignment metadata is present on role-permission responses, not base definitions. */
    assignedBy?: CommonDTO | null;
    assignmentActive?: boolean;
}

export interface PermissionHierarchyAnalysis {
    totalNodes: number;
    validPermissionIds: number;
    invalidPermissionIds: number;
    missingResourceIds: number;
    resourceTypes: ResourceType[];
    actions: PermissionAction[];
    unknownResourceTypes: string[];
    duplicatePermissionIds: number[];
    nodes: Permission[];
}

export interface RoleResponse {
    id: number;
    name: string;
    description: string;
    userRole: UserRoleResponse | null;
    active: boolean;
    userCount: number;
    university: CommonDTO | null;
    permissions: Permission[];
    permissionActions: PermissionAction[];
}

export interface RoleRequest {
    name: string;
    description: string;
    userRole: string; // UserRoles enum value e.g. "TEACHER", "ADMIN"
    active?: boolean;
}


/* -------------------------------------------------------------------------- */
/* URL configuration                                                          */
/* -------------------------------------------------------------------------- */

const getServiceBaseUrl = () => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return base || "/super-admin";
};

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    if (!error || typeof error !== "object") {
        return fallback;
    }

    const candidate = error as {
        message?: unknown;
        response?: {
            data?: unknown;
            status?: number;
        };
    };

    const data = candidate.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data.trim();
    }

    if (data && typeof data === "object") {
        const body = data as Record<string, unknown>;

        for (const key of [
            "message",
            "error",
            "detail",
            "description",
            "title",
        ]) {
            const value = body[key];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }

        if (Array.isArray(body.errors)) {
            const messages = body.errors
                .map((item) => {
                    if (typeof item === "string") return item;

                    if (item && typeof item === "object") {
                        const entry = item as Record<string, unknown>;
                        return String(
                            entry.defaultMessage ??
                            entry.message ??
                            entry.field ??
                            ""
                        );
                    }

                    return "";
                })
                .filter(Boolean);

            if (messages.length) return messages.join(", ");
        }
    }

    const status = candidate.response?.status;

    if (status === 400) return "Invalid request. Please check your entered details.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "The requested record was not found.";
    if (status === 409) return "This role or code already exists in the selected university.";
    if (status === 422) return "The submitted role details could not be processed.";
    if (status === 500) return "A server error occurred. Please try again later.";

    if (
        typeof candidate.message === "string" &&
        candidate.message.trim()
    ) {
        if (candidate.message.toLowerCase().includes("network error")) {
            return "Unable to connect to the server. Check your connection.";
        }
        return candidate.message.trim();
    }

    return fallback;
}

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeCommonDTO(value: unknown): CommonDTO | null {
    const item = asRecord(value);
    const id = Number(item.id);

    if (!Number.isSafeInteger(id) || id <= 0 || typeof item.name !== "string") {
        return null;
    }

    return {
        id,
        name: item.name,
        code: typeof item.code === "string" ? item.code : null,
    };
}

export function uniqueCommonDTOs(
    items: Array<CommonDTO | null | undefined>
): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();

    for (const item of items) {
        if (
            item &&
            Number.isSafeInteger(Number(item.id)) &&
            Number(item.id) > 0 &&
            typeof item.name === "string"
        ) {
            unique.set(Number(item.id), {
                id: Number(item.id),
                name: item.name,
                code: item.code ?? null,
            });
        }
    }

    return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

export function normalizePermission(value: unknown): Permission {
    const item = asRecord(value);
    const rawId = Number(item.id);
    const id = Number.isSafeInteger(rawId) && rawId > 0 ? rawId : 0;
    const resourceType = String(item.resourceType ?? "") as ResourceType;
    const action = String(item.action ?? "") as PermissionAction;
    const rawResourceId = item.resourceId != null ? Number(item.resourceId) : undefined;
    const resourceId = rawResourceId != null && Number.isSafeInteger(rawResourceId) && rawResourceId > 0
        ? rawResourceId
        : undefined;
    const generatedName = resourceType && action ? `${resourceType}_${action}` : `Permission #${id}`;
    const name = typeof item.name === "string" && item.name.trim() ? item.name : generatedName;

    const children = asArray(item.children).map((child) => normalizePermission(child));

    return {
        id,
        resourceType,
        action,
        resourceId,
        name,
        children,
    };
}

/** Flatten the API tree without losing the original hierarchy. */
export function flattenPermissions(permissions: Permission[]): Permission[] {
    const result: Permission[] = [];
    const visit = (items: Permission[]) => {
        for (const permission of items) {
            result.push(permission);
            if (Array.isArray(permission.children) && permission.children.length) visit(permission.children);
        }
    };
    visit(Array.isArray(permissions) ? permissions : []);
    return result;
}

/** Read-only diagnostics for the live base-permission response. */
export function analyzePermissionHierarchy(permissions: Permission[]): PermissionHierarchyAnalysis {
    const nodes = flattenPermissions(permissions);
    const idCounts = new Map<number, number>();
    for (const node of nodes) {
        if (node.id > 0) idCounts.set(node.id, (idCounts.get(node.id) ?? 0) + 1);
    }
    const resourceTypes = Array.from(new Set(nodes.map((p) => p.resourceType))).sort();
    const actions = Array.from(new Set(nodes.map((p) => p.action))).sort();
    const unknownResourceTypes = Array.from(new Set(nodes.map((p) => String(p.resourceType))))
        .filter((type) => !RESOURCE_TYPES.includes(type as ResourceType)).sort();
    return {
        totalNodes: nodes.length,
        validPermissionIds: nodes.filter((p) => p.id > 0).length,
        invalidPermissionIds: nodes.filter((p) => p.id <= 0).length,
        missingResourceIds: nodes.filter((p) => !p.resourceId || p.resourceId <= 0).length,
        resourceTypes,
        actions,
        unknownResourceTypes,
        duplicatePermissionIds: Array.from(idCounts.entries()).filter(([, count]) => count > 1).map(([id]) => id),
        nodes,
    };
}

export function normalizeRole(value: unknown): RoleResponse {
    const item = asRecord(value);
    const userRoleObj = asRecord(item.userRole);

    const userRole: UserRoleResponse | null =
        typeof userRoleObj.enumValue === "string"
            ? {
                name: String(userRoleObj.name ?? userRoleObj.enumValue),
                enumValue: String(userRoleObj.enumValue),
            }
            : typeof item.userRole === "string"
                ? {
                    name: String(item.userRole),
                    enumValue: String(item.userRole),
                }
                : null;

    return {
        id: Number(item.id) || 0,
        name: String(item.name ?? ""),
        description: typeof item.description === "string" ? item.description : "",
        userRole,
        active: item.active !== false,
        userCount: Number(item.userCount) || 0,
        university: normalizeCommonDTO(item.university),
        // RoleResponse.permissions is List<RolePermissionResponse>, not List<Permission>.
        // Each entry wraps the permission definition with assignment metadata.
        permissions: asArray(item.permissions).map((entry) => {
            const assignment = asRecord(entry);
            const wrappedPermission = assignment.permission;
            const permission = normalizePermission(wrappedPermission ?? entry);
            if (wrappedPermission == null) {
                // Backward compatibility for older API responses returning Permission directly.
                return {
                    ...permission,
                    assignedBy: null,
                    assignmentActive: true,
                };
            }
            return {
                ...permission,
                assignedBy: normalizeCommonDTO(assignment.assignedBy),
                assignmentActive: assignment.active === true,
            };
        }),
        permissionActions: asArray<PermissionAction>(item.permissionActions),
    };
}

export function normalizeRoles(value: unknown): RoleResponse[] {
    return asArray(value)
        .map(normalizeRole)
        .filter((r) => r.id > 0);
}

/* -------------------------------------------------------------------------- */
/* API Service Functions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/user/role
 * Fetches all roles accessible by current user.
 */
export async function getAllRoles(): Promise<RoleResponse[]> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/user/role`);
        return normalizeRoles(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load roles."));
    }
}

/**
 * POST /{role}/user/role?universityId={universityId}
 * Creates a role for the specified university.
 */
export async function createRole(
    universityId: number,
    request: RoleRequest
): Promise<RoleResponse> {
    if (!Number.isSafeInteger(universityId) || universityId <= 0) {
        throw new Error("Please select a valid university.");
    }
    if (!request.name || !request.name.trim()) {
        throw new Error("Role name is required.");
    }
    if (!request.userRole) {
        throw new Error("Please select a role category.");
    }

    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/user/role`,
            request,
            { params: { universityId } }
        );
        return normalizeRole(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to create role."));
    }
}

/**
 * PUT /{role}/user/role?roleId={roleId}
 * Updates an existing role's name, description, category, or active status.
 */
export async function updateRole(
    roleId: number,
    request: RoleRequest
): Promise<RoleResponse> {
    if (!Number.isSafeInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid role ID.");
    }

    try {
        const response = await api.put<unknown>(
            `${getServiceBaseUrl()}/user/role`,
            request,
            { params: { roleId } }
        );
        return normalizeRole(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to update role."));
    }
}

/**
 * DELETE /{role}/user/role?roleId={roleId}
 * Deletes a role (allowed only if no users are assigned).
 */
export async function deleteRole(roleId: number): Promise<string> {
    if (!Number.isSafeInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid role ID.");
    }

    try {
        const response = await api.delete<unknown>(
            `${getServiceBaseUrl()}/user/role`,
            { params: { roleId } }
        );
        return typeof response.data === "string" && response.data.trim()
            ? response.data
            : "Role deleted successfully.";
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to delete role. It may be assigned to active users."
            )
        );
    }
}

/**
 * GET /{role}/user/role/enums?universityId={universityId}
 * Fetches available UserRoles enum choices for role assignment.
 */
export async function getRoleEnums(
    universityId: number
): Promise<UserRoleResponse[]> {
    if (!Number.isSafeInteger(universityId) || universityId <= 0) {
        return [];
    }

    try {
        const response = await api.get<unknown>(
            `${getServiceBaseUrl()}/user/role/enums`,
            { params: { universityId } }
        );
        const list = asArray(response.data);
        return list.map((item) => {
            const rec = asRecord(item);
            return {
                name: String(rec.name ?? rec.enumValue ?? ""),
                enumValue: String(rec.enumValue ?? ""),
            };
        }).filter((item) => Boolean(item.enumValue));
    } catch (error) {
        console.warn("Could not load dynamic role enums, using system defaults", error);
        return [
            { name: "Student", enumValue: "STUDENT" },
            { name: "Teacher / Faculty", enumValue: "TEACHER" },
            { name: "Section Mentor", enumValue: "MENTOR" },
            { name: "Program Coordinator", enumValue: "PROGRAM_COORDINATOR" },
            { name: "Head of Department", enumValue: "HEAD_OF_DEPARTMENT" },
            { name: "Dean of School", enumValue: "SCHOOL_DEAN" },
            { name: "Dean of School / University", enumValue: "DEAN" },
            { name: "Finance & Fee Accountant", enumValue: "ACCOUNTANT" },
            { name: "Librarian", enumValue: "LIBRARIAN" },
            { name: "Controller of Examinations", enumValue: "EXAM_CONTROLLER" },
            { name: "College Administrator", enumValue: "ADMIN" },
            { name: "University Super Admin", enumValue: "SUPER_ADMIN" },
            { name: "Hiring Department", enumValue: "HR" },
            { name: "Student Counselor", enumValue: "COUNSELOR" },
        ];
    }
}

/**
 * GET /{role}/user/permission
 * Fetches base permissions available in the system.
 */
export async function getRoleBasePermissions(): Promise<Permission[]> {
    try {
        const response = await api.get<unknown>(
            `${getServiceBaseUrl()}/user/permission`
        );
        return asArray(response.data).map((p) => normalizePermission(p));
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load system permissions.")
        );
    }
}

/**
 * PUT /{role}/user/permission?roleId={roleId}
 * Updates assigned permissions for a given role.
 * Notice: Backend expects an array of permission IDs: List<Long>.
 */
export async function updateRolePermissions(
    roleId: number,
    permissionIds: number[]
): Promise<RoleResponse> {
    if (!Number.isSafeInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid role ID.");
    }

    const safePermissionIds = Array.from(new Set(permissionIds)).filter(
        (id) => Number.isSafeInteger(id) && id > 0
    );

    try {
        const response = await api.put<unknown>(
            `${getServiceBaseUrl()}/user/permission`,
            safePermissionIds,
            { params: { roleId } }
        );
        return normalizeRole(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to update permissions for role.")
        );
    }
}

/**
 * GET /super-admin/filter/university
 * University filter from CommonController.java.
 */
export async function getUniversityFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(
            "/super-admin/filter/university"
        );
        return uniqueCommonDTOs(
            asArray(response.data).map(normalizeCommonDTO)
        );
    } catch {
        try {
            const altResponse = await api.get<unknown>(
                `${getServiceBaseUrl()}/filter/university`
            );
            return uniqueCommonDTOs(
                asArray(altResponse.data).map(normalizeCommonDTO)
            );
        } catch {
            return [];
        }
    }
}
