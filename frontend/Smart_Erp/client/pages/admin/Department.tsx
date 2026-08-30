import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    Building2,
    Check,
    ChevronDown,
    Edit3,
    GraduationCap,
    Loader2,
    MessageCircle,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Eye,
    X,
} from "lucide-react";

import {
    useSearchParams,
} from "react-router-dom";

import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";
import { useNavigate } from "react-router-dom";

import {
    useAuth,
} from "@/services/authContext";

import {
    getBaseUrl,
} from "@/services/authutil";

const baseUrl = getBaseUrl();


const UNIVERSITY_FILTER_ALLOWED_ROLES: string[] = [
    "ROLE_ADMIN",
];


const ACADEMIC_YEAR_FILTER_ALLOWED_ROLES: string[] = [
    "ROLE_ADMIN",
    "ROLE_DEAN",
];


const SCHOOL_FILTER_ALLOWED_ROLES: string[] = [
    "ROLE_ADMIN",
    "ROLE_DEAN",
    "ROLE_SCHOOL_DEAN",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/


const hasRolePermission = (
    role: string | null | undefined,
    allowedRoles: string[]
): boolean => {

    if (!role) {
        return false;
    }

    return allowedRoles.includes(role);
};


const parseId = (
    value: string | null
): number | null => {

    if (!value) {
        return null;
    }

    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
};

import {
    CommonDTO,
    DepartmentResponse,
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getUniversities,
    getAcademicYears,
    getSchools,
    getTeachers,
} from "@/services/admin/departmentService";
/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/


export default function Department() {

    const navigate = useNavigate();
    const {
        role,
    } = useAuth();


    const [
        searchParams,
    ] = useSearchParams();


    /*
    |--------------------------------------------------------------------------
    | URL OPENING CONTEXT
    |--------------------------------------------------------------------------
    |
    | Supported:
    |
    | /department
    |
    | /department?schoolId=10
    |
    | /department?schoolId=10&departmentId=3
    |
    */


    const directSchoolId =
        parseId(
            searchParams.get(
                "schoolId"
            )
        );


    const directDepartmentId =
        parseId(
            searchParams.get(
                "departmentId"
            )
        );


    /*
    |--------------------------------------------------------------------------
    | Filter permissions
    |--------------------------------------------------------------------------
    */


    const canUseUniversityFilter =
        hasRolePermission(
            role,
            UNIVERSITY_FILTER_ALLOWED_ROLES
        );


    const canUseAcademicYearFilter =
        hasRolePermission(
            role,
            ACADEMIC_YEAR_FILTER_ALLOWED_ROLES
        );


    const canUseSchoolFilter =
        hasRolePermission(
            role,
            SCHOOL_FILTER_ALLOWED_ROLES
        );


    /*
    |--------------------------------------------------------------------------
    | Direct School Opening
    |--------------------------------------------------------------------------
    |
    | If schoolId exists in URL:
    |
    | - school is fixed
    | - school filter is hidden
    | - departments are loaded directly
    |
    */


    const isDirectSchoolOpening =
        directSchoolId !== null;


    /*
    |--------------------------------------------------------------------------
    | Layout State
    |--------------------------------------------------------------------------
    */


    const [
        sidebarOpen,
        setSidebarOpen,
    ] = useState(false);


    const [
        chatOpen,
        setChatOpen,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | University
    |--------------------------------------------------------------------------
    */


    const [
        universities,
        setUniversities,
    ] = useState<CommonDTO[]>([]);


    const [
        selectedUniversityId,
        setSelectedUniversityId,
    ] = useState<number | null>(
        null
    );


    const [
        loadingUniversities,
        setLoadingUniversities,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Academic Year
    |--------------------------------------------------------------------------
    */


    const [
        academicYears,
        setAcademicYears,
    ] = useState<CommonDTO[]>([]);


    const [
        selectedAcademicYearId,
        setSelectedAcademicYearId,
    ] = useState<number | null>(
        null
    );


    const [
        loadingAcademicYears,
        setLoadingAcademicYears,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | School
    |--------------------------------------------------------------------------
    */


    const [
        schools,
        setSchools,
    ] = useState<CommonDTO[]>([]);


    const [
        selectedSchoolId,
        setSelectedSchoolId,
    ] = useState<number | null>(
        directSchoolId
    );


    const [
        loadingSchools,
        setLoadingSchools,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Department
    |--------------------------------------------------------------------------
    */


    const [
        departments,
        setDepartments,
    ] = useState<DepartmentResponse[]>([]);


    const [
        selectedDepartmentId,
        setSelectedDepartmentId,
    ] = useState<number | null>(
        directDepartmentId
    );


    const [
        loadingDepartments,
        setLoadingDepartments,
    ] = useState(false);


    const [
        departmentError,
        setDepartmentError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */


    const [
        search,
        setSearch,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Department Modal
    |--------------------------------------------------------------------------
    */


    const [
        departmentModalOpen,
        setDepartmentModalOpen,
    ] = useState(false);


    const [
        editingDepartment,
        setEditingDepartment,
    ] = useState<
        DepartmentResponse | null
    >(null);


    const [
        departmentName,
        setDepartmentName,
    ] = useState("");


    const [
        departmentCode,
        setDepartmentCode,
    ] = useState("");


    const [
        selectedHodId,
        setSelectedHodId,
    ] = useState("");


    const [
        teachers,
        setTeachers,
    ] = useState<CommonDTO[]>([]);


    const [
        loadingTeachers,
        setLoadingTeachers,
    ] = useState(false);


    const [
        departmentSubmitting,
        setDepartmentSubmitting,
    ] = useState(false);


    const [
        departmentFormError,
        setDepartmentFormError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */


    const [
        deleteModalOpen,
        setDeleteModalOpen,
    ] = useState(false);


    const [
        departmentToDelete,
        setDepartmentToDelete,
    ] = useState<
        DepartmentResponse | null
    >(null);


    const [
        deleting,
        setDeleting,
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
        type: "success" | "error";
        message: string;
    } | null>(null);


    /*
    |--------------------------------------------------------------------------
    | Load Universities
    |--------------------------------------------------------------------------
    |
    | Only load this filter if:
    |
    | 1. No direct schoolId
    | 2. Current role is allowed
    |
    */


    useEffect(() => {

        if (
            isDirectSchoolOpening
        ) {
            return;
        }


        if (
            !canUseUniversityFilter
        ) {
            return;
        }


        const load =
            async () => {

                try {

                    setLoadingUniversities(
                        true
                    );


                    const data =
                        await getUniversities();


                    setUniversities(
                        data
                    );


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

                    setDepartmentError(
                        error?.message ||
                        "Failed to load universities."
                    );

                } finally {

                    setLoadingUniversities(
                        false
                    );
                }
            };


        load();

    }, [
        role,
        canUseUniversityFilter,
        isDirectSchoolOpening,
    ]);


    /*
    |--------------------------------------------------------------------------
    | When University Changes
    |--------------------------------------------------------------------------
    */


    useEffect(() => {

        if (
            isDirectSchoolOpening
        ) {
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | If university filter is not available,
        | do not try to load academic years from it.
        |--------------------------------------------------------------------------
        */

        if (
            !canUseUniversityFilter ||
            selectedUniversityId === null
        ) {
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Only academic-year filter roles need academic-year list.
        |--------------------------------------------------------------------------
        */

        if (
            !canUseAcademicYearFilter
        ) {
            return;
        }


        const load =
            async () => {

                try {

                    setLoadingAcademicYears(
                        true
                    );

                    setAcademicYears([]);

                    setSelectedAcademicYearId(
                        null
                    );

                    setSchools([]);

                    setSelectedSchoolId(
                        null
                    );

                    setDepartments([]);


                    const data =
                        await getAcademicYears(
                            selectedUniversityId
                        );


                    setAcademicYears(
                        data
                    );


                    if (
                        data.length > 0
                    ) {

                        setSelectedAcademicYearId(
                            data[0].id
                        );

                    }

                } catch (error: any) {

                    setDepartmentError(
                        error?.message ||
                        "Failed to load academic years."
                    );

                } finally {

                    setLoadingAcademicYears(
                        false
                    );
                }
            };


        load();

    }, [
        selectedUniversityId,
        canUseUniversityFilter,
        canUseAcademicYearFilter,
        isDirectSchoolOpening,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Load Schools
    |--------------------------------------------------------------------------
    |
    | School filter is only loaded when the role is allowed
    | to use it.
    |
    */


    useEffect(() => {

        if (
            isDirectSchoolOpening
        ) {
            return;
        }


        if (
            !canUseSchoolFilter
        ) {
            return;
        }


        if (
            selectedAcademicYearId === null
        ) {
            return;
        }


        const load =
            async () => {

                try {

                    setLoadingSchools(
                        true
                    );

                    setSchools([]);

                    setSelectedSchoolId(
                        null
                    );

                    setDepartments([]);


                    const data =
                        await getSchools(
                            selectedAcademicYearId
                        );


                    setSchools(
                        data
                    );


                    if (
                        data.length > 0
                    ) {

                        setSelectedSchoolId(
                            data[0].id
                        );
                    }

                } catch (error: any) {

                    setDepartmentError(
                        error?.message ||
                        "Failed to load schools."
                    );

                } finally {

                    setLoadingSchools(
                        false
                    );
                }
            };


        load();

    }, [
        selectedAcademicYearId,
        canUseSchoolFilter,
        isDirectSchoolOpening,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Direct School Opening
    |--------------------------------------------------------------------------
    |
    | If URL has schoolId, load departments immediately.
    |
    | This does NOT depend on any filter permission.
    |
    */


    useEffect(() => {

        if (
            directSchoolId === null
        ) {
            return;
        }


        setSelectedSchoolId(
            directSchoolId
        );


        const load =
            async () => {

                await loadDepartmentsForSchool(
                    directSchoolId,
                    directDepartmentId
                );
            };


        load();

    }, [
        directSchoolId,
        directDepartmentId,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Normal Department Loading
    |--------------------------------------------------------------------------
    */


    useEffect(() => {

        if (
            isDirectSchoolOpening
        ) {
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | If school filter is available,
        | selected school controls departments.
        |--------------------------------------------------------------------------
        */

        if (
            canUseSchoolFilter &&
            selectedSchoolId !== null
        ) {

            loadDepartmentsForSchool(
                selectedSchoolId,
                null
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | If school filter is NOT allowed, there is no way
        | to choose a school from this page.
        |
        | We intentionally do NOT show any fake filter/result
        | information.
        |
        | The backend department API requires schoolId.
        |--------------------------------------------------------------------------
        */

    }, [
        selectedSchoolId,
        canUseSchoolFilter,
        isDirectSchoolOpening,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Load Departments
    |--------------------------------------------------------------------------
    */


    const loadDepartmentsForSchool =
        async (
            schoolId: number,
            departmentId: number | null
        ) => {

            try {

                setLoadingDepartments(
                    true
                );

                setDepartmentError("");


                /*
                |--------------------------------------------------------------------------
                | Specific Department
                |--------------------------------------------------------------------------
                |
                | /department?schoolId=10&departmentId=3
                |
                */

                if (
                    departmentId !== null
                ) {

                    const data =
                        await getDepartmentById(
                            schoolId,
                            departmentId
                        );


                    setDepartments([
                        data,
                    ]);

                    setSelectedDepartmentId(
                        data.id
                    );

                } else {

                    /*
                    |--------------------------------------------------------------------------
                    | All Departments
                    |--------------------------------------------------------------------------
                    |
                    | /department/all?schoolId=10
                    |
                    */

                    const data =
                        await getAllDepartments(
                            schoolId
                        );


                    setDepartments(
                        data
                    );

                    setSelectedDepartmentId(
                        null
                    );
                }

            } catch (error: any) {

                setDepartments([]);

                setDepartmentError(
                    error?.message ||
                    "Failed to load departments."
                );

            } finally {

                setLoadingDepartments(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Filtered Departments
    |--------------------------------------------------------------------------
    */


    const filteredDepartments =
        useMemo(() => {

            const value =
                search
                    .trim()
                    .toLowerCase();


            if (!value) {
                return departments;
            }


            return departments.filter(
                (department) =>
                    department.name
                        ?.toLowerCase()
                        .includes(value) ||

                    department.code
                        ?.toLowerCase()
                        .includes(value) ||

                    department.hod?.name
                        ?.toLowerCase()
                        .includes(value)
            );

        }, [
            departments,
            search,
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

                setNotification(
                    null
                );

            }, 3500);
        };


    /*
    |--------------------------------------------------------------------------
    | Load Teachers
    |--------------------------------------------------------------------------
    */


    const loadTeachersForDepartment =
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
                        selectedUniversityId,
                        selectedSchoolId ||
                        undefined
                    );


                setTeachers(
                    data
                );

            } catch (error: any) {

                setDepartmentFormError(
                    error?.message ||
                    "Failed to load teachers."
                );

            } finally {

                setLoadingTeachers(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Open Create Department
    |--------------------------------------------------------------------------
    */


    const openCreateDepartment =
        async () => {

            if (
                selectedSchoolId === null
            ) {

                showNotification(
                    "error",
                    "Please select a school first."
                );

                return;
            }


            setEditingDepartment(
                null
            );

            setDepartmentName("");

            setDepartmentCode("");

            setSelectedHodId("");

            setDepartmentFormError("");

            setDepartmentModalOpen(
                true
            );


            await loadTeachersForDepartment();
        };


    /*
    |--------------------------------------------------------------------------
    | Open Edit Department
    |--------------------------------------------------------------------------
    */


    const openEditDepartment =
        async (
            department: DepartmentResponse
        ) => {

            setEditingDepartment(
                department
            );

            setDepartmentName(
                department.name || ""
            );

            setDepartmentCode(
                department.code || ""
            );

            setSelectedHodId(
                department.hod?.id
                    ? String(
                        department.hod.id
                    )
                    : ""
            );

            setDepartmentFormError("");

            setDepartmentModalOpen(
                true
            );


            await loadTeachersForDepartment();
        };


    /*
    |--------------------------------------------------------------------------
    | Close Department Modal
    |--------------------------------------------------------------------------
    */


    const closeDepartmentModal =
        () => {

            if (
                departmentSubmitting
            ) {
                return;
            }


            setDepartmentModalOpen(
                false
            );

            setEditingDepartment(
                null
            );

            setDepartmentFormError("");
        };


    /*
    |--------------------------------------------------------------------------
    | Save Department
    |--------------------------------------------------------------------------
    */


    const handleDepartmentSubmit =
        async (
            event: React.FormEvent
        ) => {

            event.preventDefault();


            if (
                selectedSchoolId === null
            ) {

                setDepartmentFormError(
                    "School is required."
                );

                return;
            }


            const name =
                departmentName.trim();


            const code =
                departmentCode.trim();


            if (!name) {

                setDepartmentFormError(
                    "Department name is required."
                );

                return;
            }


            if (!code) {

                setDepartmentFormError(
                    "Department code is required."
                );

                return;
            }


            try {

                setDepartmentSubmitting(
                    true
                );

                setDepartmentFormError("");


                if (
                    editingDepartment
                ) {

                    await updateDepartment(
                        selectedSchoolId,
                        {
                            id:
                                editingDepartment.id,
                            name,
                            code,
                            hodId:
                                selectedHodId
                                    ? Number(
                                        selectedHodId
                                    )
                                    : null,
                        }
                    );


                    showNotification(
                        "success",
                        "Department updated successfully."
                    );

                } else {

                    await createDepartment(
                        selectedSchoolId,
                        name,
                        code
                    );


                    showNotification(
                        "success",
                        "Department created successfully."
                    );
                }


                closeDepartmentModal();


                await loadDepartmentsForSchool(
                    selectedSchoolId,
                    null
                );

            } catch (error: any) {

                setDepartmentFormError(
                    error?.message ||
                    "Failed to save department."
                );

            } finally {

                setDepartmentSubmitting(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */


    const openDeleteDepartment =
        (
            department: DepartmentResponse
        ) => {

            setDepartmentToDelete(
                department
            );

            setDeleteModalOpen(
                true
            );
        };


    const handleDeleteDepartment =
        async () => {

            if (
                !departmentToDelete ||
                selectedSchoolId === null
            ) {
                return;
            }


            try {

                setDeleting(
                    true
                );


                await deleteDepartment(
                    selectedSchoolId,
                    departmentToDelete.id
                );


                setDeleteModalOpen(
                    false
                );

                setDepartmentToDelete(
                    null
                );


                showNotification(
                    "success",
                    "Department deleted successfully."
                );


                await loadDepartmentsForSchool(
                    selectedSchoolId,
                    null
                );

            } catch (error: any) {

                showNotification(
                    "error",
                    error?.message ||
                    "Failed to delete department."
                );

            } finally {

                setDeleting(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Selected Names
    |--------------------------------------------------------------------------
    */


    const selectedUniversity =
        universities.find(
            (item) =>
                item.id ===
                selectedUniversityId
        );


    const selectedAcademicYear =
        academicYears.find(
            (item) =>
                item.id ===
                selectedAcademicYearId
        );


    const selectedSchool =
        schools.find(
            (item) =>
                item.id ===
                selectedSchoolId
        );


    /*
    |--------------------------------------------------------------------------
    | Refresh
    |--------------------------------------------------------------------------
    */


    const handleRefresh =
        async () => {

            if (
                selectedSchoolId === null
            ) {
                return;
            }


            await loadDepartmentsForSchool(
                selectedSchoolId,
                isDirectSchoolOpening
                    ? directDepartmentId
                    : null
            );
        };


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


                        {/* =================================================
                            PAGE HEADER
                        ================================================== */}

                        <div className="
                            mb-6
                            flex
                            flex-col
                            gap-4
                            lg:flex-row
                            lg:items-end
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
                                    <Building2
                                        size={24}
                                    />
                                </div>


                                <div>

                                    <h1 className="
                                        text-2xl
                                        font-bold
                                        tracking-tight
                                        text-slate-900
                                        dark:text-white
                                    ">
                                        Departments
                                    </h1>


                                    <p className="
                                        mt-1
                                        text-sm
                                        text-slate-500
                                        dark:text-slate-400
                                    ">
                                        Manage departments
                                        and Heads of Department.
                                    </p>

                                </div>

                            </div>


                            {/* =================================================
                                FILTERS

                                IMPORTANT:
                                Only permitted filters are rendered.
                            ================================================== */}

                            {!isDirectSchoolOpening && (

                                <div className="
                                    flex
                                    flex-col
                                    gap-3
                                    md:flex-row
                                    md:flex-wrap
                                    md:items-end
                                ">


                                    {/* UNIVERSITY FILTER */}

                                    {canUseUniversityFilter && (

                                        <FilterSelect
                                            label="University"
                                            value={
                                                selectedUniversityId
                                                ?? ""
                                            }
                                            loading={
                                                loadingUniversities
                                            }
                                            options={
                                                universities
                                            }
                                            placeholder="Select university"
                                            onChange={(
                                                value
                                            ) => {

                                                setSelectedUniversityId(
                                                    value
                                                        ? Number(value)
                                                        : null
                                                );

                                            }}
                                        />
                                    )}


                                    {/* ACADEMIC YEAR FILTER */}

                                    {canUseAcademicYearFilter && (

                                        <FilterSelect
                                            label="Academic Year"
                                            value={
                                                selectedAcademicYearId
                                                ?? ""
                                            }
                                            loading={
                                                loadingAcademicYears
                                            }
                                            options={
                                                academicYears
                                            }
                                            placeholder="Select academic year"
                                            onChange={(
                                                value
                                            ) => {

                                                setSelectedAcademicYearId(
                                                    value
                                                        ? Number(value)
                                                        : null
                                                );

                                            }}
                                        />
                                    )}


                                    {/* SCHOOL FILTER */}

                                    {canUseSchoolFilter && (

                                        <FilterSelect
                                            label="School"
                                            value={
                                                selectedSchoolId
                                                ?? ""
                                            }
                                            loading={
                                                loadingSchools
                                            }
                                            options={
                                                schools
                                            }
                                            placeholder="Select school"
                                            onChange={(
                                                value
                                            ) => {

                                                setSelectedSchoolId(
                                                    value
                                                        ? Number(value)
                                                        : null
                                                );

                                            }}
                                        />
                                    )}

                                </div>
                            )}

                        </div>


                        {/* =================================================
                            DIRECT SCHOOL CONTEXT
                        ================================================== */}

                        {isDirectSchoolOpening && (
                            <div className="
                                mb-6
                                rounded-2xl
                                border
                                border-primary/10
                                bg-primary/[0.035]
                                px-4
                                py-3
                            ">

                                <div className="
                                    flex
                                    items-center
                                    gap-3
                                ">

                                    <Building2
                                        size={18}
                                        className="
                                            text-primary
                                        "
                                    />

                                    <div>

                                        <p className="
                                            text-xs
                                            font-medium
                                            text-slate-500
                                        ">
                                            School
                                        </p>

                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-slate-900
                                            dark:text-white
                                        ">
                                            {selectedSchool?.name ||
                                                `School #${directSchoolId}`}
                                        </p>

                                    </div>

                                </div>

                            </div>
                        )}


                        {/* =================================================
                            NOTIFICATION
                        ================================================== */}

                        {notification && (
                            <div className={`
                                mb-5
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


                        {/* =================================================
                            DEPARTMENT CARD
                        ================================================== */}

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


                            {/* CARD HEADER */}

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

                                        <h2 className="
                                            text-lg
                                            font-bold
                                            text-slate-900
                                            dark:text-white
                                        ">
                                            Department List
                                        </h2>


                                        {isDirectSchoolOpening &&
                                            directDepartmentId !==
                                            null && (
                                                <span className="
                                                    rounded-full
                                                    bg-primary/10
                                                    px-2.5
                                                    py-1
                                                    text-[11px]
                                                    font-semibold
                                                    text-primary
                                                ">
                                                    Direct Department
                                                </span>
                                            )}

                                    </div>


                                    <p className="
                                        mt-1
                                        text-xs
                                        text-slate-500
                                    ">
                                        {isDirectSchoolOpening
                                            ? directDepartmentId !== null
                                                ? "Showing the selected department."
                                                : "Showing departments for the selected school."
                                            : "Departments available for the selected school."}
                                    </p>

                                </div>


                                <div className="
                                    flex
                                    flex-col
                                    gap-2
                                    sm:flex-row
                                ">


                                    {/* SEARCH */}

                                    <div className="
                                        relative
                                    ">

                                        <Search
                                            size={16}
                                            className="
                                                absolute
                                                left-3
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-400
                                            "
                                        />

                                        <input
                                            type="text"
                                            value={
                                                search
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSearch(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Search departments..."
                                            className="
                                                h-10
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                pl-9
                                                pr-3
                                                text-sm
                                                outline-none
                                                focus:border-primary
                                                dark:border-slate-700
                                                dark:bg-slate-950
                                                dark:text-white
                                                sm:w-56
                                            "
                                        />

                                    </div>


                                    {/* REFRESH */}

                                    <button
                                        type="button"
                                        onClick={
                                            handleRefresh
                                        }
                                        disabled={
                                            loadingDepartments ||
                                            selectedSchoolId === null
                                        }
                                        className="
                                            flex
                                            h-10
                                            w-10
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            border
                                            border-slate-200
                                            text-slate-500
                                            hover:bg-slate-50
                                            disabled:opacity-50
                                            dark:border-slate-700
                                            dark:hover:bg-slate-800
                                        "
                                        title="Refresh"
                                    >

                                        <RefreshCw
                                            size={16}
                                            className={
                                                loadingDepartments
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />

                                    </button>


                                    {/* ADD */}

                                    <button
                                        type="button"
                                        onClick={
                                            openCreateDepartment
                                        }
                                        disabled={
                                            selectedSchoolId ===
                                            null
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
                                            disabled:cursor-not-allowed
                                            disabled:opacity-50
                                        "
                                    >

                                        <Plus
                                            size={17}
                                        />

                                        Add Department

                                    </button>

                                </div>

                            </div>


                            {/* =================================================
                                ERROR
                            ================================================== */}

                            {departmentError && (
                                <div className="
                                    p-5
                                ">

                                    <ErrorBox
                                        message={
                                            departmentError
                                        }
                                        onRetry={
                                            handleRefresh
                                        }
                                    />

                                </div>
                            )}


                            {/* =================================================
                                LOADING
                            ================================================== */}

                            {loadingDepartments && (
                                <DepartmentSkeleton />
                            )}


                            {/* =================================================
                                EMPTY
                            ================================================== */}

                            {!loadingDepartments &&
                                !departmentError &&
                                selectedSchoolId !== null &&
                                filteredDepartments.length ===
                                0 && (

                                    <EmptyState
                                        title={
                                            search
                                                ? "No departments found."
                                                : "No departments available."
                                        }
                                        description={
                                            search
                                                ? "Try another search term."
                                                : "There are no departments for the selected school."
                                        }
                                    />
                                )}


                            {/* =================================================
                                TABLE
                            ================================================== */}

                            {!loadingDepartments &&
                                !departmentError &&
                                filteredDepartments.length >
                                0 && (

                                    <div className="
                                        overflow-x-auto
                                    ">

                                        <table className="
                                            w-full
                                            min-w-[850px]
                                        ">

                                            <thead>

                                                <tr className="
                                                    border-b
                                                    border-slate-200
                                                    bg-slate-50/70
                                                    dark:border-slate-800
                                                    dark:bg-slate-950/40
                                                ">

                                                    <th className="
                                                        px-5
                                                        py-3.5
                                                        text-left
                                                        text-xs
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-500
                                                    ">
                                                        Department
                                                    </th>


                                                    <th className="
                                                        px-5
                                                        py-3.5
                                                        text-left
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
                                                        text-left
                                                        text-xs
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-500
                                                    ">
                                                        HOD
                                                    </th>


                                                    <th className="
                                                        px-5
                                                        py-3.5
                                                        text-left
                                                        text-xs
                                                        font-semibold
                                                        uppercase
                                                        tracking-wider
                                                        text-slate-500
                                                    ">
                                                        Courses
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

                                                {filteredDepartments.map(
                                                    (
                                                        department
                                                    ) => (

                                                        <DepartmentRow
                                                            key={
                                                                department.id
                                                            }
                                                            department={
                                                                department
                                                            }
                                                            onView={() =>
                                                                navigate(
                                                                    `${baseUrl}/courses/?departmentId=${department.id}`
                                                                )
                                                            }
                                                            onEdit={() =>
                                                                openEditDepartment(
                                                                    department
                                                                )
                                                            }
                                                            onDelete={() =>
                                                                openDeleteDepartment(
                                                                    department
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

                    </div>

                </main>

            </div>


            {/* =====================================================
                DEPARTMENT MODAL
            ====================================================== */}

            {departmentModalOpen && (
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
                                editingDepartment
                                    ? "Edit Department"
                                    : "Add Department"
                            }
                            onClose={
                                closeDepartmentModal
                            }
                        />


                        <form
                            onSubmit={
                                handleDepartmentSubmit
                            }
                        >

                            <div className="
                                space-y-5
                                p-5
                            ">

                                <FormInput
                                    label="Department Name *"
                                    value={
                                        departmentName
                                    }
                                    onChange={
                                        setDepartmentName
                                    }
                                    placeholder="Computer Science"
                                />


                                <FormInput
                                    label="Department Code *"
                                    value={
                                        departmentCode
                                    }
                                    onChange={
                                        setDepartmentCode
                                    }
                                    placeholder="CSE"
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
                                        Head of Department
                                    </label>


                                    <select
                                        value={
                                            selectedHodId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedHodId(
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
                                            disabled:opacity-50
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


                                        {teachers.map(
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
                                                    }
                                                    {teacher.code
                                                        ? ` (${teacher.code})`
                                                        : ""}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                {departmentFormError && (
                                    <ErrorMessage
                                        message={
                                            departmentFormError
                                        }
                                    />
                                )}

                            </div>


                            <ModalFooter>

                                <button
                                    type="button"
                                    onClick={
                                        closeDepartmentModal
                                    }
                                    disabled={
                                        departmentSubmitting
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
                                        departmentSubmitting
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

                                    {departmentSubmitting && (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {editingDepartment
                                        ? "Update Department"
                                        : "Create Department"}

                                </button>

                            </ModalFooter>

                        </form>

                    </div>

                </ModalOverlay>
            )}


            {/* =====================================================
                DELETE MODAL
            ====================================================== */}

            {deleteModalOpen &&
                departmentToDelete && (

                    <ConfirmModal
                        title="Delete Department"
                        message={`Are you sure you want to delete ${departmentToDelete.name}?`}
                        dangerText="This action cannot be undone."
                        loading={
                            deleting
                        }
                        onCancel={() =>
                            setDeleteModalOpen(
                                false
                            )
                        }
                        onConfirm={
                            handleDeleteDepartment
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

                    <MessageCircle
                        size={26}
                        className="md:h-7 md:w-7"
                    />

                </button>
            )}


            {/* =====================================================
                CHAT DRAWER
            ====================================================== */}

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
                                    setChatOpen(
                                        false
                                    )
                                }
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
| Filter Select
|--------------------------------------------------------------------------
*/


function FilterSelect({
    label,
    value,
    loading,
    options,
    placeholder,
    onChange,
}: {
    label: string;
    value: number | string;
    loading: boolean;
    options: CommonDTO[];
    placeholder: string;
    onChange: (
        value: string
    ) => void;
}) {

    return (
        <div className="
            w-full
            md:w-[210px]
        ">

            <label className="
                mb-1.5
                block
                text-xs
                font-semibold
                text-slate-500
            ">
                {label}
            </label>


            <div className="
                relative
            ">

                <select
                    value={value}
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.target.value
                        )
                    }
                    disabled={loading}
                    className="
                        h-11
                        w-full
                        appearance-none
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3
                        pr-9
                        text-sm
                        font-medium
                        text-slate-700
                        outline-none
                        focus:border-primary
                        focus:ring-2
                        focus:ring-primary/10
                        disabled:opacity-50
                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-white
                    "
                >

                    <option value="">
                        {loading
                            ? `Loading ${label.toLowerCase()}...`
                            : placeholder}
                    </option>


                    {!loading &&
                        options.map(
                            (
                                option
                            ) => (

                                <option
                                    key={
                                        option.id
                                    }
                                    value={
                                        option.id
                                    }
                                >
                                    {
                                        option.name
                                    }
                                    {option.code
                                        ? ` (${option.code})`
                                        : ""}
                                </option>

                            )
                        )}

                </select>


                <ChevronDown
                    size={16}
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

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Department Row
|--------------------------------------------------------------------------
*/


function DepartmentRow({
    department,
    onEdit,
    onView,
    onDelete,
}: {
    department: DepartmentResponse;
    onEdit: () => void;
    onDelete: () => void;
    onView: () => void;
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

            <td className="
                px-5
                py-4
            ">

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
                        <GraduationCap
                            size={18}
                        />
                    </div>


                    <div>

                        <p className="
                            font-semibold
                            text-slate-900
                            dark:text-white
                        ">
                            {
                                department.name
                            }
                        </p>


                        <p className="
                            mt-0.5
                            text-xs
                            text-slate-400
                        ">
                            ID: {
                                department.id
                            }
                        </p>

                    </div>

                </div>

            </td>


            <td className="
                px-5
                py-4
            ">

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
                    {
                        department.code
                    }
                </span>

            </td>


            <td className="
                px-5
                py-4
            ">

                {department.hod ? (

                    <div>

                        <p className="
                            font-medium
                            text-slate-800
                            dark:text-slate-200
                        ">
                            {
                                department.hod.name
                            }
                        </p>


                        <p className="
                            mt-0.5
                            text-xs
                            text-slate-400
                        ">
                            {
                                department.hod.code ||
                                "Teacher"
                            }
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


            <td className="
                px-5
                py-4
            ">

                <span className="
                    rounded-full
                    bg-blue-50
                    px-2.5
                    py-1
                    text-xs
                    font-semibold
                    text-blue-600
                    dark:bg-blue-950/40
                    dark:text-blue-400
                ">
                    {
                        department.courses
                            ?.length || 0
                    }
                </span>

            </td>


            <td className="
                px-5
                py-4
            ">

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
                        title="Edit Department"
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
                        title="Delete Department"
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
}: {
    label: string;
    value: string;
    onChange: (
        value: string
    ) => void;
    placeholder?: string;
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
                type="text"
                value={value}
                onChange={(
                    event
                ) =>
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
            <AlertCircle
                size={14}
            />

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
    title,
    description,
}: {
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
                <Building2
                    size={24}
                />
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
| Skeleton
|--------------------------------------------------------------------------
*/


function DepartmentSkeleton() {

    return (
        <div className="
            divide-y
            divide-slate-100
            dark:divide-slate-800
        ">

            {Array.from({
                length: 4,
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
                            h-10
                            w-10
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
                                w-28
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
                        <Trash2
                            size={20}
                        />
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
                        onClick={
                            onCancel
                        }
                        disabled={
                            loading
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
                        type="button"
                        onClick={
                            onConfirm
                        }
                        disabled={
                            loading
                        }
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
