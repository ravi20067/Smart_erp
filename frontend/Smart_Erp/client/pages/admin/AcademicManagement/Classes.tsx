import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Users,
    GraduationCap,
    CalendarDays,
    Trash2,
    UserPlus,
    Copy,
    X,
    ChevronDown,
    RefreshCw,
    Pencil,
    Eye,
} from "lucide-react";
import {
    getAcademicYears,
    getTeachers,
    getClasses,
    createAcademicYear,
    createClass,
    createSection,
    assignTeacher,
    deleteClass,
    deleteSection,
    copyPreviousStructure,
    switchToCurrentSession,
    updateAcademicYear,
    deleteAcademicYear,
    updateClass,
    updateSection,
} from "@/services/admin/academicManagement";

import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";
import { useToast } from "@/components/ui/use-toast";

type Teacher = {
    id: number;
    name: string;
    subject?: string;
};

type Section = {
    id: number;
    name: string;
    classTeacher?: Teacher | null;
    studentCount: number;
    capacity: number;
    roomNumber?: string;
};

type SchoolClass = {
    id: number;
    name: string;
    displayOrder: number;
    isActive: boolean;
    sections: Section[];
};

type AcademicYear = {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    current: boolean;
    active: boolean;
};


export default function Classes() {
    const [chatOpen, setChatOpen] = useState(false);

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");

    const [showClassModal, setShowClassModal] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [showEditYearModal, setShowEditYearModal] = useState(false);
    const [showEditClassModal, setShowEditClassModal] = useState(false);
    const [showEditSectionModal, setShowEditSectionModal] = useState(false);

    const [selectedClass, setSelectedClass] =
        useState<SchoolClass | null>(null);

    const [selectedSection, setSelectedSection] =
        useState<Section | null>(null);

    const [classForm, setClassForm] = useState({
        name: "",
        displayOrder: 1,
    });

    const [yearForm, setYearForm] = useState({
        name: "",
        startDate: "",
        endDate: "",
    });

    const [sectionForm, setSectionForm] = useState({
        name: "",
        roomNumber: "",
        capacity: 40,
    });

    const [editYearForm, setEditYearForm] = useState({
        id: 0,
        name: "",
        startDate: "",
        endDate: "",
    });

    const [editClassForm, setEditClassForm] = useState({
        id: 0,
        name: "",
        displayOrder: 1,
    });

    const [editSectionForm, setEditSectionForm] = useState({
        id: 0,
        name: "",
        roomNumber: "",
        capacity: 40,
    });

    const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">(
        ""
    );

    const { toast } = useToast();
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState("");

    const handleError = (error: any, fallback: string) => {
        const responseData = error?.response?.data;
        const msg =
            responseData?.message ||
            responseData?.error ||
            (Array.isArray(responseData?.errors)
                ? responseData.errors.map((item: any) => item?.message || item).join(", ")
                : null) ||
            error?.message ||
            fallback;
        setErrorMsg(msg);
        toast({
            variant: "destructive",
            title: "Error",
            description: msg,
        });
    };

    /* ---------------------------------------------------------
       LOAD DATA
    --------------------------------------------------------- */

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            loadClasses(selectedYear);
        }
    }, [selectedYear]);


    async function loadInitialData() {
        try {
            setLoading(true);
            setErrorMsg("");

            const [years, teacherData] = await Promise.all([
                getAcademicYears(),
                getTeachers(),
            ]);

            setAcademicYears(years);
            setTeachers(teacherData);

            const currentYear = years.find(
                (year: AcademicYear) => year.current
            );

            if (currentYear) {
                setSelectedYear(currentYear.id);
            } else if (years.length > 0) {
                setSelectedYear(years[0].id);
            }

        } catch (error) {
            handleError(error, "Failed to load initial academic data.");
        } finally {
            setLoading(false);
        }
    }

    async function loadClasses(yearId: number) {
        try {
            const data = await getClasses(yearId);

            setClasses(data);
        } catch (error) {
            handleError(error, "Failed to load classes.");
        }
    }



    async function handleSwitchToCurrentSession() {
        if (!selectedYear) {
            return;
        }

        const selected = academicYears.find(
            (year) => year.id === selectedYear
        );

        if (!selected || selected.current) {
            return;
        }

        const confirmed = window.confirm(
            `Switch ${selected.name} to the current academic session?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            await switchToCurrentSession(selectedYear);

            // Update current status locally
            setAcademicYears((prev) =>
                prev.map((year) => ({
                    ...year,
                    current: year.id === selectedYear,
                }))
            );

            toast({
                title: "Success",
                description: `${selected.name} is now the current session.`,
            });

        } catch (error) {
            handleError(
                error,
                "Failed to switch current academic session."
            );
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------
       CREATE ACADEMIC YEAR
    --------------------------------------------------------- */

    async function handleCreateAcademicYear() {
        if (!yearForm.name.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Academic year name is required.",
            });
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            const newYear = await createAcademicYear({
                name: yearForm.name,
                startDate: yearForm.startDate,
                endDate: yearForm.endDate,
            });

            setAcademicYears((prev) => [...prev, newYear]);

            setSelectedYear(newYear.id);

            setYearForm({
                name: "",
                startDate: "",
                endDate: "",
            });

            setShowYearModal(false);

            toast({
                title: "Success",
                description: "Academic year created successfully.",
            });

        } catch (error) {
            handleError(error, "Failed to create academic year.");
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------
       CREATE CLASS
    --------------------------------------------------------- */

    async function handleCreateClass() {
        if (!classForm.name.trim() || !selectedYear) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Class name and academic year selection are required.",
            });
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            await createClass({
                name: classForm.name,
                displayOrder: classForm.displayOrder,
                academicYearId: selectedYear,
            });

            setShowClassModal(false);

            setClassForm({
                name: "",
                displayOrder: 1,
            });

            await loadClasses(selectedYear);

            toast({
                title: "Success",
                description: "Class created successfully.",
            });

        } catch (error) {
            handleError(error, "Failed to create class.");
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------
       CREATE SECTION
    --------------------------------------------------------- */

    async function handleCreateSection() {
        if (!selectedClass || !sectionForm.name.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Section name is required.",
            });
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            await createSection(selectedClass.id, {
                name: sectionForm.name,
                roomNumber: sectionForm.roomNumber,
                capacity: sectionForm.capacity,
            });

            setShowSectionModal(false);

            setSectionForm({
                name: "",
                roomNumber: "",
                capacity: 40,
            });

            if (selectedYear) {
                await loadClasses(selectedYear);
            }

            toast({
                title: "Success",
                description: "Section created successfully.",
            });

        } catch (error) {
            handleError(error, "Failed to create section.");
        } finally {
            setSaving(false);
        }
    }
    /* ---------------------------------------------------------
       ASSIGN TEACHER
    --------------------------------------------------------- */

    async function handleAssignTeacher() {
        if (!selectedSection || selectedTeacherId === "") {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select a teacher.",
            });
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            await assignTeacher(
                selectedSection.id,
                selectedTeacherId
            );

            setShowTeacherModal(false);

            if (selectedYear) {
                await loadClasses(selectedYear);
            }

            toast({
                title: "Success",
                description: "Teacher assigned successfully.",
            });

        } catch (error) {
            handleError(error, "Failed to assign teacher.");
        } finally {
            setSaving(false);
        }
    }
    /* ---------------------------------------------------------
       DELETE CLASS
    --------------------------------------------------------- */

    async function handleDeleteSection(sectionId: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this section?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setErrorMsg("");

            await deleteSection(sectionId);

            if (selectedYear) {
                await loadClasses(selectedYear);
            }

            toast({
                title: "Success",
                description: "Section deleted successfully.",
            });

        } catch (error) {
            handleError(error, "Failed to delete section.");
        }
    }

    async function handleDeleteClass(classId: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this class configuration?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setErrorMsg("");

            await deleteClass(classId);

            if (selectedYear) {
                await loadClasses(selectedYear);
            }

            toast({
                title: "Success",
                description: "Class deleted successfully.",
            });

        } catch (error) {
            handleError(error, "Failed to delete class.");
        }
    }

    /* ---------------------------------------------------------
       EDIT / DELETE ACADEMIC YEAR
    --------------------------------------------------------- */

    function openEditAcademicYear(year: AcademicYear) {
        if (year.current) {
            toast({
                variant: "destructive",
                title: "Action not allowed",
                description: "The current academic year cannot be edited.",
            });
            return;
        }

        setEditYearForm({
            id: year.id,
            name: year.name ?? "",
            startDate: year.startDate ?? "",
            endDate: year.endDate ?? "",
        });
        setErrorMsg("");
        setShowEditYearModal(true);
    }

    async function handleEditAcademicYear() {
        if (!editYearForm.id || !editYearForm.name.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Academic year name is required.",
            });
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            const updated = await updateAcademicYear(editYearForm.id, {
                name: editYearForm.name.trim(),
                startDate: editYearForm.startDate,
                endDate: editYearForm.endDate,
            });

            setAcademicYears((prev) =>
                prev.map((year) =>
                    year.id === editYearForm.id ? { ...year, ...updated } : year
                )
            );

            setShowEditYearModal(false);
            toast({
                title: "Success",
                description: "Academic year updated successfully.",
            });
        } catch (error) {
            handleError(error, "Failed to update academic year.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteAcademicYear(year: AcademicYear) {
        if (year.current) {
            toast({
                variant: "destructive",
                title: "Action not allowed",
                description: "The current academic year cannot be deleted.",
            });
            return;
        }

        if (!window.confirm(
            `Are you sure you want to delete academic year "${year.name}"? This action cannot be undone.`
        )) return;

        try {
            setSaving(true);
            setErrorMsg("");
            await deleteAcademicYear(year.id);

            const remainingYears = academicYears.filter(
                (item) => item.id !== year.id
            );
            setAcademicYears(remainingYears);

            if (selectedYear === year.id) {
                const fallback =
                    remainingYears.find((item) => item.current) ??
                    remainingYears[0] ??
                    null;
                setSelectedYear(fallback?.id ?? null);
            }

            toast({
                title: "Success",
                description: "Academic year deleted successfully.",
            });
        } catch (error) {
            handleError(error, "Failed to delete academic year.");
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------
       EDIT CLASS
    --------------------------------------------------------- */

    function openEditClass(schoolClass: SchoolClass) {
        setEditClassForm({
            id: schoolClass.id,
            name: schoolClass.name ?? "",
            displayOrder: schoolClass.displayOrder ?? 1,
        });
        setErrorMsg("");
        setShowEditClassModal(true);
    }

    async function handleEditClass() {
        if (!editClassForm.id || !editClassForm.name.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Class name is required.",
            });
            return;
        }

        if (!selectedYear) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select an academic year.",
            });
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            await updateClass(editClassForm.id, {
                name: editClassForm.name.trim(),
                displayOrder: editClassForm.displayOrder,
            });

            await loadClasses(selectedYear);
            setShowEditClassModal(false);

            toast({
                title: "Success",
                description: "Class updated successfully.",
            });
        } catch (error) {
            handleError(error, "Failed to update class.");
        } finally {
            setSaving(false);
        }
    }

    function handleViewClass(schoolClass: SchoolClass) {
        navigate(`/admin/classes/${schoolClass.id}`);
    }

    /* ---------------------------------------------------------
       EDIT SECTION
    --------------------------------------------------------- */

    function openEditSection(section: Section) {
        setEditSectionForm({
            id: section.id,
            name: section.name ?? "",
            roomNumber: section.roomNumber ?? "",
            capacity: section.capacity ?? 40,
        });
        setErrorMsg("");
        setShowEditSectionModal(true);
    }

    async function handleEditSection() {
        if (!editSectionForm.id || !editSectionForm.name.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Section name is required.",
            });
            return;
        }

        if (editSectionForm.capacity <= 0) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Student capacity must be greater than zero.",
            });
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            await updateSection(editSectionForm.id, {
                name: editSectionForm.name.trim(),
                roomNumber: editSectionForm.roomNumber.trim(),
                capacity: editSectionForm.capacity,
            });

            if (selectedYear) {
                await loadClasses(selectedYear);
            }

            setShowEditSectionModal(false);
            toast({
                title: "Success",
                description: "Section updated successfully.",
            });
        } catch (error) {
            handleError(error, "Failed to update section.");
        } finally {
            setSaving(false);
        }
    }

    function handleViewSection(section: Section) {
        navigate(`/admin/sections/${section.id}`);
    }

    /* ---------------------------------------------------------
       COPY STRUCTURE TO NEW YEAR
    --------------------------------------------------------- */

    async function handleCopyPreviousStructure() {
        if (!selectedYear) {
            return;
        }

        const targetYear = academicYears.find(
            (year) => year.id === selectedYear
        );

        if (!targetYear) {
            return;
        }

        const confirmed = window.confirm(
            `Copy class and section structure into ${targetYear.name}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");

            await copyPreviousStructure(selectedYear);

            await loadClasses(selectedYear);

            toast({
                title: "Success",
                description: "Structure copied successfully.",
            });

        } catch (error) {
            handleError(error, "Failed to copy structure.");
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------
       FILTER
    --------------------------------------------------------- */

    const filteredClasses = useMemo(() => {
        return classes.filter((schoolClass) =>
            schoolClass.name
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [classes, search]);

    const selectedAcademicYear = academicYears.find(
        (year) => year.id === selectedYear
    );

    const totalStudents = classes.reduce(
        (total, schoolClass) =>
            total +
            schoolClass.sections.reduce(
                (sectionTotal, section) =>
                    sectionTotal + section.studentCount,
                0
            ),
        0
    );

    const totalSections = classes.reduce(
        (total, schoolClass) =>
            total + schoolClass.sections.length,
        0
    );

    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            <Header />

            <div className="flex h-[calc(100vh-80px)]">

                {/* SIDEBAR */}

                <aside
                    className="
                    hidden lg:block
                    w-72
                    shrink-0
                    overflow-y-auto
                    border-r
                    border-slate-200
                    dark:border-slate-800
                    bg-white
                    dark:bg-slate-900
                    "
                >
                    <Sidebar />
                </aside>

                {/* MAIN */}

                <main
                    className="
                    flex-1
                    overflow-y-auto
                    p-4
                    md:p-6
                    "
                >

                    {/* PAGE HEADER */}

                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                        <div>
                            <div className="flex items-center gap-2">

                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                    Classes
                                </h1>

                                {selectedAcademicYear?.current && (
                                    <span
                                        className="
                                        rounded-full
                                        bg-emerald-100
                                        px-3
                                        py-1
                                        text-xs
                                        font-semibold
                                        text-emerald-700
                                        "
                                    >
                                        Current Year
                                    </span>
                                )}

                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage classes, sections, teachers and student capacity.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">

                            <button
                                onClick={() => setShowYearModal(true)}
                                className="
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-4
                                py-2.5
                                text-sm
                                font-semibold
                                text-slate-700
                                shadow-sm
                                hover:bg-slate-50
                                dark:border-slate-700
                                dark:bg-slate-900
                                dark:text-white
                                "
                            >
                                <CalendarDays size={17} />
                                New Academic Year
                            </button>

                            <button
                                onClick={() => setShowClassModal(true)}
                                className="
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-primary
                                px-4
                                py-2.5
                                text-sm
                                font-semibold
                                text-white
                                shadow-sm
                                hover:opacity-90
                                "
                            >
                                <Plus size={18} />
                                Add Class
                            </button>

                        </div>

                    </div>

                    {/* YEAR + ACTION BAR */}

                    <div
                        className="
                        mt-6
                        flex
                        flex-col
                        gap-3
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-4
                        shadow-sm
                        dark:border-slate-800
                        dark:bg-slate-900
                        md:flex-row
                        md:items-center
                        md:justify-between
                        "
                    >

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                            <div className="relative">

                                <CalendarDays
                                    size={17}
                                    className="
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                    "
                                />

                                <select
                                    value={selectedYear ?? ""}
                                    onChange={(e) =>
                                        setSelectedYear(
                                            Number(e.target.value)
                                        )
                                    }
                                    className="
                                    appearance-none
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    py-2.5
                                    pl-10
                                    pr-10
                                    text-sm
                                    font-medium
                                    outline-none
                                    dark:border-slate-700
                                    dark:bg-slate-800
                                    dark:text-white
                                    "
                                >
                                    {academicYears.map((year) => (
                                        <option
                                            key={year.id}
                                            value={year.id}
                                        >
                                            {year.name}
                                            {year.current
                                                ? " — Current"
                                                : ""}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={15}
                                    className="
                                    pointer-events-none
                                    absolute
                                    right-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                    "
                                />

                            </div>

                            {selectedAcademicYear && !selectedAcademicYear.current && (
                                <button
                                    onClick={handleSwitchToCurrentSession}
                                    disabled={saving}
                                    className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-primary
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            hover:opacity-90
            disabled:opacity-50
        "
                                >
                                    Switch to Current Session
                                </button>
                            )}
                            {selectedAcademicYear && !selectedAcademicYear.current && (
                                <button
                                    onClick={handleCopyPreviousStructure}
                                    disabled={saving}
                                    className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                border
                                border-slate-200
                                px-4
                                py-2.5
                                text-sm
                                font-medium
                                hover:bg-slate-50
                                disabled:opacity-50
                                dark:border-slate-700
                                dark:hover:bg-slate-800
                                "
                                >
                                    <Copy size={16} />
                                    Copy Structure
                                </button>

                            )}

                            {selectedAcademicYear && !selectedAcademicYear.current && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditAcademicYear(selectedAcademicYear)
                                        }
                                        disabled={saving}
                                        title="Edit academic year"
                                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                    >
                                        <Pencil size={16} />
                                        Edit Year
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDeleteAcademicYear(selectedAcademicYear)
                                        }
                                        disabled={saving}
                                        title="Delete academic year"
                                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2 size={16} />
                                        Delete Year
                                    </button>
                                </>
                            )}

                        </div>

                        <div className="relative">

                            <Search
                                size={17}
                                className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-slate-400
                                "
                            />

                            <input
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search class..."
                                className="
                                w-full
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                py-2.5
                                pl-10
                                pr-4
                                text-sm
                                outline-none
                                focus:border-primary
                                md:w-64
                                dark:border-slate-700
                                dark:bg-slate-800
                                "
                            />

                        </div>

                    </div>

                    {/* SUMMARY CARDS */}

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                        <SummaryCard
                            icon={<GraduationCap size={20} />}
                            title="Total Classes"
                            value={classes.length}
                        />

                        <SummaryCard
                            icon={<Users size={20} />}
                            title="Total Sections"
                            value={totalSections}
                        />

                        <SummaryCard
                            icon={<Users size={20} />}
                            title="Students"
                            value={totalStudents.toLocaleString()}
                        />

                    </div>

                    {/* CLASS LIST */}

                    <div className="mt-6 space-y-4">

                        {loading ? (

                            <div className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-10
                                text-center
                                dark:border-slate-800
                                dark:bg-slate-900
                            ">
                                <RefreshCw
                                    className="mx-auto animate-spin text-primary"
                                    size={25}
                                />

                                <p className="mt-3 text-sm text-slate-500">
                                    Loading classes...
                                </p>
                            </div>

                        ) : filteredClasses.length === 0 ? (

                            <div className="
                                rounded-2xl
                                border
                                border-dashed
                                border-slate-300
                                bg-white
                                p-12
                                text-center
                                dark:border-slate-700
                                dark:bg-slate-900
                            ">

                                <GraduationCap
                                    className="mx-auto text-slate-400"
                                    size={38}
                                />

                                <h3 className="mt-4 font-semibold">
                                    No classes found
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Add a class or copy the previous year's structure.
                                </p>

                            </div>

                        ) : (

                            filteredClasses.map((schoolClass) => (

                                <ClassCard
                                    key={schoolClass.id}
                                    schoolClass={schoolClass}
                                    onAddSection={() => {
                                        setSelectedClass(schoolClass);
                                        setShowSectionModal(true);
                                    }}
                                    onAssignTeacher={(section) => {
                                        setSelectedSection(section);
                                        setSelectedTeacherId(
                                            section.classTeacher?.id ?? ""
                                        );
                                        setShowTeacherModal(true);
                                    }}
                                    onDelete={() =>
                                        handleDeleteClass(schoolClass.id)
                                    }
                                    onDeleteSection={(sectionId) =>
                                        handleDeleteSection(sectionId)
                                    }
                                    onEdit={openEditClass}
                                    onView={handleViewClass}
                                    onEditSection={openEditSection}
                                    onViewSection={handleViewSection}
                                />

                            ))

                        )}

                    </div>

                </main>
            </div>

            {/* ------------------------------------------------
                FLOATING COPILOT
            ------------------------------------------------ */}

            <button
                onClick={() => setChatOpen(true)}
                className="
                fixed
                bottom-6
                right-6
                z-50
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-gradient-to-r
                from-primary
                to-secondary
                text-white
                shadow-xl
                transition
                hover:scale-105
                "
            >
                <Users size={28} />
            </button>

            {chatOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => setChatOpen(false)}
                    />

                    <div
                        className="
                        fixed
                        bottom-24
                        right-6
                        z-50
                        h-[75vh]
                        max-h-[700px]
                        w-[95vw]
                        overflow-hidden
                        rounded-3xl
                        border
                        border-slate-200
                        bg-white
                        shadow-2xl
                        sm:w-[420px]
                        dark:border-slate-700
                        dark:bg-slate-900
                        "
                    >

                        <div
                            className="
                            flex
                            items-center
                            justify-between
                            border-b
                            border-slate-200
                            px-5
                            py-4
                            dark:border-slate-700
                            "
                        >

                            <div>
                                <h2 className="text-lg font-bold">
                                    AI Administrator Copilot
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Ask anything.
                                </p>
                            </div>

                            <button
                                onClick={() => setChatOpen(false)}
                                className="
                                rounded-lg
                                p-2
                                hover:bg-slate-100
                                dark:hover:bg-slate-800
                                "
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="h-[calc(100%-72px)]">
                            <Copilot />
                        </div>

                    </div>
                </>
            )}

            {/* MODALS */}

            {showYearModal && (
                <Modal
                    title="Create Academic Year"
                    onClose={() => { setShowYearModal(false); setErrorMsg(""); }}
                >

                    <div className="space-y-4">

                        {errorMsg && (
                            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
                                {errorMsg}
                            </div>
                        )}

                        <Input
                            label="Academic Year"
                            placeholder="2026-27"
                            value={yearForm.name}
                            onChange={(value) =>
                                setYearForm({
                                    ...yearForm,
                                    name: value,
                                })
                            }
                        />

                        <div className="grid grid-cols-2 gap-3">

                            <Input
                                label="Start Date"
                                type="date"
                                value={yearForm.startDate}
                                onChange={(value) =>
                                    setYearForm({
                                        ...yearForm,
                                        startDate: value,
                                    })
                                }
                            />

                            <Input
                                label="End Date"
                                type="date"
                                value={yearForm.endDate}
                                onChange={(value) =>
                                    setYearForm({
                                        ...yearForm,
                                        endDate: value,
                                    })
                                }
                            />

                        </div>

                        <ModalButtons
                            loading={saving}
                            onCancel={() => {
                                setShowYearModal(false);
                                setErrorMsg("");
                            }}
                            onSave={handleCreateAcademicYear}
                            text="Create Academic Year"
                        />

                    </div>

                </Modal>
            )}

            {showClassModal && (
                <Modal
                    title="Add New Class"
                    onClose={() => { setShowClassModal(false); setErrorMsg(""); }}
                >

                    <div className="space-y-4">

                        {errorMsg && (
                            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
                                {errorMsg}
                            </div>
                        )}

                        <Input
                            label="Class Name"
                            placeholder="Class 10"
                            value={classForm.name}
                            onChange={(value) =>
                                setClassForm({
                                    ...classForm,
                                    name: value,
                                })
                            }
                        />

                        <Input
                            label="Display Order"
                            type="number"
                            value={String(classForm.displayOrder)}
                            onChange={(value) =>
                                setClassForm({
                                    ...classForm,
                                    displayOrder: Number(value),
                                })
                            }
                        />

                        <div className="
                            rounded-xl
                            bg-slate-50
                            p-3
                            text-sm
                            text-slate-500
                            dark:bg-slate-800
                        ">
                            Academic Year:{" "}
                            <strong>
                                {selectedAcademicYear?.name}
                            </strong>
                        </div>

                        <ModalButtons
                            loading={saving}
                            onCancel={() => {
                                setShowClassModal(false);
                                setErrorMsg("");
                            }}
                            onSave={handleCreateClass}
                            text="Create Class"
                        />

                    </div>

                </Modal>
            )}

            {showSectionModal && selectedClass && (
                <Modal
                    title={`Add Section — ${selectedClass.name}`}
                    onClose={() => { setShowSectionModal(false); setErrorMsg(""); }}
                >

                    <div className="space-y-4">

                        {errorMsg && (
                            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
                                {errorMsg}
                            </div>
                        )}

                        <Input
                            label="Section"
                            placeholder="A"
                            value={sectionForm.name}
                            onChange={(value) =>
                                setSectionForm({
                                    ...sectionForm,
                                    name: value,
                                })
                            }
                        />

                        <Input
                            label="Room Number"
                            placeholder="Room 204"
                            value={sectionForm.roomNumber}
                            onChange={(value) =>
                                setSectionForm({
                                    ...sectionForm,
                                    roomNumber: value,
                                })
                            }
                        />

                        <Input
                            label="Student Capacity"
                            type="number"
                            value={String(sectionForm.capacity)}
                            onChange={(value) =>
                                setSectionForm({
                                    ...sectionForm,
                                    capacity: Number(value),
                                })
                            }
                        />

                        <ModalButtons
                            loading={saving}
                            onCancel={() => {
                                setShowSectionModal(false);
                                setErrorMsg("");
                            }}
                            onSave={handleCreateSection}
                            text="Create Section"
                        />

                    </div>

                </Modal>
            )}

            {showEditYearModal && (
                <Modal title="Edit Academic Year" onClose={() => {
                    setShowEditYearModal(false);
                    setErrorMsg("");
                }}>
                    <div className="space-y-4">
                        {errorMsg && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                {errorMsg}
                            </div>
                        )}
                        <Input label="Academic Year" placeholder="2026-27"
                            value={editYearForm.name}
                            onChange={(value) => setEditYearForm((p) => ({ ...p, name: value }))} />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Start Date" type="date"
                                value={editYearForm.startDate}
                                onChange={(value) => setEditYearForm((p) => ({ ...p, startDate: value }))} />
                            <Input label="End Date" type="date"
                                value={editYearForm.endDate}
                                onChange={(value) => setEditYearForm((p) => ({ ...p, endDate: value }))} />
                        </div>
                        <ModalButtons loading={saving}
                            onCancel={() => { setShowEditYearModal(false); setErrorMsg(""); }}
                            onSave={handleEditAcademicYear} text="Update Academic Year" />
                    </div>
                </Modal>
            )}

            {showEditClassModal && (
                <Modal title="Edit Class" onClose={() => {
                    setShowEditClassModal(false);
                    setErrorMsg("");
                }}>
                    <div className="space-y-4">
                        {errorMsg && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                {errorMsg}
                            </div>
                        )}
                        <Input label="Class Name" placeholder="Class 10"
                            value={editClassForm.name}
                            onChange={(value) => setEditClassForm((p) => ({ ...p, name: value }))} />
                        <Input label="Display Order" type="number"
                            value={String(editClassForm.displayOrder)}
                            onChange={(value) => setEditClassForm((p) => ({ ...p, displayOrder: Number(value) }))} />
                        <ModalButtons loading={saving}
                            onCancel={() => { setShowEditClassModal(false); setErrorMsg(""); }}
                            onSave={handleEditClass} text="Update Class" />
                    </div>
                </Modal>
            )}

            {showEditSectionModal && (
                <Modal title="Edit Section" onClose={() => {
                    setShowEditSectionModal(false);
                    setErrorMsg("");
                }}>
                    <div className="space-y-4">
                        {errorMsg && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                {errorMsg}
                            </div>
                        )}
                        <Input label="Section" placeholder="A"
                            value={editSectionForm.name}
                            onChange={(value) => setEditSectionForm((p) => ({ ...p, name: value }))} />
                        <Input label="Room Number" placeholder="Room 204"
                            value={editSectionForm.roomNumber}
                            onChange={(value) => setEditSectionForm((p) => ({ ...p, roomNumber: value }))} />
                        <Input label="Student Capacity" type="number"
                            value={String(editSectionForm.capacity)}
                            onChange={(value) => setEditSectionForm((p) => ({ ...p, capacity: Number(value) }))} />
                        <ModalButtons loading={saving}
                            onCancel={() => { setShowEditSectionModal(false); setErrorMsg(""); }}
                            onSave={handleEditSection} text="Update Section" />
                    </div>
                </Modal>
            )}

            {showTeacherModal && selectedSection && (
                <Modal
                    title="Assign Class Teacher"
                    onClose={() => { setShowTeacherModal(false); setErrorMsg(""); }}
                >

                    <div className="space-y-4">

                        {errorMsg && (
                            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
                                {errorMsg}
                            </div>
                        )}

                        <div className="
                            rounded-xl
                            bg-slate-50
                            p-4
                            dark:bg-slate-800
                        ">

                            <p className="text-xs text-slate-500">
                                Section
                            </p>

                            <p className="font-semibold">
                                Section {selectedSection.name}
                            </p>

                        </div>

                        <div>

                            <label className="mb-2 block text-sm font-medium">
                                Select Teacher
                            </label>

                            <select
                                value={selectedTeacherId}
                                onChange={(e) =>
                                    setSelectedTeacherId(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : ""
                                    )
                                }
                                className="
                                w-full
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-4
                                py-3
                                outline-none
                                dark:border-slate-700
                                dark:bg-slate-800
                                "
                            >

                                <option value="">
                                    Select teacher
                                </option>

                                {teachers.map((teacher) => (
                                    <option
                                        key={teacher.id}
                                        value={teacher.id}
                                    >
                                        {teacher.name}
                                        {teacher.subject
                                            ? ` — ${teacher.subject}`
                                            : ""}
                                    </option>
                                ))}

                            </select>

                        </div>

                        <ModalButtons
                            loading={saving}
                            onCancel={() => {
                                setShowTeacherModal(false);
                                setErrorMsg("");
                            }}
                            onSave={handleAssignTeacher}
                            text="Assign Teacher"
                        />

                    </div>

                </Modal>
            )}

        </div>
    );
}

/* =========================================================
   CLASS CARD
========================================================= */

function ClassCard({
    schoolClass,
    onAddSection,
    onAssignTeacher,
    onDelete,
    onDeleteSection,
    onEdit,
    onView,
    onEditSection,
    onViewSection,
}: {
    schoolClass: SchoolClass;
    onAddSection: () => void;
    onAssignTeacher: (section: Section) => void;
    onDelete: () => void;
    onDeleteSection: (sectionId: number) => void;
    onEdit: (schoolClass: SchoolClass) => void;
    onView: (schoolClass: SchoolClass) => void;
    onEditSection: (section: Section) => void;
    onViewSection: (section: Section) => void;
}) {
    const totalStudents = schoolClass.sections.reduce(
        (sum, section) => sum + section.studentCount,
        0
    );

    return (
        <div
            className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            "
        >

            {/* CLASS HEADER */}

            <div
                className="
                flex
                flex-col
                gap-4
                border-b
                border-slate-200
                p-5
                md:flex-row
                md:items-center
                md:justify-between
                dark:border-slate-800
                "
            >

                <div className="flex items-center gap-4">

                    <div
                        className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-50
                        text-primary
                        dark:bg-blue-950
                        "
                    >
                        <GraduationCap size={25} />
                    </div>

                    <div>

                        <h2 className="text-lg font-bold">
                            {schoolClass.name}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {schoolClass.sections.length} sections
                            {" • "}
                            {totalStudents} students
                        </p>

                    </div>

                </div>

                <div className="flex items-center gap-2">

                    <button
                        onClick={onAddSection}
                        className="
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-slate-200
                        px-3
                        py-2
                        text-sm
                        font-medium
                        hover:bg-slate-50
                        dark:border-slate-700
                        dark:hover:bg-slate-800
                        "
                    >
                        <Plus size={16} />
                        Section
                    </button>

                    <button
                        onClick={() => onEdit(schoolClass)}
                        title="Edit class"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-800"
                    >
                        <Pencil size={17} />
                    </button>

                    <button
                        onClick={() => onView(schoolClass)}
                        title="View class"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-800"
                    >
                        <Eye size={17} />
                    </button>

                    <button
                        onClick={onDelete}
                        className="
                        rounded-lg
                        p-2
                        text-slate-400
                        hover:bg-red-50
                        hover:text-red-600
                        "
                    >
                        <Trash2 size={17} />
                    </button>

                </div>

            </div>

            {/* SECTIONS */}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">

                {schoolClass.sections.length === 0 ? (

                    <div className="p-6 text-center">

                        <p className="text-sm text-slate-500">
                            No sections configured.
                        </p>

                        <button
                            onClick={onAddSection}
                            className="mt-3 text-sm font-semibold text-primary"
                        >
                            + Add first section
                        </button>

                    </div>

                ) : (

                    schoolClass.sections.map((section) => (

                        <div
                            key={section.id}
                            className="
                            flex
                            flex-col
                            gap-4
                            p-5
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                            "
                        >

                            <div className="flex items-center gap-4">

                                <div
                                    className="
                                    flex
                                    h-10
                                    w-10
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-slate-100
                                    font-semibold
                                    dark:bg-slate-800
                                    "
                                >
                                    {section.name}
                                </div>

                                <div>

                                    <p className="font-semibold">
                                        Section {section.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {section.roomNumber
                                            ? `${section.roomNumber} • `
                                            : ""}
                                        Capacity {section.capacity}
                                    </p>

                                </div>

                            </div>

                            <div className="flex flex-wrap items-center gap-5">

                                <div className="flex items-center gap-2">

                                    <Users
                                        size={17}
                                        className="text-slate-400"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            {section.studentCount}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Students
                                        </p>
                                    </div>

                                </div>

                                <div className="flex items-center gap-2">

                                    <UserPlus
                                        size={17}
                                        className="text-slate-400"
                                    />

                                    <div>

                                        <p className="text-sm font-semibold">
                                            {section.classTeacher?.name ??
                                                "Not Assigned"}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Class Teacher
                                        </p>

                                    </div>

                                </div>

                                <button
                                    onClick={() =>
                                        onAssignTeacher(section)
                                    }
                                    className="
                                    rounded-lg
                                    border
                                    border-slate-200
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    hover:bg-slate-50
                                    dark:border-slate-700
                                    dark:hover:bg-slate-800
                                    "
                                >
                                    {section.classTeacher
                                        ? "Change"
                                        : "Assign"}
                                </button>
                                <button
                                    onClick={() => onEditSection(section)}
                                    title="Edit section"
                                    className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-primary dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    onClick={() => onViewSection(section)}
                                    title="View section"
                                    className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-primary dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    <Eye size={16} />
                                </button>


                                <button
                                    onClick={() => onDeleteSection(section.id)}
                                    className="
                                    rounded-lg
                                    p-2
                                    text-slate-400
                                    hover:bg-red-50
                                    hover:text-red-600
                                    "
                                >
                                    <Trash2 size={17} />
                                </button>

                            </div>

                        </div>

                    ))

                )}

            </div>

        </div>
    );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
    icon,
    title,
    value,
}: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
}) {
    return (
        <div
            className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            "
        >

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                        {value}
                    </p>

                </div>

                <div
                    className="
                    rounded-xl
                    bg-blue-50
                    p-3
                    text-primary
                    dark:bg-blue-950
                    "
                >
                    {icon}
                </div>

            </div>

        </div>
    );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
    title,
    children,
    onClose,
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

            <div
                className="
                w-full
                max-w-lg
                rounded-2xl
                bg-white
                p-6
                shadow-2xl
                dark:bg-slate-900
                "
            >

                <div className="mb-6 flex items-center justify-between">

                    <h2 className="text-xl font-bold">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="
                        rounded-lg
                        p-2
                        hover:bg-slate-100
                        dark:hover:bg-slate-800
                        "
                    >
                        <X size={19} />
                    </button>

                </div>

                {children}

            </div>

        </div>
    );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>

            <label className="mb-2 block text-sm font-medium">
                {label}
            </label>

            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                outline-none
                focus:border-primary
                dark:border-slate-700
                dark:bg-slate-800
                "
            />

        </div>
    );
}

/* =========================================================
   MODAL BUTTONS
========================================================= */

function ModalButtons({
    loading,
    onCancel,
    onSave,
    text,
}: {
    loading: boolean;
    onCancel: () => void;
    onSave: () => void;
    text: string;
}) {
    return (
        <div className="flex justify-end gap-3 pt-3">

            <button
                onClick={onCancel}
                className="
                rounded-xl
                border
                border-slate-200
                px-4
                py-2.5
                text-sm
                font-medium
                dark:border-slate-700
                "
            >
                Cancel
            </button>

            <button
                onClick={onSave}
                disabled={loading}
                className="
                rounded-xl
                bg-primary
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                disabled:opacity-50
                "
            >
                {loading ? "Saving..." : text}
            </button>

        </div>
    );
}