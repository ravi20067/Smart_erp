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
    AlertTriangle,
    ArrowDownUp,
    Building2,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CircleUserRound,
    Clock,
    DoorOpen,
    Eye,
    KeyRound,
    LoaderCircle,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserPlus,
    UserRoundCheck,
    UserRoundX,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";

import {
    changeSecurityGuardEnabled,
    createSecurityGuard,
    deleteSecurityGuard,
    extractSecurityGuardErrorMessage,
    formatAuditActor,
    formatDate,
    formatDateTime,
    getInitials,
    getSecurityGuardPhoto,
    getSecurityGuards,
    getSecurityGuardUniversityFilter,
    hasSecurityGuardPermission,
    resetSecurityGuardPassword,
    uniqueCommonDTOs,
    updateSecurityGuardDetails,
    updateSecurityGuardProfile,
    type CommonDTO,
    type GuardShift,
    type SecurityGuardRequest,
    type SecurityGuardResponse,
    type UserProfileRequest,
} from "@/services/userMangement/securityGuardService";
import { PassportPhotoUpload } from "@/components/PassportPhotoUpload";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 8;

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type ShiftFilter = "ALL" | "DAY" | "NIGHT" | "EVENING" | "ROTATIONAL";
type SortMode = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "BADGE_ASC";
type DialogMode = "CREATE" | "VIEW" | "PROFILE" | "DETAILS" | "RESET_PASSWORD" | "ENABLE" | "DELETE";

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

const EMPTY_GUARD_REQUEST: SecurityGuardRequest = {
    badgeNumber: "",
    assignedGate: "Main Gate A",
    shift: "DAY",
    emergencyContact: "",
    joiningDate: new Date().toISOString().split("T")[0],
    status: true,
    basicDetailRequest: EMPTY_PROFILE,
};

/* -------------------------------------------------------------------------- */
/* Helper UI Components                                                       */
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
            className={`rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}
        >
            {children}
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    hint,
    tone = "cyan",
}: {
    icon: typeof Users;
    label: string;
    value: number | string;
    hint?: string;
    tone?: "cyan" | "emerald" | "violet" | "amber";
}) {
    const tones = {
        cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
        emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
        violet: "border-violet-400/20 bg-violet-500/10 text-violet-300",
        amber: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    };

    return (
        <GlassCard className="flex items-center gap-3.5">
            <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}
            >
                <Icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {label}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {value}
                </p>
                {hint && <p className="text-[11px] text-slate-400 truncate">{hint}</p>}
            </div>
        </GlassCard>
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

function FieldError({ error }: { error?: string }) {
    if (!error) return null;
    return (
        <p className="mt-1 text-[11px] font-medium text-rose-400 flex items-center gap-1">
            <AlertTriangle size={11} className="shrink-0" />
            <span>{error}</span>
        </p>
    );
}

function ModalShell({
    title,
    subtitle,
    onClose,
    children,
    wide = false,
    icon: Icon = Shield,
    iconTone = "cyan",
    busy = false,
}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
    icon?: LucideIcon;
    iconTone?: "cyan" | "emerald" | "amber" | "rose" | "violet";
    busy?: boolean;
}) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, busy]);

    const tones = {
        cyan: "border-cyan-400/30 bg-cyan-500/15 text-cyan-300",
        emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
        amber: "border-amber-400/30 bg-amber-500/15 text-amber-300",
        rose: "border-rose-400/30 bg-rose-500/15 text-rose-300",
        violet: "border-violet-400/30 bg-violet-500/15 text-violet-300",
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (!busy) onClose();
                }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.section
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.18 }}
                className={`relative z-10 my-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/70 ${
                    wide ? "max-w-4xl" : "max-w-xl"
                }`}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tones[iconTone]}`}
                        >
                            <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-bold tracking-tight text-white truncate sm:text-lg">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="min-h-0 flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
                    {children}
                </div>
            </motion.section>
        </div>
    );
}

function ProfileFields({
    value,
    onChange,
    disabled = false,
    errors = {},
    showAdditional = true,
}: {
    value: ProfileForm;
    onChange: (updater: (prev: ProfileForm) => ProfileForm) => void;
    disabled?: boolean;
    errors?: Record<string, string>;
    showAdditional?: boolean;
}) {
    return (
        <div className="space-y-3 text-xs">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        placeholder="e.g. Rajesh"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                    />
                    <FieldError error={errors.firstName} />
                </div>

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
                        placeholder="e.g. Sharma"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                    />
                    <FieldError error={errors.lastName} />
                </div>
            </div>

            {/* Date of Birth & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="font-semibold text-slate-300">
                        Date of Birth <span className="text-rose-400">*</span>
                    </label>
                    <input
                        type="date"
                        required
                        disabled={disabled}
                        value={value.dob}
                        onChange={(e) =>
                            onChange((p) => ({ ...p, dob: e.target.value }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                    />
                    <FieldError error={errors.dob} />
                </div>

                <div className="space-y-1">
                    <label className="font-semibold text-slate-300">
                        Primary Phone <span className="text-rose-400">*</span>
                    </label>
                    <input
                        type="tel"
                        required
                        disabled={disabled}
                        value={value.phone}
                        onChange={(e) =>
                            onChange((p) => ({ ...p, phone: e.target.value }))
                        }
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                    />
                    <FieldError error={errors.phone} />
                </div>
            </div>

            {/* Email & Residential Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Email Address</label>
                    <input
                        type="email"
                        disabled={disabled}
                        value={value.email}
                        onChange={(e) =>
                            onChange((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="guard@institution.edu"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                    />
                </div>

                <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Residential Address</label>
                    <input
                        type="text"
                        disabled={disabled}
                        value={value.address}
                        onChange={(e) =>
                            onChange((p) => ({ ...p, address: e.target.value }))
                        }
                        placeholder="Street, City, State, PIN"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                    />
                </div>
            </div>

            {showAdditional && (
                <>
                    {/* Father & Mother Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </div>

                    {/* Guardian / Alternate Mobile */}
                    <div className="space-y-1">
                        <label className="font-semibold text-slate-300">Alternate / Guardian Mobile</label>
                        <input
                            type="tel"
                            disabled={disabled}
                            value={value.guardianMobileNumber}
                            onChange={(e) =>
                                onChange((p) => ({ ...p, guardianMobileNumber: e.target.value }))
                            }
                            placeholder="Optional alternate contact"
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 disabled:opacity-50"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function ShiftBadge({ shift }: { shift?: string }) {
    const s = String(shift ?? "DAY").toUpperCase();
    if (s === "NIGHT") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                <Clock size={11} /> Night Shift
            </span>
        );
    }
    if (s === "EVENING") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                <Clock size={11} /> Evening Shift
            </span>
        );
    }
    if (s === "ROTATIONAL") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                <RotateCcw size={11} /> Rotational
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
            <Clock size={11} /> Day Shift
        </span>
    );
}

function GuardAvatar({
    guard,
    size = "md",
}: {
    guard: SecurityGuardResponse;
    size?: "sm" | "md" | "lg";
}) {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [loadingPhoto, setLoadingPhoto] = useState(false);

    useEffect(() => {
        let active = true;
        let blobUrl: string | null = null;

        if (guard.basicDetailRequest.userId) {
            setLoadingPhoto(true);
            getSecurityGuardPhoto(guard.basicDetailRequest.userId)
                .then((blob) => {
                    if (active && blob && blob.size > 0) {
                        blobUrl = URL.createObjectURL(blob);
                        setPhotoUrl(blobUrl);
                    }
                })
                .catch(() => {
                    // silently fallback to initials
                })
                .finally(() => {
                    if (active) setLoadingPhoto(false);
                });
        }

        return () => {
            active = false;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [guard.basicDetailRequest.userId]);

    const sizeClasses = {
        sm: "h-8 w-8 text-xs rounded-lg",
        md: "h-11 w-11 text-xs sm:text-sm rounded-xl",
        lg: "h-16 w-16 text-base sm:text-lg rounded-2xl",
    };

    const fullName = `${guard.basicDetailRequest.firstName} ${guard.basicDetailRequest.lastName}`.trim();

    if (loadingPhoto) {
        return (
            <div
                className={`flex shrink-0 items-center justify-center border border-white/10 bg-slate-800 text-slate-400 ${sizeClasses[size]}`}
            >
                <LoaderCircle size={14} className="animate-spin text-cyan-400" />
            </div>
        );
    }

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={fullName || "Guard"}
                className={`shrink-0 object-cover border border-white/10 shadow-sm ${sizeClasses[size]}`}
            />
        );
    }

    return (
        <div
            className={`flex shrink-0 items-center justify-center border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 font-bold text-cyan-200 shadow-sm ${sizeClasses[size]}`}
        >
            {getInitials(fullName)}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Security Guard Management Component                                   */
/* -------------------------------------------------------------------------- */

export default function SecurityGuardPage() {
    const prefersReducedMotion = useReducedMotion();

    // Data state
    const [guards, setGuards] = useState<SecurityGuardResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [busy, setBusy] = useState(false);

    // Filters & Pagination
    const [search, setSearch] = useState("");
    const [universityFilter, setUniversityFilter] = useState<number | "ALL">("ALL");
    const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sortBy, setSortBy] = useState<SortMode>("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter Options
    const [universities, setUniversities] = useState<CommonDTO[]>([]);

    // Modal dialogs
    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        guard?: SecurityGuardResponse;
    } | null>(null);

    // Modal forms state
    const [selectedUniversityId, setSelectedUniversityId] = useState<number | "">("");
    const [createForm, setCreateForm] = useState<SecurityGuardRequest>(EMPTY_GUARD_REQUEST);
    const [profileForm, setProfileForm] = useState<ProfileForm>(EMPTY_PROFILE);
    const [detailsForm, setDetailsForm] = useState<{
        badgeNumber: string;
        assignedGate: string;
        shift: GuardShift | string;
        emergencyContact: string;
    }>({
        badgeNumber: "",
        assignedGate: "",
        shift: "DAY",
        emergencyContact: "",
    });
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [viewTab, setViewTab] = useState<"deployment" | "audit">("deployment");

    /* ---------------------------------------------------------------------- */
    /* Load Data                                                              */
    /* ---------------------------------------------------------------------- */

    const loadData = useCallback(async () => {
        setLoading(true);
        setPageError("");
        try {
            const [guardsData, uniData] = await Promise.all([
                getSecurityGuards(),
                getSecurityGuardUniversityFilter().catch(() => []),
            ]);
            setGuards(guardsData);
            setUniversities(uniqueCommonDTOs(uniData));
        } catch (err) {
            setPageError(
                extractSecurityGuardErrorMessage(
                    err,
                    "Failed to load security guard personnel records."
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    /* ---------------------------------------------------------------------- */
    /* Filter & Sort Computation                                              */
    /* ---------------------------------------------------------------------- */

    const filteredGuards = useMemo(() => {
        const query = search.trim().toLowerCase();

        return guards
            .filter((g) => {
                const name = `${g.basicDetailRequest.firstName} ${g.basicDetailRequest.lastName}`.toLowerCase();
                const badge = g.badgeNumber.toLowerCase();
                const username = g.basicDetailRequest.username.toLowerCase();
                const phone = g.basicDetailRequest.phone.toLowerCase();
                const email = g.basicDetailRequest.email.toLowerCase();
                const gate = g.assignedGate.toLowerCase();

                const matchesQuery =
                    !query ||
                    name.includes(query) ||
                    badge.includes(query) ||
                    username.includes(query) ||
                    phone.includes(query) ||
                    email.includes(query) ||
                    gate.includes(query);

                const matchesUni =
                    universityFilter === "ALL" ||
                    (g.university && g.university.id === universityFilter);

                const matchesShift =
                    shiftFilter === "ALL" || g.shift === shiftFilter;

                const matchesStatus =
                    statusFilter === "ALL" ||
                    (statusFilter === "ACTIVE" && g.basicDetailRequest.enabled) ||
                    (statusFilter === "INACTIVE" && !g.basicDetailRequest.enabled);

                return matchesQuery && matchesUni && matchesShift && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === "NAME_ASC") {
                    const nameA = `${a.basicDetailRequest.firstName} ${a.basicDetailRequest.lastName}`;
                    const nameB = `${b.basicDetailRequest.firstName} ${b.basicDetailRequest.lastName}`;
                    return nameA.localeCompare(nameB);
                }
                if (sortBy === "NAME_DESC") {
                    const nameA = `${a.basicDetailRequest.firstName} ${a.basicDetailRequest.lastName}`;
                    const nameB = `${b.basicDetailRequest.firstName} ${b.basicDetailRequest.lastName}`;
                    return nameB.localeCompare(nameA);
                }
                if (sortBy === "BADGE_ASC") {
                    return a.badgeNumber.localeCompare(b.badgeNumber);
                }
                return b.id - a.id;
            });
    }, [guards, search, universityFilter, shiftFilter, statusFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredGuards.length / PAGE_SIZE));
    const paginatedGuards = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredGuards.slice(start, start + PAGE_SIZE);
    }, [filteredGuards, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, universityFilter, shiftFilter, statusFilter, sortBy]);

    const hasActiveFilters =
        Boolean(search) ||
        universityFilter !== "ALL" ||
        shiftFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        sortBy !== "NEWEST";

    const resetFilters = () => {
        setSearch("");
        setUniversityFilter("ALL");
        setShiftFilter("ALL");
        setStatusFilter("ALL");
        setSortBy("NEWEST");
    };

    /* ---------------------------------------------------------------------- */
    /* Handlers & Actions                                                     */
    /* ---------------------------------------------------------------------- */

    const openCreateModal = () => {
        setSelectedUniversityId(universities[0]?.id || "");
        setCreateForm({
            ...EMPTY_GUARD_REQUEST,
            joiningDate: new Date().toISOString().split("T")[0],
            basicDetailRequest: { ...EMPTY_PROFILE },
        });
        setUploadedFile(null);
        setFormErrors({});
        setDialog({ mode: "CREATE" });
    };

    const openViewModal = (guard: SecurityGuardResponse) => {
        setViewTab("deployment");
        setDialog({ mode: "VIEW", guard });
    };

    const openProfileModal = (guard: SecurityGuardResponse) => {
        setProfileForm({
            firstName: guard.basicDetailRequest.firstName,
            lastName: guard.basicDetailRequest.lastName,
            dob: guard.basicDetailRequest.dob,
            email: guard.basicDetailRequest.email,
            phone: guard.basicDetailRequest.phone,
            fatherName: guard.basicDetailRequest.fatherName,
            motherName: guard.basicDetailRequest.motherName,
            guardianMobileNumber: guard.basicDetailRequest.guardianMobileNumber,
            address: guard.basicDetailRequest.address,
        });
        setUploadedFile(null);
        setFormErrors({});
        setDialog({ mode: "PROFILE", guard });
    };

    const openDetailsModal = (guard: SecurityGuardResponse) => {
        setDetailsForm({
            badgeNumber: guard.badgeNumber,
            assignedGate: guard.assignedGate,
            shift: guard.shift,
            emergencyContact: guard.emergencyContact || "",
        });
        setFormErrors({});
        setDialog({ mode: "DETAILS", guard });
    };

    // 1. Submit Create Guard
    const handleCreateSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!selectedUniversityId) {
            errors.universityId = "Please select an institution.";
        }
        if (!createForm.basicDetailRequest.firstName.trim()) {
            errors.firstName = "First name is required.";
        }
        if (!createForm.basicDetailRequest.lastName.trim()) {
            errors.lastName = "Last name is required.";
        }
        if (!createForm.basicDetailRequest.dob) {
            errors.dob = "Date of birth is required.";
        }
        if (!createForm.basicDetailRequest.phone.trim()) {
            errors.phone = "Phone number is required.";
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setBusy(true);
        try {
            const created = await createSecurityGuard(
                Number(selectedUniversityId),
                createForm,
                uploadedFile
            );
            toast.success(
                `Security guard "${created.basicDetailRequest.firstName} ${created.basicDetailRequest.lastName}" deployed successfully!`
            );
            setDialog(null);
            await loadData();
        } catch (err) {
            toast.error(
                extractSecurityGuardErrorMessage(err, "Failed to deploy security guard.")
            );
        } finally {
            setBusy(false);
        }
    };

    // 2. Submit Update Profile
    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!dialog?.guard) return;

        const errors: Record<string, string> = {};
        if (!profileForm.firstName.trim()) errors.firstName = "First name is required.";
        if (!profileForm.lastName.trim()) errors.lastName = "Last name is required.";

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setBusy(true);
        try {
            await updateSecurityGuardProfile(dialog.guard.id, profileForm, uploadedFile);
            toast.success("Security guard profile updated successfully!");
            setDialog(null);
            await loadData();
        } catch (err) {
            toast.error(
                extractSecurityGuardErrorMessage(err, "Failed to update guard profile.")
            );
        } finally {
            setBusy(false);
        }
    };

    // 3. Submit Update Details (Gate / Shift / Badge)
    const handleDetailsSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!dialog?.guard) return;

        setBusy(true);
        try {
            await updateSecurityGuardDetails(dialog.guard.id, {
                badgeNumber: detailsForm.badgeNumber.trim() || undefined,
                assignedGate: detailsForm.assignedGate.trim() || "Main Gate",
                shift: detailsForm.shift,
                emergencyContact: detailsForm.emergencyContact.trim() || undefined,
                basicDetailRequest: EMPTY_PROFILE,
            });
            toast.success("Security gate and shift assignment updated!");
            setDialog(null);
            await loadData();
        } catch (err) {
            toast.error(
                extractSecurityGuardErrorMessage(err, "Failed to update gate details.")
            );
        } finally {
            setBusy(false);
        }
    };

    // 4. Toggle Account Status
    const handleToggleEnable = async () => {
        if (!dialog?.guard) return;
        setBusy(true);
        const nextState = !dialog.guard.basicDetailRequest.enabled;
        try {
            await changeSecurityGuardEnabled(dialog.guard.id, nextState);
            toast.success(
                `Security guard account ${nextState ? "activated" : "deactivated"} successfully.`
            );
            setDialog(null);
            await loadData();
        } catch (err) {
            toast.error(
                extractSecurityGuardErrorMessage(
                    err,
                    "Failed to change account status."
                )
            );
        } finally {
            setBusy(false);
        }
    };

    // 5. Reset Password
    const handleResetPassword = async () => {
        if (!dialog?.guard) return;
        setBusy(true);
        try {
            await resetSecurityGuardPassword(dialog.guard.id);
            toast.success(
                `Password reset successfully! Default password is guard's Date of Birth (YYYY-MM-DD).`
            );
            setDialog(null);
        } catch (err) {
            toast.error(
                extractSecurityGuardErrorMessage(err, "Failed to reset password.")
            );
        } finally {
            setBusy(false);
        }
    };

    // 6. Delete Guard
    const handleDeleteGuard = async () => {
        if (!dialog?.guard) return;
        setBusy(true);
        try {
            await deleteSecurityGuard(dialog.guard.id);
            toast.success("Security guard personnel record deleted successfully.");
            setDialog(null);
            await loadData();
        } catch (err) {
            toast.error(
                extractSecurityGuardErrorMessage(err, "Failed to delete guard record.")
            );
        } finally {
            setBusy(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Metrics Calculation                                                    */
    /* ---------------------------------------------------------------------- */

    const activeCount = guards.filter((g) => g.basicDetailRequest.enabled).length;
    const nightShiftCount = guards.filter((g) => g.shift === "NIGHT").length;
    const gateCount = new Set(guards.map((g) => g.assignedGate)).size;

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                            <Shield size={20} />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                            Security Guard Personnel
                        </h1>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                            {guards.length} Guards
                        </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400">
                        Manage campus security personnel, gate deployments, shift schedules, and security credentials.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => void loadData()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition disabled:opacity-50"
                        title="Reload records"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:brightness-110 transition active:scale-[0.98]"
                    >
                        <UserPlus size={15} />
                        <span>Deploy Guard</span>
                    </button>
                </div>
            </div>

            {/* KPI Metrics Showcase */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    icon={Users}
                    label="Total Guards"
                    value={guards.length}
                    hint="Deployed personnel"
                    tone="cyan"
                />
                <StatCard
                    icon={UserCheck}
                    label="Active Status"
                    value={activeCount}
                    hint={`${guards.length - activeCount} inactive / suspended`}
                    tone="emerald"
                />
                <StatCard
                    icon={DoorOpen}
                    label="Gate Posts"
                    value={gateCount}
                    hint="Secured entry points"
                    tone="violet"
                />
                <StatCard
                    icon={Clock}
                    label="Night Shift"
                    value={nightShiftCount}
                    hint="Round-the-clock coverage"
                    tone="amber"
                />
            </div>

            {/* Filter Toolbar */}
            <GlassCard>
                <div className="space-y-3">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Search &amp; Filter Personnel
                        </span>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition"
                            >
                                <RotateCcw size={12} />
                                <span>Reset All Filters</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Search input */}
                        <div className="relative lg:col-span-2">
                            <Search
                                size={14}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, badge, gate, phone..."
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-9 pr-8 text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
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

                        {/* Shift filter */}
                        <div className="relative">
                            <select
                                value={shiftFilter}
                                onChange={(e) => setShiftFilter(e.target.value as ShiftFilter)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Shifts</option>
                                <option value="DAY" className="bg-slate-900 text-white">Day Shift</option>
                                <option value="NIGHT" className="bg-slate-900 text-white">Night Shift</option>
                                <option value="EVENING" className="bg-slate-900 text-white">Evening Shift</option>
                                <option value="ROTATIONAL" className="bg-slate-900 text-white">Rotational</option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Status filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
                                <option value="ACTIVE" className="bg-slate-900 text-white">Active Only</option>
                                <option value="INACTIVE" className="bg-slate-900 text-white">Inactive Only</option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Sort filter */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortMode)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="NEWEST" className="bg-slate-900 text-white">Newest First</option>
                                <option value="NAME_ASC" className="bg-slate-900 text-white">Name (A-Z)</option>
                                <option value="NAME_DESC" className="bg-slate-900 text-white">Name (Z-A)</option>
                                <option value="BADGE_ASC" className="bg-slate-900 text-white">Badge #</option>
                            </select>
                            <ArrowDownUp
                                size={13}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Guards Table & Mobile Cards */}
            <GlassCard>
                {/* 1. Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th scope="col" className="px-5 py-4 w-12 text-center">#</th>
                                <th scope="col" className="px-4 py-4 min-w-[240px]">Guard &amp; Badge</th>
                                <th scope="col" className="px-4 py-4 min-w-[160px]">Institution</th>
                                <th scope="col" className="px-4 py-4 min-w-[170px]">Gate &amp; Shift</th>
                                <th scope="col" className="px-4 py-4 min-w-[120px]">Account</th>
                                <th scope="col" className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="inline-flex flex-col items-center justify-center gap-3">
                                            <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                                            <p className="font-semibold text-slate-200">
                                                Loading security personnel...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageError && guards.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load security personnel
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                                            {pageError}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadData()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : paginatedGuards.length > 0 ? (
                                paginatedGuards.map((guard, index) => {
                                    const fullName = `${guard.basicDetailRequest.firstName} ${guard.basicDetailRequest.lastName}`.trim();
                                    return (
                                        <motion.tr
                                            key={guard.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.03]"
                                        >
                                            {/* Index */}
                                            <td className="px-5 py-4 text-slate-500 text-xs text-center font-mono">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>

                                            {/* Guard Profile & Auditor Pill (Matching University.tsx & Teacher.tsx) */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <GuardAvatar guard={guard} size="md" />
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {fullName}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-cyan-400 font-bold">
                                                                {guard.badgeNumber}
                                                            </span>
                                                            <span className="text-slate-600">·</span>
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                @{guard.basicDetailRequest.username}
                                                            </span>
                                                            {guard.createdBy?.name && (
                                                                <>
                                                                    <span className="text-slate-600">·</span>
                                                                    <span
                                                                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                        title={`Created by: ${formatAuditActor(
                                                                            guard.createdBy
                                                                        )}${
                                                                            guard.createdAt
                                                                                ? ` on ${formatDate(guard.createdAt)}`
                                                                                : ""
                                                                        }${
                                                                            guard.updatedBy?.name
                                                                                ? ` | Modified by: ${formatAuditActor(
                                                                                      guard.updatedBy
                                                                                  )}`
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        <UserCheck
                                                                            size={11}
                                                                            className="text-emerald-400 shrink-0"
                                                                        />
                                                                        <span className="truncate max-w-[110px] font-medium text-slate-300">
                                                                            {guard.createdBy.name}
                                                                        </span>
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Institution */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={13} className="text-cyan-400 shrink-0" />
                                                    <span className="font-medium text-slate-200 truncate max-w-[160px]">
                                                        {guard.university?.name || "Global University System"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Gate & Shift */}
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-slate-300 text-xs font-semibold">
                                                        <DoorOpen size={12} className="text-cyan-400" />
                                                        <span className="truncate max-w-[130px]">{guard.assignedGate}</span>
                                                    </div>
                                                    <ShiftBadge shift={guard.shift} />
                                                </div>
                                            </td>

                                            {/* Account Status */}
                                            <td className="px-4 py-4">
                                                {guard.basicDetailRequest.enabled ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openViewModal(guard)}
                                                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-400/30"
                                                        title="View Details & Governance"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    {hasSecurityGuardPermission(guard, "UPDATE") && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => openProfileModal(guard)}
                                                                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                                                                title="Edit Profile Info"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDetailsModal(guard)}
                                                                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-violet-500/15 hover:text-violet-300 hover:border-violet-400/30"
                                                                title="Update Gate & Shift"
                                                            >
                                                                <DoorOpen size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDialog({ mode: "ENABLE", guard })
                                                                }
                                                                className={`rounded-lg border p-1.5 transition ${
                                                                    guard.basicDetailRequest.enabled
                                                                        ? "border-amber-400/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                                                        : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                                                }`}
                                                                title={
                                                                    guard.basicDetailRequest.enabled
                                                                        ? "Deactivate Account"
                                                                        : "Activate Account"
                                                                }
                                                            >
                                                                {guard.basicDetailRequest.enabled ? (
                                                                    <UserRoundX size={14} />
                                                                ) : (
                                                                    <UserRoundCheck size={14} />
                                                                )}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDialog({ mode: "RESET_PASSWORD", guard })
                                                                }
                                                                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-400/30"
                                                                title="Reset Password"
                                                            >
                                                                <KeyRound size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {hasSecurityGuardPermission(guard, "DELETE") && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDialog({ mode: "DELETE", guard })
                                                            }
                                                            className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-300 transition hover:bg-rose-500/20"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                                        <Shield size={32} className="mx-auto text-slate-600 mb-2" />
                                        <p className="font-semibold text-slate-300">
                                            No security guards found
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {hasActiveFilters
                                                ? "Try clearing or adjusting search filters."
                                                : "Click 'Deploy Guard' to add your institution's first security personnel."}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. Mobile Responsive Cards */}
                <div className="sm:hidden space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
                            <LoaderCircle size={20} className="animate-spin text-cyan-400" />
                            <span>Loading guards...</span>
                        </div>
                    ) : paginatedGuards.length > 0 ? (
                        paginatedGuards.map((guard) => {
                            const fullName = `${guard.basicDetailRequest.firstName} ${guard.basicDetailRequest.lastName}`.trim();
                            return (
                                <div
                                    key={guard.id}
                                    className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <GuardAvatar guard={guard} size="md" />
                                            <div>
                                                <p className="font-bold text-white text-sm">{fullName}</p>
                                                <p className="text-xs font-mono text-cyan-400">{guard.badgeNumber}</p>
                                            </div>
                                        </div>
                                        <ShiftBadge shift={guard.shift} />
                                    </div>

                                    <div className="text-xs text-slate-400 space-y-1">
                                        <p className="flex items-center gap-1.5">
                                            <DoorOpen size={13} className="text-cyan-400 shrink-0" />
                                            <span>Gate: {guard.assignedGate}</span>
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <Building2 size={13} className="text-slate-500 shrink-0" />
                                            <span>{guard.university?.name || "Global University System"}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        {guard.basicDetailRequest.enabled ? (
                                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Active
                                            </span>
                                        ) : (
                                            <span className="text-xs text-amber-400 font-semibold">Inactive</span>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openViewModal(guard)}
                                                className="rounded-lg bg-cyan-500/15 border border-cyan-400/30 p-1.5 text-cyan-300"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openProfileModal(guard)}
                                                className="rounded-lg bg-white/5 border border-white/10 p-1.5 text-slate-300"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400">
                            No security guards found.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filteredGuards.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-slate-400">
                        <p>
                            Showing{" "}
                            <span className="font-semibold text-white">
                                {Math.min(
                                    (currentPage - 1) * PAGE_SIZE + 1,
                                    filteredGuards.length
                                )}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-white">
                                {Math.min(currentPage * PAGE_SIZE, filteredGuards.length)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-white">
                                {filteredGuards.length}
                            </span>{" "}
                            personnel
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronsLeft size={14} />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="px-3 py-1 font-semibold text-white">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* ------------------------------------------------------------------ */}
            {/* MODALS                                                             */}
            {/* ------------------------------------------------------------------ */}
            <AnimatePresence>
                {/* 1. DEPLOY SECURITY GUARD MODAL */}
                {dialog?.mode === "CREATE" && (
                    <ModalShell
                        title="Deploy New Security Guard"
                        subtitle="Create guard profile, configure assigned gate post, and issue credentials."
                        onClose={() => setDialog(null)}
                        wide
                        icon={UserPlus}
                        iconTone="cyan"
                        busy={busy}
                    >
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            {/* Card 1: Photo Upload */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                <PassportPhotoUpload
                                    file={uploadedFile}
                                    onPhotoChange={(file) => setUploadedFile(file)}
                                    studentName={
                                        `${createForm.basicDetailRequest.firstName} ${createForm.basicDetailRequest.lastName}`.trim() ||
                                        "New Security Guard"
                                    }
                                    label="Guard Passport Photo"
                                    hint="Upload and crop image. Standard 3.5 × 4.5 cm proportion."
                                />
                            </div>

                            {/* Card 2: Affiliated Institution */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <Building2 size={14} className="text-cyan-400" />
                                    Affiliated Institution <span className="text-rose-400">*</span>
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
                                            Select University / Campus...
                                        </option>
                                        {universities.map((u) => (
                                            <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                                {u.name} {u.code ? `(${u.code})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <SelectChevron />
                                </div>
                                <FieldError error={formErrors.universityId} />
                            </div>

                            {/* Card 3: Deployment Post & Shift */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <DoorOpen size={14} className="text-cyan-400" />
                                    Deployment Post &amp; Duty Shift
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                    <div className="space-y-1">
                                        <label className="font-semibold text-slate-300">
                                            Assigned Gate / Post <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            required
                                            value={createForm.assignedGate}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    assignedGate: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. Main Gate A, North Entry"
                                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
                                        />
                                        <FieldError error={formErrors.assignedGate} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="font-semibold text-slate-300">
                                            Duty Shift <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={createForm.shift}
                                                onChange={(e) =>
                                                    setCreateForm({
                                                        ...createForm,
                                                        shift: e.target.value,
                                                    })
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60"
                                            >
                                                <option value="DAY" className="bg-slate-900 text-white">Day Shift (08:00 - 16:00)</option>
                                                <option value="EVENING" className="bg-slate-900 text-white">Evening Shift (16:00 - 00:00)</option>
                                                <option value="NIGHT" className="bg-slate-900 text-white">Night Shift (00:00 - 08:00)</option>
                                                <option value="ROTATIONAL" className="bg-slate-900 text-white">Rotational Shift</option>
                                            </select>
                                            <SelectChevron />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="font-semibold text-slate-300">
                                            Badge / ID Number
                                        </label>
                                        <input
                                            value={createForm.badgeNumber}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    badgeNumber: e.target.value,
                                                })
                                            }
                                            placeholder="Auto-generated if empty"
                                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="font-semibold text-slate-300">
                                            Joining Date
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.joiningDate}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    joiningDate: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/60"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <label className="font-semibold text-slate-300">
                                        Emergency Contact Phone
                                    </label>
                                    <input
                                        value={createForm.emergencyContact}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                emergencyContact: e.target.value,
                                            })
                                        }
                                        placeholder="Emergency contact number for security post"
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
                                    />
                                </div>
                            </div>

                            {/* Card 4: Personal & Contact Details */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <CircleUserRound size={14} className="text-cyan-400" />
                                    Personal &amp; Contact Details
                                </p>
                                <ProfileFields
                                    value={createForm.basicDetailRequest}
                                    onChange={(updater) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            basicDetailRequest: updater(prev.basicDetailRequest),
                                        }))
                                    }
                                    disabled={busy}
                                    errors={formErrors}
                                />
                            </div>

                            {/* Sticky Footer */}
                            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2.5 border-t border-white/10 bg-slate-900/95 py-3 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy || !selectedUniversityId}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:brightness-110 transition disabled:opacity-50"
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={15} className="animate-spin" />
                                            <span>Deploying Guard...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={15} />
                                            <span>Deploy Security Guard</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {/* 2. EDIT PROFILE MODAL */}
                {dialog?.mode === "PROFILE" && dialog.guard && (
                    <ModalShell
                        title="Edit Guard Profile"
                        subtitle={`${dialog.guard.basicDetailRequest.firstName} ${dialog.guard.basicDetailRequest.lastName} · Badge #${dialog.guard.badgeNumber}`}
                        onClose={() => setDialog(null)}
                        icon={Pencil}
                        iconTone="cyan"
                        busy={busy}
                    >
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            {/* Photo Upload */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                <PassportPhotoUpload
                                    file={uploadedFile}
                                    initialPhotoUrl={dialog.guard.basicDetailRequest.photo?.downloadUri}
                                    onPhotoChange={(file) => setUploadedFile(file)}
                                    studentName={`${profileForm.firstName} ${profileForm.lastName}`}
                                    label="Update Guard Photo"
                                    hint="Upload a new portrait to replace the current photo on file."
                                />
                            </div>

                            {/* Profile Details */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <CircleUserRound size={14} className="text-cyan-400" />
                                    Personal &amp; Contact Details
                                </p>
                                <ProfileFields
                                    value={profileForm}
                                    onChange={setProfileForm}
                                    disabled={busy}
                                    errors={formErrors}
                                />
                            </div>

                            {/* Sticky Footer */}
                            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2.5 border-t border-white/10 bg-slate-900/95 py-3 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500"
                                >
                                    {busy ? (
                                        <LoaderCircle size={15} className="animate-spin" />
                                    ) : (
                                        <Check size={15} />
                                    )}
                                    <span>Save Profile</span>
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {/* 3. UPDATE GATE & SHIFT MODAL */}
                {dialog?.mode === "DETAILS" && dialog.guard && (
                    <ModalShell
                        title="Update Gate & Shift Assignment"
                        subtitle={`${dialog.guard.basicDetailRequest.firstName} ${dialog.guard.basicDetailRequest.lastName}`}
                        onClose={() => setDialog(null)}
                        icon={DoorOpen}
                        iconTone="violet"
                        busy={busy}
                    >
                        <form onSubmit={handleDetailsSubmit} className="space-y-4">
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-300">Badge / ID Number</label>
                                    <input
                                        value={detailsForm.badgeNumber}
                                        onChange={(e) =>
                                            setDetailsForm({ ...detailsForm, badgeNumber: e.target.value })
                                        }
                                        placeholder="e.g. SG-101"
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-300">
                                        Assigned Gate / Location <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        required
                                        value={detailsForm.assignedGate}
                                        onChange={(e) =>
                                            setDetailsForm({ ...detailsForm, assignedGate: e.target.value })
                                        }
                                        placeholder="e.g. Main Gate A, Library Gate"
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
                                    />
                                    <FieldError error={formErrors.assignedGate} />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-300">
                                        Duty Shift <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={detailsForm.shift}
                                            onChange={(e) =>
                                                setDetailsForm({ ...detailsForm, shift: e.target.value })
                                            }
                                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60"
                                        >
                                            <option value="DAY" className="bg-slate-900 text-white">Day Shift (08:00 - 16:00)</option>
                                            <option value="EVENING" className="bg-slate-900 text-white">Evening Shift (16:00 - 00:00)</option>
                                            <option value="NIGHT" className="bg-slate-900 text-white">Night Shift (00:00 - 08:00)</option>
                                            <option value="ROTATIONAL" className="bg-slate-900 text-white">Rotational Shift</option>
                                        </select>
                                        <SelectChevron />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-300">
                                        Emergency Contact Phone
                                    </label>
                                    <input
                                        value={detailsForm.emergencyContact}
                                        onChange={(e) =>
                                            setDetailsForm({
                                                ...detailsForm,
                                                emergencyContact: e.target.value,
                                            })
                                        }
                                        placeholder="Emergency phone number"
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
                                    />
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2.5 border-t border-white/10 bg-slate-900/95 py-3 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500"
                                >
                                    {busy ? (
                                        <LoaderCircle size={15} className="animate-spin" />
                                    ) : (
                                        <Check size={15} />
                                    )}
                                    <span>Update Assignment</span>
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {/* 4. VIEW DETAILS & AUDIT GOVERNANCE SHOWCASE MODAL */}
                {dialog?.mode === "VIEW" && dialog.guard && (
                    <ModalShell
                        title="Security Guard Details & Governance"
                        subtitle={`${dialog.guard.basicDetailRequest.firstName} ${dialog.guard.basicDetailRequest.lastName}`}
                        onClose={() => setDialog(null)}
                        wide
                        icon={Eye}
                        iconTone="cyan"
                    >
                        <div className="space-y-4">
                            {/* Profile Header */}
                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-3.5">
                                        <GuardAvatar guard={dialog.guard} size="lg" />
                                        <div>
                                            <h3 className="text-base font-bold text-white">
                                                {dialog.guard.basicDetailRequest.firstName}{" "}
                                                {dialog.guard.basicDetailRequest.lastName}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                <span className="font-mono text-cyan-400 font-bold">
                                                    {dialog.guard.badgeNumber}
                                                </span>
                                                <span className="text-slate-600">·</span>
                                                <span className="font-mono text-slate-400">
                                                    @{dialog.guard.basicDetailRequest.username}
                                                </span>
                                                <span className="text-slate-600">·</span>
                                                <span>ID #{dialog.guard.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <ShiftBadge shift={dialog.guard.shift} />
                                        {dialog.guard.basicDetailRequest.enabled ? (
                                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dual Tab Navigation (Matching University.tsx & Teacher.tsx) */}
                            <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setViewTab("deployment")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                                        viewTab === "deployment"
                                            ? "border-cyan-400 text-cyan-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <DoorOpen size={13} />
                                    <span>Deployment &amp; Contact</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab("audit")}
                                    className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                                        viewTab === "audit"
                                            ? "border-cyan-400 text-cyan-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <ShieldCheck size={13} className="text-emerald-400" />
                                    <span>Audit Trail &amp; Governance</span>
                                </button>
                            </div>

                            {/* Tab 1: Deployment & Contact */}
                            {viewTab === "deployment" && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 space-y-2">
                                            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                                                <DoorOpen size={13} className="text-cyan-400" />
                                                Gate Deployment
                                            </p>
                                            <p className="text-slate-400">
                                                Post: <strong className="text-white">{dialog.guard.assignedGate}</strong>
                                            </p>
                                            <p className="text-slate-400">
                                                Shift: <strong className="text-white">{dialog.guard.shift}</strong>
                                            </p>
                                            {dialog.guard.joiningDate && (
                                                <p className="text-slate-400">
                                                    Joined: <strong className="text-white">{formatDate(dialog.guard.joiningDate)}</strong>
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 space-y-2">
                                            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                                                <Phone size={13} className="text-emerald-400" />
                                                Contact Info
                                            </p>
                                            <p className="text-slate-400">
                                                Phone: <strong className="text-white">{dialog.guard.basicDetailRequest.phone || "—"}</strong>
                                            </p>
                                            <p className="text-slate-400">
                                                Email: <strong className="text-white">{dialog.guard.basicDetailRequest.email || "—"}</strong>
                                            </p>
                                            {dialog.guard.emergencyContact && (
                                                <p className="text-slate-400">
                                                    Emergency: <strong className="text-rose-300">{dialog.guard.emergencyContact}</strong>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {dialog.guard.basicDetailRequest.address && (
                                        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3 text-xs text-slate-400">
                                            <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                                                <MapPin size={13} className="text-purple-400" />
                                                Residential Address
                                            </p>
                                            <p>{dialog.guard.basicDetailRequest.address}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: Audit Trail & Governance Showcase (EXACT University.tsx & Teacher.tsx Match) */}
                            {viewTab === "audit" && (
                                <div className="space-y-4">
                                    {/* Authority Card */}
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                                <ShieldCheck size={14} className="text-emerald-400" />
                                                Institutional Governance Authority
                                            </span>
                                            <span className="rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                                Active Security RBAC
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg bg-slate-900/60 p-2.5 space-y-1">
                                                <span className="text-[10px] uppercase text-slate-500 block">Affiliated Campus</span>
                                                <span className="font-semibold text-white block">
                                                    {dialog.guard.university?.name || "Global University System"}
                                                </span>
                                            </div>

                                            <div className="rounded-lg bg-slate-900/60 p-2.5 space-y-1">
                                                <span className="text-[10px] uppercase text-slate-500 block">Target Resource</span>
                                                <span className="font-semibold text-white block">
                                                    SECURITY_GUARD · #{dialog.guard.id}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Permissions Badges */}
                                        <div className="flex flex-wrap items-center gap-1 pt-1">
                                            <span className="text-[10px] text-slate-500 mr-1">RBAC Actions:</span>
                                            {dialog.guard.permissionActions.map((perm) => (
                                                <span
                                                    key={perm}
                                                    className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300"
                                                >
                                                    {perm}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Created By & Last Modified By 2-Card Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                        {/* Created By Card */}
                                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                                            <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                                                <span className="flex items-center gap-1">
                                                    <UserCheck size={12} /> Created By
                                                </span>
                                                {dialog.guard.createdAt && (
                                                    <span className="text-slate-400 font-mono text-[10px]">
                                                        {formatDate(dialog.guard.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-300">
                                                    {getInitials(dialog.guard.createdBy?.name || "System")}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-slate-200">
                                                        {dialog.guard.createdBy?.name || "System Administrator"}
                                                    </p>
                                                    {(dialog.guard.createdBy?.code || dialog.guard.createdBy?.id) && (
                                                        <p className="text-[10px] text-slate-400 font-mono truncate">
                                                            {dialog.guard.createdBy.code
                                                                ? `Code: ${dialog.guard.createdBy.code}`
                                                                : `ID: #${dialog.guard.createdBy.id}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {dialog.guard.createdAt && (
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-emerald-500/10">
                                                    <Clock size={10} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">
                                                        Timestamp: {formatDateTime(dialog.guard.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Last Modified By Card */}
                                        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2">
                                            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
                                                <span className="flex items-center gap-1">
                                                    <RotateCcw size={12} /> Last Modified By
                                                </span>
                                                {(dialog.guard.updatedAt || dialog.guard.createdAt) && (
                                                    <span className="text-slate-400 font-mono text-[10px]">
                                                        {formatDate(dialog.guard.updatedAt || dialog.guard.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-xs font-bold text-cyan-300">
                                                    {getInitials(
                                                        dialog.guard.updatedBy?.name ||
                                                        dialog.guard.createdBy?.name ||
                                                        "System"
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-slate-200">
                                                        {dialog.guard.updatedBy?.name ||
                                                            dialog.guard.createdBy?.name ||
                                                            "System Administrator"}
                                                    </p>
                                                    {(dialog.guard.updatedBy?.code || dialog.guard.updatedBy?.id) && (
                                                        <p className="text-[10px] text-slate-400 font-mono truncate">
                                                            {dialog.guard.updatedBy.code
                                                                ? `Code: ${dialog.guard.updatedBy.code}`
                                                                : `ID: #${dialog.guard.updatedBy.id}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {(dialog.guard.updatedAt || dialog.guard.createdAt) && (
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-cyan-500/10">
                                                    <Clock size={10} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">
                                                        Timestamp: {formatDateTime(
                                                            dialog.guard.updatedAt || dialog.guard.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {/* 5. TOGGLE ACCOUNT STATUS MODAL */}
                {dialog?.mode === "ENABLE" && dialog.guard && (
                    <ModalShell
                        title={
                            dialog.guard.basicDetailRequest.enabled
                                ? "Deactivate Guard Account"
                                : "Activate Guard Account"
                        }
                        onClose={() => setDialog(null)}
                        icon={
                            dialog.guard.basicDetailRequest.enabled
                                ? UserRoundX
                                : UserRoundCheck
                        }
                        iconTone={dialog.guard.basicDetailRequest.enabled ? "amber" : "emerald"}
                        busy={busy}
                    >
                        <div className="space-y-4 text-xs">
                            <p className="text-slate-300 leading-relaxed">
                                Are you sure you want to{" "}
                                <strong className="text-white">
                                    {dialog.guard.basicDetailRequest.enabled ? "deactivate" : "activate"}
                                </strong>{" "}
                                the account for{" "}
                                <strong className="text-white">
                                    {dialog.guard.basicDetailRequest.firstName}{" "}
                                    {dialog.guard.basicDetailRequest.lastName}
                                </strong>{" "}
                                (Badge #{dialog.guard.badgeNumber})?
                            </p>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleToggleEnable()}
                                    disabled={busy}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                                        dialog.guard.basicDetailRequest.enabled
                                            ? "bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20"
                                            : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                                    }`}
                                >
                                    {busy ? (
                                        <LoaderCircle size={14} className="animate-spin" />
                                    ) : (
                                        <Check size={14} />
                                    )}
                                    <span>
                                        {dialog.guard.basicDetailRequest.enabled
                                            ? "Deactivate Account"
                                            : "Activate Account"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {/* 6. RESET PASSWORD MODAL */}
                {dialog?.mode === "RESET_PASSWORD" && dialog.guard && (
                    <ModalShell
                        title="Reset Guard Password"
                        subtitle={`Badge #${dialog.guard.badgeNumber}`}
                        onClose={() => setDialog(null)}
                        icon={KeyRound}
                        iconTone="amber"
                        busy={busy}
                    >
                        <div className="space-y-4 text-xs">
                            <p className="text-slate-300 leading-relaxed">
                                This will reset the password for{" "}
                                <strong className="text-white">
                                    {dialog.guard.basicDetailRequest.firstName}{" "}
                                    {dialog.guard.basicDetailRequest.lastName}
                                </strong>{" "}
                                back to their Date of Birth (YYYY-MM-DD). The guard will be prompted to change it upon next login.
                            </p>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleResetPassword()}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500"
                                >
                                    {busy ? (
                                        <LoaderCircle size={14} className="animate-spin" />
                                    ) : (
                                        <KeyRound size={14} />
                                    )}
                                    <span>Confirm Reset</span>
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {/* 7. DELETE GUARD CONFIRMATION MODAL */}
                {dialog?.mode === "DELETE" && dialog.guard && (
                    <ModalShell
                        title="Delete Security Guard Record"
                        subtitle={`Badge #${dialog.guard.badgeNumber}`}
                        onClose={() => setDialog(null)}
                        icon={Trash2}
                        iconTone="rose"
                        busy={busy}
                    >
                        <div className="space-y-4 text-xs">
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-200 leading-relaxed">
                                <p className="font-semibold text-white">Permanent Deletion Warning</p>
                                <p className="mt-1">
                                    Are you sure you want to permanently delete the personnel record for{" "}
                                    <strong className="text-white">
                                        {dialog.guard.basicDetailRequest.firstName}{" "}
                                        {dialog.guard.basicDetailRequest.lastName}
                                    </strong>
                                    ? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleDeleteGuard()}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500"
                                >
                                    {busy ? (
                                        <LoaderCircle size={14} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                    <span>Delete Personnel</span>
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>
        </div>
    );
}
