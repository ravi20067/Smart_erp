import api from "@/services/axiosConfig";

// =========================================================
// ACADEMIC YEARS + TEACHERS
// =========================================================

export const getAcademicYears = async () => {
    try {
        const response = await api.get("/admin/academic-years");
        if (Array.isArray(response.data)) {
            return response.data;
        }
    } catch (e) {
        console.warn("Failed to fetch academic years from backend", e);
    }
    return [];
};

export const getTeachers = async () => {
    try {
        const response = await api.get("/admin/academic-years/teachers");
        if (Array.isArray(response.data)) {
            return response.data;
        }
    } catch (e) {
        console.warn("Failed to fetch teachers from backend", e);
    }
    return [];
};


// =========================================================
// CLASSES
// =========================================================

export const getClasses = async (academicYearId: number) => {
    try {
        const response = await api.get(
            `/admin/academic-years/classes?academicYearId=${academicYearId}`
        );
        if (Array.isArray(response.data)) {
            return response.data;
        }
    } catch (e) {
        console.warn("Failed to fetch classes from backend", e);
    }
    return [];
};

export const createClass = async (data: {
    name: string;
    displayOrder: number;
    academicYearId: number;
}) => {
    const response = await api.post("/admin/academic-years/classes", data);
    return response.data;
};

export const deleteClass = async (classId: number) => {
    const response = await api.delete(`/admin/academic-years/classes/${classId}`);
    return response.data;
};



// =========================================================
// Delete Section
// =========================================================


export const deleteSection = async (sectionId: number) => {
    const response = await api.delete(`/admin/academic-years/section/${sectionId}`);
    return response.data;
};


// =========================================================
// ACADEMIC YEAR
// =========================================================

export const createAcademicYear = async (data: {
    name: string;
    startDate: string;
    endDate: string;
}) => {
    const response = await api.post("/admin/academic-years", data);
    return response.data;
};


// =========================================================
// SECTIONS
// =========================================================

export const createSection = async (
    classId: number,
    data: {
        name: string;
        roomNumber: string;
        capacity: number;
    }
) => {
    const response = await api.post(
        `/admin/academic-years/classes/${classId}/sections`,
        data
    );
    return response.data;
};


// =========================================================
// TEACHER ASSIGNMENT
// =========================================================

export const assignTeacher = async (
    sectionId: number,
    teacherId: number
) => {
    const response = await api.put(
        `/admin/academic-years/sections/${sectionId}/teacher`,
        {
            teacherId,
        }
    );
    return response.data;
};


// =========================================================
// COPY PREVIOUS STRUCTURE
// =========================================================

export const copyPreviousStructure = async (academicYearId: number) => {
    const response = await api.post(
        `/admin/academic-years/${academicYearId}/copy-structure`
    );
    return response.data;
};


export async function switchToCurrentSession(yearId: number) {
    const response = await api.put(
        `/admin/academic-years/${yearId}/current`
    );

    return response.data;
}


// =========================================================
// EXTRA UPDATE / DELETE OPERATIONS
// Existing API functions above are intentionally unchanged.
// =========================================================

export const updateAcademicYear = async (
    academicYearId: number,
    data: {
        name: string;
        startDate: string;
        endDate: string;
    }
) => {
    const response = await api.put(
        `/admin/academic-years/${academicYearId}`,
        data
    );
    return response.data;
};

export const deleteAcademicYear = async (academicYearId: number) => {
    const response = await api.delete(
        `/admin/academic-years/${academicYearId}`
    );
    return response.data;
};

export const updateClass = async (
    classId: number,
    data: {
        name: string;
        displayOrder: number;
    }
) => {
    const response = await api.put(
        `/admin/academic-years/classes/${classId}`,
        data
    );
    return response.data;
};

export const updateSection = async (
    sectionId: number,
    data: {
        name: string;
        roomNumber: string;
        capacity: number;
    }
) => {
    const response = await api.put(
        `/admin/academic-years/section/${sectionId}`,
        data
    );
    return response.data;
};
