
import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

export type AmountType = "PERCENTAGE" | "NUMBER";
export type ScholarshipType = "PERMANENT" | "ENROLLMENT" | "ONE_TIME";
export type ScholarshipPermission = "UPDATE" | "DELETE" | string;

export interface ScholarshipRequest {
    name: string;
    code: string;
    description: string;
    number: number;
    status: boolean;
    amountType: AmountType;
    scholarshipType: ScholarshipType;
    university?: ScholarshipUniversity | null;
}

export interface ScholarshipResponse extends ScholarshipRequest {
    id: number;
    permissionActions: ScholarshipPermission[];
}

export interface ScholarshipUniversity {
    id: number;
    name: string;
    code: string;
}

const scholarshipUrl = () =>
    `${getBaseUrl().replace(/\/+$/, "")}/scholarships`;

export function extractScholarshipError(error: unknown): string {
    if (error && typeof error === "object") {
        const err = error as Record<string, any>;

        if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
            return "Unable to connect to the server. Check your connection.";
        }

        if (err.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        const response = err.response;
        if (response) {
            const data = response.data;

            if (typeof data === "string" && data.trim()) return data;

            if (data && typeof data === "object") {
                for (const key of ["message", "error", "detail", "title"]) {
                    if (typeof data[key] === "string" && data[key].trim()) {
                        return data[key];
                    }
                }

                if (Array.isArray(data.errors)) {
                    return data.errors
                        .map((item: any) =>
                            typeof item === "string"
                                ? item
                                : item?.defaultMessage ??
                                item?.message ??
                                JSON.stringify(item)
                        )
                        .join(", ");
                }
            }

            if (response.status === 401) {
                return "Your session has expired. Please sign in again.";
            }
            if (response.status === 403) {
                return "You do not have permission to perform this action.";
            }
            if (response.status === 404) {
                return "The requested scholarship was not found.";
            }
            if (response.status === 409) {
                return "A scholarship with this code or name may already exist.";
            }
            if (response.status >= 500) {
                return "The server encountered an error. Please try again.";
            }
        }

        if (typeof err.message === "string" && err.message.trim()) {
            return err.message;
        }
    }

    return "An unexpected error occurred. Please try again.";
}

export async function getScholarships(): Promise<ScholarshipResponse[]> {
    const response = await api.get<ScholarshipResponse[]>(scholarshipUrl());

    if (!Array.isArray(response.data)) {
        throw new Error("The server returned an invalid scholarship list.");
    }

    return response.data;
}

export async function getScholarshipPrefix(
    universityId: number,
    id?: number
): Promise<string> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("Please select a valid university.");
    }

    const response = await api.get<string>(
        `${scholarshipUrl()}/prefix`,
        {
            params: {
                universityId,
                ...(id != null ? { id } : {}),
            },
            responseType: "text",
        }
    );

    if (typeof response.data !== "string" || !response.data.trim()) {
        throw new Error("The server did not return a valid scholarship prefix.");
    }

    return response.data.trim();
}

export async function createScholarship(
    universityId: number,
    request: ScholarshipRequest
): Promise<ScholarshipResponse> {
    if (!Number.isFinite(universityId) || universityId <= 0) {
        throw new Error("Please select a university.");
    }

    const response = await api.post<ScholarshipResponse>(
        scholarshipUrl(),
        request,
        { params: { universityId } }
    );

    if (!response.data || typeof response.data.id !== "number") {
        throw new Error("The server did not return the created scholarship.");
    }

    return response.data;
}

export async function updateScholarship(
    id: number,
    request: ScholarshipRequest
): Promise<ScholarshipResponse> {
    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("A valid scholarship ID is required.");
    }

    const response = await api.put<ScholarshipResponse>(
        scholarshipUrl(),
        request,
        { params: { id } }
    );

    if (!response.data || typeof response.data.id !== "number") {
        throw new Error("The server did not return the updated scholarship.");
    }

    return response.data;
}

export async function deleteScholarship(id: number): Promise<string> {
    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("A valid scholarship ID is required.");
    }

    const response = await api.delete<string>(scholarshipUrl(), {
        params: { id },
    });

    return typeof response.data === "string"
        ? response.data
        : "Scholarship deleted successfully.";
}
