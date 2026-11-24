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
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Crown,
    Eye,
    Filter,
    GraduationCap,
    Info,
    Layers,
    LoaderCircle,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    ToggleLeft,
    ToggleRight,
    UserCheck,
    UserCog,
    Users,
    X,
} from "lucide-react";

import {
    addRoleToTeacher,
    changeRoleActiveStatus,
    extractTeacherRoleErrorMessage,
    formatAuditActor,
    formatDate,
    formatDateTime,
    getInitials,
    getRoleFilter,
    getTeacherRoles,
    hasRolePermission,
    type CommonDTO,
    type RoleFilter,
    type TeacherRoleResponse,
    type UserRoleResponse,
} from "@/services/userMangement/teacherRoleService";
import { getTeachers, type TeacherResponse } from "@/services/userMangement/teacherService";

/* -------------------------------------------------------------------------- */
/* Constants & Tone Mappings                                                   */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 8;

type StatusFilter = "ALL" | "ACTIVE_ONLY" | "HAS_INACTIVE" | "NO_ROLES";
type SortMode = "NAME_ASC" | "NAME_DESC" | "ROLES_DESC" | "ROLES_ASC" | "ID_DESC";
type DialogMode = "ASSIGN" | "MANAGE" | "CONFIRM_TOGGLE" | "VIEW";

interface DialogState {
    mode: DialogMode;
    record?: UserRoleResponse;
    targetTeacherId?: number;
    targetRole?: TeacherRoleResponse;
    nextStatus?: boolean;
}

const ROLE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
    SUPER_ADMIN: {
        bg: "bg-rose-500/10",
        text: "text-rose-300",
        border: "border-rose-500/30",
    },
    ADMIN: {
        bg: "bg-violet-500/10",
        text: "text-violet-300",
        border: "border-violet-500/30",
    },
    DEAN: {
        bg: "bg-amber-500/10",
        text: "text-amber-300",
        border: "border-amber-500/30",
    },
    HEAD_OF_DEPARTMENT: {
        bg: "bg-indigo-500/10",
        text: "text-indigo-300",
        border: "border-indigo-500/30",
    },
    TEACHER: {
        bg: "bg-cyan-500/10",
        text: "text-cyan-300",
        border: "border-cyan-500/30",
    },
    EXAM_CONTROLLER: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-300",
        border: "border-emerald-500/30",
    },
    FINANCE: {
        bg: "bg-teal-500/10",
        text: "text-teal-300",
        border: "border-teal-500/30",
    },
};

function getRoleTone(roleEnum: string) {
    const key = (roleEnum || "").toUpperCase();
    return (
        ROLE_COLOR_MAP[key] ?? {
            bg: "bg-slate-500/10",
            text: "text-slate-300",
            border: "border-slate-500/30",
        }
    );
}

/* -------------------------------------------------------------------------- */
/* Modal Shell Component (Standard across ERP)                                */
/* -------------------------------------------------------------------------- */

function ModalShell({
    title,
    subtitle,
    onClose,
    children,
    wide = false,
    icon: Icon = UserCog,
    iconTone = "cyan",
    busy = false,
}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
    icon?: typeof UserCog;
    iconTone?: "cyan" | "emerald" | "amber" | "rose" | "violet";
    busy?: boolean;
}) {
    const reduceMotion = useReducedMotion();

    const toneClasses = {
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !busy && onClose()}
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
                className={`relative z-10 flex max-h-[94vh] sm:max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/70 ${
                    wide ? "max-w-4xl" : "max-w-xl"
                }`}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className={`rounded-xl border p-2 shrink-0 sm:p-2.5 ${toneClasses[iconTone]}`}>
                            <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
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
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white shrink-0 ml-2 sm:ml-3 disabled:opacity-40"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 custom-scrollbar">
                    {children}
                </div>
            </motion.section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Component: TeacherAssignRole                                          */
/* -------------------------------------------------------------------------- */

export default function TeacherAssignRole() {
    const reduceMotion = useReducedMotion();

    /* Core records */
    const [userRoles, setUserRoles] = useState<UserRoleResponse[]>([]);
    const [allTeachers, setAllTeachers] = useState<TeacherResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [notice, setNotice] = useState("");

    /* Filtering, search & sorting */
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sortMode, setSortMode] = useState<SortMode>("NAME_ASC");
    const [page, setPage] = useState(1);

    /* Dialog management */
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [busy, setBusy] = useState(false);

    /* Assign Modal state */
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
    const [availableRoles, setAvailableRoles] = useState<RoleFilter[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");

    /* -------------------------------------------------------------------------- */
    /* Data Loading                                                               */
    /* -------------------------------------------------------------------------- */

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setLoadError("");

        try {
            const [rolesData, teachersData] = await Promise.all([
                getTeacherRoles(),
                getTeachers().catch(() => [] as TeacherResponse[]),
            ]);

            setUserRoles(rolesData);
            setAllTeachers(teachersData);
        } catch (error) {
            const msg = extractTeacherRoleErrorMessage(
                error,
                "Failed to load teacher role assignments."
            );
            setLoadError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    /* Load available roles when a teacher is chosen in Assign Modal */
    useEffect(() => {
        if (!selectedTeacherId || typeof selectedTeacherId !== "number") {
            setAvailableRoles([]);
            setSelectedRoleId("");
            return;
        }

        let isMounted = true;
        setLoadingRoles(true);
        setSelectedRoleId("");

        getRoleFilter(selectedTeacherId)
            .then((roles) => {
                if (isMounted) {
                    setAvailableRoles(roles);
                }
            })
            .catch((error) => {
                if (isMounted) {
                    toast.error(
                        extractTeacherRoleErrorMessage(
                            error,
                            "Could not load valid roles for this teacher."
                        )
                    );
                    setAvailableRoles([]);
                }
            })
            .finally(() => {
                if (isMounted) setLoadingRoles(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedTeacherId]);

    /* -------------------------------------------------------------------------- */
    /* Handlers                                                                   */
    /* -------------------------------------------------------------------------- */

    const handleAssignRoleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedTeacherId || typeof selectedTeacherId !== "number") {
            toast.error("Please select a teacher.");
            return;
        }
        if (!selectedRoleId || typeof selectedRoleId !== "number") {
            toast.error("Please select a role to assign.");
            return;
        }

        setBusy(true);
        try {
            const updated = await addRoleToTeacher(selectedTeacherId, selectedRoleId);
            toast.success("Role successfully assigned to faculty member.");
            setNotice(`Role assigned to ${updated.user.name}.`);

            setUserRoles((current) => {
                const index = current.findIndex(
                    (item) => item.teacherId === updated.teacherId || item.user.id === updated.user.id
                );
                if (index >= 0) {
                    const next = [...current];
                    next[index] = updated;
                    return next;
                }
                return [updated, ...current];
            });

            setDialog(null);
        } catch (error) {
            toast.error(extractTeacherRoleErrorMessage(error, "Failed to assign role."));
        } finally {
            setBusy(false);
        }
    };

    const handleExecuteStatusToggle = async () => {
        if (dialog?.mode !== "CONFIRM_TOGGLE" || !dialog.record || !dialog.targetRole) return;
        const { record, targetRole, nextStatus } = dialog;

        setBusy(true);
        try {
            const updated = await changeRoleActiveStatus(
                record.teacherId,
                targetRole.id,
                Boolean(nextStatus)
            );

            toast.success(
                `Role "${targetRole.name}" ${nextStatus ? "activated" : "deactivated"} successfully.`
            );

            setUserRoles((current) =>
                current.map((item) =>
                    item.teacherId === updated.teacherId || item.user.id === updated.user.id
                        ? updated
                        : item
                )
            );

            // Re-open Manage dialog with updated record
            setDialog({ mode: "MANAGE", record: updated });
        } catch (error) {
            toast.error(extractTeacherRoleErrorMessage(error, "Failed to update role status."));
            setDialog(null);
        } finally {
            setBusy(false);
        }
    };

    /* -------------------------------------------------------------------------- */
    /* Filter, Search & Aggregations                                               */
    /* -------------------------------------------------------------------------- */

    const uniqueRoleOptions = useMemo(() => {
        const set = new Set<string>();
        userRoles.forEach((item) => {
            item.roles.forEach((r) => {
                if (r.name) set.add(r.name);
            });
        });
        return Array.from(set).sort();
    }, [userRoles]);

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();

        return userRoles.filter((record) => {
            // Search query match
            if (query) {
                const nameMatch = record.user.name?.toLowerCase().includes(query);
                const codeMatch = record.user.code?.toLowerCase().includes(query);
                const idMatch = String(record.teacherId).includes(query);
                const roleMatch = record.roles.some((r) =>
                    r.name.toLowerCase().includes(query) || r.enumValue.toLowerCase().includes(query)
                );
                if (!nameMatch && !codeMatch && !idMatch && !roleMatch) return false;
            }

            // Role filter
            if (roleFilter !== "ALL") {
                const hasRole = record.roles.some((r) => r.name === roleFilter);
                if (!hasRole) return false;
            }

            // Status filter
            if (statusFilter === "ACTIVE_ONLY") {
                const hasActive = record.roles.some((r) => r.active);
                if (!hasActive) return false;
            } else if (statusFilter === "HAS_INACTIVE") {
                const hasInactive = record.roles.some((r) => !r.active);
                if (!hasInactive) return false;
            } else if (statusFilter === "NO_ROLES") {
                if (record.roles.length > 0) return false;
            }

            return true;
        });
    }, [userRoles, search, roleFilter, statusFilter]);

    const sortedRecords = useMemo(() => {
        return [...filteredRecords].sort((a, b) => {
            if (sortMode === "NAME_ASC") {
                return (a.user.name || "").localeCompare(b.user.name || "");
            }
            if (sortMode === "NAME_DESC") {
                return (b.user.name || "").localeCompare(a.user.name || "");
            }
            if (sortMode === "ROLES_DESC") {
                return b.roles.length - a.roles.length;
            }
            if (sortMode === "ROLES_ASC") {
                return a.roles.length - b.roles.length;
            }
            if (sortMode === "ID_DESC") {
                return b.teacherId - a.teacherId;
            }
            return 0;
        });
    }, [filteredRecords, sortMode]);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter, sortMode]);

    const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));
    const paginatedRecords = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sortedRecords.slice(start, start + PAGE_SIZE);
    }, [sortedRecords, page]);

    /* KPI Statistics Cards */
    const stats = useMemo(() => {
        let totalAssignedRoles = 0;
        let totalActiveRoles = 0;
        let totalInactiveRoles = 0;
        let administrativeRoles = 0;

        userRoles.forEach((item) => {
            totalAssignedRoles += item.roles.length;
            item.roles.forEach((r) => {
                if (r.active) totalActiveRoles++;
                else totalInactiveRoles++;

                const ev = (r.enumValue || "").toUpperCase();
                if (ev === "ADMIN" || ev === "DEAN" || ev === "HEAD_OF_DEPARTMENT" || ev === "SUPER_ADMIN") {
                    administrativeRoles++;
                }
            });
        });

        return [
            {
                label: "Faculty with Roles",
                value: userRoles.length,
                icon: Users,
                tone: "cyan",
                subtext: "Teachers with role profiles",
            },
            {
                label: "Active Roles",
                value: totalActiveRoles,
                icon: ShieldCheck,
                tone: "emerald",
                subtext: "Operational permissions",
            },
            {
                label: "Administrative Roles",
                value: administrativeRoles,
                icon: Crown,
                tone: "violet",
                subtext: "Deans, HODs, Admins",
            },
            {
                label: "Inactive / Suspended",
                value: totalInactiveRoles,
                icon: ShieldAlert,
                tone: "amber",
                subtext: "Temporarily blocked roles",
            },
        ];
    }, [userRoles]);

    const hasActiveFilters = search || roleFilter !== "ALL" || statusFilter !== "ALL" || sortMode !== "NAME_ASC";

    const resetFilters = () => {
        setSearch("");
        setRoleFilter("ALL");
        setStatusFilter("ALL");
        setSortMode("NAME_ASC");
    };

    /* Primary Creator helper for a teacher row */
    const getRowAuditInfo = (record: UserRoleResponse) => {
        const rolesWithAudit = record.roles.filter((r) => r.createdBy || r.createdAt);
        if (rolesWithAudit.length === 0) return null;
        const first = rolesWithAudit[0];
        return {
            createdBy: first.createdBy,
            createdAt: first.createdAt,
            updatedBy: first.updatedBy,
            updatedAt: first.updatedAt,
        };
    };

    /* -------------------------------------------------------------------------- */
    /* Render UI                                                                  */
    /* -------------------------------------------------------------------------- */

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-5 p-3 text-slate-100 sm:space-y-6 sm:p-5 lg:p-7"
        >
            {/* Header & Breadcrumbs */}
            <section className="space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span className="truncate">Academic Management</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Teachers</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-white shrink-0">Assign Roles</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Access Control &amp; Faculty Governance
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Assign Roles to Teachers
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Delegate administrative authority, assign departmental roles (HOD, Dean, Exam Controller),
                            and monitor institutional privileges across your faculty.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            title="Refresh teacher roles"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-3 sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={loading || refreshing ? "animate-spin text-cyan-400" : ""}
                            />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setSelectedTeacherId("");
                                setSelectedRoleId("");
                                setDialog({ mode: "ASSIGN" });
                            }}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Assign Role</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Error & Notice Banners */}
            <AnimatePresence>
                {loadError && (
                    <motion.div
                        role="alert"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-200"
                    >
                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                        <div className="flex-1">
                            <p className="font-semibold text-white">Could not load role records</p>
                            <p className="mt-0.5 text-rose-300/90">{loadError}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadData()}
                            className="rounded-lg border border-rose-400/30 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500/30"
                        >
                            Retry
                        </button>
                    </motion.div>
                )}

                {notice && (
                    <motion.div
                        role="status"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 sm:p-4 text-xs sm:text-sm text-emerald-200"
                    >
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                        <p className="flex-1 leading-relaxed">{notice}</p>
                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss notice"
                            className="ml-auto text-slate-400 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KPI Statistics Row */}
            <section
                aria-label="Teacher role statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    const toneClasses: Record<string, string> = {
                        cyan: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20 text-cyan-400",
                        emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-400",
                        violet: "from-violet-500/10 to-purple-500/5 border-violet-500/20 text-violet-400",
                        amber: "from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-400",
                    };

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
                            className={`rounded-2xl border bg-gradient-to-br p-3.5 sm:p-5 shadow-lg backdrop-blur-xl ${
                                toneClasses[stat.tone]
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-300 truncate sm:text-sm">
                                        {stat.label}
                                    </p>
                                    <p className="mt-1.5 text-xl font-bold tracking-tight text-white sm:mt-3 sm:text-3xl">
                                        {loading ? (
                                            <span className="inline-block h-7 w-14 animate-pulse rounded bg-white/10 sm:h-8 sm:w-16" />
                                        ) : (
                                            stat.value.toLocaleString()
                                        )}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-400 truncate">
                                        {stat.subtext}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-2 sm:p-3 shrink-0">
                                    <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
                                </div>
                            </div>
                            <div className="mt-3 sm:mt-5 h-1 overflow-hidden rounded-full bg-white/10">
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

            {/* Filter & Search Toolbar */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <div className="grid gap-2.5 sm:gap-3 border-b border-white/10 p-3 sm:p-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    {/* Search */}
                    <div className="relative min-w-0 sm:col-span-2">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search teachers and roles"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by teacher name, role, code..."
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

                    {/* Role Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by role"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="ALL">All Roles</option>
                            {uniqueRoleOptions.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by role status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE_ONLY">Active Roles Only</option>
                            <option value="HAS_INACTIVE">Has Inactive Roles</option>
                            <option value="NO_ROLES">No Roles Assigned</option>
                        </select>
                        <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {/* Sort & Reset */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <select
                                aria-label="Sort records"
                                value={sortMode}
                                onChange={(e) => setSortMode(e.target.value as SortMode)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                            >
                                <option value="NAME_ASC">Name (A-Z)</option>
                                <option value="NAME_DESC">Name (Z-A)</option>
                                <option value="ROLES_DESC">Most Roles</option>
                                <option value="ROLES_ASC">Fewest Roles</option>
                                <option value="ID_DESC">Newest Teacher ID</option>
                            </select>
                            <ChevronDown
                                size={14}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                title="Reset all filters"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition shrink-0"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Table View (hidden sm:block overflow-x-auto) */}
                <div className="hidden sm:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-300 min-w-[950px]">
                        <thead className="border-b border-white/10 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <tr>
                                <th scope="col" className="px-5 py-4">
                                    Teacher / Faculty
                                </th>
                                <th scope="col" className="px-5 py-4">
                                    Assigned Roles
                                </th>
                                <th scope="col" className="px-4 py-4 text-center">
                                    Role Count
                                </th>
                                <th scope="col" className="px-4 py-4">
                                    Primary Authorization
                                </th>
                                <th scope="col" className="px-4 py-4">
                                    Governance
                                </th>
                                <th scope="col" className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white/10" />
                                                <div className="space-y-1.5">
                                                    <div className="h-4 w-32 rounded bg-white/10" />
                                                    <div className="h-3 w-20 rounded bg-white/5" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2">
                                                <div className="h-6 w-24 rounded-lg bg-white/10" />
                                                <div className="h-6 w-20 rounded-lg bg-white/5" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="mx-auto h-5 w-8 rounded bg-white/10" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-5 w-24 rounded bg-white/10" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-5 w-28 rounded bg-white/10" />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="inline-block h-8 w-24 rounded bg-white/10" />
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <Shield size={42} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                        <p className="text-base font-semibold text-white">No teacher role records found</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {hasActiveFilters
                                                ? "Try clearing or adjusting your search filters."
                                                : "No roles have been assigned yet to faculty members."}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => {
                                    const activeCount = record.roles.filter((r) => r.active).length;
                                    const inactiveCount = record.roles.length - activeCount;
                                    const audit = getRowAuditInfo(record);

                                    return (
                                        <motion.tr
                                            key={record.teacherId}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="transition hover:bg-white/[0.02]"
                                        >
                                            {/* Teacher Details */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 font-bold text-xs text-cyan-200">
                                                        {getInitials(record.user.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white truncate">
                                                            {record.user.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400 font-mono">
                                                            ID #{record.teacherId} {record.user.code && `· ${record.user.code}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned Roles List */}
                                            <td className="px-5 py-4">
                                                {record.roles.length === 0 ? (
                                                    <span className="text-xs italic text-slate-500">
                                                        No custom roles assigned (Standard Faculty)
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5 max-w-[340px]">
                                                        {record.roles.slice(0, 3).map((role) => {
                                                            const tone = getRoleTone(role.enumValue);
                                                            return (
                                                                <span
                                                                    key={role.id}
                                                                    title={`${role.name}: ${role.description || "No description"} (${
                                                                        role.active ? "Active" : "Inactive"
                                                                    })`}
                                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-medium ${
                                                                        tone.bg
                                                                    } ${tone.text} ${tone.border} ${
                                                                        !role.active ? "opacity-50 line-through" : ""
                                                                    }`}
                                                                >
                                                                    <span>{role.name}</span>
                                                                    <span
                                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                                            role.active ? "bg-emerald-400" : "bg-amber-400"
                                                                        }`}
                                                                    />
                                                                </span>
                                                            );
                                                        })}
                                                        {record.roles.length > 3 && (
                                                            <span className="text-xs text-slate-500 self-center">
                                                                +{record.roles.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Role Count */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                                                    <span>{record.roles.length}</span>
                                                    {inactiveCount > 0 && (
                                                        <span className="text-amber-400 text-[10px]">
                                                            ({inactiveCount} off)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Primary Authorization */}
                                            <td className="px-4 py-4">
                                                {record.roles.some((r) => r.active && r.enumValue === "ADMIN") ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300">
                                                        <Crown size={13} /> Admin Delegated
                                                    </span>
                                                ) : record.roles.some((r) => r.active && r.enumValue === "HEAD_OF_DEPARTMENT") ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300">
                                                        <ShieldCheck size={13} /> Department Head
                                                    </span>
                                                ) : record.roles.some((r) => r.active && r.enumValue === "DEAN") ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                                                        <ShieldCheck size={13} /> Faculty Dean
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        Standard Instructor
                                                    </span>
                                                )}
                                            </td>

                                            {/* Governance / Creator Pill with Tooltip */}
                                            <td className="px-4 py-4">
                                                <div
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1 text-xs text-slate-300"
                                                    title={`Assigned by: ${formatAuditActor(
                                                        audit?.createdBy
                                                    )} on ${formatDate(audit?.createdAt)} | Modified by: ${formatAuditActor(
                                                        audit?.updatedBy
                                                    )} on ${formatDate(audit?.updatedAt || audit?.createdAt)}`}
                                                >
                                                    <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                                    <span className="truncate max-w-[110px]">
                                                        {audit?.createdBy?.name || "System"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions with strict h-8 w-8 shrink-0 */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View Overview & Full Audit */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDialog({ mode: "VIEW", record })}
                                                        aria-label={`View roles and audit trail for ${record.user.name}`}
                                                        title="View Roles & Audit Trail"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Manage / Toggle Roles */}
                                                    {hasRolePermission(record, "UPDATE") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDialog({ mode: "MANAGE", record })}
                                                            aria-label={`Manage role status for ${record.user.name}`}
                                                            title="Manage & Toggle Role Status"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-violet-300 transition hover:border-violet-400/30 hover:bg-violet-400/10"
                                                        >
                                                            <SlidersHorizontal size={15} />
                                                        </button>
                                                    )}

                                                    {/* Add Role */}
                                                    {hasRolePermission(record, "UPDATE") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedTeacherId(record.teacherId);
                                                                setSelectedRoleId("");
                                                                setDialog({
                                                                    mode: "ASSIGN",
                                                                    targetTeacherId: record.teacherId,
                                                                });
                                                            }}
                                                            aria-label={`Assign new role to ${record.user.name}`}
                                                            title="Assign New Role"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                        >
                                                            <Plus size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile / Tablet Cards View (sm:hidden space-y-3) */}
                <div className="divide-y divide-white/5 sm:hidden">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-3 p-4">
                                <div className="h-5 w-40 rounded bg-white/10" />
                                <div className="h-4 w-56 rounded bg-white/5" />
                                <div className="h-10 rounded bg-white/5" />
                            </div>
                        ))
                    ) : paginatedRecords.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p className="text-sm font-semibold text-slate-300">No teacher role records found</p>
                        </div>
                    ) : (
                        paginatedRecords.map((record) => {
                            const audit = getRowAuditInfo(record);
                            return (
                                <article key={record.teacherId} className="min-w-0 space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 font-bold text-xs text-cyan-200">
                                                {getInitials(record.user.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-white break-words">
                                                    {record.user.name}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                    ID #{record.teacherId}
                                                    {record.user.code && ` · ${record.user.code}`}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full border border-white/10 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300 shrink-0">
                                            {record.roles.length} role(s)
                                        </span>
                                    </div>

                                    {/* Roles Container */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs">
                                        <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                                            Assigned Roles:
                                        </p>
                                        {record.roles.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic">No roles assigned.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {record.roles.map((role) => {
                                                    const tone = getRoleTone(role.enumValue);
                                                    return (
                                                        <span
                                                            key={role.id}
                                                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                                                                tone.bg
                                                            } ${tone.text} ${tone.border} ${
                                                                !role.active ? "opacity-50 line-through" : ""
                                                            }`}
                                                        >
                                                            <span>{role.name}</span>
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    role.active ? "bg-emerald-400" : "bg-amber-400"
                                                                }`}
                                                            />
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Audit bar footer */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[11px] text-slate-400">
                                        <span className="inline-flex items-center gap-1.5">
                                            <UserCheck size={12} className="text-emerald-400" />
                                            <span>Assigned: {audit?.createdBy?.name || "System"}</span>
                                        </span>
                                        {audit?.createdAt && (
                                            <span className="font-mono text-slate-500">
                                                {formatDate(audit.createdAt)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Responsive Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setDialog({ mode: "VIEW", record })}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-white/10 transition"
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                        {hasRolePermission(record, "UPDATE") && (
                                            <button
                                                type="button"
                                                onClick={() => setDialog({ mode: "MANAGE", record })}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                                            >
                                                <SlidersHorizontal size={14} /> Manage
                                            </button>
                                        )}
                                        {hasRolePermission(record, "UPDATE") && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTeacherId(record.teacherId);
                                                    setSelectedRoleId("");
                                                    setDialog({
                                                        mode: "ASSIGN",
                                                        targetTeacherId: record.teacherId,
                                                    });
                                                }}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                                            >
                                                <Plus size={14} /> Add Role
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>

                {/* Pagination Footer */}
                {!loading && sortedRecords.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-xs text-slate-400 text-center sm:text-left">
                            Showing{" "}
                            <span className="font-semibold text-white">
                                {(page - 1) * PAGE_SIZE + 1}–
                                {Math.min(page * PAGE_SIZE, sortedRecords.length)}
                            </span>{" "}
                            of <span className="font-semibold text-white">{sortedRecords.length}</span> faculty members
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                            <button
                                type="button"
                                aria-label="First page"
                                disabled={page === 1}
                                onClick={() => setPage(1)}
                                className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40"
                            >
                                <ChevronsLeft size={15} />
                            </button>
                            <button
                                type="button"
                                aria-label="Previous page"
                                disabled={page === 1}
                                onClick={() => setPage((v) => Math.max(1, v - 1))}
                                className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40"
                            >
                                <ChevronLeft size={15} />
                            </button>

                            {/* Mobile compact page indicator */}
                            <span className="flex sm:hidden items-center px-2 text-xs font-semibold text-cyan-300">
                                {page} / {totalPages}
                            </span>

                            {/* Desktop numbered list */}
                            <span className="hidden sm:inline-flex items-center gap-1.5">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((v) => v === 1 || v === totalPages || Math.abs(v - page) <= 1)
                                    .map((v, i, list) => (
                                        <span key={v} className="contents">
                                            {i > 0 && v - list[i - 1] > 1 && (
                                                <span className="px-1 text-xs text-slate-600">…</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setPage(v)}
                                                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                                                    page === v
                                                        ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40"
                                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        </span>
                                    ))}
                            </span>

                            <button
                                type="button"
                                aria-label="Next page"
                                disabled={page === totalPages}
                                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                                className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40"
                            >
                                <ChevronRight size={15} />
                            </button>
                            <button
                                type="button"
                                aria-label="Last page"
                                disabled={page === totalPages}
                                onClick={() => setPage(totalPages)}
                                className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40"
                            >
                                <ChevronsRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ---------------------------------------------------------------------- */}
            {/* MODALS                                                                 */}
            {/* ---------------------------------------------------------------------- */}
            <AnimatePresence>
                {/* 1. ASSIGN ROLE MODAL */}
                {dialog?.mode === "ASSIGN" && (
                    <ModalShell
                        title="Assign Institutional Role"
                        subtitle="Grant specialized authority or administrative permissions to a teacher."
                        onClose={() => setDialog(null)}
                        icon={UserCog}
                        iconTone="violet"
                        busy={busy}
                    >
                        <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
                            {/* Teacher Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Target Faculty Member <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={selectedTeacherId}
                                        onChange={(e) => {
                                            const val = e.target.value ? Number(e.target.value) : "";
                                            setSelectedTeacherId(val);
                                        }}
                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-sm text-white focus:border-cyan-400 focus:outline-none"
                                    >
                                        <option value="">— Select Teacher —</option>
                                        {Array.from(
                                            new Map(
                                                [
                                                    ...userRoles.map((r) => ({
                                                        id: r.teacherId,
                                                        name: r.user.name,
                                                        code: r.user.code,
                                                    })),
                                                    ...allTeachers.map((t) => ({
                                                        id: t.id,
                                                        name: `${t.basicDetailRequest.firstName} ${t.basicDetailRequest.lastName}`.trim(),
                                                        code: t.basicDetailRequest.username,
                                                    })),
                                                ].map((item) => [item.id, item])
                                            ).values()
                                        ).map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} (ID: #{t.id}{t.code ? ` · ${t.code}` : ""})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={14}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Role Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Role to Assign <span className="text-rose-400">*</span>
                                </label>
                                {loadingRoles ? (
                                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400">
                                        <LoaderCircle size={15} className="animate-spin text-cyan-400" />
                                        <span>Loading authorized roles for this university...</span>
                                    </div>
                                ) : !selectedTeacherId ? (
                                    <p className="rounded-xl border border-white/5 bg-slate-950/30 p-3 text-xs text-slate-500">
                                        Please select a teacher above to retrieve university-specific roles.
                                    </p>
                                ) : availableRoles.length === 0 ? (
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                                        No unassigned roles available for this teacher in their university.
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            required
                                            value={selectedRoleId}
                                            onChange={(e) => {
                                                const val = e.target.value ? Number(e.target.value) : "";
                                                setSelectedRoleId(val);
                                            }}
                                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-sm text-white focus:border-cyan-400 focus:outline-none"
                                        >
                                            <option value="">— Select Institutional Role —</option>
                                            {availableRoles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name} {role.enumValue ? `(${role.enumValue})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={14}
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Role Description Card */}
                            {selectedRoleId && typeof selectedRoleId === "number" && (
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs">
                                    {(() => {
                                        const r = availableRoles.find((item) => item.id === selectedRoleId);
                                        if (!r) return null;
                                        const tone = getRoleTone(r.enumValue);
                                        return (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tone.bg} ${tone.text} ${tone.border}`}>
                                                        {r.enumValue || "ROLE"}
                                                    </span>
                                                    <span className="font-semibold text-white">{r.name}</span>
                                                </div>
                                                <p className="text-slate-400">{r.description || "No description provided."}</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Info Banner */}
                            <div className="flex items-start gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-200">
                                <Info size={15} className="mt-0.5 shrink-0 text-cyan-400" />
                                <p className="leading-relaxed">
                                    Assigned roles become active immediately upon submission and grant the faculty member access
                                    to corresponding ERP modules and departmental functions.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    disabled={busy}
                                    className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy || !selectedTeacherId || !selectedRoleId}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:opacity-50"
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={15} className="animate-spin" />
                                            <span>Assigning Role...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={15} />
                                            <span>Confirm Assignment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {/* 2. VIEW DETAILS & AUDIT TRAIL MODAL (Matching University.tsx) */}
                {dialog?.mode === "VIEW" && dialog.record && (
                    <ModalShell
                        title="Faculty Roles & Governance"
                        subtitle={dialog.record.user.name}
                        onClose={() => setDialog(null)}
                        wide
                        icon={Eye}
                        iconTone="cyan"
                    >
                        <div className="space-y-4">
                            {/* Teacher Identity Banner */}
                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/25 to-violet-500/20 font-bold text-sm text-cyan-200">
                                            {getInitials(dialog.record.user.name)}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">
                                                {dialog.record.user.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                Faculty ID #{dialog.record.teacherId}
                                                {dialog.record.user.code && ` · Code: ${dialog.record.user.code}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                                            {dialog.record.roles.length} Assigned Roles
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Roles & Audit Breakdown */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Privileges &amp; Institutional Governance ({dialog.record.roles.length})
                                </p>

                                {dialog.record.roles.length === 0 ? (
                                    <div className="rounded-xl border border-white/5 bg-slate-950/30 p-6 text-center text-slate-400 text-xs">
                                        No custom roles assigned yet. This teacher holds default Instructor permissions.
                                    </div>
                                ) : (
                                    dialog.record.roles.map((role) => {
                                        const tone = getRoleTone(role.enumValue);
                                        return (
                                            <div
                                                key={role.id}
                                                className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3"
                                            >
                                                {/* Role Header */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded px-2 py-0.5 text-xs font-bold border ${tone.bg} ${tone.text} ${tone.border}`}
                                                        >
                                                            {role.enumValue}
                                                        </span>
                                                        <span className="font-bold text-white text-sm">
                                                            {role.name}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                                            role.active
                                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                                        }`}
                                                    >
                                                        {role.active ? "Active" : "Inactive / Suspended"}
                                                    </span>
                                                </div>

                                                {role.description && (
                                                    <p className="text-xs text-slate-300 leading-relaxed">
                                                        {role.description}
                                                    </p>
                                                )}

                                                {/* EXACT Audit Trail & Governance Showcase Matching University.tsx */}
                                                <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 space-y-2.5">
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
                                                        {/* Created By Card (Emerald) */}
                                                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1.5">
                                                            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                                                                <span className="flex items-center gap-1">
                                                                    <UserCheck size={11} /> Created / Assigned By
                                                                </span>
                                                                {role.createdAt && (
                                                                    <span className="text-slate-400 font-mono text-[10px]">
                                                                        {formatDate(role.createdAt)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                                    {getInitials(role.createdBy?.name || "System")}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate font-semibold text-slate-200 text-xs">
                                                                        {role.createdBy?.name || "System Administrator"}
                                                                    </p>
                                                                    {(role.createdBy?.code || role.createdBy?.id) && (
                                                                        <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                            {role.createdBy.code
                                                                                ? `Code: ${role.createdBy.code}`
                                                                                : `ID: #${role.createdBy.id}`}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {role.createdAt && (
                                                                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                                    <Clock size={10} className="text-slate-400 shrink-0" />
                                                                    <span className="truncate">
                                                                        Timestamp: {formatDateTime(role.createdAt)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Modified By Card (Cyan) */}
                                                        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                            <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                                <span className="flex items-center gap-1">
                                                                    <RotateCcw size={11} /> Last Modified By
                                                                </span>
                                                                {(role.updatedAt || role.createdAt) && (
                                                                    <span className="text-slate-400 font-mono text-[10px]">
                                                                        {formatDate(role.updatedAt || role.createdAt)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                                    {getInitials(
                                                                        role.updatedBy?.name ||
                                                                            role.createdBy?.name ||
                                                                            "System"
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate font-semibold text-slate-200 text-xs">
                                                                        {role.updatedBy?.name ||
                                                                            role.createdBy?.name ||
                                                                            "System Administrator"}
                                                                    </p>
                                                                    {(role.updatedBy?.code ||
                                                                        role.updatedBy?.id ||
                                                                        role.createdBy?.code) && (
                                                                        <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                            {role.updatedBy?.code
                                                                                ? `Code: ${role.updatedBy.code}`
                                                                                : role.updatedBy?.id
                                                                                ? `ID: #${role.updatedBy.id}`
                                                                                : `Code: ${role.createdBy?.code}`}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {(role.updatedAt || role.createdAt) && (
                                                                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                                    <Clock size={10} className="text-slate-400 shrink-0" />
                                                                    <span className="truncate">
                                                                        Timestamp:{" "}
                                                                        {formatDateTime(
                                                                            role.updatedAt || role.createdAt
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {/* 3. MANAGE ROLES MODAL */}
                {dialog?.mode === "MANAGE" && dialog.record && (
                    <ModalShell
                        title={`Manage Roles · ${dialog.record.user.name}`}
                        subtitle={`Teacher ID #${dialog.record.teacherId} — Inspect and toggle individual privileges.`}
                        onClose={() => setDialog(null)}
                        wide
                        icon={SlidersHorizontal}
                        iconTone="violet"
                        busy={busy}
                    >
                        <div className="space-y-4">
                            {/* Summary Banner */}
                            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 font-bold text-sm text-cyan-200">
                                        {getInitials(dialog.record.user.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">{dialog.record.user.name}</h3>
                                        <p className="text-xs text-slate-400">
                                            Institutional ID: #{dialog.record.teacherId}
                                            {dialog.record.user.code && ` · Username: ${dialog.record.user.code}`}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!dialog.record) return;
                                        setSelectedTeacherId(dialog.record.teacherId);
                                        setSelectedRoleId("");
                                        setDialog({ mode: "ASSIGN", targetTeacherId: dialog.record.teacherId });
                                    }}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition"
                                >
                                    <Plus size={14} /> Assign Another Role
                                </button>
                            </div>

                            {/* Roles List */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Assigned Institutional Roles ({dialog.record.roles.length})
                                </p>

                                {dialog.record.roles.length === 0 ? (
                                    <div className="rounded-xl border border-white/5 bg-slate-950/30 p-6 text-center text-slate-400 text-xs">
                                        No custom roles assigned to this teacher yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-slate-950/30 overflow-hidden">
                                        {dialog.record.roles.map((role) => {
                                            const tone = getRoleTone(role.enumValue);
                                            return (
                                                <div
                                                    key={role.id}
                                                    className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.02]"
                                                >
                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span
                                                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${tone.bg} ${tone.text} ${tone.border}`}
                                                            >
                                                                {role.enumValue}
                                                            </span>
                                                            <span className="font-semibold text-white text-sm">
                                                                {role.name}
                                                            </span>
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                                                    role.active
                                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                                                }`}
                                                            >
                                                                {role.active ? "Active" : "Inactive"}
                                                            </span>
                                                        </div>
                                                        {role.description && (
                                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                                {role.description}
                                                            </p>
                                                        )}
                                                        {role.createdBy && (
                                                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                                                <UserCheck size={11} className="text-emerald-400" />
                                                                <span>Assigned by: {role.createdBy.name}</span>
                                                                {role.createdAt && <span>· {formatDate(role.createdAt)}</span>}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!dialog.record) return;
                                                                setDialog({
                                                                    mode: "CONFIRM_TOGGLE",
                                                                    record: dialog.record,
                                                                    targetRole: role,
                                                                    nextStatus: !role.active,
                                                                });
                                                            }}
                                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                                                role.active
                                                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                                            }`}
                                                        >
                                                            {role.active ? (
                                                                <>
                                                                    <ToggleRight size={14} /> Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ToggleLeft size={14} /> Activate
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setDialog(null)}
                                    className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {/* 4. CONFIRM STATUS TOGGLE MODAL */}
                {dialog?.mode === "CONFIRM_TOGGLE" && dialog.record && dialog.targetRole && (
                    <ModalShell
                        title={dialog.nextStatus ? "Activate Role?" : "Deactivate Role?"}
                        subtitle={`Target: ${dialog.record.user.name} — ${dialog.targetRole.name}`}
                        onClose={() => {
                            if (!dialog.record) return;
                            setDialog({ mode: "MANAGE", record: dialog.record });
                        }}
                        icon={AlertTriangle}
                        iconTone={dialog.nextStatus ? "emerald" : "amber"}
                        busy={busy}
                    >
                        <div className="space-y-4">
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Are you sure you want to {dialog.nextStatus ? "activate" : "deactivate"} the role{" "}
                                <strong className="text-white">&quot;{dialog.targetRole.name}&quot;</strong> for{" "}
                                <strong className="text-cyan-300">{dialog.record.user.name}</strong>?
                            </p>

                            {!dialog.nextStatus && (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed">
                                    Deactivating this role will immediately revoke all privileges and dashboard access associated with
                                    this role until re-enabled.
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                        if (!dialog.record) return;
                                        setDialog({ mode: "MANAGE", record: dialog.record });
                                    }}
                                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleExecuteStatusToggle()}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                                        dialog.nextStatus
                                            ? "bg-emerald-600 hover:bg-emerald-500"
                                            : "bg-amber-600 hover:bg-amber-500"
                                    }`}
                                >
                                    {busy ? (
                                        <>
                                            <LoaderCircle size={14} className="animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            <span>Confirm {dialog.nextStatus ? "Activation" : "Deactivation"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>
        </motion.main>
    );
}
