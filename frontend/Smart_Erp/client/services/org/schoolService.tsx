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
    code: string;
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

const getSchoolUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base}/school`;
};

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(error: unknown): string {
    if (!error) {
        return "An unexpected error occurred. Please try again.";
    }

    if (typeof error === "object" && error !== null) {
        const err = error as Record<string, any>;

        if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
            return "Unable to connect to the server. Check your connection and confirm that the backend is running.";
        }

        if (err.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        const response = err.response;

        if (response) {
            const status = response.status;
            const data = response.data;

            if (typeof data === "string" && data.trim()) {
                return data;
            }

            if (data && typeof data === "object") {
                for (const key of ["message", "error", "detail", "title"]) {
                    if (typeof data[key] === "string" && data[key].trim()) {
                        return data[key];
                    }
                }

                if (Array.isArray(data.errors) && data.errors.length > 0) {
                    return data.errors
                        .map((item: unknown) => {
                            if (typeof item === "string") return item;

                            if (item && typeof item === "object") {
                                const value = item as Record<string, unknown>;
                                return (
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
                    data.errors &&
                    typeof data.errors === "object" &&
                    !Array.isArray(data.errors)
                ) {
                    return Object.entries(data.errors)
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
                    if (status >= 500) {
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

    return response.data;
}

/* -------------------------------------------------------------------------- */
/* University filter for creation                                             */
/* GET /super-admin/filter/university                                         */
/* -------------------------------------------------------------------------- */

export async function getUniversityFilter(): Promise<CommonDTO[]> {
    // This endpoint has an explicit /super-admin path in your controller.
    // If your Axios baseURL already includes /super-admin, use:
    // api.get<CommonDTO[]>(`${getBaseUrl()}/filter/university`)
    const response = await api.get<CommonDTO[]>(
        "/super-admin/filter/university"
    );

    if (!Array.isArray(response.data)) {
        throw new Error("The server returned an invalid university list.");
    }

    return response.data.filter(
        (university) =>
            university != null &&
            Number.isFinite(Number(university.id)) &&
            typeof university.name === "string"
    );
}

/* -------------------------------------------------------------------------- */
/* Get fixed school prefix                                                    */
/* GET /{role}/school/prefix?universityId={id}&schoolId={optionalId}           */
/* -------------------------------------------------------------------------- */

export async function getSchoolPrefix(
    universityId: number,
    schoolId?: number
): Promise<string> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("Please select a valid university.");
    }

    const params: Record<string, number> = { universityId };

    if (schoolId != null) {
        params.schoolId = schoolId;
    }

    const response = await api.get<string>(`${getSchoolUrl()}/prefix`, {
        params,
        responseType: "text",
    });

    if (typeof response.data !== "string" || !response.data.trim()) {
        throw new Error("The server did not return a valid school prefix.");
    }

    return response.data.trim();
}

/* -------------------------------------------------------------------------- */
/* Create school                                                              */
/* POST /{role}/school?universityId={id}                                      */
/* Body: CommonRequest                                                        */
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

    return response.data;
}

/* -------------------------------------------------------------------------- */
/* Update school                                                              */
/* PUT /{role}/school                                                         */
/* Body: SchoolRequest                                                        */
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

    return response.data;
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