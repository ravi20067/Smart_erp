import {
    Activity,
    BadgePercent,
    Banknote,
    BarChart3,
    Bookmark,
    BookMarked,
    BookOpen,
    BookUser,
    Building2,
    Calendar,
    CalendarCheck2,
    CalendarDays,
    CalendarRange,
    Camera,
    CheckCircle2,
    CircleDot,
    CircleUserRound,
    ClipboardCheck,
    ClipboardList,
    Clock,
    CreditCard,
    Database,
    DoorOpen,
    Eye,
    FileBadge,
    FileBarChart,
    FileCheck,
    FileQuestion,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    GitBranch,
    GraduationCap,
    HeartPulse,
    History,
    KeyRound,
    Layers,
    LayoutDashboard,
    Library,
    LifeBuoy,
    Lock,
    Mail,
    MapPin,
    Megaphone,
    MessageSquare,
    Network,
    Package,
    PhoneCall,
    Presentation,
    Receipt,
    RotateCcw,
    ScanLine,
    School,
    ScrollText,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Truck,
    UserCheck,
    UserCog,
    UserPlus,
    Users,
    Vote,
    Wallet,
    Workflow,
    type LucideIcon,
} from "lucide-react";

export interface MenuItem {
    label: string;
    path: string;
    icon: LucideIcon;
    badge?: string;
}

export interface MenuGroup {
    title: string;
    items: MenuItem[];
}

export interface RoleConfig {
    roleTitle: string;
    roleSubtitle: string;
    dashboardPath: string;
    icon: LucideIcon;
    badgeTone: "cyan" | "emerald" | "violet" | "amber" | "blue" | "rose";
    menu: MenuGroup[];
}

export const ROLE_NAVIGATION_CONFIGS: Record<string, RoleConfig> = {
    // -------------------------------------------------------------------------
    // SUPER ADMIN & ADMIN
    // -------------------------------------------------------------------------
    SUPER_ADMIN: {
        roleTitle: "Control Center",
        roleSubtitle: "Institutional Administration",
        dashboardPath: "/super-admin",
        icon: LayoutDashboard,
        badgeTone: "cyan",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Dashboard Overview", path: "/super-admin", icon: LayoutDashboard },
                ],
            },
            {
                title: "ORGANIZATION",
                items: [
                    { label: "Universities", path: "/super-admin/universities", icon: Building2 },
                    { label: "Schools", path: "/super-admin/schools", icon: School },
                    { label: "Departments", path: "/super-admin/departments", icon: Network },
                ],
            },
            {
                title: "ACADEMIC MANAGEMENT",
                items: [
                    { label: "Academic Years", path: "/super-admin/academic-years", icon: CalendarRange },
                    { label: "Courses", path: "/super-admin/courses", icon: BookMarked },
                    { label: "Specialization", path: "/super-admin/specializations", icon: GitBranch },
                    { label: "Subjects", path: "/super-admin/subjects", icon: BookOpen },
                    { label: "Sections", path: "/super-admin/sections", icon: Presentation },
                ],
            },
            {
                title: "TIMETABLE MANAGEMENT",
                items: [
                    { label: "Academic Calendar", path: "/super-admin/academic-calendar", icon: CalendarRange },
                    { label: "Room Management", path: "/super-admin/rooms", icon: Building2 },
                    { label: "Base Timetable", path: "/super-admin/base", icon: CalendarDays },
                    { label: "Timetable Builder", path: "/super-admin/timetable/builder", icon: LayoutDashboard },
                    { label: "Lecture Allocation", path: "/super-admin/lecture-allocation", icon: Users },
                    { label: "Substitutions", path: "/super-admin/timetable/substitutions", icon: GitBranch },
                    { label: "Conflict Detection", path: "/super-admin/timetable/conflicts", icon: ShieldCheck },
                ],
            },
            {
                title: "USER MANAGEMENT",
                items: [
                    { label: "Students", path: "/super-admin/students", icon: GraduationCap },
                    { label: "Teachers", path: "/super-admin/teachers", icon: Users },
                    { label: "Security Guards", path: "/super-admin/security-guards", icon: Shield },
                    { label: "Roles & Permissions", path: "/super-admin/role-permissions", icon: ShieldCheck },
                    { label: "Assign Role to Teacher", path: "/super-admin/teachers/assign-role", icon: UserCog },
                    { label: "Teacher & Subject Enrollment", path: "/super-admin/teachers/subject-enrollment", icon: BookUser },
                ],
            },
            {
                title: "FINANCIAL MANAGEMENT",
                items: [
                    { label: "Fee Structures", path: "/super-admin/fee-structures", icon: Banknote },
                    { label: "Scholarships", path: "/super-admin/scholarships", icon: BadgePercent },
                ],
            },
        ],
    },

    ADMIN: {
        roleTitle: "College Operations",
        roleSubtitle: "Campus Administration",
        dashboardPath: "/admin",
        icon: Building2,
        badgeTone: "blue",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Campus Dashboard", path: "/admin", icon: LayoutDashboard },
                ],
            },
            {
                title: "ACADEMICS",
                items: [
                    { label: "Academic Years", path: "/admin/academic-years", icon: CalendarRange },
                    { label: "Courses", path: "/admin/courses", icon: BookMarked },
                    { label: "Specializations", path: "/admin/specializations", icon: GitBranch },
                    { label: "Subjects", path: "/admin/subjects", icon: BookOpen },
                    { label: "Class Sections", path: "/admin/sections", icon: Presentation },
                    { label: "Academic Calendar", path: "/admin/academic-calendar", icon: CalendarDays },
                    { label: "Master Timetable", path: "/admin/timetable", icon: LayoutDashboard },
                ],
            },
            {
                title: "PERSONNEL & USERS",
                items: [
                    { label: "Enrolled Students", path: "/admin/students", icon: GraduationCap },
                    { label: "Faculty Directory", path: "/admin/teachers", icon: Users },
                    { label: "Security Personnel", path: "/admin/security-guards", icon: Shield },
                ],
            },
            {
                title: "FINANCIAL",
                items: [
                    { label: "Fee Structures", path: "/admin/fee-structures", icon: Banknote },
                    { label: "Scholarships", path: "/admin/scholarships", icon: BadgePercent },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // SECURITY GUARD
    // -------------------------------------------------------------------------
    SECURITY_GUARD: {
        roleTitle: "Security Command",
        roleSubtitle: "Gate Operations & Patrol",
        dashboardPath: "/security-guard",
        icon: Shield,
        badgeTone: "cyan",
        menu: [
            {
                title: "OPERATIONS",
                items: [
                    { label: "Security Dashboard", path: "/security-guard", icon: LayoutDashboard },
                    { label: "Gate & Check-In Console", path: "/security-guard/check-in", icon: ShieldCheck, badge: "Live" },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // TEACHER & FACULTY
    // -------------------------------------------------------------------------
    TEACHER: {
        roleTitle: "Faculty Workspace",
        roleSubtitle: "Instructional Management",
        dashboardPath: "/teacher",
        icon: Users,
        badgeTone: "emerald",
        menu: [
            {
                title: "CLASSROOM & TEACHING",
                items: [
                    { label: "Faculty Dashboard", path: "/teacher", icon: LayoutDashboard },
                    { label: "Secure QR Attendance", path: "/teacher/attendance", icon: ScanLine, badge: "Live" },
                    { label: "Campus Entry / Exit Pass", path: "/teacher/campus-pass", icon: ShieldCheck },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // STUDENT
    // -------------------------------------------------------------------------
    STUDENT: {
        roleTitle: "Student Portal",
        roleSubtitle: "Academic Learning Center",
        dashboardPath: "/student",
        icon: GraduationCap,
        badgeTone: "blue",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Student Dashboard", path: "/student", icon: LayoutDashboard },
                    { label: "Timetable & Classes", path: "/student/timetable", icon: CalendarDays },
                ],
            },
            {
                title: "ATTENDANCE & CALENDAR",
                items: [
                    { label: "Campus Check-In Pass", path: "/student/campus-pass", icon: ShieldCheck, badge: "Gate" },
                    { label: "Secure QR Attendance", path: "/student/attendance", icon: ScanLine, badge: "Live" },
                    { label: "Academic Calendar", path: "/student/calendar", icon: CalendarRange },
                ],
            },
            {
                title: "FINANCE",
                items: [
                    { label: "Fee Account & Receipts", path: "/student/fees", icon: CreditCard },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // DEAN & SCHOOL DEAN
    // -------------------------------------------------------------------------
    DEAN: {
        roleTitle: "Executive Dean",
        roleSubtitle: "Academic Governance & Strategy",
        dashboardPath: "/dean",
        icon: School,
        badgeTone: "violet",
        menu: [
            {
                title: "GOVERNANCE",
                items: [
                    { label: "Dean Dashboard", path: "/dean", icon: LayoutDashboard },
                    { label: "Constituent Departments", path: "/dean/departments", icon: Network },
                    { label: "Faculty Leadership", path: "/dean/faculty", icon: Users },
                ],
            },
            {
                title: "PROGRAM OVERSIGHT",
                items: [
                    { label: "Academic Programs", path: "/dean/programs", icon: BookMarked },
                    { label: "Enrollment Statistics", path: "/dean/enrollments", icon: BarChart3 },
                    { label: "Accreditation & Audits", path: "/dean/accreditation", icon: ShieldCheck },
                ],
            },
            {
                title: "EXECUTIVE DESK",
                items: [
                    { label: "Dean Circulars & Orders", path: "/dean/circulars", icon: Megaphone },
                    { label: "Budget Allocations", path: "/dean/budget", icon: Banknote },
                ],
            },
        ],
    },

    SCHOOL_DEAN: {
        roleTitle: "School Dean",
        roleSubtitle: "School Operations & Quality",
        dashboardPath: "/dean",
        icon: School,
        badgeTone: "violet",
        menu: [
            {
                title: "GOVERNANCE",
                items: [
                    { label: "School Dashboard", path: "/dean", icon: LayoutDashboard },
                    { label: "Departments in School", path: "/dean/departments", icon: Network },
                    { label: "School Faculty", path: "/dean/faculty", icon: Users },
                ],
            },
            {
                title: "ACADEMICS",
                items: [
                    { label: "Curriculum Tracking", path: "/dean/programs", icon: BookMarked },
                    { label: "Performance Analytics", path: "/dean/enrollments", icon: BarChart3 },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // HEAD OF DEPARTMENT (HOD)
    // -------------------------------------------------------------------------
    HEAD_OF_DEPARTMENT: {
        roleTitle: "Department Head",
        roleSubtitle: "Department Leadership & Workload",
        dashboardPath: "/head-of-department",
        icon: Network,
        badgeTone: "amber",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Department Dashboard", path: "/head-of-department", icon: LayoutDashboard },
                    { label: "Department Timetable", path: "/head-of-department/timetable", icon: CalendarDays },
                ],
            },
            {
                title: "FACULTY & WORKLOAD",
                items: [
                    { label: "Faculty Allocation", path: "/head-of-department/faculty", icon: Users },
                    { label: "Subject Assignment", path: "/head-of-department/assignments", icon: BookUser },
                    { label: "Lab & Classroom Readiness", path: "/head-of-department/labs", icon: Building2 },
                ],
            },
            {
                title: "STUDENT PERFORMANCE",
                items: [
                    { label: "Batch & Section Health", path: "/head-of-department/sections", icon: Presentation },
                    { label: "Attendance Monitoring", path: "/head-of-department/attendance", icon: CheckCircle2 },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // PROGRAM COORDINATOR
    // -------------------------------------------------------------------------
    PROGRAM_COORDINATOR: {
        roleTitle: "Program Coordinator",
        roleSubtitle: "Curriculum & Batch Administration",
        dashboardPath: "/program-coordinator",
        icon: Workflow,
        badgeTone: "cyan",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Coordinator Dashboard", path: "/program-coordinator", icon: LayoutDashboard },
                    { label: "Active Cohorts", path: "/program-coordinator/batches", icon: Layers },
                ],
            },
            {
                title: "CURRICULUM & TIMETABLE",
                items: [
                    { label: "Program Timetable", path: "/program-coordinator/timetable", icon: CalendarDays },
                    { label: "Outcome Tracking (CO/PO)", path: "/program-coordinator/outcomes", icon: FileBadge },
                    { label: "Electives & Specializations", path: "/program-coordinator/electives", icon: GitBranch },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // SECTION MENTOR
    // -------------------------------------------------------------------------
    MENTOR: {
        roleTitle: "Section Mentor",
        roleSubtitle: "Student Guidance & Support",
        dashboardPath: "/mentor",
        icon: HeartPulse,
        badgeTone: "emerald",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Mentor Dashboard", path: "/mentor", icon: LayoutDashboard },
                    { label: "Assigned Mentees", path: "/mentor/mentees", icon: Users },
                ],
            },
            {
                title: "STUDENT MONITORING",
                items: [
                    { label: "Attendance Intervention", path: "/mentor/attendance", icon: CheckCircle2 },
                    { label: "Academic Risk Alerts", path: "/mentor/risk-alerts", icon: ShieldAlert },
                    { label: "Counseling & Guidance Logs", path: "/mentor/logs", icon: ClipboardList },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // FINANCE & ACCOUNTANT
    // -------------------------------------------------------------------------
    ACCOUNTANT: {
        roleTitle: "Finance & Accounts",
        roleSubtitle: "Fee Collection & Disbursements",
        dashboardPath: "/finance",
        icon: Banknote,
        badgeTone: "emerald",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Finance Dashboard", path: "/finance", icon: LayoutDashboard },
                    { label: "Fee Collections", path: "/finance/collections", icon: CreditCard },
                ],
            },
            {
                title: "TRANSACTIONS",
                items: [
                    { label: "Outstanding Dues", path: "/finance/dues", icon: Receipt },
                    { label: "Fee Structure Master", path: "/finance/structures", icon: Banknote },
                    { label: "Scholarship Approvals", path: "/finance/scholarships", icon: BadgePercent },
                ],
            },
        ],
    },

    FINANCE: {
        roleTitle: "Finance Desk",
        roleSubtitle: "Treasury & Fee Management",
        dashboardPath: "/finance",
        icon: Banknote,
        badgeTone: "emerald",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Finance Dashboard", path: "/finance", icon: LayoutDashboard },
                    { label: "Daily Collections", path: "/finance/collections", icon: CreditCard },
                    { label: "Fee Structures", path: "/finance/structures", icon: Banknote },
                    { label: "Scholarships", path: "/finance/scholarships", icon: BadgePercent },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // LIBRARIAN & LIBRARY
    // -------------------------------------------------------------------------
    LIBRARIAN: {
        roleTitle: "Library Hub",
        roleSubtitle: "Catalog & Circulation Services",
        dashboardPath: "/library",
        icon: Library,
        badgeTone: "amber",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Library Dashboard", path: "/library", icon: LayoutDashboard },
                    { label: "Circulation Desk", path: "/library/circulation", icon: BookOpen },
                ],
            },
            {
                title: "CATALOG",
                items: [
                    { label: "Book Catalog", path: "/library/catalog", icon: BookMarked },
                    { label: "Overdue & Penalties", path: "/library/fines", icon: Clock },
                    { label: "Member Digital Cards", path: "/library/members", icon: ScanLine },
                ],
            },
        ],
    },

    LIBRARY: {
        roleTitle: "Library Operations",
        roleSubtitle: "Learning Resources Center",
        dashboardPath: "/library",
        icon: Library,
        badgeTone: "amber",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Library Dashboard", path: "/library", icon: LayoutDashboard },
                    { label: "Book Circulation", path: "/library/circulation", icon: BookOpen },
                    { label: "Catalog Search", path: "/library/catalog", icon: BookMarked },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // CONTROLLER OF EXAMINATIONS (EXAM CONTROLLER)
    // -------------------------------------------------------------------------
    EXAM_CONTROLLER: {
        roleTitle: "Examination Controller",
        roleSubtitle: "Evaluation & Result Processing",
        dashboardPath: "/examination-dept",
        icon: FileBadge,
        badgeTone: "rose",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "COE Dashboard", path: "/examination-dept", icon: LayoutDashboard },
                    { label: "Exam Cycles", path: "/examination-dept/schedules", icon: CalendarRange },
                ],
            },
            {
                title: "EXAMINATION OPERATIONS",
                items: [
                    { label: "Hall Ticket Generation", path: "/examination-dept/hall-tickets", icon: FileBadge },
                    { label: "Seating Plans", path: "/examination-dept/seating", icon: Building2 },
                    { label: "Invigilation Duties", path: "/examination-dept/invigilation", icon: Users },
                    { label: "Result Tabulation", path: "/examination-dept/results", icon: FileSpreadsheet },
                ],
            },
        ],
    },

    EXAMINATION: {
        roleTitle: "Exam Operations",
        roleSubtitle: "University Evaluation Office",
        dashboardPath: "/examination-dept",
        icon: FileBadge,
        badgeTone: "rose",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Examination Dashboard", path: "/examination-dept", icon: LayoutDashboard },
                    { label: "Exam Schedules", path: "/examination-dept/schedules", icon: CalendarRange },
                    { label: "Hall Tickets", path: "/examination-dept/hall-tickets", icon: FileBadge },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // HUMAN RESOURCES (HR)
    // -------------------------------------------------------------------------
    HR: {
        roleTitle: "Human Resources",
        roleSubtitle: "Personnel & Staff Administration",
        dashboardPath: "/hr",
        icon: Users,
        badgeTone: "violet",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "HR Dashboard", path: "/hr", icon: LayoutDashboard },
                    { label: "Staff Directory", path: "/hr/staff", icon: Users },
                ],
            },
            {
                title: "PERSONNEL OPERATIONS",
                items: [
                    { label: "Faculty Recruitment", path: "/hr/recruitment", icon: UserPlus },
                    { label: "Leave Approvals", path: "/hr/leaves", icon: CalendarCheck2 },
                    { label: "Biometric Logs", path: "/hr/attendance", icon: Clock },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // COUNSELOR
    // -------------------------------------------------------------------------
    COUNSELOR: {
        roleTitle: "Student Counseling",
        roleSubtitle: "Mental Health & Academic Wellbeing",
        dashboardPath: "/counselor",
        icon: HeartPulse,
        badgeTone: "cyan",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Counselor Dashboard", path: "/counselor", icon: LayoutDashboard },
                    { label: "Appointments Today", path: "/counselor/appointments", icon: Calendar },
                ],
            },
            {
                title: "CASEWORK",
                items: [
                    { label: "Active Casework", path: "/counselor/cases", icon: ClipboardCheck },
                    { label: "Wellness Programs", path: "/counselor/wellness", icon: HeartPulse },
                ],
            },
        ],
    },

    // -------------------------------------------------------------------------
    // ADMISSION
    // -------------------------------------------------------------------------
    ADMISSION: {
        roleTitle: "Admissions Center",
        roleSubtitle: "Student Intake & Enrollment",
        dashboardPath: "/admission",
        icon: GraduationCap,
        badgeTone: "blue",
        menu: [
            {
                title: "OVERVIEW",
                items: [
                    { label: "Admissions Dashboard", path: "/admission", icon: LayoutDashboard },
                    { label: "Application Forms", path: "/admission/applications", icon: FileText },
                ],
            },
            {
                title: "INTAKE PROCESS",
                items: [
                    { label: "Document Verification", path: "/admission/verification", icon: FileCheck },
                    { label: "Merit Lists & Counseling", path: "/admission/merit-lists", icon: BarChart3 },
                    { label: "Seat Allotment", path: "/admission/allotments", icon: Building2 },
                ],
            },
        ],
    },
};

export function getRoleConfig(roleKey?: string | null, pathname?: string): RoleConfig {
    // 1. Try URL path matching first
    if (pathname) {
        if (pathname.startsWith("/security-guard")) return ROLE_NAVIGATION_CONFIGS.SECURITY_GUARD;
        if (pathname.startsWith("/teacher")) return ROLE_NAVIGATION_CONFIGS.TEACHER;
        if (pathname.startsWith("/student")) return ROLE_NAVIGATION_CONFIGS.STUDENT;
        if (pathname.startsWith("/dean") || pathname.startsWith("/school-dean")) return ROLE_NAVIGATION_CONFIGS.DEAN;
        if (pathname.startsWith("/head-of-department") || pathname.startsWith("/hod")) return ROLE_NAVIGATION_CONFIGS.HEAD_OF_DEPARTMENT;
        if (pathname.startsWith("/program-coordinator") || pathname.startsWith("/coordinator")) return ROLE_NAVIGATION_CONFIGS.PROGRAM_COORDINATOR;
        if (pathname.startsWith("/mentor")) return ROLE_NAVIGATION_CONFIGS.MENTOR;
        if (pathname.startsWith("/finance") || pathname.startsWith("/accountant")) return ROLE_NAVIGATION_CONFIGS.FINANCE;
        if (pathname.startsWith("/library") || pathname.startsWith("/librarian")) return ROLE_NAVIGATION_CONFIGS.LIBRARY;
        if (pathname.startsWith("/examination-dept") || pathname.startsWith("/exam-controller") || pathname.startsWith("/examination")) return ROLE_NAVIGATION_CONFIGS.EXAMINATION;
        if (pathname.startsWith("/hr")) return ROLE_NAVIGATION_CONFIGS.HR;
        if (pathname.startsWith("/counselor")) return ROLE_NAVIGATION_CONFIGS.COUNSELOR;
        if (pathname.startsWith("/admission")) return ROLE_NAVIGATION_CONFIGS.ADMISSION;
        if (pathname.startsWith("/super-admin")) return ROLE_NAVIGATION_CONFIGS.SUPER_ADMIN;
        if (pathname.startsWith("/admin")) return ROLE_NAVIGATION_CONFIGS.ADMIN;
    }

    // 2. Try role key
    const normalized = (roleKey || "").replace(/^ROLE_/, "").toUpperCase();
    if (ROLE_NAVIGATION_CONFIGS[normalized]) {
        return ROLE_NAVIGATION_CONFIGS[normalized];
    }

    // Default to Super Admin config
    return ROLE_NAVIGATION_CONFIGS.SUPER_ADMIN;
}
