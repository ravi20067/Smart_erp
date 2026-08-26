import {
    MessageCircle,
    X,
} from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";

import useTeachers from "@/hooks/admin/useTeacher";

import PanelHeader from "@/components/admin/UserManagement/teacher/Header";
import TeacherStats from "@/components/admin/UserManagement/teacher/Stats";
import TeacherFilters from "@/components/admin/UserManagement/teacher/Filters";
import TeacherTable from "@/components/admin/UserManagement/teacher/Table";
import TeacherPagination from "@/components/admin/UserManagement/teacher/Pagination";
import AddTeacherDrawer from "@/components/admin/UserManagement/teacher/AddDrawer";

export default function Teacher() {

    const {

        search,
        setSearch,

        selectedStatus,
        setSelectedStatus,

        teacherList,
        filteredTeachers,

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

    } = useTeachers();

    return (

        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            {/* Header */}

            <Header />

            <div className="flex h-[calc(100vh-80px)]">

                {/* Sidebar */}

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

                {/* Main */}

                <main
                    className="
                        flex-1
                        overflow-y-auto
                        p-4
                        md:p-6
                    "
                >

                    <div className="space-y-6">

                        <PanelHeader
                            onExport={handleExport}
                            onAdd={() => setAddTeacherOpen(true)}
                        />

                        {/* Stats */}

                        <TeacherStats stats={stats} />

                        {/* Filters */}

                        <TeacherFilters
                            search={search}
                            setSearch={setSearch}

                            selectedStatus={selectedStatus}
                            setSelectedStatus={setSelectedStatus}

                            onSearch={handleSearch}
                        />

                        {/* Table */}

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">

                            <TeacherTable
                                teachers={filteredTeachers}
                                onDelete={handleDeleteTeacher}
                            />

                            <TeacherPagination
                                filteredTeachers={filteredTeachers.length}
                                totalTeachers={teacherList.length}
                            />

                        </div>

                    </div>

                </main>

            </div>

            {/* Floating Chat */}

            <button
                onClick={() => setChatOpen(true)}
                className="
                    fixed
                    bottom-6
                    right-6
                    z-50
                    w-16
                    h-16
                    rounded-full
                    bg-gradient-to-r
                    from-primary
                    to-secondary
                    text-white
                    shadow-xl
                    hover:scale-105
                    transition
                    flex
                    items-center
                    justify-center
                "
            >

                <MessageCircle size={28} />

            </button>

            {/* Add Teacher Drawer */}

            <AddTeacherDrawer
                open={addTeacherOpen}
                onClose={handleCloseAddTeacher}
                submitting={submitting}
                errorMsg={errorMsg}
                receiptTeacher={receiptTeacher}
                formData={formData}
                onFormChange={handleFormChange}
                onSubmit={handleAddTeacherSubmit}
                onDownloadReceipt={handleDownloadReceipt}
            />

            {/* AI Chat */}

            {chatOpen && (

                <>

                    <div
                        className="fixed inset-0 bg-black/40 z-40"
                        onClick={() => setChatOpen(false)}
                    />

                    <div
                        className="
                            fixed
                            bottom-24
                            right-6
                            z-50

                            w-[95vw]
                            sm:w-[420px]

                            h-[75vh]
                            max-h-[700px]

                            rounded-3xl
                            overflow-hidden

                            bg-white
                            dark:bg-slate-900

                            border
                            border-slate-200
                            dark:border-slate-700

                            shadow-2xl
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                px-5
                                py-4
                                border-b
                                border-slate-200
                                dark:border-slate-700
                            "
                        >

                            <div>

                                <h2 className="font-bold text-lg">
                                    AI Administrator Copilot
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Ask anything.
                                </p>

                            </div>

                            <button
                                onClick={() => setChatOpen(false)}
                                className="
                                    p-2
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