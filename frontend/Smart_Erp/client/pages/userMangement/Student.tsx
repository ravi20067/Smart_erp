import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownUp,
    BookOpen,
    Building2,
    Calendar,
    CalendarDays,
    Camera,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CircleUserRound,
    Copy,
    Eye,
    Filter,
    FilterX,
    GraduationCap,
    KeyRound,
    Layers3,
    LoaderCircle,
    Mail,
    MapPin,
    Network,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    UserCheck,
    UserPlus,
    UserRound,
    UserRoundCheck,
    UserRoundX,
    Users,
    Wallet,
    X,
} from "lucide-react";
import {
    ENROLLMENT_STATUSES,
    changeStudentCourse,
    changeStudentSection,
    changeStudentEnabled,
    changeStudentEnrollmentStatus,
    createStudent,
    extractStudentErrorMessage,
    filterSection,
    getStudentEnrollments,
    getStudentScholarships,
    getStudentSectionGroups,
    getStudentPhoto,
    resetStudentPassword,
    updateStudentProfile,
    updateStudentScholarships,
    type CommonDTO,
    type EnrollmentStatus,
    type SectionGroupFilter,
    type StudentCreateRequest,
    type StudentEnrollmentResponse,
    type StudentProfileUpdateRequest,
    type UserProfileRequest,
} from "@/services/userMangement/studentService";
import { PassportPhotoUpload } from "@/components/PassportPhotoUpload";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 8;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortMode =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "ROLL_ASC"
    | "REG_ASC"
    | "BALANCE_DESC";

type DialogMode =
    | "CREATE"
    | "VIEW"
    | "PROFILE"
    | "SCHOLARSHIPS"
    | "COURSE"
    | "STATUS"
    | "RESET_PASSWORD"
    | "ENABLE"
    | "SECTION";

type ProfileForm = UserProfileRequest;

const EMPTY_PROFILE: ProfileForm = {
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    phone: "",
    fatherName: "",
    motherName: "",
    guardianMobileNumber: "",
    address: "",
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "Active",
    COMPLETED: "Completed",
    TRANSFERRED: "Transferred",
    WITHDRAWN: "Withdrawn",
    SUSPENDED: "Suspended",
    CANCELLED: "Cancelled",
    DISABLE: "Disabled",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
    ACTIVE: "Student is actively enrolled and attending classes",
    COMPLETED: "Student has successfully completed their degree/program",
    TRANSFERRED: "Transferred to another institution or branch",
    WITHDRAWN: "Withdrawn from the university before program completion",
    SUSPENDED: "Temporarily suspended due to disciplinary or academic reasons",
    CANCELLED: "Enrollment offer or admission cancelled",
    DISABLE: "Enrollment deactivated",
};

function hasAction(
    student: StudentEnrollmentResponse,
    action: "READ" | "UPDATE" | "DELETE" | "CREATE_CHILD"
) {
    return Array.isArray(student.permissionActions) && student.permissionActions.includes(action);
}

function fullName(student: StudentEnrollmentResponse) {
    const profile = student.student.basicDetailRequest;
    return (
        `${profile.firstName} ${profile.lastName}`.trim() ||
        profile.username ||
        `Student ${student.student.id}`
    );
}

function initials(name: string) {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "ST"
    );
}

function formatDate(value?: string | null) {
    if (!value) return "Not provided";
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
}

function formatMoney(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
}

function statusTone(status: string) {
    switch (status.toUpperCase()) {
        case "ACTIVE":
            return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
        case "COMPLETED":
            return "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
        case "SUSPENDED":
            return "border-amber-400/30 bg-amber-500/10 text-amber-300";
        case "WITHDRAWN":
        case "CANCELLED":
        case "DISABLE":
            return "border-rose-400/30 bg-rose-500/10 text-rose-300";
        case "TRANSFERRED":
            return "border-violet-400/30 bg-violet-500/10 text-violet-300";
        default:
            return "border-white/10 bg-white/5 text-slate-300";
    }
}

function accountTone(enabled: boolean) {
    return enabled
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
        : "border-rose-400/30 bg-rose-500/10 text-rose-300";
}

function formatCommon(dto?: CommonDTO | null): string {
    if (!dto) return "";
    const name = dto.name || `ID ${dto.id}`;
    return dto.code ? `${name} (${dto.code})` : name;
}

function getSectionGroupLabel(item: SectionGroupFilter) {
    const parts = [
        formatCommon(item.sectionGroup),
        formatCommon(item.specialization),
        formatCommon(item.courses),
    ].filter(Boolean);
    return parts.join(" · ");
}

function SelectChevron() {
    return (
        <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${active
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-rose-400"}`}
            />
            {active ? "Account Active" : "Account Disabled"}
        </span>
    );
}

function ErrorBanner({
    title,
    message,
    onRetry,
    onDismiss,
}: {
    title: string;
    message: string;
    onRetry?: () => void;
    onDismiss: () => void;
}) {
    return (
        <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
            <div className="flex min-w-0 items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                <div className="min-w-0">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 break-words text-xs sm:text-sm">{message}</p>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss error"
                className="shrink-0 text-slate-400 transition hover:text-white"
            >
                <X size={17} />
            </button>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Modal Shell Component                                                      */
/* -------------------------------------------------------------------------- */

function Modal({
    title,
    subtitle,
    onClose,
    children,
    wide = false,
    icon: Icon = CircleUserRound,
    iconTone = "cyan",
}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
    icon?: typeof CircleUserRound;
    iconTone?: "cyan" | "violet" | "sky" | "amber" | "rose" | "emerald";
}) {
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const toneClasses = {
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
        sky: "bg-sky-500/10 text-sky-400 border-sky-500/30",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5">
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.section
                role="dialog"
                aria-modal="true"
                aria-label={title}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                transition={{ duration: 0.2 }}
                className={`relative z-10 flex max-h-[92vh] sm:max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/70 ${wide ? "max-w-4xl" : "max-w-xl"
                    }`}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur-md sm:px-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`rounded-xl border p-2 shrink-0 sm:p-2.5 ${toneClasses[iconTone]}`}>
                            <Icon size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-bold tracking-tight text-white truncate sm:text-lg">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white shrink-0 ml-3"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 custom-scrollbar">
                    {children}
                </div>
            </motion.section>
        </div>
    );
}

function Field({
    label,
    children,
    hint,
    required = false,
}: {
    label: string;
    children: ReactNode;
    hint?: string;
    required?: boolean;
}) {
    return (
        <label className="block min-w-0 space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                {label} {required && <span className="text-rose-400">*</span>}
            </span>
            {children}
            {hint && <span className="block text-[11px] leading-4 text-slate-500">{hint}</span>}
        </label>
    );
}

const inputClass =
    "w-full min-w-0 rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50";
const buttonSecondary =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const buttonPrimary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

/* -------------------------------------------------------------------------- */
/* Main Student Page Component                                                */
/* -------------------------------------------------------------------------- */

export default function Student() {
    const reduceMotion = useReducedMotion();
    const [students, setStudents] = useState<StudentEnrollmentResponse[]>([]);
    const [sectionGroups, setSectionGroups] = useState<SectionGroupFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [notice, setNotice] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [exactStatus, setExactStatus] = useState("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [yearFilter, setYearFilter] = useState("ALL");
    const [courseFilter, setCourseFilter] = useState("ALL");
    const [specializationFilter, setSpecializationFilter] = useState("ALL");
    const [groupFilter, setGroupFilter] = useState("ALL");
    const [accountFilter, setAccountFilter] = useState("ALL");
    const [scholarshipFilter, setScholarshipFilter] = useState("ALL");
    const [feeFilter, setFeeFilter] = useState("ALL");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>("NEWEST");
    const [page, setPage] = useState(1);

    // Active Dialog State
    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        student?: StudentEnrollmentResponse;
    } | null>(null);
    const [busy, setBusy] = useState(false);

    // Dialog form states
    const [selectedScholarships, setSelectedScholarships] = useState<number[]>([]);
    const [scholarships, setScholarships] = useState<CommonDTO[]>([]);
    const [scholarshipLoading, setScholarshipLoading] = useState(false);
    const [selectedSectionGroupId, setSelectedSectionGroupId] = useState<number | "">("");
    const [sections, setSections] = useState<CommonDTO[]>([]);
    const [sectionLoading, setSectionLoading] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState<number | "">("");
    const [selectedStatus, setSelectedStatus] = useState<EnrollmentStatus>("ACTIVE");
    const [profileForm, setProfileForm] = useState<ProfileForm>(EMPTY_PROFILE);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoUrl, setPhotoUrl] = useState("");
    const [photoLoading, setPhotoLoading] = useState(false);
    const [dueDate, setDueDate] = useState("");
    const [createScholarshipIds, setCreateScholarshipIds] = useState<number[]>([]);
    const [viewTab, setViewTab] = useState<"overview" | "academics" | "financials">("overview");

    // Action menu dropdown state
    const [actionMenu, setActionMenu] = useState<{
        student: StudentEnrollmentResponse;
        x: number;
        y: number;
    } | null>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    // Close action menu on click outside or escape
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                actionMenuRef.current &&
                !actionMenuRef.current.contains(e.target as Node)
            ) {
                setActionMenu(null);
            }
        }
        function handleScroll() {
            if (actionMenu) setActionMenu(null);
        }
        window.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [actionMenu]);

    const loadStudents = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setLoadError("");
        try {
            const data = await getStudentEnrollments();
            setStudents(data);
        } catch (error) {
            const message = extractStudentErrorMessage(error, "Unable to load students.");
            setLoadError(message);
            if (isRefresh) toast.error(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadStudents();
        getStudentSectionGroups()
            .then(setSectionGroups)
            .catch((error) => {
                console.error("Unable to load student section groups", error);
            });
    }, [loadStudents]);

    useEffect(() => {
        return () => {
            if (photoUrl) URL.revokeObjectURL(photoUrl);
        };
    }, [photoUrl]);

    // Unique options derived from student data
    const tableUniversities = useMemo(
        () => uniqueOptions(students.map((s) => s.university).filter((v): v is CommonDTO => Boolean(v))),
        [students]
    );
    const tableSchools = useMemo(
        () => uniqueOptions(students.map((s) => s.school).filter((v): v is CommonDTO => Boolean(v))),
        [students]
    );
    const tableDepartments = useMemo(
        () => uniqueOptions(students.map((s) => s.department).filter((v): v is CommonDTO => Boolean(v))),
        [students]
    );
    const tableAcademicYears = useMemo(
        () => uniqueOptions(students.map((s) => s.academicYear).filter((v): v is CommonDTO => Boolean(v))),
        [students]
    );
    const tableCourses = useMemo(
        () => uniqueOptions(students.map((s) => s.course).filter((v): v is CommonDTO => Boolean(v))),
        [students]
    );
    const tableSpecializations = useMemo(
        () => uniqueOptions(students.map((s) => s.specialization).filter((v): v is CommonDTO => Boolean(v))),
        [students]
    );
    const tableSectionGroups = useMemo(
        () => uniqueOptions(students.map((s) => s.sectionGroup).filter((v): v is CommonDTO => Boolean(v))),
        [students]
    );

    // Active filters counter & check
    const hasActiveFilters =
        Boolean(search.trim()) ||
        statusFilter !== "ALL" ||
        exactStatus !== "ALL" ||
        universityFilter !== "ALL" ||
        schoolFilter !== "ALL" ||
        departmentFilter !== "ALL" ||
        yearFilter !== "ALL" ||
        courseFilter !== "ALL" ||
        specializationFilter !== "ALL" ||
        groupFilter !== "ALL" ||
        accountFilter !== "ALL" ||
        scholarshipFilter !== "ALL" ||
        feeFilter !== "ALL" ||
        sortMode !== "NEWEST";

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("ALL");
        setExactStatus("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setYearFilter("ALL");
        setCourseFilter("ALL");
        setSpecializationFilter("ALL");
        setGroupFilter("ALL");
        setAccountFilter("ALL");
        setScholarshipFilter("ALL");
        setFeeFilter("ALL");
        setSortMode("NEWEST");
    };

    // Filter Badges list for the active filter pills bar
    const activeFilterPills = useMemo(() => {
        const pills: { id: string; label: string; value: string; onRemove: () => void }[] = [];
        if (search.trim()) {
            pills.push({
                id: "search",
                label: "Search",
                value: search,
                onRemove: () => setSearch(""),
            });
        }
        if (statusFilter !== "ALL") {
            pills.push({
                id: "status",
                label: "Status",
                value: statusFilter === "ACTIVE" ? "Active" : "Inactive",
                onRemove: () => setStatusFilter("ALL"),
            });
        }
        if (exactStatus !== "ALL") {
            pills.push({
                id: "exactStatus",
                label: "Exact Status",
                value: STATUS_LABELS[exactStatus] ?? exactStatus,
                onRemove: () => setExactStatus("ALL"),
            });
        }
        if (universityFilter !== "ALL") {
            const item = tableUniversities.find((o) => o.value === universityFilter);
            pills.push({
                id: "university",
                label: "University",
                value: item?.label ?? universityFilter,
                onRemove: () => setUniversityFilter("ALL"),
            });
        }
        if (schoolFilter !== "ALL") {
            const item = tableSchools.find((o) => o.value === schoolFilter);
            pills.push({
                id: "school",
                label: "School",
                value: item?.label ?? schoolFilter,
                onRemove: () => setSchoolFilter("ALL"),
            });
        }
        if (departmentFilter !== "ALL") {
            const item = tableDepartments.find((o) => o.value === departmentFilter);
            pills.push({
                id: "department",
                label: "Department",
                value: item?.label ?? departmentFilter,
                onRemove: () => setDepartmentFilter("ALL"),
            });
        }
        if (yearFilter !== "ALL") {
            const item = tableAcademicYears.find((o) => o.value === yearFilter);
            pills.push({
                id: "year",
                label: "Year",
                value: item?.label ?? yearFilter,
                onRemove: () => setYearFilter("ALL"),
            });
        }
        if (courseFilter !== "ALL") {
            const item = tableCourses.find((o) => o.value === courseFilter);
            pills.push({
                id: "course",
                label: "Course",
                value: item?.label ?? courseFilter,
                onRemove: () => setCourseFilter("ALL"),
            });
        }
        if (specializationFilter !== "ALL") {
            const item = tableSpecializations.find((o) => o.value === specializationFilter);
            pills.push({
                id: "specialization",
                label: "Specialization",
                value: item?.label ?? specializationFilter,
                onRemove: () => setSpecializationFilter("ALL"),
            });
        }
        if (groupFilter !== "ALL") {
            const item = tableSectionGroups.find((o) => o.value === groupFilter);
            pills.push({
                id: "group",
                label: "Section Group",
                value: item?.label ?? groupFilter,
                onRemove: () => setGroupFilter("ALL"),
            });
        }
        if (accountFilter !== "ALL") {
            pills.push({
                id: "account",
                label: "Account",
                value: accountFilter === "ENABLED" ? "Active" : "Disabled",
                onRemove: () => setAccountFilter("ALL"),
            });
        }
        if (scholarshipFilter !== "ALL") {
            pills.push({
                id: "scholarship",
                label: "Scholarship",
                value: scholarshipFilter === "YES" ? "Has Scholarship" : "No Scholarship",
                onRemove: () => setScholarshipFilter("ALL"),
            });
        }
        if (feeFilter !== "ALL") {
            pills.push({
                id: "fee",
                label: "Fee",
                value:
                    feeFilter === "OUTSTANDING"
                        ? "Outstanding Balance"
                        : feeFilter === "SETTLED"
                            ? "Settled"
                            : "No Records",
                onRemove: () => setFeeFilter("ALL"),
            });
        }
        return pills;
    }, [
        search,
        statusFilter,
        exactStatus,
        universityFilter,
        schoolFilter,
        departmentFilter,
        yearFilter,
        courseFilter,
        specializationFilter,
        groupFilter,
        accountFilter,
        scholarshipFilter,
        feeFilter,
        tableUniversities,
        tableSchools,
        tableDepartments,
        tableAcademicYears,
        tableCourses,
        tableSpecializations,
        tableSectionGroups,
    ]);

    const visibleStudents = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = students.filter((student) => {
            const profile = student.student.basicDetailRequest;
            const text = [
                fullName(student),
                student.student.registrationNumber,
                student.rollNumber ?? "",
                profile.username,
                profile.email,
                profile.phone,
                profile.address,
                profile.fatherName,
                profile.motherName,
                profile.guardianMobileNumber,
                student.course?.name ?? "",
                student.course?.code ?? "",
                student.sectionGroup?.name ?? "",
                student.sectionGroup?.code ?? "",
                student.academicYear?.name ?? "",
                student.academicYear?.code ?? "",
                student.school?.name ?? "",
                student.school?.code ?? "",
                student.department?.name ?? "",
                student.department?.code ?? "",
                student.specialization?.name ?? "",
                student.specialization?.code ?? "",
                student.university?.name ?? "",
                student.university?.code ?? "",
                ...student.scholarships.flatMap((s) => [s.name, s.code ?? ""]),
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = !q || text.includes(q);
            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" && student.status.toUpperCase() === "ACTIVE") ||
                (statusFilter === "INACTIVE" && student.status.toUpperCase() !== "ACTIVE");
            const matchesExactStatus =
                exactStatus === "ALL" || student.status.toUpperCase() === exactStatus;
            const matchesUniversity =
                universityFilter === "ALL" ||
                String(student.university?.id ?? "") === universityFilter;
            const matchesSchool =
                schoolFilter === "ALL" || String(student.school?.id ?? "") === schoolFilter;
            const matchesDepartment =
                departmentFilter === "ALL" ||
                String(student.department?.id ?? "") === departmentFilter;
            const matchesYear =
                yearFilter === "ALL" || String(student.academicYear?.id ?? "") === yearFilter;
            const matchesCourse =
                courseFilter === "ALL" || String(student.course?.id ?? "") === courseFilter;
            const matchesSpecialization =
                specializationFilter === "ALL" ||
                String(student.specialization?.id ?? "") === specializationFilter;
            const matchesGroup =
                groupFilter === "ALL" || String(student.sectionGroup?.id ?? "") === groupFilter;
            const matchesAccount =
                accountFilter === "ALL" ||
                (accountFilter === "ENABLED" ? profile.enabled : !profile.enabled);
            const matchesScholarship =
                scholarshipFilter === "ALL" ||
                (scholarshipFilter === "YES"
                    ? student.scholarships.length > 0
                    : student.scholarships.length === 0);
            const feeRows = student.fees ?? [];
            const hasOutstanding = feeRows.some(
                (fee) =>
                    Number(
                        fee.balance ?? (Number(fee.payableAmount ?? 0) - Number(fee.paidAmount ?? 0))
                    ) > 0
            );
            const matchesFee =
                feeFilter === "ALL" ||
                (feeFilter === "OUTSTANDING"
                    ? hasOutstanding
                    : feeFilter === "NO_RECORDS"
                        ? feeRows.length === 0
                        : !hasOutstanding && feeRows.length > 0);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesExactStatus &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment &&
                matchesYear &&
                matchesCourse &&
                matchesSpecialization &&
                matchesGroup &&
                matchesAccount &&
                matchesScholarship &&
                matchesFee
            );
        });

        filtered.sort((a, b) => {
            if (sortMode === "NAME_ASC") return fullName(a).localeCompare(fullName(b));
            if (sortMode === "NAME_DESC") return fullName(b).localeCompare(fullName(a));
            if (sortMode === "ROLL_ASC")
                return String(a.rollNumber ?? "").localeCompare(
                    String(b.rollNumber ?? ""),
                    undefined,
                    { numeric: true }
                );
            if (sortMode === "REG_ASC")
                return String(a.student.registrationNumber ?? "").localeCompare(
                    String(b.student.registrationNumber ?? ""),
                    undefined,
                    { numeric: true }
                );
            if (sortMode === "BALANCE_DESC") {
                const balA = (a.fees ?? []).reduce(
                    (acc, f) => acc + Number(f.balance ?? 0),
                    0
                );
                const balB = (b.fees ?? []).reduce(
                    (acc, f) => acc + Number(f.balance ?? 0),
                    0
                );
                return balB - balA;
            }
            return b.id - a.id;
        });

        return filtered;
    }, [
        students,
        search,
        statusFilter,
        exactStatus,
        universityFilter,
        schoolFilter,
        departmentFilter,
        yearFilter,
        courseFilter,
        specializationFilter,
        groupFilter,
        accountFilter,
        scholarshipFilter,
        feeFilter,
        sortMode,
    ]);

    const totalPages = Math.max(1, Math.ceil(visibleStudents.length / PAGE_SIZE));
    useEffect(() => {
        setPage(1);
    }, [
        search,
        statusFilter,
        exactStatus,
        universityFilter,
        schoolFilter,
        departmentFilter,
        yearFilter,
        courseFilter,
        specializationFilter,
        groupFilter,
        accountFilter,
        scholarshipFilter,
        feeFilter,
        sortMode,
    ]);
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageStudents = visibleStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Stats
    const activeEnrollments = students.filter(
        (student) => student.status.toUpperCase() === "ACTIVE"
    ).length;
    const disabledAccounts = students.filter(
        (student) => !student.student.basicDetailRequest.enabled
    ).length;
    const withScholarships = students.filter((student) => student.scholarships.length > 0).length;
    const withPendingFees = students.filter((s) =>
        (s.fees ?? []).some(
            (fee) =>
                Number(
                    fee.balance ?? (Number(fee.payableAmount ?? 0) - Number(fee.paidAmount ?? 0))
                ) > 0
        )
    ).length;

    const stats = [
        {
            label: "Total Students",
            value: students.length,
            icon: Users,
            tone: "cyan" as const,
        },
        {
            label: "Active Enrollments",
            value: activeEnrollments,
            icon: UserRoundCheck,
            tone: "emerald" as const,
        },
        {
            label: "With Scholarships",
            value: withScholarships,
            icon: GraduationCap,
            tone: "violet" as const,
        },
        {
            label: "Accounts Disabled",
            value: disabledAccounts,
            icon: UserRoundX,
            tone: "rose" as const,
        },
        {
            label: "Outstanding Balances",
            value: withPendingFees,
            icon: Wallet,
            tone: "amber" as const,
        },
    ];

    const tones = {
        cyan: "border-cyan-400/30 from-cyan-500/10 to-transparent text-cyan-300",
        emerald: "border-emerald-400/30 from-emerald-500/10 to-transparent text-emerald-300",
        violet: "border-violet-400/30 from-violet-500/10 to-transparent text-violet-300",
        rose: "border-rose-400/30 from-rose-500/10 to-transparent text-rose-300",
        amber: "border-amber-400/30 from-amber-500/10 to-transparent text-amber-300",
    };

    const resetProfileDraft = (student?: StudentEnrollmentResponse) => {
        if (!student) {
            setProfileForm(EMPTY_PROFILE);
            return;
        }
        const profile = student.student.basicDetailRequest;
        setProfileForm({
            firstName: profile.firstName,
            lastName: profile.lastName,
            dob: profile.dob,
            email: profile.email,
            phone: profile.phone,
            fatherName: profile.fatherName,
            motherName: profile.motherName,
            guardianMobileNumber: profile.guardianMobileNumber,
            address: profile.address,
        });
    };

    const openDialog = async (mode: DialogMode, student?: StudentEnrollmentResponse) => {
        setActionMenu(null);
        setDialog({ mode, student });
        setSelectedFile(null);
        setSelectedSectionGroupId("");
        setSelectedSectionId("");
        setSections([]);
        setDueDate("");
        setCreateScholarshipIds([]);
        setScholarships([]);
        setSelectedScholarships(student?.scholarships.map((item) => item.id) ?? []);
        setSelectedStatus((student?.status ?? "ACTIVE") as EnrollmentStatus);
        resetProfileDraft(mode === "PROFILE" ? student : undefined);
        setViewTab("overview");

        if (photoUrl) URL.revokeObjectURL(photoUrl);
        setPhotoUrl("");

        if ((mode === "PROFILE" || mode === "VIEW") && student && hasAction(student, "READ")) {
            setPhotoLoading(true);
            try {
                const blob = await getStudentPhoto(student.id);
                setPhotoUrl(URL.createObjectURL(blob));
            } catch {
                // Photo is optional
            } finally {
                setPhotoLoading(false);
            }
        }

        if ((mode === "SCHOLARSHIPS" || mode === "CREATE") && student?.sectionGroup?.id) {
            void loadScholarshipOptions(student.sectionGroup.id);
        }

        if (mode === "SECTION" && student) {
            void loadSectionOptions(student.id, student.section?.id);
        }
    };

    const closeDialog = () => {
        if (busy) return;
        setDialog(null);
        setSelectedFile(null);
        setSelectedSectionId("");
        setSections([]);
        setPhotoLoading(false);
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        setPhotoUrl("");
    };

    const loadSectionOptions = async (enrollmentId: number, currentSectionId?: number | null) => {
        setSectionLoading(true);
        setSections([]);
        setSelectedSectionId(currentSectionId ?? "");
        try {
            const list = await filterSection(enrollmentId);
            setSections(list);
            if (!currentSectionId && list.length > 0) {
                setSelectedSectionId(list[0].id);
            }
        } catch (error) {
            toast.error(extractStudentErrorMessage(error, "Unable to load sections."));
        } finally {
            setSectionLoading(false);
        }
    };

    const loadScholarshipOptions = async (sectionGroupId: number) => {
        setScholarshipLoading(true);
        try {
            const list = await getStudentScholarships(sectionGroupId);
            setScholarships(list);
        } catch (error) {
            toast.error(extractStudentErrorMessage(error, "Unable to load scholarships."));
        } finally {
            setScholarshipLoading(false);
        }
    };

    const replaceStudent = (updated: StudentEnrollmentResponse) => {
        setStudents((current) =>
            current.map((student) => (student.id === updated.id ? updated : student))
        );
    };

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedSectionGroupId) {
            toast.error("Select a section group before creating the student.");
            return;
        }
        if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
            toast.error("First name and last name are required.");
            return;
        }
        setBusy(true);
        const request: StudentCreateRequest = {
            sectionGroupId: Number(selectedSectionGroupId),
            scholarshipId: createScholarshipIds,
            basicDetailRequest: {
                ...profileForm,
                firstName: profileForm.firstName.trim(),
                lastName: profileForm.lastName.trim(),
                email: profileForm.email.trim(),
                phone: profileForm.phone.trim(),
            },
            ...(dueDate ? { dueDate } : {}),
        };
        try {
            const created = await createStudent(request, selectedFile);
            setStudents((current) => [
                created,
                ...current.filter((item) => item.id !== created.id),
            ]);
            setNotice(`Student ${fullName(created)} enrolled successfully.`);
            toast.success(`Student ${fullName(created)} created successfully.`);
            closeDialog();
            setSearch("");
            setStatusFilter("ALL");
            setSortMode("NEWEST");
            setPage(1);
        } catch (error) {
            toast.error(extractStudentErrorMessage(error, "Unable to create student."));
        } finally {
            setBusy(false);
        }
    };

    const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!dialog?.student) return;
        if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
            toast.error("First name and last name are required.");
            return;
        }
        setBusy(true);
        const payload: StudentProfileUpdateRequest = {
            ...profileForm,
            firstName: profileForm.firstName.trim(),
            lastName: profileForm.lastName.trim(),
            email: profileForm.email.trim(),
            phone: profileForm.phone.trim(),
        };
        try {
            const profile = await updateStudentProfile(dialog.student.id, payload, selectedFile);
            setStudents((current) =>
                current.map((student) =>
                    student.id === dialog.student!.id
                        ? {
                            ...student,
                            student: { ...student.student, basicDetailRequest: profile },
                        }
                        : student
                )
            );
            setNotice("Student profile and details updated successfully.");
            toast.success("Student profile updated successfully.");
            closeDialog();
        } catch (error) {
            toast.error(extractStudentErrorMessage(error, "Unable to update the student profile."));
        } finally {
            setBusy(false);
        }
    };

    const handleScholarshipSave = async () => {
        if (!dialog?.student) return;
        setBusy(true);
        try {
            const updated = await updateStudentScholarships(
                dialog.student.id,
                selectedScholarships
            );
            replaceStudent(updated);
            setNotice("Scholarship assignments updated successfully.");
            toast.success("Scholarships updated successfully.");
            setDialog(null);
        } catch (error) {
            toast.error(extractStudentErrorMessage(error, "Unable to update scholarships."));
        } finally {
            setBusy(false);
        }
    };

    const handleCourseSave = async () => {
        if (!dialog?.student || !selectedSectionGroupId) {
            toast.error("Select a target section group.");
            return;
        }
        setBusy(true);
        try {
            const updated = await changeStudentCourse(
                dialog.student.id,
                Number(selectedSectionGroupId)
            );
            replaceStudent(updated);
            setNotice("Student program / section group changed successfully.");
            toast.success("Student program / section group updated.");
            setDialog(null);
        } catch (error) {
            toast.error(
                extractStudentErrorMessage(error, "Unable to change the student's program.")
            );
        } finally {
            setBusy(false);
        }
    };

    const handleStatusSave = async () => {
        if (!dialog?.student) return;
        setBusy(true);
        try {
            const updated = await changeStudentEnrollmentStatus(
                dialog.student.id,
                selectedStatus
            );
            replaceStudent(updated);
            setNotice(`Enrollment status set to ${selectedStatus}.`);
            toast.success("Enrollment status updated successfully.");
            setDialog(null);
        } catch (error) {
            toast.error(extractStudentErrorMessage(error, "Unable to update enrollment status."));
        } finally {
            setBusy(false);
        }
    };

    const handleConfirmedAction = async () => {
        if (!dialog?.student) return;
        setBusy(true);
        try {
            if (dialog.mode === "RESET_PASSWORD") {
                const message = await resetStudentPassword(dialog.student.id);
                setNotice("User password reset successfully.");
                toast.success(message || "Password reset successfully.");
            } else if (dialog.mode === "ENABLE") {
                const enabled = !dialog.student.student.basicDetailRequest.enabled;
                const message = await changeStudentEnabled(dialog.student.id, enabled);
                setStudents((current) =>
                    current.map((student) =>
                        student.id === dialog.student!.id
                            ? {
                                ...student,
                                student: {
                                    ...student.student,
                                    basicDetailRequest: {
                                        ...student.student.basicDetailRequest,
                                        enabled,
                                    },
                                },
                            }
                            : student
                    )
                );
                setNotice(`Student account ${enabled ? "enabled" : "disabled"}.`);
                toast.success(message || `Account ${enabled ? "enabled" : "disabled"}.`);
            }
            setDialog(null);
        } catch (error) {
            toast.error(extractStudentErrorMessage(error, "The requested action failed."));
        } finally {
            setBusy(false);
        }
    };

    const handleToggleActionMenu = (
        student: StudentEnrollmentResponse,
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.stopPropagation();
        if (actionMenu?.student.id === student.id) {
            setActionMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const menuWidth = 240;
        const menuHeight = 320;
        const xPos = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 16);
        // Smart upward opening if close to viewport bottom
        const openUpward = rect.bottom + menuHeight > window.innerHeight;
        const yPos = openUpward ? rect.top - menuHeight - 6 : rect.bottom + 6;

        setActionMenu({
            student,
            x: Math.max(16, xPos),
            y: Math.max(16, yPos),
        });
    };

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-6 p-3 text-slate-100 sm:p-5 lg:p-7"
        >
            {/* Header Section (Matching Sections.tsx breadcrumb + header architecture) */}
            <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span>Academic Management</span>
                    <ChevronRight size={14} className="text-slate-500" />
                    <span className="text-cyan-300">Students</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration &amp; Admissions
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Student Management
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Manage student profiles, registrations, section enrollments, scholarships,
                            fee accounts, and login access permissions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadStudents(true)}
                            disabled={loading || refreshing}
                            title="Refresh student records"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-3 sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={loading || refreshing ? "animate-spin text-cyan-400" : ""}
                            />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => void openDialog("CREATE")}
                            disabled={sectionGroups.length === 0}
                            title={
                                sectionGroups.length === 0
                                    ? "No section groups are available"
                                    : "Add a student"
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <UserPlus size={18} />
                            <span>Add Student</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Error / Notice Banners */}
            <AnimatePresence>
                {loadError && (
                    <ErrorBanner
                        title="Could not load student records"
                        message={loadError}
                        onRetry={() => void loadStudents()}
                        onDismiss={() => setLoadError("")}
                    />
                )}

                {notice && (
                    <motion.div
                        role="status"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                    >
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                        <p className="flex-1">{notice}</p>
                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss success message"
                            className="ml-auto text-slate-400 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Statistics Row */}
            <section
                aria-label="Student statistics"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: reduceMotion ? 0 : index * 0.05,
                            }}
                            whileHover={reduceMotion ? undefined : { y: -3 }}
                            className={`rounded-2xl border bg-gradient-to-br p-4 sm:p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-300 sm:text-sm">
                                        {stat.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-3xl">
                                        {loading ? (
                                            <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10" />
                                        ) : (
                                            stat.value.toLocaleString()
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-2.5 sm:p-3">
                                    <Icon size={21} className="sm:w-[22px] sm:h-[22px]" />
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-5 h-1 overflow-hidden rounded-full bg-white/10">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: loading ? "30%" : "100%" }}
                                    transition={{ duration: 0.7, delay: index * 0.08 }}
                                    className="h-full rounded-full bg-current opacity-60"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            {/* Main Content Card (Filters + Table + Pagination) */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                {/* Responsive Filter Toolbar */}
                <div className="grid gap-3 border-b border-white/10 p-3.5 sm:p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {/* Search Input */}
                    <div className="relative min-w-0 sm:col-span-2">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search students"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, roll no, reg no, email, phone..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by enrollment status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="INACTIVE">Inactive / Suspended</option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Course Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by course"
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="ALL">All Courses</option>
                            {tableCourses.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Sort Options */}
                    <div className="relative">
                        <select
                            aria-label="Sort students"
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as SortMode)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="NEWEST">Highest ID First</option>
                            <option value="NAME_ASC">Name: A to Z</option>
                            <option value="NAME_DESC">Name: Z to A</option>
                            <option value="ROLL_ASC">Roll Number</option>
                            <option value="REG_ASC">Registration Number</option>
                            <option value="BALANCE_DESC">Balance Due: High to Low</option>
                        </select>
                        <ArrowDownUp
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {/* Filter Toggle & Quick Reset */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAdvancedFilters((v) => !v)}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${showAdvancedFilters
                                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                                : "border-white/10 bg-slate-800/60 text-slate-300 hover:bg-white/10 hover:text-white"
                                }`}
                            title="Toggle more filter options"
                        >
                            <Filter size={14} />
                            <span>Filters</span>
                            {activeFilterPills.length > 0 && (
                                <span className="ml-1 rounded-full bg-cyan-500/25 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300">
                                    {activeFilterPills.length}
                                </span>
                            )}
                        </button>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                                title="Reset all filters"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filter Pills Bar (Matching Sections.tsx UX) */}
                {activeFilterPills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-slate-950/20 px-4 py-2.5 sm:px-5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Active Filters:
                        </span>
                        {activeFilterPills.map((pill) => (
                            <span
                                key={pill.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200"
                            >
                                <span className="text-slate-400">{pill.label}:</span>
                                <span className="font-semibold truncate max-w-[140px]">
                                    {pill.value}
                                </span>
                                <button
                                    type="button"
                                    onClick={pill.onRemove}
                                    aria-label={`Remove ${pill.label} filter`}
                                    className="ml-0.5 rounded p-0.5 text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="text-xs text-slate-400 hover:text-white underline underline-offset-2 ml-1 transition"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Advanced Filters Expandable Drawer */}
                <AnimatePresence initial={false}>
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-b border-white/10 bg-slate-950/40"
                        >
                            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                <FilterSelect
                                    label="Exact Status"
                                    value={exactStatus}
                                    onChange={setExactStatus}
                                    options={[
                                        { value: "ALL", label: "All statuses" },
                                        ...ENROLLMENT_STATUSES.map((v) => ({
                                            value: v,
                                            label: STATUS_LABELS[v] ?? v,
                                        })),
                                    ]}
                                />
                                <FilterSelect
                                    label="University"
                                    value={universityFilter}
                                    onChange={setUniversityFilter}
                                    options={[
                                        { value: "ALL", label: "All universities" },
                                        ...tableUniversities,
                                    ]}
                                />
                                <FilterSelect
                                    label="School"
                                    value={schoolFilter}
                                    onChange={setSchoolFilter}
                                    options={[{ value: "ALL", label: "All schools" }, ...tableSchools]}
                                />
                                <FilterSelect
                                    label="Department"
                                    value={departmentFilter}
                                    onChange={setDepartmentFilter}
                                    options={[
                                        { value: "ALL", label: "All departments" },
                                        ...tableDepartments,
                                    ]}
                                />
                                <FilterSelect
                                    label="Academic Year"
                                    value={yearFilter}
                                    onChange={setYearFilter}
                                    options={[
                                        { value: "ALL", label: "All academic years" },
                                        ...tableAcademicYears,
                                    ]}
                                />
                                <FilterSelect
                                    label="Specialization"
                                    value={specializationFilter}
                                    onChange={setSpecializationFilter}
                                    options={[
                                        { value: "ALL", label: "All specializations" },
                                        ...tableSpecializations,
                                    ]}
                                />
                                <FilterSelect
                                    label="Section Group"
                                    value={groupFilter}
                                    onChange={setGroupFilter}
                                    options={[
                                        { value: "ALL", label: "All section groups" },
                                        ...tableSectionGroups,
                                    ]}
                                />
                                <FilterSelect
                                    label="Account Access"
                                    value={accountFilter}
                                    onChange={setAccountFilter}
                                    options={[
                                        { value: "ALL", label: "All accounts" },
                                        { value: "ENABLED", label: "Enabled login accounts" },
                                        { value: "DISABLED", label: "Disabled login accounts" },
                                    ]}
                                />
                                <FilterSelect
                                    label="Scholarships"
                                    value={scholarshipFilter}
                                    onChange={setScholarshipFilter}
                                    options={[
                                        { value: "ALL", label: "All students" },
                                        { value: "YES", label: "With scholarships" },
                                        { value: "NO", label: "Without scholarships" },
                                    ]}
                                />
                                <FilterSelect
                                    label="Fee Balances"
                                    value={feeFilter}
                                    onChange={setFeeFilter}
                                    options={[
                                        { value: "ALL", label: "All fee states" },
                                        { value: "OUTSTANDING", label: "Outstanding balance" },
                                        { value: "SETTLED", label: "Settled / No balance" },
                                        { value: "NO_RECORDS", label: "No fee record registered" },
                                    ]}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-300 min-w-[1050px]">
                        <thead className="border-b border-white/10 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <tr>
                                <th scope="col" className="px-5 py-4">
                                    Student Profile
                                </th>
                                <th scope="col" className="px-4 py-4">
                                    Registration &amp; Roll
                                </th>
                                <th scope="col" className="px-4 py-4">
                                    Academic Placement
                                </th>
                                <th scope="col" className="px-4 py-4">
                                    Financials
                                </th>
                                <th scope="col" className="px-4 py-4">
                                    Enrollment Status
                                </th>
                                <th scope="col" className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : pageStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                        <Users
                                            size={44}
                                            className="mx-auto mb-3 opacity-30 text-slate-400"
                                        />
                                        <p className="text-base font-semibold text-slate-300">
                                            No student records found
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try clearing or tweaking your filter criteria."
                                                : "No students have been enrolled yet in this academic unit."}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-4 rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                                            >
                                                Clear all filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                pageStudents.map((student) => {
                                    const canRead = hasAction(student, "READ");
                                    const canEdit = hasAction(student, "UPDATE");
                                    const feeRows = student.fees ?? [];
                                    const hasOutstanding = feeRows.some(
                                        (fee) =>
                                            Number(
                                                fee.balance ??
                                                (Number(fee.payableAmount ?? 0) -
                                                    Number(fee.paidAmount ?? 0))
                                            ) > 0
                                    );

                                    return (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="transition hover:bg-white/[0.02]"
                                        >
                                            {/* Student Profile */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={fullName(student)} size="md" />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white truncate max-w-[200px]">
                                                            {fullName(student)}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate max-w-[210px]">
                                                            {student.student.basicDetailRequest.email ||
                                                                student.student.basicDetailRequest
                                                                    .username ||
                                                                "No email assigned"}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                            <span
                                                                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${accountTone(
                                                                    student.student.basicDetailRequest
                                                                        .enabled
                                                                )}`}
                                                            >
                                                                {student.student.basicDetailRequest.enabled
                                                                    ? "Active"
                                                                    : "Disabled"}
                                                            </span>
                                                            <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                                                                #{student.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Registration & Roll */}
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-slate-200">
                                                    {student.student.registrationNumber || "—"}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Roll:{" "}
                                                    <span className="font-medium text-slate-300">
                                                        {student.rollNumber || "Not assigned"}
                                                    </span>
                                                </p>
                                            </td>

                                            {/* Academic Placement */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5 max-w-[220px]">
                                                    <p
                                                        className="font-medium text-slate-200 truncate"
                                                        title={formatCommon(student.course) || "Program not specified"}
                                                    >
                                                        {student.course?.name || "Program not specified"}
                                                    </p>
                                                    {student.course?.code && (
                                                        <span className="shrink-0 rounded bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">
                                                            {student.course.code}
                                                        </span>
                                                    )}
                                                </div>
                                                <p
                                                    className="text-xs text-slate-400 truncate max-w-[220px] mt-0.5"
                                                    title={[
                                                        formatCommon(student.university),
                                                        formatCommon(student.school),
                                                        formatCommon(student.department),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                >
                                                    {[
                                                        formatCommon(student.university),
                                                        formatCommon(student.school),
                                                        formatCommon(student.department),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ") || "Unit not specified"}
                                                </p>
                                                <p
                                                    className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]"
                                                    title={[
                                                        formatCommon(student.academicYear),
                                                        formatCommon(student.sectionGroup),
                                                        formatCommon(student.specialization),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                >
                                                    {[
                                                        formatCommon(student.academicYear),
                                                        formatCommon(student.sectionGroup),
                                                        formatCommon(student.specialization),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>
                                            </td>

                                            {/* Financials */}
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    {student.scholarships.length > 0 ? (
                                                        <span
                                                            title={student.scholarships.map((s) => formatCommon(s)).join(", ")}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-300"
                                                        >
                                                            <GraduationCap size={13} />
                                                            {student.scholarships.length} Scholarship
                                                            {student.scholarships.length > 1
                                                                ? "s"
                                                                : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">
                                                            Standard Fee
                                                        </span>
                                                    )}
                                                    <div>
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${hasOutstanding
                                                                ? "text-amber-300"
                                                                : feeRows.length > 0
                                                                    ? "text-emerald-400"
                                                                    : "text-slate-500"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${hasOutstanding
                                                                    ? "bg-amber-400"
                                                                    : feeRows.length > 0
                                                                        ? "bg-emerald-400"
                                                                        : "bg-slate-600"
                                                                    }`}
                                                            />
                                                            {hasOutstanding
                                                                ? "Outstanding"
                                                                : feeRows.length > 0
                                                                    ? "Settled"
                                                                    : "No Fee Plan"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusTone(
                                                        student.status
                                                    )}`}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {STATUS_LABELS[student.status.toUpperCase()] ??
                                                        student.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    {/* Quick View Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => void openDialog("VIEW", student)}
                                                        disabled={!canRead}
                                                        aria-label="View student details"
                                                        className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/20 hover:text-cyan-200 transition disabled:opacity-40"
                                                        title="View Overview & Profile"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Quick Edit Profile Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => void openDialog("PROFILE", student)}
                                                        disabled={!canEdit}
                                                        aria-label="Edit student profile"
                                                        className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                                                        title={canEdit ? "Edit Profile" : "No update permission"}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>

                                                    {/* Actions Dropdown Toggle Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleToggleActionMenu(student, e)}
                                                        aria-label="More actions"
                                                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${actionMenu?.student.id === student.id
                                                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                                                            : "border-white/10 bg-slate-800/80 text-slate-200 hover:border-cyan-400/30 hover:bg-slate-700/80 hover:text-white"
                                                            }`}
                                                    >
                                                        <SlidersHorizontal
                                                            size={13}
                                                            className="text-cyan-400"
                                                        />
                                                        <span>Actions</span>
                                                        <ChevronDown
                                                            size={13}
                                                            className={`text-slate-400 transition-transform ${actionMenu?.student.id === student.id
                                                                ? "rotate-180"
                                                                : ""
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile / Tablet Cards View (Responsive design for < lg) */}
                <div className="divide-y divide-white/5 lg:hidden">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-3 p-4">
                                <div className="h-5 w-40 rounded bg-white/10" />
                                <div className="h-4 w-56 rounded bg-white/5" />
                                <div className="h-10 rounded bg-white/5" />
                            </div>
                        ))
                    ) : pageStudents.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p className="text-sm font-semibold text-slate-300">No students found</p>
                        </div>
                    ) : (
                        pageStudents.map((student) => {
                            const canRead = hasAction(student, "READ");
                            const canEdit = hasAction(student, "UPDATE");

                            return (
                                <article key={student.id} className="min-w-0 space-y-3 p-4 sm:p-5">
                                    <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
                                        <Avatar name={fullName(student)} size="lg" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                <h3 className="text-sm font-bold text-white break-words sm:text-base">
                                                    {fullName(student)}
                                                </h3>
                                                <span
                                                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                                                        student.status
                                                    )}`}
                                                >
                                                    {STATUS_LABELS[student.status.toUpperCase()] ??
                                                        student.status}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-400 break-all">
                                                {student.student.basicDetailRequest.email ||
                                                    student.student.basicDetailRequest.username ||
                                                    "No email"}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                <span
                                                    className={`rounded-md border px-2 py-0.5 text-[10px] ${accountTone(
                                                        student.student.basicDetailRequest.enabled
                                                    )}`}
                                                >
                                                    {student.student.basicDetailRequest.enabled
                                                        ? "Active Account"
                                                        : "Disabled Account"}
                                                </span>
                                                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                                                    Enrollment #{student.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grid summary */}
                                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs sm:grid-cols-3 sm:p-3">
                                        <InfoCell
                                            label="Registration"
                                            value={student.student.registrationNumber || "—"}
                                        />
                                        <InfoCell
                                            label="Roll No"
                                            value={student.rollNumber || "Not assigned"}
                                        />
                                        <InfoCell
                                            label="University"
                                            value={formatCommon(student.university) || "Not assigned"}
                                        />
                                        <InfoCell
                                            label="Program"
                                            value={formatCommon(student.course) || "Not specified"}
                                        />
                                        <InfoCell
                                            label="Group"
                                            value={formatCommon(student.sectionGroup) || "Not specified"}
                                        />
                                        <InfoCell
                                            label="Year"
                                            value={formatCommon(student.academicYear) || "Not specified"}
                                        />
                                        <InfoCell
                                            label="Scholarships"
                                            value={
                                                student.scholarships.length
                                                    ? `${student.scholarships.length} active`
                                                    : "None"
                                            }
                                        />
                                    </div>

                                    {/* Mobile Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => void openDialog("VIEW", student)}
                                            disabled={!canRead}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-40"
                                        >
                                            <Eye size={13} /> Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void openDialog("PROFILE", student)}
                                            disabled={!canEdit}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition disabled:opacity-40"
                                        >
                                            <Pencil size={13} /> Edit Profile
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleActionMenu(student, e)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-white/10 transition"
                                        >
                                            <SlidersHorizontal size={13} /> More Actions{" "}
                                            <ChevronDown size={12} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>

                {/* Pagination Footer */}
                {!loading && visibleStudents.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-xs text-slate-400">
                            Showing{" "}
                            <span className="font-semibold text-white">
                                {(page - 1) * PAGE_SIZE + 1}–
                                {Math.min(page * PAGE_SIZE, visibleStudents.length)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-white">
                                {visibleStudents.length}
                            </span>{" "}
                            students
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <PageButton
                                label="First page"
                                disabled={page === 1}
                                onClick={() => setPage(1)}
                            >
                                <ChevronsLeft size={15} />
                            </PageButton>
                            <PageButton
                                label="Previous page"
                                disabled={page === 1}
                                onClick={() => setPage((v) => Math.max(1, v - 1))}
                            >
                                <ChevronLeft size={15} />
                            </PageButton>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(
                                    (v) =>
                                        v === 1 ||
                                        v === totalPages ||
                                        Math.abs(v - page) <= 1
                                )
                                .map((v, i, list) => (
                                    <span key={v} className="contents">
                                        {i > 0 && v - list[i - 1] > 1 && (
                                            <span className="px-1 text-xs text-slate-600">…</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setPage(v)}
                                            aria-current={page === v ? "page" : undefined}
                                            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${page === v
                                                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {v}
                                        </button>
                                    </span>
                                ))}
                            <PageButton
                                label="Next page"
                                disabled={page === totalPages}
                                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                            >
                                <ChevronRight size={15} />
                            </PageButton>
                            <PageButton
                                label="Last page"
                                disabled={page === totalPages}
                                onClick={() => setPage(totalPages)}
                            >
                                <ChevronsRight size={15} />
                            </PageButton>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Action Dropdown Menu */}
            <AnimatePresence>
                {actionMenu && (
                    <motion.div
                        ref={actionMenuRef}
                        role="menu"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "fixed",
                            top: `${actionMenu.y}px`,
                            left: `${actionMenu.x}px`,
                            zIndex: 80,
                        }}
                        className="w-64 max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl"
                    >
                        <div className="border-b border-white/10 px-3 py-2">
                            <p className="truncate text-xs font-bold text-white">
                                {fullName(actionMenu.student)}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                Enrollment #{actionMenu.student.id} · Select Operation
                            </p>
                        </div>

                        <div className="py-1 space-y-0.5">
                            {/* Category: Profile & Records */}
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Profile &amp; Records
                            </p>

                            <MenuButton
                                icon={Eye}
                                iconColor="text-cyan-400"
                                label="View Student Overview"
                                detail="Full personal & academic profile"
                                disabled={!hasAction(actionMenu.student, "READ")}
                                onClick={() => void openDialog("VIEW", actionMenu.student)}
                            />

                            <MenuButton
                                icon={Pencil}
                                iconColor="text-sky-400"
                                label="Edit Student Profile"
                                detail="Modify contact & passport photo"
                                disabled={!hasAction(actionMenu.student, "UPDATE")}
                                onClick={() => void openDialog("PROFILE", actionMenu.student)}
                            />

                            {/* Category: Academics & Placement */}
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Academic Operations
                            </p>

                            <MenuButton
                                icon={BookOpen}
                                iconColor="text-sky-400"
                                label="Change Section Group"
                                detail={
                                    actionMenu.student.sectionGroup
                                        ? `Current: ${formatCommon(actionMenu.student.sectionGroup)}`
                                        : "Transfer to another group / course"
                                }
                                disabled={!hasAction(actionMenu.student, "UPDATE")}
                                onClick={() => void openDialog("COURSE", actionMenu.student)}
                            />

                            <MenuButton
                                icon={Layers3}
                                iconColor="text-indigo-400"
                                label="Change Section"
                                detail="Assign target section ID"
                                disabled={!hasAction(actionMenu.student, "UPDATE")}
                                onClick={() => void openDialog("SECTION", actionMenu.student)}
                            />

                            <MenuButton
                                icon={SlidersHorizontal}
                                iconColor="text-amber-400"
                                label="Update Enrollment Status"
                                detail="Active, Suspended, Completed..."
                                disabled={!hasAction(actionMenu.student, "UPDATE")}
                                onClick={() => void openDialog("STATUS", actionMenu.student)}
                            />

                            {/* Category: Financials */}
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Financials &amp; Awards
                            </p>

                            <MenuButton
                                icon={GraduationCap}
                                iconColor="text-violet-400"
                                label="Manage Scholarships"
                                detail={`${actionMenu.student.scholarships.length} currently assigned`}
                                disabled={!hasAction(actionMenu.student, "UPDATE")}
                                onClick={() => void openDialog("SCHOLARSHIPS", actionMenu.student)}
                            />

                            {/* Category: Security & Access */}
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Security &amp; Access
                            </p>

                            <MenuButton
                                icon={KeyRound}
                                iconColor="text-rose-400"
                                label="Reset Password"
                                detail="Trigger user password reset"
                                disabled={!hasAction(actionMenu.student, "UPDATE")}
                                onClick={() => void openDialog("RESET_PASSWORD", actionMenu.student)}
                            />

                            <MenuButton
                                icon={
                                    actionMenu.student.student.basicDetailRequest.enabled
                                        ? UserRoundX
                                        : UserRoundCheck
                                }
                                iconColor={
                                    actionMenu.student.student.basicDetailRequest.enabled
                                        ? "text-rose-400"
                                        : "text-emerald-400"
                                }
                                label={
                                    actionMenu.student.student.basicDetailRequest.enabled
                                        ? "Disable User Account"
                                        : "Enable User Account"
                                }
                                detail={
                                    actionMenu.student.student.basicDetailRequest.enabled
                                        ? "Block student login access"
                                        : "Restore student login access"
                                }
                                disabled={!hasAction(actionMenu.student, "UPDATE")}
                                onClick={() => void openDialog("ENABLE", actionMenu.student)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dialogs / Modals */}
            <AnimatePresence>
                {/* 1. VIEW DIALOG */}
                {dialog?.mode === "VIEW" && dialog.student && (
                    <Modal
                        title="Student Overview & Academic File"
                        subtitle={`Enrollment #${dialog.student.id} · ${fullName(dialog.student)}`}
                        onClose={closeDialog}
                        wide
                        icon={Eye}
                        iconTone="cyan"
                    >
                        <div className="space-y-6">
                            {/* Hero Card */}
                            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-indigo-950/40 p-4 sm:p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                                    <div className="flex shrink-0 flex-col items-center gap-1.5 sm:gap-2">
                                        {photoLoading ? (
                                            <div className="flex h-24 w-20 sm:h-28 sm:w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                                <LoaderCircle className="animate-spin text-cyan-400" />
                                            </div>
                                        ) : photoUrl ? (
                                            <img
                                                src={photoUrl}
                                                alt={`${fullName(dialog.student)}`}
                                                className="h-24 w-20 sm:h-28 sm:w-24 rounded-2xl border-2 border-cyan-400/40 object-cover shadow-xl shadow-cyan-950/40"
                                            />
                                        ) : (
                                            <div className="flex h-24 w-20 sm:h-28 sm:w-24 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-2xl sm:text-3xl font-bold text-cyan-200 shadow-xl">
                                                {initials(fullName(dialog.student))}
                                            </div>
                                        )}
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Passport Photo
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-bold text-white sm:text-2xl">
                                                {fullName(dialog.student)}
                                            </h3>
                                            <span
                                                className={`rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold ${statusTone(
                                                    dialog.student.status
                                                )}`}
                                            >
                                                {STATUS_LABELS[dialog.student.status.toUpperCase()] ??
                                                    dialog.student.status}
                                            </span>
                                            <StatusBadge
                                                active={
                                                    dialog.student.student.basicDetailRequest.enabled
                                                }
                                            />
                                        </div>

                                        <p className="mt-1 text-xs sm:text-sm text-slate-400 truncate">
                                            {dialog.student.student.basicDetailRequest.email ||
                                                "No email on record"}
                                        </p>

                                        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_1.1fr_1.8.2fr_0.8fr]">
                                            <StatMini
                                                label="Registration No"
                                                value={
                                                    dialog.student.student.registrationNumber || "—"
                                                }
                                            />
                                            <StatMini
                                                label="Roll Number"
                                                value={dialog.student.rollNumber || "Not assigned"}
                                            />
                                            <StatMini
                                                label="Username"
                                                value={
                                                    dialog.student.student.basicDetailRequest
                                                        .username || "—"
                                                }
                                                className="col-span-2 sm:col-auto"
                                                valueClassName="font-mono tracking-tight text-xs sm:text-[13px] text-cyan-200"
                                            />
                                            <StatMini
                                                label="Enrollment ID"
                                                value={`#${dialog.student.id}`}
                                                className="col-span-2 sm:col-auto"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Horizontally scrollable Tab Navigation */}
                            <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setViewTab("overview")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 ${viewTab === "overview"
                                        ? "border-cyan-400 text-cyan-300"
                                        : "border-transparent text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Personal &amp; Contact
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab("academics")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 ${viewTab === "academics"
                                        ? "border-cyan-400 text-cyan-300"
                                        : "border-transparent text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Academic Placement
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab("financials")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 ${viewTab === "financials"
                                        ? "border-cyan-400 text-cyan-300"
                                        : "border-transparent text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Scholarships &amp; Fees
                                </button>
                            </div>

                            {/* Tab 1: Personal & Contact */}
                            {viewTab === "overview" && (
                                <div className="space-y-4">
                                    <DetailSection
                                        title="Personal Information"
                                        icon={<CircleUserRound size={16} />}
                                    >
                                        <DetailItem
                                            label="Username"
                                            value={
                                                dialog.student.student.basicDetailRequest.username ||
                                                "Not assigned"
                                            }
                                            icon={<UserCheck size={14} />}
                                        />
                                        <DetailItem
                                            label="Date of Birth"
                                            value={formatDate(
                                                dialog.student.student.basicDetailRequest.dob
                                            )}
                                            icon={<CalendarDays size={14} />}
                                        />
                                        <DetailItem
                                            label="Email Address"
                                            value={
                                                dialog.student.student.basicDetailRequest.email ||
                                                "Not provided"
                                            }
                                            icon={<Mail size={14} />}
                                        />
                                        <DetailItem
                                            label="Primary Phone"
                                            value={
                                                dialog.student.student.basicDetailRequest.phone ||
                                                "Not provided"
                                            }
                                            icon={<Phone size={14} />}
                                        />
                                        <DetailItem
                                            label="Account Status"
                                            value={
                                                dialog.student.student.basicDetailRequest.enabled
                                                    ? "Login Enabled"
                                                    : "Login Disabled"
                                            }
                                            icon={<ShieldCheck size={14} />}
                                        />
                                    </DetailSection>

                                    <DetailSection
                                        title="Family & Guardian Contact"
                                        icon={<Users size={16} />}
                                    >
                                        <DetailItem
                                            label="Father's Name"
                                            value={
                                                dialog.student.student.basicDetailRequest
                                                    .fatherName || "Not provided"
                                            }
                                        />
                                        <DetailItem
                                            label="Mother's Name"
                                            value={
                                                dialog.student.student.basicDetailRequest
                                                    .motherName || "Not provided"
                                            }
                                        />
                                        <DetailItem
                                            label="Guardian Mobile"
                                            value={
                                                dialog.student.student.basicDetailRequest
                                                    .guardianMobileNumber || "Not provided"
                                            }
                                            icon={<Phone size={14} />}
                                        />
                                        <DetailItem
                                            label="Residential Address"
                                            value={
                                                dialog.student.student.basicDetailRequest
                                                    .address || "Not provided"
                                            }
                                            icon={<MapPin size={14} />}
                                            wide
                                        />
                                    </DetailSection>

                                    <div className="rounded-xl border border-white/5 bg-slate-800/40 p-3 sm:p-4">
                                        <p className="text-xs font-semibold text-slate-300">
                                            Available Operations on this Student Record
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {(dialog.student.permissionActions ?? []).length ? (
                                                dialog.student.permissionActions.map((action) => (
                                                    <span
                                                        key={action}
                                                        className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200"
                                                    >
                                                        {action.replace(/_/g, " ")}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-amber-300">
                                                    Read only (No edit permissions granted)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Academic Placement */}
                            {viewTab === "academics" && (
                                <div className="space-y-4">
                                    <DetailSection
                                        title="Academic Hierarchy & Enrollment Context"
                                        icon={<GraduationCap size={16} />}
                                    >
                                        <DetailItem
                                            label="University"
                                            value={
                                                formatCommon(dialog.student.university) || "Not assigned"
                                            }
                                            icon={<Building2 size={14} />}
                                        />
                                        <DetailItem
                                            label="School / Faculty"
                                            value={formatCommon(dialog.student.school) || "Not assigned"}
                                            icon={<Building2 size={14} />}
                                        />
                                        <DetailItem
                                            label="Department"
                                            value={
                                                formatCommon(dialog.student.department) || "Not assigned"
                                            }
                                            icon={<Network size={14} />}
                                        />
                                        <DetailItem
                                            label="Course / Program"
                                            value={formatCommon(dialog.student.course) || "Not assigned"}
                                            icon={<BookOpen size={14} />}
                                        />
                                        <DetailItem
                                            label="Specialization"
                                            value={
                                                formatCommon(dialog.student.specialization) || "General"
                                            }
                                            icon={<Sparkles size={14} />}
                                        />
                                        <DetailItem
                                            label="Academic Year"
                                            value={
                                                formatCommon(dialog.student.academicYear) || "Not assigned"
                                            }
                                            icon={<Calendar size={14} />}
                                        />
                                        <DetailItem
                                            label="Section Group"
                                            value={
                                                formatCommon(dialog.student.sectionGroup) || "Not assigned"
                                            }
                                            icon={<Layers3 size={14} />}
                                        />
                                        {dialog.student.section && (
                                            <DetailItem
                                                label="Section"
                                                value={formatCommon(dialog.student.section)}
                                                icon={<Layers3 size={14} />}
                                            />
                                        )}
                                    </DetailSection>

                                    <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                        <p className="text-xs font-semibold text-slate-300">
                                            Placement Summary
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                            The student is enrolled in{" "}
                                            <strong className="text-white">
                                                {formatCommon(dialog.student.course)}
                                            </strong>{" "}
                                            under Section Group{" "}
                                            <strong className="text-cyan-300">
                                                {formatCommon(dialog.student.sectionGroup)}
                                            </strong>
                                            {dialog.student.university && (
                                                <>
                                                    {" "}at{" "}
                                                    <strong className="text-white">
                                                        {formatCommon(dialog.student.university)}
                                                    </strong>
                                                </>
                                            )}
                                            . To change course or section group, use the &quot;Change Section
                                            Group&quot; action.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Scholarships & Fees */}
                            {viewTab === "financials" && (
                                <div className="space-y-4">
                                    <DetailSection
                                        title={`Scholarships Assigned (${dialog.student.scholarships.length})`}
                                        icon={<GraduationCap size={16} />}
                                    >
                                        {dialog.student.scholarships.length > 0 ? (
                                            dialog.student.scholarships.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 sm:col-span-2"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold text-violet-100">
                                                            {s.name}
                                                        </p>
                                                        {s.code && (
                                                            <span className="rounded bg-violet-950/60 px-2 py-0.5 text-[10px] font-mono text-violet-300">
                                                                {s.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500 sm:col-span-2 py-2">
                                                No scholarships linked to this enrollment record.
                                            </p>
                                        )}
                                    </DetailSection>

                                    <DetailSection
                                        title="Fee Ledger & Account Status"
                                        icon={<Wallet size={16} />}
                                    >
                                        {dialog.student.fees.length > 0 ? (
                                            dialog.student.fees.map((fee, idx) => {
                                                const total = Number(fee.totalAmount ?? 0);
                                                const payable = Number(fee.payableAmount ?? total);
                                                const paid = Number(fee.paidAmount ?? 0);
                                                const balance = Number(fee.balance ?? payable - paid);

                                                return (
                                                    <div
                                                        key={fee.id ?? idx}
                                                        className="rounded-xl border border-white/5 bg-slate-950/40 p-3.5 sm:p-4 sm:col-span-2 space-y-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold text-slate-200">
                                                                Fee Account{" "}
                                                                {fee.id ? `#${fee.id}` : idx + 1}
                                                            </span>
                                                            <span
                                                                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${balance > 0
                                                                    ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                                                                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                                    }`}
                                                            >
                                                                {fee.status ||
                                                                    (balance > 0
                                                                        ? "Outstanding Balance"
                                                                        : "Settled")}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                                            <StatMini
                                                                label="Total Fee"
                                                                value={formatMoney(total)}
                                                            />
                                                            <StatMini
                                                                label="Payable"
                                                                value={formatMoney(payable)}
                                                            />
                                                            <StatMini
                                                                label="Paid"
                                                                value={formatMoney(paid)}
                                                            />
                                                            <StatMini
                                                                label="Balance Due"
                                                                value={formatMoney(balance)}
                                                            />
                                                        </div>

                                                        {fee.dueDate && (
                                                            <p className="text-[11px] text-slate-500">
                                                                Due date: {formatDate(fee.dueDate)}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-slate-500 sm:col-span-2 py-2">
                                                No fee records are registered for this enrollment.
                                            </p>
                                        )}
                                    </DetailSection>
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    className={buttonSecondary}
                                >
                                    Close
                                </button>
                                {hasAction(dialog.student, "UPDATE") && (
                                    <button
                                        type="button"
                                        onClick={() => void openDialog("PROFILE", dialog.student)}
                                        className={buttonPrimary}
                                    >
                                        <Pencil size={15} /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}

                {/* 2. CREATE STUDENT DIALOG */}
                {dialog?.mode === "CREATE" && (
                    <Modal
                        title="Add New Student Enrollment"
                        subtitle="Fill out basic identity, contact details and select section group."
                        onClose={closeDialog}
                        wide
                        icon={UserPlus}
                        iconTone="cyan"
                    >
                        <form onSubmit={handleCreate} className="space-y-5 sm:space-y-6">
                            {/* Passport Photo */}
                            <FormSection
                                title="Student Photo"
                                description="Upload a high-quality passport photo. Standard 3.5 × 4.5 cm proportion."
                                icon={<Camera size={16} />}
                            >
                                <div className="sm:col-span-2">
                                    <PassportPhotoUpload
                                        file={selectedFile}
                                        studentName={
                                            `${profileForm.firstName} ${profileForm.lastName}`.trim() ||
                                            "New Student"
                                        }
                                        onPhotoChange={(newFile) => setSelectedFile(newFile)}
                                        label="Student Passport Photo"
                                        hint="Upload and crop image. The cropped passport image will be submitted with the enrollment."
                                    />
                                </div>
                            </FormSection>

                            {/* Personal Details */}
                            <FormSection
                                title="Personal & Identity Details"
                                description="Basic personal information mapping to UserProfileRequest."
                                icon={<CircleUserRound size={16} />}
                            >
                                <ProfileFields value={profileForm} onChange={setProfileForm} />
                            </FormSection>

                            {/* Academic Enrollment */}
                            <FormSection
                                title="Academic Placement"
                                description="Select target section group. University, course and year are derived automatically."
                                icon={<GraduationCap size={16} />}
                            >
                                <div className="sm:col-span-2">
                                    <Field
                                        label="Target Section Group"
                                        required
                                        hint="The backend links the enrollment to this group."
                                    >
                                        <div className="relative">
                                            <select
                                                required
                                                value={selectedSectionGroupId}
                                                onChange={(e) => {
                                                    const id = e.target.value
                                                        ? Number(e.target.value)
                                                        : "";
                                                    setSelectedSectionGroupId(id);
                                                    setCreateScholarshipIds([]);
                                                    if (typeof id === "number")
                                                        void loadScholarshipOptions(id);
                                                    else setScholarships([]);
                                                }}
                                                className={`${inputClass} appearance-none pr-9`}
                                            >
                                                <option value="">Select Section Group</option>
                                                {sectionGroups.map((item) => (
                                                    <option
                                                        key={item.sectionGroup.id}
                                                        value={item.sectionGroup.id}
                                                    >
                                                        {getSectionGroupLabel(item)}
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </Field>
                                </div>

                                <Field
                                    label="Initial Fee Due Date"
                                    hint="Optional; sets the fee account due date."
                                >
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className={inputClass}
                                    />
                                </Field>

                                <Field
                                    label="Scholarships"
                                    hint="Optional awards linked to this section group."
                                >
                                    <div className="flex min-h-[42px] items-center rounded-xl border border-white/10 bg-slate-950/60 px-3.5 text-sm text-slate-300">
                                        {scholarshipLoading ? (
                                            <>
                                                <LoaderCircle
                                                    size={14}
                                                    className="mr-2 animate-spin text-cyan-400"
                                                />{" "}
                                                Loading scholarships…
                                            </>
                                        ) : (
                                            `${createScholarshipIds.length} scholarship(s) selected`
                                        )}
                                    </div>
                                </Field>

                                {selectedSectionGroupId && (
                                    <div className="sm:col-span-2">
                                        <ScholarshipPicker
                                            items={scholarships}
                                            selected={createScholarshipIds}
                                            onChange={setCreateScholarshipIds}
                                            loading={scholarshipLoading}
                                        />
                                    </div>
                                )}
                            </FormSection>

                            <DialogFooter
                                onCancel={closeDialog}
                                busy={busy}
                                submitLabel="Enroll Student"
                            />
                        </form>
                    </Modal>
                )}

                {/* 3. EDIT PROFILE DIALOG */}
                {dialog?.mode === "PROFILE" && dialog.student && (
                    <Modal
                        title="Edit Student Profile"
                        subtitle={`${fullName(dialog.student)} · Registration: ${dialog.student.student.registrationNumber || "Not assigned"
                            }`}
                        onClose={closeDialog}
                        wide
                        icon={Pencil}
                        iconTone="cyan"
                    >
                        <form onSubmit={handleProfileSave} className="space-y-5 sm:space-y-6">
                            {/* Summary strip */}
                            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-3.5 sm:p-4">
                                <div className="min-w-0">
                                    <p className="font-semibold text-white">
                                        {fullName(dialog.student)}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Username:{" "}
                                        {dialog.student.student.basicDetailRequest.username ||
                                            "Not assigned"}{" "}
                                        · ID #{dialog.student.id}
                                    </p>
                                </div>
                                <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                                    Enrollment #{dialog.student.id}
                                </span>
                            </div>

                            {/* Passport Photo */}
                            <FormSection
                                title="Passport Photo"
                                description="Preview current portrait and crop or upload a new one."
                                icon={<Camera size={16} />}
                            >
                                <div className="sm:col-span-2">
                                    <PassportPhotoUpload
                                        file={selectedFile}
                                        initialPhotoUrl={photoUrl}
                                        loadingPhoto={photoLoading}
                                        studentName={fullName(dialog.student)}
                                        onPhotoChange={(newFile) => setSelectedFile(newFile)}
                                        label="Student Passport Photo"
                                        hint="Cropped image will update the student photo on file."
                                    />
                                </div>
                            </FormSection>

                            {/* Personal Fields */}
                            <FormSection
                                title="Profile Details"
                                description="Update personal identity, contact and residential details."
                                icon={<CircleUserRound size={16} />}
                            >
                                <ProfileFields value={profileForm} onChange={setProfileForm} />
                            </FormSection>

                            <DialogFooter
                                onCancel={closeDialog}
                                busy={busy}
                                submitLabel="Save Profile Changes"
                            />
                        </form>
                    </Modal>
                )}

                {/* 4. SCHOLARSHIPS DIALOG */}
                {dialog?.mode === "SCHOLARSHIPS" && dialog.student && (
                    <Modal
                        title="Manage Student Scholarships"
                        subtitle={`Enrollment #${dialog.student.id} · ${fullName(dialog.student)}`}
                        onClose={closeDialog}
                        icon={GraduationCap}
                        iconTone="violet"
                    >
                        <div className="space-y-5">
                            <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 text-xs leading-5 text-violet-200">
                                <p className="font-semibold text-white">Fee Adjustment Notice</p>
                                <p className="mt-1">
                                    Adding or removing scholarships will trigger the server to
                                    recalculate the fee ledger and updated balance for this student.
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                    Available Scholarships for {formatCommon(dialog.student.sectionGroup)}
                                </p>
                                {scholarshipLoading ? (
                                    <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2">
                                        <LoaderCircle className="animate-spin text-violet-400" />
                                        Loading scholarship options…
                                    </div>
                                ) : (
                                    <ScholarshipPicker
                                        items={scholarships}
                                        selected={selectedScholarships}
                                        onChange={setSelectedScholarships}
                                        loading={false}
                                    />
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-4">
                                <span className="text-xs text-slate-400">
                                    {selectedScholarships.length} scholarship(s) selected
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={closeDialog}
                                        disabled={busy}
                                        className={buttonSecondary}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleScholarshipSave()}
                                        disabled={busy || scholarshipLoading}
                                        className={buttonPrimary}
                                    >
                                        {busy && (
                                            <LoaderCircle size={15} className="animate-spin" />
                                        )}
                                        Save Scholarships
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* 5. COURSE / SECTION GROUP DIALOG */}
                {dialog?.mode === "COURSE" && dialog.student && (
                    <Modal
                        title="Change Program / Section Group"
                        subtitle={`Current: ${formatCommon(dialog.student.sectionGroup) || "Not assigned"}${dialog.student.university ? ` · ${formatCommon(dialog.student.university)}` : ""}`}
                        onClose={closeDialog}
                        icon={BookOpen}
                        iconTone="sky"
                    >
                        <div className="space-y-5">
                            <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-4 text-xs leading-5 text-sky-200">
                                <p className="font-semibold text-white">Program Reassignment</p>
                                <p className="mt-1">
                                    This operation updates the student&apos;s section group, which adjusts
                                    the associated course, fee structure, and authorization parent.
                                </p>
                            </div>

                            <Field label="Target Section Group" required>
                                <div className="relative">
                                    <select
                                        value={selectedSectionGroupId}
                                        onChange={(e) =>
                                            setSelectedSectionGroupId(
                                                e.target.value ? Number(e.target.value) : ""
                                            )
                                        }
                                        className={`${inputClass} appearance-none pr-9`}
                                    >
                                        <option value="">Select target section group</option>
                                        {sectionGroups.map((item) => (
                                            <option
                                                key={item.sectionGroup.id}
                                                value={item.sectionGroup.id}
                                            >
                                                {getSectionGroupLabel(item)}
                                                {item.sectionGroup.id ===
                                                    dialog.student?.sectionGroup?.id
                                                    ? " (Current)"
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <SelectChevron />
                                </div>
                            </Field>

                            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className={buttonSecondary}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleCourseSave()}
                                    disabled={
                                        busy ||
                                        !selectedSectionGroupId ||
                                        Number(selectedSectionGroupId) ===
                                        dialog.student.sectionGroup?.id
                                    }
                                    className={buttonPrimary}
                                >
                                    {busy && <LoaderCircle size={15} className="animate-spin" />}
                                    Update Program
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* 6. SECTION DIALOG */}
                {dialog?.mode === "SECTION" && dialog.student && (
                    <Modal
                        title="Change Section"
                        subtitle={`Enrollment #${dialog.student.id} · ${fullName(dialog.student)}`}
                        onClose={closeDialog}
                        icon={Layers3}
                        iconTone="amber"
                    >
                        <form
                            className="space-y-5"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const id = Number(selectedSectionId);
                                if (!Number.isSafeInteger(id) || id <= 0) {
                                    toast.error("Please select a target section.");
                                    return;
                                }
                                setBusy(true);
                                try {
                                    const updated = await changeStudentSection(
                                        dialog.student!.id,
                                        id
                                    );
                                    replaceStudent(updated);
                                    setNotice("Student section changed successfully.");
                                    toast.success("Section updated successfully.");
                                    setDialog(null);
                                } catch (error) {
                                    toast.error(
                                        extractStudentErrorMessage(error, "Unable to change section.")
                                    );
                                } finally {
                                    setBusy(false);
                                }
                            }}
                        >
                            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs leading-5 text-amber-200">
                                Select a new section for this student from the sections available for their academic placement.
                            </div>

                            {/* Current placement info */}
                            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-3.5 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>Program / Course:</span>
                                    <span className="font-semibold text-slate-200">
                                        {formatCommon(dialog.student.course) || "—"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>Section Group:</span>
                                    <span className="font-semibold text-slate-200">
                                        {formatCommon(dialog.student.sectionGroup) || "—"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-400">
                                    <span>Current Section:</span>
                                    <span className="font-semibold text-amber-300">
                                        {formatCommon(dialog.student.section) || "None assigned"}
                                    </span>
                                </div>
                            </div>

                            {sectionLoading ? (
                                <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-white/5 bg-slate-950/40 py-8 text-cyan-300">
                                    <LoaderCircle className="animate-spin" size={22} />
                                    <span className="text-xs font-medium text-slate-300">
                                        Loading available sections for enrollment #{dialog.student.id}...
                                    </span>
                                </div>
                            ) : sections.length === 0 ? (
                                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-1">
                                    <p className="font-semibold text-white">No sections found</p>
                                    <p>
                                        No sections were returned for this student&apos;s enrollment. Please check that sections are configured for this academic group.
                                    </p>
                                </div>
                            ) : (
                                <Field label="Target Section" required hint="Choose the section to assign to this student">
                                    <div className="relative">
                                        <select
                                            value={selectedSectionId}
                                            onChange={(e) =>
                                                setSelectedSectionId(
                                                    e.target.value ? Number(e.target.value) : ""
                                                )
                                            }
                                            required
                                            className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                                        >
                                            <option value="" className="bg-slate-900 text-slate-400">
                                                Select a section...
                                            </option>
                                            {sections.map((sec) => (
                                                <option
                                                    key={sec.id}
                                                    value={sec.id}
                                                    className="bg-slate-900 text-white"
                                                >
                                                    {sec.name} {sec.code ? `(${sec.code})` : ""}
                                                    {sec.id === dialog.student?.section?.id
                                                        ? " — Current"
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                    </div>
                                </Field>
                            )}

                            <DialogFooter
                                onCancel={closeDialog}
                                busy={busy}
                                disabled={
                                    sectionLoading ||
                                    sections.length === 0 ||
                                    !selectedSectionId ||
                                    Number(selectedSectionId) === dialog.student?.section?.id
                                }
                                submitLabel="Assign Section"
                            />
                        </form>
                    </Modal>
                )}

                {/* 7. ENROLLMENT STATUS DIALOG */}
                {dialog?.mode === "STATUS" && dialog.student && (
                    <Modal
                        title="Change Enrollment Status"
                        subtitle={`${fullName(dialog.student)} · Current: ${dialog.student.status}`}
                        onClose={closeDialog}
                        icon={SlidersHorizontal}
                        iconTone="amber"
                    >
                        <div className="space-y-5">
                            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs leading-5 text-amber-200">
                                This updates the student&apos;s academic enrollment state. It does not
                                affect login access.
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Select New Status
                                </p>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {ENROLLMENT_STATUSES.map((status) => {
                                        const isSelected = selectedStatus === status;
                                        return (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setSelectedStatus(status)}
                                                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${isSelected
                                                    ? "border-cyan-400 bg-cyan-500/15"
                                                    : "border-white/10 bg-slate-800/40 hover:bg-white/5"
                                                    }`}
                                            >
                                                <div
                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isSelected
                                                        ? "border-cyan-400 bg-cyan-400"
                                                        : "border-slate-500"
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p
                                                        className={`text-xs font-bold ${isSelected ? "text-cyan-300" : "text-white"
                                                            }`}
                                                    >
                                                        {STATUS_LABELS[status] ?? status}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">
                                                        {STATUS_DESCRIPTIONS[status] ?? ""}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className={buttonSecondary}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleStatusSave()}
                                    disabled={busy || selectedStatus === dialog.student.status}
                                    className={buttonPrimary}
                                >
                                    {busy && <LoaderCircle size={15} className="animate-spin" />}
                                    Save Status
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* 8. RESET PASSWORD DIALOG */}
                {dialog?.mode === "RESET_PASSWORD" && dialog.student && (
                    <Modal
                        title="Reset Student Password"
                        subtitle={fullName(dialog.student)}
                        onClose={closeDialog}
                        icon={KeyRound}
                        iconTone="rose"
                    >
                        <div className="space-y-5">
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs leading-5 text-rose-200">
                                <p className="font-semibold text-white">Are you sure?</p>
                                <p className="mt-1">
                                    The server will reset the password for user{" "}
                                    <strong className="text-white">
                                        {dialog.student.student.basicDetailRequest.username ||
                                            dialog.student.student.basicDetailRequest.email}
                                    </strong>
                                    . An email notification or temporary credential will be issued by
                                    the auth server.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                <p className="text-xs text-slate-400">Target User Account</p>
                                <p className="text-sm font-bold text-white mt-1">
                                    {fullName(dialog.student)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Registration:{" "}
                                    {dialog.student.student.registrationNumber || "Not assigned"}
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className={buttonSecondary}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleConfirmedAction()}
                                    disabled={busy}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500 disabled:opacity-50"
                                >
                                    {busy && <LoaderCircle size={15} className="animate-spin" />}
                                    Confirm Password Reset
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* 9. ENABLE / DISABLE DIALOG */}
                {dialog?.mode === "ENABLE" && dialog.student && (
                    <Modal
                        title={
                            dialog.student.student.basicDetailRequest.enabled
                                ? "Disable Student Account"
                                : "Enable Student Account"
                        }
                        subtitle={fullName(dialog.student)}
                        onClose={closeDialog}
                        icon={
                            dialog.student.student.basicDetailRequest.enabled
                                ? ShieldAlert
                                : ShieldCheck
                        }
                        iconTone={
                            dialog.student.student.basicDetailRequest.enabled ? "rose" : "emerald"
                        }
                    >
                        <div className="space-y-5">
                            <div
                                className={`rounded-xl border p-4 text-xs leading-5 ${dialog.student.student.basicDetailRequest.enabled
                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                    }`}
                            >
                                <p className="font-semibold text-white">
                                    {dialog.student.student.basicDetailRequest.enabled
                                        ? "Disabling Login Access"
                                        : "Enabling Login Access"}
                                </p>
                                <p className="mt-1">
                                    {dialog.student.student.basicDetailRequest.enabled
                                        ? "The student will no longer be able to log in to the student portal. Enrollment data remains preserved."
                                        : "The student will immediately regain access to log in to the student portal."}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                <p className="text-xs text-slate-400">Student Account</p>
                                <p className="text-sm font-bold text-white mt-1">
                                    {fullName(dialog.student)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Username:{" "}
                                    {dialog.student.student.basicDetailRequest.username || "—"}
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className={buttonSecondary}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleConfirmedAction()}
                                    disabled={busy}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50 ${dialog.student.student.basicDetailRequest.enabled
                                        ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                                        : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                                        }`}
                                >
                                    {busy && <LoaderCircle size={15} className="animate-spin" />}
                                    {dialog.student.student.basicDetailRequest.enabled
                                        ? "Disable Account"
                                        : "Enable Account"}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </motion.main>
    );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents & UI Helpers                                                 */
/* -------------------------------------------------------------------------- */

function MenuButton({
    icon: Icon,
    iconColor,
    label,
    detail,
    onClick,
    disabled,
}: {
    icon: typeof Eye;
    iconColor: string;
    label: string;
    detail: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200">{label}</p>
                <p className="text-[10px] text-slate-400 truncate">{detail}</p>
            </div>
        </button>
    );
}

function uniqueOptions(items: CommonDTO[]) {
    const seen = new Set<number>();
    return items
        .filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)))
        .map((item) => ({ value: String(item.id), label: formatCommon(item) }));
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <label className="block min-w-0 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
            </span>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 pr-8 text-xs text-white transition focus:border-cyan-400 focus:outline-none"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <SelectChevron />
            </div>
        </label>
    );
}

function DetailSection({
    title,
    icon,
    children,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-800/30 p-4 sm:p-5">
            <div className="flex items-center gap-2.5 text-cyan-300">
                <span className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2 shrink-0">
                    {icon}
                </span>
                <h3 className="text-sm font-bold text-white">{title}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function DetailItem({
    label,
    value,
    icon,
    wide = false,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
    wide?: boolean;
}) {
    return (
        <div
            className={`min-w-0 rounded-xl border border-white/5 bg-slate-950/40 p-3 ${wide ? "sm:col-span-2" : ""
                }`}
        >
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {icon}
                {label}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-200">
                {value}
            </p>
        </div>
    );
}

function StatMini({
    label,
    value,
    truncate = false,
    className,
    valueClassName,
}: {
    label: string;
    value: string;
    truncate?: boolean;
    className?: string;
    valueClassName?: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!value || value === "—" || value === "Not assigned") return;
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            className={`group relative rounded-xl border border-white/5 bg-slate-950/40 p-2.5 min-w-0 transition hover:border-white/10 ${className ?? ""
                }`}
            title={value}
        >
            <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                    {label}
                </p>
                {value && value !== "—" && value !== "Not assigned" && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-cyan-300 p-0.5 rounded"
                        title={`Copy ${label}`}
                        aria-label={`Copy ${label}`}
                    >
                        {copied ? (
                            <Check size={11} className="text-emerald-400" />
                        ) : (
                            <Copy size={11} />
                        )}
                    </button>
                )}
            </div>
            <p
                className={`mt-1 font-bold text-white ${truncate
                    ? "truncate text-xs"
                    : "break-all text-[11px] sm:text-xs leading-tight"
                    } ${valueClassName ?? ""}`}
            >
                {value}
            </p>
        </div>
    );
}

function Avatar({
    name,
    size = "md",
    photoUrl,
}: {
    name: string;
    size?: "md" | "lg" | "xl";
    photoUrl?: string;
}) {
    const sizeClass =
        size === "xl"
            ? "h-14 w-14 sm:h-16 sm:w-16 rounded-2xl text-base sm:text-lg"
            : size === "lg"
                ? "h-11 w-11 sm:h-12 sm:w-12 rounded-xl text-xs sm:text-sm"
                : "h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-xs";

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={name}
                className={`shrink-0 object-cover border border-cyan-400/20 shadow-md ${sizeClass}`}
            />
        );
    }
    return (
        <div
            className={`flex shrink-0 items-center justify-center border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-violet-500/20 font-bold text-cyan-200 shadow-md ${sizeClass}`}
        >
            {initials(name)}
        </div>
    );
}

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0" title={value}>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold truncate">
                {label}
            </p>
            <p className="mt-0.5 break-words text-xs font-medium text-slate-200">
                {value}
            </p>
        </div>
    );
}

function PageButton({
    children,
    label,
    disabled,
    onClick,
}: {
    children: ReactNode;
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
        >
            {children}
        </button>
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                    <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-white/10" />
                        <div className="h-3 w-44 rounded bg-white/5" />
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="mt-2 h-3 w-20 rounded bg-white/5" />
            </td>
            <td className="px-4 py-4">
                <div className="h-4 w-36 rounded bg-white/10" />
                <div className="mt-2 h-3 w-28 rounded bg-white/5" />
            </td>
            <td className="px-4 py-4">
                <div className="h-6 w-24 rounded bg-white/10" />
            </td>
            <td className="px-4 py-4">
                <div className="h-6 w-20 rounded-full bg-white/10" />
            </td>
            <td className="px-5 py-4 text-right">
                <div className="inline-block h-8 w-28 rounded bg-white/10" />
            </td>
        </tr>
    );
}

function FormSection({
    title,
    description,
    icon,
    children,
}: {
    title: string;
    description: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-300">
                    {icon}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400">{description}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function ProfileFields({
    value,
    onChange,
}: {
    value: ProfileForm;
    onChange: (value: ProfileForm) => void;
}) {
    const update = (key: keyof ProfileForm, next: string) => onChange({ ...value, [key]: next });

    return (
        <>
            <Field label="First Name" required>
                <input
                    required
                    maxLength={100}
                    value={value.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    placeholder="First name"
                    className={inputClass}
                />
            </Field>
            <Field label="Last Name" required>
                <input
                    required
                    maxLength={100}
                    value={value.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    placeholder="Last name"
                    className={inputClass}
                />
            </Field>
            <Field label="Date of Birth">
                <input
                    type="date"
                    value={value.dob}
                    onChange={(e) => update("dob", e.target.value)}
                    className={inputClass}
                />
            </Field>
            <Field label="Email Address">
                <input
                    type="email"
                    maxLength={180}
                    value={value.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="student@example.com"
                    className={inputClass}
                />
            </Field>
            <Field label="Student Phone Number">
                <input
                    type="tel"
                    maxLength={30}
                    value={value.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputClass}
                />
            </Field>
            <Field label="Guardian Mobile Number">
                <input
                    type="tel"
                    maxLength={30}
                    value={value.guardianMobileNumber}
                    onChange={(e) => update("guardianMobileNumber", e.target.value)}
                    placeholder="Parent / Guardian contact"
                    className={inputClass}
                />
            </Field>
            <Field label="Father's Full Name">
                <input
                    maxLength={120}
                    value={value.fatherName}
                    onChange={(e) => update("fatherName", e.target.value)}
                    placeholder="Father's name"
                    className={inputClass}
                />
            </Field>
            <Field label="Mother's Full Name">
                <input
                    maxLength={120}
                    value={value.motherName}
                    onChange={(e) => update("motherName", e.target.value)}
                    placeholder="Mother's name"
                    className={inputClass}
                />
            </Field>
            <div className="sm:col-span-2">
                <Field label="Residential / Postal Address">
                    <textarea
                        rows={2}
                        maxLength={1000}
                        value={value.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="Current address, city, state, pin code..."
                        className={`${inputClass} resize-y`}
                    />
                </Field>
            </div>
        </>
    );
}

function ScholarshipPicker({
    items,
    selected,
    onChange,
    loading,
}: {
    items: CommonDTO[];
    selected: number[];
    onChange: (ids: number[]) => void;
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-6 text-xs text-slate-400 gap-2">
                <LoaderCircle size={15} className="animate-spin text-cyan-400" />
                Loading scholarship options…
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">
                No active scholarships available for this section group.
            </div>
        );
    }
    return (
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 p-2.5 custom-scrollbar">
            {items.map((item) => {
                const checked = selected.includes(item.id);
                return (
                    <label
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition ${checked
                            ? "border border-violet-400/40 bg-violet-500/15"
                            : "border border-transparent bg-slate-900/60 hover:bg-white/5"
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                                onChange(
                                    e.target.checked
                                        ? [...selected, item.id]
                                        : selected.filter((id) => id !== item.id)
                                )
                            }
                            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500/30"
                        />
                        <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-100">
                                {item.name}
                            </span>
                            {item.code && (
                                <span className="block text-[10px] font-mono text-violet-300">
                                    {item.code}
                                </span>
                            )}
                        </div>
                        {checked && <Check size={16} className="shrink-0 text-violet-400" />}
                    </label>
                );
            })}
        </div>
    );
}

function DialogFooter({
    onCancel,
    busy,
    submitLabel,
    disabled = false,
}: {
    onCancel: () => void;
    busy: boolean;
    submitLabel: string;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={onCancel} disabled={busy} className={buttonSecondary}>
                Cancel
            </button>
            <button type="submit" disabled={busy || disabled} className={buttonPrimary}>
                {busy && <LoaderCircle size={15} className="animate-spin" />}
                {submitLabel}
            </button>
        </div>
    );
}
