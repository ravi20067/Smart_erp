import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AmountType = "PERCENTAGE" | "NUMBER";
export type ScholarshipType = "PERMANENT" | "ENROLLMENT" | "ONE_TIME";
export type ScholarshipPermission = "UPDATE" | "DELETE" | "CREATE" | "VIEW" | string;

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface ScholarshipRequest {
    name: string;
    code: string;
    description: string;
    number: number;
    status: boolean;
    amountType: AmountType;
    scholarshipType: ScholarshipType;
}

export interface ScholarshipResponse {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    number: number;
    amountType: AmountType;
    scholarshipType: ScholarshipType;
    status: boolean;
    university?: CommonDTO | null;
    permissionActions?: ScholarshipPermission[] | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

const getScholarshipUrl = (): string =>
    `${getBaseUrl().replace(/\/+$/, "")}/scholarships`;

const getFilterUrl = (): string =>
    `${getBaseUrl().replace(/\/+$/, "")}/filter`;

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractScholarshipError(
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
        return "Unable to connect to the server. Check your connection.";
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

        for (const key of ["message", "error", "detail", "description", "title"]) {
            const val = body[key];
            if (typeof val === "string" && val.trim()) {
                return val.trim();
            }
        }

        if (Array.isArray(body.errors) && body.errors.length > 0) {
            const messages = body.errors
                .map((item) => {
                    if (typeof item === "string") return item;
                    if (item && typeof item === "object") {
                        const value = item as Record<string, unknown>;
                        return String(value.defaultMessage ?? value.message ?? value.field ?? "");
                    }
                    return "";
                })
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join(", ");
            }
        }
    }

    switch (err.response?.status) {
        case 400:
            return "Invalid request. Please check the entered information.";
        case 401:
            return "Your session has expired. Please sign in again.";
        case 403:
            return "You do not have permission to perform this action.";
        case 404:
            return "The requested scholarship was not found.";
        case 409:
            return "A scholarship with this code or name may already exist.";
        case 422:
            return "The submitted scholarship data could not be processed.";
        case 500:
            return "A server error occurred. Please try again later.";
        default:
            return err.message?.trim() || fallback;
    }
}

/* -------------------------------------------------------------------------- */
/* Normalization helpers                                                      */
/* -------------------------------------------------------------------------- */

function ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeCommonDTO(value: unknown): CommonDTO | null {
    if (!value || typeof value !== "object") return null;
    const item = value as Record<string, unknown>;
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) return null;
    return {
        id,
        name: String(item.name ?? "").trim(),
        code: typeof item.code === "string" ? item.code.trim() : null,
    };
}

function normalizeScholarship(value: unknown): ScholarshipResponse {
    const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

    const idNum = Number(item.id);
    const numberNum = Number(item.number);

    return {
        id: Number.isSafeInteger(idNum) && idNum > 0 ? idNum : 0,
        name: String(item.name ?? "").trim(),
        code: String(item.code ?? "").trim(),
        description: item.description ? String(item.description).trim() : null,
        number: Number.isFinite(numberNum) ? numberNum : 0,
        amountType: (String(item.amountType ?? "NUMBER").toUpperCase() as AmountType) || "NUMBER",
        scholarshipType: (String(item.scholarshipType ?? "PERMANENT").toUpperCase() as ScholarshipType) || "PERMANENT",
        status: Boolean(item.status),
        university: normalizeCommonDTO(item.university),
        permissionActions: Array.isArray(item.permissionActions)
            ? (item.permissionActions as ScholarshipPermission[])
            : [],
        createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
        createdBy: normalizeCommonDTO(item.createdBy),
        updatedBy: normalizeCommonDTO(item.updatedBy),
    };
}

function normalizeCommonList(response: unknown): CommonDTO[] {
    return ensureArray<CommonDTO>(response)
        .filter(
            (item) =>
                item &&
                Number.isFinite(Number(item.id)) &&
                Number(item.id) > 0 &&
                typeof item.name === "string"
        )
        .map((item) => ({
            id: Number(item.id),
            name: item.name.trim(),
            code: item.code ? item.code.trim() : null,
        }));
}

/* -------------------------------------------------------------------------- */
/* API Methods                                                                */
/* -------------------------------------------------------------------------- */

/**
 * GET {baseUrl}/scholarships
 */
export async function getScholarships(): Promise<ScholarshipResponse[]> {
    try {
        const response = await api.get<unknown>(getScholarshipUrl());
        return ensureArray(response.data).map(normalizeScholarship);
    } catch (error) {
        throw new Error(extractScholarshipError(error, "Unable to load scholarships."));
    }
}

/**
 * GET {baseUrl}/filter/university
 */
export async function getUniversityFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getFilterUrl()}/university`);
        return normalizeCommonList(response.data);
    } catch (error) {
        throw new Error(extractScholarshipError(error, "Unable to load universities."));
    }
}

/**
 * GET {baseUrl}/scholarships/prefix?universityId={universityId}&id={id}
 */
export async function getScholarshipPrefix(
    universityId: number,
    id?: number
): Promise<string> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("Please select a valid university.");
    }

    try {
        const response = await api.get<unknown>(`${getScholarshipUrl()}/prefix`, {
            params: {
                universityId,
                ...(id != null ? { id } : {}),
            },
        });

        if (typeof response.data === "string" && response.data.trim()) {
            return response.data.trim();
        }

        if (response.data && typeof response.data === "object") {
            const body = response.data as Record<string, unknown>;
            const val = body.prefix ?? body.data ?? body.value;
            if (typeof val === "string" && val.trim()) {
                return val.trim();
            }
        }

        throw new Error("The server did not return a valid scholarship prefix.");
    } catch (error) {
        throw new Error(extractScholarshipError(error, "Unable to resolve scholarship prefix."));
    }
}

/**
 * POST {baseUrl}/scholarships?universityId={universityId}
 *
 * Backend attaches university.getCode() + request.getCode()
 * Frontend sends only suffix code.
 */
export async function createScholarship(
    universityId: number,
    request: ScholarshipRequest
): Promise<ScholarshipResponse> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("Please select a university.");
    }

    const payload: ScholarshipRequest = {
        name: request.name.trim(),
        code: request.code.trim().toUpperCase(),
        description: request.description.trim(),
        number: Number(request.number),
        status: Boolean(request.status),
        amountType: request.amountType,
        scholarshipType: request.scholarshipType,
    };

    if (!payload.name) throw new Error("Scholarship name is required.");
    if (!payload.code) throw new Error("Scholarship code suffix is required.");

    try {
        const response = await api.post<unknown>(getScholarshipUrl(), payload, {
            params: { universityId },
        });
        return normalizeScholarship(response.data);
    } catch (error) {
        throw new Error(extractScholarshipError(error, "Unable to create scholarship."));
    }
}

/**
 * PUT {baseUrl}/scholarships?id={id}
 */
export async function updateScholarship(
    id: number,
    request: ScholarshipRequest
): Promise<ScholarshipResponse> {
    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("A valid scholarship ID is required.");
    }

    const payload: ScholarshipRequest = {
        name: request.name.trim(),
        code: request.code.trim().toUpperCase(),
        description: request.description.trim(),
        number: Number(request.number),
        status: Boolean(request.status),
        amountType: request.amountType,
        scholarshipType: request.scholarshipType,
    };

    if (!payload.name) throw new Error("Scholarship name is required.");
    if (!payload.code) throw new Error("Scholarship code suffix is required.");

    try {
        const response = await api.put<unknown>(getScholarshipUrl(), payload, {
            params: { id },
        });
        return normalizeScholarship(response.data);
    } catch (error) {
        throw new Error(extractScholarshipError(error, "Unable to update scholarship."));
    }
}

/**
 * DELETE {baseUrl}/scholarships?id={id}
 */
export async function deleteScholarship(id: number): Promise<string> {
    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("A valid scholarship ID is required.");
    }

    try {
        const response = await api.delete<unknown>(getScholarshipUrl(), {
            params: { id },
        });

        if (typeof response.data === "string" && response.data.trim()) {
            return response.data.trim();
        }

        if (response.data && typeof response.data === "object") {
            const body = response.data as Record<string, unknown>;
            const msg = body.message ?? body.data;
            if (typeof msg === "string" && msg.trim()) {
                return msg.trim();
            }
        }

        return "Scholarship deleted successfully.";
    } catch (error) {
        throw new Error(
            extractScholarshipError(
                error,
                "Unable to delete scholarship. It may be assigned to students."
            )
        );
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
    if (!name) return "SC";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SC";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function removePrefix(
    code: string | null | undefined,
    prefix: string
): string {
    const value = (code ?? "").trim();
    if (prefix && value.startsWith(prefix)) {
        return value.slice(prefix.length).trim();
    }
    return value;
}
