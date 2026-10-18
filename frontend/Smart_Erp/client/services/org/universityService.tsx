
import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

export type ActiveStatus = "ENABLE" | "DISABLE";

export interface UniversitySchool {
    id?: number;
    name?: string;
    code?: string;
}

export interface UniversityResponse {
    id: number;
    name: string;
    code: string;
    noOfUser: number;
    activeStatus: ActiveStatus;
    noOfStudent: number;
    noOfTeacher: number;
    school?: UniversitySchool | null;
}

export interface UniversityCreateRequest {
    name: string;
    code: string;
}

export interface UniversityUpdateRequest {
    name: string;
    activeStatus: ActiveStatus;
}

const getUniversityUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return `${base}/university`;
};

/**
 * GET /super-admin/university
 */
export const getUniversities = async (): Promise<UniversityResponse[]> => {
    const response = await api.get<UniversityResponse[]>(getUniversityUrl());
    return response.data;
};

/**
 * POST /super-admin/university
 * Request body: { name, code }
 */
export const createUniversity = async (
    request: UniversityCreateRequest
): Promise<UniversityResponse> => {
    const response = await api.post<UniversityResponse>(
        getUniversityUrl(),
        request
    );

    return response.data;
};

/**
 * PUT /super-admin/university/{universityId}
 * Request body: { name, activeStatus }
 */
export const updateUniversity = async (
    universityId: number,
    request: UniversityUpdateRequest
): Promise<UniversityResponse> => {
    const response = await api.put<UniversityResponse>(
        `${getUniversityUrl()}/${universityId}`,
        request
    );

    return response.data;
};

/**
 * DELETE /super-admin/university/{universityId}
 * The supplied contract describes a String response.
 */
export const deleteUniversity = async (
    universityId: number
): Promise<string> => {
    const response = await api.delete<string>(
        `${getUniversityUrl()}/${universityId}`
    );

    return response.data;
};
