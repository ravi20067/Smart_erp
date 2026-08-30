import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    GraduationCap,
    Users,
    UserRound,
    Plus,
    Eye,
    Pencil,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    RefreshCw,
    Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";

import {
    getAllUniversities,
    createUniversity,
    updateUniversity,
    deleteUniversity,
    getTeachersForDean,
} from "@/services/admin/universityService";
import { getBaseUrl } from "@/services/authutil";

const baseUrl = getBaseUrl();


export default function University() {

    const navigate = useNavigate();

    /*
    |--------------------------------------------------------------------------
    | Layout State
    |--------------------------------------------------------------------------
    */

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | University State
    |--------------------------------------------------------------------------
    */

    const [universities, setUniversities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Create Modal
    |--------------------------------------------------------------------------
    */

    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Edit Modal
    |--------------------------------------------------------------------------
    */

    const [editOpen, setEditOpen] = useState(false);
    const [editingUniversity, setEditingUniversity] = useState(null);

    const [editName, setEditName] = useState("");
    const [selectedDeanId, setSelectedDeanId] = useState("");

    const [teachers, setTeachers] = useState([]);

    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editError, setEditError] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Delete Modal
    |--------------------------------------------------------------------------
    */

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingUniversity, setDeletingUniversity] = useState(null);
    const [deleting, setDeleting] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Notification
    |--------------------------------------------------------------------------
    */

    const [notification, setNotification] = useState({
        type: "",
        message: "",
    });


    /*
    |--------------------------------------------------------------------------
    | Fetch Universities
    |--------------------------------------------------------------------------
    */

    const fetchUniversities = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllUniversities();

            setUniversities(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error("Failed to fetch universities:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to load universities."
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchUniversities();
    }, []);


    /*
    |--------------------------------------------------------------------------
    | Notification Helper
    |--------------------------------------------------------------------------
    */

    const showNotification = (type, message) => {
        setNotification({
            type,
            message,
        });

        setTimeout(() => {
            setNotification({
                type: "",
                message: "",
            });
        }, 3500);
    };


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const filteredUniversities = useMemo(() => {

        if (!searchTerm.trim()) {
            return universities;
        }

        const search = searchTerm.toLowerCase();

        return universities.filter((university) => {

            const universityName =
                university?.name?.toLowerCase() || "";

            const deanName =
                university?.dean?.name?.toLowerCase() || "";

            const deanCode =
                university?.dean?.code?.toLowerCase() || "";

            return (
                universityName.includes(search) ||
                deanName.includes(search) ||
                deanCode.includes(search)
            );
        });

    }, [universities, searchTerm]);


    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    const statistics = useMemo(() => {

        return universities.reduce(
            (total, university) => {

                total.students +=
                    Number(university?.noOfStudent || 0);

                total.teachers +=
                    Number(university?.noOfTeacher || 0);

                total.users +=
                    Number(university?.noOfUser || 0);

                return total;
            },
            {
                students: 0,
                teachers: 0,
                users: 0,
            }
        );

    }, [universities]);


    /*
    |--------------------------------------------------------------------------
    | Open Create Modal
    |--------------------------------------------------------------------------
    */

    const openCreateModal = () => {
        setCreateName("");
        setCreateError("");
        setCreateOpen(true);
    };


    /*
    |--------------------------------------------------------------------------
    | Create University
    |--------------------------------------------------------------------------
    */

    const handleCreate = async (event) => {

        event.preventDefault();

        const name = createName.trim();

        if (!name) {
            setCreateError(
                "University name is required."
            );
            return;
        }

        try {

            const newUniversity = await createUniversity(name);

            setUniversities((prev) => [
                ...prev,
                newUniversity,
            ]);

            setCreateOpen(false);
            setCreateName("");

            showNotification(
                "success",
                "University created successfully."
            );

        } catch (err) {

            console.error("Create university error:", err);

            setCreateError(
                err?.response?.data?.message ||
                "Failed to create university."
            );

        } finally {
            setCreating(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Open Edit Modal
    |--------------------------------------------------------------------------
    */

    const openEditModal = async (university) => {

        setEditingUniversity(university);

        setEditName(university?.name || "");

        setSelectedDeanId(
            university?.dean?.id
                ? String(university.dean.id)
                : ""
        );

        setTeachers([]);
        setEditError("");

        setEditOpen(true);

        try {

            setLoadingTeachers(true);

            const data = await getTeachersForDean(
                university.id
            );

            setTeachers(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Failed to load teachers:",
                err
            );

            setEditError(
                err?.response?.data?.message ||
                "Failed to load available teachers."
            );

        } finally {

            setLoadingTeachers(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Update University
    |--------------------------------------------------------------------------
    */

    const handleUpdate = async (event) => {

        event.preventDefault();

        const name = editName.trim();

        if (!name) {
            setEditError(
                "University name is required."
            );
            return;
        }

        if (!editingUniversity) {
            return;
        }

        try {

            setUpdating(true);
            setEditError("");

            const payload = {
                name,
                deanId: selectedDeanId
                    ? Number(selectedDeanId)
                    : null,
            };

            await updateUniversity(
                editingUniversity.id,
                payload
            );

            setEditOpen(false);

            showNotification(
                "success",
                "University updated successfully."
            );

            await fetchUniversities();

        } catch (err) {

            console.error(
                "Update university error:",
                err
            );

            setEditError(
                err?.response?.data?.message ||
                "Failed to update university."
            );

        } finally {

            setUpdating(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Open Delete Confirmation
    |--------------------------------------------------------------------------
    */

    const openDeleteModal = (university) => {

        setDeletingUniversity(university);
        setDeleteOpen(true);
    };


    /*
    |--------------------------------------------------------------------------
    | Delete University
    |--------------------------------------------------------------------------
    */

    const handleDelete = async () => {

        if (!deletingUniversity) {
            return;
        }

        try {

            setDeleting(true);

            await deleteUniversity(
                deletingUniversity.id
            );

            setDeleteOpen(false);

            showNotification(
                "success",
                "University deleted successfully."
            );

            await fetchUniversities();

        } catch (err) {

            console.error(
                "Delete university error:",
                err
            );
            setDeleteOpen(false);

            showNotification(
                "error",
                err?.response?.data?.message ||
                "Failed to delete university."
            );

        } finally {

            setDeleting(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | View University
    |--------------------------------------------------------------------------
    */

    const handleView = (id) => {
        navigate(`${baseUrl}/schools/?universityId=${id}`);
    };


    /*
    |--------------------------------------------------------------------------
    | Close Modals
    |--------------------------------------------------------------------------
    */

    const closeCreateModal = () => {

        if (creating) {
            return;
        }

        setCreateOpen(false);
        setCreateError("");
    };


    const closeEditModal = () => {

        if (updating) {
            return;
        }

        setEditOpen(false);
        setEditError("");
        setEditingUniversity(null);
        setTeachers([]);
    };


    const closeDeleteModal = () => {

        if (deleting) {
            return;
        }

        setDeleteOpen(false);
        setDeletingUniversity(null);
    };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />


            {/* =====================================================
                MAIN AREA
            ====================================================== */}

            <div className="h-[calc(100vh-64px)]">

                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />


                {/* =================================================
                    CONTENT
                ================================================== */}

                <main
                    className="
                        h-full
                        overflow-y-auto
                        p-4
                        md:p-6
                        lg:p-8
                    "
                >

                    <div className="mx-auto max-w-7xl">

                        {/* =================================================
                            PAGE HEADER
                        ================================================== */}

                        <div
                            className="
                                flex
                                flex-col
                                gap-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                                mb-6
                            "
                        >

                            <div>

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                    "
                                >

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
                                        <Building2
                                            size={24}
                                        />
                                    </div>

                                    <div>

                                        <h1
                                            className="
                                                text-2xl
                                                md:text-3xl
                                                font-bold
                                                tracking-tight
                                                text-slate-900
                                                dark:text-white
                                            "
                                        >
                                            University Management
                                        </h1>

                                        <p
                                            className="
                                                mt-1
                                                text-sm
                                                text-slate-500
                                                dark:text-slate-400
                                            "
                                        >
                                            Manage universities,
                                            deans and university
                                            information.
                                        </p>

                                    </div>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="
                                    inline-flex
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
                                    transition
                                    hover:opacity-90
                                    active:scale-[0.98]
                                "
                            >
                                <Plus size={18} />
                                Add University
                            </button>

                        </div>


                        {/* =================================================
                            NOTIFICATION
                        ================================================== */}

                        {notification.message && (
                            <div
                                className={`
                                    mb-5
                                    flex
                                    items-center
                                    gap-3
                                    rounded-xl
                                    border
                                    px-4
                                    py-3
                                    text-sm
                                    ${notification.type === "success"
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
                                `}
                            >
                                {notification.type === "success" ? (
                                    <div
                                        className="
                                            h-2
                                            w-2
                                            rounded-full
                                            bg-emerald-500
                                        "
                                    />
                                ) : (
                                    <AlertCircle
                                        size={18}
                                    />
                                )}

                                <span>
                                    {notification.message}
                                </span>
                            </div>
                        )}


                        {/* =================================================
                            STATISTICS
                        ================================================== */}

                        <div
                            className="
                                grid
                                grid-cols-1
                                sm:grid-cols-2
                                xl:grid-cols-4
                                gap-4
                                mb-6
                            "
                        >

                            <StatCard
                                title="Total Universities"
                                value={universities.length}
                                icon={Building2}
                            />

                            <StatCard
                                title="Total Students"
                                value={statistics.students}
                                icon={GraduationCap}
                            />

                            <StatCard
                                title="Total Teachers"
                                value={statistics.teachers}
                                icon={UserRound}
                            />

                            <StatCard
                                title="Total Users"
                                value={statistics.users}
                                icon={Users}
                            />

                        </div>


                        {/* =================================================
                            TABLE CARD
                        ================================================== */}

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

                            {/* Table Header */}

                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-4
                                    border-b
                                    border-slate-200
                                    p-4
                                    md:flex-row
                                    md:items-center
                                    md:justify-between
                                    dark:border-slate-800
                                "
                            >

                                <div>

                                    <h2
                                        className="
                                            font-semibold
                                            text-slate-900
                                            dark:text-white
                                        "
                                    >
                                        Universities
                                    </h2>

                                    <p
                                        className="
                                            mt-1
                                            text-xs
                                            text-slate-500
                                        "
                                    >
                                        {filteredUniversities.length}{" "}
                                        {filteredUniversities.length === 1
                                            ? "university"
                                            : "universities"}
                                    </p>

                                </div>


                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    {/* Search */}

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
                                            type="text"
                                            value={searchTerm}
                                            onChange={(event) =>
                                                setSearchTerm(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Search university..."
                                            className="
                                                h-10
                                                w-full
                                                sm:w-64
                                                rounded-lg
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                pl-9
                                                pr-3
                                                text-sm
                                                outline-none
                                                transition
                                                focus:border-primary
                                                focus:ring-2
                                                focus:ring-primary/10
                                                dark:border-slate-700
                                                dark:bg-slate-950
                                                dark:text-white
                                            "
                                        />

                                    </div>


                                    <button
                                        type="button"
                                        onClick={fetchUniversities}
                                        disabled={loading}
                                        className="
                                            flex
                                            h-10
                                            w-10
                                            items-center
                                            justify-center
                                            rounded-lg
                                            border
                                            border-slate-200
                                            text-slate-600
                                            transition
                                            hover:bg-slate-100
                                            disabled:opacity-50
                                            dark:border-slate-700
                                            dark:text-slate-300
                                            dark:hover:bg-slate-800
                                        "
                                        title="Refresh"
                                    >
                                        <RefreshCw
                                            size={17}
                                            className={
                                                loading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />
                                    </button>

                                </div>

                            </div>


                            {/* =================================================
                                LOADING
                            ================================================== */}

                            {loading && (
                                <UniversityTableSkeleton />
                            )}


                            {/* =================================================
                                ERROR
                            ================================================== */}

                            {!loading && error && (
                                <div
                                    className="
                                        flex
                                        min-h-[300px]
                                        flex-col
                                        items-center
                                        justify-center
                                        p-6
                                        text-center
                                    "
                                >

                                    <div
                                        className="
                                            mb-4
                                            flex
                                            h-12
                                            w-12
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-red-50
                                            text-red-500
                                            dark:bg-red-950/40
                                        "
                                    >
                                        <AlertCircle
                                            size={24}
                                        />
                                    </div>

                                    <h3
                                        className="
                                            font-semibold
                                            text-slate-900
                                            dark:text-white
                                        "
                                    >
                                        Failed to load universities
                                    </h3>

                                    <p
                                        className="
                                            mt-1
                                            max-w-md
                                            text-sm
                                            text-slate-500
                                        "
                                    >
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={fetchUniversities}
                                        className="
                                            mt-4
                                            inline-flex
                                            items-center
                                            gap-2
                                            rounded-lg
                                            bg-primary
                                            px-4
                                            py-2
                                            text-sm
                                            font-medium
                                            text-white
                                        "
                                    >
                                        <RefreshCw size={16} />
                                        Try Again
                                    </button>

                                </div>
                            )}


                            {/* =================================================
                                EMPTY
                            ================================================== */}

                            {!loading &&
                                !error &&
                                filteredUniversities.length === 0 && (
                                    <div
                                        className="
                                            flex
                                            min-h-[300px]
                                            flex-col
                                            items-center
                                            justify-center
                                            p-6
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
                                                rounded-2xl
                                                bg-slate-100
                                                text-slate-400
                                                dark:bg-slate-800
                                            "
                                        >
                                            <Building2
                                                size={27}
                                            />
                                        </div>

                                        <h3
                                            className="
                                                font-semibold
                                                text-slate-900
                                                dark:text-white
                                            "
                                        >
                                            {searchTerm
                                                ? "No matching universities"
                                                : "No universities found."}
                                        </h3>

                                        <p
                                            className="
                                                mt-1
                                                text-sm
                                                text-slate-500
                                            "
                                        >
                                            {searchTerm
                                                ? "Try a different search term."
                                                : "Add your first university to get started."}
                                        </p>

                                    </div>
                                )}


                            {/* =================================================
                                TABLE
                            ================================================== */}

                            {!loading &&
                                !error &&
                                filteredUniversities.length > 0 && (

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
                                                        bg-slate-50/80
                                                        text-left
                                                        dark:border-slate-800
                                                        dark:bg-slate-950/50
                                                    "
                                                >

                                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        University
                                                    </th>

                                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Dean
                                                    </th>

                                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Students
                                                    </th>

                                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Teachers
                                                    </th>

                                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Users
                                                    </th>

                                                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Actions
                                                    </th>

                                                </tr>
                                            </thead>


                                            <tbody>

                                                {filteredUniversities.map(
                                                    (university) => (
                                                        <UniversityRow
                                                            key={university.id}
                                                            university={
                                                                university
                                                            }
                                                            onView={
                                                                handleView
                                                            }
                                                            onEdit={
                                                                openEditModal
                                                            }
                                                            onDelete={
                                                                openDeleteModal
                                                            }
                                                        />
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>
                                )}

                        </div>

                    </div>

                </main>

            </div>


            {/* =====================================================
                CREATE MODAL
            ====================================================== */}

            {createOpen && (
                <ModalOverlay>

                    <div
                        className="
                            w-full
                            max-w-md
                            rounded-2xl
                            bg-white
                            shadow-2xl
                            dark:bg-slate-900
                        "
                    >

                        <ModalHeader
                            title="Add University"
                            onClose={closeCreateModal}
                        />

                        <form onSubmit={handleCreate}>

                            <div className="p-5">

                                <label
                                    className="
                                        mb-2
                                        block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        dark:text-slate-300
                                    "
                                >
                                    University Name *
                                </label>

                                <input
                                    autoFocus
                                    type="text"
                                    value={createName}
                                    onChange={(event) =>
                                        setCreateName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter university name"
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
                                        transition
                                        focus:border-primary
                                        focus:ring-2
                                        focus:ring-primary/10
                                        dark:border-slate-700
                                        dark:bg-slate-950
                                        dark:text-white
                                    "
                                />

                                {createError && (
                                    <ErrorText
                                        message={createError}
                                    />
                                )}

                            </div>


                            <ModalFooter>

                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={creating}
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        hover:bg-slate-50
                                        disabled:opacity-50
                                        dark:border-slate-700
                                        dark:text-slate-300
                                        dark:hover:bg-slate-800
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={creating}
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
                                        hover:opacity-90
                                        disabled:opacity-50
                                    "
                                >
                                    {creating && (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {creating
                                        ? "Creating..."
                                        : "Create University"}
                                </button>

                            </ModalFooter>

                        </form>

                    </div>

                </ModalOverlay>
            )}


            {/* =====================================================
                EDIT MODAL
            ====================================================== */}

            {editOpen && (
                <ModalOverlay>

                    <div
                        className="
                            w-full
                            max-w-lg
                            rounded-2xl
                            bg-white
                            shadow-2xl
                            dark:bg-slate-900
                        "
                    >

                        <ModalHeader
                            title="Edit University"
                            onClose={closeEditModal}
                        />

                        <form onSubmit={handleUpdate}>

                            <div className="space-y-5 p-5">

                                {/* University Name */}

                                <div>

                                    <label
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-medium
                                            text-slate-700
                                            dark:text-slate-300
                                        "
                                    >
                                        University Name *
                                    </label>

                                    <input
                                        autoFocus
                                        type="text"
                                        value={editName}
                                        onChange={(event) =>
                                            setEditName(
                                                event.target.value
                                            )
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
                                            transition
                                            focus:border-primary
                                            focus:ring-2
                                            focus:ring-primary/10
                                            dark:border-slate-700
                                            dark:bg-slate-950
                                            dark:text-white
                                        "
                                    />

                                </div>


                                {/* Dean */}

                                <div>

                                    <label
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-medium
                                            text-slate-700
                                            dark:text-slate-300
                                        "
                                    >
                                        Dean
                                    </label>

                                    <select
                                        value={selectedDeanId}
                                        onChange={(event) =>
                                            setSelectedDeanId(
                                                event.target.value
                                            )
                                        }
                                        disabled={loadingTeachers}
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
                                            transition
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
                                                (teacher) => (
                                                    <option
                                                        key={teacher.id}
                                                        value={teacher.id}
                                                    >
                                                        {teacher.name}{" "}
                                                        (
                                                        {
                                                            teacher.code
                                                        }
                                                        )
                                                    </option>
                                                )
                                            )}

                                    </select>

                                    <p
                                        className="
                                            mt-1.5
                                            text-xs
                                            text-slate-500
                                        "
                                    >
                                        Select a teacher to assign
                                        as Dean.
                                    </p>

                                </div>


                                {editError && (
                                    <ErrorText
                                        message={editError}
                                    />
                                )}

                            </div>


                            <ModalFooter>

                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={updating}
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        hover:bg-slate-50
                                        disabled:opacity-50
                                        dark:border-slate-700
                                        dark:text-slate-300
                                        dark:hover:bg-slate-800
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={updating}
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
                                        hover:opacity-90
                                        disabled:opacity-50
                                    "
                                >

                                    {updating && (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {updating
                                        ? "Updating..."
                                        : "Update University"}

                                </button>

                            </ModalFooter>

                        </form>

                    </div>

                </ModalOverlay>
            )}


            {/* =====================================================
                DELETE MODAL
            ====================================================== */}

            {deleteOpen && deletingUniversity && (
                <ModalOverlay>

                    <div
                        className="
                            w-full
                            max-w-md
                            rounded-2xl
                            bg-white
                            shadow-2xl
                            dark:bg-slate-900
                        "
                    >

                        <div className="p-6">

                            <div
                                className="
                                    mb-4
                                    flex
                                    h-12
                                    w-12
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-red-50
                                    text-red-500
                                    dark:bg-red-950/40
                                "
                            >
                                <Trash2 size={22} />
                            </div>

                            <h2
                                className="
                                    text-lg
                                    font-bold
                                    text-slate-900
                                    dark:text-white
                                "
                            >
                                Delete University
                            </h2>

                            <p
                                className="
                                    mt-2
                                    text-sm
                                    leading-6
                                    text-slate-500
                                "
                            >
                                Are you sure you want to delete{" "}
                                <span
                                    className="
                                        font-semibold
                                        text-slate-700
                                        dark:text-slate-300
                                    "
                                >
                                    {deletingUniversity.name}
                                </span>
                                ?
                            </p>

                            <p
                                className="
                                    mt-2
                                    text-xs
                                    text-red-500
                                "
                            >
                                This action cannot be undone.
                            </p>

                        </div>


                        <ModalFooter>

                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    hover:bg-slate-50
                                    disabled:opacity-50
                                    dark:border-slate-700
                                    dark:text-slate-300
                                    dark:hover:bg-slate-800
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-red-500
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    hover:bg-red-600
                                    disabled:opacity-50
                                "
                            >

                                {deleting && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                {deleting
                                    ? "Deleting..."
                                    : "Delete University"}

                            </button>

                        </ModalFooter>

                    </div>

                </ModalOverlay>
            )}


            {/* =====================================================
                FLOATING CHAT BUTTON
            ====================================================== */}

            {!chatOpen && (
                <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    aria-label="Open AI Administrator Copilot"
                    className="
                        fixed
                        bottom-5
                        right-5
                        md:bottom-6
                        md:right-6
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
                        onClick={() => setChatOpen(false)}
                    />

                    <div
                        className="
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
                        "
                    >

                        <div
                            className="
                                flex
                                h-[72px]
                                items-center
                                justify-between
                                border-b
                                border-slate-200
                                px-4
                                md:px-5
                                dark:border-slate-700
                            "
                        >

                            <div className="min-w-0">

                                <h2
                                    className="
                                        truncate
                                        text-base
                                        font-bold
                                        text-slate-900
                                        md:text-lg
                                        dark:text-white
                                    "
                                >
                                    AI Administrator Copilot
                                </h2>

                                <p
                                    className="
                                        mt-0.5
                                        text-xs
                                        text-slate-500
                                    "
                                >
                                    Ask anything.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() => setChatOpen(false)}
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

                        <div className="h-[calc(100%-72px)]">
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
| Statistic Card
|--------------------------------------------------------------------------
*/

function StatCard({
    title,
    value,
    icon: Icon,
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

            <div
                className="
                    flex
                    items-start
                    justify-between
                "
            >

                <div>

                    <p
                        className="
                            text-sm
                            font-medium
                            text-slate-500
                        "
                    >
                        {title}
                    </p>

                    <p
                        className="
                            mt-2
                            text-2xl
                            font-bold
                            tracking-tight
                            text-slate-900
                            dark:text-white
                        "
                    >
                        {Number(value).toLocaleString()}
                    </p>

                </div>


                <div
                    className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-primary/10
                        text-primary
                    "
                >
                    <Icon size={20} />
                </div>

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| University Row
|--------------------------------------------------------------------------
*/

function UniversityRow({
    university,
    onView,
    onEdit,
    onDelete,
}) {

    return (
        <tr
            className="
                border-b
                border-slate-100
                transition
                hover:bg-slate-50/70
                dark:border-slate-800
                dark:hover:bg-slate-800/40
            "
        >

            {/* University */}

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
                            rounded-xl
                            bg-primary/10
                            text-primary
                        "
                    >
                        <Building2 size={19} />
                    </div>

                    <div className="min-w-0">

                        <p
                            className="
                                truncate
                                font-semibold
                                text-slate-900
                                dark:text-white
                            "
                        >
                            {university.name}
                        </p>

                        <p
                            className="
                                mt-0.5
                                text-xs
                                text-slate-400
                            "
                        >
                            ID: {university.id}
                        </p>

                    </div>

                </div>

            </td>


            {/* Dean */}

            <td className="px-5 py-4">

                {university.dean ? (
                    <div>

                        <p
                            className="
                                font-medium
                                text-slate-800
                                dark:text-slate-200
                            "
                        >
                            {university.dean.name}
                        </p>

                        <p
                            className="
                                mt-0.5
                                text-xs
                                text-slate-400
                            "
                        >
                            {university.dean.code}
                        </p>

                    </div>
                ) : (
                    <span
                        className="
                            inline-flex
                            rounded-full
                            bg-slate-100
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            text-slate-500
                            dark:bg-slate-800
                        "
                    >
                        Not Assigned
                    </span>
                )}

            </td>


            {/* Students */}

            <td
                className="
                    px-5
                    py-4
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                "
            >
                {Number(
                    university.noOfStudent || 0
                ).toLocaleString()}
            </td>


            {/* Teachers */}

            <td
                className="
                    px-5
                    py-4
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                "
            >
                {Number(
                    university.noOfTeacher || 0
                ).toLocaleString()}
            </td>


            {/* Users */}

            <td
                className="
                    px-5
                    py-4
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                "
            >
                {Number(
                    university.noOfUser || 0
                ).toLocaleString()}
            </td>


            {/* Actions */}

            <td className="px-5 py-4">

                <div
                    className="
                        flex
                        justify-end
                        gap-1.5
                    "
                >

                    <ActionButton
                        icon={Eye}
                        label="View"
                        onClick={() =>
                            onView(university.id)
                        }
                    />

                    <ActionButton
                        icon={Pencil}
                        label="Edit"
                        onClick={() =>
                            onEdit(university)
                        }
                    />

                    <ActionButton
                        icon={Trash2}
                        label="Delete"
                        danger
                        onClick={() =>
                            onDelete(university)
                        }
                    />

                </div>

            </td>

        </tr>
    );
}


/*
|--------------------------------------------------------------------------
| Action Button
|--------------------------------------------------------------------------
*/

function ActionButton({
    icon: Icon,
    label,
    onClick,
    danger = false,
}) {

    return (
        <button
            type="button"
            title={label}
            onClick={onClick}
            className={`
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                transition
                ${danger
                    ? `
                            text-slate-400
                            hover:bg-red-50
                            hover:text-red-500
                            dark:hover:bg-red-950/40
                        `
                    : `
                            text-slate-400
                            hover:bg-slate-100
                            hover:text-primary
                            dark:hover:bg-slate-800
                        `
                }
            `}
        >
            <Icon size={17} />
        </button>
    );
}


/*
|--------------------------------------------------------------------------
| Modal Overlay
|--------------------------------------------------------------------------
*/

function ModalOverlay({ children }) {

    return (
        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-black/50
                p-4
                backdrop-blur-sm
            "
        >
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
}) {

    return (
        <div
            className="
                flex
                items-center
                justify-between
                border-b
                border-slate-200
                px-5
                py-4
                dark:border-slate-800
            "
        >

            <h2
                className="
                    text-lg
                    font-bold
                    text-slate-900
                    dark:text-white
                "
            >
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
                    dark:hover:text-white
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

function ModalFooter({ children }) {

    return (
        <div
            className="
                flex
                items-center
                justify-end
                gap-3
                border-t
                border-slate-200
                px-5
                py-4
                dark:border-slate-800
            "
        >
            {children}
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Error Text
|--------------------------------------------------------------------------
*/

function ErrorText({ message }) {

    return (
        <div
            className="
                mt-2
                flex
                items-center
                gap-2
                text-xs
                text-red-500
            "
        >
            <AlertCircle size={14} />
            <span>{message}</span>
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

function UniversityTableSkeleton() {

    return (
        <div className="p-4">

            <div className="space-y-3">

                {Array.from({ length: 6 }).map(
                    (_, index) => (
                        <div
                            key={index}
                            className="
                                flex
                                items-center
                                gap-4
                                rounded-xl
                                p-3
                            "
                        >

                            <div
                                className="
                                    h-10
                                    w-10
                                    shrink-0
                                    animate-pulse
                                    rounded-xl
                                    bg-slate-200
                                    dark:bg-slate-800
                                "
                            />

                            <div className="flex-1">

                                <div
                                    className="
                                        h-4
                                        w-48
                                        animate-pulse
                                        rounded
                                        bg-slate-200
                                        dark:bg-slate-800
                                    "
                                />

                                <div
                                    className="
                                        mt-2
                                        h-3
                                        w-24
                                        animate-pulse
                                        rounded
                                        bg-slate-100
                                        dark:bg-slate-800
                                    "
                                />

                            </div>

                            <div
                                className="
                                    hidden
                                    h-4
                                    w-20
                                    animate-pulse
                                    rounded
                                    bg-slate-200
                                    md:block
                                    dark:bg-slate-800
                                "
                            />

                            <div
                                className="
                                    hidden
                                    h-4
                                    w-16
                                    animate-pulse
                                    rounded
                                    bg-slate-200
                                    lg:block
                                    dark:bg-slate-800
                                "
                            />

                            <div
                                className="
                                    h-9
                                    w-28
                                    animate-pulse
                                    rounded-lg
                                    bg-slate-200
                                    dark:bg-slate-800
                                "
                            />

                        </div>
                    )
                )}

            </div>

        </div>
    );
}