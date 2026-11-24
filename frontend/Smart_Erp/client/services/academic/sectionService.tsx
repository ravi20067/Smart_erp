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
    id: number;
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
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export interface SectionRequest {
    name: string;
    code: string;
    capacity: number;
    activeStatus: ActiveStatus;
    specializationId: number[];
}

export interface SectionCreateRequest extends SectionRequest {}
export interface SectionUpdateRequest extends SectionRequest {}

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
        if (candidate.message.toLowerCase().includes("network error")) {
            return "Unable to connect to the server. Check your connection and try again.";
        }
        return candidate.message.trim();
    }

    return fallback;
}

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
        studentCount: Number.isFinite(studentCountNum) ? studentCountNum : 0,
    };
}

function normalizeSection(value: unknown): SectionResponse {
    const item = (
        value && typeof value === "object" ? value : {}
    ) as Record<string, unknown>;

    const idCandidates = [
        item.id,
        item.sectionId,
        item.sectionID,
        item.section_id,
    ];

    let validId = 0;
    for (const candidate of idCandidates) {
        if (candidate !== null && candidate !== undefined && String(candidate).trim() !== "") {
            const num = Number(candidate);
            if (Number.isSafeInteger(num) && num > 0) {
                validId = num;
                break;
            }
        }
    }

    const capacityNum = Number(item.capacity);

    return {
        id: validId,
        name: String(item.name ?? "").trim(),
        code: String(item.code ?? "").trim(),
        capacity: Number.isFinite(capacityNum) ? capacityNum : null,
        sectionGroup: Array.isArray(item.sectionGroup)
            ? item.sectionGroup.map(normalizeSectionGroup)
            : [],
        course: normalizeCommonDTO(item.course),
        academicYear: normalizeCommonDTO(item.academicYear),
        department: normalizeCommonDTO(item.department),
        school: normalizeCommonDTO(item.school),
        university: normalizeCommonDTO(item.university),
        activeStatus: (item.activeStatus ?? null) as ActiveStatus | null,
        permissionActions: Array.isArray(item.permissionActions)
            ? (item.permissionActions as PermissionAction[])
            : [],
        createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
        createdBy: normalizeCommonDTO(item.createdBy),
        updatedBy: normalizeCommonDTO(item.updatedBy),
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
            name: item.name.trim(),
            code: item.code ? item.code.trim() : null,
        }));
}

/* -------------------------------------------------------------------------- */
/* Section CRUD Endpoints                                                     */
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
 * POST {baseUrl}/sections?courseId={courseId}&academicYearId={academicYearId}
 *
 * Backend expects both courseId and academicYearId as query params.
 * The request body's code contains only the suffix.
 */
export async function createSection(
    courseId: number,
    academicYearId: number,
    request: SectionCreateRequest
): Promise<SectionResponse> {
    if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("Please select a valid course.");
    }
    if (!Number.isFinite(academicYearId) || academicYearId <= 0) {
        throw new Error("Please select a valid academic year.");
    }

    try {
        const response = await api.post<unknown>(
            getSectionsUrl(),
            request,
            { params: { courseId, academicYearId } }
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
export async function deleteSection(sectionId: number): Promise<string> {
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
 * GET {baseUrl}/sections/prefix?academicYearId={academicYearId}&courseId={courseId}&sectionId={sectionId}
 *
 * Backend returns prefix as string: academicYear.getCode().replace(univ.getCode(), "") + "-" + course.getCode()
 */
export async function getSectionPrefix(
    academicYearId: number,
    courseId: number,
    sectionId?: number
): Promise<string> {
    if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("Select a course to load its section prefix.");
    }
    if (!Number.isFinite(academicYearId) || academicYearId <= 0) {
        throw new Error("Select an academic year to load its section prefix.");
    }

    try {
        const response = await api.get<unknown>(
            `${getSectionsUrl()}/prefix`,
            {
                params: {
                    academicYearId,
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

/**
 * GET {baseUrl}/sections/academic-year/filter?courseId={courseId}
 *
 * Backend returns list of academic years accessible for section creation under this course.
 */
export async function getSectionAcademicYearFilter(
    courseId: number
): Promise<CommonDTO[]> {
    if (!Number.isFinite(courseId) || courseId <= 0) {
        return [];
    }

    try {
        const response = await api.get<unknown>(
            `${getSectionsUrl()}/academic-year/filter`,
            { params: { courseId } }
        );

        return normalizeCommonDTOs(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to load academic years for this course."
            )
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Creation/update filter dropdown options from common controller             */
/* -------------------------------------------------------------------------- */

/**
 * GET {baseUrl}/filter/courses
 */
export async function getCourseFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getFilterUrl()}/courses`);
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
        const response = await api.get<unknown>(`${getFilterUrl()}/specialization`);
        return normalizeCommonDTOs(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load specialization options.")
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
    if (!name) return "SY";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SY";
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
