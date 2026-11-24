import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types — Aligned with DepartmentController & Department Response DTO        */
/* -------------------------------------------------------------------------- */

export type ActiveStatus = "ENABLE" | "DISABLE";

export type PermissionAction = "CREATE_CHILD" | "READ" | "UPDATE" | "DELETE" | string;

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface DepartmentRequest {
    id?: number;
    name: string;
    code: string; // Suffix only, without fixed prefix
    activeStatus: ActiveStatus;
}

export interface DepartmentResponse {
    id: number;
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    courses?: CommonDTO[] | null;
    school?: CommonDTO | null;
    university?: CommonDTO | null;
    permissionActions?: PermissionAction[] | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface DepartmentCreateRequest {
    name: string;
    code: string; // Suffix only
}

/* -------------------------------------------------------------------------- */
/* Normalization & Audit Helpers                                              */
/* -------------------------------------------------------------------------- */

export const normalizeCommonDTO = (val: unknown): CommonDTO | null => {
    if (!val || typeof val !== "object") return null;
    const obj = val as Record<string, unknown>;
    const id = Number(obj.id);
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    const code = typeof obj.code === "string" ? obj.code.trim() : null;

    if (isNaN(id) && !name && !code) return null;

    return {
        id: isNaN(id) ? 0 : id,
        name: name || "System",
        code: code || null,
    };
};

export const normalizeDepartmentResponse = (item: unknown): DepartmentResponse => {
    if (!item || typeof item !== "object") {
        throw new Error("Invalid department record received from server.");
    }
    const d = item as Record<string, unknown>;
    return {
        id: Number(d.id ?? 0),
        name: typeof d.name === "string" ? d.name : "",
        code: typeof d.code === "string" ? d.code : "",
        activeStatus: d.activeStatus === "ENABLE" ? "ENABLE" : "DISABLE",
        courses: Array.isArray(d.courses)
            ? d.courses
                .map((c) => normalizeCommonDTO(c))
                .filter((c): c is CommonDTO => c !== null)
            : [],
        school: normalizeCommonDTO(d.school) || { id: 0, name: "—", code: "" },
        university: normalizeCommonDTO(d.university) || { id: 0, name: "—", code: "" },
        permissionActions: Array.isArray(d.permissionActions)
            ? (d.permissionActions as PermissionAction[])
            : [],
        createdAt: typeof d.createdAt === "string" ? d.createdAt : null,
        updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : null,
        createdBy: normalizeCommonDTO(d.createdBy),
        updatedBy: normalizeCommonDTO(d.updatedBy),
    };
};

export const formatAuditActor = (
    actor?: CommonDTO | null,
    fallback = "System Administrator"
): string => {
    if (!actor) return fallback;
    if (actor.name && actor.code) return `${actor.name} (${actor.code})`;
    return actor.name || fallback;
};

/* -------------------------------------------------------------------------- */
/* URL builders                                                               */
/* -------------------------------------------------------------------------- */

const getDepartmentUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/department`;
};

const getFilterUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/filter`;
};

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    if (typeof error === "string" && error.trim()) {
        return error.trim();
    }

    if (!error || typeof error !== "object") {
        return fallback;
    }

    const err = error as {
        message?: string;
        code?: string;
        response?: {
            status?: number;
            data?: unknown;
        };
    };

    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        return "Unable to connect to the server. Check your connection and confirm that the backend is running.";
    }

    if (err.code === "ECONNABORTED") {
        return "The request timed out. Please try again.";
    }

    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data.trim();
    }

    if (data && typeof data === "object") {
        const body = data as Record<string, unknown>;

        const message =
            body.message ??
            body.error ??
            body.detail ??
            body.description;

        if (typeof message === "string" && message.trim()) {
            return message.trim();
        }

        if (Array.isArray(body.errors)) {
            const messages = body.errors
                .map((item) => {
                    if (typeof item === "string") return item;

                    if (item && typeof item === "object") {
                        const value = item as Record<string, unknown>;
                        return value.defaultMessage ?? value.message;
                    }

                    return "";
                })
                .filter(
                    (item): item is string =>
                        typeof item === "string" && item.trim().length > 0
                );

            if (messages.length > 0) {
                return messages.join(", ");
            }
        }
    }

    switch (err.response?.status) {
        case 400:
            return "The request is invalid. Please check the entered information.";
        case 401:
            return "Your session has expired. Please log in again.";
        case 403:
            return "You do not have permission to perform this action.";
        case 404:
            return "The requested department or resource was not found.";
        case 409:
            return "A department with this name or code already exists in this school.";
        case 422:
            return "The server could not process the provided information.";
        case 500:
            return "A server error occurred. Please try again later.";
        default:
            return err.message?.trim() || fallback;
    }
}

/* -------------------------------------------------------------------------- */
/* Response list normalization                                                */
/* -------------------------------------------------------------------------- */

function normalizeRawList(response: unknown): unknown[] {
    let result = response;

    if (result && typeof result === "object" && !Array.isArray(result)) {
        const object = result as Record<string, unknown>;

        if (Array.isArray(object.data)) {
            result = object.data;
        } else if (Array.isArray(object.content)) {
            result = object.content;
        }
    }

    if (!Array.isArray(result)) {
        return [];
    }

    return result;
}

/* -------------------------------------------------------------------------- */
/* Get all departments                                                        */
/* GET /{role}/department                                                     */
/* -------------------------------------------------------------------------- */

export async function getAllDepartments(): Promise<DepartmentResponse[]> {
    const response = await api.get(getDepartmentUrl());
    const list = normalizeRawList(response.data);
    return list.map(normalizeDepartmentResponse);
}

/* -------------------------------------------------------------------------- */
/* Get one department                                                         */
/* -------------------------------------------------------------------------- */

export async function getDepartmentById(
    departmentId: number
): Promise<DepartmentResponse> {
    const departments = await getAllDepartments();
    const department = departments.find((item) => item.id === departmentId);

    if (!department) {
        throw new Error(`Department with ID ${departmentId} was not found.`);
    }

    return department;
}

/* -------------------------------------------------------------------------- */
/* School options for creating a department                                   */
/* GET /{role}/filter/school                                                  */
/* -------------------------------------------------------------------------- */

export async function getSchoolFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get(`${getFilterUrl()}/school`);
        const list = normalizeRawList(response.data);
        if (list.length > 0) {
            return list
                .map(normalizeCommonDTO)
                .filter((item): item is CommonDTO => item !== null && item.id > 0);
        }
    } catch {
        // Fallback to school service endpoint if filter is restricted
    }

    try {
        const fallbackUrl = `${getBaseUrl().replace(/\/+$/, "") || "/super-admin"}/school`;
        const res = await api.get(fallbackUrl);
        const list = normalizeRawList(res.data);
        if (list.length > 0) {
            return list
                .map(normalizeCommonDTO)
                .filter((item): item is CommonDTO => item !== null && item.id > 0);
        }
    } catch {
        // Ignored
    }

    return [];
}

/* -------------------------------------------------------------------------- */
/* Fixed department prefix                                                    */
/* GET /{role}/department/prefix?schoolId={schoolId}&departmentId={optional}  */
/* -------------------------------------------------------------------------- */

export async function getDepartmentPrefix(
    schoolId: number,
    departmentId?: number
): Promise<string> {
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
        throw new Error("Select a valid school before loading the prefix.");
    }

    const params: Record<string, number> = { schoolId };

    if (
        departmentId !== undefined &&
        Number.isFinite(departmentId) &&
        departmentId > 0
    ) {
        params.departmentId = departmentId;
    }

    const response = await api.get<string>(`${getDepartmentUrl()}/prefix`, {
        params,
        responseType: "text",
    });

    const raw = typeof response.data === "string" ? response.data : String(response.data ?? "");
    const clean = raw.replace(/^"|"$/g, "").trim();

    if (!clean) {
        throw new Error("The server returned an invalid department prefix.");
    }

    return clean;
}

/* -------------------------------------------------------------------------- */
/* Create department                                                          */
/* POST /{role}/department?schoolId={schoolId}                                */
/* Body: DepartmentCreateRequest ({ name, code })                             */
/* -------------------------------------------------------------------------- */

export async function createDepartment(
    schoolId: number,
    request: DepartmentCreateRequest
): Promise<DepartmentResponse> {
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
        throw new Error("A valid school is required.");
    }

    const payload: DepartmentCreateRequest = {
        name: request.name.trim(),
        code: request.code.trim(),
    };

    if (!payload.name) {
        throw new Error("Department name is required.");
    }

    if (!payload.code) {
        throw new Error("Department code is required.");
    }

    const response = await api.post(getDepartmentUrl(), payload, {
        params: { schoolId },
    });

    return normalizeDepartmentResponse(response.data);
}

/* -------------------------------------------------------------------------- */
/* Update department                                                          */
/* PUT /{role}/department                                                     */
/* Body: DepartmentRequest ({ id, name, code, activeStatus })                 */
/* -------------------------------------------------------------------------- */

export async function updateDepartment(
    request: DepartmentRequest
): Promise<DepartmentResponse> {
    if (!Number.isFinite(request.id) || !request.id || request.id <= 0) {
        throw new Error("A valid department ID is required for updating.");
    }

    const payload: DepartmentRequest = {
        id: request.id,
        name: request.name.trim(),
        code: request.code.trim(),
        activeStatus: request.activeStatus,
    };

    if (!payload.name) {
        throw new Error("Department name is required.");
    }

    if (!payload.code) {
        throw new Error("Department code is required.");
    }

    const response = await api.put(getDepartmentUrl(), payload);
    return normalizeDepartmentResponse(response.data);
}

/* -------------------------------------------------------------------------- */
/* Delete department                                                          */
/* DELETE /{role}/department?departmentId={departmentId}                      */
/* -------------------------------------------------------------------------- */

export async function deleteDepartment(
    departmentId: number
): Promise<string> {
    if (!Number.isFinite(departmentId) || departmentId <= 0) {
        throw new Error("A valid department ID is required for deletion.");
    }

    const response = await api.delete(getDepartmentUrl(), {
        params: { departmentId },
    });

    if (typeof response.data === "string" && response.data.trim()) {
        return response.data.trim();
    }

    if (response.data && typeof response.data === "object") {
        const body = response.data as Record<string, unknown>;
        const message = body.message ?? body.data;

        if (typeof message === "string" && message.trim()) {
            return message.trim();
        }
    }

    return "Department deleted successfully.";
}
