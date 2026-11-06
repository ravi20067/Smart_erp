// src/services/org/academicYearService.ts

import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ActiveStatus = "ENABLE" | "DISABLE";

export type PermissionAction = "UPDATE" | "DELETE";

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface AcademicYearRequest {
    name: string;
    code: string; // Editable middle code only. Never include postfix/prefix.
    activeStatus: ActiveStatus;
    startDate: string;
    endDate: string;
}

export interface AcademicYearResponse {
    id: number;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    current: boolean;
    activeStatus: ActiveStatus;
    courses: CommonDTO[];
    department: CommonDTO | null;
    school: CommonDTO | null;
    university: CommonDTO | null;
    permissionActions: PermissionAction[];
}

export interface AcademicYearFormData {
    departmentId: number | "";
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    startDate: string;
    endDate: string;
}

const getAcademicYearUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/academic-year`;
const getDepartmentFilterUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/filter/department`;

/* -------------------------------------------------------------------------- */
/* Response helpers                                                           */
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

export function extractErrorMessage(error: unknown): string {
    if (typeof error === "string" && error.trim()) return error;

    if (error && typeof error === "object") {
        const value = error as {
            message?: string;
            response?: {
                data?: unknown;
                status?: number;
            };
        };

        const data = value.response?.data;

        if (typeof data === "string" && data.trim()) return data;

        if (data && typeof data === "object") {
            const body = data as Record<string, unknown>;

            for (const key of ["message", "error", "detail", "title"]) {
                const message = body[key];

                if (typeof message === "string" && message.trim()) {
                    return message;
                }
            }
        }

        if (value.response?.status === 403) {
            return "You do not have permission to perform this action.";
        }

        if (value.response?.status === 404) {
            return "The requested record or endpoint was not found.";
        }

        if (value.response?.status === 409) {
            return "This operation conflicts with an existing record.";
        }

        if (value.message?.trim()) return value.message;
    }

    return "Something went wrong. Please try again.";
}

/* -------------------------------------------------------------------------- */
/* GET: Load all academic years                                               */
/* -------------------------------------------------------------------------- */

export async function getAllAcademicYears(): Promise<AcademicYearResponse[]> {
    const response = await api.get(getAcademicYearUrl());
    return unwrapArray<AcademicYearResponse>(response.data);
}

/* -------------------------------------------------------------------------- */
/* GET: Department options for the create form only                           */
/* GET /{role}/filter/department                                              */
/* -------------------------------------------------------------------------- */

export async function getDepartmentFilter(): Promise<CommonDTO[]> {
    const response = await api.get(getDepartmentFilterUrl());
    return unwrapArray<CommonDTO>(response.data);
}

/* -------------------------------------------------------------------------- */
/* GET: Fixed academic-year postfix                                           */
/* GET /{role}/academic-year/postfix?departmentId=...                         */
/* -------------------------------------------------------------------------- */

export async function getAcademicYearPostfix(
    departmentId: number,
    academicYearId?: number
): Promise<string> {
    const response = await api.get(`${getAcademicYearUrl()}/postfix`, {
        params: {
            departmentId,
            ...(academicYearId ? { academicYearId } : {}),
        },
    });

    const payload: unknown = response.data;

    if (typeof payload === "string") return payload.trim();

    if (payload && typeof payload === "object") {
        const body = payload as Record<string, unknown>;

        for (const key of ["postfix", "code", "value", "data"]) {
            const value = body[key];

            if (typeof value === "string") return value.trim();
        }
    }

    return "";
}

/* -------------------------------------------------------------------------- */
/* POST: Create academic year                                                 */
/* POST /{role}/academic-year?departmentId=...                                */
/* -------------------------------------------------------------------------- */

export async function createAcademicYear(
    departmentId: number,
    request: AcademicYearRequest
): Promise<AcademicYearResponse> {
    const response = await api.post(getAcademicYearUrl(), request, {
        params: { departmentId },
    });

    return response.data as AcademicYearResponse;
}

/* -------------------------------------------------------------------------- */
/* PUT: Update academic year                                                  */
/* PUT /{role}/academic-year?academicYearId=...                               */
/* -------------------------------------------------------------------------- */

export async function updateAcademicYear(
    academicYearId: number,
    request: AcademicYearRequest
): Promise<AcademicYearResponse> {
    const response = await api.put(getAcademicYearUrl(), request, {
        params: { academicYearId },
    });

    return response.data as AcademicYearResponse;
}

/* -------------------------------------------------------------------------- */
/* DELETE: Delete academic year                                               */
/* DELETE /{role}/academic-year?academicYearId=...                            */
/* -------------------------------------------------------------------------- */

export async function deleteAcademicYear(
    academicYearId: number
): Promise<string> {
    const response = await api.delete(getAcademicYearUrl(), {
        params: { academicYearId },
    });

    return typeof response.data === "string"
        ? response.data
        : "Academic year deleted successfully.";
}

/* -------------------------------------------------------------------------- */
/* POST: Switch current academic year                                         */
/* POST /{role}/academic-year/switch?departmentId=...&academicYearId=...      */
/* -------------------------------------------------------------------------- */

export async function switchAcademicYear(
    departmentId: number,
    academicYearId: number
): Promise<string> {
    const response = await api.post(`${getAcademicYearUrl()}/switch`, null, {
        params: { departmentId, academicYearId },
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