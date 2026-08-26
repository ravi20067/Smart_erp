import {
    MessageCircle,
    X
} from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/admin/Sidebar";
import Copilot from "@/components/admin/Copilot";
import useStudents from "@/hooks/admin/useStudents";
import type { Student } from "@/types/admin/student";
import StudentHeader from "@/components/admin/UserManagement/student/Header";
import StudentStats from "@/components/admin/UserManagement/student/Stats";
import StudentFilters from "@/components/admin/UserManagement/student/Filters";
import StudentTable from "@/components/admin/UserManagement/student/Table";
import StudentPagination from "@/components/admin/UserManagement/student/Pagination";
import AddStudentDrawer from "@/components/admin/UserManagement/student/AddDrawer";

export default function Student() {
    const {

        search,
        setSearch,

        selectedClass,
        setSelectedClass,

        selectedSection,
        setSelectedSection,

        studentList,

        filteredStudents,

        classes,

        sections,

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

    } = useStudents();
    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

            {/* Header */}
            <Header />

            {/* Main Layout */}
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

                {/* Main Content */}
                <main
                    className="
                    flex-1
                    overflow-y-auto
                    p-4 md:p-6
                "
                >
                    <div className="space-y-6">

                        <StudentHeader
                            onExport={() => {
                                handleExport()
                            }}
                            onAddStudent={() => setAddStudentOpen(true)}
                        />

                        {/* Stats */}

                        <StudentStats stats={stats} />

                        {/* Filters */}

                        <StudentFilters
                            search={search}
                            setSearch={setSearch}

                            selectedClass={selectedClass}
                            setSelectedClass={setSelectedClass}

                            selectedSection={selectedSection}
                            setSelectedSection={setSelectedSection}

                            classes={classes}

                            sections={sections}

                            onClassChange={handleClassChange}

                            onSearch={handleSearch}
                        />

                        {/* Table */}

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">

                            <StudentTable
                                students={filteredStudents}
                                onDelete={handleDeleteStudent}
                            />

                            <StudentPagination
                                filteredStudents={filteredStudents.length}
                                totalStudents={studentList.length}
                            />

                        </div>

                    </div>

                </main>
            </div>

            {/* Floating Chat Button */}
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

            {/* Add Student Drawer Overlay */}
            <AddStudentDrawer
                open={addStudentOpen}
                onClose={handleCloseAddStudent}
                submitting={submitting}
                errorMsg={errorMsg}
                receiptStudent={receiptStudent}
                formData={formData}
                classes={classes}
                sections={sections}
                onFormChange={handleFormChange}
                onClassChange={handleClassChange}
                onSubmit={handleAddStudentSubmit}
                onDownloadReceipt={handleDownloadReceipt}
            />

            {/* Chat Drawer Overlay */}
            {chatOpen && (
                <>
                    <div
                        className="
                        fixed
                        inset-0
                        bg-black/40
                        z-40
                    "
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

                        animate-in
                        slide-in-from-bottom-4
                    "
                    >
                        {/* Chat Header */}
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
                                    AI admisnistrator Copilot
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

                        {/* Chat Content */}
                        <div className="h-[calc(100%-72px)]">
                            <Copilot />
                        </div>
                    </div>
                </>
            )}
        </div>
    );

}
