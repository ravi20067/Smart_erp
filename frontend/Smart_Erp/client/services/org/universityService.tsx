import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* University API contract — aligned with UniversityController               */
/* -------------------------------------------------------------------------- */

export type ActiveStatus = "ENABLE" | "DISABLE";

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface UniversityResponse {
    id: number;
    name: string;
    code: string;
    noOfUser: number;
    activeStatus: ActiveStatus;
    noOfStudent: number;
    noOfTeacher: number;
    school?: CommonDTO[] | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface UniversityCreateRequest {
    name: string;
    code: string;
}

export interface UniversityUpdateRequest {
    name: string;
    activeStatus: ActiveStatus;
}

/* -------------------------------------------------------------------------- */
/* Normalization and Audit Helpers                                             */
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

export const normalizeUniversityResponse = (
    item: UniversityResponse
): UniversityResponse => ({
    ...item,
    school: Array.isArray(item.school)
        ? item.school.map((s) => normalizeCommonDTO(s)).filter((s): s is CommonDTO => s !== null)
        : [],
    createdBy: normalizeCommonDTO(item.createdBy),
    updatedBy: normalizeCommonDTO(item.updatedBy),
});

export const formatAuditActor = (
    actor?: CommonDTO | null,
    fallback = "System Administrator"
): string => {
    if (!actor) return fallback;
    if (actor.name && actor.code) return `${actor.name} (${actor.code})`;
    return actor.name || fallback;
};

/* -------------------------------------------------------------------------- */
/* URL builder                                                                 */
/* -------------------------------------------------------------------------- */

const getUniversityUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/university`;
};

/* -------------------------------------------------------------------------- */
/* API Service Functions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * GET /super-admin/university
 * Retrieves the full list of universities with active status, audit metadata, and metrics.
 */
export const getUniversities = async (): Promise<UniversityResponse[]> => {
    const response = await api.get<UniversityResponse[]>(getUniversityUrl());
    const data = response.data;
    if (!Array.isArray(data)) return [];
    return data.map((item) => normalizeUniversityResponse(item));
};

/**
 * POST /super-admin/university
 * Body: { name, code }
 */
export const createUniversity = async (
    request: UniversityCreateRequest
): Promise<UniversityResponse> => {
    const response = await api.post<UniversityResponse>(
        getUniversityUrl(),
        request
    );
    return normalizeUniversityResponse(response.data);
};

/**
 * PUT /super-admin/university/{universityId}
 * Body: { name, activeStatus }
 */
export const updateUniversity = async (
    universityId: number,
    request: UniversityUpdateRequest
): Promise<UniversityResponse> => {
    const response = await api.put<UniversityResponse>(
        `${getUniversityUrl()}/${universityId}`,
        request
    );
    return normalizeUniversityResponse(response.data);
};

/**
 * DELETE /super-admin/university/{universityId}
 * Deletes a university if no dependent schools, users, academic years, or scholarships exist.
 */
export const deleteUniversity = async (
    universityId: number
): Promise<string> => {
    const response = await api.delete<string>(
        `${getUniversityUrl()}/${universityId}`
    );
    return response.data;
};

/* -------------------------------------------------------------------------- */
/* Error extraction utility                                                    */
/* -------------------------------------------------------------------------- */

export function extractUniversityErrorMessage(
    error: unknown,
    fallback = "An unexpected error occurred. Please try again."
): string {
    if (!error) return fallback;

    if (typeof error === "string") return error;

    if (error instanceof Error && error.message) return error.message;

    if (typeof error === "object") {
        const errObj = error as Record<string, unknown>;

        if (errObj.code === "ERR_NETWORK" || errObj.message === "Network Error") {
            return "Unable to connect to the server. Please check your network connection or verify that the backend is running.";
        }
        if (errObj.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        const response = errObj.response as {
            status?: number;
            statusText?: string;
            data?: unknown;
        } | undefined;

        if (response) {
            const status = response.status;
            const data = response.data;

            if (typeof data === "string" && data.trim()) {
                return data;
            }

            if (data && typeof data === "object") {
                const d = data as Record<string, unknown>;
                if (typeof d.message === "string" && d.message.trim()) {
                    return d.message;
                }
                if (typeof d.error === "string" && d.error.trim()) {
                    return d.error;
                }
                if (typeof d.detail === "string" && d.detail.trim()) {
                    return d.detail;
                }
                if (Array.isArray(d.errors) && d.errors.length > 0) {
                    return d.errors
                        .map((e: unknown) => {
                            if (typeof e === "string") return e;
                            const r = e as Record<string, unknown>;
                            return String(r.defaultMessage || r.message || JSON.stringify(e));
                        })
                        .join(", ");
                }
                if (d.errors && typeof d.errors === "object") {
                    const entries = Object.entries(d.errors as Record<string, unknown>);
                    if (entries.length > 0) {
                        return entries.map(([field, msg]) => `${field}: ${msg}`).join(", ");
                    }
                }
            }

            if (status === 400) return "Invalid data provided. Please verify the form inputs.";
            if (status === 401) return "Your session has expired. Please log in again.";
            if (status === 403) return "Access denied. Super-administrator privileges are required.";
            if (status === 404) return "The requested university was not found.";
            if (status === 409) return "A university with this name or code already exists.";
            if (status === 422) return "Unprocessable entity. Please verify parameters.";
            if (status && status >= 500) return "Server encountered an internal error. Please try again later.";
        }
    }

    return fallback;
}
