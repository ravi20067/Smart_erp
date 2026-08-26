import { useEffect, useMemo, useState } from "react";
import {
    MessageCircle,
    X,
    Plus,
    Search,
    Pencil,
    Trash2,
    Users,
    BookOpen,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Copy,
} from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";

import {
    getAcademicYears,
    getSubjects,
    getTeachers,
    createSubject,
    updateSubject,
    deleteSubject,
    type AcademicYear,
    type Subject,
    type Teacher,
    copyCurrentYearStructure,
} from "@/services/admin/subjectService";

// ============================================================
// COMPONENT
// ============================================================

export default function Cources() {

    // ----------------------------------------------------------
    // CHAT
    // ----------------------------------------------------------

    const [chatOpen, setChatOpen] = useState(false);

    // ----------------------------------------------------------
    // ACADEMIC YEAR
    // ----------------------------------------------------------

    const [academicYears, setAcademicYears] =
        useState<AcademicYear[]>([]);

    const [selectedAcademicYearId, setSelectedAcademicYearId] =
        useState<number | null>(null);

    const [loadingAcademicYears, setLoadingAcademicYears] =
        useState(true);

    // ----------------------------------------------------------
    // DATA
    // ----------------------------------------------------------

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    // ----------------------------------------------------------
    // LOADING / ERROR
    // ----------------------------------------------------------

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] =
        useState<number | null>(null);

    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [copyingStructure, setCopyingStructure] =
        useState(false);

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    const [search, setSearch] = useState("");

    // ----------------------------------------------------------
    // MODAL
    // ----------------------------------------------------------

    const [modalOpen, setModalOpen] = useState(false);

    const [editingSubject, setEditingSubject] =
        useState<Subject | null>(null);

    // ----------------------------------------------------------
    // FORM
    // ----------------------------------------------------------

    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");

    const [selectedTeacherIds, setSelectedTeacherIds] =
        useState<number[]>([]);

    const [teacherSearch, setTeacherSearch] = useState("");

    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {
        loadAcademicYears();
    }, []);

    // ==========================================================
    // LOAD ACADEMIC YEARS
    // ==========================================================

    async function loadAcademicYears() {
        try {
            setLoadingAcademicYears(true);
            setErrorMsg("");

            const data = await getAcademicYears();

            setAcademicYears(data);

            // --------------------------------------------------
            // FIND CURRENT ACADEMIC YEAR
            // --------------------------------------------------

            const currentYear = data.find(
                (year) => year.current
            );

            if (!currentYear) {
                setErrorMsg(
                    "No current academic year has been configured."
                );
                setSelectedAcademicYearId(null);
                setLoading(true);
                return;
            }

            setSelectedAcademicYearId(
                currentYear.id
            );

            // Subjects and teachers are loaded by the
            // selected academic year effect below.

        } catch (error: any) {
            setErrorMsg(
                error?.message ||
                "Unable to load academic years."
            );
        } finally {
            setLoadingAcademicYears(false);
        }
    }

    // ==========================================================
    // LOAD SUBJECTS + TEACHERS WHEN ACADEMIC YEAR CHANGES
    // ==========================================================

    useEffect(() => {

        if (!selectedAcademicYearId) {
            setSubjects([]);
            setTeachers([]);
            setLoading(false);
            return;
        }

        loadAcademicYearData(
            selectedAcademicYearId
        );

    }, [selectedAcademicYearId]);

    // ==========================================================
    // COPY CURRENT YEAR STRUCTURE
    // ==========================================================

    async function handleCopyCurrentYearStructure() {
        if (!selectedAcademicYear) {
            setErrorMsg(
                "Please select an academic year first."
            );
            return;
        }

        // Current academic year must NOT be a target
        if (selectedAcademicYear.current) {
            setErrorMsg(
                "The current academic year cannot be used as a target."
            );
            return;
        }

        const confirmed = window.confirm(
            `Copy the current academic year structure into "${selectedAcademicYear.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setCopyingStructure(true);
            setErrorMsg("");
            setSuccessMsg("");

            await copyCurrentYearStructure(
                selectedAcademicYear.id
            );

            // IMPORTANT:
            // Reload subjects + teachers after successful copy
            await loadAcademicYearData(
                selectedAcademicYear.id
            );

            setSuccessMsg(
                `Current academic year structure copied successfully to ${selectedAcademicYear.name}.`
            );

        } catch (error: any) {
            setErrorMsg(
                error?.message ||
                "Unable to copy current academic year structure."
            );
        } finally {
            setCopyingStructure(false);
        }
    }

    // ==========================================================
    // LOAD DATA FOR SELECTED ACADEMIC YEAR
    // ==========================================================

    async function loadAcademicYearData(
        academicYearId: number
    ) {
        try {
            setLoading(true);
            setErrorMsg("");
            setSearch("");

            const [
                subjectData,
                teacherData,
            ] = await Promise.all([
                getSubjects(academicYearId),
                getTeachers(academicYearId),
            ]);

            setSubjects(subjectData);
            setTeachers(teacherData);

        } catch (error: any) {
            setSubjects([]);
            setTeachers([]);

            setErrorMsg(
                error?.message ||
                "Unable to load subjects and teachers."
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================================
    // SELECTED ACADEMIC YEAR
    // ==========================================================

    const selectedAcademicYear = useMemo(() => {
        return academicYears.find(
            (year) =>
                year.id === selectedAcademicYearId
        );
    }, [
        academicYears,
        selectedAcademicYearId,
    ]);

    // ==========================================================
    // SEARCHED SUBJECTS
    // ==========================================================

    const filteredSubjects = useMemo(() => {

        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return subjects;
        }

        return subjects.filter((subject) => {

            const teacherNames =
                subject.teachers
                    ?.map(
                        (teacher) =>
                            teacher.name
                    )
                    .join(" ")
                    .toLowerCase();

            return (
                subject.subjectName
                    ?.toLowerCase()
                    .includes(query) ||

                subject.subjectCode
                    ?.toLowerCase()
                    .includes(query) ||

                teacherNames?.includes(query)
            );
        });

    }, [subjects, search]);

    // ==========================================================
    // FILTER TEACHERS
    // ==========================================================

    const filteredTeachers = useMemo(() => {

        const query = teacherSearch
            .trim()
            .toLowerCase();

        if (!query) {
            return teachers;
        }

        return teachers.filter(
            (teacher) =>
                teacher.name
                    .toLowerCase()
                    .includes(query)
        );

    }, [teachers, teacherSearch]);

    // ==========================================================
    // OPEN ADD MODAL
    // ==========================================================

    function openAddModal() {

        if (!selectedAcademicYearId) {
            setErrorMsg(
                "Please select an academic year first."
            );
            return;
        }

        setEditingSubject(null);

        setSubjectName("");
        setSubjectCode("");
        setSelectedTeacherIds([]);

        setTeacherSearch("");

        setErrorMsg("");
        setSuccessMsg("");

        setModalOpen(true);
    }

    // ==========================================================
    // OPEN EDIT MODAL
    // ==========================================================

    function openEditModal(
        subject: Subject
    ) {

        setEditingSubject(subject);

        setSubjectName(
            subject.subjectName || ""
        );

        setSubjectCode(
            subject.subjectCode || ""
        );

        setSelectedTeacherIds(
            subject.teachers?.map(
                (teacher) =>
                    teacher.id
            ) || []
        );

        setTeacherSearch("");

        setErrorMsg("");
        setSuccessMsg("");

        setModalOpen(true);
    }

    // ==========================================================
    // CLOSE MODAL
    // ==========================================================

    function closeModal() {

        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingSubject(null);

        setSubjectName("");
        setSubjectCode("");
        setSelectedTeacherIds([]);
        setTeacherSearch("");
    }

    // ==========================================================
    // TEACHER SELECT
    // ==========================================================

    function toggleTeacher(
        teacherId: number
    ) {

        setSelectedTeacherIds(
            (current) => {

                if (
                    current.includes(
                        teacherId
                    )
                ) {
                    return current.filter(
                        (id) =>
                            id !== teacherId
                    );
                }

                return [
                    ...current,
                    teacherId,
                ];
            }
        );
    }

    // ==========================================================
    // VALIDATION
    // ==========================================================

    function validateForm(): string | null {

        if (!selectedAcademicYearId) {
            return "Academic year is required.";
        }

        if (!subjectName.trim()) {
            return "Subject name is required.";
        }

        if (!subjectCode.trim()) {
            return "Subject code is required.";
        }

        if (subjectName.trim().length < 2) {
            return (
                "Subject name must contain at least 2 characters."
            );
        }

        if (subjectCode.trim().length < 2) {
            return (
                "Subject code must contain at least 2 characters."
            );
        }

        return null;
    }

    // ==========================================================
    // SAVE SUBJECT
    // ==========================================================

    async function handleSaveSubject() {

        const validationError =
            validateForm();

        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        if (!selectedAcademicYearId) {
            return;
        }

        try {

            setSaving(true);
            setErrorMsg("");
            setSuccessMsg("");

            const payload = {
                academicYearId:
                    selectedAcademicYearId,

                subjectName:
                    subjectName.trim(),

                subjectCode:
                    subjectCode
                        .trim()
                        .toUpperCase(),

                teacherIds:
                    selectedTeacherIds,
            };

            // --------------------------------------------------
            // UPDATE
            // --------------------------------------------------

            if (editingSubject) {

                const updated =
                    await updateSubject(
                        editingSubject.id,
                        payload
                    );

                setSubjects(
                    (current) =>
                        current.map(
                            (subject) =>
                                subject.id ===
                                    updated.id
                                    ? updated
                                    : subject
                        )
                );

                setSuccessMsg(
                    "Subject updated successfully."
                );

            }

            // --------------------------------------------------
            // CREATE
            // --------------------------------------------------

            else {

                const created =
                    await createSubject(
                        payload
                    );

                setSubjects(
                    (current) => [
                        created,
                        ...current,
                    ]
                );

                setSuccessMsg(
                    "Subject created successfully."
                );
            }

            setModalOpen(false);

            setSubjectName("");
            setSubjectCode("");
            setSelectedTeacherIds([]);
            setEditingSubject(null);

        } catch (error: any) {

            setErrorMsg(
                error?.message ||
                "Unable to save subject."
            );

        } finally {

            setSaving(false);
        }
    }

    // ==========================================================
    // DELETE SUBJECT
    // ==========================================================

    async function handleDeleteSubject(
        subject: Subject
    ) {

        if (!selectedAcademicYearId) {
            setErrorMsg(
                "Academic year is required."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${subject.subjectName}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingId(subject.id);
            setErrorMsg("");
            setSuccessMsg("");

            await deleteSubject(
                subject.id,
                selectedAcademicYearId
            );

            setSubjects(
                (current) =>
                    current.filter(
                        (item) =>
                            item.id !==
                            subject.id
                    )
            );

            setSuccessMsg(
                `${subject.subjectName} deleted successfully.`
            );

        } catch (error: any) {

            setErrorMsg(
                error?.message ||
                "Unable to delete subject."
            );

        } finally {

            setDeletingId(null);
        }
    }

    // ==========================================================
    // CHANGE ACADEMIC YEAR
    // ==========================================================

    function handleAcademicYearChange(
        value: string
    ) {

        const id = Number(value);

        if (!id) {
            return;
        }

        setSuccessMsg("");
        setErrorMsg("");
        setSelectedAcademicYearId(id);
    }

    // ==========================================================
    // UI
    // ==========================================================

    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            <Header />

            <div className="flex h-[calc(100vh-80px)]">

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside
                    className="
                        hidden lg:block
                        w-72
                        shrink-0
                        overflow-y-auto
                        border-r
                        border-slate-200
                        bg-white
                        dark:border-slate-800
                        dark:bg-slate-900
                    "
                >
                    <Sidebar />
                </aside>

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <main
                    className="
                        flex-1
                        overflow-y-auto
                        p-4
                        md:p-6
                    "
                >

                    {/* =================================================
                        PAGE HEADER
                    ================================================= */}

                    <div
                        className="
                            mb-6
                            flex
                            flex-col
                            gap-4
                            xl:flex-row
                            xl:items-center
                            xl:justify-between
                        "
                    >

                        <div>

                            <div className="flex items-center gap-3">

                                <div
                                    className="
                                        flex
                                        h-11
                                        w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-primary/10
                                        text-primary
                                    "
                                >
                                    <BookOpen size={23} />
                                </div>

                                <div>

                                    <h1
                                        className="
                                            text-2xl
                                            font-bold
                                            text-slate-900
                                            dark:text-white
                                        "
                                    >
                                        Subjects
                                    </h1>

                                    <p
                                        className="
                                            text-sm
                                            text-slate-500
                                            dark:text-slate-400
                                        "
                                    >
                                        Manage subjects and
                                        assign teachers.
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* =================================================
                            ACADEMIC YEAR + ADD
                        ================================================= */}

                        <div
                            className="
                                flex
                                flex-col
                                gap-3
                                sm:flex-row
                            "
                        >

                            {/* ACADEMIC YEAR */}

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    px-3
                                    dark:border-slate-700
                                    dark:bg-slate-900
                                "
                            >

                                <span
                                    className="
                                        whitespace-nowrap
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                        dark:text-slate-400
                                    "
                                >
                                    Academic Year
                                </span>

                                <select
                                    value={
                                        selectedAcademicYearId ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        handleAcademicYearChange(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        loadingAcademicYears
                                    }
                                    className="
                                        rounded-lg
                                        bg-transparent
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-slate-900
                                        outline-none
                                        dark:text-white
                                    "
                                >

                                    {loadingAcademicYears ? (
                                        <option value="">
                                            Loading...
                                        </option>
                                    ) : (
                                        academicYears.map(
                                            (year) => (
                                                <option
                                                    key={
                                                        year.id
                                                    }
                                                    value={
                                                        year.id
                                                    }
                                                >
                                                    {year.name}
                                                    {year.current
                                                        ? " (Current)"
                                                        : ""}
                                                </option>
                                            )
                                        )
                                    )}

                                </select>

                            </div>

                            {/* ADD SUBJECT */}

                            {/* ACTIONS */}

                            <div
                                className="
        flex
        flex-col
        gap-3
        sm:flex-row
    "
                            >
                                {/* COPY CURRENT YEAR STRUCTURE */}

                                {selectedAcademicYear &&
                                    !selectedAcademicYear.current && (
                                        <button
                                            onClick={
                                                handleCopyCurrentYearStructure
                                            }
                                            disabled={
                                                copyingStructure ||
                                                loadingAcademicYears ||
                                                loading
                                            }
                                            className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-primary/30
                    bg-primary/5
                    px-5
                    py-3
                    font-semibold
                    text-primary
                    shadow-sm
                    transition
                    hover:bg-primary/10
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                "
                                        >
                                            {copyingStructure ? (
                                                <>
                                                    <Loader2
                                                        size={18}
                                                        className="animate-spin"
                                                    />
                                                    Copying...
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={18} />
                                                    Copy Current Year Structure
                                                </>
                                            )}
                                        </button>
                                    )}

                                {/* ADD SUBJECT */}

                                <button
                                    onClick={openAddModal}
                                    disabled={
                                        !selectedAcademicYearId ||
                                        loadingAcademicYears
                                    }
                                    className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-primary
            px-5
            py-3
            font-semibold
            text-white
            shadow-sm
            transition
            hover:opacity-90
            disabled:cursor-not-allowed
            disabled:opacity-50
        "
                                >
                                    <Plus size={19} />
                                    Add Subject
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* =================================================
                        CURRENT ACADEMIC YEAR INDICATOR
                    ================================================= */}

                    {selectedAcademicYear && (
                        <div
                            className="
                                mb-5
                                flex
                                items-center
                                justify-between
                                rounded-xl
                                border
                                border-primary/20
                                bg-primary/5
                                px-4
                                py-3
                            "
                        >

                            <div>

                                <p
                                    className="
                                        text-xs
                                        font-medium
                                        text-slate-500
                                        dark:text-slate-400
                                    "
                                >
                                    Showing subjects for
                                </p>

                                <p
                                    className="
                                        text-sm
                                        font-bold
                                        text-primary
                                    "
                                >
                                    {selectedAcademicYear.name}
                                </p>

                            </div>

                            {selectedAcademicYear.current && (
                                <span
                                    className="
                                        rounded-full
                                        bg-green-100
                                        px-3
                                        py-1
                                        text-xs
                                        font-semibold
                                        text-green-700
                                        dark:bg-green-950
                                        dark:text-green-300
                                    "
                                >
                                    Current Academic Year
                                </span>
                            )}

                        </div>
                    )}

                    {/* =================================================
                        ALERTS
                    ================================================= */}

                    {errorMsg && (
                        <div
                            className="
                                mb-5
                                flex
                                items-start
                                gap-3
                                rounded-xl
                                border
                                border-red-200
                                bg-red-50
                                px-4
                                py-3
                                text-red-700
                                dark:border-red-900
                                dark:bg-red-950/40
                                dark:text-red-300
                            "
                        >

                            <AlertCircle
                                size={20}
                                className="mt-0.5 shrink-0"
                            />

                            <div className="flex-1 text-sm">
                                {errorMsg}
                            </div>

                            <button
                                onClick={() =>
                                    setErrorMsg("")
                                }
                            >
                                <X size={18} />
                            </button>

                        </div>
                    )}

                    {successMsg && (
                        <div
                            className="
                                mb-5
                                flex
                                items-start
                                gap-3
                                rounded-xl
                                border
                                border-green-200
                                bg-green-50
                                px-4
                                py-3
                                text-green-700
                                dark:border-green-900
                                dark:bg-green-950/40
                                dark:text-green-300
                            "
                        >

                            <CheckCircle2
                                size={20}
                                className="mt-0.5 shrink-0"
                            />

                            <div className="flex-1 text-sm">
                                {successMsg}
                            </div>

                            <button
                                onClick={() =>
                                    setSuccessMsg("")
                                }
                            >
                                <X size={18} />
                            </button>

                        </div>
                    )}

                    {/* =================================================
                        SEARCH
                    ================================================= */}

                    <div
                        className="
                            mb-5
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-4
                            dark:border-slate-800
                            dark:bg-slate-900
                        "
                    >

                        <div className="relative">

                            <Search
                                size={19}
                                className="
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search subjects by name, code or teacher..."
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    py-3
                                    pl-11
                                    pr-4
                                    text-sm
                                    outline-none
                                    transition
                                    focus:border-primary
                                    focus:ring-2
                                    focus:ring-primary/20
                                    dark:border-slate-700
                                    dark:bg-slate-950
                                    dark:text-white
                                "
                            />

                        </div>

                        <div
                            className="
                                mt-3
                                flex
                                items-center
                                justify-between
                                text-xs
                                text-slate-500
                            "
                        >

                            <span>
                                {filteredSubjects.length} subject
                                {filteredSubjects.length !== 1
                                    ? "s"
                                    : ""}{" "}
                                found
                            </span>

                            {search && (
                                <button
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="
                                        text-primary
                                        hover:underline
                                    "
                                >
                                    Clear search
                                </button>
                            )}

                        </div>

                    </div>

                    {/* =================================================
                        SUBJECT LIST
                    ================================================= */}

                    <div
                        className="
                            overflow-hidden
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            dark:border-slate-800
                            dark:bg-slate-900
                        "
                    >

                        {loading ||
                            loadingAcademicYears ? (

                            <div
                                className="
                                    flex
                                    min-h-[350px]
                                    flex-col
                                    items-center
                                    justify-center
                                    gap-3
                                    text-slate-500
                                "
                            >
                                <Loader2
                                    size={32}
                                    className="
                                        animate-spin
                                        text-primary
                                    "
                                />

                                <p className="text-sm">
                                    Loading subjects...
                                </p>

                            </div>

                        ) : filteredSubjects.length === 0 ? (

                            <div
                                className="
                                    flex
                                    min-h-[350px]
                                    flex-col
                                    items-center
                                    justify-center
                                    px-6
                                    text-center
                                "
                            >

                                <div
                                    className="
                                        mb-4
                                        flex
                                        h-14
                                        w-14
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-slate-100
                                        text-slate-400
                                        dark:bg-slate-800
                                    "
                                >
                                    <BookOpen size={25} />
                                </div>

                                <h3
                                    className="
                                        text-base
                                        font-semibold
                                        text-slate-800
                                        dark:text-white
                                    "
                                >
                                    No subjects found
                                </h3>

                                <p
                                    className="
                                        mt-1
                                        max-w-md
                                        text-sm
                                        text-slate-500
                                    "
                                >
                                    {search
                                        ? "Try changing your search."
                                        : `No subjects have been added for ${selectedAcademicYear?.name ||
                                        "this academic year"
                                        }.`}
                                </p>

                                {!search &&
                                    selectedAcademicYearId && (
                                        <button
                                            onClick={
                                                openAddModal
                                            }
                                            className="
                                                mt-5
                                                inline-flex
                                                items-center
                                                gap-2
                                                rounded-lg
                                                bg-primary
                                                px-4
                                                py-2.5
                                                text-sm
                                                font-semibold
                                                text-white
                                            "
                                        >
                                            <Plus size={17} />
                                            Add First Subject
                                        </button>
                                    )}

                            </div>

                        ) : (

                            <div className="overflow-x-auto">

                                <table
                                    className="
                                        w-full
                                        min-w-[850px]
                                    "
                                >

                                    <thead>

                                        <tr
                                            className="
                                                border-b
                                                border-slate-200
                                                bg-slate-50
                                                dark:border-slate-800
                                                dark:bg-slate-950
                                            "
                                        >

                                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Subject
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Code
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Assigned Teachers
                                            </th>

                                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {filteredSubjects.map(
                                            (subject) => (

                                                <tr
                                                    key={
                                                        subject.id
                                                    }
                                                    className="
                                                        border-b
                                                        border-slate-100
                                                        last:border-0
                                                        hover:bg-slate-50
                                                        dark:border-slate-800
                                                        dark:hover:bg-slate-800/50
                                                    "
                                                >

                                                    {/* SUBJECT */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div
                                                                className="
                                                                    flex
                                                                    h-10
                                                                    w-10
                                                                    shrink-0
                                                                    items-center
                                                                    justify-center
                                                                    rounded-lg
                                                                    bg-primary/10
                                                                    text-primary
                                                                "
                                                            >
                                                                <BookOpen
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            </div>

                                                            <div>

                                                                <p
                                                                    className="
                                                                        font-semibold
                                                                        text-slate-900
                                                                        dark:text-white
                                                                    "
                                                                >
                                                                    {
                                                                        subject.subjectName
                                                                    }
                                                                </p>

                                                                <p
                                                                    className="
                                                                        text-xs
                                                                        text-slate-500
                                                                    "
                                                                >
                                                                    ID:{" "}
                                                                    {
                                                                        subject.id
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* CODE */}

                                                    <td className="px-5 py-4">

                                                        <span
                                                            className="
                                                                inline-flex
                                                                rounded-lg
                                                                bg-slate-100
                                                                px-3
                                                                py-1.5
                                                                font-mono
                                                                text-xs
                                                                font-semibold
                                                                text-slate-700
                                                                dark:bg-slate-800
                                                                dark:text-slate-300
                                                            "
                                                        >
                                                            {
                                                                subject.subjectCode
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* TEACHERS */}

                                                    <td className="px-5 py-4">

                                                        {subject.teachers?.length ? (

                                                            <div className="flex flex-wrap gap-2">

                                                                {subject.teachers.map(
                                                                    (
                                                                        teacher
                                                                    ) => (

                                                                        <span
                                                                            key={
                                                                                teacher.id
                                                                            }
                                                                            className="
                                                                                inline-flex
                                                                                items-center
                                                                                gap-1.5
                                                                                rounded-lg
                                                                                border
                                                                                border-slate-200
                                                                                bg-white
                                                                                px-2.5
                                                                                py-1.5
                                                                                text-xs
                                                                                font-medium
                                                                                text-slate-700
                                                                                dark:border-slate-700
                                                                                dark:bg-slate-800
                                                                                dark:text-slate-300
                                                                            "
                                                                        >

                                                                            <Users
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />

                                                                            {
                                                                                teacher.name
                                                                            }

                                                                        </span>

                                                                    )
                                                                )}

                                                            </div>

                                                        ) : (

                                                            <span
                                                                className="
                                                                    text-xs
                                                                    text-slate-400
                                                                "
                                                            >
                                                                No teacher
                                                                assigned
                                                            </span>

                                                        )}

                                                    </td>

                                                    {/* ACTIONS */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex justify-end gap-2">

                                                            <button
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        subject
                                                                    )
                                                                }
                                                                className="
                                                                    inline-flex
                                                                    items-center
                                                                    gap-1.5
                                                                    rounded-lg
                                                                    border
                                                                    border-slate-200
                                                                    px-3
                                                                    py-2
                                                                    text-xs
                                                                    font-semibold
                                                                    text-slate-700
                                                                    transition
                                                                    hover:bg-slate-100
                                                                    dark:border-slate-700
                                                                    dark:text-slate-300
                                                                    dark:hover:bg-slate-800
                                                                "
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                                Edit
                                                            </button>

                                                            <button
                                                                disabled={
                                                                    deletingId ===
                                                                    subject.id
                                                                }
                                                                onClick={() =>
                                                                    handleDeleteSubject(
                                                                        subject
                                                                    )
                                                                }
                                                                className="
                                                                    inline-flex
                                                                    items-center
                                                                    gap-1.5
                                                                    rounded-lg
                                                                    border
                                                                    border-red-200
                                                                    px-3
                                                                    py-2
                                                                    text-xs
                                                                    font-semibold
                                                                    text-red-600
                                                                    transition
                                                                    hover:bg-red-50
                                                                    disabled:cursor-not-allowed
                                                                    disabled:opacity-50
                                                                    dark:border-red-900
                                                                    dark:text-red-400
                                                                    dark:hover:bg-red-950/30
                                                                "
                                                            >

                                                                {deletingId ===
                                                                    subject.id ? (
                                                                    <Loader2
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="
                                                                            animate-spin
                                                                        "
                                                                    />
                                                                ) : (
                                                                    <Trash2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                )}

                                                                Delete

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </main>

            </div>

            {/* =====================================================
                ADD / EDIT SUBJECT MODAL
            ===================================================== */}

            {modalOpen && (
                <>

                    <div
                        className="
                            fixed
                            inset-0
                            z-[60]
                            bg-black/50
                            backdrop-blur-sm
                        "
                        onClick={closeModal}
                    />

                    <div
                        className="
                            fixed
                            inset-0
                            z-[70]
                            flex
                            items-center
                            justify-center
                            p-4
                            pointer-events-none
                        "
                    >

                        <div
                            className="
                                pointer-events-auto
                                flex
                                max-h-[90vh]
                                w-full
                                max-w-2xl
                                flex-col
                                overflow-hidden
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                shadow-2xl
                                dark:border-slate-700
                                dark:bg-slate-900
                            "
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            {/* MODAL HEADER */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    border-b
                                    border-slate-200
                                    px-6
                                    py-5
                                    dark:border-slate-800
                                "
                            >

                                <div>

                                    <h2
                                        className="
                                            text-lg
                                            font-bold
                                            text-slate-900
                                            dark:text-white
                                        "
                                    >
                                        {editingSubject
                                            ? "Edit Subject"
                                            : "Add Subject"}
                                    </h2>

                                    <p
                                        className="
                                            mt-1
                                            text-xs
                                            text-slate-500
                                        "
                                    >
                                        Academic Year:{" "}
                                        <span className="font-semibold text-primary">
                                            {
                                                selectedAcademicYear?.name
                                            }
                                        </span>
                                    </p>

                                </div>

                                <button
                                    onClick={closeModal}
                                    className="
                                        rounded-lg
                                        p-2
                                        text-slate-500
                                        hover:bg-slate-100
                                        dark:hover:bg-slate-800
                                    "
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            {/* MODAL BODY */}

                            <div className="overflow-y-auto p-6">

                                {errorMsg && (
                                    <div
                                        className="
                                            mb-5
                                            flex
                                            gap-3
                                            rounded-xl
                                            border
                                            border-red-200
                                            bg-red-50
                                            p-3
                                            text-sm
                                            text-red-700
                                            dark:border-red-900
                                            dark:bg-red-950/30
                                            dark:text-red-300
                                        "
                                    >
                                        <AlertCircle
                                            size={18}
                                            className="shrink-0"
                                        />

                                        <span>
                                            {errorMsg}
                                        </span>
                                    </div>
                                )}

                                {/* ACADEMIC YEAR */}

                                <div className="mb-5">

                                    <label
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                            dark:text-slate-300
                                        "
                                    >
                                        Academic Year
                                    </label>

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-100
                                            px-4
                                            py-3
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                            dark:border-slate-700
                                            dark:bg-slate-800
                                            dark:text-slate-300
                                        "
                                    >
                                        {
                                            selectedAcademicYear?.name
                                        }

                                        {selectedAcademicYear?.current && (
                                            <span
                                                className="
                                                    ml-2
                                                    text-xs
                                                    font-medium
                                                    text-green-600
                                                    dark:text-green-400
                                                "
                                            >
                                                Current
                                            </span>
                                        )}
                                    </div>

                                </div>

                                {/* SUBJECT NAME */}

                                <div className="mb-5">

                                    <label
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                            dark:text-slate-300
                                        "
                                    >
                                        Subject Name
                                    </label>

                                    <input
                                        value={subjectName}
                                        onChange={(e) =>
                                            setSubjectName(
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Mathematics"
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-4
                                            py-3
                                            text-sm
                                            outline-none
                                            focus:border-primary
                                            focus:ring-2
                                            focus:ring-primary/20
                                            dark:border-slate-700
                                            dark:bg-slate-950
                                            dark:text-white
                                        "
                                    />

                                </div>

                                {/* SUBJECT CODE */}

                                <div className="mb-6">

                                    <label
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                            dark:text-slate-300
                                        "
                                    >
                                        Subject Code
                                    </label>

                                    <input
                                        value={subjectCode}
                                        onChange={(e) =>
                                            setSubjectCode(
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. MATH101"
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-4
                                            py-3
                                            font-mono
                                            text-sm
                                            uppercase
                                            outline-none
                                            focus:border-primary
                                            focus:ring-2
                                            focus:ring-primary/20
                                            dark:border-slate-700
                                            dark:bg-slate-950
                                            dark:text-white
                                        "
                                    />

                                </div>

                                {/* TEACHERS */}

                                <div>

                                    <div
                                        className="
                                            mb-3
                                            flex
                                            items-center
                                            justify-between
                                        "
                                    >

                                        <div>

                                            <label
                                                className="
                                                    block
                                                    text-sm
                                                    font-semibold
                                                    text-slate-700
                                                    dark:text-slate-300
                                                "
                                            >
                                                Assign Teachers
                                            </label>

                                            <p
                                                className="
                                                    mt-1
                                                    text-xs
                                                    text-slate-500
                                                "
                                            >
                                                Select one or more
                                                teachers for this
                                                subject.
                                            </p>

                                        </div>

                                        <span
                                            className="
                                                rounded-full
                                                bg-primary/10
                                                px-2.5
                                                py-1
                                                text-xs
                                                font-semibold
                                                text-primary
                                            "
                                        >
                                            {
                                                selectedTeacherIds.length
                                            }{" "}
                                            selected
                                        </span>

                                    </div>

                                    {/* TEACHER SEARCH */}

                                    <div
                                        className="
                                            relative
                                            mb-3
                                        "
                                    >

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
                                            value={
                                                teacherSearch
                                            }
                                            onChange={(e) =>
                                                setTeacherSearch(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Search teachers..."
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                py-2.5
                                                pl-9
                                                pr-3
                                                text-sm
                                                outline-none
                                                focus:border-primary
                                                dark:border-slate-700
                                                dark:bg-slate-950
                                                dark:text-white
                                            "
                                        />

                                    </div>

                                    {/* TEACHER LIST */}

                                    <div
                                        className="
                                            max-h-56
                                            overflow-y-auto
                                            rounded-xl
                                            border
                                            border-slate-200
                                            dark:border-slate-700
                                        "
                                    >

                                        {filteredTeachers.length ===
                                            0 ? (

                                            <div
                                                className="
                                                    p-6
                                                    text-center
                                                    text-sm
                                                    text-slate-500
                                                "
                                            >
                                                No teachers found.
                                            </div>

                                        ) : (

                                            filteredTeachers.map(
                                                (teacher) => {

                                                    const selected =
                                                        selectedTeacherIds.includes(
                                                            teacher.id
                                                        );

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={
                                                                teacher.id
                                                            }
                                                            onClick={() =>
                                                                toggleTeacher(
                                                                    teacher.id
                                                                )
                                                            }
                                                            className={`
                                                                flex
                                                                w-full
                                                                items-center
                                                                gap-3
                                                                border-b
                                                                border-slate-100
                                                                px-4
                                                                py-3
                                                                text-left
                                                                transition
                                                                last:border-0
                                                                dark:border-slate-800
                                                                ${selected
                                                                    ? "bg-primary/10"
                                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                }
                                                            `}
                                                        >

                                                            <div
                                                                className={`
                                                                    flex
                                                                    h-5
                                                                    w-5
                                                                    shrink-0
                                                                    items-center
                                                                    justify-center
                                                                    rounded-md
                                                                    border
                                                                    ${selected
                                                                        ? "border-primary bg-primary text-white"
                                                                        : "border-slate-300 dark:border-slate-600"
                                                                    }
                                                                `}
                                                            >

                                                                {selected && (
                                                                    <CheckCircle2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                )}

                                                            </div>

                                                            <div
                                                                className="
                                                                    flex
                                                                    h-9
                                                                    w-9
                                                                    items-center
                                                                    justify-center
                                                                    rounded-full
                                                                    bg-slate-100
                                                                    text-slate-500
                                                                    dark:bg-slate-800
                                                                "
                                                            >
                                                                <Users
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="min-w-0">

                                                                <p
                                                                    className="
                                                                        truncate
                                                                        text-sm
                                                                        font-semibold
                                                                        text-slate-800
                                                                        dark:text-white
                                                                    "
                                                                >
                                                                    {
                                                                        teacher.name
                                                                    }
                                                                </p>

                                                                {teacher.subject && (
                                                                    <p
                                                                        className="
                                                                            truncate
                                                                            text-xs
                                                                            text-slate-500
                                                                        "
                                                                    >
                                                                        {
                                                                            teacher.subject
                                                                        }
                                                                    </p>
                                                                )}

                                                            </div>

                                                        </button>
                                                    );
                                                }
                                            )
                                        )}

                                    </div>

                                </div>

                            </div>

                            {/* MODAL FOOTER */}

                            <div
                                className="
                                    flex
                                    flex-col-reverse
                                    gap-3
                                    border-t
                                    border-slate-200
                                    bg-slate-50
                                    px-6
                                    py-4
                                    sm:flex-row
                                    sm:justify-end
                                    dark:border-slate-800
                                    dark:bg-slate-950
                                "
                            >

                                <button
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-5
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                        hover:bg-white
                                        disabled:opacity-50
                                        dark:border-slate-700
                                        dark:text-slate-300
                                        dark:hover:bg-slate-900
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={
                                        handleSaveSubject
                                    }
                                    disabled={saving}
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-primary
                                        px-5
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        hover:opacity-90
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                >

                                    {saving ? (
                                        <>
                                            <Loader2
                                                size={17}
                                                className="
                                                    animate-spin
                                                "
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingSubject ? (
                                                <Pencil
                                                    size={17}
                                                />
                                            ) : (
                                                <Plus
                                                    size={17}
                                                />
                                            )}

                                            {editingSubject
                                                ? "Update Subject"
                                                : "Create Subject"}
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </>
            )}

            {/* =====================================================
                FLOATING CHAT BUTTON
            ===================================================== */}

            <button
                onClick={() =>
                    setChatOpen(true)
                }
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
                <MessageCircle size={28} />
            </button>

            {/* =====================================================
                CHAT DRAWER
            ===================================================== */}

            {chatOpen && (
                <>

                    <div
                        className="
                            fixed
                            inset-0
                            z-40
                            bg-black/40
                        "
                        onClick={() =>
                            setChatOpen(false)
                        }
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
                            dark:border-slate-700
                            dark:bg-slate-900
                            sm:w-[420px]
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
                                onClick={() =>
                                    setChatOpen(false)
                                }
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

                        <div
                            className="
                                h-[calc(100%-72px)]
                            "
                        >
                            <Copilot />
                        </div>

                    </div>

                </>
            )}

        </div>
    );
}

