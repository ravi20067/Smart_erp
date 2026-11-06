
import axios from "axios";
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

export interface CourseResponse {
    id: number;
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    subjects: CommonDTO[];
    sections: CommonDTO[];
    specializations: CommonDTO[];
    newEnrollmentAllowed: boolean | null;
    academicYear: CommonDTO | null;
    department: CommonDTO | null;
    school: CommonDTO | null;
    university: CommonDTO | null;
    permissionActions: PermissionAction[];
}

export interface CommonRequest {
    name: string;
    code: string;
}

export interface CourseRequest {
    id: number;
    name: string;
    code: string;
    activeStatus: ActiveStatus;
    newEnrollmentAllowed: boolean;
}

export interface CourseCreateRequest extends CommonRequest { }

export interface CourseFilters {
    search?: string;
    status?: ActiveStatus | "ALL";
    universityId?: number | "ALL";
    schoolId?: number | "ALL";
    departmentId?: number | "ALL";
    academicYearId?: number | "ALL";
}

export interface CoursePrefixRequest {
    academicYearId: number;
    courseId?: number;
}

/* -------------------------------------------------------------------------- */
/* API configuration                                                          */
/* -------------------------------------------------------------------------- */

const getCoursesUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/courses`;
const getAcademicYearFilterUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/filter/academic-year`;

/* -------------------------------------------------------------------------- */
/* Response normalization                                                     */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCommonDTO(value: unknown): CommonDTO | null {
    if (!isRecord(value)) return null;

    const id = Number(value.id);
    const name = typeof value.name === "string" ? value.name : "";

    if (!Number.isFinite(id) || id <= 0) return null;

    return {
        id,
        name,
        code: typeof value.code === "string" ? value.code : null,
    };
}

function toCommonDTOList(value: unknown): CommonDTO[] {
    if (!Array.isArray(value)) return [];

    const unique = new Map<number, CommonDTO>();

    for (const item of value) {
        const dto = toCommonDTO(item);
        if (dto && !unique.has(dto.id)) {
            unique.set(dto.id, dto);
        }
    }

    return [...unique.values()];
}

export function normalizeCourse(value: unknown): CourseResponse {
    if (!isRecord(value)) {
        throw new Error("The server returned an invalid course response.");
    }

    const id = Number(value.id);

    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("The server returned a course without a valid ID.");
    }

    const status: ActiveStatus =
        value.activeStatus === "DISABLE" ? "DISABLE" : "ENABLE";

    return {
        id,
        name: typeof value.name === "string" ? value.name : "",
        code: typeof value.code === "string" ? value.code : "",
        activeStatus: status,
        subjects: toCommonDTOList(value.subjects),
        sections: toCommonDTOList(value.sections),
        specializations: toCommonDTOList(value.specializations),
        newEnrollmentAllowed:
            typeof value.newEnrollmentAllowed === "boolean"
                ? value.newEnrollmentAllowed
                : null,
        academicYear: toCommonDTO(value.academicYear),
        department: toCommonDTO(value.department),
        school: toCommonDTO(value.school),
        university: toCommonDTO(value.university),
        permissionActions: Array.isArray(value.permissionActions)
            ? value.permissionActions.filter(
                (item): item is string => typeof item === "string"
            )
            : [],
    };
}

function normalizeCourseList(value: unknown): CourseResponse[] {
    if (!Array.isArray(value)) {
        throw new Error("The server returned an invalid course list.");
    }

    const unique = new Map<number, CourseResponse>();

    for (const item of value) {
        const course = normalizeCourse(item);
        if (!unique.has(course.id)) unique.set(course.id, course);
    }

    return [...unique.values()];
}

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    if (axios.isAxiosError(error)) {
        const data: unknown = error.response?.data;

        if (typeof data === "string" && data.trim()) {
            return data.trim();
        }

        if (isRecord(data)) {
            const candidates = [
                data.message,
                data.error,
                data.detail,
                data.title,
            ];

            const message = candidates.find(
                (item): item is string =>
                    typeof item === "string" && item.trim().length > 0
            );

            if (message) return message.trim();

            if (error.response?.status === 400) {
                return "The request is invalid. Check the entered information.";
            }

            if (error.response?.status === 401) {
                return "Your session has expired. Please sign in again.";
            }

            if (error.response?.status === 403) {
                return "You do not have permission to perform this action.";
            }

            if (error.response?.status === 404) {
                return "The requested course or endpoint was not found.";
            }

            if (error.response?.status === 409) {
                return "This operation conflicts with existing records.";
            }

            if (error.response?.status === 422) {
                return "The submitted information could not be processed.";
            }

            if (error.response && error.response.status >= 500) {
                return "The server encountered an error. Please try again later.";
            }
        }

        if (error.code === "ERR_NETWORK") {
            return "Cannot connect to the server. Check your network or backend.";
        }

        if (error.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        return error.message || fallback;
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

/* -------------------------------------------------------------------------- */
/* API methods                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Loads the complete course response once.
 *
 * Table search, filtering, sorting and pagination are performed in the UI.
 */
export async function getAllCourses(): Promise<CourseResponse[]> {
    const response = await api.get<unknown>(getCoursesUrl());
    return normalizeCourseList(response.data);
}

/**
 * Academic-year options for the create-course dialog.
 * This endpoint is based on the academic filter mapping supplied in your
 * controller notes. Adjust the URL if your filter controller has another base.
 */
export async function getAcademicYearFilter(): Promise<CommonDTO[]> {
    const response = await api.get<unknown>(getAcademicYearFilterUrl());
    return toCommonDTOList(response.data);
}

/**
 * Returns the fixed prefix for the selected academic year.
 * The optional courseId is supported by the backend controller.
 */
export async function getCoursePrefix(
    academicYearId: number,
    courseId?: number
): Promise<string> {
    if (!Number.isFinite(academicYearId) || academicYearId <= 0) {
        throw new Error("Select a valid academic year first.");
    }

    const params: Record<string, number> = { academicYearId };

    if (courseId && courseId > 0) {
        params.courseId = courseId;
    }

    const response = await api.get<unknown>(`${getCoursesUrl()}/prefix`, {
        params,
        responseType: "text",
    });

    const data = response.data;
    const prefix =
        typeof data === "string"
            ? data
            : isRecord(data) && typeof data.prefix === "string"
                ? data.prefix
                : "";

    if (!prefix.trim()) {
        throw new Error("The server returned an empty course-code prefix.");
    }

    return prefix.trim();
}

/**
 * Create contract from the supplied controller:
 * POST /courses?academicYear={id}
 * Body: CommonRequest { name, code }
 */
export async function createCourse(
    academicYearId: number,
    request: CourseCreateRequest
): Promise<CourseResponse> {
    if (!Number.isFinite(academicYearId) || academicYearId <= 0) {
        throw new Error("Select a valid academic year.");
    }

    const response = await api.post<unknown>(getCoursesUrl(), request, {
        params: { academicYear: academicYearId },
    });

    return normalizeCourse(response.data);
}

/**
 * Update contract from the supplied controller:
 * PUT /courses
 * Body: CourseRequest
 */
export async function updateCourse(
    request: CourseRequest
): Promise<CourseResponse> {
    const response = await api.put<unknown>(getCoursesUrl(), request);
    return normalizeCourse(response.data);
}

/**
 * Delete contract from the supplied controller:
 * DELETE /courses?courseId={id}
 */
export async function deleteCourse(courseId: number): Promise<string> {
    if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("A valid course ID is required.");
    }

    const response = await api.delete<unknown>(getCoursesUrl(), {
        params: { courseId },
    });

    if (typeof response.data === "string") return response.data;

    if (isRecord(response.data) && typeof response.data.message === "string") {
        return response.data.message;
    }

    return "Course deleted successfully.";
}

/* -------------------------------------------------------------------------- */
/* Local filtering helpers                                                    */
/* -------------------------------------------------------------------------- */

export function uniqueDTOs(
    values: Array<CommonDTO | null | undefined>
): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();

    for (const value of values) {
        if (
            value &&
            Number.isFinite(value.id) &&
            value.id > 0 &&
            !unique.has(value.id)
        ) {
            unique.set(value.id, value);
        }
    }

    return [...unique.values()].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
}

export function hasCoursePermission(
    course: CourseResponse,
    action: PermissionAction
): boolean {
    return course.permissionActions.includes(action);
}

export function normalizeSearch(value: unknown): string {
    return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}
