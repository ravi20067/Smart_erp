import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types — Aligned with SchoolController & School Response DTO                */
/* -------------------------------------------------------------------------- */

export type ActiveStatus = "ENABLE" | "DISABLE";

export type PermissionAction = "CREATE_CHILD" | "READ" | "UPDATE" | "DELETE";

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface CommonRequest {
    name: string;
    code: string;
}

export interface SchoolRequest {
    id: number;
    name: string;
    code: string;
    activeStatus: ActiveStatus;
}

export interface SchoolResponse {
    id: number;
    name: string;
    activeStatus: ActiveStatus;
    code: string;
    departments: CommonDTO[];
    permissionActions: PermissionAction[];
    university: CommonDTO;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface SchoolFormRequest {
    name: string;
    code: string;
}

export interface UpdateSchoolRequest {
    id: number;
    name: string;
    code: string;
    activeStatus: ActiveStatus;
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

export const normalizeSchoolResponse = (item: unknown): SchoolResponse => {
    if (!item || typeof item !== "object") {
        throw new Error("Invalid school record received from server.");
    }
    const s = item as Record<string, unknown>;
    return {
        id: Number(s.id ?? 0),
        name: typeof s.name === "string" ? s.name : "",
        activeStatus: s.activeStatus === "ENABLE" ? "ENABLE" : "DISABLE",
        code: typeof s.code === "string" ? s.code : "",
        departments: Array.isArray(s.departments)
            ? s.departments
                .map((d) => normalizeCommonDTO(d))
                .filter((d): d is CommonDTO => d !== null)
            : [],
        permissionActions: Array.isArray(s.permissionActions)
            ? (s.permissionActions as PermissionAction[])
            : [],
        university: normalizeCommonDTO(s.university) || { id: 0, name: "—", code: "" },
        createdAt: typeof s.createdAt === "string" ? s.createdAt : null,
        updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : null,
        createdBy: normalizeCommonDTO(s.createdBy),
        updatedBy: normalizeCommonDTO(s.updatedBy),
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
/* URL builder                                                                 */
/* -------------------------------------------------------------------------- */

const getSchoolUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base || "/super-admin"}/school`;
};

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(error: unknown): string {
    if (!error) {
        return "An unexpected error occurred. Please try again.";
    }

    if (typeof error === "string") return error;

    if (typeof error === "object" && error !== null) {
        const err = error as Record<string, unknown>;

        if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
            return "Unable to connect to the server. Check your connection and confirm that the backend is running.";
        }

        if (err.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        const response = err.response as {
            status?: number;
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
                for (const key of ["message", "error", "detail", "title"]) {
                    if (typeof d[key] === "string" && (d[key] as string).trim()) {
                        return d[key] as string;
                    }
                }

                if (Array.isArray(d.errors) && d.errors.length > 0) {
                    return d.errors
                        .map((item: unknown) => {
                            if (typeof item === "string") return item;
                            if (item && typeof item === "object") {
                                const value = item as Record<string, unknown>;
                                return String(
                                    value.defaultMessage ??
                                    value.message ??
                                    JSON.stringify(value)
                                );
                            }
                            return String(item);
                        })
                        .join(", ");
                }

                if (
                    d.errors &&
                    typeof d.errors === "object" &&
                    !Array.isArray(d.errors)
                ) {
                    return Object.entries(d.errors as Record<string, unknown>)
                        .map(([field, message]) => `${field}: ${String(message)}`)
                        .join(", ");
                }
            }

            switch (status) {
                case 400:
                    return "Invalid request. Check the information you entered.";
                case 401:
                    return "Your session has expired. Please sign in again.";
                case 403:
                    return "You do not have permission to perform this action.";
                case 404:
                    return "The requested school or resource was not found.";
                case 409:
                    return "A school with this name or code may already exist.";
                case 422:
                    return "The server could not process the submitted information.";
                default:
                    if (status && status >= 500) {
                        return "The server encountered an error. Please try again later.";
                    }
            }
        }

        if (typeof err.message === "string" && err.message.trim()) {
            return err.message;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "An unexpected error occurred. Please try again.";
}

/* -------------------------------------------------------------------------- */
/* Get all schools                                                            */
/* GET /{role}/school                                                         */
/* -------------------------------------------------------------------------- */

export async function getSchools(): Promise<SchoolResponse[]> {
    const response = await api.get<SchoolResponse[]>(getSchoolUrl());

    if (!Array.isArray(response.data)) {
        throw new Error("The server returned an invalid school list.");
    }

    return response.data.map(normalizeSchoolResponse);
}

/* -------------------------------------------------------------------------- */
/* University filter for creation                                             */
/* GET /super-admin/filter/university                                         */
/* -------------------------------------------------------------------------- */

export async function getUniversityFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<CommonDTO[]>(
            "/super-admin/filter/university"
        );

        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data
                .map((university) => normalizeCommonDTO(university))
                .filter(
                    (university): university is CommonDTO =>
                        university !== null &&
                        Number.isFinite(university.id) &&
                        university.id > 0
                );
        }
    } catch {
        // Fallback to university service listing if filter endpoint is restricted
    }

    try {
        const fallbackUrl = `${getBaseUrl().replace(/\/+$/, "") || "/super-admin"}/university`;
        const res = await api.get<Array<{ id: number; name: string; code?: string }>>(fallbackUrl);
        if (Array.isArray(res.data)) {
            return res.data
                .map((university) => normalizeCommonDTO(university))
                .filter(
                    (university): university is CommonDTO =>
                        university !== null &&
                        Number.isFinite(university.id) &&
                        university.id > 0
                );
        }
    } catch {
        // Ignored
    }

    return [];
}

/* -------------------------------------------------------------------------- */
/* Get fixed school prefix                                                    */
/* GET /{role}/school/prefix?universityId={id}&schoolId={optionalId}          */
/* -------------------------------------------------------------------------- */

export async function getSchoolPrefix(
    universityId: number,
    schoolId?: number
): Promise<string> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("Please select a valid university.");
    }

    const params: Record<string, number> = { universityId };

    if (schoolId != null && Number.isFinite(schoolId) && schoolId > 0) {
        params.schoolId = schoolId;
    }

    const response = await api.get<string>(`${getSchoolUrl()}/prefix`, {
        params,
        responseType: "text",
    });

    const raw = typeof response.data === "string" ? response.data : String(response.data ?? "");
    const clean = raw.replace(/^"|"$/g, "").trim();

    if (!clean) {
        throw new Error("The server did not return a valid school prefix.");
    }

    return clean;
}

/* -------------------------------------------------------------------------- */
/* Create school                                                              */
/* POST /{role}/school?universityId={id}                                      */
/* Body: CommonRequest ({ name, code })                                       */
/* -------------------------------------------------------------------------- */

export async function createSchool(
    universityId: number,
    request: CommonRequest
): Promise<SchoolResponse> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("Please select a university before creating a school.");
    }

    const response = await api.post<SchoolResponse>(getSchoolUrl(), request, {
        params: { universityId },
    });

    if (!response.data || typeof response.data.id !== "number") {
        throw new Error("The server did not return the created school.");
    }

    return normalizeSchoolResponse(response.data);
}

/* -------------------------------------------------------------------------- */
/* Update school                                                              */
/* PUT /{role}/school                                                         */
/* Body: SchoolRequest ({ id, name, code, activeStatus })                     */
/* -------------------------------------------------------------------------- */

export async function updateSchool(
    request: SchoolRequest
): Promise<SchoolResponse> {
    if (!Number.isFinite(request.id) || request.id <= 0) {
        throw new Error("A valid school ID is required.");
    }

    const response = await api.put<SchoolResponse>(getSchoolUrl(), request);

    if (!response.data || typeof response.data.id !== "number") {
        throw new Error("The server did not return the updated school.");
    }

    return normalizeSchoolResponse(response.data);
}

/* -------------------------------------------------------------------------- */
/* Delete school                                                              */
/* DELETE /{role}/school?schoolId={id}                                        */
/* -------------------------------------------------------------------------- */

export async function deleteSchool(schoolId: number): Promise<string> {
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
        throw new Error("A valid school ID is required.");
    }

    const response = await api.delete<string>(getSchoolUrl(), {
        params: { schoolId },
    });

    return typeof response.data === "string"
        ? response.data
        : "School deleted successfully.";
}
