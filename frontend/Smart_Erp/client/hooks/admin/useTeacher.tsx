import { useEffect, useState } from "react";

import {
    getTeacherStats,
    getTeachers,
    addTeacher,
    deleteTeacher,
} from "@/services/admin/teacherService";

import type {
    Teacher,
    TeacherFormData,
    TeacherStats,
} from "@/types/admin/teacher";

import { exportTeachersToCSV } from "@/util/teacherCsvExport";

export default function useTeachers() {

    const [search, setSearch] = useState("");

    const [selectedStatus, setSelectedStatus] = useState("");

    const [teacherList, setTeacherList] = useState<Teacher[]>([]);

    const filteredTeachers = teacherList;

    const [loadingTeachers, setLoadingTeachers] = useState(false);

    const [addTeacherOpen, setAddTeacherOpen] = useState(false);

    const [chatOpen, setChatOpen] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [receiptTeacher, setReceiptTeacher] = useState<any>(null);

    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState<TeacherFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        qualification: "",
        specialization: "",
        dateOfBirth: "",
        status: "ACTIVE",
        role: "TEACHER",
        gender: "MALE",
    });

    const [stats, setStats] = useState<TeacherStats>({
        totalTeacher: 0,
        male: 0,
        female: 0,
        toadayPresent: 0,
    });

    useEffect(() => {

        getTeacherStats()
            .then(setStats)
            .catch(console.error);

    }, []);
    const handleSearch = async () => {

        setLoadingTeachers(true);

        try {

            const data = await getTeachers(
                search,
                selectedStatus
            );

            if (Array.isArray(data)) {

                const mapped: Teacher[] = data.map((t: any) => ({

                    id: t.id,

                    employeeId: t.employeeId,

                    firstName: t.firstName,

                    lastName: t.lastName,

                    name: `${t.firstName} ${t.lastName}`,

                    email: t.email,

                    phone: t.phone,

                    qualification: t.qualification,

                    specialization: t.specialization,

                    dateOfBirth: t.dateOfBirth,

                    status: t.status,

                    role: t.role,

                    joiningDate: t.joiningDate,

                    gender: t.gender || "MALE"

                }));

                setTeacherList(mapped);

            }

        } catch (err) {

            console.error("Failed to fetch teachers.", err);

        } finally {

            setLoadingTeachers(false);

        }

    };
    const handleFormChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement |
            HTMLTextAreaElement
        >
    ) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

    };
    const handleCloseAddTeacher = () => {

        setAddTeacherOpen(false);

        setReceiptTeacher(null);

        setErrorMsg("");

        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            qualification: "",
            specialization: "",
            dateOfBirth: "",
            status: "ACTIVE",
            role: "TEACHER",
            gender: "MALE",
        });

    };
    const handleAddTeacherSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        setSubmitting(true);

        setErrorMsg("");

        try {

            const payload = {
                ...formData,
                gender: formData.gender || "MALE",
            };

            const data = await addTeacher(payload);

            if (data) {

                const newTeacher: Teacher = {

                    id: data.id || Date.now(),

                    employeeId: data.employeeId || `EMP${Math.floor(1000 + Math.random() * 9000)}`,

                    firstName: data.firstName || formData.firstName,

                    lastName: data.lastName || formData.lastName,

                    name: `${data.firstName || formData.firstName} ${data.lastName || formData.lastName}`,

                    email: data.email || formData.email,

                    phone: data.phone || formData.phone,

                    qualification: data.qualification || formData.qualification,

                    specialization: data.specialization || formData.specialization,

                    dateOfBirth: data.dateOfBirth || formData.dateOfBirth,

                    status: data.status || formData.status,

                    joiningDate: data.joiningDate || new Date().toISOString().split("T")[0],

                    role: data.role || formData.role,

                    gender: data.gender || formData.gender || "MALE",

                };

                setTeacherList((prev) => [
                    newTeacher,
                    ...prev,
                ]);

                setReceiptTeacher(newTeacher);

            }

        } catch (err: any) {

            console.error(err);

            setErrorMsg(
                err.response?.data?.message ||
                "Failed to add teacher."
            );

        } finally {

            setSubmitting(false);

        }

    };
    const handleDownloadReceipt = (
        teacher?: Teacher
    ) => {

        const data = teacher || receiptTeacher;

        if (!data) return;

        const content = `
==================================================
             ACADEMY ELITE SCHOOL
            TEACHER REGISTRATION
==================================================
Date Generated : ${new Date().toLocaleDateString()}
--------------------------------------------------
Teacher Name   : ${data.firstName} ${data.lastName}
--------------------------------------------------
Email          : ${data.email}
Phone          : ${data.phone}
EmployeeID     : ${data.employeeId}
Gender         : ${data.gender || "MALE"}
Qualification  : ${data.qualification}
Specialization : ${data.specialization}
Date Of Birth  : ${data.dateOfBirth}
Role           : ${data.role}
Status         : ${data.status}
==================================================
Teacher registered successfully.
==================================================
`;

        const blob = new Blob(
            [content],
            {
                type: "text/plain;charset=utf-8",
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = `teacher_${data.firstName}_${data.lastName}.txt`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    };
    const handleExport = () => {

        exportTeachersToCSV(filteredTeachers);

    };
    const handleDeleteTeacher = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this teacher?")) {
            return;
        }
        try {
            await deleteTeacher(id);
            setTeacherList((prev) => prev.filter((t) => t.id !== id));
        } catch (err: any) {
            console.error("Error deleting teacher:", err);
            alert(err.response?.data?.message || "Failed to delete teacher. Please try again.");
        }
    };
    return {

        search,
        setSearch,

        selectedStatus,
        setSelectedStatus,

        teacherList,

        filteredTeachers,

        loadingTeachers,

        addTeacherOpen,
        setAddTeacherOpen,

        chatOpen,
        setChatOpen,

        submitting,

        receiptTeacher,

        errorMsg,

        formData,

        stats,

        handleSearch,

        handleFormChange,

        handleCloseAddTeacher,

        handleAddTeacherSubmit,

        handleDeleteTeacher,

        handleDownloadReceipt,

        handleExport,

    };

}