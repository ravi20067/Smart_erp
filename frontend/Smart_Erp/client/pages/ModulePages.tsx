import {
    Activity,
    AlarmClock,
    ArrowLeftRight,
    BarChart3,
    BookOpen,
    BrainCircuit,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileBarChart,
    FileText,
    GraduationCap,
    Layers3,
    ListChecks,
    LockKeyhole,
    Network,
    School,
    Search,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UserRound,
    Users,
    UsersRound,
    Workflow,
} from "lucide-react";

import ModuleLandingPage, {
    type ModulePageConfig,
    defaultFaqs,
} from "@/components/marketing/ModuleLandingPage";

const academicAdministration: ModulePageConfig = {
    eyebrow: "Academic administration",
    title: "Build a stronger",
    highlightedTitle: "academic foundation.",
    description:
        "Organize academic years, courses, sections, classes, and subjects through a structured academic administration experience designed for educational institutions.",
    primaryCta: "Explore Smart ERP",
    secondaryCta: "Explore capabilities",
    icon: <School size={21} />,
    accent: "cyan",
    benefits: [
        "Academic year organization",
        "Course and section structure",
        "Subject-level configuration",
        "Connected academic records",
    ],
    featuresTitle: "Academic administration capabilities",
    featuresDescription:
        "Establish a consistent academic structure that helps administrators organize courses, assign sections, and manage the relationships between academic entities.",
    features: [
        {
            icon: <CalendarDays size={22} />,
            title: "Academic year management",
            description:
                "Organize academic structures by year so that institutional planning follows a clear academic timeline.",
        },
        {
            icon: <GraduationCap size={22} />,
            title: "Course management",
            description:
                "Maintain course information and organize the sections and subject structure associated with each course.",
        },
        {
            icon: <Layers3 size={22} />,
            title: "Class and section organization",
            description:
                "Represent the relationship between courses, sections, and classes through a consistent hierarchy.",
        },
        {
            icon: <BookOpen size={22} />,
            title: "Subject configuration",
            description:
                "Associate subjects with courses and support course-specific settings such as weekly lectures, lecture duration, and practical-subject classification.",
        },
        {
            icon: <ArrowLeftRight size={22} />,
            title: "Academic structure copying",
            description:
                "Use the planned copy-structure workflow to carry an existing academic structure into a selected target academic year.",
        },
        {
            icon: <Network size={22} />,
            title: "Connected academic entities",
            description:
                "Keep courses, sections, subjects, and related academic records organized around their defined relationships.",
        },
    ],
    workflowTitle: "From academic planning to an organized structure.",
    workflowDescription:
        "Create a dependable academic foundation first. Other institutional workflows can then use the academic structure as their organizational context.",
    workflow: [
        {
            number: "01",
            title: "Set up the academic year",
            description:
                "Select the academic year for which the institution needs to configure its academic structure.",
        },
        {
            number: "02",
            title: "Define courses and sections",
            description:
                "Create courses and organize the sections and classes that belong to the academic hierarchy.",
        },
        {
            number: "03",
            title: "Configure subjects",
            description:
                "Associate subjects with courses and configure relevant academic settings, including lecture frequency and duration.",
        },
        {
            number: "04",
            title: "Prepare the next cycle",
            description:
                "Review the existing structure and use the available copy-structure workflow where applicable to prepare a target academic year.",
        },
    ],
    useCases: [
        "Academic coordinators organizing courses",
        "Administrators configuring academic years",
        "Institutions managing multiple sections",
        "Teams maintaining course-subject relationships",
        "Planning for a new academic session",
        "Maintaining a consistent academic hierarchy",
    ],
    faqs: [
        {
            question: "Can I organize courses by academic year?",
            answer:
                "The intended workflow supports selecting an academic year and managing the courses associated with that year.",
        },
        {
            question: "Can a course contain multiple sections?",
            answer:
                "Yes. The Smart ERP academic model defines a one-to-many relationship between a course and its sections.",
        },
        {
            question: "Can subjects have course-specific settings?",
            answer:
                "The course-subject structure supports settings such as lectures per week, lecture duration in minutes, and whether a subject is practical.",
        },
        {
            question: "Can I copy the academic structure to another year?",
            answer:
                "The existing project design includes a copy-structure workflow for copying the current year's course structure to a selected target academic year. The exact behavior depends on its implementation.",
        },
    ],
};

const studentManagement: ModulePageConfig = {
    eyebrow: "Student management",
    title: "Every student record,",
    highlightedTitle: "better organized.",
    description:
        "Bring student profiles and institutional records into a more structured experience, helping authorized teams find information and manage student-related workflows more clearly.",
    primaryCta: "Explore Smart ERP",
    secondaryCta: "Explore capabilities",
    icon: <Users size={21} />,
    accent: "violet",
    benefits: [
        "Organized student profiles",
        "Centralized record access",
        "Structured academic context",
        "Permission-aware workflows",
    ],
    featuresTitle: "Student management capabilities",
    featuresDescription:
        "Give authorized institutional teams a consistent place to work with student information and related academic records.",
    features: [
        {
            icon: <UserRound size={22} />,
            title: "Student profiles",
            description:
                "Present student information in an organized profile view so authorized users can find relevant records more easily.",
        },
        {
            icon: <FileText size={22} />,
            title: "Student record organization",
            description:
                "Keep student-related information structured instead of scattering records across disconnected workflows.",
        },
        {
            icon: <GraduationCap size={22} />,
            title: "Academic associations",
            description:
                "Connect student workflows to the institution's course, section, class, and academic-year structure where supported.",
        },
        {
            icon: <Search size={22} />,
            title: "Record discovery",
            description:
                "Design clear record lists and profile navigation to help authorized staff locate the information they need.",
        },
        {
            icon: <ShieldCheck size={22} />,
            title: "Controlled access",
            description:
                "Align access to student records with the platform's authorization and resource-permission model.",
        },
        {
            icon: <Workflow size={22} />,
            title: "Connected workflows",
            description:
                "Create a clearer student-management experience that can fit alongside attendance and other institutional modules.",
        },
    ],
    workflowTitle: "A clearer path from student record to action.",
    workflowDescription:
        "A structured student experience makes it easier for institutional teams to navigate records while keeping the wider academic context in view.",
    workflow: [
        {
            number: "01",
            title: "Locate the student",
            description:
                "Use the student list and available search or filtering controls to navigate to the required record.",
        },
        {
            number: "02",
            title: "Review the profile",
            description:
                "Present relevant student details in a clear profile layout, with access governed by the implemented permissions.",
        },
        {
            number: "03",
            title: "Understand academic context",
            description:
                "Display relevant academic associations where those relationships are available in the application.",
        },
        {
            number: "04",
            title: "Continue the workflow",
            description:
                "Navigate to the next authorized student-related action without losing the record's context.",
        },
    ],
    useCases: [
        "Student administration teams",
        "Authorized academic coordinators",
        "Staff reviewing student profiles",
        "Teams organizing student records",
        "Institutions using section-based organization",
        "Workflows connected with attendance",
    ],
    faqs: [
        {
            question: "Does this module manage student profiles?",
            answer:
                "Student records and profiles are the core focus of this module page. The exact fields and supported operations depend on your implemented student entity and APIs.",
        },
        {
            question: "Can student records be connected to courses and sections?",
            answer:
                "The UI can present those associations when the backend exposes them. The exact student-to-course or student-to-section relationship should follow your actual data model.",
        },
        {
            question: "Will this page change my student APIs?",
            answer:
                "No. The page is a public-facing marketing page and does not alter API endpoints, data models, or authentication behavior.",
        },
        {
            question: "Can access to student records be restricted?",
            answer:
                "The page describes a permission-aware experience. Actual restrictions must be enforced by the existing authorization system in the application.",
        },
    ],
};

const teacherManagement: ModulePageConfig = {
    eyebrow: "Teacher management",
    title: "Support your faculty,",
    highlightedTitle: "simplify coordination.",
    description:
        "Organize teacher profiles, subject associations, and teaching assignments around your institution's academic structure, giving teams a clearer view of faculty responsibilities.",
    primaryCta: "Explore Smart ERP",
    secondaryCta: "Explore capabilities",
    icon: <UsersRound size={21} />,
    accent: "blue",
    benefits: [
        "Organized teacher records",
        "Subject-teacher associations",
        "Teaching assignment visibility",
        "Connected academic workflows",
    ],
    featuresTitle: "Faculty management capabilities",
    featuresDescription:
        "Bring teacher information and academic responsibilities into a coherent interface that supports everyday institutional coordination.",
    features: [
        {
            icon: <UserCheck size={22} />,
            title: "Teacher profiles",
            description:
                "Organize faculty information in a clear profile experience for authorized institutional users.",
        },
        {
            icon: <BookOpen size={22} />,
            title: "Subject associations",
            description:
                "Represent the subjects associated with teachers using the institution's configured academic relationships.",
        },
        {
            icon: <ClipboardCheck size={22} />,
            title: "Teaching assignments",
            description:
                "Provide a structured view of teaching responsibilities and related academic assignments where supported.",
        },
        {
            icon: <CalendarDays size={22} />,
            title: "Schedule context",
            description:
                "Help faculty and coordinators understand how teaching responsibilities relate to the institutional timetable.",
        },
        {
            icon: <ShieldCheck size={22} />,
            title: "Role-aware access",
            description:
                "Keep staff-facing operations aligned with the existing authorization rules and resource-level permissions.",
        },
        {
            icon: <Network size={22} />,
            title: "Connected academic structure",
            description:
                "Keep faculty workflows connected to subjects, courses, and other relevant academic entities.",
        },
    ],
    workflowTitle: "Make faculty responsibilities easier to follow.",
    workflowDescription:
        "A structured teacher-management experience helps authorized staff move from a faculty record to the relevant academic associations.",
    workflow: [
        {
            number: "01",
            title: "Maintain teacher information",
            description:
                "Organize the faculty profile and the teacher information exposed by the existing application.",
        },
        {
            number: "02",
            title: "Associate subjects",
            description:
                "Represent the teacher-subject associations configured for the institution.",
        },
        {
            number: "03",
            title: "Review assignments",
            description:
                "Present relevant teaching responsibilities and academic associations in an accessible view.",
        },
        {
            number: "04",
            title: "Coordinate schedules",
            description:
                "Connect the teacher experience to timetable information where the corresponding workflow is implemented.",
        },
    ],
    useCases: [
        "Faculty administration teams",
        "Academic coordinators",
        "Teachers reviewing their responsibilities",
        "Staff managing subject associations",
        "Teams coordinating academic schedules",
        "Institutions organizing faculty records",
    ],
    faqs: [
        {
            question: "Can one teacher be associated with multiple subjects?",
            answer:
                "Your stated Smart ERP data model includes a many-to-many relationship between subjects and teachers.",
        },
        {
            question: "Does teacher management include timetable functionality?",
            answer:
                "This page describes schedule context and faculty coordination. Actual timetable creation and conflict handling belong to the implemented timetable workflow.",
        },
        {
            question: "Can teaching assignments be displayed by subject?",
            answer:
                "The interface can display subject associations and assignments when those details are provided by the existing backend.",
        },
        {
            question: "Will this modify the teacher entity?",
            answer:
                "No. This marketing page does not change entities, repositories, APIs, or database relationships.",
        },
    ],
};

const attendanceManagement: ModulePageConfig = {
    eyebrow: "Attendance management",
    title: "Attendance that is",
    highlightedTitle: "easier to verify.",
    description:
        "Present attendance workflows around clear class context, teacher-led verification, and student attendance records, with room for the QR-based and real-time workflow planned for Smart ERP.",
    primaryCta: "Explore Smart ERP",
    secondaryCta: "Explore capabilities",
    icon: <CalendarCheck size={21} />,
    accent: "emerald",
    benefits: [
        "Class-based attendance workflows",
        "QR attendance experience",
        "Teacher-led verification",
        "Real-time updates when implemented",
    ],
    featuresTitle: "Attendance management capabilities",
    featuresDescription:
        "Make attendance easier to understand and operate by separating the session, verification, recording, and review stages.",
    features: [
        {
            icon: <CalendarCheck size={22} />,
            title: "Attendance sessions",
            description:
                "Organize attendance around the relevant class, subject, teacher, and scheduled session where those details are available.",
        },
        {
            icon: <ShieldCheck size={22} />,
            title: "Verification workflow",
            description:
                "Present the verification steps clearly so users understand how an attendance submission is expected to be checked.",
        },
        {
            icon: <Sparkles size={22} />,
            title: "QR-based attendance",
            description:
                "Provide a clear interface for the planned teacher-generated QR flow and student scanning experience.",
        },
        {
            icon: <Activity size={22} />,
            title: "Live status visibility",
            description:
                "Design the UI for status changes and attendance events. Live updates require the existing WebSocket or other real-time integration.",
        },
        {
            icon: <ClipboardCheck size={22} />,
            title: "Attendance records",
            description:
                "Present attendance outcomes in an organized record view that supports reviewing the status of a session.",
        },
        {
            icon: <LockKeyhole size={22} />,
            title: "Verification-aware design",
            description:
                "Keep the interface clear about session validation and authorized actions without treating a QR scan alone as proof of identity.",
        },
    ],
    workflowTitle: "From session creation to attendance review.",
    workflowDescription:
        "The page reflects the planned QR attendance journey. Security-sensitive checks must remain enforced by the actual backend and verification logic.",
    workflow: [
        {
            number: "01",
            title: "Prepare the attendance session",
            description:
                "The teacher opens the relevant class or subject session in the attendance workflow.",
        },
        {
            number: "02",
            title: "Present the QR code",
            description:
                "The teacher interface displays a session QR code according to the token-generation and expiry rules implemented by the backend.",
        },
        {
            number: "03",
            title: "Scan and verify",
            description:
                "The student scanning interface submits the required information for server-side validation. A QR image by itself should not be treated as sufficient proof of identity.",
        },
        {
            number: "04",
            title: "Record and review",
            description:
                "After successful verification, the backend records attendance and can publish status updates through the configured real-time channel.",
        },
    ],
    useCases: [
        "Teachers conducting class attendance",
        "Students using an attendance scanner",
        "Administrators reviewing attendance records",
        "Sessions organized by class or subject",
        "QR-based attendance workflows",
        "Teams monitoring attendance status",
    ],
    faqs: [
        {
            question: "Does Smart ERP support the planned QR attendance experience?",
            answer:
                "Your project context includes a teacher-generated QR code, student scanning, backend verification, attendance recording, and WebSocket updates. The exact behavior depends on the current implementation.",
        },
        {
            question: "Can attendance updates appear in real time?",
            answer:
                "The interface can support real-time status updates, but those updates require a working backend event flow and WebSocket connection.",
        },
        {
            question: "Is scanning a QR code sufficient to authenticate a student?",
            answer:
                "No. A secure workflow should validate the session token on the server and apply the configured identity, authorization, expiry, and replay protections.",
        },
        {
            question: "Can face verification be part of attendance?",
            answer:
                "Your project discussions include face-authentication options. Whether face verification is enabled, optional, or unavailable must be determined by the actual product settings and implementation.",
        },
    ],
};

const timetableScheduling: ModulePageConfig = {
    eyebrow: "Timetable & scheduling",
    title: "Plan every class with",
    highlightedTitle: "greater clarity.",
    description:
        "Give academic coordinators a clearer way to view class schedules, subject sessions, teaching assignments, and timetable organization across an institution.",
    primaryCta: "Explore Smart ERP",
    secondaryCta: "Explore capabilities",
    icon: <CalendarDays size={21} />,
    accent: "amber",
    benefits: [
        "Structured schedule views",
        "Subject and class context",
        "Teaching assignment visibility",
        "Planning-oriented interface",
    ],
    featuresTitle: "Timetable and scheduling capabilities",
    featuresDescription:
        "Bring the key parts of academic scheduling into a consistent interface, while keeping scheduling rules aligned with the institution's actual requirements.",
    features: [
        {
            icon: <CalendarDays size={22} />,
            title: "Timetable overview",
            description:
                "Present a structured schedule view for reviewing planned academic sessions and class activities.",
        },
        {
            icon: <Clock3 size={22} />,
            title: "Lecture timing",
            description:
                "Display lecture timing and duration using the schedule data configured for the relevant subject or session.",
        },
        {
            icon: <GraduationCap size={22} />,
            title: "Class and subject context",
            description:
                "Keep timetable entries associated with the relevant class, course, and subject information where supported.",
        },
        {
            icon: <UsersRound size={22} />,
            title: "Teacher assignment visibility",
            description:
                "Help coordinators review which teacher is associated with a scheduled teaching session.",
        },
        {
            icon: <ListChecks size={22} />,
            title: "Schedule organization",
            description:
                "Provide a clear way to navigate timetable entries by the supported academic and scheduling dimensions.",
        },
        {
            icon: <AlarmClock size={22} />,
            title: "Planning and review",
            description:
                "Make schedule information easier to review before publishing or using it in connected institutional workflows.",
        },
    ],
    workflowTitle: "Turn academic requirements into a readable schedule.",
    workflowDescription:
        "A timetable is most useful when class, subject, teacher, and time information can be reviewed together. Actual scheduling constraints must be handled by the implemented scheduling logic.",
    workflow: [
        {
            number: "01",
            title: "Choose the academic context",
            description:
                "Select the relevant academic year, course, class, or section supported by the timetable interface.",
        },
        {
            number: "02",
            title: "Review teaching requirements",
            description:
                "Use subject settings and teacher associations where available to understand the scheduling requirements.",
        },
        {
            number: "03",
            title: "Organize schedule entries",
            description:
                "Present sessions with their relevant day, time, subject, class, and teacher information.",
        },
        {
            number: "04",
            title: "Review the timetable",
            description:
                "Check the resulting schedule and any validation feedback provided by the actual application.",
        },
    ],
    useCases: [
        "Academic timetable coordinators",
        "Course and section planners",
        "Teachers reviewing schedules",
        "Administrators organizing lecture times",
        "Institutions planning weekly classes",
        "Teams reviewing subject allocations",
    ],
    faqs: [
        {
            question: "Can timetable entries show teacher and subject information?",
            answer:
                "The intended UI can present these details when they are part of the implemented timetable data and related academic associations.",
        },
        {
            question: "Can the timetable prevent teacher or room conflicts?",
            answer:
                "Conflict prevention requires scheduling validation rules in the application. The marketing UI alone does not enforce scheduling constraints.",
        },
        {
            question: "Can lecture duration use course-subject settings?",
            answer:
                "Your academic model includes a lecture-duration setting on CourseSubject. Whether the timetable uses that setting must be verified against its implementation.",
        },
        {
            question: "Does this page create actual timetable entries?",
            answer:
                "No. This is a public module landing page. Actual timetable creation belongs to the authenticated application and its existing APIs.",
        },
    ],
};

const reportsAnalytics: ModulePageConfig = {
    eyebrow: "Reports & analytics",
    title: "Turn institutional data",
    highlightedTitle: "into clear insights.",
    description:
        "Give institutional teams a more understandable view of operational information through structured reports, visual summaries, and analytics-oriented workflows.",
    primaryCta: "Explore Smart ERP",
    secondaryCta: "Explore capabilities",
    icon: <BarChart3 size={21} />,
    accent: "pink",
    benefits: [
        "Readable data summaries",
        "Report-oriented workflows",
        "Visual information hierarchy",
        "Role-aware access design",
    ],
    featuresTitle: "Reporting and analytics capabilities",
    featuresDescription:
        "Design information views that help people understand institutional activity without presenting illustrative charts as real operational data.",
    features: [
        {
            icon: <BarChart3 size={22} />,
            title: "Visual summaries",
            description:
                "Use charts and summary cards to communicate supported metrics in a way that is easier to scan and understand.",
        },
        {
            icon: <FileBarChart size={22} />,
            title: "Structured reports",
            description:
                "Organize report information into readable sections, with clear labels, dates, and contextual details.",
        },
        {
            icon: <Activity size={22} />,
            title: "Trend visibility",
            description:
                "Present historical trends when the underlying data and reporting logic support meaningful comparisons.",
        },
        {
            icon: <CalendarCheck size={22} />,
            title: "Time-based analysis",
            description:
                "Organize reports by supported periods, such as academic year, month, or another available reporting interval.",
        },
        {
            icon: <Users size={22} />,
            title: "Institutional overview",
            description:
                "Bring relevant operational summaries into one interface while respecting the access granted to each user.",
        },
        {
            icon: <BrainCircuit size={22} />,
            title: "AI-ready reporting direction",
            description:
                "Provide a place for future AI-assisted explanations and natural-language insights, subject to actual model and data integration.",
        },
    ],
    workflowTitle: "Move from raw information to useful reporting.",
    workflowDescription:
        "Good analytics start with reliable data, clearly defined metrics, and a report that explains what is being measured.",
    workflow: [
        {
            number: "01",
            title: "Choose a report context",
            description:
                "Select the report type and available time period or organizational scope.",
        },
        {
            number: "02",
            title: "Retrieve the relevant data",
            description:
                "Use the application's implemented reporting endpoints and authorized data sources to populate the report.",
        },
        {
            number: "03",
            title: "Explore the results",
            description:
                "Present supported metrics through tables, charts, summary cards, and meaningful labels.",
        },
        {
            number: "04",
            title: "Share or act on findings",
            description:
                "Expose only the export, sharing, or follow-up actions that the application actually supports.",
        },
    ],
    useCases: [
        "Institutional administrators",
        "Academic coordinators",
        "Teams reviewing attendance patterns",
        "Users preparing institutional reports",
        "Decision-makers reviewing trends",
        "Future AI-assisted analytics workflows",
    ],
    faqs: [
        {
            question: "Will the charts show real institutional data?",
            answer:
                "The charts in this public marketing page are illustrative. Actual reports must use the existing backend data and implemented reporting endpoints.",
        },
        {
            question: "Can analytics include attendance reports?",
            answer:
                "Attendance reporting is a potential use case. The available metrics depend on the attendance records, reporting logic, and endpoints implemented in your project.",
        },
        {
            question: "Can AI explain report results?",
            answer:
                "The page presents AI-assisted reporting as a possible direction. It requires a working model integration, appropriate data access, and safeguards against unsupported conclusions.",
        },
        {
            question: "Can users export reports?",
            answer:
                "Export functionality should only be shown as operational once a supported export workflow is implemented. This landing page does not create that functionality.",
        },
    ],
};

export function AcademicAdministrationPage() {
    return <ModuleLandingPage config={academicAdministration} />;
}

export function StudentManagementPage() {
    return <ModuleLandingPage config={studentManagement} />;
}

export function TeacherManagementPage() {
    return <ModuleLandingPage config={teacherManagement} />;
}

export function AttendanceManagementPage() {
    return <ModuleLandingPage config={attendanceManagement} />;
}

export function TimetableSchedulingPage() {
    return <ModuleLandingPage config={timetableScheduling} />;
}

export function ReportsAnalyticsPage() {
    return <ModuleLandingPage config={reportsAnalytics} />;
}