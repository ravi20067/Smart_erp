// src/services/academic/academicYearService.ts

import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types — Aligned with AcademicYearController & Response DTO                 */
/* -------------------------------------------------------------------------- */

export type ActiveStatus = "ENABLE" | "DISABLE";

export type PermissionAction = "CREATE_CHILD" | "READ" | "UPDATE" | "DELETE" | string;

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface AcademicYearRequest {
    name: string;
    code: string; // Middle code suffix; backend appends university code as postfix
    activeStatus: ActiveStatus;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

export interface AcademicYearResponse {
    id: number;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    current: boolean;
    activeStatus: ActiveStatus;
    university?: CommonDTO | null;
    permissionActions?: PermissionAction[] | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface AcademicYearFormData {
    universityId: number | "";
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    startDate: string;
    endDate: string;
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

export const normalizeAcademicYearResponse = (item: unknown): AcademicYearResponse => {
    if (!item || typeof item !== "object") {
        throw new Error("Invalid academic year record received from server.");
    }
    const y = item as Record<string, unknown>;
    return {
        id: Number(y.id ?? 0),
        name: typeof y.name === "string" ? y.name : "",
        code: typeof y.code === "string" ? y.code : "",
        startDate: typeof y.startDate === "string" ? y.startDate : "",
        endDate: typeof y.endDate === "string" ? y.endDate : "",
        current: Boolean(y.current),
        activeStatus: y.activeStatus === "ENABLE" ? "ENABLE" : "DISABLE",
        university: normalizeCommonDTO(y.university) || { id: 0, name: "—", code: "" },
        permissionActions: Array.isArray(y.permissionActions)
            ? (y.permissionActions as PermissionAction[])
            : [],
        createdAt: typeof y.createdAt === "string" ? y.createdAt : null,
        updatedAt: typeof y.updatedAt === "string" ? y.updatedAt : null,
        createdBy: normalizeCommonDTO(y.createdBy),
        updatedBy: normalizeCommonDTO(y.updatedBy),
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

const getAcademicYearUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/academic-year`;
};

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    if (typeof error === "string" && error.trim()) return error.trim();

    if (error && typeof error === "object") {
        const value = error as {
            message?: string;
            code?: string;
            response?: {
                data?: unknown;
                status?: number;
            };
        };

        if (value.code === "ERR_NETWORK" || value.message === "Network Error") {
            return "Unable to connect to the server. Check your connection and confirm that the backend is running.";
        }

        if (value.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        const data = value.response?.data;

        if (typeof data === "string" && data.trim()) return data.trim();

        if (data && typeof data === "object") {
            const body = data as Record<string, unknown>;

            for (const key of ["message", "error", "detail", "title"]) {
                const message = body[key];
                if (typeof message === "string" && message.trim()) {
                    return message.trim();
                }
            }

            if (Array.isArray(body.errors) && body.errors.length > 0) {
                return body.errors
                    .map((item) => {
                        if (typeof item === "string") return item;
                        if (item && typeof item === "object") {
                            const val = item as Record<string, unknown>;
                            return String(val.defaultMessage || val.message || JSON.stringify(val));
                        }
                        return String(item);
                    })
                    .join(", ");
            }
        }

        const status = value.response?.status;
        if (status === 400) return "Invalid request. Please check the entered data.";
        if (status === 401) return "Your session has expired. Please log in again.";
        if (status === 403) return "You do not have permission to perform this action.";
        if (status === 404) return "The requested academic year or resource was not found.";
        if (status === 409) return "An academic year with this code or date range already exists.";
        if (status === 422) return "The server could not process the provided data.";
        if (status && status >= 500) return "A server error occurred. Please try again later.";

        if (value.message?.trim()) return value.message;
    }

    return fallback;
}

/* -------------------------------------------------------------------------- */
/* Raw list unwrap helper                                                     */
/* -------------------------------------------------------------------------- */

function unwrapArray<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];

    if (payload && typeof payload === "object") {
        const data = payload as Record<string, unknown>;

        if (Array.isArray(data.data)) return data.data as T[];
        if (Array.isArray(data.content)) return data.content as T[];
        if (Array.isArray(data.result)) return data.result as T[];
    }

    return [];
}

/* -------------------------------------------------------------------------- */
/* GET: Load all academic years                                               */
/* GET /{role}/academic-year                                                  */
/* -------------------------------------------------------------------------- */

export async function getAllAcademicYears(): Promise<AcademicYearResponse[]> {
    const response = await api.get(getAcademicYearUrl());
    const raw = unwrapArray<unknown>(response.data);
    return raw.map(normalizeAcademicYearResponse);
}

/* -------------------------------------------------------------------------- */
/* GET: University filter options from CommonController                       */
/* GET /{role}/filter/university or /super-admin/filter/university            */
/* -------------------------------------------------------------------------- */

export async function getUniversityFilter(): Promise<CommonDTO[]> {
    const roleBase = getBaseUrl().replace(/\/+$/, "") || "/super-admin";

    // 1. CommonController endpoint using current role
    try {
        const response = await api.get<CommonDTO[]>(`${roleBase}/filter/university`);
        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data
                .map(normalizeCommonDTO)
                .filter(
                    (u): u is CommonDTO =>
                        u !== null && Number.isFinite(u.id) && u.id > 0
                );
        }
    } catch {
        // Fallback
    }

    // 2. CommonController super-admin endpoint fallback
    try {
        const response = await api.get<CommonDTO[]>("/super-admin/filter/university");
        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data
                .map(normalizeCommonDTO)
                .filter(
                    (u): u is CommonDTO =>
                        u !== null && Number.isFinite(u.id) && u.id > 0
                );
        }
    } catch {
        // Fallback
    }

    // 3. Fallback to general university list
    try {
        const fallbackUrl = `${roleBase}/university`;
        const res = await api.get<Array<{ id: number; name: string; code?: string }>>(fallbackUrl);
        if (Array.isArray(res.data)) {
            return res.data
                .map(normalizeCommonDTO)
                .filter(
                    (u): u is CommonDTO =>
                        u !== null && Number.isFinite(u.id) && u.id > 0
                );
        }
    } catch {
        // Ignored
    }

    return [];
}

export const getDepartmentFilter = getUniversityFilter;

/* -------------------------------------------------------------------------- */
/* GET: Postfix for academic year code                                       */
/* GET /{role}/academic-year/postfix?universityId=...                         */
/* -------------------------------------------------------------------------- */

export async function getAcademicYearPostfix(
    universityId: number,
    academicYearId?: number
): Promise<string> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        return "";
    }
    try {
        const response = await api.get<string>(`${getAcademicYearUrl()}/postfix`, {
            params: {
                universityId,
                ...(academicYearId ? { academicYearId } : {}),
            },
        });
        return typeof response.data === "string" ? response.data : "";
    } catch {
        return "";
    }
}

/* -------------------------------------------------------------------------- */
/* POST: Create academic year                                                 */
/* POST /{role}/academic-year?universityId=...                                */
/* -------------------------------------------------------------------------- */

export async function createAcademicYear(
    universityId: number,
    request: AcademicYearRequest
): Promise<AcademicYearResponse> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("A valid university is required to create an academic year.");
    }

    const response = await api.post(getAcademicYearUrl(), request, {
        params: { universityId },
    });

    return normalizeAcademicYearResponse(response.data);
}

/* -------------------------------------------------------------------------- */
/* PUT: Update academic year                                                  */
/* PUT /{role}/academic-year?academicYearId=...                               */
/* -------------------------------------------------------------------------- */

export async function updateAcademicYear(
    academicYearId: number,
    request: AcademicYearRequest
): Promise<AcademicYearResponse> {
    if (!Number.isFinite(academicYearId) || academicYearId <= 0) {
        throw new Error("A valid academic year ID is required for updating.");
    }

    const response = await api.put(getAcademicYearUrl(), request, {
        params: { academicYearId },
    });

    return normalizeAcademicYearResponse(response.data);
}

/* -------------------------------------------------------------------------- */
/* DELETE: Delete academic year                                               */
/* DELETE /{role}/academic-year?academicYearId=...                            */
/* -------------------------------------------------------------------------- */

export async function deleteAcademicYear(
    academicYearId: number
): Promise<string> {
    if (!Number.isFinite(academicYearId) || academicYearId <= 0) {
        throw new Error("A valid academic year ID is required for deletion.");
    }

    const response = await api.delete(getAcademicYearUrl(), {
        params: { academicYearId },
    });

    return typeof response.data === "string"
        ? response.data
        : "Academic year deleted successfully.";
}

/* -------------------------------------------------------------------------- */
/* POST: Switch current academic year for a university                        */
/* POST /{role}/academic-year/switch?universityId=...&academicYearId=...      */
/* -------------------------------------------------------------------------- */

export async function switchAcademicYear(
    universityId: number,
    academicYearId: number
): Promise<string> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("A valid university is required to switch academic year.");
    }
    if (!Number.isFinite(academicYearId) || academicYearId <= 0) {
        throw new Error("A valid academic year ID is required to switch academic year.");
    }

    const response = await api.post(`${getAcademicYearUrl()}/switch`, null, {
        params: { universityId, academicYearId },
    });

    return typeof response.data === "string"
        ? response.data
        : "Academic year switched successfully.";
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

export function uniqueDTOs(items: Array<CommonDTO | null | undefined>): CommonDTO[] {
    const map = new Map<number, CommonDTO>();

    for (const item of items) {
        if (
            item &&
            Number.isFinite(item.id) &&
            item.id > 0 &&
            typeof item.name === "string" &&
            !map.has(item.id)
        ) {
            map.set(item.id, item);
        }
    }

    return [...map.values()].sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

export function hasPermission(
    year: AcademicYearResponse,
    action: PermissionAction
): boolean {
    if (!year.permissionActions || year.permissionActions.length === 0) {
        return true;
    }
    return year.permissionActions.includes(action);
}

export function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getStatusLabel(status: ActiveStatus | null | undefined): string {
    if (status === "ENABLE") return "Active";
    if (status === "DISABLE") return "Inactive";
    return "Unknown";
}

/**
 * Removes the fixed postfix from the end of the full code.
 */
export function extractEditableCode(
    fullCode: string | null | undefined,
    postfix: string
): string {
    const code = (fullCode ?? "").trim();

    if (postfix && code.endsWith(postfix)) {
        return code.slice(0, -postfix.length).trim();
    }

    return code;
}

export const removePostfix = extractEditableCode;
