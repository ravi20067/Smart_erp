import {
    useCallback,
    useEffect,
    useMemo,
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
    Clock,
    Eye,
    KeyRound,
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
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UserPlus,
    UserRound,
    UserRoundCheck,
    UserRoundX,
    Users,
    X,
} from "lucide-react";

import {
    changeTeacherEnabled,
    createTeacher,
    extractTeacherErrorMessage,
    formatAuditActor,
    formatDate,
    formatDateTime,
    getInitials,
    getTeacherFullName,
    getTeacherPhoto,
    getTeachers,
    getTeacherUniversityFilter,
    hasTeacherPermission,
    resetTeacherPassword,
    uniqueCommonDTOs,
    updateTeacherProfile,
    type CommonDTO,
    type TeacherRequest,
    type TeacherResponse,
    type UserProfileRequest,
} from "@/services/userMangement/teacherService";
import { PassportPhotoUpload } from "@/components/PassportPhotoUpload";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 8;

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortMode = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "USERNAME_ASC";
type DialogMode = "CREATE" | "VIEW" | "PROFILE" | "RESET_PASSWORD" | "ENABLE";

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

/* -------------------------------------------------------------------------- */
/* Visual Containers & Shared Micro-Components                                */
/* -------------------------------------------------------------------------- */

function GlassCard({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                active
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-300"
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-emerald-400" : "bg-rose-400"
                }`}
            />
            {active ? "Active" : "Disabled"}
        </span>
    );
}

function AvatarBadge({
    name,
    photoUrl,
    size = "md",
}: {
    name: string;
    photoUrl?: string | null;
    size?: "sm" | "md" | "lg" | "xl";
}) {
    const sizeClasses = {
        sm: "h-8 w-8 text-[11px]",
        md: "h-10 w-10 text-xs",
        lg: "h-12 w-12 text-sm",
        xl: "h-16 w-16 text-lg sm:h-20 sm:w-20 sm:text-xl",
    };

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={name}
                className={`${sizeClasses[size]} shrink-0 rounded-xl border border-white/10 object-cover shadow-md`}
            />
        );
    }

    return (
        <div
            className={`flex ${sizeClasses[size]} shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/25 to-violet-500/20 font-bold text-cyan-200 shadow-md`}
        >
            {getInitials(name)}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Modal Shell Component                                                      */
/* -------------------------------------------------------------------------- */

function ModalShell({
    title,
    subtitle,
    onClose,
    children,
    wide = false,
    icon: Icon = CircleUserRound,
    iconTone = "cyan",
    busy = false,
}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
    icon?: typeof CircleUserRound;
    iconTone?: "cyan" | "emerald" | "rose" | "purple" | "amber";
    busy?: boolean;
}) {
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, busy]);

    const toneClasses = {
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (!busy) onClose();
                }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.section
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                transition={{ duration: 0.2 }}
                className={`relative z-10 my-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/70 ${
                    wide ? "max-w-4xl" : "max-w-xl"
                }`}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`rounded-xl border p-2 shrink-0 ${toneClasses[iconTone]}`}>
                            <Icon size={20} />
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
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="min-h-0 flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
                    {children}
                </div>
            </motion.section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Form Fields Helper                                                         */
/* -------------------------------------------------------------------------- */

function ProfileFields({
    value,
    onChange,
    disabled = false,
}: {
    value: ProfileForm;
    onChange: (updater: (prev: ProfileForm) => ProfileForm) => void;
    disabled?: boolean;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* First Name */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                    First Name <span className="text-rose-400">*</span>
                </label>
                <input
                    type="text"
                    required
                    disabled={disabled}
                    value={value.firstName}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, firstName: e.target.value }))
                    }
                    placeholder="e.g. John"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Last Name */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                    Last Name <span className="text-rose-400">*</span>
                </label>
                <input
                    type="text"
                    required
                    disabled={disabled}
                    value={value.lastName}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, lastName: e.target.value }))
                    }
                    placeholder="e.g. Doe"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Email */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Address</label>
                <input
                    type="email"
                    disabled={disabled}
                    value={value.email}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="teacher@university.edu"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Phone */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">Phone Number</label>
                <input
                    type="tel"
                    disabled={disabled}
                    value={value.phone}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">Date of Birth</label>
                <input
                    type="date"
                    disabled={disabled}
                    value={value.dob}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, dob: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Guardian Mobile */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">Emergency / Guardian Mobile</label>
                <input
                    type="tel"
                    disabled={disabled}
                    value={value.guardianMobileNumber}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, guardianMobileNumber: e.target.value }))
                    }
                    placeholder="Emergency Contact"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Father's Name */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">Father's Name</label>
                <input
                    type="text"
                    disabled={disabled}
                    value={value.fatherName}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, fatherName: e.target.value }))
                    }
                    placeholder="Father's full name"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Mother's Name */}
            <div className="space-y-1">
                <label className="font-semibold text-slate-300">Mother's Name</label>
                <input
                    type="text"
                    disabled={disabled}
                    value={value.motherName}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, motherName: e.target.value }))
                    }
                    placeholder="Mother's full name"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-slate-300">Residential Address</label>
                <textarea
                    rows={2}
                    disabled={disabled}
                    value={value.address}
                    onChange={(e) =>
                        onChange((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Street, City, Postal Code"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Teacher Page Component                                                */
/* -------------------------------------------------------------------------- */

export default function Teacher() {
    const reduceMotion = useReducedMotion();

    // Data State
    const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
    const [universities, setUniversities] = useState<CommonDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Filter & Search State
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityFilter, setUniversityFilter] = useState<number | "ALL">("ALL");
    const [sortBy, setSortBy] = useState<SortMode>("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        teacher?: TeacherResponse;
    } | null>(null);
    const [busy, setBusy] = useState(false);

    // Dialog Form State
    const [profileForm, setProfileForm] = useState<ProfileForm>(EMPTY_PROFILE);
    const [selectedUniversityId, setSelectedUniversityId] = useState<number | "">("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string>("");
    const [photoLoading, setPhotoLoading] = useState(false);
    const [viewTab, setViewTab] = useState<"overview" | "academic">("overview");

    // Initial Data Fetching
    const loadTeachers = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setPageError("");

        try {
            const [teachersData, uniFilters] = await Promise.all([
                getTeachers(),
                getTeacherUniversityFilter().catch((err) => {
                    console.warn("Could not load university filters:", err);
                    return [] as CommonDTO[];
                }),
            ]);

            setTeachers(teachersData);
            setUniversities(uniFilters);
        } catch (error) {
            setPageError(extractTeacherErrorMessage(error, "Unable to load teachers."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadTeachers();
    }, [loadTeachers]);

    useEffect(() => {
        return () => {
            if (photoUrl) URL.revokeObjectURL(photoUrl);
        };
    }, [photoUrl]);

    // Dynamic Filter Options derived from loaded teachers + filter API
    const universityOptions = useMemo(() => {
        const list = [
            ...universities,
            ...teachers.map((t) => t.university).filter(Boolean),
        ];
        return uniqueCommonDTOs(list);
    }, [universities, teachers]);

    // Active Filters Check
    const hasActiveFilters =
        Boolean(search.trim()) ||
        statusFilter !== "ALL" ||
        universityFilter !== "ALL" ||
        sortBy !== "NEWEST";

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("ALL");
        setUniversityFilter("ALL");
        setSortBy("NEWEST");
        setCurrentPage(1);
    };

    // Filter & Sort Pipeline
    const filteredTeachers = useMemo(() => {
        const q = search.trim().toLowerCase();

        return teachers.filter((teacher) => {
            const profile = teacher.basicDetailRequest;

            if (q) {
                const name = getTeacherFullName(teacher).toLowerCase();
                const username = profile.username?.toLowerCase() || "";
                const email = profile.email?.toLowerCase() || "";
                const phone = profile.phone?.toLowerCase() || "";
                const uniName = teacher.university?.name?.toLowerCase() || "";
                const deptName = teacher.department?.name?.toLowerCase() || "";
                const subjectNames = (teacher.subjects || [])
                    .map((s) => s.name.toLowerCase())
                    .join(" ");

                const matches =
                    name.includes(q) ||
                    username.includes(q) ||
                    email.includes(q) ||
                    phone.includes(q) ||
                    uniName.includes(q) ||
                    deptName.includes(q) ||
                    subjectNames.includes(q);

                if (!matches) return false;
            }

            if (statusFilter !== "ALL") {
                if (statusFilter === "ACTIVE" && !profile.enabled) return false;
                if (statusFilter === "INACTIVE" && profile.enabled) return false;
            }

            if (universityFilter !== "ALL") {
                if (teacher.university?.id !== universityFilter) return false;
            }

            return true;
        });
    }, [teachers, search, statusFilter, universityFilter]);

    const sortedTeachers = useMemo(() => {
        return [...filteredTeachers].sort((a, b) => {
            switch (sortBy) {
                case "NAME_ASC":
                    return getTeacherFullName(a).localeCompare(getTeacherFullName(b));
                case "NAME_DESC":
                    return getTeacherFullName(b).localeCompare(getTeacherFullName(a));
                case "USERNAME_ASC":
                    return (a.basicDetailRequest.username || "").localeCompare(
                        b.basicDetailRequest.username || ""
                    );
                case "NEWEST":
                default:
                    return b.id - a.id;
            }
        });
    }, [filteredTeachers, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / PAGE_SIZE));
    const paginatedTeachers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedTeachers.slice(start, start + PAGE_SIZE);
    }, [sortedTeachers, currentPage]);

    // Overall Metrics
    const metrics = useMemo(() => {
        const total = teachers.length;
        const active = teachers.filter((t) => t.basicDetailRequest.enabled).length;
        const disabled = teachers.filter((t) => !t.basicDetailRequest.enabled).length;
        const uniqueUnis = new Set(
            teachers.map((t) => t.university?.id).filter(Boolean)
        ).size;

        return { total, active, disabled, uniqueUnis };
    }, [teachers]);

    // Dialog Open / Close Operations
    const openDialog = async (mode: DialogMode, teacher?: TeacherResponse) => {
        setDialog({ mode, teacher });
        setSelectedFile(null);
        setSelectedUniversityId(teacher?.university?.id ?? "");
        setViewTab("overview");

        if (photoUrl) {
            URL.revokeObjectURL(photoUrl);
            setPhotoUrl("");
        }

        if (mode === "PROFILE" && teacher) {
            const p = teacher.basicDetailRequest;
            setProfileForm({
                firstName: p.firstName || "",
                lastName: p.lastName || "",
                dob: p.dob || "",
                email: p.email || "",
                phone: p.phone || "",
                fatherName: p.fatherName || "",
                motherName: p.motherName || "",
                guardianMobileNumber: p.guardianMobileNumber || "",
                address: p.address || "",
            });
        } else if (mode === "CREATE") {
            setProfileForm(EMPTY_PROFILE);
            if (universities.length === 1) {
                setSelectedUniversityId(universities[0].id);
            }
        }

        // Fetch photo for view or edit
        if ((mode === "VIEW" || mode === "PROFILE") && teacher) {
            setPhotoLoading(true);
            try {
                const blob = await getTeacherPhoto(
                    teacher.basicDetailRequest.userId || teacher.id
                );
                setPhotoUrl(URL.createObjectURL(blob));
            } catch {
                // Photo is optional, silently fallback
            } finally {
                setPhotoLoading(false);
            }
        }
    };

    const closeDialog = () => {
        if (busy) return;
        setDialog(null);
        setSelectedFile(null);
        setSelectedUniversityId("");
        setPhotoLoading(false);
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        setPhotoUrl("");
    };

    // Handle Form Submit: Create Teacher
    const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUniversityId) {
            toast.error("Please select an institution / university for this teacher.");
            return;
        }
        if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
            toast.error("First name and last name are required.");
            return;
        }

        setBusy(true);
        const requestPayload: TeacherRequest = {
            status: true,
            basicDetailRequest: {
                ...profileForm,
                firstName: profileForm.firstName.trim(),
                lastName: profileForm.lastName.trim(),
                email: profileForm.email.trim(),
                phone: profileForm.phone.trim(),
            },
        };

        try {
            const created = await createTeacher(
                Number(selectedUniversityId),
                requestPayload,
                selectedFile
            );
            setTeachers((prev) => [created, ...prev]);
            setNotice(`Teacher "${getTeacherFullName(created)}" registered successfully.`);
            toast.success("Teacher registered successfully");
            closeDialog();
        } catch (error) {
            toast.error(extractTeacherErrorMessage(error, "Unable to register teacher."));
        } finally {
            setBusy(false);
        }
    };

    // Handle Form Submit: Edit Profile
    const handleProfileSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!dialog?.teacher) return;
        if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
            toast.error("First name and last name are required.");
            return;
        }

        setBusy(true);
        const payload: UserProfileRequest = {
            ...profileForm,
            firstName: profileForm.firstName.trim(),
            lastName: profileForm.lastName.trim(),
            email: profileForm.email.trim(),
            phone: profileForm.phone.trim(),
        };

        try {
            const updatedProfile = await updateTeacherProfile(
                dialog.teacher.id,
                payload,
                selectedFile
            );

            setTeachers((prev) =>
                prev.map((t) =>
                    t.id === dialog.teacher!.id
                        ? {
                              ...t,
                              basicDetailRequest: updatedProfile,
                              updatedAt: new Date().toISOString(),
                          }
                        : t
                )
            );

            setNotice("Teacher profile and details updated successfully.");
            toast.success("Teacher profile updated successfully");
            closeDialog();
        } catch (error) {
            toast.error(extractTeacherErrorMessage(error, "Unable to update teacher profile."));
        } finally {
            setBusy(false);
        }
    };

    // Handle Account Status Toggle (Enable/Disable)
    const handleToggleEnable = async () => {
        if (!dialog?.teacher) return;
        setBusy(true);
        const newEnabled = !dialog.teacher.basicDetailRequest.enabled;

        try {
            const message = await changeTeacherEnabled(dialog.teacher.id, newEnabled);
            setTeachers((prev) =>
                prev.map((t) =>
                    t.id === dialog.teacher!.id
                        ? {
                              ...t,
                              basicDetailRequest: {
                                  ...t.basicDetailRequest,
                                  enabled: newEnabled,
                              },
                              updatedAt: new Date().toISOString(),
                          }
                        : t
                )
            );
            setNotice(`Teacher account ${newEnabled ? "enabled" : "disabled"} successfully.`);
            toast.success(message || `Account ${newEnabled ? "enabled" : "disabled"}.`);
            closeDialog();
        } catch (error) {
            toast.error(extractTeacherErrorMessage(error, "Unable to change account status."));
        } finally {
            setBusy(false);
        }
    };

    // Handle Password Reset
    const handleResetPassword = async () => {
        if (!dialog?.teacher) return;
        setBusy(true);

        try {
            const message = await resetTeacherPassword(dialog.teacher.id);
            setNotice("Teacher password reset successfully.");
            toast.success(message || "Password reset successfully.");
            closeDialog();
        } catch (error) {
            toast.error(extractTeacherErrorMessage(error, "Unable to reset password."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-5 p-3 text-slate-100 sm:space-y-6 sm:p-5 lg:p-7"
        >
            {/* Header Section */}
            <section className="space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span className="truncate">User Management</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Teachers</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Faculty &amp; Academic Staff Administration
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Faculty Management
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Manage faculty members, passport identity records, institutional placements, login credentials, and governance audit trails.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadTeachers(true)}
                            disabled={loading || refreshing}
                            title="Refresh teacher list"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-3 sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={refreshing || loading ? "animate-spin text-cyan-400" : ""}
                            />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => void openDialog("CREATE")}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Add Teacher</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Alert Status Banners */}
            <AnimatePresence>
                {(pageError || notice) && (
                    <motion.div
                        role={pageError ? "alert" : "status"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm ${
                            pageError
                                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        }`}
                    >
                        <div className="flex items-start gap-2.5">
                            {pageError ? (
                                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                            ) : (
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                            )}
                            <div>
                                <p className="font-semibold text-white">
                                    {pageError ? "Action Required" : "Success"}
                                </p>
                                <p className="mt-0.5 leading-relaxed">{pageError || notice}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {pageError && (
                                <button
                                    type="button"
                                    onClick={() => void loadTeachers()}
                                    className="rounded-lg border border-rose-400/30 bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/30"
                                >
                                    Retry
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setPageError("");
                                    setNotice("");
                                }}
                                aria-label="Dismiss message"
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metric Statistics Cards */}
            <section
                aria-label="Faculty statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    {
                        label: "Total Faculty",
                        value: loading ? "—" : metrics.total.toLocaleString("en-IN"),
                        sub: "Registered teaching staff",
                        icon: Users,
                        color: "border-blue-400/30 bg-blue-500/10 text-blue-300",
                    },
                    {
                        label: "Active Accounts",
                        value: loading ? "—" : metrics.active.toLocaleString("en-IN"),
                        sub: "Portal access enabled",
                        icon: UserRoundCheck,
                        color: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
                    },
                    {
                        label: "Disabled Accounts",
                        value: loading ? "—" : metrics.disabled.toLocaleString("en-IN"),
                        sub: "Login privileges revoked",
                        icon: UserRoundX,
                        color: "border-rose-400/30 bg-rose-500/10 text-rose-300",
                    },
                    {
                        label: "Universities Covered",
                        value: loading ? "—" : metrics.uniqueUnis.toLocaleString("en-IN"),
                        sub: "Affiliated institutions",
                        icon: Building2,
                        color: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
                    },
                ].map((stat) => (
                    <GlassCard key={stat.label} className="p-3.5 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 truncate">
                                {stat.label}
                            </span>
                            <div
                                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border ${stat.color} shrink-0`}
                            >
                                <stat.icon size={17} />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                                {stat.value}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 truncate">{stat.sub}</p>
                    </GlassCard>
                ))}
            </section>

            {/* Filter Toolbar Card */}
            <GlassCard className="p-3.5 sm:p-4">
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* Search Input */}
                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search faculty name, username, email, phone..."
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* University Filter */}
                        <div className="relative">
                            <select
                                value={universityFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setUniversityFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Universities
                                </option>
                                {universityOptions.map((u) => (
                                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Statuses
                                </option>
                                <option value="ACTIVE" className="bg-slate-900 text-white">
                                    Active Only
                                </option>
                                <option value="INACTIVE" className="bg-slate-900 text-white">
                                    Disabled Only
                                </option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Sort & Reset */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortMode)}
                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                                >
                                    <option value="NEWEST" className="bg-slate-900 text-white">
                                        Newest First
                                    </option>
                                    <option value="NAME_ASC" className="bg-slate-900 text-white">
                                        Name (A-Z)
                                    </option>
                                    <option value="NAME_DESC" className="bg-slate-900 text-white">
                                        Name (Z-A)
                                    </option>
                                    <option value="USERNAME_ASC" className="bg-slate-900 text-white">
                                        Username
                                    </option>
                                </select>
                                <ArrowDownUp
                                    size={13}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    title="Reset all filters"
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white shrink-0"
                                >
                                    <RotateCcw size={13} />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* List Presentation: Dual-View (Desktop Table + Mobile Cards) */}
            <GlassCard>
                {/* 1. Desktop Table View (hidden on sm/mobile) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th scope="col" className="px-5 py-4 w-12 text-center">
                                    #
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[220px]">
                                    Faculty Profile &amp; Creator
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[170px]">
                                    Contact &amp; DOB
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[170px]">
                                    Institution &amp; Subjects
                                </th>
                                <th scope="col" className="px-4 py-4 text-center">
                                    Account Status
                                </th>
                                <th scope="col" className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="inline-flex flex-col items-center justify-center gap-3">
                                            <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                                            <p className="font-semibold text-slate-200">
                                                Loading faculty records...
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Fetching profiles, appointments, and access permissions
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageError && teachers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load faculty records
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                                            {pageError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadTeachers()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : paginatedTeachers.length > 0 ? (
                                paginatedTeachers.map((t, index) => {
                                    const canRead = hasTeacherPermission(t, "READ");
                                    const canUpdate = hasTeacherPermission(t, "UPDATE");
                                    const profile = t.basicDetailRequest;
                                    const name = getTeacherFullName(t);

                                    return (
                                        <motion.tr
                                            key={t.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.035]"
                                        >
                                            {/* Index */}
                                            <td className="px-5 py-4 text-slate-500 text-xs text-center font-mono">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>

                                            {/* Faculty Profile & Creator Pill (Exact University.tsx Matching) */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <AvatarBadge name={name} size="md" />
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {name}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                ID #{t.id}
                                                            </span>
                                                            {profile.username && (
                                                                <>
                                                                    <span className="text-slate-600">·</span>
                                                                    <span className="font-mono text-[11px] text-cyan-400 truncate max-w-[100px]">
                                                                        @{profile.username}
                                                                    </span>
                                                                </>
                                                            )}
                                                            <span className="text-slate-600">·</span>
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                title={`Created by: ${formatAuditActor(
                                                                    t.createdBy
                                                                )}${
                                                                    t.createdAt
                                                                        ? ` on ${formatDate(t.createdAt)}`
                                                                        : ""
                                                                }${
                                                                    t.updatedBy?.name
                                                                        ? ` | Modified by: ${formatAuditActor(
                                                                              t.updatedBy
                                                                          )}`
                                                                        : ""
                                                                }`}
                                                            >
                                                                <UserCheck
                                                                    size={11}
                                                                    className="text-emerald-400 shrink-0"
                                                                />
                                                                <span className="truncate max-w-[110px] font-medium text-slate-300">
                                                                    {t.createdBy?.name || "System"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Details */}
                                            <td className="px-4 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-medium text-slate-200">
                                                        {profile.phone || "No phone registered"}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate max-w-[180px]">
                                                        {profile.email || "No email assigned"}
                                                    </p>
                                                    {profile.dob && (
                                                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                            <CalendarDays size={10} className="text-slate-500 shrink-0" />
                                                            <span>DOB: {formatDate(profile.dob)}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Institution & Subjects */}
                                            <td className="px-4 py-4">
                                                <div className="space-y-1 max-w-[240px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 size={13} className="text-cyan-400 shrink-0" />
                                                        <span
                                                            className="font-medium text-slate-200 truncate"
                                                            title={t.university?.name || ""}
                                                        >
                                                            {t.university?.name || "No institution linked"}
                                                        </span>
                                                    </div>

                                                    {(t.subjects ?? []).length > 0 ? (
                                                        <div className="flex flex-wrap gap-1 pt-0.5">
                                                            {(t.subjects ?? []).slice(0, 2).map((s) => (
                                                                <span
                                                                    key={s.id}
                                                                    className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 text-[10px] font-medium text-cyan-300 truncate max-w-[100px]"
                                                                >
                                                                    {s.name}
                                                                </span>
                                                            ))}
                                                            {(t.subjects?.length ?? 0) > 2 && (
                                                                <span className="text-[10px] text-slate-500 self-center">
                                                                    +{(t.subjects?.length ?? 0) - 2} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-500 italic">
                                                            No subjects mapped
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Account Status */}
                                            <td className="px-4 py-4 text-center">
                                                <StatusBadge active={profile.enabled} />
                                            </td>

                                            {/* Strict h-8 w-8 shrink-0 Action Buttons */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View */}
                                                    <button
                                                        type="button"
                                                        onClick={() => void openDialog("VIEW", t)}
                                                        disabled={!canRead}
                                                        aria-label={`View details of ${name}`}
                                                        title="View Overview & Details"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10 disabled:opacity-40"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Edit Profile */}
                                                    {canUpdate && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void openDialog("PROFILE", t)}
                                                            aria-label={`Edit ${name}`}
                                                            title="Edit Profile"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}

                                                    {/* Toggle Account Status */}
                                                    {canUpdate && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void openDialog("ENABLE", t)}
                                                            aria-label={`${
                                                                profile.enabled ? "Disable" : "Enable"
                                                            } account for ${name}`}
                                                            title={
                                                                profile.enabled
                                                                    ? "Disable Account Access"
                                                                    : "Enable Account Access"
                                                            }
                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                                                                profile.enabled
                                                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-500/20"
                                                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/30 hover:bg-emerald-500/20"
                                                            }`}
                                                        >
                                                            {profile.enabled ? (
                                                                <ShieldAlert size={15} />
                                                            ) : (
                                                                <ShieldCheck size={15} />
                                                            )}
                                                        </button>
                                                    )}

                                                    {/* Reset Password */}
                                                    {canUpdate && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void openDialog("RESET_PASSWORD", t)}
                                                            aria-label={`Reset password for ${name}`}
                                                            title="Reset Password"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 transition hover:border-purple-400/30 hover:bg-purple-500/20"
                                                        >
                                                            <KeyRound size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Users size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching faculty found"
                                                : "No teachers registered yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search terms or resetting your filters."
                                                : "Get started by registering your institution's first faculty member."}
                                        </p>
                                        <div className="mt-4 flex justify-center gap-2">
                                            {hasActiveFilters ? (
                                                <button
                                                    type="button"
                                                    onClick={resetFilters}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                                >
                                                    <RotateCcw size={13} />
                                                    Clear Filters
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => void openDialog("CREATE")}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plus size={14} />
                                                    Add Teacher
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. Mobile Card View (sm:hidden) */}
                <div className="divide-y divide-white/5 sm:hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <LoaderCircle size={28} className="animate-spin text-cyan-400 mx-auto" />
                            <p className="mt-3 text-xs font-semibold text-slate-200">
                                Loading faculty members...
                            </p>
                        </div>
                    ) : pageError && teachers.length === 0 ? (
                        <div className="p-6 text-center">
                            <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                            <p className="mt-2 text-xs font-semibold text-white">
                                Failed to load teachers
                            </p>
                            <button
                                type="button"
                                onClick={() => void loadTeachers()}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                            >
                                <RefreshCw size={13} /> Retry
                            </button>
                        </div>
                    ) : paginatedTeachers.length > 0 ? (
                        paginatedTeachers.map((t) => {
                            const canRead = hasTeacherPermission(t, "READ");
                            const canUpdate = hasTeacherPermission(t, "UPDATE");
                            const profile = t.basicDetailRequest;
                            const name = getTeacherFullName(t);

                            return (
                                <article key={t.id} className="p-3.5 space-y-3">
                                    {/* Header: Avatar + Name + Status */}
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <AvatarBadge name={name} size="md" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-white text-sm truncate">
                                                    {name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                                                    <span className="font-mono text-[11px] text-slate-500">
                                                        ID #{t.id}
                                                    </span>
                                                    {profile.username && (
                                                        <>
                                                            <span>·</span>
                                                            <span className="font-mono text-[11px] text-cyan-400 truncate">
                                                                @{profile.username}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <StatusBadge active={profile.enabled} />
                                    </div>

                                    {/* Details Breakdown Grid */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Institution:</span>
                                            <span className="font-medium text-white truncate max-w-[200px]">
                                                {t.university?.name || "None"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Phone:</span>
                                            <span className="font-medium text-white">{profile.phone || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Email:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[190px]">
                                                {profile.email || "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">Subjects:</span>
                                            <span className="font-medium text-cyan-300">
                                                {(t.subjects ?? []).length > 0
                                                    ? `${t.subjects!.length} assigned`
                                                    : "None"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mobile Audit Showcase Bar (Matching University.tsx) */}
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                {t.createdBy?.name || "System"}
                                            </span>
                                            {t.createdAt && (
                                                <span className="text-slate-500 font-mono text-[10px]">
                                                    · {formatDate(t.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {t.updatedBy?.name && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="text-slate-500">Updated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {t.updatedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => void openDialog("VIEW", t)}
                                            disabled={!canRead}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-40"
                                        >
                                            <Eye size={13} /> Details
                                        </button>
                                        {canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => void openDialog("PROFILE", t)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>
                                        )}
                                        {canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => void openDialog("ENABLE", t)}
                                                title={profile.enabled ? "Disable" : "Enable"}
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                                                    profile.enabled
                                                        ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                                                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                                }`}
                                            >
                                                {profile.enabled ? (
                                                    <ShieldAlert size={14} />
                                                ) : (
                                                    <ShieldCheck size={14} />
                                                )}
                                            </button>
                                        )}
                                        {canUpdate && (
                                            <button
                                                type="button"
                                                onClick={() => void openDialog("RESET_PASSWORD", t)}
                                                title="Reset Password"
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300"
                                            >
                                                <KeyRound size={14} />
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-xs text-slate-400">
                            No faculty match your criteria.
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {sortedTeachers.length === 0
                            ? "Showing 0 faculty"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                                  currentPage * PAGE_SIZE,
                                  sortedTeachers.length
                              )} of ${sortedTeachers.length} teacher${
                                  sortedTeachers.length === 1 ? "" : "s"
                              }`}
                    </p>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Teacher pagination"
                            className="flex items-center justify-center gap-1"
                        >
                            <button
                                type="button"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                aria-label="First page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <span className="px-3 text-xs font-semibold text-slate-300">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                aria-label="Next page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                aria-label="Last page"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </nav>
                    )}
                </footer>
            </GlassCard>

            {/* Modals Container */}
            <AnimatePresence>
                {/* 1. VIEW FACULTY OVERVIEW MODAL */}
                {dialog?.mode === "VIEW" && dialog.teacher && (
                    <ModalShell
                        title="Faculty Overview"
                        subtitle={`Teacher #${dialog.teacher.id} · ${getTeacherFullName(dialog.teacher)}`}
                        onClose={closeDialog}
                        wide
                        icon={CircleUserRound}
                        iconTone="cyan"
                    >
                        <div className="space-y-5">
                            {/* Identity Header Card */}
                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <AvatarBadge
                                        name={getTeacherFullName(dialog.teacher)}
                                        photoUrl={photoUrl}
                                        size="xl"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-bold text-white sm:text-xl truncate">
                                                {getTeacherFullName(dialog.teacher)}
                                            </h3>
                                            <StatusBadge active={dialog.teacher.basicDetailRequest.enabled} />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-300 truncate">
                                            {dialog.teacher.basicDetailRequest.email || "No email assigned"}
                                        </p>

                                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2 text-center">
                                                <span className="text-[10px] text-slate-400 block">Institution</span>
                                                <span className="font-semibold text-white truncate text-xs block">
                                                    {dialog.teacher.university?.name || "Not assigned"}
                                                </span>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2 text-center">
                                                <span className="text-[10px] text-slate-400 block">Department</span>
                                                <span className="font-semibold text-white truncate text-xs block">
                                                    {dialog.teacher.department?.name || "Not assigned"}
                                                </span>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2 text-center">
                                                <span className="text-[10px] text-slate-400 block">Username</span>
                                                <span className="font-mono text-cyan-300 truncate text-xs block">
                                                    {dialog.teacher.basicDetailRequest.username
                                                        ? `@${dialog.teacher.basicDetailRequest.username}`
                                                        : "—"}
                                                </span>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2 text-center">
                                                <span className="text-[10px] text-slate-400 block">Teacher ID</span>
                                                <span className="font-mono font-semibold text-white text-xs block">
                                                    #{dialog.teacher.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* View Tab Navigation */}
                            <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setViewTab("overview")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 ${
                                        viewTab === "overview"
                                            ? "border-cyan-400 text-cyan-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    Personal &amp; Contact Records
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab("academic")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 ${
                                        viewTab === "academic"
                                            ? "border-cyan-400 text-cyan-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    Teaching Subjects &amp; Placement
                                </button>
                            </div>

                            {/* Tab 1: Personal & Contact */}
                            {viewTab === "overview" && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <CircleUserRound size={13} className="text-cyan-400" />
                                            Personal Details
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg bg-slate-900/60 p-2 flex justify-between">
                                                <span className="text-slate-400">Phone:</span>
                                                <span className="font-medium text-white">
                                                    {dialog.teacher.basicDetailRequest.phone || "Not provided"}
                                                </span>
                                            </div>
                                            <div className="rounded-lg bg-slate-900/60 p-2 flex justify-between">
                                                <span className="text-slate-400">Date of Birth:</span>
                                                <span className="font-medium text-white">
                                                    {formatDate(dialog.teacher.basicDetailRequest.dob)}
                                                </span>
                                            </div>
                                            <div className="rounded-lg bg-slate-900/60 p-2 flex justify-between">
                                                <span className="text-slate-400">Father's Name:</span>
                                                <span className="font-medium text-white">
                                                    {dialog.teacher.basicDetailRequest.fatherName || "Not provided"}
                                                </span>
                                            </div>
                                            <div className="rounded-lg bg-slate-900/60 p-2 flex justify-between">
                                                <span className="text-slate-400">Mother's Name:</span>
                                                <span className="font-medium text-white">
                                                    {dialog.teacher.basicDetailRequest.motherName || "Not provided"}
                                                </span>
                                            </div>
                                            <div className="rounded-lg bg-slate-900/60 p-2 flex justify-between sm:col-span-2">
                                                <span className="text-slate-400">Emergency / Guardian Mobile:</span>
                                                <span className="font-medium text-white">
                                                    {dialog.teacher.basicDetailRequest.guardianMobileNumber || "Not provided"}
                                                </span>
                                            </div>
                                            <div className="rounded-lg bg-slate-900/60 p-2 flex flex-col gap-0.5 sm:col-span-2">
                                                <span className="text-slate-400 text-[10px]">Residential Address:</span>
                                                <span className="font-medium text-white">
                                                    {dialog.teacher.basicDetailRequest.address || "Not provided"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Academic Subjects */}
                            {viewTab === "academic" && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                <BookOpen size={13} className="text-cyan-400" />
                                                Assigned Teaching Subjects
                                            </p>
                                            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                                                {dialog.teacher.subjects?.length ?? 0}
                                            </span>
                                        </div>

                                        {(dialog.teacher.subjects ?? []).length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {dialog.teacher.subjects!.map((s) => (
                                                    <div
                                                        key={s.id}
                                                        className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2.5 flex items-center justify-between text-xs"
                                                    >
                                                        <span className="font-semibold text-cyan-200">
                                                            {s.name}
                                                        </span>
                                                        {s.code && (
                                                            <span className="font-mono text-[10px] text-cyan-300">
                                                                ({s.code})
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic py-2">
                                                No specific teaching subjects currently mapped to this faculty profile.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Audit & Governance Showcase (EXACT University.tsx Match) */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                        <ShieldCheck size={13} className="text-emerald-400" />
                                        Audit Trail &amp; Governance
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                                        System Records
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {/* Created By Card */}
                                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <UserCheck size={11} /> Created By
                                            </span>
                                            {dialog.teacher.createdAt && (
                                                <span className="text-slate-400 font-mono text-[10px]">
                                                    {formatDate(dialog.teacher.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                {getInitials(dialog.teacher.createdBy?.name || "System")}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                    {dialog.teacher.createdBy?.name || "System Administrator"}
                                                </p>
                                                {(dialog.teacher.createdBy?.code || dialog.teacher.createdBy?.id) && (
                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                        {dialog.teacher.createdBy.code
                                                            ? `Code: ${dialog.teacher.createdBy.code}`
                                                            : `ID: #${dialog.teacher.createdBy.id}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {dialog.teacher.createdAt && (
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    Timestamp: {formatDateTime(dialog.teacher.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Updated By Card */}
                                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <RotateCcw size={11} /> Last Modified By
                                            </span>
                                            {(dialog.teacher.updatedAt || dialog.teacher.createdAt) && (
                                                <span className="text-slate-400 font-mono text-[10px]">
                                                    {formatDate(dialog.teacher.updatedAt || dialog.teacher.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                {getInitials(
                                                    dialog.teacher.updatedBy?.name ||
                                                        dialog.teacher.createdBy?.name ||
                                                        "System"
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                    {dialog.teacher.updatedBy?.name ||
                                                        dialog.teacher.createdBy?.name ||
                                                        "System Administrator"}
                                                </p>
                                                {(dialog.teacher.updatedBy?.code || dialog.teacher.updatedBy?.id) && (
                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                        {dialog.teacher.updatedBy.code
                                                            ? `Code: ${dialog.teacher.updatedBy.code}`
                                                            : `ID: #${dialog.teacher.updatedBy.id}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {(dialog.teacher.updatedAt || dialog.teacher.createdAt) && (
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    Timestamp:{" "}
                                                    {formatDateTime(
                                                        dialog.teacher.updatedAt || dialog.teacher.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                                >
                                    Close
                                </button>
                                {hasTeacherPermission(dialog.teacher, "UPDATE") && (
                                    <button
                                        type="button"
                                        onClick={() => void openDialog("PROFILE", dialog.teacher)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
                                    >
                                        <Pencil size={14} /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </ModalShell>
                )}

                {/* 2. CREATE TEACHER MODAL */}
                {dialog?.mode === "CREATE" && (
                    <ModalShell
                        title="Register New Teacher"
                        subtitle="Fill out basic identity, contact details, and assign to an institution."
                        onClose={closeDialog}
                        wide
                        icon={UserPlus}
                        iconTone="cyan"
                        busy={busy}
                    >
                        <form onSubmit={handleCreate} className="space-y-4">
                            {/* Photo Upload */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                <PassportPhotoUpload
                                    file={selectedFile}
                                    studentName={
                                        `${profileForm.firstName} ${profileForm.lastName}`.trim() ||
                                        "New Teacher"
                                    }
                                    onPhotoChange={(newFile) => setSelectedFile(newFile)}
                                    label="Teacher Passport Photo"
                                    hint="Upload and crop image. Standard 3.5 × 4.5 cm proportion."
                                />
                            </div>

                            {/* Institution Assignment */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Building2 size={13} className="text-cyan-400" />
                                    Institution Assignment <span className="text-rose-400">*</span>
                                </p>
                                <div className="relative">
                                    <select
                                        required
                                        disabled={busy}
                                        value={selectedUniversityId}
                                        onChange={(e) =>
                                            setSelectedUniversityId(
                                                e.target.value ? Number(e.target.value) : ""
                                            )
                                        }
                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                    >
                                        <option value="" className="bg-slate-900 text-white">
                                            Select University / Institution
                                        </option>
                                        {universities.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                                className="bg-slate-900 text-white"
                                            >
                                                {item.name} {item.code ? `(${item.code})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <SelectChevron />
                                </div>
                            </div>

                            {/* Personal & Identity Details */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <CircleUserRound size={13} className="text-cyan-400" />
                                    Personal &amp; Identity Details
                                </p>
                                <ProfileFields value={profileForm} onChange={setProfileForm} disabled={busy} />
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition disabled:opacity-50"
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={14} className="animate-spin" />
                                            <span>Registering...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={14} />
                                            <span>Register Teacher</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {/* 3. EDIT PROFILE MODAL */}
                {dialog?.mode === "PROFILE" && dialog.teacher && (
                    <ModalShell
                        title="Edit Teacher Profile"
                        subtitle={`${getTeacherFullName(dialog.teacher)} · ID #${dialog.teacher.id}`}
                        onClose={closeDialog}
                        wide
                        icon={Pencil}
                        iconTone="cyan"
                        busy={busy}
                    >
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            {/* Photo Upload */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                <PassportPhotoUpload
                                    file={selectedFile}
                                    initialPhotoUrl={photoUrl}
                                    loadingPhoto={photoLoading}
                                    studentName={getTeacherFullName(dialog.teacher)}
                                    onPhotoChange={(newFile) => setSelectedFile(newFile)}
                                    label="Update Passport Photo"
                                    hint="Upload and crop image to replace current picture, or keep existing."
                                />
                            </div>

                            {/* Personal & Identity Details */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <CircleUserRound size={13} className="text-cyan-400" />
                                    Personal &amp; Identity Details
                                </p>
                                <ProfileFields value={profileForm} onChange={setProfileForm} disabled={busy} />
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition disabled:opacity-50"
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={14} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Pencil size={14} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {/* 4. TOGGLE ACCOUNT STATUS (ENABLE/DISABLE) CONFIRMATION MODAL */}
                {dialog?.mode === "ENABLE" && dialog.teacher && (
                    <ModalShell
                        title={
                            dialog.teacher.basicDetailRequest.enabled
                                ? "Disable Faculty Account"
                                : "Enable Faculty Account"
                        }
                        subtitle={`${getTeacherFullName(dialog.teacher)} · ID #${dialog.teacher.id}`}
                        onClose={closeDialog}
                        icon={
                            dialog.teacher.basicDetailRequest.enabled
                                ? ShieldAlert
                                : ShieldCheck
                        }
                        iconTone={
                            dialog.teacher.basicDetailRequest.enabled ? "rose" : "emerald"
                        }
                        busy={busy}
                    >
                        <div className="space-y-4 text-xs">
                            <p className="text-slate-300 leading-relaxed text-sm">
                                Are you sure you want to{" "}
                                <span className="font-bold text-white">
                                    {dialog.teacher.basicDetailRequest.enabled
                                        ? "disable portal access"
                                        : "enable portal access"}
                                </span>{" "}
                                for{" "}
                                <span className="font-bold text-white">
                                    "{getTeacherFullName(dialog.teacher)}"
                                </span>
                                ?
                            </p>

                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-1.5 text-slate-300">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Username:</span>
                                    <span className="font-mono text-cyan-300">
                                        @{dialog.teacher.basicDetailRequest.username || "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Current Status:</span>
                                    <StatusBadge active={dialog.teacher.basicDetailRequest.enabled} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Institution:</span>
                                    <span className="font-medium text-white">
                                        {dialog.teacher.university?.name || "—"}
                                    </span>
                                </div>
                            </div>

                            <p className="text-slate-400 leading-relaxed">
                                {dialog.teacher.basicDetailRequest.enabled
                                    ? "Disabling will immediately revoke this faculty member's portal login access."
                                    : "Enabling will allow this faculty member to sign in to the ERP portal using their active credentials."}
                            </p>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleToggleEnable}
                                    disabled={busy}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                                        dialog.teacher.basicDetailRequest.enabled
                                            ? "border border-rose-500/30 bg-rose-500 shadow-rose-500/20 hover:bg-rose-600"
                                            : "border border-emerald-500/30 bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600"
                                    }`}
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={14} className="animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            {dialog.teacher.basicDetailRequest.enabled ? (
                                                <ShieldAlert size={14} />
                                            ) : (
                                                <ShieldCheck size={14} />
                                            )}
                                            <span>
                                                {dialog.teacher.basicDetailRequest.enabled
                                                    ? "Disable Account"
                                                    : "Enable Account"}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {/* 5. RESET PASSWORD CONFIRMATION MODAL */}
                {dialog?.mode === "RESET_PASSWORD" && dialog.teacher && (
                    <ModalShell
                        title="Reset Faculty Password"
                        subtitle={`${getTeacherFullName(dialog.teacher)} · ID #${dialog.teacher.id}`}
                        onClose={closeDialog}
                        icon={KeyRound}
                        iconTone="purple"
                        busy={busy}
                    >
                        <div className="space-y-4 text-xs">
                            <p className="text-slate-300 leading-relaxed text-sm">
                                Are you sure you want to trigger a password reset for{" "}
                                <span className="font-bold text-white">
                                    "{getTeacherFullName(dialog.teacher)}"
                                </span>
                                ?
                            </p>

                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-1.5 text-slate-300">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Username:</span>
                                    <span className="font-mono text-cyan-300">
                                        @{dialog.teacher.basicDetailRequest.username || "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Email:</span>
                                    <span className="font-medium text-white">
                                        {dialog.teacher.basicDetailRequest.email || "Not registered"}
                                    </span>
                                </div>
                            </div>

                            <p className="text-slate-400 leading-relaxed">
                                The backend system will reset the faculty member's portal credentials to the default system password format.
                            </p>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={14} className="animate-spin" />
                                            <span>Resetting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound size={14} />
                                            <span>Reset Password</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
