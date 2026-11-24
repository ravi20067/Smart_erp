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

export interface SubjectResponse {
    id: number;
    name: string;
    code: string;
    lecturesPerWeek: number | null;
    isPracticalSubject: boolean;
    specializations: CommonDTO[];
    activeStatus: ActiveStatus | null;
    subjectTeachers: CommonDTO[];
    course: CommonDTO | null;
    department: CommonDTO | null;
    school: CommonDTO | null;
    university: CommonDTO | null;
    permissionActions: PermissionAction[];
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface CommonRequest {
    name: string;
    code: string;
}

export interface SubjectRequest {
    id: number;
    name: string;
    code: string;
    lecturesPerWeek: number | null;
    isPracticalSubject: boolean;
    activeStatus: ActiveStatus;
    specializationsId: number[];
}

export interface SubjectFilters {
    search: string;
    status: "ALL" | ActiveStatus;
    universityId: string;
    schoolId: string;
    departmentId: string;
    courseId: string;
    practicalOnly: boolean;
}

/* -------------------------------------------------------------------------- */
/* URL configuration                                                          */
/* -------------------------------------------------------------------------- */

const getSubjectBaseUrl = (): string => getBaseUrl().replace(/\/+$/, "");

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

        if (Array.isArray(body.errors)) {
            const messages = body.errors
                .map((item) => {
                    if (typeof item === "string") return item;

                    if (item && typeof item === "object") {
                        const entry = item as Record<string, unknown>;
                        return String(
                            entry.defaultMessage ??
                                entry.message ??
                                entry.field ??
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

    if (status === 400)
        return "Invalid request. Check the entered information.";
    if (status === 401)
        return "Your session has expired. Please sign in again.";
    if (status === 403)
        return "You do not have permission to perform this action.";
    if (status === 404) return "The requested record was not found.";
    if (status === 409) return "This record conflicts with existing data.";
    if (status === 422)
        return "The submitted information could not be processed.";
    if (status === 500)
        return "A server error occurred. Please try again later.";

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

/* -------------------------------------------------------------------------- */
/* Response normalization                                                     */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeCommonDTO(value: unknown): CommonDTO | null {
    const item = asRecord(value);
    const id = Number(item.id);

    if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        typeof item.name !== "string"
    ) {
        return null;
    }

    return {
        id,
        name: item.name,
        code: typeof item.code === "string" ? item.code : null,
    };
}

export function uniqueCommonDTOs(
    items: Array<CommonDTO | null | undefined>
): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();

    for (const item of items) {
        if (
            item &&
            Number.isSafeInteger(Number(item.id)) &&
            Number(item.id) > 0 &&
            typeof item.name === "string"
        ) {
            unique.set(Number(item.id), {
                ...item,
                id: Number(item.id),
            });
        }
    }

    return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

function normalizeSubject(value: unknown): SubjectResponse {
    const item = asRecord(value);

    const common = (key: string): CommonDTO | null =>
        normalizeCommonDTO(item[key]);

    return {
        id: Number(item.id) || 0,
        name: String(item.name ?? ""),
        code: String(item.code ?? ""),
        lecturesPerWeek:
            item.lecturesPerWeek == null
                ? null
                : Number(item.lecturesPerWeek),
        isPracticalSubject: item.isPracticalSubject === true,
        specializations: uniqueCommonDTOs(
            asArray(item.specializations)
                .map(normalizeCommonDTO)
                .filter((value): value is CommonDTO => value !== null)
        ),
        activeStatus:
            item.activeStatus === "ENABLE" || item.activeStatus === "DISABLE"
                ? item.activeStatus
                : null,
        subjectTeachers: uniqueCommonDTOs(
            asArray(item.subjectTeachers)
                .map(normalizeCommonDTO)
                .filter((value): value is CommonDTO => value !== null)
        ),
        course: common("course"),
        department: common("department"),
        school: common("school"),
        university: common("university"),
        permissionActions: asArray<PermissionAction>(item.permissionActions),
        createdBy: common("createdBy"),
        updatedBy: common("updatedBy"),
        createdAt:
            typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt:
            typeof item.updatedAt === "string" ? item.updatedAt : null,
    };
}

function normalizeSubjects(value: unknown): SubjectResponse[] {
    return asArray(value)
        .map(normalizeSubject)
        .filter((subject) => subject.id > 0);
}

function normalizeCommonDTOs(value: unknown): CommonDTO[] {
    return uniqueCommonDTOs(
        asArray(value)
            .map(normalizeCommonDTO)
            .filter((item): item is CommonDTO => item !== null)
    );
}

function normalizePrefix(value: unknown): string {
    if (typeof value === "string") return value.trim();

    const body = asRecord(value);
    const prefix = body.prefix ?? body.data ?? body.value;

    if (typeof prefix === "string") return prefix.trim();

    throw new Error("The server returned an invalid subject prefix.");
}

export const formatAuditActor = (
    actor?: CommonDTO | null,
    fallback = "System Administrator"
): string => {
    if (!actor) return fallback;
    if (actor.name && actor.code) return `${actor.name} (${actor.code})`;
    return actor.name || fallback;
};

export function removePrefix(
    code: string | null | undefined,
    prefix: string
): string {
    const value = (code ?? "").trim();
    if (!prefix) return value;
    return value.startsWith(prefix) ? value.slice(prefix.length).trim() : value;
}

/* -------------------------------------------------------------------------- */
/* Subject API Functions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/subjects
 */
export async function getAllSubjects(): Promise<SubjectResponse[]> {
    try {
        const response = await api.get<unknown>(
            `${getSubjectBaseUrl()}/subjects`
        );
        return normalizeSubjects(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load subjects.")
        );
    }
}

/**
 * POST /{role}/subjects?courseId={courseId}
 *
 * Backend DTO: CommonRequest { name, code }
 * Send the code suffix only; do not prepend the fixed server prefix.
 */
export async function createSubject(
    courseId: number,
    request: CommonRequest
): Promise<SubjectResponse> {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        throw new Error("Please select a valid course.");
    }

    try {
        const response = await api.post<unknown>(
            `${getSubjectBaseUrl()}/subjects`,
            {
                name: request.name.trim(),
                code: request.code.trim(),
            },
            { params: { courseId } }
        );

        return normalizeSubject(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to create the subject.")
        );
    }
}

/**
 * PUT /{role}/subjects
 *
 * Backend DTO: SubjectRequest
 * Send the code suffix only; do not prepend the fixed server prefix.
 */
export async function updateSubject(
    request: SubjectRequest
): Promise<SubjectResponse> {
    if (!Number.isSafeInteger(request.id) || request.id <= 0) {
        throw new Error("Invalid subject ID.");
    }

    try {
        const response = await api.put<unknown>(
            `${getSubjectBaseUrl()}/subjects`,
            {
                id: request.id,
                name: request.name.trim(),
                code: request.code.trim(),
                lecturesPerWeek: request.lecturesPerWeek,
                isPracticalSubject: request.isPracticalSubject,
                activeStatus: request.activeStatus,
                specializationsId: request.specializationsId,
            }
        );

        return normalizeSubject(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to update the subject.")
        );
    }
}

/**
 * DELETE /{role}/subjects?subjectId={subjectId}
 */
export async function deleteSubject(subjectId: number): Promise<string> {
    if (!Number.isSafeInteger(subjectId) || subjectId <= 0) {
        throw new Error("Invalid subject ID.");
    }

    try {
        const response = await api.delete<unknown>(
            `${getSubjectBaseUrl()}/subjects`,
            {
                params: { subjectId },
            }
        );

        return typeof response.data === "string" && response.data.trim()
            ? response.data
            : "Subject deleted successfully.";
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to delete the subject. Related records may exist."
            )
        );
    }
}

/**
 * GET /{role}/subjects/prefix?courseId={courseId}[&subjectId={subjectId}]
 */
export async function getSubjectPrefix(
    courseId: number,
    subjectId?: number
): Promise<string> {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        throw new Error("Select a course to load its subject prefix.");
    }

    try {
        const response = await api.get<unknown>(
            `${getSubjectBaseUrl()}/subjects/prefix`,
            {
                params: {
                    courseId,
                    ...(subjectId && subjectId > 0 ? { subjectId } : {}),
                },
            }
        );

        return normalizePrefix(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load the subject prefix.")
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Common Filter APIs                                                         */
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/filter/courses
 */
export async function getCourseFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(
            `${getSubjectBaseUrl()}/filter/courses`
        );
        return normalizeCommonDTOs(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load course options.")
        );
    }
}

/**
 * GET /{role}/filter/specialization
 */
export async function getSpecializationFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(
            `${getSubjectBaseUrl()}/filter/specialization`
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

/**
 * GET /{role}/subjects/filter/teacher?subjectId={subjectId}
 */
export async function getTeacherFilter(
    subjectId: number
): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(
            `${getSubjectBaseUrl()}/subjects/filter/teacher`,
            {
                params: { subjectId },
            }
        );

        return normalizeCommonDTOs(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to load teacher options.")
        );
    }
}
