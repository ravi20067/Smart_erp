import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

const baseUrl = getBaseUrl();//it give you /admin

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface CommonDTO {
    id: number;
    name: string;
    code: string;
}

export interface SchoolResponse {
    id: number;
    name: string;
    code: string;
    dean: CommonDTO | null;
}

export interface AcademicYearResponse {
    id: number;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    current: boolean;
    active: boolean;
    schoolResponse: SchoolResponse[];
}

export interface UniversityResponse {
    id: number;
    name: string;
    noOfUser?: number;
    noOfStudent?: number;
    noOfTeacher?: number;
    dean?: CommonDTO | null;
}

export interface AcademicYearRequest {
    name: string;
    code: string;
    active: boolean;
    startDate: string;
    endDate: string;
}

export interface SchoolRequest {
    name: string;
    code: string;
    deanId: number | null;
}


/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
    error: any,
    fallback: string
): string => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        fallback
    );
};


/*
|--------------------------------------------------------------------------
| UNIVERSITY
|--------------------------------------------------------------------------
*/

/*
    GET  /university

    Used only when:
        - universityId is NOT in URL
        - logged-in role is ADMIN
*/
export const getUniversities = async (): Promise<
    CommonDTO[]
> => {

    try {

        const response = await api.get(
            `${baseUrl}/common/university`
        );

        return Array.isArray(response.data)
            ? response.data
            : [];

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load universities."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| ACADEMIC YEAR
|--------------------------------------------------------------------------
*/

/*
    GET  /academic-year/all?universityId={id}
*/
export const getAcademicYears = async (
    universityId: number
): Promise<AcademicYearResponse[]> => {

    try {

        if (!universityId) {
            throw new Error(
                "University ID is required."
            );
        }

        const response = await api.get(
            `${baseUrl}/academic-year/all`,
            {
                params: {
                    universityId,
                },
            }
        );

        return Array.isArray(response.data)
            ? response.data
            : [];

    } catch (error) {

        if (
            error instanceof Error &&
            !("response" in error)
        ) {
            throw error;
        }

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load academic years."
            )
        );
    }
};


/*
    GET /academic-year
        ?universityId={id}
        &academicYearId={id}
*/
export const getAcademicYearById = async (
    universityId: number,
    academicYearId: number
): Promise<AcademicYearResponse> => {

    try {

        const response = await api.get(
            `${baseUrl}/academic-year`,
            {
                params: {
                    universityId,
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load academic year."
            )
        );
    }
};


/*
    POST /academic-year
        ?universityId={id}

    Body:
    {
        name,
        code,
        active,
        startDate,
        endDate
    }
*/
export const createAcademicYear = async (
    universityId: number,
    data: AcademicYearRequest
): Promise<AcademicYearResponse> => {

    try {

        const response = await api.post(
            `${baseUrl}/academic-year`,
            data,
            {
                params: {
                    universityId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to create academic year."
            )
        );
    }
};


/*
    PUT  /academic-year
        ?universityId={id}
        &academicYearId={id}

    Body:
    {
        name,
        code,
        active,
        startDate,
        endDate
    }
*/
export const updateAcademicYear = async (
    universityId: number,
    academicYearId: number,
    data: AcademicYearRequest
): Promise<AcademicYearResponse> => {

    try {

        const response = await api.put(
            `${baseUrl}/academic-year`,
            data,
            {
                params: {
                    universityId,
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to update academic year."
            )
        );
    }
};


/*
    DELETE /academic-year
        ?universityId={id}
        &academicYearId={id}
*/
export const deleteAcademicYear = async (
    universityId: number,
    academicYearId: number
) => {

    try {

        const response = await api.delete(
            `${baseUrl}/academic-year`,
            {
                params: {
                    universityId,
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to delete academic year."
            )
        );
    }
};


/*
    POST /academic-year/switch
        ?universityID={id}
        &academicYearId={id}
*/
export const switchAcademicYear = async (
    universityId: number,
    academicYearId: number
) => {

    try {

        const response = await api.post(
            `${baseUrl}/academic-year/switch`,
            null,
            {
                params: {
                    universityID: universityId,
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to switch academic year."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| SCHOOL
|--------------------------------------------------------------------------
*/

/*
    CURRENT BACKEND:
    
    POST /school/{academicYearId}
        ?schoolName={name}
        &schoolCode={code}

    No JSON body.
*/
export const createSchool = async (
    academicYearId: number,
    name: string,
    code: string
): Promise<SchoolResponse> => {

    try {

        const response = await api.post(
            `${baseUrl}/school/${academicYearId}`,
            null,
            {
                params: {
                    schoolName: name,
                    schoolCode: code,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to create school."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| SCHOOL UPDATE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Your specification says the current backend has:
|
| PUT /school/{schoolId}
|
| while also declaring academicYearId as a path variable.
|
| Therefore we DO NOT invent a URL here.
|
| This function uses the currently documented path:
|
| PUT /school/{schoolId}
|
| and sends academicYearId as a query parameter.
|
| If your backend is changed to:
| PUT /school/{academicYearId}/{schoolId}
|
| change only this URL.
|
|--------------------------------------------------------------------------
*/

export const updateSchool = async (
    academicYearId: number,
    schoolId: number,
    data: SchoolRequest
): Promise<SchoolResponse> => {

    try {

        const response = await api.put(
            `${baseUrl}/school/${schoolId}`,
            data,
            {
                params: {
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to update school."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| SCHOOL DELETE
|--------------------------------------------------------------------------
|
| CURRENT documented mapping:
|
| DELETE /school/{schoolId}
|
| academicYearId is supplied as query parameter.
|--------------------------------------------------------------------------
*/

export const deleteSchool = async (
    academicYearId: number,
    schoolId: number
) => {

    try {

        const response = await api.delete(
            `${baseUrl}/school/${schoolId}`,
            {
                params: {
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to delete school."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| SCHOOL GET BY ID
|--------------------------------------------------------------------------
|
| DO NOT use this until backend endpoint is clarified.
|
| Your specification explicitly says there is a mismatch between
| @PathVariable academicYearId + schoolId and the actual mapping.
|--------------------------------------------------------------------------
*/

export const getSchoolById = async (
    academicYearId: number,
    schoolId: number
): Promise<SchoolResponse> => {

    try {

        /*
         * Current documented mapping:
         *
         * GET /school/{schoolId}
         *
         * academicYearId -> query parameter
         */

        const response = await api.get(
            `${baseUrl}/school/${schoolId}`,
            {
                params: {
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load school."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| TEACHERS / DEANS
|--------------------------------------------------------------------------
|
| GET /common/teacher
| ?universityId={universityId}
|--------------------------------------------------------------------------
*/

export const getTeachers = async (
    universityId: number
): Promise<CommonDTO[]> => {

    try {

        const response = await api.get(
            `${baseUrl}/common/teacher`,
            {
                params: {
                    universityId,
                },
            }
        );

        return Array.isArray(response.data)
            ? response.data
            : [];

    } catch (error) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load teachers."
            )
        );
    }
};