import { useEffect, useMemo, useState } from "react";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    RefreshCw,
    BookOpen,
    CalendarDays,
    Users,
    X,
    Save,
    Check,
    ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";
import { useToast } from "@/components/ui/use-toast";

import {
    getAcademicYears,
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getUnassignedSections,
    getSubjects,
    copyCourseStructure,
    type AcademicYear,
    type Course,
    type CoursePayload,
    type AvailableSection,
    type AvailableSubject,
} from "@/services/admin/courceService";


/* =========================================================
   TYPES
========================================================= */

type CourseForm = CoursePayload & {
    id?: number;
};


/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm = (yearId = 0): CourseForm => ({
    name: "",
    courseName: "",
    courseCode: "",
    academicYearId: yearId,
    assignedSectionIds: [],
    courseSubjects: [],
});


/* =========================================================
   MAIN PAGE
========================================================= */

export default function Courses() {

    const navigate = useNavigate();
    const { toast } = useToast();

    const [years, setYears] =
        useState<AcademicYear[]>([]);

    const [courses, setCourses] =
        useState<Course[]>([]);

    const [selectedYear, setSelectedYear] =
        useState<number | null>(null);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [copying, setCopying] =
        useState(false);

    const [errorMsg, setErrorMsg] =
        useState("");

    const [modal, setModal] =
        useState(false);

    /*
     * IMPORTANT:
     *
     * editing contains the complete original course.
     * CourseModal needs this so that existing assigned
     * sections can be displayed while editing.
     */
    const [editing, setEditing] =
        useState<Course | null>(null);

    const [form, setForm] =
        useState<CourseForm>(
            emptyForm()
        );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        loadInitial();
    }, []);


    /* =====================================================
       LOAD COURSES WHEN YEAR CHANGES
    ===================================================== */

    useEffect(() => {

        if (selectedYear !== null) {
            loadCourses(selectedYear);
        }

    }, [selectedYear]);


    /* =====================================================
       LOAD ACADEMIC YEARS
    ===================================================== */

    async function loadInitial() {

        try {

            setLoading(true);

            const data =
                await getAcademicYears();

            setYears(data);

            const current =
                data.find(y => y.current);

            setSelectedYear(
                current?.id ??
                data[0]?.id ??
                null
            );

        } catch (e) {

            handleError(
                e,
                "Failed to load academic years."
            );

        } finally {

            setLoading(false);
        }
    }


    /* =====================================================
       LOAD COURSES
    ===================================================== */

    async function loadCourses(
        yearId: number
    ) {

        try {

            setLoading(true);
            setErrorMsg("");

            const data =
                await getCourses(yearId);

            setCourses(data);

        } catch (e) {

            setCourses([]);

            handleError(
                e,
                "Failed to load courses."
            );

        } finally {

            setLoading(false);
        }
    }


    /* =====================================================
       ERROR HANDLER
    ===================================================== */

    function handleError(
        error: any,
        fallback: string
    ) {

        const data =
            error?.response?.data;

        const errors =
            Array.isArray(data?.errors)
                ? data.errors
                    .map(
                        (x: any) =>
                            x?.message || x
                    )
                    .join(", ")
                : "";

        const message =
            data?.message ||
            data?.error ||
            errors ||
            error?.message ||
            fallback;

        setErrorMsg(message);

        toast({
            variant: "destructive",
            title: "Error",
            description: message,
        });
    }


    /* =====================================================
       COPY COURSE STRUCTURE
    ===================================================== */

    async function copyStructureFromCurrentYear() {

        if (!selectedYear) {
            return;
        }

        const targetYear =
            years.find(
                y => y.id === selectedYear
            );

        const currentYear =
            years.find(
                y => y.current
            );

        if (!targetYear || !currentYear) {
            return;
        }

        if (targetYear.current) {

            toast({
                variant: "destructive",
                title: "Invalid Action",
                description:
                    "The current academic year cannot be copied into itself.",
            });

            return;
        }

        const confirmed =
            window.confirm(
                `Copy the complete course structure from "${currentYear.name}" to "${targetYear.name}"?\n\n` +
                `This will copy courses, assigned sections and course subjects.`
            );

        if (!confirmed) {
            return;
        }

        try {

            setCopying(true);
            setErrorMsg("");

            await copyCourseStructure(
                selectedYear
            );

            await loadCourses(
                selectedYear
            );

            toast({
                title: "Structure Copied",
                description:
                    `Course structure from ${currentYear.name} was copied successfully to ${targetYear.name}.`,
            });

        } catch (e) {

            handleError(
                e,
                "Failed to copy course structure."
            );

        } finally {

            setCopying(false);
        }
    }


    /* =====================================================
       FILTER COURSES
    ===================================================== */

    const filtered =
        useMemo(() => {

            const q =
                search
                    .trim()
                    .toLowerCase();

            if (!q) {
                return courses;
            }

            return courses.filter(c => {

                const name =
                    (
                        c.courseName ||
                        c.name ||
                        ""
                    ).toLowerCase();

                const code =
                    (
                        c.courseCode ||
                        ""
                    ).toLowerCase();

                const subjects =
                    c.courseSubjects?.some(
                        s =>
                            `${s.subject?.subjectName || ""} ${s.subject?.subjectCode || ""}`
                                .toLowerCase()
                                .includes(q)
                    );

                const sections =
                    c.assignedSections?.some(
                        s =>
                            `${s.className || ""} ${s.name || ""}`
                                .toLowerCase()
                                .includes(q)
                    );

                return (
                    name.includes(q) ||
                    code.includes(q) ||
                    subjects ||
                    sections
                );
            });

        }, [
            courses,
            search,
        ]);


    /* =====================================================
       OPEN ADD MODAL
    ===================================================== */

    function openAdd() {

        if (!selectedYear) {

            toast({
                variant: "destructive",
                title: "Academic Year Required",
                description:
                    "Select an academic year first.",
            });

            return;
        }

        setEditing(null);

        setForm(
            emptyForm(selectedYear)
        );

        setErrorMsg("");

        setModal(true);
    }


    /* =====================================================
       OPEN EDIT MODAL
    ===================================================== */

    function openEdit(
        course: Course
    ) {

        /*
         * IMPORTANT:
         *
         * Keep the original course object.
         * CourseModal will use:
         *
         * editing.assignedSections
         *
         * to display sections that are already
         * assigned to this course.
         */
        setEditing(course);

        setForm({

            id: course.id,

            name:
                course.courseName ||
                course.name ||
                "",

            courseName:
                course.courseName ||
                course.name ||
                "",

            courseCode:
                course.courseCode ||
                "",

            academicYearId:
                course.academicYear?.id ||
                selectedYear ||
                0,

            assignedSectionIds:
                course.assignedSections?.map(
                    s => s.id
                ) || [],

            courseSubjects:
                course.courseSubjects?.map(
                    s => ({
                        subjectId:
                            s.subject.id,

                        lecturesPerWeek:
                            s.lecturesPerWeek,

                        lectureDurationMinutes:
                            s.lectureDurationMinutes,

                        isPracticalSubject:
                            s.isPracticalSubject,
                    })
                ) || [],
        });

        setErrorMsg("");

        setModal(true);
    }


    /* =====================================================
       SAVE COURSE
    ===================================================== */

    async function save() {

        if (
            !form.courseName.trim() ||
            !form.courseCode.trim() ||
            !form.academicYearId
        ) {

            toast({
                variant: "destructive",
                title: "Validation Error",
                description:
                    "Course name, code and academic year are required.",
            });

            return;
        }

        const payload = {

            ...form,

            name:
                form.courseName.trim(),

            courseName:
                form.courseName.trim(),

            courseCode:
                form.courseCode.trim(),
        };

        try {

            setSaving(true);

            if (editing) {

                await updateCourse(
                    editing.id,
                    payload
                );

            } else {

                await createCourse(
                    payload
                );
            }

            await loadCourses(
                form.academicYearId
            );

            toast({
                title: "Success",
                description:
                    editing
                        ? "Course updated successfully."
                        : "Course created successfully.",
            });

            setModal(false);
            setEditing(null);

        } catch (e) {

            handleError(
                e,
                editing
                    ? "Failed to update course."
                    : "Failed to create course."
            );

        } finally {

            setSaving(false);
        }
    }


    /* =====================================================
       DELETE COURSE
    ===================================================== */

    async function remove(
        course: Course
    ) {

        const name =
            course.courseName ||
            course.name ||
            "this course";

        if (
            !window.confirm(
                `Are you sure you want to delete "${name}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {

            setSaving(true);

            await deleteCourse(
                course.id
            );

            setCourses(
                old =>
                    old.filter(
                        c =>
                            c.id !== course.id
                    )
            );

            toast({
                title: "Success",
                description:
                    "Course deleted successfully.",
            });

        } catch (e) {

            handleError(
                e,
                "Failed to delete course."
            );

        } finally {

            setSaving(false);
        }
    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    const subjects =
        courses.reduce(
            (n, c) =>
                n +
                (
                    c.courseSubjects?.length ||
                    0
                ),
            0
        );

    const sections =
        courses.reduce(
            (n, c) =>
                n +
                (
                    c.assignedSections?.length ||
                    0
                ),
            0
        );

    const currentYear =
        years.find(
            y => y.id === selectedYear
        );


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            <Header />

            <div className="flex h-[calc(100vh-80px)]">

                <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
                    <Sidebar />
                </aside>

                <main className="min-w-0 flex-1 overflow-y-auto">

                    <div className="mx-auto max-w-[1600px] p-4 md:p-6">

                        {/* =================================================
                            PAGE HEADER
                        ================================================= */}

                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                            <div>

                                <div className="flex items-center gap-3">

                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                                        Courses
                                    </h1>

                                    {currentYear?.current && (

                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            Current Year
                                        </span>

                                    )}

                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Manage courses, assigned sections and course subjects.
                                </p>

                            </div>


                            <div className="flex flex-wrap gap-2">

                                {selectedYear &&
                                    !currentYear?.current && (

                                        <button
                                            onClick={
                                                copyStructureFromCurrentYear
                                            }
                                            disabled={
                                                !selectedYear ||
                                                saving ||
                                                copying ||
                                                loading
                                            }
                                            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                                        >

                                            {copying ? (

                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />

                                            ) : (

                                                <BookOpen size={18} />

                                            )}

                                            {copying
                                                ? "Copying..."
                                                : "Copy Structure"}

                                        </button>

                                    )}


                                <button
                                    onClick={openAdd}
                                    disabled={
                                        !selectedYear ||
                                        saving ||
                                        copying
                                    }
                                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                >

                                    <Plus size={18} />

                                    Add Course

                                </button>


                                <button
                                    onClick={() =>
                                        selectedYear &&
                                        loadCourses(
                                            selectedYear
                                        )
                                    }
                                    disabled={
                                        !selectedYear ||
                                        loading ||
                                        copying
                                    }
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                >

                                    <RefreshCw
                                        size={17}
                                        className={
                                            loading
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />

                                    Refresh

                                </button>

                            </div>

                        </div>


                        {/* =================================================
                            FILTER
                        ================================================= */}

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                                <div className="flex flex-col gap-2 sm:flex-row">

                                    <div className="relative">

                                        <CalendarDays
                                            size={17}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <select
                                            value={
                                                selectedYear ?? ""
                                            }
                                            onChange={e =>
                                                setSelectedYear(
                                                    Number(
                                                        e.target.value
                                                    )
                                                )
                                            }
                                            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >

                                            {years.map(
                                                y => (

                                                    <option
                                                        key={y.id}
                                                        value={y.id}
                                                    >
                                                        {y.name}

                                                        {y.current
                                                            ? " — Current"
                                                            : ""}

                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>


                                    <div className="relative min-w-[280px]">

                                        <Search
                                            size={17}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            value={search}
                                            onChange={e =>
                                                setSearch(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Search course, code, subject or section..."
                                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />

                                        {search && (

                                            <button
                                                onClick={() =>
                                                    setSearch("")
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                <X size={16} />
                                            </button>

                                        )}

                                    </div>

                                </div>


                                <span className="text-sm text-slate-500">

                                    Showing{" "}

                                    <b className="text-slate-800 dark:text-white">
                                        {filtered.length}
                                    </b>

                                    {" "}of{" "}

                                    <b className="text-slate-800 dark:text-white">
                                        {courses.length}
                                    </b>

                                    {" "}courses

                                </span>

                            </div>

                        </div>


                        {/* =================================================
                            SUMMARY
                        ================================================= */}

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                            <Summary
                                title="Courses"
                                value={
                                    courses.length
                                }
                                icon={
                                    <BookOpen size={20} />
                                }
                            />

                            <Summary
                                title="Assigned Sections"
                                value={sections}
                                icon={
                                    <Users size={20} />
                                }
                            />

                            <Summary
                                title="Course Subjects"
                                value={subjects}
                                icon={
                                    <BookOpen size={20} />
                                }
                            />

                        </div>


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {errorMsg && !modal && (

                            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                {errorMsg}
                            </div>

                        )}


                        {/* =================================================
                            COURSE LIST
                        ================================================= */}

                        <div className="mt-6">

                            {loading ? (

                                <Loading />

                            ) : filtered.length === 0 ? (

                                <Empty
                                    search={search}
                                    add={openAdd}
                                />

                            ) : (

                                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                                    {filtered.map(
                                        c => (

                                            <Card
                                                key={c.id}
                                                course={c}
                                                view={() =>
                                                    navigate(
                                                        `/admin/courses/${c.id}`
                                                    )
                                                }
                                                edit={() =>
                                                    openEdit(c)
                                                }
                                                remove={() =>
                                                    remove(c)
                                                }
                                            />

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </main>

            </div>


            <Copilot />


            {/* =============================================================
                MODAL
            ============================================================= */}

            {modal && (

                <CourseModal

                    form={form}

                    setForm={setForm}

                    years={years}

                    /*
                     * IMPORTANT:
                     *
                     * Pass the complete course instead of
                     * just boolean editing.
                     */
                    editing={editing}

                    saving={saving}

                    error={errorMsg}

                    close={() =>
                        !saving &&
                        setModal(false)
                    }

                    save={save}

                />

            )}

        </div>
    );
}


/* =========================================================
   COURSE CARD
========================================================= */

function Card({
    course,
    view,
    edit,
    remove,
}: {
    course: Course;
    view: () => void;
    edit: () => void;
    remove: () => void;
}) {

    const name =
        course.courseName ||
        course.name ||
        "Unnamed Course";

    return (

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary dark:bg-blue-950">
                            <BookOpen size={22} />
                        </div>

                        <div className="min-w-0">

                            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                                {name}
                            </h2>

                            <div className="mt-1 flex gap-2">

                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold dark:bg-slate-800">
                                    {course.courseCode}
                                </span>

                                <span className="text-xs text-slate-500">
                                    ID: {course.id}
                                </span>

                            </div>

                        </div>

                    </div>


                    <div className="flex shrink-0">

                        <button
                            onClick={view}
                            title="View"
                            className="rounded-lg p-2 text-slate-400 hover:text-primary"
                        >
                            <Eye size={18} />
                        </button>

                        <button
                            onClick={edit}
                            title="Edit"
                            className="rounded-lg p-2 text-slate-400 hover:text-primary"
                        >
                            <Pencil size={18} />
                        </button>

                        <button
                            onClick={remove}
                            title="Delete"
                            className="rounded-lg p-2 text-slate-400 hover:text-red-600"
                        >
                            <Trash2 size={18} />
                        </button>

                    </div>

                </div>

            </div>


            <div className="grid grid-cols-2 gap-3 p-5">

                <Info
                    title="Assigned Sections"
                    value={
                        course.assignedSections?.length ||
                        0
                    }
                />

                <Info
                    title="Subjects"
                    value={
                        course.courseSubjects?.length ||
                        0
                    }
                />

            </div>


            {course.assignedSections?.length > 0 && (

                <div className="border-t border-slate-200 p-5 dark:border-slate-800">

                    <h3 className="mb-3 text-sm font-semibold">
                        Assigned Sections
                    </h3>

                    <div className="flex flex-wrap gap-2">

                        {course.assignedSections.map(
                            s => (

                                <span
                                    key={s.id}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                                >
                                    {s.className} - {s.name}
                                </span>

                            )
                        )}

                    </div>

                </div>

            )}


            {course.courseSubjects?.length > 0 && (

                <div className="border-t border-slate-200 p-5 dark:border-slate-800">

                    <h3 className="mb-3 text-sm font-semibold">
                        Course Subjects
                    </h3>

                    <div className="space-y-2">

                        {course.courseSubjects
                            .slice(0, 5)
                            .map(
                                s => (

                                    <div
                                        key={s.id}
                                        className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                                    >

                                        <div>

                                            <p className="text-sm font-medium">
                                                {s.subject?.subjectName}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {s.subject?.subjectCode}
                                            </p>

                                        </div>

                                        <div className="text-right text-xs text-slate-500">

                                            <p>
                                                {s.lecturesPerWeek}
                                                /week
                                            </p>

                                            <p>
                                                {s.lectureDurationMinutes}
                                                {" "}min

                                                {s.isPracticalSubject
                                                    ? " • Practical"
                                                    : ""}
                                            </p>

                                        </div>

                                    </div>

                                )
                            )}

                    </div>


                    {course.courseSubjects.length > 5 && (

                        <p className="mt-2 text-xs text-slate-500">
                            +
                            {course.courseSubjects.length - 5}
                            {" "}more subjects
                        </p>

                    )}

                </div>

            )}


            <div className="flex justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">

                Academic Year:

                <b>
                    {course.academicYear?.name || "—"}
                </b>

                <button
                    onClick={view}
                    className="text-sm font-semibold text-primary"
                >
                    View Course
                </button>

            </div>

        </div>
    );
}


/* =========================================================
   COURSE MODAL
========================================================= */

function CourseModal({
    form,
    setForm,
    years,

    /*
     * IMPORTANT:
     *
     * This is now Course | null,
     * not boolean.
     */
    editing,

    saving,
    error,
    close,
    save,
}: {
    form: CourseForm;
    setForm: React.Dispatch<
        React.SetStateAction<CourseForm>
    >;
    years: AcademicYear[];
    editing: Course | null;
    saving: boolean;
    error: string;
    close: () => void;
    save: () => void;
}) {

    const [sections, setSections] =
        useState<AvailableSection[]>([]);

    const [subjects, setSubjects] =
        useState<AvailableSubject[]>([]);

    const [loadingSections, setLoadingSections] =
        useState(false);

    const [loadingSubjects, setLoadingSubjects] =
        useState(false);

    const [sectionSearch, setSectionSearch] =
        useState("");

    const [subjectSearch, setSubjectSearch] =
        useState("");

    const [sectionOpen, setSectionOpen] =
        useState(false);

    const [subjectOpen, setSubjectOpen] =
        useState(false);


    /* =====================================================
       GENERIC FORM SETTER
    ===================================================== */

    const set = (
        key: keyof CourseForm,
        value: any
    ) => {

        setForm(
            previous => ({
                ...previous,
                [key]: value,
            })
        );
    };


    /* =====================================================
       SUBJECT CHANGE
    ===================================================== */

    const subjectChange = (
        index: number,
        key: string,
        value: any
    ) => {

        setForm(
            previous => ({
                ...previous,

                courseSubjects:
                    previous.courseSubjects.map(
                        (subject, currentIndex) =>
                            currentIndex === index
                                ? {
                                    ...subject,
                                    [key]: value,
                                }
                                : subject
                    ),
            })
        );
    };


    /* =====================================================
       LOAD SECTIONS + SUBJECTS
    ===================================================== */

    useEffect(() => {

        if (!form.academicYearId) {
            return;
        }

        loadSections();
        loadSubjects();

    }, [
        form.academicYearId,
    ]);


    /* =====================================================
       LOAD SECTIONS
    ===================================================== */

    async function loadSections() {

        try {

            setLoadingSections(true);

            const data =
                await getUnassignedSections(
                    form.academicYearId
                );

            setSections(data);

        } catch (e) {

            console.error(
                "Failed to load sections",
                e
            );

        } finally {

            setLoadingSections(false);
        }
    }


    /* =====================================================
       LOAD SUBJECTS
    ===================================================== */

    async function loadSubjects() {

        try {

            setLoadingSubjects(true);

            const data =
                await getSubjects(
                    form.academicYearId
                );

            setSubjects(data);

        } catch (e) {

            console.error(
                "Failed to load subjects",
                e
            );

        } finally {

            setLoadingSubjects(false);
        }
    }


    /* =====================================================
       MERGE EXISTING ASSIGNED SECTIONS + AVAILABLE
       SECTIONS
    ===================================================== */

    const availableSections =
        useMemo(() => {

            /*
             * During ADD:
             *
             * existingSections = []
             *
             * During EDIT:
             *
             * existingSections =
             * course.assignedSections
             */

            const existingSections =
                editing?.assignedSections || [];


            /*
             * Map removes duplicates.
             *
             * If a section exists in both:
             *
             * existing assigned section
             * +
             * unassigned API response
             *
             * only one copy remains.
             */

            const map =
                new Map<
                    number,
                    AvailableSection
                >();


            /*
             * First add existing assigned
             * sections.
             */
            existingSections.forEach(
                section => {

                    map.set(
                        section.id,
                        section as AvailableSection
                    );

                }
            );


            /*
             * Then add API available sections.
             */
            sections.forEach(
                section => {

                    map.set(
                        section.id,
                        section
                    );

                }
            );


            return Array.from(
                map.values()
            );

        }, [
            sections,
            editing,
        ]);


    /* =====================================================
       FILTER SECTIONS
    ===================================================== */

    const filteredSections =
        useMemo(() => {

            const q =
                sectionSearch
                    .trim()
                    .toLowerCase();

            if (!q) {
                return availableSections;
            }

            return availableSections.filter(
                section =>
                    `${section.name} ${section.className}`
                        .toLowerCase()
                        .includes(q)
            );

        }, [
            availableSections,
            sectionSearch,
        ]);


    /* =====================================================
       FILTER SUBJECTS
    ===================================================== */

    const filteredSubjects =
        useMemo(() => {

            const q =
                subjectSearch
                    .trim()
                    .toLowerCase();

            if (!q) {
                return subjects;
            }

            return subjects.filter(
                subject =>
                    `${subject.subjectName} ${subject.subjectCode}`
                        .toLowerCase()
                        .includes(q)
            );

        }, [
            subjects,
            subjectSearch,
        ]);


    /* =====================================================
       TOTAL LECTURES
    ===================================================== */

    const totalLectures =
        useMemo(
            () =>
                form.courseSubjects.reduce(
                    (
                        total: number,
                        subject: any
                    ) =>
                        total +
                        Number(
                            subject.lecturesPerWeek
                        ),
                    0
                ),
            [
                form.courseSubjects,
            ]
        );


    /* =====================================================
       SELECTED SECTIONS
    ===================================================== */

    const selectedSections =
        useMemo(() => {

            return availableSections.filter(
                section =>
                    form.assignedSectionIds.includes(
                        section.id
                    )
            );

        }, [
            availableSections,
            form.assignedSectionIds,
        ]);


    /* =====================================================
       SELECTED SUBJECT IDS
    ===================================================== */

    const selectedSubjectIds =
        form.courseSubjects.map(
            subject =>
                subject.subjectId
        );


    /* =====================================================
       SELECTED SUBJECT OBJECTS
    ===================================================== */

    const selectedSubjects =
        subjects.filter(
            subject =>
                selectedSubjectIds.includes(
                    subject.id
                )
        );


    /* =====================================================
       TOGGLE SECTION
    ===================================================== */

    function toggleSection(
        sectionId: number
    ) {

        setForm(
            previous => {

                const exists =
                    previous.assignedSectionIds.includes(
                        sectionId
                    );


                if (exists) {

                    /*
                     * REMOVE SECTION
                     */
                    return {
                        ...previous,

                        assignedSectionIds:
                            previous.assignedSectionIds.filter(
                                id =>
                                    id !== sectionId
                            ),
                    };
                }


                /*
                 * ADD SECTION
                 */
                return {

                    ...previous,

                    assignedSectionIds: [
                        ...previous.assignedSectionIds,
                        sectionId,
                    ],
                };

            }
        );
    }


    /* =====================================================
       REMOVE SECTION
    ===================================================== */

    function removeSection(
        sectionId: number
    ) {

        /*
         * This works for both:
         *
         * ADD
         * EDIT
         *
         * because the form is the source of truth.
         */

        setForm(
            previous => ({
                ...previous,

                assignedSectionIds:
                    previous.assignedSectionIds.filter(
                        id =>
                            id !== sectionId
                    ),
            })
        );
    }


    /* =====================================================
       TOGGLE SUBJECT
    ===================================================== */

    function toggleSubject(
        subjectId: number
    ) {

        setForm(
            previous => {

                const exists =
                    previous.courseSubjects.some(
                        subject =>
                            subject.subjectId ===
                            subjectId
                    );


                if (exists) {

                    return {
                        ...previous,

                        courseSubjects:
                            previous.courseSubjects.filter(
                                subject =>
                                    subject.subjectId !==
                                    subjectId
                            ),
                    };
                }


                return {

                    ...previous,

                    courseSubjects: [
                        ...previous.courseSubjects,

                        {
                            subjectId,

                            lecturesPerWeek:
                                1,

                            lectureDurationMinutes:
                                45,

                            isPracticalSubject:
                                false,
                        },
                    ],
                };

            }
        );
    }


    /* =====================================================
       REMOVE SUBJECT
    ===================================================== */

    function removeSubject(
        subjectId: number
    ) {

        setForm(
            previous => ({
                ...previous,

                courseSubjects:
                    previous.courseSubjects.filter(
                        subject =>
                            subject.subjectId !==
                            subjectId
                    ),
            })
        );
    }


    /* =====================================================
       RENDER MODAL
    ===================================================== */

    return (

        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={close}
        >

            <div
                onClick={e =>
                    e.stopPropagation()
                }
                className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            >

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="sticky top-0 z-10 flex justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

                    <div>

                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {editing
                                ? "Edit Course"
                                : "Add Course"}
                        </h2>

                        <p className="text-sm text-slate-500">
                            Configure course, sections and subjects
                        </p>

                    </div>

                    <button
                        onClick={close}
                        disabled={saving}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                        <X />
                    </button>

                </div>


                <div className="space-y-6 p-5">

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30">
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        COURSE INFORMATION
                    ================================================= */}

                    <section>

                        <SectionTitle
                            title="Course Information"
                            description="Basic course details"
                        />

                        <div className="mt-4 grid gap-4 md:grid-cols-2">

                            <Input
                                label="Course Name"
                                value={
                                    form.courseName
                                }
                                onChange={
                                    value => {

                                        set(
                                            "courseName",
                                            value
                                        );

                                        set(
                                            "name",
                                            value
                                        );

                                    }
                                }
                            />

                            <Input
                                label="Course Code"
                                value={
                                    form.courseCode
                                }
                                onChange={
                                    value =>
                                        set(
                                            "courseCode",
                                            value
                                        )
                                }
                            />

                        </div>


                        <label className="mt-4 block text-sm font-medium">

                            Academic Year

                            <select
                                value={
                                    form.academicYearId ||
                                    ""
                                }
                                onChange={e =>
                                    set(
                                        "academicYearId",
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                            >

                                <option value="">
                                    Select year
                                </option>

                                {years.map(
                                    y => (

                                        <option
                                            key={y.id}
                                            value={y.id}
                                        >
                                            {y.name}

                                            {y.current
                                                ? " — Current"
                                                : ""}

                                        </option>

                                    )
                                )}

                            </select>

                        </label>

                    </section>


                    {/* =================================================
                        SECTIONS
                    ================================================= */}

                    <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">

                        <div className="flex items-start justify-between gap-3">

                            <SectionTitle
                                title="Assign Sections"
                                description={
                                    editing
                                        ? "Existing assigned sections are shown and can be removed or changed."
                                        : "Select one or more sections for this course"
                                }
                            />

                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">

                                {
                                    form.assignedSectionIds.length
                                }

                                {" "}selected

                            </span>

                        </div>


                        {/* =================================================
                            SELECTED SECTION CHIPS
                        ================================================= */}

                        {selectedSections.length > 0 && (

                            <div className="mt-4 flex flex-wrap gap-2">

                                {selectedSections.map(
                                    section => (

                                        <span
                                            key={section.id}
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                                        >

                                            {section.className}
                                            {" - "}
                                            {section.name}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeSection(
                                                        section.id
                                                    )
                                                }
                                                className="rounded-full hover:bg-primary/20"
                                                title="Remove section"
                                            >

                                                <X
                                                    size={14}
                                                />

                                            </button>

                                        </span>

                                    )
                                )}

                            </div>

                        )}


                        {/* =================================================
                            SECTION SELECTOR
                        ================================================= */}

                        <div className="relative mt-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setSectionOpen(
                                        value =>
                                            !value
                                    )
                                }
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm dark:border-slate-700 dark:bg-slate-800"
                            >

                                <span className="text-slate-500">

                                    {loadingSections
                                        ? "Loading sections..."
                                        : "Select sections..."}

                                </span>

                                <ChevronDown
                                    size={18}
                                />

                            </button>


                            {sectionOpen && (

                                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">

                                    {/* SEARCH */}

                                    <div className="border-b border-slate-200 p-3 dark:border-slate-700">

                                        <div className="relative">

                                            <Search
                                                size={16}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                autoFocus
                                                value={
                                                    sectionSearch
                                                }
                                                onChange={e =>
                                                    setSectionSearch(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Search section or class..."
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
                                            />

                                        </div>

                                    </div>


                                    {/* LIST */}

                                    <div className="max-h-64 overflow-y-auto p-2">

                                        {loadingSections ? (

                                            <div className="p-5 text-center text-sm text-slate-500">
                                                Loading sections...
                                            </div>

                                        ) : filteredSections.length === 0 ? (

                                            <div className="p-5 text-center text-sm text-slate-500">
                                                No sections found.
                                            </div>

                                        ) : (

                                            filteredSections.map(
                                                section => {

                                                    const selected =
                                                        form.assignedSectionIds.includes(
                                                            section.id
                                                        );


                                                    return (

                                                        <button
                                                            key={section.id}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleSection(
                                                                    section.id
                                                                )
                                                            }
                                                            className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
                                                        >

                                                            <div>

                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                    {section.className}
                                                                    {" - "}
                                                                    {section.name}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    Section ID: {section.id}
                                                                </p>

                                                            </div>


                                                            {selected && (

                                                                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-white">

                                                                    <Check
                                                                        size={13}
                                                                    />

                                                                </div>

                                                            )}

                                                        </button>

                                                    );
                                                }
                                            )

                                        )}

                                    </div>

                                </div>

                            )}

                        </div>

                    </section>


                    {/* =================================================
                        SUBJECTS
                    ================================================= */}

                    <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">

                        <div className="flex items-start justify-between gap-3">

                            <SectionTitle
                                title="Course Subjects"
                                description="Select subjects and configure their weekly lectures"
                            />

                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">

                                {
                                    form.courseSubjects.length
                                }

                                {" "}subjects

                            </span>

                        </div>


                        {/* SUBJECT SELECTOR */}

                        <div className="relative mt-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setSubjectOpen(
                                        value =>
                                            !value
                                    )
                                }
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm dark:border-slate-700 dark:bg-slate-800"
                            >

                                <span className="text-slate-500">

                                    {loadingSubjects
                                        ? "Loading subjects..."
                                        : "Select subjects..."}

                                </span>

                                <ChevronDown
                                    size={18}
                                />

                            </button>


                            {subjectOpen && (

                                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">

                                    <div className="border-b border-slate-200 p-3 dark:border-slate-700">

                                        <div className="relative">

                                            <Search
                                                size={16}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                autoFocus
                                                value={
                                                    subjectSearch
                                                }
                                                onChange={e =>
                                                    setSubjectSearch(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Search subject name or code..."
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
                                            />

                                        </div>

                                    </div>


                                    <div className="max-h-72 overflow-y-auto p-2">

                                        {loadingSubjects ? (

                                            <div className="p-5 text-center text-sm text-slate-500">
                                                Loading subjects...
                                            </div>

                                        ) : filteredSubjects.length === 0 ? (

                                            <div className="p-5 text-center text-sm text-slate-500">
                                                No subjects found.
                                            </div>

                                        ) : (

                                            filteredSubjects.map(
                                                subject => {

                                                    const selected =
                                                        selectedSubjectIds.includes(
                                                            subject.id
                                                        );


                                                    return (

                                                        <button
                                                            key={subject.id}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleSubject(
                                                                    subject.id
                                                                )
                                                            }
                                                            className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
                                                        >

                                                            <div>

                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                    {subject.subjectName}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    {subject.subjectCode}
                                                                    {" • "}
                                                                    ID: {subject.id}
                                                                </p>

                                                            </div>


                                                            {selected && (

                                                                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-white">

                                                                    <Check
                                                                        size={13}
                                                                    />

                                                                </div>

                                                            )}

                                                        </button>

                                                    );
                                                }
                                            )

                                        )}

                                    </div>

                                </div>

                            )}

                        </div>


                        {/* SELECTED SUBJECT CHIPS */}

                        {selectedSubjects.length > 0 && (

                            <div className="mt-4 flex flex-wrap gap-2">

                                {selectedSubjects.map(
                                    subject => (

                                        <span
                                            key={subject.id}
                                            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium dark:bg-slate-800"
                                        >

                                            {subject.subjectName}

                                            <span className="text-slate-400">
                                                {subject.subjectCode}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeSubject(
                                                        subject.id
                                                    )
                                                }
                                                className="rounded-full text-slate-400 hover:text-red-500"
                                                title="Remove subject"
                                            >
                                                <X
                                                    size={14}
                                                />
                                            </button>

                                        </span>

                                    )
                                )}

                            </div>

                        )}


                        {/* TOTAL LECTURES */}

                        <div className="mt-5 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">

                            <div>

                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Total Lectures / Week
                                </p>

                                <p className="text-xs text-slate-500">
                                    Automatically calculated from all subjects
                                </p>

                            </div>

                            <div className="text-2xl font-bold text-primary">
                                {totalLectures}
                            </div>

                        </div>


                        {/* SUBJECT CONFIGURATION */}

                        {form.courseSubjects.length > 0 && (

                            <div className="mt-5 space-y-3">

                                <p className="text-sm font-semibold">
                                    Subject Configuration
                                </p>


                                {form.courseSubjects.map(
                                    (
                                        subject: any,
                                        index: number
                                    ) => {

                                        const subjectInfo =
                                            subjects.find(
                                                s =>
                                                    s.id ===
                                                    subject.subjectId
                                            );


                                        return (

                                            <div
                                                key={
                                                    subject.subjectId
                                                }
                                                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                                            >

                                                <div className="mb-4 flex items-start justify-between">

                                                    <div>

                                                        <p className="font-semibold text-slate-900 dark:text-white">
                                                            {
                                                                subjectInfo?.subjectName ||
                                                                `Subject #${subject.subjectId}`
                                                            }
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {
                                                                subjectInfo?.subjectCode ||
                                                                ""
                                                            }
                                                        </p>

                                                    </div>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeSubject(
                                                                subject.subjectId
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                                    >

                                                        <Trash2
                                                            size={17}
                                                        />

                                                    </button>

                                                </div>


                                                <div className="grid gap-3 md:grid-cols-3">

                                                    <Num
                                                        label="Lectures / Week"
                                                        value={
                                                            subject.lecturesPerWeek
                                                        }
                                                        onChange={
                                                            value =>
                                                                subjectChange(
                                                                    index,
                                                                    "lecturesPerWeek",
                                                                    value
                                                                )
                                                        }
                                                    />

                                                    <Num
                                                        label="Lecture Duration (min)"
                                                        value={
                                                            subject.lectureDurationMinutes
                                                        }
                                                        onChange={
                                                            value =>
                                                                subjectChange(
                                                                    index,
                                                                    "lectureDurationMinutes",
                                                                    value
                                                                )
                                                        }
                                                    />

                                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-900">

                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                subject.isPracticalSubject
                                                            }
                                                            onChange={e =>
                                                                subjectChange(
                                                                    index,
                                                                    "isPracticalSubject",
                                                                    e.target.checked
                                                                )
                                                            }
                                                            className="h-4 w-4"
                                                        />

                                                        Practical Subject

                                                    </label>

                                                </div>

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                        )}

                    </section>

                </div>


                {/* =====================================================
                    FOOTER
                ===================================================== */}

                <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

                    <button
                        onClick={close}
                        disabled={saving}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={save}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white"
                    >

                        {saving ? (

                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                        ) : (

                            <Save size={17} />

                        )}

                        {editing
                            ? "Update Course"
                            : "Create Course"}

                    </button>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {

    return (

        <div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {title}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
                {description}
            </p>

        </div>
    );
}


function Input({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {

    return (

        <label className="block text-sm font-medium">

            {label}

            <input
                value={value}
                onChange={e =>
                    onChange(
                        e.target.value
                    )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
            />

        </label>
    );
}


function Num({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) {

    return (

        <label className="block text-xs font-medium">

            {label}

            <input
                type="number"
                min="0"
                value={value}
                onChange={e =>
                    onChange(
                        Math.max(
                            0,
                            Number(
                                e.target.value
                            )
                        )
                    )
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />

        </label>
    );
}


function Info({
    title,
    value,
}: {
    title: string;
    value: number;
}) {

    return (

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">

            <p className="text-lg font-bold">
                {value}
            </p>

            <p className="text-xs text-slate-500">
                {title}
            </p>

        </div>
    );
}


function Summary({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {

    return (

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="flex justify-between">

                <div>

                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                        {value}
                    </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary dark:bg-blue-950">
                    {icon}
                </div>

            </div>

        </div>
    );
}


function Loading() {

    return (

        <div className="rounded-2xl border bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />

            <p className="mt-4 text-sm text-slate-500">
                Loading courses...
            </p>

        </div>
    );
}


function Empty({
    search,
    add,
}: {
    search: string;
    add: () => void;
}) {

    return (

        <div className="rounded-2xl border border-dashed p-12 text-center dark:border-slate-700">

            <BookOpen
                className="mx-auto text-slate-400"
                size={38}
            />

            <h3 className="mt-4 font-semibold">

                {search
                    ? "No courses found"
                    : "No courses for this academic year"}

            </h3>

            <p className="mt-1 text-sm text-slate-500">

                {search
                    ? "Try another search term."
                    : "Create the first course for this academic year."}

            </p>


            {!search && (

                <button
                    onClick={add}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                >

                    <Plus size={17} />

                    Add Course

                </button>

            )}

        </div>
    );
}