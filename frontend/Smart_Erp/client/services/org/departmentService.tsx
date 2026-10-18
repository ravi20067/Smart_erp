import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ActiveStatus = "ENABLE" | "DISABLE";

export type PermissionAction = "UPDATE" | "DELETE" | string;

export interface CommonDTO {
    id: number;
    name: string;
    code: string;
}

export interface DepartmentRequest {
    id?: number;
    name: string;
    code: string; // Send only the code suffix, without the fixed prefix.
    activeStatus: ActiveStatus;
}

export interface DepartmentResponse {
    id: number;
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    academicYears?: CommonDTO[] | null;
    school?: CommonDTO | null;
    university?: CommonDTO | null;
    permissionActions?: PermissionAction[] | null;
}

export interface DepartmentCreateRequest {
    name: string;
    code: string; // Send only the code suffix.
}

const getDepartmentUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/department`;
const getFilterUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/filter`;

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
        response?: {
            status?: number;
            data?: unknown;
        };
    };

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
            return "This record already exists or conflicts with another record.";
        case 422:
            return "The server could not process the provided information.";
        case 500:
            return "A server error occurred. Please try again later.";
        default:
            return err.message?.trim() || fallback;
    }
}

/* -------------------------------------------------------------------------- */
/* Response normalization                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Supports an API response containing either:
 *   DepartmentResponse[]
 * or:
 *   { data: DepartmentResponse[] }
 *   { content: DepartmentResponse[] }
 *
 * It deliberately throws for unexpected response shapes instead of silently
 * treating an API contract error as an empty department list.
 */
function normalizeDepartmentList(response: unknown): DepartmentResponse[] {
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
        throw new Error(
            "Unexpected department response. Expected a list of departments."
        );
    }

    return result as DepartmentResponse[];
}

function normalizeCommonList(response: unknown): CommonDTO[] {
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
        throw new Error("Unexpected filter response. Expected a list.");
    }

    return result as CommonDTO[];
}

/* -------------------------------------------------------------------------- */
/* Get all departments                                                        */
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/department
 *
 * Loads all departments once.
 * Table filtering is handled locally by the main page.
 */
export async function getAllDepartments(): Promise<DepartmentResponse[]> {
    const response = await api.get(getDepartmentUrl());
    return normalizeDepartmentList(response.data);
}

/* -------------------------------------------------------------------------- */
/* Get one department                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The supplied controller does not define GET /department/{id}.
 * Therefore, find the department from the already-loaded full list.
 */
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
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/filter/school
 *
 * This API is used to populate the Add Department form.
 * It is not called when the table's school filter changes.
 */
export async function getSchoolFilter(): Promise<CommonDTO[]> {
    const response = await api.get(`${getFilterUrl()}/school`);
    return normalizeCommonList(response.data);
}

/* -------------------------------------------------------------------------- */
/* Fixed department prefix                                                    */
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/department/prefix?schoolId={schoolId}
 *
 * The backend accepts an optional departmentId, but calculates the prefix
 * using schoolId according to the supplied controller.
 */
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

    const response = await api.get(`${getDepartmentUrl()}/prefix`, { params });

    const value: unknown = response.data;

    if (typeof value === "string") {
        return value.trim();
    }

    if (value && typeof value === "object") {
        const body = value as Record<string, unknown>;
        const prefix = body.prefix ?? body.code ?? body.data;

        if (typeof prefix === "string") {
            return prefix.trim();
        }
    }

    throw new Error("The server returned an invalid department prefix.");
}

/* -------------------------------------------------------------------------- */
/* Create department                                                          */
/* -------------------------------------------------------------------------- */

/**
 * POST /{role}/department?schoolId={schoolId}
 *
 * Request body:
 * {
 *   "name": "Computer Science",
 *   "code": "CSE"
 * }
 *
 * The fixed prefix is displayed in the UI but is not included in the code
 * sent to this endpoint.
 */
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

    return response.data as DepartmentResponse;
}

/* -------------------------------------------------------------------------- */
/* Update department                                                          */
/* -------------------------------------------------------------------------- */

/**
 * PUT /{role}/department
 *
 * Request body follows the supplied DepartmentRequest DTO:
 * {
 *   "id": 1,
 *   "name": "Computer Science",
 *   "code": "CSE",
 *   "activeStatus": "ENABLE"
 * }
 *
 * No schoolId query parameter is added because the supplied controller's
 * update method does not declare one.
 */
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
    return response.data as DepartmentResponse;
}

/* -------------------------------------------------------------------------- */
/* Delete department                                                          */
/* -------------------------------------------------------------------------- */

/**
 * DELETE /{role}/department?departmentId={departmentId}
 */
export async function deleteDepartment(
    departmentId: number
): Promise<string> {
    if (!Number.isFinite(departmentId) || departmentId <= 0) {
        throw new Error("A valid department ID is required for deletion.");
    }

    const response = await api.delete(getDepartmentUrl(), {
        params: { departmentId },
    });

    if (typeof response.data === "string") {
        return response.data;
    }

    if (response.data && typeof response.data === "object") {
        const body = response.data as Record<string, unknown>;
        const message = body.message ?? body.data;

        if (typeof message === "string") {
            return message;
        }
    }

    return "Department deleted successfully.";
}