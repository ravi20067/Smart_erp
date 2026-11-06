
import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ActiveStatus = "ENABLE" | "DISABLE";

export type PermissionAction =
    | "UPDATE"
    | "DELETE"
    | "CREATE_CHILD"
    | "CREATE"
    | "VIEW"
    | string;

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface SectionGroupResponse {
    id: number;
    name: string;
    code?: string | null;
    specialization?: CommonDTO | null;
    studentCount?: number | null;
}

export interface SectionResponse {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
    sectionGroup: SectionGroupResponse[];
    course: CommonDTO | null;
    academicYear: CommonDTO | null;
    department: CommonDTO | null;
    school: CommonDTO | null;
    university: CommonDTO | null;
    activeStatus: ActiveStatus | null;
    permissionActions: PermissionAction[];
}

export interface SectionRequest {
    name: string;
    code: string;
    capacity: number;
    activeStatus: ActiveStatus;
    specializationId: number[];
}

export interface SectionCreateRequest extends SectionRequest { }

export interface SectionUpdateRequest extends SectionRequest { }

const getSectionsUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/sections`;
const getFilterUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/filter`;

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

        if (Array.isArray(body.errors) && body.errors.length > 0) {
            const messages = body.errors
                .map((item) => {
                    if (typeof item === "string") return item;

                    if (item && typeof item === "object") {
                        const value = item as Record<string, unknown>;
                        return String(
                            value.defaultMessage ??
                            value.message ??
                            value.field ??
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

    if (status === 400) return "Invalid request. Check the entered information.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "The requested record was not found.";
    if (status === 409) return "This record conflicts with existing data.";
    if (status === 422) return "The submitted information could not be processed.";
    if (status === 500) return "A server error occurred. Please try again later.";

    if (
        typeof candidate.message === "string" &&
        candidate.message.trim()
    ) {
        if (
            candidate.message.toLowerCase().includes("network error")
        ) {
            return "Unable to connect to the server. Check your connection and try again.";
        }

        return candidate.message.trim();
    }

    return fallback;
}

function ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeSectionGroup(value: unknown): SectionGroupResponse {
    const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

    let spec: CommonDTO | null = null;
    if (item.specialization && typeof item.specialization === "object") {
        const s = item.specialization as Record<string, unknown>;
        spec = {
            id: Number(s.id) || 0,
            name: String(s.name ?? ""),
            code: typeof s.code === "string" ? s.code : null,
        };
    }

    const studentCountNum = Number(item.studentCount);

    return {
        id: Number(item.id) || 0,
        name: String(item.name ?? ""),
        code: typeof item.code === "string" ? item.code : null,
        specialization: spec,
        studentCount: Number.isFinite(studentCountNum) ? studentCountNum : null,
    };
}

function normalizeSection(value: unknown): SectionResponse {
    const item = (
        value && typeof value === "object" ? value : {}
    ) as Record<string, unknown>;

    // Support common ID names used by backend DTOs.
    const idCandidates = [
        item.id,
        item.sectionId,
        item.sectionID,
        item.section_id,
    ];

    const validId = idCandidates.find((candidate) => {
        if (
            candidate === null ||
            candidate === undefined ||
            String(candidate).trim() === ""
        ) {
            return false;
        }

        const id = Number(candidate);
        return Number.isSafeInteger(id) && id > 0;
    });

    return {
        id: validId === undefined ? "" : String(validId),
        name: String(item.name ?? ""),
        code: String(item.code ?? ""),
        capacity:
            typeof item.capacity === "number"
                ? item.capacity
                : null,
        sectionGroup: Array.isArray(item.sectionGroup)
            ? item.sectionGroup.map(normalizeSectionGroup)
            : [],
        course: (item.course ?? null) as CommonDTO | null,
        academicYear:
            (item.academicYear ?? null) as CommonDTO | null,
        department: (item.department ?? null) as CommonDTO | null,
        school: (item.school ?? null) as CommonDTO | null,
        university: (item.university ?? null) as CommonDTO | null,
        activeStatus:
            (item.activeStatus ?? null) as ActiveStatus | null,
        permissionActions: Array.isArray(item.permissionActions)
            ? item.permissionActions as PermissionAction[]
            : [],
    };
}


function normalizeCommonDTOs(value: unknown): CommonDTO[] {
    return ensureArray<CommonDTO>(value)
        .filter(
            (item) =>
                item &&
                Number.isFinite(Number(item.id)) &&
                Number(item.id) > 0 &&
                typeof item.name === "string"
        )
        .map((item) => ({
            id: Number(item.id),
            name: item.name,
            code: item.code ?? null,
        }));
}

/* -------------------------------------------------------------------------- */
/* Section CRUD                                                               */
/* -------------------------------------------------------------------------- */

/**
 * GET {baseUrl}/sections
 */
export async function getAllSections(): Promise<SectionResponse[]> {
    try {
        const response = await api.get<unknown>(getSectionsUrl());
        return ensureArray(response.data).map(normalizeSection);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load sections.")
        );
    }
}

/**
 * POST {baseUrl}/sections?courseId={courseId}
 *
 * The request's code contains only the suffix, not the fixed prefix.
 */
export async function createSection(
    courseId: number,
    request: SectionCreateRequest
): Promise<SectionResponse> {
    if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("Please select a valid course.");
    }

    try {
        const response = await api.post<unknown>(
            getSectionsUrl(),
            request,
            { params: { courseId } }
        );

        return normalizeSection(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to create the section.")
        );
    }
}

/**
 * PUT {baseUrl}/sections?sectionId={sectionId}
 */
export async function updateSection(
    sectionId: number,
    request: SectionUpdateRequest
): Promise<SectionResponse> {
    if (!Number.isFinite(sectionId) || sectionId <= 0) {
        throw new Error("Invalid section ID.");
    }

    try {
        const response = await api.put<unknown>(
            getSectionsUrl(),
            request,
            { params: { sectionId } }
        );

        return normalizeSection(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to update the section.")
        );
    }
}

/**
 * DELETE {baseUrl}/sections?sectionId={sectionId}
 */
export async function deleteSection(
    sectionId: number
): Promise<string> {
    if (!Number.isFinite(sectionId) || sectionId <= 0) {
        throw new Error("Invalid section ID.");
    }

    try {
        const response = await api.delete<unknown>(getSectionsUrl(), {
            params: { sectionId },
        });

        if (typeof response.data === "string" && response.data.trim()) {
            return response.data;
        }

        return "Section deleted successfully.";
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to delete the section. Related records may exist."
            )
        );
    }
}

/**
 * GET {baseUrl}/sections/prefix?courseId={courseId}
 *
 * The server returns the fixed prefix as a string.
 */
export async function getSectionPrefix(
    courseId: number,
    sectionId?: number
): Promise<string> {
    if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("Select a course to load its section prefix.");
    }

    try {
        const response = await api.get<unknown>(
            `${getSectionsUrl()}/prefix`,
            {
                params: {
                    courseId,
                    ...(sectionId ? { sectionId } : {}),
                },
            }
        );

        const value = response.data;

        if (typeof value === "string") return value.trim();

        if (value && typeof value === "object") {
            const body = value as Record<string, unknown>;
            const prefix = body.prefix ?? body.data ?? body.value;

            if (typeof prefix === "string") return prefix.trim();
        }

        throw new Error("The server returned an invalid section prefix.");
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load the section prefix.")
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Creation/update dropdown options                                           */
/* -------------------------------------------------------------------------- */

/**
 * GET {baseUrl}/filter/courses
 */
export async function getCourseFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(
            `${getFilterUrl()}/courses`
        );

        return normalizeCommonDTOs(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load course options.")
        );
    }
}

/**
 * GET {baseUrl}/filter/specialization
 */
export async function getSpecializationFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(
            `${getFilterUrl()}/specialization`
        );

        return normalizeCommonDTOs(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to load specialization options."
            )
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */


export function getNumericSectionId(
    section: SectionResponse
): number {
    const rawId: unknown = section.id;
    const id = Number(rawId);

    if (
        rawId === null ||
        rawId === undefined ||
        String(rawId).trim() === "" ||
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            `Section "${section.name}" has invalid ID: ${String(rawId)}. ` +
            "Check the section API response and database ID mapping."
        );
    }

    return id;
}


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
