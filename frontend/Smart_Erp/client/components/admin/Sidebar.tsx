import {
    X,
    LayoutDashboard,
    GraduationCap,
    Users,
    ScanLine,
    School,
    Layers,
    BookOpen,
    Calendar,
    FolderOpen,
    Megaphone,
    Image,
    Globe,
    Mail,
    Shield,
    Settings,
    Database,
    History,
    FileBarChart,
    BarChart3,
    ClipboardList,
    Building2,
    Network,
    FileQuestion

} from "lucide-react";

import { useNavigate } from "react-router-dom";


const menu = [
    {
        title: "Dashboard",
        items: [
            {
                icon: LayoutDashboard,
                label: "Dashboard Overview",
                path: "/admin",
            },
        ],
    },

    {
        title: "Organization",
        items: [
            {
                icon: Building2,
                label: "Universities",
                path: "/admin/universities",
            },
            {
                icon: School,
                label: "Schools",
                path: "/admin/schools",
            },
            {
                icon: Network,
                label: "Departments",
                path: "/admin/departments",
            },
        ],
    },

    {
        title: "Academic Management",
        items: [
            {
                icon: Layers,
                label: "Courses",
                path: "/admin/courses",
            },
            {
                icon: BookOpen,
                label: "Subjects",
                path: "/admin/subjects",
            },
            {
                icon: GraduationCap,
                label: "Classes",
                path: "/admin/classes",
            },
            {
                icon: Calendar,
                label: "Timetable",
                path: "/admin/timetable",
            },
        ],
    },

    {
        title: "User Management",
        items: [
            {
                icon: GraduationCap,
                label: "Students",
                path: "/admin/students",
            },
            {
                icon: Users,
                label: "Teachers",
                path: "/admin/teachers",
            },
            {
                icon: ScanLine,
                label: "Devices",
                path: "/admin/devices",
            },
        ],
    },

    {
        title: "Academic Resources",
        items: [
            {
                icon: FolderOpen,
                label: "Study Material",
                path: "/admin/study-material",
            },
            {
                icon: BookOpen,
                label: "Chapters",
                path: "/admin/chapters",
            },
            {
                icon: FileQuestion,
                label: "Question Bank",
                path: "/admin/question-bank",
            },
        ],
    },

    {
        title: "Communication",
        items: [
            {
                icon: Megaphone,
                label: "Announcements",
                path: "/admin/announcements",
            },
            {
                icon: Calendar,
                label: "Events",
                path: "/admin/events",
            },
            {
                icon: Image,
                label: "Gallery",
                path: "/admin/gallery",
            },
            {
                icon: Globe,
                label: "Website Content",
                path: "/admin/website-content",
            },
            {
                icon: Mail,
                label: "Contact Queries",
                path: "/admin/contact-queries",
            },
        ],
    },

    {
        title: "Examination",
        items: [
            {
                icon: ClipboardList,
                label: "Exams",
                path: "/admin/exams",
            },
            {
                icon: FileBarChart,
                label: "Exam Results",
                path: "/admin/exam-results",
            },
            {
                icon: BarChart3,
                label: "Examination Reports",
                path: "/admin/reports/examination",
            },
        ],
    },

    {
        title: "System Management",
        items: [
            {
                icon: Shield,
                label: "Roles & Permissions",
                path: "/admin/roles-permissions",
            },
            {
                icon: Settings,
                label: "Settings",
                path: "/admin/settings",
            },
            {
                icon: Database,
                label: "Backup & Restore",
                path: "/admin/backup-restore",
            },
            {
                icon: History,
                label: "Audit Logs",
                path: "/admin/audit-logs",
            },
        ],
    },

    {
        title: "Reports",
        items: [
            {
                icon: FileBarChart,
                label: "Student Reports",
                path: "/admin/reports/student",
            },
            {
                icon: FileBarChart,
                label: "Staff Reports",
                path: "/admin/reports/staff",
            },
            {
                icon: BarChart3,
                label: "Academic Reports",
                path: "/admin/reports/academic",
            },
        ],
    },
];


export default function Sidebar({ isOpen, onClose }) {

    const navigate = useNavigate();


    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };


    return (
        <>
            {/* =====================================================
                OVERLAY
            ====================================================== */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="
                        fixed
                        inset-0
                        z-40
                        bg-black/40
                        backdrop-blur-[1px]
                    "
                />
            )}


            {/* =====================================================
                SIDEBAR
            ====================================================== */}
            <aside
                className={`
                    fixed
                    top-0
                    left-0
                    z-50

                    w-72
                    h-screen

                    bg-white
                    dark:bg-slate-900

                    border-r
                    border-slate-200
                    dark:border-slate-800

                    shadow-2xl

                    overflow-y-auto

                    transition-transform
                    duration-300
                    ease-in-out

                    ${isOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }
                `}
            >

                {/* =================================================
                    SIDEBAR HEADER
                ================================================== */}
                <div
                    className="
                        h-16
                        flex
                        items-center
                        justify-between
                        px-5

                        border-b
                        border-slate-200
                        dark:border-slate-800
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                w-9
                                h-9
                                rounded-lg
                                bg-gradient-to-r
                                from-primary
                                to-secondary
                                flex
                                items-center
                                justify-center
                                text-white
                                font-bold
                                text-sm
                            "
                        >
                            AE
                        </div>

                        <h2
                            className="
                                font-bold
                                text-base
                                text-slate-900
                                dark:text-white
                            "
                        >
                            Academy Elite ERP
                        </h2>

                    </div>


                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sidebar"
                        className="
                            flex
                            items-center
                            justify-center

                            w-9
                            h-9

                            rounded-lg

                            hover:bg-slate-100
                            dark:hover:bg-slate-800

                            transition
                        "
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* =================================================
                    MENU
                ================================================== */}
                <div className="p-4">

                    {menu.map((section) => (

                        <div
                            key={section.title}
                            className="mb-6"
                        >

                            {/* Section Title */}
                            <h3
                                className="
                                    px-3
                                    mb-2

                                    text-[11px]
                                    font-bold
                                    uppercase
                                    tracking-wider

                                    text-slate-400
                                "
                            >
                                {section.title}
                            </h3>


                            {/* Items */}
                            <div className="space-y-1">

                                {section.items.map((item) => {

                                    const Icon = item.icon;

                                    return (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() =>
                                                handleNavigate(
                                                    item.path
                                                )
                                            }
                                            className="
                                                w-full

                                                flex
                                                items-center
                                                gap-3

                                                px-3
                                                py-2.5

                                                rounded-lg

                                                text-sm
                                                text-left

                                                text-slate-700
                                                dark:text-slate-200

                                                hover:bg-blue-50
                                                hover:text-blue-600

                                                dark:hover:bg-slate-800
                                                dark:hover:text-blue-400

                                                transition
                                            "
                                        >

                                            <Icon
                                                size={18}
                                                className="shrink-0"
                                            />

                                            <span>
                                                {item.label}
                                            </span>

                                        </button>
                                    );

                                })}

                            </div>

                        </div>

                    ))}

                </div>

            </aside>
        </>
    );
}