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
    code?: string | null;
}

export interface SpecializationResponse {
    id: number;
    name: string;
    code: string;
    subjects: CommonDTO[];
    sectionGroups: CommonDTO[];
    course: CommonDTO | null;
    academicYear: CommonDTO | null;
    department: CommonDTO | null;
    school: CommonDTO | null;
    university: CommonDTO | null;
    activeStatus: ActiveStatus;
    permissionActions: PermissionAction[];
}

export interface SpecializationCreateRequest {
    name: string;
    code: string;
}

export interface SpecializationRequest extends SpecializationCreateRequest {
    id: number;
    activeStatus: ActiveStatus;
}

export interface SpecializationFilters {
    search: string;
    status: "ALL" | ActiveStatus;
    academicYearId?: string;
    courseId?: string;
    universityId: string;
    schoolId: string;
    departmentId: string;
}

const getSpecializationUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/specializations`;
const getCourseFilterUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/filter/courses`;

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(error: unknown): string {
    const fallback = "An unexpected error occurred. Please try again.";

    if (!error || typeof error !== "object") {
        return fallback;
    }

    const err = error as {
        message?: string;
        response?: {
            data?: unknown;
            status?: number;
        };
    };

    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data.trim();
    }

    if (data && typeof data === "object") {
        const body = data as Record<string, unknown>;

        for (const key of ["message", "error", "detail", "description"]) {
            const value = body[key];

            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }

        if (Array.isArray(body.errors) && body.errors.length > 0) {
            return body.errors
                .map((item) => {
                    if (typeof item === "string") return item;

                    if (item && typeof item === "object") {
                        const fieldError = item as Record<string, unknown>;
                        return String(
                            fieldError.defaultMessage ??
                            fieldError.message ??
                            fieldError.field ??
                            "Validation failed"
                        );
                    }

                    return String(item);
                })
                .join(", ");
        }
    }

    if (err.response?.status === 401) {
        return "Your session has expired. Please sign in again.";
    }

    if (err.response?.status === 403) {
        return "You do not have permission to perform this action.";
    }

    if (err.response?.status === 404) {
        return "The requested resource was not found.";
    }

    if (err.response?.status === 409) {
        return "This record conflicts with existing data. Check the name or code.";
    }

    if (err.response?.status && err.response.status >= 500) {
        return "The server encountered an error. Please try again later.";
    }

    if (err.message === "Network Error") {
        return "Unable to connect to the server. Check your network connection.";
    }

    return err.message?.trim() || fallback;
}

/* -------------------------------------------------------------------------- */
/* Response normalization                                                     */
/* -------------------------------------------------------------------------- */

function unwrapData(value: unknown): unknown {
    if (
        value &&
        typeof value === "object" &&
        "data" in value
    ) {
        return (value as { data: unknown }).data;
    }

    return value;
}

function normalizeCommonDTO(value: unknown): CommonDTO | null {
    if (!value || typeof value !== "object") return null;

    const item = value as Record<string, unknown>;
    const id = Number(item.id);

    if (!Number.isFinite(id) || id <= 0) return null;

    return {
        id,
        name: typeof item.name === "string" ? item.name : `#${id}`,
        code: typeof item.code === "string" ? item.code : null,
    };
}

function normalizeDTOList(value: unknown): CommonDTO[] {
    const data = unwrapData(value);

    if (!Array.isArray(data)) return [];

    return data
        .map(normalizeCommonDTO)
        .filter((item): item is CommonDTO => item !== null);
}

function normalizeSpecialization(value: unknown): SpecializationResponse {
    if (!value || typeof value !== "object") {
        throw new Error("The server returned an invalid specialization record.");
    }

    const item = value as Record<string, unknown>;
    const id = Number(item.id);

    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("The server returned a specialization without a valid ID.");
    }

    const activeStatus: ActiveStatus =
        item.activeStatus === "DISABLE" ? "DISABLE" : "ENABLE";

    return {
        id,
        name: typeof item.name === "string" ? item.name : "",
        code: typeof item.code === "string" ? item.code : "",
        subjects: normalizeDTOList(item.subjects),
        sectionGroups: normalizeDTOList(item.sectionGroups),
        course: normalizeCommonDTO(item.course),
        academicYear: normalizeCommonDTO(item.academicYear),
        department: normalizeCommonDTO(item.department),
        school: normalizeCommonDTO(item.school),
        university: normalizeCommonDTO(item.university),
        activeStatus,
        permissionActions: Array.isArray(item.permissionActions)
            ? item.permissionActions.filter(
                (action): action is string => typeof action === "string"
            )
            : [],
    };
}

/* -------------------------------------------------------------------------- */
/* API functions                                                              */
/* -------------------------------------------------------------------------- */

/**
 * GET /admin/specializations
 *
 * Loads all specializations. Table filtering is performed in the frontend.
 */
export async function getAllSpecializations(): Promise<SpecializationResponse[]> {
    const response = await api.get(getSpecializationUrl());
    const data = unwrapData(response.data);

    if (!Array.isArray(data)) {
        throw new Error("The server did not return a valid specialization list.");
    }

    return data.map(normalizeSpecialization);
}

/**
 * GET /filter/courses
 *
 * Supplies available courses for the creation form.
 */
export async function getCourseFilter(): Promise<CommonDTO[]> {
    const response = await api.get(getCourseFilterUrl());
    return normalizeDTOList(response.data);
}

/**
 * GET /admin/specializations/prefix?courseId={courseId}
 *
 * The server returns the fixed prefix as a string.
 */
export async function getSpecializationPrefix(
    courseId: number,
    specializationId?: number
): Promise<string> {
    const response = await api.get(`${getSpecializationUrl()}/prefix`, {
        params: {
            courseId,
            ...(specializationId != null ? { specializationId } : {}),
        },
    });

    const value = unwrapData(response.data);

    if (typeof value === "string") return value.trim();

    if (typeof value === "object" && value !== null) {
        const result = value as Record<string, unknown>;

        for (const key of ["prefix", "code", "value"]) {
            if (typeof result[key] === "string") {
                return (result[key] as string).trim();
            }
        }
    }

    throw new Error("The server did not return a valid specialization prefix.");
}

/**
 * POST /admin/specializations?courseId={courseId}
 *
 * The backend accepts CommonRequest: { name, code }.
 * Send only the code suffix, without the fixed prefix.
 */
export async function createSpecialization(
    courseId: number,
    request: SpecializationCreateRequest
): Promise<SpecializationResponse> {
    if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("Please select a valid course.");
    }

    const response = await api.post(
        getSpecializationUrl(),
        {
            name: request.name.trim(),
            code: request.code.trim(),
        },
        {
            params: { courseId },
        }
    );

    return normalizeSpecialization(unwrapData(response.data));
}

/**
 * PUT /admin/specializations
 *
 * The backend accepts SpecializationRequest: { id, name, code, activeStatus }.
 * Send the code suffix without the fixed prefix.
 */
export async function updateSpecialization(
    request: SpecializationRequest
): Promise<SpecializationResponse> {
    const response = await api.put(getSpecializationUrl(), {
        id: request.id,
        name: request.name.trim(),
        code: request.code.trim(),
        activeStatus: request.activeStatus,
    });

    return normalizeSpecialization(unwrapData(response.data));
}

/**
 * DELETE /admin/specializations?specializationId={id}
 */
export async function deleteSpecialization(
    specializationId: number
): Promise<string> {
    const response = await api.delete(getSpecializationUrl(), {
        params: { specializationId },
    });

    const data = unwrapData(response.data);

    return typeof data === "string"
        ? data
        : "Specialization deleted successfully.";
}

/* -------------------------------------------------------------------------- */
/* Reusable helpers                                                           */
/* -------------------------------------------------------------------------- */

export function uniqueDTOs(
    items: Array<CommonDTO | null | undefined>
): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();

    for (const item of items) {
        if (
            item &&
            Number.isFinite(item.id) &&
            item.id > 0 &&
            !unique.has(item.id)
        ) {
            unique.set(item.id, item);
        }
    }

    return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

export function hasPermission(
    specialization: SpecializationResponse,
    action: PermissionAction
): boolean {
    return Array.isArray(specialization.permissionActions) &&
        specialization.permissionActions.includes(action);
}

export function removePrefix(
    code: string | null | undefined,
    prefix: string
): string {
    const value = (code ?? "").trim();

    if (!prefix) return value;

    return value.startsWith(prefix)
        ? value.slice(prefix.length).trim()
        : value;
}

export function normalizeText(value: unknown): string {
    return typeof value === "string"
        ? value.trim().toLocaleLowerCase()
        : "";
}
