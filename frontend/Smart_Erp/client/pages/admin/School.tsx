import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Building2,
    Check,
    ChevronDown,
    Edit3,
    GraduationCap,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
    Eye,
    Users,
    X,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";

import { useAuth } from "@/services/authContext";


import {
    AcademicYearResponse,
    CommonDTO,
    SchoolResponse,
    UniversityResponse,

    getUniversities,
    getAcademicYears,

    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    switchAcademicYear,

    createSchool,
    updateSchool,
    deleteSchool,

    getTeachers,

} from "@/services/admin/academicSchoolService";

import {
    getBaseUrl,
} from "@/services/authutil";


const baseUrl = getBaseUrl();


/*
|--------------------------------------------------------------------------
| UNIVERSITY FILTER PERMISSION
|--------------------------------------------------------------------------
|
| Add/remove roles here.
|
| Example:
|
| const UNIVERSITY_FILTER_ALLOWED_ROLES = [
|     "ROLE_ADMIN",
|     "ROLE_ADMISSION",
| ];
|
*/

const UNIVERSITY_FILTER_ALLOWED_ROLES: string[] = [
    "ROLE_ADMIN",
];


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const hasUniversityFilterPermission = (
    role: string | null
): boolean => {

    if (!role) {
        return false;
    }

    return UNIVERSITY_FILTER_ALLOWED_ROLES.includes(
        role
    );
};


const getStoredUniversityId = (): number | null => {

    const possibleKeys = [
        "universityId",
        "university_id",
        "selectedUniversityId",
    ];

    for (const key of possibleKeys) {

        const value =
            localStorage.getItem(key);

        if (
            value &&
            !Number.isNaN(Number(value))
        ) {
            return Number(value);
        }
    }

    return null;
};


const formatDate = (
    date?: string
) => {

    if (!date) {
        return "-";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};


/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function School() {

    const navigate = useNavigate();



    /*
    |--------------------------------------------------------------------------
    | AUTH CONTEXT
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Role comes directly from AuthContext.
    |
    */

    const { role } = useAuth();

    const [searchParams] =
        useSearchParams();


    /*
    |--------------------------------------------------------------------------
    | Layout
    |--------------------------------------------------------------------------
    */

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [chatOpen, setChatOpen] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Opening Context
    |--------------------------------------------------------------------------
    */

    const urlUniversityId =
        searchParams.get("universityId");

    const universityIdFromUrl =
        urlUniversityId &&
            !Number.isNaN(
                Number(urlUniversityId)
            )
            ? Number(urlUniversityId)
            : null;


    /*
    |--------------------------------------------------------------------------
    | UNIVERSITY FILTER PERMISSION
    |--------------------------------------------------------------------------
    */

    const canUseUniversityFilter =
        hasUniversityFilterPermission(role);


    /*
    |--------------------------------------------------------------------------
    | UNIVERSITY FILTER VISIBILITY
    |--------------------------------------------------------------------------
    |
    | URL universityId:
    |      Filter is NEVER shown.
    |
    | No URL universityId:
    |      Filter shown only if role is
    |      present inside UNIVERSITY_FILTER_ALLOWED_ROLES.
    |
    */

    const showUniversityFilter =
        universityIdFromUrl === null &&
        canUseUniversityFilter;
    /*
    |--------------------------------------------------------------------------
    | University State
    |--------------------------------------------------------------------------
    */

    const [universities, setUniversities] =
        useState<UniversityResponse[]>([]);

    const [
        selectedUniversityId,
        setSelectedUniversityId,
    ] = useState<number | null>(null);

    const [
        loadingUniversities,
        setLoadingUniversities,
    ] = useState(false);

    const [
        universityError,
        setUniversityError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Academic Year State
    |--------------------------------------------------------------------------
    */

    const [academicYears, setAcademicYears] =
        useState<AcademicYearResponse[]>([]);

    const [
        selectedAcademicYearId,
        setSelectedAcademicYearId,
    ] = useState<number | null>(null);

    const [
        loadingAcademicYears,
        setLoadingAcademicYears,
    ] = useState(false);

    const [
        academicYearError,
        setAcademicYearError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Academic Year Modal
    |--------------------------------------------------------------------------
    */

    const [
        academicYearModalOpen,
        setAcademicYearModalOpen,
    ] = useState(false);

    const [
        editingAcademicYear,
        setEditingAcademicYear,
    ] = useState<AcademicYearResponse | null>(
        null
    );

    const [
        academicYearName,
        setAcademicYearName,
    ] = useState("");

    const [
        academicYearCode,
        setAcademicYearCode,
    ] = useState("");

    const [
        academicYearStartDate,
        setAcademicYearStartDate,
    ] = useState("");

    const [
        academicYearEndDate,
        setAcademicYearEndDate,
    ] = useState("");

    const [
        academicYearActive,
        setAcademicYearActive,
    ] = useState(true);

    const [
        academicYearSubmitting,
        setAcademicYearSubmitting,
    ] = useState(false);

    const [
        academicYearFormError,
        setAcademicYearFormError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Academic Year Delete
    |--------------------------------------------------------------------------
    */

    const [
        deleteAcademicYearOpen,
        setDeleteAcademicYearOpen,
    ] = useState(false);

    const [
        academicYearToDelete,
        setAcademicYearToDelete,
    ] = useState<AcademicYearResponse | null>(
        null
    );

    const [
        deletingAcademicYear,
        setDeletingAcademicYear,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Switch Current Academic Year
    |--------------------------------------------------------------------------
    */

    const [
        switchingAcademicYearId,
        setSwitchingAcademicYearId,
    ] = useState<number | null>(null);


    /*
    |--------------------------------------------------------------------------
    | School State
    |--------------------------------------------------------------------------
    */

    const [schools, setSchools] =
        useState<SchoolResponse[]>([]);

    const [schoolSearch, setSchoolSearch] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | School Modal
    |--------------------------------------------------------------------------
    */

    const [
        schoolModalOpen,
        setSchoolModalOpen,
    ] = useState(false);

    const [
        editingSchool,
        setEditingSchool,
    ] = useState<SchoolResponse | null>(
        null
    );

    const [schoolName, setSchoolName] =
        useState("");

    const [schoolCode, setSchoolCode] =
        useState("");

    const [
        selectedDeanId,
        setSelectedDeanId,
    ] = useState<string>("");

    const [teachers, setTeachers] =
        useState<CommonDTO[]>([]);

    const [
        loadingTeachers,
        setLoadingTeachers,
    ] = useState(false);

    const [
        schoolSubmitting,
        setSchoolSubmitting,
    ] = useState(false);

    const [
        schoolFormError,
        setSchoolFormError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | School Delete
    |--------------------------------------------------------------------------
    */

    const [
        deleteSchoolOpen,
        setDeleteSchoolOpen,
    ] = useState(false);

    const [
        schoolToDelete,
        setSchoolToDelete,
    ] = useState<SchoolResponse | null>(
        null
    );

    const [
        deletingSchool,
        setDeletingSchool,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Notification
    |--------------------------------------------------------------------------
    */

    const [
        notification,
        setNotification,
    ] = useState<{
        type: "success" | "error" | "";
        message: string;
    }>({
        type: "",
        message: "",
    });


    /*
    |--------------------------------------------------------------------------
    | Resolve University Context
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        /*
        |--------------------------------------------------------------------------
        | CASE 1
        |--------------------------------------------------------------------------
        |
        | URL contains universityId.
        |
        | URL ALWAYS wins.
        |
        */

        if (
            universityIdFromUrl !== null
        ) {

            setSelectedUniversityId(
                universityIdFromUrl
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | CASE 2
        |--------------------------------------------------------------------------
        |
        | No URL universityId.
        |
        | If role is allowed to use university
        | filter, university list will be loaded
        | by another effect.
        |
        */


        /*
        |--------------------------------------------------------------------------
        | CASE 3
        |--------------------------------------------------------------------------
        |
        | No URL universityId AND role does NOT
        | have university-filter permission.
        |
        | Use university context from previous
        | navigation/storage.
        |
        */

        if (
            !canUseUniversityFilter
        ) {

            const storedUniversityId =
                getStoredUniversityId();

            if (
                storedUniversityId !== null
            ) {

                setSelectedUniversityId(
                    storedUniversityId
                );
            }
        }

    }, [
        universityIdFromUrl,
        canUseUniversityFilter,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Load Universities
    |--------------------------------------------------------------------------
    |
    | ONLY roles inside
    | UNIVERSITY_FILTER_ALLOWED_ROLES
    | can execute this.
    |
    */

    useEffect(() => {

        if (
            universityIdFromUrl !== null
        ) {
            return;
        }

        if (
            !canUseUniversityFilter
        ) {
            return;
        }


        const loadUniversities =
            async () => {

                try {

                    setLoadingUniversities(
                        true
                    );

                    setUniversityError("");


                    const data =
                        await getUniversities();


                    setUniversities(data);


                    /*
                    |--------------------------------------------------------------------------
                    | Automatically select first university
                    |--------------------------------------------------------------------------
                    */

                    if (
                        data.length > 0
                    ) {

                        setSelectedUniversityId(
                            data[0].id
                        );

                    } else {

                        setSelectedUniversityId(
                            null
                        );
                    }

                } catch (error: any) {

                    setUniversityError(
                        error?.message ||
                        "Failed to load universities."
                    );

                } finally {

                    setLoadingUniversities(
                        false
                    );
                }
            };


        loadUniversities();

    }, [
        role,
        canUseUniversityFilter,
        universityIdFromUrl,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Load Academic Years
    |--------------------------------------------------------------------------
    */

    const loadAcademicYears = async (
        universityId: number,
        preserveAcademicYearId?: number | null
    ) => {
        try {
            setLoadingAcademicYears(true);
            setAcademicYearError("");
            setSchools([]);

            const data = await getAcademicYears(universityId);

            setAcademicYears(data);

            // First try to preserve the currently selected year
            const preservedYear = preserveAcademicYearId
                ? data.find(
                    (year) =>
                        year.id === preserveAcademicYearId
                )
                : null;

            // If it exists, keep it selected
            const selectedYear =
                preservedYear ||
                data.find(
                    (year) => year.current === true
                ) ||
                data[0];

            if (selectedYear) {
                setSelectedAcademicYearId(
                    selectedYear.id
                );

                setSchools(
                    Array.isArray(
                        selectedYear.schoolResponse
                    )
                        ? selectedYear.schoolResponse
                        : []
                );
            } else {
                setSelectedAcademicYearId(null);
                setSchools([]);
            }

        } catch (error: any) {
            setAcademicYears([]);
            setSelectedAcademicYearId(null);
            setSchools([]);

            setAcademicYearError(
                error?.message ||
                "Failed to load academic years."
            );
        } finally {
            setLoadingAcademicYears(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | University -> Academic Years
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            selectedUniversityId === null
        ) {

            setAcademicYears([]);

            setSelectedAcademicYearId(
                null
            );

            setSchools([]);

            return;
        }


        loadAcademicYears(
            selectedUniversityId
        );

    }, [
        selectedUniversityId,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Selected Academic Year
    |--------------------------------------------------------------------------
    */

    const selectedAcademicYear =
        useMemo(() => {

            return academicYears.find(
                (year) =>
                    year.id ===
                    selectedAcademicYearId
            ) || null;

        }, [
            academicYears,
            selectedAcademicYearId,
        ]);


    /*
    |--------------------------------------------------------------------------
    | Academic Year Change
    |--------------------------------------------------------------------------
    */

    const handleAcademicYearChange =
        (
            value: string
        ) => {

            const id =
                Number(value);


            setSelectedAcademicYearId(
                id
            );


            const selected =
                academicYears.find(
                    (year) =>
                        year.id === id
                );


            setSchools(
                selected?.schoolResponse || []
            );
        };


    /*
    |--------------------------------------------------------------------------
    | Filter Schools
    |--------------------------------------------------------------------------
    */

    const filteredSchools =
        useMemo(() => {

            if (
                !schoolSearch.trim()
            ) {
                return schools;
            }


            const search =
                schoolSearch.toLowerCase();


            return schools.filter(
                (school) =>
                    school.name
                        ?.toLowerCase()
                        .includes(search) ||

                    school.code
                        ?.toLowerCase()
                        .includes(search) ||

                    school.dean?.name
                        ?.toLowerCase()
                        .includes(search)
            );

        }, [
            schools,
            schoolSearch,
        ]);


    /*
    |--------------------------------------------------------------------------
    | Notification
    |--------------------------------------------------------------------------
    */

    const showNotification =
        (
            type: "success" | "error",
            message: string
        ) => {

            setNotification({
                type,
                message,
            });


            window.setTimeout(() => {

                setNotification({
                    type: "",
                    message: "",
                });

            }, 3500);
        };


    /*
    |--------------------------------------------------------------------------
    | Academic Year Modal
    |--------------------------------------------------------------------------
    */

    const openCreateAcademicYear =
        () => {

            setEditingAcademicYear(
                null
            );

            setAcademicYearName("");

            setAcademicYearCode("");

            setAcademicYearStartDate("");

            setAcademicYearEndDate("");

            setAcademicYearActive(true);

            setAcademicYearFormError("");

            setAcademicYearModalOpen(
                true
            );
        };


    const openEditAcademicYear =
        (
            year: AcademicYearResponse
        ) => {

            setEditingAcademicYear(
                year
            );

            setAcademicYearName(
                year.name || ""
            );

            setAcademicYearCode(
                year.code || ""
            );

            setAcademicYearStartDate(
                year.startDate || ""
            );

            setAcademicYearEndDate(
                year.endDate || ""
            );

            setAcademicYearActive(
                year.active
            );

            setAcademicYearFormError("");

            setAcademicYearModalOpen(
                true
            );
        };


    const closeAcademicYearModal =
        () => {

            if (
                academicYearSubmitting
            ) {
                return;
            }

            setAcademicYearModalOpen(
                false
            );

            setEditingAcademicYear(
                null
            );

            setAcademicYearFormError("");
        };


    /*
    |--------------------------------------------------------------------------
    | Save Academic Year
    |--------------------------------------------------------------------------
    */

    const handleAcademicYearSubmit =
        async (
            event: React.FormEvent
        ) => {

            event.preventDefault();


            if (
                selectedUniversityId === null
            ) {

                setAcademicYearFormError(
                    "University is required."
                );

                return;
            }


            const name =
                academicYearName.trim();

            const code =
                academicYearCode.trim();


            if (!name) {

                setAcademicYearFormError(
                    "Academic year name is required."
                );

                return;
            }


            if (!code) {

                setAcademicYearFormError(
                    "Academic year code is required."
                );

                return;
            }


            if (
                !academicYearStartDate ||
                !academicYearEndDate
            ) {

                setAcademicYearFormError(
                    "Start date and end date are required."
                );

                return;
            }


            const payload = {
                name,
                code,
                active: academicYearActive,
                startDate:
                    academicYearStartDate,
                endDate:
                    academicYearEndDate,
            };


            try {

                setAcademicYearSubmitting(
                    true
                );

                setAcademicYearFormError("");


                if (
                    editingAcademicYear
                ) {

                    await updateAcademicYear(
                        selectedUniversityId,
                        editingAcademicYear.id,
                        payload
                    );

                    showNotification(
                        "success",
                        "Academic year updated successfully."
                    );

                } else {

                    await createAcademicYear(
                        selectedUniversityId,
                        payload
                    );

                    showNotification(
                        "success",
                        "Academic year created successfully."
                    );
                }


                closeAcademicYearModal();


                await loadAcademicYears(
                    selectedUniversityId
                );

            } catch (error: any) {

                setAcademicYearFormError(
                    error?.message ||
                    "Failed to save academic year."
                );

            } finally {

                setAcademicYearSubmitting(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Delete Academic Year
    |--------------------------------------------------------------------------
    */

    const openAcademicYearDelete =
        (
            year: AcademicYearResponse
        ) => {

            setAcademicYearToDelete(
                year
            );

            setDeleteAcademicYearOpen(
                true
            );
        };


    const handleAcademicYearDelete =
        async () => {

            if (
                !academicYearToDelete ||
                selectedUniversityId === null
            ) {
                return;
            }


            try {

                setDeletingAcademicYear(
                    true
                );


                await deleteAcademicYear(
                    selectedUniversityId,
                    academicYearToDelete.id
                );


                setDeleteAcademicYearOpen(
                    false
                );

                setAcademicYearToDelete(
                    null
                );


                showNotification(
                    "success",
                    "Academic year deleted successfully."
                );


                await loadAcademicYears(
                    selectedUniversityId
                );

            } catch (error: any) {

                showNotification(
                    "error",
                    error?.message ||
                    "Failed to delete academic year."
                );

            } finally {

                setDeletingAcademicYear(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Switch Current Academic Year
    |--------------------------------------------------------------------------
    */

    const handleSwitchAcademicYear =
        async (
            year: AcademicYearResponse
        ) => {

            if (
                selectedUniversityId === null
            ) {
                return;
            }


            if (
                year.current
            ) {
                return;
            }


            try {

                setSwitchingAcademicYearId(
                    year.id
                );


                await switchAcademicYear(
                    selectedUniversityId,
                    year.id
                );


                showNotification(
                    "success",
                    "Academic year switched successfully."
                );


                await loadAcademicYears(
                    selectedUniversityId
                );

            } catch (error: any) {

                showNotification(
                    "error",
                    error?.message ||
                    "Failed to switch academic year."
                );

            } finally {

                setSwitchingAcademicYearId(
                    null
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | School Modal
    |--------------------------------------------------------------------------
    */

    const loadTeachersForSchool =
        async () => {

            if (
                selectedUniversityId === null
            ) {
                return;
            }


            try {

                setLoadingTeachers(
                    true
                );


                const data =
                    await getTeachers(
                        selectedUniversityId
                    );


                setTeachers(data);

            } catch (error: any) {

                setSchoolFormError(
                    error?.message ||
                    "Failed to load teachers."
                );

            } finally {

                setLoadingTeachers(
                    false
                );
            }
        };


    const openCreateSchool =
        async () => {

            if (
                selectedAcademicYearId === null
            ) {
                return;
            }


            setEditingSchool(null);

            setSchoolName("");

            setSchoolCode("");

            setSelectedDeanId("");

            setSchoolFormError("");

            setSchoolModalOpen(true);


            await loadTeachersForSchool();
        };


    const openEditSchool =
        async (
            school: SchoolResponse
        ) => {

            setEditingSchool(
                school
            );

            setSchoolName(
                school.name || ""
            );

            setSchoolCode(
                school.code || ""
            );

            setSelectedDeanId(
                school.dean?.id
                    ? String(
                        school.dean.id
                    )
                    : ""
            );

            setSchoolFormError("");

            setSchoolModalOpen(
                true
            );


            await loadTeachersForSchool();
        };


    const closeSchoolModal =
        () => {

            if (
                schoolSubmitting
            ) {
                return;
            }


            setSchoolModalOpen(
                false
            );

            setEditingSchool(
                null
            );

            setSchoolFormError("");
        };


    /*
    |--------------------------------------------------------------------------
    | Save School
    |--------------------------------------------------------------------------
    */

    const handleSchoolSubmit =
        async (
            event: React.FormEvent
        ) => {

            event.preventDefault();

            const currentAcademicYearId =
                selectedAcademicYearId;

            if (
                selectedAcademicYearId === null
            ) {

                setSchoolFormError(
                    "Academic year is required."
                );

                return;
            }


            const name =
                schoolName.trim();

            const code =
                schoolCode.trim();


            if (!name) {

                setSchoolFormError(
                    "School name is required."
                );

                return;
            }


            if (!code) {

                setSchoolFormError(
                    "School code is required."
                );

                return;
            }


            try {

                setSchoolSubmitting(
                    true
                );

                setSchoolFormError("");


                if (
                    editingSchool
                ) {

                    await updateSchool(
                        selectedAcademicYearId,
                        editingSchool.id,
                        {
                            name,
                            code,
                            deanId:
                                selectedDeanId
                                    ? Number(
                                        selectedDeanId
                                    )
                                    : null,
                        }
                    );


                    showNotification(
                        "success",
                        "School updated successfully."
                    );

                } else {

                    await createSchool(
                        selectedAcademicYearId,
                        name,
                        code
                    );


                    showNotification(
                        "success",
                        "School created successfully."
                    );
                }


                closeSchoolModal();


                if (
                    selectedUniversityId !== null
                ) {

                    await loadAcademicYears(
                        selectedUniversityId,
                        currentAcademicYearId
                    );
                }

            } catch (error: any) {

                setSchoolFormError(
                    error?.message ||
                    "Failed to save school."
                );

            } finally {

                setSchoolSubmitting(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Delete School
    |--------------------------------------------------------------------------
    */

    const openSchoolDelete =
        (
            school: SchoolResponse
        ) => {

            setSchoolToDelete(
                school
            );

            setDeleteSchoolOpen(
                true
            );
        };


    const handleSchoolDelete =
        async () => {

            if (
                !schoolToDelete ||
                selectedAcademicYearId === null
            ) {
                return;
            }


            try {

                setDeletingSchool(
                    true
                );


                await deleteSchool(
                    selectedAcademicYearId,
                    schoolToDelete.id
                );


                setDeleteSchoolOpen(
                    false
                );

                setSchoolToDelete(
                    null
                );


                showNotification(
                    "success",
                    "School deleted successfully."
                );


                if (
                    selectedUniversityId !== null
                ) {

                    await loadAcademicYears(
                        selectedUniversityId
                    );
                }

            } catch (error: any) {

                showNotification(
                    "error",
                    error?.message ||
                    "Failed to delete school."
                );

            } finally {

                setDeletingSchool(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Selected University
    |--------------------------------------------------------------------------
    */

    const selectedUniversity =
        universities.find(
            (university) =>
                university.id ===
                selectedUniversityId
        );


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="
            h-screen
            overflow-hidden
            bg-slate-50
            dark:bg-slate-950
        ">

            <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />


            <div className="
                h-[calc(100vh-64px)]
            ">

                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() =>
                        setSidebarOpen(false)
                    }
                />


                <main className="
                    h-full
                    overflow-y-auto
                    p-4
                    md:p-6
                    lg:p-8
                ">

                    <div className="
                        mx-auto
                        max-w-7xl
                    ">


                        {/* PAGE HEADER */}

                        <div className="
                            mb-6
                            flex
                            flex-col
                            gap-4
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                        ">

                            <div className="
                                flex
                                items-center
                                gap-3
                            ">

                                <div className="
                                    flex
                                    h-12
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-primary/10
                                    text-primary
                                ">
                                    <BookOpen
                                        size={25}
                                    />
                                </div>


                                <div>

                                    <h1 className="
                                        text-2xl
                                        font-bold
                                        tracking-tight
                                        text-slate-900
                                        md:text-3xl
                                        dark:text-white
                                    ">
                                        Academic Management
                                    </h1>

                                    <p className="
                                        mt-1
                                        text-sm
                                        text-slate-500
                                        dark:text-slate-400
                                    ">
                                        Manage academic years
                                        and schools.
                                    </p>

                                </div>

                            </div>


                            {/* UNIVERSITY FILTER */}

                            {showUniversityFilter && (

                                <div className="
                                    flex
                                    w-full
                                    flex-col
                                    gap-2
                                    sm:w-auto
                                ">

                                    <label className="
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wider
                                        text-slate-500
                                    ">
                                        University
                                    </label>


                                    <div className="
                                        relative
                                        min-w-[260px]
                                    ">

                                        <Building2
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
                                            value={
                                                selectedUniversityId ??
                                                ""
                                            }
                                            onChange={(
                                                event
                                            ) => {

                                                const value =
                                                    Number(
                                                        event
                                                            .target
                                                            .value
                                                    );


                                                setSelectedUniversityId(
                                                    value
                                                );


                                                localStorage.setItem(
                                                    "selectedUniversityId",
                                                    String(value)
                                                );


                                                setAcademicYears(
                                                    []
                                                );

                                                setSelectedAcademicYearId(
                                                    null
                                                );

                                                setSchools(
                                                    []
                                                );
                                            }}
                                            disabled={
                                                loadingUniversities
                                            }
                                            className="
                                                h-11
                                                w-full
                                                appearance-none
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                                pl-10
                                                pr-10
                                                text-sm
                                                font-medium
                                                text-slate-700
                                                outline-none
                                                focus:border-primary
                                                focus:ring-2
                                                focus:ring-primary/10
                                                disabled:opacity-60
                                                dark:border-slate-700
                                                dark:bg-slate-900
                                                dark:text-white
                                            "
                                        >

                                            {loadingUniversities && (
                                                <option value="">
                                                    Loading universities...
                                                </option>
                                            )}


                                            {!loadingUniversities &&
                                                universities.length ===
                                                0 && (
                                                    <option value="">
                                                        No universities available.
                                                    </option>
                                                )}


                                            {universities.map(
                                                (
                                                    university
                                                ) => (

                                                    <option
                                                        key={
                                                            university.id
                                                        }
                                                        value={
                                                            university.id
                                                        }
                                                    >
                                                        {
                                                            university.name
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>


                                        <ChevronDown
                                            size={17}
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


                                    {universityError && (
                                        <ErrorMessage
                                            message={
                                                universityError
                                            }
                                        />
                                    )}

                                </div>
                            )}

                        </div>



                        {/* NOTIFICATION */}

                        {notification.message && (
                            <div className={`
                                mb-6
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                border
                                px-4
                                py-3
                                text-sm
                                ${notification.type ===
                                    "success"
                                    ? `
                                            border-emerald-200
                                            bg-emerald-50
                                            text-emerald-700
                                            dark:border-emerald-900
                                            dark:bg-emerald-950/40
                                            dark:text-emerald-400
                                        `
                                    : `
                                            border-red-200
                                            bg-red-50
                                            text-red-700
                                            dark:border-red-900
                                            dark:bg-red-950/40
                                            dark:text-red-400
                                        `
                                }
                            `}>

                                {notification.type ===
                                    "success" ? (
                                    <Check size={17} />
                                ) : (
                                    <AlertCircle
                                        size={17}
                                    />
                                )}

                                {notification.message}

                            </div>
                        )}


                        {/* NO UNIVERSITY */}

                        {selectedUniversityId ===
                            null && (

                                <EmptyState
                                    icon={Building2}
                                    title="No university available."
                                    description="
                                    A valid university context is required
                                    before Academic Year management can begin.
                                "
                                />
                            )}


                        {/* ACADEMIC YEARS */}

                        {selectedUniversityId !==
                            null && (

                                <section className="
                                mb-8
                                overflow-hidden
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                shadow-sm
                                dark:border-slate-800
                                dark:bg-slate-900
                            ">

                                    <div className="
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
                                ">

                                        <div>

                                            <div className="
                                            flex
                                            items-center
                                            gap-2
                                        ">

                                                <GraduationCap
                                                    size={20}
                                                    className="text-primary"
                                                />

                                                <h2 className="
                                                text-lg
                                                font-bold
                                                text-slate-900
                                                dark:text-white
                                            ">
                                                    Academic Years
                                                </h2>

                                            </div>


                                            <p className="
                                            mt-1
                                            text-xs
                                            text-slate-500
                                        ">
                                                Manage academic years
                                                for the selected university.
                                            </p>

                                        </div>


                                        <div className="
                                        flex
                                        items-center
                                        gap-2
                                    ">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    selectedUniversityId &&
                                                    loadAcademicYears(
                                                        selectedUniversityId
                                                    )
                                                }
                                                disabled={
                                                    loadingAcademicYears
                                                }
                                                className="
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-xl
                                                border
                                                border-slate-200
                                                text-slate-500
                                                transition
                                                hover:bg-slate-50
                                                disabled:opacity-50
                                                dark:border-slate-700
                                                dark:hover:bg-slate-800
                                            "
                                                title="Refresh"
                                            >
                                                <RefreshCw
                                                    size={17}
                                                    className={
                                                        loadingAcademicYears
                                                            ? "animate-spin"
                                                            : ""
                                                    }
                                                />
                                            </button>


                                            <button
                                                type="button"
                                                onClick={
                                                    openCreateAcademicYear
                                                }
                                                className="
                                                inline-flex
                                                items-center
                                                gap-2
                                                rounded-xl
                                                bg-primary
                                                px-4
                                                py-2.5
                                                text-sm
                                                font-semibold
                                                text-white
                                                transition
                                                hover:opacity-90
                                            "
                                            >
                                                <Plus
                                                    size={17}
                                                />

                                                Add Academic Year
                                            </button>

                                        </div>

                                    </div>


                                    {academicYearError && (
                                        <div className="p-5">

                                            <ErrorBox
                                                message={
                                                    academicYearError
                                                }
                                                onRetry={() =>
                                                    selectedUniversityId &&
                                                    loadAcademicYears(
                                                        selectedUniversityId
                                                    )
                                                }
                                            />

                                        </div>
                                    )}


                                    {loadingAcademicYears && (
                                        <AcademicYearSkeleton />
                                    )}


                                    {!loadingAcademicYears &&
                                        !academicYearError &&
                                        academicYears.length ===
                                        0 && (

                                            <EmptyState
                                                icon={
                                                    GraduationCap
                                                }
                                                title="No academic years found."
                                                description="
                                                Create an academic year
                                                for this university to
                                                start managing schools.
                                            "
                                            />
                                        )}


                                    {!loadingAcademicYears &&
                                        !academicYearError &&
                                        academicYears.length >
                                        0 && (

                                            <div className="
                                            divide-y
                                            divide-slate-100
                                            dark:divide-slate-800
                                        ">

                                                {academicYears.map(
                                                    (
                                                        year
                                                    ) => (

                                                        <AcademicYearRow
                                                            key={
                                                                year.id
                                                            }
                                                            year={
                                                                year
                                                            }
                                                            selected={
                                                                year.id ===
                                                                selectedAcademicYearId
                                                            }
                                                            switching={
                                                                switchingAcademicYearId ===
                                                                year.id
                                                            }
                                                            onSelect={() =>
                                                                handleAcademicYearChange(
                                                                    String(
                                                                        year.id
                                                                    )
                                                                )
                                                            }
                                                            onEdit={() =>
                                                                openEditAcademicYear(
                                                                    year
                                                                )
                                                            }
                                                            onDelete={() =>
                                                                openAcademicYearDelete(
                                                                    year
                                                                )
                                                            }
                                                            onMakeCurrent={() =>
                                                                handleSwitchAcademicYear(
                                                                    year
                                                                )
                                                            }
                                                        />

                                                    )
                                                )}

                                            </div>
                                        )}

                                </section>
                            )}


                        {/* SCHOOLS */}

                        {selectedUniversityId !==
                            null &&
                            selectedAcademicYearId !==
                            null && (

                                <section className="
                                overflow-hidden
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                shadow-sm
                                dark:border-slate-800
                                dark:bg-slate-900
                            ">

                                    <div className="
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
                                ">

                                        <div>

                                            <div className="
                                            flex
                                            flex-wrap
                                            items-center
                                            gap-2
                                        ">

                                                <Building2
                                                    size={20}
                                                    className="text-primary"
                                                />

                                                <h2 className="
                                                text-lg
                                                font-bold
                                                text-slate-900
                                                dark:text-white
                                            ">
                                                    Schools
                                                </h2>


                                                {selectedAcademicYear && (
                                                    <span className="
                                                    rounded-full
                                                    bg-primary/10
                                                    px-2.5
                                                    py-1
                                                    text-xs
                                                    font-semibold
                                                    text-primary
                                                ">
                                                        {
                                                            selectedAcademicYear.name
                                                        }
                                                    </span>
                                                )}

                                            </div>


                                            <p className="
                                            mt-1
                                            text-xs
                                            text-slate-500
                                        ">
                                                Schools for Academic Year:{" "}
                                                <span className="font-medium">
                                                    {
                                                        selectedAcademicYear?.name
                                                    }
                                                </span>
                                            </p>

                                        </div>


                                        <div className="
                                        flex
                                        flex-col
                                        gap-2
                                        sm:flex-row
                                    ">

                                            <input
                                                type="text"
                                                value={
                                                    schoolSearch
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSchoolSearch(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Search schools..."
                                                className="
                                                h-10
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-3
                                                text-sm
                                                outline-none
                                                focus:border-primary
                                                dark:border-slate-700
                                                dark:bg-slate-950
                                                dark:text-white
                                            "
                                            />


                                            <button
                                                type="button"
                                                onClick={
                                                    openCreateSchool
                                                }
                                                className="
                                                inline-flex
                                                h-10
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-xl
                                                bg-primary
                                                px-4
                                                text-sm
                                                font-semibold
                                                text-white
                                                hover:opacity-90
                                            "
                                            >
                                                <Plus
                                                    size={17}
                                                />

                                                Add School
                                            </button>

                                        </div>

                                    </div>


                                    {filteredSchools.length ===
                                        0 && (

                                            <EmptyState
                                                icon={
                                                    Building2
                                                }
                                                title={
                                                    schoolSearch
                                                        ? "No matching schools."
                                                        : "No schools found for this academic year."
                                                }
                                                description={
                                                    schoolSearch
                                                        ? "Try another search term."
                                                        : "Create a school for the selected academic year."
                                                }
                                            />
                                        )}


                                    {filteredSchools.length >
                                        0 && (

                                            <div className="
                                        overflow-x-auto
                                    ">

                                                <table className="
                                            w-full
                                            min-w-[800px]
                                        ">

                                                    <thead>

                                                        <tr className="
                                                    border-b
                                                    border-slate-200
                                                    bg-slate-50/70
                                                    text-left
                                                    dark:border-slate-800
                                                    dark:bg-slate-950/40
                                                ">

                                                            <th className="
                                                        px-5
                                                        py-3.5
                                                        text-xs
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-500
                                                    ">
                                                                School
                                                            </th>


                                                            <th className="
                                                        px-5
                                                        py-3.5
                                                        text-xs
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-500
                                                    ">
                                                                Code
                                                            </th>


                                                            <th className="
                                                        px-5
                                                        py-3.5
                                                        text-xs
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-500
                                                    ">
                                                                Dean
                                                            </th>


                                                            <th className="
                                                        px-5
                                                        py-3.5
                                                        text-right
                                                        text-xs
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-500
                                                    ">
                                                                Actions
                                                            </th>

                                                        </tr>

                                                    </thead>


                                                    <tbody>

                                                        {filteredSchools.map(
                                                            (
                                                                school
                                                            ) => (

                                                                <SchoolRow
                                                                    key={
                                                                        school.id
                                                                    }
                                                                    onView={() =>
                                                                        navigate(
                                                                            `${baseUrl}/departments/?schoolId=${school.id}`
                                                                        )
                                                                    }
                                                                    school={
                                                                        school
                                                                    }
                                                                    onEdit={() =>
                                                                        openEditSchool(
                                                                            school
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        openSchoolDelete(
                                                                            school
                                                                        )
                                                                    }
                                                                />

                                                            )
                                                        )}

                                                    </tbody>

                                                </table>

                                            </div>
                                        )}

                                </section>
                            )}

                    </div>

                </main>

            </div>


            {/* =====================================================
                ACADEMIC YEAR MODAL
            ====================================================== */}

            {academicYearModalOpen && (
                <ModalOverlay>

                    <div className="
                        w-full
                        max-w-lg
                        overflow-hidden
                        rounded-2xl
                        bg-white
                        shadow-2xl
                        dark:bg-slate-900
                    ">

                        <ModalHeader
                            title={
                                editingAcademicYear
                                    ? "Edit Academic Year"
                                    : "Add Academic Year"
                            }
                            onClose={
                                closeAcademicYearModal
                            }
                        />


                        <form
                            onSubmit={
                                handleAcademicYearSubmit
                            }
                        >

                            <div className="
                                space-y-5
                                p-5
                            ">

                                <FormInput
                                    label="Name *"
                                    value={
                                        academicYearName
                                    }
                                    onChange={
                                        setAcademicYearName
                                    }
                                    placeholder="2026-2027"
                                />


                                <FormInput
                                    label="Code *"
                                    value={academicYearCode}
                                    onChange={(value) => {
                                        if (/^\d{0,2}$/.test(value)) {
                                            setAcademicYearCode(value);
                                        }
                                    }}
                                    placeholder="26"
                                />


                                <div className="
                                    grid
                                    grid-cols-1
                                    gap-4
                                    sm:grid-cols-2
                                ">

                                    <FormInput
                                        label="Start Date *"
                                        type="date"
                                        value={
                                            academicYearStartDate
                                        }
                                        onChange={
                                            setAcademicYearStartDate
                                        }
                                    />


                                    <FormInput
                                        label="End Date *"
                                        type="date"
                                        value={
                                            academicYearEndDate
                                        }
                                        onChange={
                                            setAcademicYearEndDate
                                        }
                                    />

                                </div>


                                <label className="
                                    flex
                                    cursor-pointer
                                    items-center
                                    gap-3
                                ">

                                    <input
                                        type="checkbox"
                                        checked={
                                            academicYearActive
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setAcademicYearActive(
                                                event.target.checked
                                            )
                                        }
                                        className="
                                            h-4
                                            w-4
                                            rounded
                                            border-slate-300
                                            text-primary
                                            focus:ring-primary
                                        "
                                    />

                                    <span className="
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        dark:text-slate-300
                                    ">
                                        Active
                                    </span>

                                </label>


                                {academicYearFormError && (
                                    <ErrorMessage
                                        message={
                                            academicYearFormError
                                        }
                                    />
                                )}

                            </div>


                            <ModalFooter>

                                <button
                                    type="button"
                                    onClick={
                                        closeAcademicYearModal
                                    }
                                    disabled={
                                        academicYearSubmitting
                                    }
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        dark:border-slate-700
                                        dark:text-slate-300
                                    "
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        academicYearSubmitting
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-xl
                                        bg-primary
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        disabled:opacity-50
                                    "
                                >

                                    {academicYearSubmitting && (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {editingAcademicYear
                                        ? "Update Academic Year"
                                        : "Create Academic Year"}

                                </button>

                            </ModalFooter>

                        </form>

                    </div>

                </ModalOverlay>
            )}


            {/* =====================================================
                ACADEMIC YEAR DELETE
            ====================================================== */}

            {deleteAcademicYearOpen &&
                academicYearToDelete && (

                    <ConfirmModal
                        title="Delete Academic Year"
                        message={`Are you sure you want to delete ${academicYearToDelete.name}?`}
                        dangerText="This action cannot be undone."
                        loading={
                            deletingAcademicYear
                        }
                        onCancel={() =>
                            setDeleteAcademicYearOpen(
                                false
                            )
                        }
                        onConfirm={
                            handleAcademicYearDelete
                        }
                    />
                )}


            {/* =====================================================
                SCHOOL MODAL
            ====================================================== */}

            {schoolModalOpen && (
                <ModalOverlay>

                    <div className="
                        w-full
                        max-w-lg
                        overflow-hidden
                        rounded-2xl
                        bg-white
                        shadow-2xl
                        dark:bg-slate-900
                    ">

                        <ModalHeader
                            title={
                                editingSchool
                                    ? "Edit School"
                                    : "Add School"
                            }
                            onClose={
                                closeSchoolModal
                            }
                        />


                        <form
                            onSubmit={
                                handleSchoolSubmit
                            }
                        >

                            <div className="
                                space-y-5
                                p-5
                            ">

                                <FormInput
                                    label="School Name *"
                                    value={
                                        schoolName
                                    }
                                    onChange={
                                        setSchoolName
                                    }
                                    placeholder="School of Engineering"
                                />


                                <FormInput
                                    label="School Code *"
                                    value={
                                        schoolCode
                                    }
                                    onChange={
                                        setSchoolCode
                                    }
                                    placeholder="SOE"
                                />


                                <div>

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        dark:text-slate-300
                                    ">
                                        Dean
                                    </label>


                                    <select
                                        value={
                                            selectedDeanId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedDeanId(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loadingTeachers
                                        }
                                        className="
                                            h-11
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            outline-none
                                            focus:border-primary
                                            focus:ring-2
                                            focus:ring-primary/10
                                            disabled:opacity-60
                                            dark:border-slate-700
                                            dark:bg-slate-950
                                            dark:text-white
                                        "
                                    >

                                        <option value="">
                                            {loadingTeachers
                                                ? "Loading teachers..."
                                                : "Not Assigned"}
                                        </option>


                                        {!loadingTeachers &&
                                            teachers.map(
                                                (
                                                    teacher
                                                ) => (

                                                    <option
                                                        key={
                                                            teacher.id
                                                        }
                                                        value={
                                                            teacher.id
                                                        }
                                                    >
                                                        {
                                                            teacher.name
                                                        }{" "}
                                                        (
                                                        {
                                                            teacher.code
                                                        }
                                                        )
                                                    </option>

                                                )
                                            )}

                                    </select>


                                    <p className="
                                        mt-1.5
                                        text-xs
                                        text-slate-500
                                    ">
                                        Select a teacher
                                        to assign as
                                        School Dean.
                                    </p>

                                </div>


                                {schoolFormError && (
                                    <ErrorMessage
                                        message={
                                            schoolFormError
                                        }
                                    />
                                )}

                            </div>


                            <ModalFooter>

                                <button
                                    type="button"
                                    onClick={
                                        closeSchoolModal
                                    }
                                    disabled={
                                        schoolSubmitting
                                    }
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        dark:border-slate-700
                                        dark:text-slate-300
                                    "
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        schoolSubmitting
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-xl
                                        bg-primary
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        disabled:opacity-50
                                    "
                                >

                                    {schoolSubmitting && (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {editingSchool
                                        ? "Update School"
                                        : "Create School"}

                                </button>

                            </ModalFooter>

                        </form>

                    </div>

                </ModalOverlay>
            )}


            {/* =====================================================
                SCHOOL DELETE
            ====================================================== */}

            {deleteSchoolOpen &&
                schoolToDelete && (

                    <ConfirmModal
                        title="Delete School"
                        message={`Are you sure you want to delete ${schoolToDelete.name}?`}
                        dangerText="This action cannot be undone."
                        loading={
                            deletingSchool
                        }
                        onCancel={() =>
                            setDeleteSchoolOpen(
                                false
                            )
                        }
                        onConfirm={
                            handleSchoolDelete
                        }
                    />
                )}


            {/* =====================================================
                FLOATING COPILOT
            ====================================================== */}

            {!chatOpen && (

                <button
                    type="button"
                    onClick={() =>
                        setChatOpen(true)
                    }
                    aria-label="Open AI Administrator Copilot"
                    className="
                        fixed
                        bottom-5
                        right-5
                        z-40
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-full
                        bg-gradient-to-r
                        from-primary
                        to-secondary
                        text-white
                        shadow-xl
                        transition-transform
                        duration-200
                        hover:scale-105
                        active:scale-95
                        md:bottom-6
                        md:right-6
                        md:h-16
                        md:w-16
                    "
                >
                    <Users
                        size={26}
                        className="md:h-7 md:w-7"
                    />
                </button>
            )}


            {chatOpen && (
                <>

                    <div
                        className="
                            fixed
                            inset-0
                            z-40
                            bg-black/40
                            backdrop-blur-[1px]
                        "
                        onClick={() =>
                            setChatOpen(false)
                        }
                    />


                    <div className="
                        fixed
                        bottom-4
                        left-4
                        right-4
                        z-50
                        h-[75vh]
                        max-h-[700px]
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        shadow-2xl
                        sm:bottom-6
                        sm:left-auto
                        sm:right-6
                        sm:w-[420px]
                        md:rounded-3xl
                        dark:border-slate-700
                        dark:bg-slate-900
                    ">

                        <div className="
                            flex
                            h-[72px]
                            items-center
                            justify-between
                            border-b
                            border-slate-200
                            px-4
                            md:px-5
                            dark:border-slate-700
                        ">

                            <div>

                                <h2 className="
                                    font-bold
                                    text-slate-900
                                    dark:text-white
                                ">
                                    AI Administrator Copilot
                                </h2>

                                <p className="
                                    mt-0.5
                                    text-xs
                                    text-slate-500
                                ">
                                    Ask anything.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setChatOpen(false)
                                }
                                aria-label="Close AI Copilot"
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-lg
                                    hover:bg-slate-100
                                    dark:hover:bg-slate-800
                                "
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <div className="
                            h-[calc(100%-72px)]
                        ">
                            <Copilot />
                        </div>

                    </div>

                </>
            )}

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Academic Year Row
|--------------------------------------------------------------------------
*/

function AcademicYearRow({
    year,
    selected,
    switching,
    onSelect,
    onEdit,
    onDelete,
    onMakeCurrent,
}: {
    year: AcademicYearResponse;
    selected: boolean;
    switching: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onMakeCurrent: () => void;
}) {

    return (
        <div
            className={`
                cursor-pointer
                p-5
                transition
                ${selected
                    ? "bg-primary/[0.035]"
                    : "hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                }
            `}
            onClick={onSelect}
        >

            <div className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-center
                lg:justify-between
            ">

                <div className="
                    flex
                    min-w-0
                    items-center
                    gap-4
                ">

                    <div className={`
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${selected
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        }
                    `}>
                        <GraduationCap
                            size={20}
                        />
                    </div>


                    <div className="min-w-0">

                        <div className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                        ">

                            <h3 className="
                                font-semibold
                                text-slate-900
                                dark:text-white
                            ">
                                {year.name}
                            </h3>


                            <span className="
                                rounded-md
                                bg-slate-100
                                px-2
                                py-0.5
                                text-xs
                                font-medium
                                text-slate-500
                                dark:bg-slate-800
                            ">
                                {year.code}
                            </span>


                            {year.current && (
                                <span className="
                                    rounded-full
                                    bg-emerald-100
                                    px-2.5
                                    py-1
                                    text-[11px]
                                    font-semibold
                                    text-emerald-700
                                    dark:bg-emerald-950/50
                                    dark:text-emerald-400
                                ">
                                    Current
                                </span>
                            )}


                            {!year.current &&
                                year.active && (
                                    <span className="
                                        rounded-full
                                        bg-blue-100
                                        px-2.5
                                        py-1
                                        text-[11px]
                                        font-semibold
                                        text-blue-700
                                        dark:bg-blue-950/50
                                        dark:text-blue-400
                                    ">
                                        Active
                                    </span>
                                )}

                        </div>


                        <p className="
                            mt-1.5
                            text-xs
                            text-slate-500
                        ">
                            {formatDate(
                                year.startDate
                            )}{" "}
                            →{" "}
                            {formatDate(
                                year.endDate
                            )}
                            {" • "}
                            {year.schoolResponse
                                ?.length || 0}{" "}
                            schools
                        </p>

                    </div>

                </div>


                <div
                    className="
                        flex
                        items-center
                        gap-1.5
                        lg:shrink-0
                    "
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >

                    {!year.current && (
                        <button
                            type="button"
                            onClick={
                                onMakeCurrent
                            }
                            disabled={
                                switching
                            }
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-emerald-200
                                px-3
                                py-2
                                text-xs
                                font-semibold
                                text-emerald-600
                                hover:bg-emerald-50
                                disabled:opacity-50
                                dark:border-emerald-900
                                dark:hover:bg-emerald-950/40
                            "
                        >

                            {switching ? (
                                <Loader2
                                    size={14}
                                    className="animate-spin"
                                />
                            ) : (
                                <Check
                                    size={14}
                                />
                            )}

                            Make Current

                        </button>
                    )}


                    <button
                        type="button"
                        onClick={onEdit}
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            hover:bg-slate-100
                            hover:text-primary
                            dark:hover:bg-slate-800
                        "
                        title="Edit"
                    >
                        <Edit3 size={16} />
                    </button>


                    <button
                        type="button"
                        onClick={onDelete}
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            hover:bg-red-50
                            hover:text-red-500
                            dark:hover:bg-red-950/40
                        "
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>


                    <button
                        type="button"
                        onClick={onSelect}
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            hover:bg-slate-100
                            hover:text-primary
                            dark:hover:bg-slate-800
                        "
                        title="View Schools"
                    >
                        <ArrowRight size={17} />
                    </button>

                </div>

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| School Row
|--------------------------------------------------------------------------
*/

function SchoolRow({
    school,
    onView,
    onEdit,
    onDelete,
}: {
    school: SchoolResponse;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {

    return (
        <tr className="
            border-b
            border-slate-100
            transition
            hover:bg-slate-50/70
            dark:border-slate-800
            dark:hover:bg-slate-800/30
        ">

            <td className="px-5 py-4">

                <div className="
                    flex
                    items-center
                    gap-3
                ">

                    <div className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-primary/10
                        text-primary
                    ">
                        <Building2
                            size={18}
                        />
                    </div>


                    <div>

                        <p className="
                            font-semibold
                            text-slate-900
                            dark:text-white
                        ">
                            {school.name}
                        </p>

                        <p className="
                            mt-0.5
                            text-xs
                            text-slate-400
                        ">
                            ID: {school.id}
                        </p>

                    </div>

                </div>

            </td>


            <td className="px-5 py-4">

                <span className="
                    rounded-lg
                    bg-slate-100
                    px-2.5
                    py-1.5
                    text-xs
                    font-semibold
                    text-slate-600
                    dark:bg-slate-800
                    dark:text-slate-300
                ">
                    {school.code}
                </span>

            </td>


            <td className="px-5 py-4">

                {school.dean ? (

                    <div>

                        <p className="
                            font-medium
                            text-slate-800
                            dark:text-slate-200
                        ">
                            {school.dean.name}
                        </p>

                        <p className="
                            mt-0.5
                            text-xs
                            text-slate-400
                        ">
                            {school.dean.code}
                        </p>

                    </div>

                ) : (

                    <span className="
                        rounded-full
                        bg-slate-100
                        px-2.5
                        py-1
                        text-xs
                        font-medium
                        text-slate-500
                        dark:bg-slate-800
                    ">
                        Not Assigned
                    </span>
                )}

            </td>


            <td className="px-5 py-4">

                <div className="
                    flex
                    justify-end
                    gap-1
                ">
                    <button
                        type="button"
                        onClick={onView}
                        title="View School"
                        className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-lg
        text-slate-400
        hover:bg-slate-100
        hover:text-primary
        dark:hover:bg-slate-800
    "
                    >
                        <Eye size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={onEdit}
                        title="Edit School"
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            hover:bg-slate-100
                            hover:text-primary
                            dark:hover:bg-slate-800
                        "
                    >
                        <Edit3 size={16} />
                    </button>


                    <button
                        type="button"
                        onClick={onDelete}
                        title="Delete School"
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            hover:bg-red-50
                            hover:text-red-500
                            dark:hover:bg-red-950/40
                        "
                    >
                        <Trash2 size={16} />
                    </button>

                </div>

            </td>

        </tr>
    );
}


/*
|--------------------------------------------------------------------------
| Modal Overlay
|--------------------------------------------------------------------------
*/

function ModalOverlay({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
            backdrop-blur-sm
        ">
            {children}
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Modal Header
|--------------------------------------------------------------------------
*/

function ModalHeader({
    title,
    onClose,
}: {
    title: string;
    onClose: () => void;
}) {

    return (
        <div className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            px-5
            py-4
            dark:border-slate-800
        ">

            <h2 className="
                text-lg
                font-bold
                text-slate-900
                dark:text-white
            ">
                {title}
            </h2>


            <button
                type="button"
                onClick={onClose}
                className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                    dark:hover:bg-slate-800
                "
            >
                <X size={19} />
            </button>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Modal Footer
|--------------------------------------------------------------------------
*/

function ModalFooter({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="
            flex
            items-center
            justify-end
            gap-3
            border-t
            border-slate-200
            px-5
            py-4
            dark:border-slate-800
        ">
            {children}
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Form Input
|--------------------------------------------------------------------------
*/

function FormInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (
        value: string
    ) => void;
    placeholder?: string;
    type?: string;
}) {

    return (
        <div>

            <label className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-700
                dark:text-slate-300
            ">
                {label}
            </label>


            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
                placeholder={
                    placeholder
                }
                className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3
                    text-sm
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-primary
                    focus:ring-2
                    focus:ring-primary/10
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-white
                "
            />

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Error Message
|--------------------------------------------------------------------------
*/

function ErrorMessage({
    message,
}: {
    message: string;
}) {

    return (
        <div className="
            flex
            items-center
            gap-2
            text-xs
            text-red-500
        ">
            <AlertCircle size={14} />
            {message}
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Error Box
|--------------------------------------------------------------------------
*/

function ErrorBox({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) {

    return (
        <div className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
            dark:border-red-900
            dark:bg-red-950/30
        ">

            <div className="
                flex
                items-start
                gap-3
            ">

                <AlertCircle
                    size={18}
                    className="
                        mt-0.5
                        shrink-0
                        text-red-500
                    "
                />


                <div>

                    <p className="
                        text-sm
                        font-medium
                        text-red-700
                        dark:text-red-400
                    ">
                        {message}
                    </p>


                    {onRetry && (
                        <button
                            type="button"
                            onClick={
                                onRetry
                            }
                            className="
                                mt-2
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                font-semibold
                                text-red-600
                            "
                        >
                            <RefreshCw
                                size={13}
                            />
                            Try Again
                        </button>
                    )}

                </div>

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: any;
    title: string;
    description: string;
}) {

    return (
        <div className="
            flex
            flex-col
            items-center
            justify-center
            px-6
            py-16
            text-center
        ">

            <div className="
                mb-4
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-400
                dark:bg-slate-800
            ">
                <Icon size={24} />
            </div>


            <h3 className="
                text-sm
                font-semibold
                text-slate-900
                dark:text-white
            ">
                {title}
            </h3>


            <p className="
                mt-1
                max-w-md
                text-xs
                leading-5
                text-slate-500
            ">
                {description}
            </p>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Academic Year Skeleton
|--------------------------------------------------------------------------
*/

function AcademicYearSkeleton() {

    return (
        <div className="
            divide-y
            divide-slate-100
            dark:divide-slate-800
        ">

            {Array.from({
                length: 3,
            }).map(
                (_, index) => (

                    <div
                        key={index}
                        className="
                            flex
                            items-center
                            gap-4
                            p-5
                        "
                    >

                        <div className="
                            h-11
                            w-11
                            animate-pulse
                            rounded-xl
                            bg-slate-200
                            dark:bg-slate-800
                        " />


                        <div className="
                            flex-1
                            space-y-2
                        ">

                            <div className="
                                h-4
                                w-48
                                animate-pulse
                                rounded
                                bg-slate-200
                                dark:bg-slate-800
                            " />

                            <div className="
                                h-3
                                w-64
                                animate-pulse
                                rounded
                                bg-slate-200
                                dark:bg-slate-800
                            " />

                        </div>

                    </div>
                )
            )}

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Confirm Modal
|--------------------------------------------------------------------------
*/

function ConfirmModal({
    title,
    message,
    dangerText,
    loading,
    onCancel,
    onConfirm,
}: {
    title: string;
    message: string;
    dangerText?: string;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {

    return (
        <ModalOverlay>

            <div className="
                w-full
                max-w-md
                overflow-hidden
                rounded-2xl
                bg-white
                shadow-2xl
                dark:bg-slate-900
            ">

                <div className="
                    p-6
                ">

                    <div className="
                        mb-4
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        bg-red-100
                        text-red-600
                        dark:bg-red-950/50
                        dark:text-red-400
                    ">
                        <Trash2 size={20} />
                    </div>


                    <h2 className="
                        text-lg
                        font-bold
                        text-slate-900
                        dark:text-white
                    ">
                        {title}
                    </h2>


                    <p className="
                        mt-2
                        text-sm
                        leading-6
                        text-slate-500
                        dark:text-slate-400
                    ">
                        {message}
                    </p>


                    {dangerText && (
                        <p className="
                            mt-2
                            text-xs
                            font-medium
                            text-red-500
                        ">
                            {dangerText}
                        </p>
                    )}

                </div>


                <ModalFooter>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="
                            rounded-xl
                            border
                            border-slate-200
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-slate-700
                            dark:border-slate-700
                            dark:text-slate-300
                        "
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-red-600
                            px-4
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            disabled:opacity-50
                        "
                    >

                        {loading && (
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />
                        )}

                        Delete

                    </button>

                </ModalFooter>

            </div>

        </ModalOverlay>
    );
}