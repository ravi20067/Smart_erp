import api from "@/services/axiosConfig";
import { StudentFormData } from "@/types/admin/student";

export const getStudentStats = async () => {
    const response = await api.get("/admin/student/stats");
    return response.data;
};

export const getClasses = async () => {
    try {
        const response = await api.get("/admin/student/classes");
        if (Array.isArray(response.data)) {
            return response.data;
        }
    } catch (e) {
        console.warn("Failed to fetch classes from backend", e);
    }
    return [];
};

export const deleteStudent = async (
    id: number
) => {
    const response = await api.delete(
        `/admin/student/delete/${id}`
    );

    return response.data;
};

export const getSections = async (schoolClass: string) => {
    const response = await api.get(
        `/admin/student/sections?class=${schoolClass}`
    );
    return response.data;
};

export const getStudents = async (
    search: string,
    schoolClass: string,
    section: string
) => {
    const response = await api.get(
        `/admin/student/students?search=${encodeURIComponent(search)}&class=${schoolClass}&section=${section}`
    );

    return response.data;
};

export const addStudent = async (formData: StudentFormData) => {
    const response = await api.post(
        "/admin/student/add",
        formData
    );

    return response.data;
};