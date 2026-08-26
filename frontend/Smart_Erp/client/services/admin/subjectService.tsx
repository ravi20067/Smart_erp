import api from "@/services/axiosConfig";

// ============================================================
// TYPES
// ============================================================

export interface AcademicYear {
    id: number;
    name: string;
    current: boolean;
}

export interface SubjectTeacher {
    id: number;
    name: string;
    subject?: string;
}

export interface Subject {
    id: number;
    academicYearId: number;
    academicYearName?: string;
    subjectName: string;
    subjectCode: string;
    teachers: SubjectTeacher[];
}

export interface Teacher {
    id: number;
    name: string;
    subject?: string;
}

export interface SubjectRequest {
    academicYearId: number;
    subjectName: string;
    subjectCode: string;
    teacherIds: number[];
}

// ============================================================
// ERROR HANDLER
// ============================================================

function getErrorMessage(
    error: any,
    fallback: string
): string {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback
    );
}

// ============================================================
// GET ALL ACADEMIC YEARS
// ============================================================
const BASE_URL_SUBJECT = "/admin/subjects";
export const getAcademicYears = async (): Promise<AcademicYear[]> => {
    try {
        const response = await api.get(`${BASE_URL_SUBJECT}/academic-years`);

        if (!Array.isArray(response.data)) {
            throw new Error(
                "Invalid academic years response from server."
            );
        }

        return response.data;
    } catch (error: any) {
        console.error(
            "Failed to fetch academic years:",
            error
        );

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load academic years."
            )
        );
    }
};

// ============================================================
// GET CURRENT ACADEMIC YEAR
// ============================================================

export const getCurrentAcademicYear =
    async (): Promise<AcademicYear> => {
        try {
            const response = await api.get(
                `${BASE_URL_SUBJECT}/academic-years/current`
            );

            if (!response.data) {
                throw new Error(
                    "No current academic year found."
                );
            }

            return response.data;
        } catch (error: any) {
            console.error(
                "Failed to fetch current academic year:",
                error
            );

            throw new Error(
                getErrorMessage(
                    error,
                    "Failed to load current academic year."
                )
            );
        }
    };

// ============================================================
// GET ALL SUBJECTS FOR ACADEMIC YEAR
// ============================================================

export const getSubjects = async (
    academicYearId: number
): Promise<Subject[]> => {
    try {
        const response = await api.get(
            `${BASE_URL_SUBJECT}`,
            {
                params: {
                    academicYearId,
                },
            }
        );

        if (!Array.isArray(response.data)) {
            throw new Error(
                "Invalid subjects response from server."
            );
        }

        return response.data;
    } catch (error: any) {
        console.error(
            "Failed to fetch subjects:",
            error
        );

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load subjects."
            )
        );
    }
};

// ============================================================
// GET ALL TEACHERS FOR ACADEMIC YEAR
// ============================================================

export const getTeachers = async (
    academicYearId: number
): Promise<Teacher[]> => {
    try {
        const response = await api.get(
            `${BASE_URL_SUBJECT}/teachers`,
            {
                params: {
                    academicYearId,
                },
            }
        );

        if (!Array.isArray(response.data)) {
            throw new Error(
                "Invalid teachers response from server."
            );
        }

        return response.data;
    } catch (error: any) {
        console.error(
            "Failed to fetch teachers:",
            error
        );

        throw new Error(
            getErrorMessage(
                error,
                "Failed to load teachers."
            )
        );
    }
};

// ============================================================
// CREATE SUBJECT
// ============================================================

export const createSubject = async (
    subject: SubjectRequest
): Promise<Subject> => {
    try {
        const response = await api.post(
            `${BASE_URL_SUBJECT}`,
            subject
        );

        return response.data;
    } catch (error: any) {
        console.error(
            "Failed to create subject:",
            error
        );

        throw new Error(
            getErrorMessage(
                error,
                "Failed to create subject."
            )
        );
    }
};

// ============================================================
// UPDATE SUBJECT
// ============================================================

export const updateSubject = async (
    id: number,
    subject: SubjectRequest
): Promise<Subject> => {
    try {
        const response = await api.put(
            `${BASE_URL_SUBJECT}/${id}`,
            subject
        );

        return response.data;
    } catch (error: any) {
        console.error(
            "Failed to update subject:",
            error
        );

        throw new Error(
            getErrorMessage(
                error,
                "Failed to update subject."
            )
        );
    }
};

// ============================================================
// DELETE SUBJECT
// ============================================================

export const deleteSubject = async (
    id: number,
    academicYearId: number
): Promise<void> => {
    try {
        await api.delete(
            `${BASE_URL_SUBJECT}/${id}`,
            {
                params: {
                    academicYearId,
                },
            }
        );
    } catch (error: any) {
        console.error(
            "Failed to delete subject:",
            error
        );

        throw new Error(
            getErrorMessage(
                error,
                "Failed to delete subject."
            )
        );
    }
};

// ============================================================
// COPY CURRENT YEAR STRUCTURE
// ============================================================
export const copyCurrentYearStructure = async (
    targetYearId: number
): Promise<void> => {
    try {
        await api.post(
            `${BASE_URL_SUBJECT}/copy-current-structure`,
            null,
            {
                params: {
                    academicYearId: targetYearId,
                },
            }
        );
    } catch (error: any) {
        console.error(
            "Failed to copy current academic year structure:",
            error
        );

        throw new Error(
            getErrorMessage(
                error,
                "Failed to copy current academic year structure."
            )
        );
    }
};