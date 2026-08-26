import api from "@/services/axiosConfig";

const BASE_URL = "/admin/courses";

export interface AcademicYear {
    id: number;
    name: string;
    current: boolean;
}

export interface CourseSection {
    id: number;
    name: string;
    classId: number;
    className: string;
}

export interface CourseSubject {
    id: number;
    lecturesPerWeek: number;
    lectureDurationMinutes: number;
    isPracticalSubject: boolean;
    subject: {
        id: number;
        subjectName: string;
        subjectCode: string;
    };
}

export interface AvailableSection {
    id: number;
    name: string;
    classId: number;
    className: string;
}

export interface AvailableSubject {
    id: number;
    subjectName: string;
    subjectCode: string;
}

export const getUnassignedSections = async (
    academicYearId: number
): Promise<AvailableSection[]> => {
    const response = await api.get<AvailableSection[]>(
        "/admin/courses/available-sections",
        {
            params: { academicYearId },
        }
    );

    if (!Array.isArray(response.data)) {
        throw new Error("Invalid sections response.");
    }

    return response.data;
};

export const getSubjects = async (
    academicYearId: number
): Promise<AvailableSubject[]> => {
    const response = await api.get<AvailableSubject[]>(
        "/admin/courses/available-subjects",
        {
            params: { academicYearId },
        }
    );

    if (!Array.isArray(response.data)) {
        throw new Error("Invalid subjects response.");
    }

    return response.data;
};

export interface Course {
    id: number;
    name?: string;
    courseName?: string;
    courseCode: string;
    academicYear: AcademicYear;
    assignedSections: CourseSection[];
    courseSubjects: CourseSubject[];
}

export interface CoursePayload {
    name: string;
    courseName: string;
    courseCode: string;
    academicYearId: number;
    assignedSectionIds: number[];
    courseSubjects: {
        subjectId: number;
        lecturesPerWeek: number;
        lectureDurationMinutes: number;
        isPracticalSubject: boolean;
    }[];
}

export const getAcademicYears = async (): Promise<AcademicYear[]> => {
    const response = await api.get("/admin/academic-years");
    if (!Array.isArray(response.data)) {
        throw new Error("Invalid academic years response.");
    }
    return response.data;
};

export const getCourses = async (academicYearId: number): Promise<Course[]> => {
    const response = await api.get<Course[]>(BASE_URL, {
        params: { academicYearId },
    });
    if (!Array.isArray(response.data)) {
        throw new Error("Invalid courses response.");
    }
    return response.data;
};

export const getCourseById = async (courseId: number): Promise<Course> => {
    const response = await api.get<Course>(`${BASE_URL}/${courseId}`);
    if (!response.data) throw new Error("Course not found.");
    return response.data;
};

export const createCourse = async (data: CoursePayload): Promise<Course> => {
    const response = await api.post<Course>(BASE_URL, data);
    return response.data;
};

export const updateCourse = async (
    courseId: number,
    data: CoursePayload
): Promise<Course> => {
    const response = await api.put<Course>(`${BASE_URL}/${courseId}`, data);
    return response.data;
};

export const deleteCourse = async (courseId: number) => {
    const response = await api.delete(`${BASE_URL}/${courseId}`);
    return response.data;
};
export const copyCourseStructure = async (
    academicYearId: number
): Promise<void> => {

    await api.post(
        `${BASE_URL}/copy-structure`,
        null,
        {
            params: {
                academicYearId,
            },
        }
    );
};
