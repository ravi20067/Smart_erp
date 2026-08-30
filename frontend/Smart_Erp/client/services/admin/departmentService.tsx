import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";


const baseUrl = getBaseUrl();

console.log(baseUrl);


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/


export interface CommonDTO {
    id: number;
    name: string;
    code?: string;
}


export interface DepartmentCourse {
    id: number;
    name: string;
    code: string;
}


export interface DepartmentResponse {
    id: number;
    name: string;
    code: string;
    courses?: DepartmentCourse[];
    hod?: CommonDTO | null;
}


export interface DepartmentRequest {
    id?: number;
    name: string;
    code: string;
    hodId: number | null;
}


/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/


const getErrorMessage = (
    error: any,
    fallback: string
): string => {

    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback
    );
};


/*
|--------------------------------------------------------------------------
| DEPARTMENT APIs
|--------------------------------------------------------------------------
*/


/**
 * Get all departments of a school.
 *
 * GET /admin/department/all?schoolId={schoolId}
 */
export const getAllDepartments = async (
    schoolId: number
): Promise<DepartmentResponse[]> => {

    try {

        const response = await api.get(
            `${baseUrl}/department/all`,
            {
                params: {
                    schoolId,
                },
            }
        );

        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load departments."
            )
        );
    }
};


/**
 * Get one department.
 *
 * GET /admin/department
 *
 * Query:
 * schoolId
 * departmentId
 */
export const getDepartmentById = async (
    schoolId: number,
    departmentId: number
): Promise<DepartmentResponse> => {

    try {

        const response = await api.get(
            `${baseUrl}/department`,
            {
                params: {
                    schoolId,
                    departmentId,
                },
            }
        );

        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load department."
            )
        );
    }
};


/**
 * Create department.
 *
 * POST /admin/department
 *
 * IMPORTANT:
 * Backend expects name and code as
 * query parameters, NOT JSON body.
 */
export const createDepartment = async (
    schoolId: number,
    name: string,
    code: string
): Promise<DepartmentResponse> => {

    try {

        const response = await api.post(
            `${baseUrl}/department`,
            null,
            {
                params: {
                    schoolId,
                    name,
                    code,
                },
            }
        );

        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to create department."
            )
        );
    }
};


/**
 * Update department.
 *
 * PUT /admin/department?schoolId={schoolId}
 *
 * Body:
 * {
 *   id,
 *   name,
 *   code,
 *   hodId
 * }
 */
export const updateDepartment = async (
    schoolId: number,
    department: DepartmentRequest
): Promise<DepartmentResponse> => {

    try {

        const response = await api.put(
            `${baseUrl}/department`,
            department,
            {
                params: {
                    schoolId,
                },
            }
        );

        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to update department."
            )
        );
    }
};


/**
 * Delete department.
 *
 * DELETE /admin/department
 *
 * Query:
 * schoolId
 * departmentId
 */
export const deleteDepartment = async (
    schoolId: number,
    departmentId: number
): Promise<string> => {

    try {

        const response = await api.delete(
            `${baseUrl}/department`,
            {
                params: {
                    schoolId,
                    departmentId,
                },
            }
        );

        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to delete department."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| COMMON UNIVERSITY API
|--------------------------------------------------------------------------
*/


/**
 * Get universities available to
 * the currently authenticated user.
 *
 * GET /admin/common/university
 */
export const getUniversities = async (): Promise<
    CommonDTO[]
> => {

    try {

        const response = await api.get(
            `${baseUrl}/common/university`
        );

        return response.data;

    } catch (error: any) {

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
| COMMON ACADEMIC YEAR API
|--------------------------------------------------------------------------
*/


/**
 * Get academic years of a university.
 *
 * GET /admin/common/academic-year
 *
 * Query:
 * universityId
 */
export const getAcademicYears = async (
    universityId: number
): Promise<CommonDTO[]> => {

    try {

        const response = await api.get(
            `${baseUrl}/common/academic-year`,
            {
                params: {
                    universityId,
                },
            }
        );

        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load academic years."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| COMMON SCHOOL API
|--------------------------------------------------------------------------
*/


/**
 * Get schools of an academic year.
 *
 * GET /admin/common/school
 *
 * Query:
 * academicYearId
 */
export const getSchools = async (
    academicYearId: number
): Promise<CommonDTO[]> => {

    try {

        const response = await api.get(
            `${baseUrl}/common/school`,
            {
                params: {
                    academicYearId,
                },
            }
        );

        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load schools."
            )
        );
    }
};


/*
|--------------------------------------------------------------------------
| COMMON TEACHER API
|--------------------------------------------------------------------------
*/


/**
 * Get teachers.
 *
 * GET /admin/common/teacher
 *
 * Required:
 * universityId
 *
 * Optional:
 * schoolId
 * departmentId
 * coursesId
 */
export const getTeachers = async (
    universityId: number,
    schoolId?: number,
    departmentId?: number,
    coursesId?: number
): Promise<CommonDTO[]> => {

    try {

        const params: Record<
            string,
            number
        > = {
            universityId,
        };


        if (
            schoolId !== undefined &&
            schoolId !== null
        ) {

            params.schoolId =
                schoolId;
        }


        if (
            departmentId !== undefined &&
            departmentId !== null
        ) {

            params.departmentId =
                departmentId;
        }


        if (
            coursesId !== undefined &&
            coursesId !== null
        ) {

            params.coursesId =
                coursesId;
        }


        const response = await api.get(
            `${baseUrl}/common/teacher`,
            {
                params,
            }
        );


        return response.data;

    } catch (error: any) {

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load teachers."
            )
        );
    }
};
