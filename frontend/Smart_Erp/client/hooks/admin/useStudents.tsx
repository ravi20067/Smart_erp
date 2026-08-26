import { useEffect, useState } from "react";

import {
    getStudentStats,
    getClasses,
    getSections,
    getStudents,
    addStudent,
    deleteStudent,
} from "@/services/admin/studentService";

import type {
    Student,
    StudentFormData,
    StudentStats,
} from "@/types/admin/student";
import { exportStudentsToCSV } from "@/util/csvExport";

export default function useStudents() {
    const [search, setSearch] = useState("");

    const [selectedClass, setSelectedClass] = useState("");

    const [selectedSection, setSelectedSection] = useState("");

    const [studentList, setStudentList] = useState<Student[]>([]);

    const [loadingStudents, setLoadingStudents] = useState(false);

    const [classes, setClasses] = useState<string[]>([]);

    const [sections, setSections] = useState<string[]>([]);

    const [addStudentOpen, setAddStudentOpen] = useState(false);

    const [chatOpen, setChatOpen] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [receiptStudent, setReceiptStudent] = useState<any>(null);

    const [errorMsg, setErrorMsg] = useState("");

    const filteredStudents = studentList;

    const [formData, setFormData] =
        useState<StudentFormData>({
            firstName: "",
            lastName: "",
            gender: "MALE",
            dateOfBirth: "",
            email: "",
            phone: "",
            address: "",
            schoolClass: "",
            section: "",
        });

    const [stats, setStats] =
        useState<StudentStats>({
            totalStudents: 0,
            boys: 0,
            girls: 0,
            newStudent: 0,
        });

    useEffect(() => {
        getStudentStats()
            .then((data) => {
                setStats(data);
            })
            .catch(console.error);

        getClasses()
            .then((data) => {
                if (Array.isArray(data)) {
                    setClasses(data);
                }
            })
            .catch(console.error);
    }, []);

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cls = e.target.value;
        // update form data class
        setFormData(prev => ({ ...prev, schoolClass: cls }));
        // load sections only if a class is selected
        if (cls) {
            getSections(cls)
                .then((data) => {
                    if (Array.isArray(data)) {
                        setSections(data);
                        setFormData((prev) => ({
                            ...prev,
                            section: "",
                        }));
                    }
                })
                .catch(() => setSections([]));
        } else {
            setSections([]);
            setFormData((prev) => ({
                ...prev,
                section: "",
            }));
        }
    };
    const handleSearch = async () => {
        setLoadingStudents(true);
        try {
            const data = await getStudents(
                search,
                selectedClass,
                selectedSection
            );

            if (Array.isArray(data)) {
                const mapped = data.map((s: any) => ({
                    id: s.id,
                    admissionNo: s.admissionNo || "PENDING",
                    rollNo: s.rollNumber || 0,
                    name: `${s.firstName} ${s.lastName}`,
                    gender: (s.gender === "FEMALE" ? "Female" : "Male") as "Female" | "Male",
                    dateOfBirth: s.dateOfBirth || "",
                    className: s.schoolClass,
                    section: s.section || "A",
                    phone: s.phone || "",
                    email: s.email || "",
                    address: s.address,
                    status: s.status || "Active"
                }));
                setStudentList(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch students.", err);
        } finally {
            setLoadingStudents(false);
        }
    };
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleCloseAddStudent = () => {
        setAddStudentOpen(false);
        setErrorMsg("");
        setFormData({
            firstName: "",
            lastName: "",
            gender: "MALE",
            dateOfBirth: "",
            email: "",
            phone: "",
            address: "",
            schoolClass: "",
            section: "A",
        });
    };
    const handleAddStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg("");
        try {
            const data = await addStudent(formData);

            if (data) {
                const newStu: Student = {
                    id: data.id || Date.now(),
                    admissionNo: data.admissionNo || "PENDING",
                    rollNo: data.rollNumber || 0,
                    name: `${data.firstName} ${data.lastName}`,
                    gender: (data.gender === "FEMALE" ? "Female" : "Male") as "Female" | "Male",
                    className: data.schoolClass,
                    section: data.section || "A",
                    phone: data.phone || "",
                    status: "Active",
                    email: data.email,
                    dateOfBirth: data.dateOfBirth,
                    address: data.address || formData.address
                };
                // Store the newly added student for receipt generation
                setReceiptStudent(newStu);
            }
        } catch (err: any) {
            console.error("Error creating student:", err);
            setErrorMsg(err.response?.data?.message || "Failed to add student. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };
    const handleDownloadReceipt = (student?: any) => {
        const data = student || receiptStudent;
        if (!data) return;
        const content = `
==================================================
              ACADEMY ELITE SCHOOL
               ADMISSION RECEIPT
==================================================
Date Generated : ${new Date().toLocaleDateString()}
--------------------------------------------------
Admission No   : ${data.admissionNo || "N/A"}
Roll No        : ${data.rollNumber || data.rollNo || "N/A"}
--------------------------------------------------
First Name     : ${data.firstName || data.name?.split(' ')[0]}
Last Name      : ${data.lastName || data.name?.split(' ')[1]}
Gender         : ${data.gender}
Date of Birth  : ${data.dateOfBirth}
Email          : ${data.email}
Phone          : ${data.phone}
Address        : ${data.address}
Class          : ${data.className}
Section        : ${data.section}
--------------------------------------------------
Status         : PROCESSED & ENROLLED
==================================================
Thank you for enrolling at Academy Elite.
Please retain this copy for future reference.
==================================================
`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `admission_receipt_${data.admissionNo || "student"}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const handleExport = () => {
        exportStudentsToCSV(filteredStudents);
    };
    const handleDeleteStudent = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this student?")) {
            return;
        }
        try {
            await deleteStudent(id);
            setStudentList((prev) => prev.filter((s) => s.id !== id));
        } catch (err: any) {
            console.error("Error deleting student:", err);
            alert(err.response?.data?.message || "Failed to delete student. Please try again.");
        }
    };
    return {

        search,
        setSearch,

        selectedClass,
        setSelectedClass,

        selectedSection,
        setSelectedSection,

        studentList,

        filteredStudents,

        loadingStudents,

        classes,

        sections,
        setSections,

        addStudentOpen,
        setAddStudentOpen,

        chatOpen,
        setChatOpen,

        submitting,

        receiptStudent,

        errorMsg,

        formData,

        stats,

        handleSearch,

        handleClassChange,

        handleFormChange,

        handleCloseAddStudent,

        handleAddStudentSubmit,

        handleDeleteStudent,

        handleDownloadReceipt,

        handleExport
    };
}