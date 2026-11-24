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
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    DoorOpen,
    Eye,
    GraduationCap,
    LayoutGrid,
    Library,
    LoaderCircle,
    Monitor,
    Pencil,
    Plus,
    Projector,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import {
    createRoom,
    deleteRoom,
    extractErrorMessage,
    formatAuditActor,
    formatDate,
    formatDateTime,
    getAllRooms,
    getInitials,
    getSchoolFilter,
    uniqueCommonDTOs,
    updateRoom,
    type CommonDTO,
    type PermissionAction,
    type RoomRequest,
    type RoomResponse,
    type RoomType,
} from "@/services/timetable/RoomService";

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type BooleanFilter = "ALL" | "YES" | "NO";
type SortOption =
    | "NEWEST"
    | "ROOM_ASC"
    | "ROOM_DESC"
    | "CAPACITY_DESC"
    | "CAPACITY_ASC";

interface RoomForm {
    schoolId: number | "";
    roomNumber: string;
    buildingName: string;
    floorNumber: string;
    rows: string;
    columns: string;
    roomType: RoomType | "";
    hasProjector: boolean;
    hasComputers: boolean;
}

interface FieldErrors {
    schoolId?: string;
    roomNumber?: string;
    buildingName?: string;
    floorNumber?: string;
    rows?: string;
    columns?: string;
    roomType?: string;
}

interface RoomDialogProps {
    mode: DialogMode;
    room: RoomResponse | null;
    schools: CommonDTO[];
    schoolsLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (schoolId: number, request: RoomRequest) => Promise<void>;
    onUpdate: (roomId: number, request: RoomRequest) => Promise<void>;
    onDelete: (roomId: number) => Promise<void>;
}

const EMPTY_FORM: RoomForm = {
    schoolId: "",
    roomNumber: "",
    buildingName: "",
    floorNumber: "1",
    rows: "6",
    columns: "10",
    roomType: "CLASSROOM",
    hasProjector: false,
    hasComputers: false,
};

/* -------------------------------------------------------------------------- */
/* Helpers & Visual Utilities                                                 */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function formatNumber(value: number | null | undefined): string {
    return typeof value === "number" && Number.isFinite(value)
        ? new Intl.NumberFormat("en-IN").format(value)
        : "0";
}

function formatRoomType(type?: RoomType | null): string {
    if (!type) return "Classroom";
    switch (type) {
        case "CLASSROOM":
            return "Classroom";
        case "LABORATORY":
            return "Laboratory";
        case "SEMINAR_HALL":
            return "Seminar Hall";
        case "AUDITORIUM":
            return "Auditorium";
        case "VIRTUAL":
            return "Virtual Room";
        default:
            return type;
    }
}

function hasPermission(room: RoomResponse, action: PermissionAction): boolean {
    return (
        Array.isArray(room.permissionActions) &&
        room.permissionActions.includes(action)
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

function FieldError({ children }: { children?: string }) {
    if (!children) return null;
    return (
        <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 flex items-start gap-1.5 text-xs text-rose-400"
            role="alert"
        >
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </motion.p>
    );
}

function RoomTypeBadge({ type }: { type: RoomType }) {
    let classes = "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
    if (type === "LABORATORY") {
        classes = "border-purple-400/30 bg-purple-500/10 text-purple-300";
    } else if (type === "AUDITORIUM") {
        classes = "border-amber-400/30 bg-amber-500/10 text-amber-300";
    } else if (type === "SEMINAR_HALL") {
        classes = "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    } else if (type === "VIRTUAL") {
        classes = "border-sky-400/30 bg-sky-500/10 text-sky-300";
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${classes}`}
        >
            <DoorOpen size={12} className="shrink-0" />
            <span>{formatRoomType(type)}</span>
        </span>
    );
}

function GlassCard({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Modal Dialog Component                                                     */
/* -------------------------------------------------------------------------- */

function RoomDialog({
    mode,
    room,
    schools,
    schoolsLoading,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: RoomDialogProps) {
    const reduceMotion = useReducedMotion();
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<RoomForm>(() => {
        if (!room) return EMPTY_FORM;
        return {
            schoolId: room.school?.id ?? "",
            roomNumber: room.roomNumber ?? "",
            buildingName: room.buildingName ?? "",
            floorNumber: room.floorNumber != null ? String(room.floorNumber) : "1",
            rows: room.rows != null ? String(room.rows) : "6",
            columns: room.columns != null ? String(room.columns) : "10",
            roomType: room.roomType ?? "CLASSROOM",
            hasProjector: Boolean(room.hasProjector),
            hasComputers: Boolean(room.hasComputers),
        };
    });

    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Live computed capacity
    const calculatedCapacity = useMemo(() => {
        const r = Number(form.rows);
        const c = Number(form.columns);
        if (Number.isFinite(r) && Number.isFinite(c) && r > 0 && c > 0) {
            return r * c;
        }
        return 0;
    }, [form.rows, form.columns]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function validate(): boolean {
        const errors: FieldErrors = {};
        const sId = Number(form.schoolId);
        const fl = Number(form.floorNumber);
        const r = Number(form.rows);
        const c = Number(form.columns);

        if (isCreate) {
            if (!form.schoolId || !Number.isFinite(sId) || sId <= 0) {
                errors.schoolId = "Please select a school for this room.";
            }
        }

        if (!form.roomNumber.trim()) {
            errors.roomNumber = "Room number is required (e.g. 101-A).";
        } else if (form.roomNumber.trim().length > 50) {
            errors.roomNumber = "Room number cannot exceed 50 characters.";
        }

        if (form.buildingName.trim().length > 100) {
            errors.buildingName = "Building name cannot exceed 100 characters.";
        }

        if (!form.floorNumber.trim() || !Number.isFinite(fl) || fl < -5 || fl > 200) {
            errors.floorNumber = "Provide a valid floor number (e.g. 0, 1, 2).";
        }

        if (!form.rows.trim() || !Number.isFinite(r) || r <= 0) {
            errors.rows = "Rows must be greater than 0.";
        }

        if (!form.columns.trim() || !Number.isFinite(c) || c <= 0) {
            errors.columns = "Columns must be greater than 0.";
        }

        if (!form.roomType) {
            errors.roomType = "Please select a room type.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setDialogError("");

        if (isDelete && room) {
            try {
                await onDelete(room.id);
            } catch (err) {
                setDialogError(extractErrorMessage(err));
            }
            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (!validate()) return;

        const request: RoomRequest = {
            roomNumber: form.roomNumber.trim(),
            buildingName: form.buildingName.trim(),
            floorNumber: Number(form.floorNumber),
            rows: Number(form.rows),
            columns: Number(form.columns),
            roomType: form.roomType as RoomType,
            hasProjector: form.hasProjector,
            hasComputers: form.hasComputers,
        };

        try {
            if (isCreate) {
                await onCreate(Number(form.schoolId), request);
            } else if (isEdit && room) {
                await onUpdate(room.id, request);
            }
        } catch (err) {
            setDialogError(extractErrorMessage(err));
        }
    }

    const titleMap: Record<DialogMode, string> = {
        CREATE: "Create Room",
        EDIT: `Edit Room · ${room?.roomNumber ?? ""}`,
        VIEW: `Room Details · ${room?.roomNumber ?? ""}`,
        DELETE: `Delete Room · ${room?.roomNumber ?? ""}`,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
            {/* Backdrop */}
            <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (!busy) onClose();
                }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Dialog Container */}
            <motion.section
                role="dialog"
                aria-modal="true"
                aria-labelledby="room-dialog-title"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex max-h-[94vh] sm:max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/80"
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Campus Infrastructure · Facility Assets
                        </p>
                        <h2
                            id="room-dialog-title"
                            className="mt-0.5 text-base sm:text-lg font-bold text-white truncate"
                        >
                            {titleMap[mode]}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white shrink-0 ml-2 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Error Banner */}
                        <AnimatePresence>
                            {dialogError && (
                                <motion.div
                                    role="alert"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200"
                                >
                                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-rose-300">Action blocked</p>
                                        <p className="mt-0.5 leading-relaxed text-rose-200/90">{dialogError}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDialogError("")}
                                        className="text-rose-400 hover:text-rose-200"
                                        aria-label="Dismiss error"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* DELETE MODE */}
                        {isDelete && (
                            <div className="space-y-3.5">
                                <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 sm:p-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                                        <Trash2 size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white">
                                            Confirm Room Deletion
                                        </p>
                                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                            Are you sure you want to permanently delete room{" "}
                                            <strong className="text-white">{room?.roomNumber}</strong> in building{" "}
                                            <strong className="text-white">{room?.buildingName || "Main Block"}</strong>{" "}
                                            ({room?.school?.name})?
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed">
                                    <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                                        <ShieldAlert size={14} className="text-amber-400" />
                                        Timetable Dependency Notice
                                    </p>
                                    <p className="mt-1 text-amber-200/90">
                                        Deleting this room will remove its seat allocation layout and availability slots. If this room is currently scheduled in active academic timetables or class sessions, please reassign those sessions first.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* CREATE / EDIT / VIEW MODES */}
                        {!isDelete && (
                            <>
                                {/* School Selector (CREATE) or Read-Only Card (EDIT/VIEW) */}
                                {isCreate ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label
                                                htmlFor="room-school"
                                                className="text-xs font-semibold text-slate-300"
                                            >
                                                Parent School <span className="text-cyan-400">*</span>
                                            </label>
                                            {schoolsLoading && (
                                                <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                                                    <LoaderCircle size={11} className="animate-spin" /> Loading schools...
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <select
                                                id="room-school"
                                                value={form.schoolId}
                                                onChange={(e) => {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        schoolId: e.target.value ? Number(e.target.value) : "",
                                                    }));
                                                    if (fieldErrors.schoolId) {
                                                        setFieldErrors((prev) => ({ ...prev, schoolId: undefined }));
                                                    }
                                                    setDialogError("");
                                                }}
                                                disabled={busy || schoolsLoading || schools.length === 0}
                                                className={`w-full appearance-none rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition ${
                                                    fieldErrors.schoolId
                                                        ? "border-rose-500/60 focus:border-rose-400"
                                                        : "border-white/10 focus:border-cyan-400/60"
                                                }`}
                                            >
                                                <option value="" className="bg-slate-900 text-slate-400">
                                                    Select school...
                                                </option>
                                                {schools.map((school) => (
                                                    <option
                                                        key={school.id}
                                                        value={school.id}
                                                        className="bg-slate-900 text-white"
                                                    >
                                                        {school.name} ({school.code || `ID #${school.id}`})
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        <FieldError>{fieldErrors.schoolId}</FieldError>
                                    </div>
                                ) : (
                                    /* Read-only hierarchy card in EDIT / VIEW */
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Institutional Hierarchy
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">Affiliated School</p>
                                                <p className="font-semibold text-white truncate mt-0.5">
                                                    {room?.school?.name || "—"}
                                                </p>
                                                <p className="text-[10px] text-cyan-300 font-mono">
                                                    {room?.school?.code || `ID #${room?.school?.id || ""}`}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                                <p className="text-[10px] text-slate-400 uppercase">Parent University</p>
                                                <p className="font-semibold text-white truncate mt-0.5">
                                                    {room?.university?.name || "—"}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    {room?.university?.code || `ID #${room?.university?.id || ""}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Room Number & Room Type Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Room Number */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label
                                                htmlFor="room-number"
                                                className="text-xs font-semibold text-slate-300"
                                            >
                                                Room Number <span className="text-cyan-400">*</span>
                                            </label>
                                            <span className="text-[11px] text-slate-500">{form.roomNumber.length}/50</span>
                                        </div>
                                        <input
                                            id="room-number"
                                            value={form.roomNumber}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, roomNumber: e.target.value }));
                                                if (fieldErrors.roomNumber) {
                                                    setFieldErrors((prev) => ({ ...prev, roomNumber: undefined }));
                                                }
                                                setDialogError("");
                                            }}
                                            readOnly={readOnly || busy}
                                            maxLength={50}
                                            placeholder="e.g. 101-A, LAB-2"
                                            className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 ${
                                                fieldErrors.roomNumber
                                                    ? "border-rose-500/60 focus:border-rose-400"
                                                    : "border-white/10 focus:border-cyan-400/60"
                                            } read-only:opacity-75 disabled:opacity-50`}
                                        />
                                        <FieldError>{fieldErrors.roomNumber}</FieldError>
                                    </div>

                                    {/* Room Type */}
                                    <div>
                                        <label
                                            htmlFor="room-type"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            Room Classification <span className="text-cyan-400">*</span>
                                        </label>
                                        {isView ? (
                                            <div className="pt-1">
                                                <RoomTypeBadge type={form.roomType as RoomType} />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    id="room-type"
                                                    value={form.roomType}
                                                    onChange={(e) => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            roomType: e.target.value as RoomType,
                                                        }));
                                                        if (fieldErrors.roomType) {
                                                            setFieldErrors((prev) => ({ ...prev, roomType: undefined }));
                                                        }
                                                        setDialogError("");
                                                    }}
                                                    disabled={busy}
                                                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-50"
                                                >
                                                    <option value="CLASSROOM" className="bg-slate-900 text-white">Classroom</option>
                                                    <option value="LABORATORY" className="bg-slate-900 text-white">Laboratory</option>
                                                    <option value="SEMINAR_HALL" className="bg-slate-900 text-white">Seminar Hall</option>
                                                    <option value="AUDITORIUM" className="bg-slate-900 text-white">Auditorium</option>
                                                    <option value="VIRTUAL" className="bg-slate-900 text-white">Virtual Room</option>
                                                </select>
                                                <SelectChevron />
                                            </div>
                                        )}
                                        <FieldError>{fieldErrors.roomType}</FieldError>
                                    </div>
                                </div>

                                {/* Building Name & Floor Number Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label
                                            htmlFor="room-building"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            Building / Block Name
                                        </label>
                                        <input
                                            id="room-building"
                                            value={form.buildingName}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, buildingName: e.target.value }));
                                                if (fieldErrors.buildingName) {
                                                    setFieldErrors((prev) => ({ ...prev, buildingName: undefined }));
                                                }
                                                setDialogError("");
                                            }}
                                            readOnly={readOnly || busy}
                                            maxLength={100}
                                            placeholder="e.g. Science Block, Academic Wing B"
                                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 read-only:opacity-75 disabled:opacity-50"
                                        />
                                        <FieldError>{fieldErrors.buildingName}</FieldError>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="room-floor"
                                            className="block text-xs font-semibold text-slate-300 mb-1"
                                        >
                                            Floor Level <span className="text-cyan-400">*</span>
                                        </label>
                                        <input
                                            id="room-floor"
                                            type="number"
                                            value={form.floorNumber}
                                            onChange={(e) => {
                                                setForm((prev) => ({ ...prev, floorNumber: e.target.value }));
                                                if (fieldErrors.floorNumber) {
                                                    setFieldErrors((prev) => ({ ...prev, floorNumber: undefined }));
                                                }
                                                setDialogError("");
                                            }}
                                            readOnly={readOnly || busy}
                                            placeholder="e.g. 1 (Ground = 0)"
                                            className={`w-full rounded-xl border bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 ${
                                                fieldErrors.floorNumber
                                                    ? "border-rose-500/60 focus:border-rose-400"
                                                    : "border-white/10 focus:border-cyan-400/60"
                                            } read-only:opacity-75 disabled:opacity-50`}
                                        />
                                        <FieldError>{fieldErrors.floorNumber}</FieldError>
                                    </div>
                                </div>

                                {/* Seating Architecture: Rows, Columns, Computed Capacity */}
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <LayoutGrid size={13} className="text-cyan-400" />
                                            Seating Layout & Capacity Dimensions
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            Formula: Rows × Columns
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5">
                                        <div>
                                            <label
                                                htmlFor="room-rows"
                                                className="block text-[11px] font-medium text-slate-400 mb-1"
                                            >
                                                Rows <span className="text-cyan-400">*</span>
                                            </label>
                                            <input
                                                id="room-rows"
                                                type="number"
                                                min="1"
                                                value={form.rows}
                                                onChange={(e) => {
                                                    setForm((prev) => ({ ...prev, rows: e.target.value }));
                                                    if (fieldErrors.rows) {
                                                        setFieldErrors((prev) => ({ ...prev, rows: undefined }));
                                                    }
                                                    setDialogError("");
                                                }}
                                                readOnly={readOnly || busy}
                                                placeholder="e.g. 6"
                                                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400/60 read-only:opacity-75"
                                            />
                                            <FieldError>{fieldErrors.rows}</FieldError>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="room-cols"
                                                className="block text-[11px] font-medium text-slate-400 mb-1"
                                            >
                                                Columns <span className="text-cyan-400">*</span>
                                            </label>
                                            <input
                                                id="room-cols"
                                                type="number"
                                                min="1"
                                                value={form.columns}
                                                onChange={(e) => {
                                                    setForm((prev) => ({ ...prev, columns: e.target.value }));
                                                    if (fieldErrors.columns) {
                                                        setFieldErrors((prev) => ({ ...prev, columns: undefined }));
                                                    }
                                                    setDialogError("");
                                                }}
                                                readOnly={readOnly || busy}
                                                placeholder="e.g. 10"
                                                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400/60 read-only:opacity-75"
                                            />
                                            <FieldError>{fieldErrors.columns}</FieldError>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                                Total Capacity
                                            </label>
                                            <div className="flex h-[34px] items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 text-xs font-bold text-emerald-300">
                                                <Users size={12} />
                                                <span>{calculatedCapacity || "—"} seats</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities & IT Equipment Checkboxes */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                        className={`flex items-center justify-between rounded-xl border p-3 transition ${
                                            form.hasProjector
                                                ? "border-cyan-400/40 bg-cyan-500/10"
                                                : "border-white/10 bg-slate-950/60"
                                        } ${readOnly || busy ? "cursor-default" : "cursor-pointer hover:bg-white/5"}`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                    form.hasProjector
                                                        ? "bg-cyan-500/20 text-cyan-300"
                                                        : "bg-white/5 text-slate-400"
                                                }`}
                                            >
                                                <Projector size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white">Projector Installed</p>
                                                <p className="text-[10px] text-slate-400 truncate">Audiovisual presentation unit</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={form.hasProjector}
                                            onChange={(e) => {
                                                if (!readOnly && !busy) {
                                                    setForm((prev) => ({ ...prev, hasProjector: e.target.checked }));
                                                    setDialogError("");
                                                }
                                            }}
                                            disabled={readOnly || busy}
                                            className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-500 shrink-0 ml-2"
                                        />
                                    </label>

                                    <label
                                        className={`flex items-center justify-between rounded-xl border p-3 transition ${
                                            form.hasComputers
                                                ? "border-purple-400/40 bg-purple-500/10"
                                                : "border-white/10 bg-slate-950/60"
                                        } ${readOnly || busy ? "cursor-default" : "cursor-pointer hover:bg-white/5"}`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                    form.hasComputers
                                                        ? "bg-purple-500/20 text-purple-300"
                                                        : "bg-white/5 text-slate-400"
                                                }`}
                                            >
                                                <Monitor size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white">Computer Workstations</p>
                                                <p className="text-[10px] text-slate-400 truncate">Student PC lab terminals</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={form.hasComputers}
                                            onChange={(e) => {
                                                if (!readOnly && !busy) {
                                                    setForm((prev) => ({ ...prev, hasComputers: e.target.checked }));
                                                    setDialogError("");
                                                }
                                            }}
                                            disabled={readOnly || busy}
                                            className="h-4 w-4 rounded border-white/20 bg-slate-900 text-purple-500 focus:ring-purple-500 shrink-0 ml-2"
                                        />
                                    </label>
                                </div>

                                {/* VIEW ONLY: Exact University.tsx Audit Trail & Governance Showcase */}
                                {isView && room && (
                                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2.5 pt-3 border-t border-white/10">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                                <ShieldCheck size={13} className="text-emerald-400" />
                                                Audit Trail & Governance
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
                                                    {room.createdAt && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(room.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                        {getInitials(room.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {room.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(room.createdBy?.code || room.createdBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {room.createdBy.code
                                                                    ? `Code: ${room.createdBy.code}`
                                                                    : `ID: #${room.createdBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {room.createdAt && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(room.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Last Modified By Card */}
                                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <RotateCcw size={11} /> Last Modified By
                                                    </span>
                                                    {(room.updatedAt || room.createdAt) && (
                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                            {formatDate(room.updatedAt || room.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                        {getInitials(room.updatedBy?.name || room.createdBy?.name || "System")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-200 text-xs">
                                                            {room.updatedBy?.name || room.createdBy?.name || "System Administrator"}
                                                        </p>
                                                        {(room.updatedBy?.code || room.updatedBy?.id) && (
                                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                                {room.updatedBy.code
                                                                    ? `Code: ${room.updatedBy.code}`
                                                                    : `ID: #${room.updatedBy.id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(room.updatedAt || room.createdAt) && (
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">Timestamp: {formatDateTime(room.updatedAt || room.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex flex-col-reverse gap-2 pt-3 border-t border-white/10 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={busy}
                                className="w-full sm:w-auto rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                            >
                                {isView ? "Close" : "Cancel"}
                            </button>
                            {!isView && (
                                <button
                                    type="submit"
                                    disabled={busy || (isCreate && schools.length === 0)}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                                        isDelete
                                            ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                            : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                    }`}
                                >
                                    {busy && <LoaderCircle size={14} className="animate-spin" />}
                                    <span>
                                        {isDelete
                                            ? "Delete Room"
                                            : isEdit
                                                ? "Save Changes"
                                                : "Create Room"}
                                    </span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </motion.section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function Rooms() {
    const reduceMotion = useReducedMotion();

    // Data States
    const [rooms, setRooms] = useState<RoomResponse[]>([]);
    const [schoolsForCreate, setSchoolsForCreate] = useState<CommonDTO[]>([]);

    // Loading & Status States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [schoolsLoading, setSchoolsLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Modal Dialog State
    const [dialogState, setDialogState] = useState<{
        mode: DialogMode;
        room: RoomResponse | null;
    } | null>(null);

    // Filters State
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<RoomType | "ALL">("ALL");
    const [universityFilter, setUniversityFilter] = useState<number | "ALL">("ALL");
    const [schoolFilter, setSchoolFilter] = useState<number | "ALL">("ALL");
    const [projectorFilter, setProjectorFilter] = useState<BooleanFilter>("ALL");
    const [computerFilter, setComputerFilter] = useState<BooleanFilter>("ALL");
    const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);

    // Initial Data Fetch
    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setPageError("");

        try {
            const data = await getAllRooms();
            setRooms(data);
        } catch (err) {
            setPageError(extractErrorMessage(err, "Failed to load room facilities."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadSchools = useCallback(async () => {
        setSchoolsLoading(true);
        try {
            const list = await getSchoolFilter();
            setSchoolsForCreate(uniqueCommonDTOs(list));
        } catch (err) {
            console.warn("Failed to preload schools for creation:", err);
        } finally {
            setSchoolsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
        void loadSchools();
    }, [loadData, loadSchools]);

    // Clear notices after 5 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    // Unique options derived from loaded records
    const universityOptions = useMemo(() => {
        return uniqueCommonDTOs(rooms.map((r) => r.university));
    }, [rooms]);

    const schoolOptions = useMemo(() => {
        const filtered =
            universityFilter === "ALL"
                ? rooms
                : rooms.filter((r) => r.university?.id === universityFilter);
        return uniqueCommonDTOs(filtered.map((r) => r.school));
    }, [rooms, universityFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        typeFilter,
        universityFilter,
        schoolFilter,
        projectorFilter,
        computerFilter,
        sortBy,
    ]);

    // Filter & Sort
    const filteredRooms = useMemo(() => {
        const q = text(search);

        return rooms.filter((r) => {
            if (q) {
                const rn = text(r.roomNumber);
                const bn = text(r.buildingName);
                const sn = text(r.school?.name);
                const un = text(r.university?.name);
                const fl = text(r.floorNumber);
                if (
                    !rn.includes(q) &&
                    !bn.includes(q) &&
                    !sn.includes(q) &&
                    !un.includes(q) &&
                    !fl.includes(q)
                ) {
                    return false;
                }
            }

            if (typeFilter !== "ALL" && r.roomType !== typeFilter) {
                return false;
            }

            if (universityFilter !== "ALL" && r.university?.id !== universityFilter) {
                return false;
            }

            if (schoolFilter !== "ALL" && r.school?.id !== schoolFilter) {
                return false;
            }

            if (projectorFilter === "YES" && !r.hasProjector) return false;
            if (projectorFilter === "NO" && r.hasProjector) return false;

            if (computerFilter === "YES" && !r.hasComputers) return false;
            if (computerFilter === "NO" && r.hasComputers) return false;

            return true;
        });
    }, [
        rooms,
        search,
        typeFilter,
        universityFilter,
        schoolFilter,
        projectorFilter,
        computerFilter,
    ]);

    const sortedRooms = useMemo(() => {
        return [...filteredRooms].sort((a, b) => {
            switch (sortBy) {
                case "ROOM_ASC":
                    return (a.roomNumber || "").localeCompare(b.roomNumber || "");
                case "ROOM_DESC":
                    return (b.roomNumber || "").localeCompare(a.roomNumber || "");
                case "CAPACITY_DESC":
                    return (b.capacity ?? 0) - (a.capacity ?? 0);
                case "CAPACITY_ASC":
                    return (a.capacity ?? 0) - (b.capacity ?? 0);
                case "NEWEST":
                default:
                    return b.id - a.id;
            }
        });
    }, [filteredRooms, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedRooms.length / PAGE_SIZE));
    const paginatedRooms = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedRooms.slice(start, start + PAGE_SIZE);
    }, [sortedRooms, currentPage]);

    // Statistics
    const metrics = useMemo(() => {
        const total = rooms.length;
        const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
        const labs = rooms.filter(
            (r) => r.roomType === "LABORATORY" || r.hasComputers
        ).length;
        const projectors = rooms.filter((r) => r.hasProjector).length;
        return { total, totalCapacity, labs, projectors };
    }, [rooms]);

    const hasActiveFilters =
        Boolean(search.trim()) ||
        typeFilter !== "ALL" ||
        universityFilter !== "ALL" ||
        schoolFilter !== "ALL" ||
        projectorFilter !== "ALL" ||
        computerFilter !== "ALL" ||
        sortBy !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setTypeFilter("ALL");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setProjectorFilter("ALL");
        setComputerFilter("ALL");
        setSortBy("NEWEST");
    }

    // Modal Operations
    function openDialog(mode: DialogMode, room: RoomResponse | null = null) {
        setDialogState({ mode, room });
    }

    function closeDialog() {
        setDialogState(null);
    }

    async function handleCreate(schoolId: number, request: RoomRequest) {
        setBusy(true);
        try {
            const created = await createRoom(schoolId, request);
            setRooms((prev) => [created, ...prev]);
            closeDialog();
            setNotice(`Room "${created.roomNumber}" created successfully.`);
            toast.success("Room created successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(roomId: number, request: RoomRequest) {
        setBusy(true);
        try {
            const updated = await updateRoom(roomId, request);
            setRooms((prev) => prev.map((r) => (r.id === roomId ? updated : r)));
            closeDialog();
            setNotice(`Room "${updated.roomNumber}" updated successfully.`);
            toast.success("Room updated successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(roomId: number) {
        setBusy(true);
        try {
            const msg = await deleteRoom(roomId);
            setRooms((prev) => prev.filter((r) => r.id !== roomId));
            closeDialog();
            setNotice(msg);
            toast.success(msg);
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-5 p-3 text-slate-100 sm:space-y-6 sm:p-5 lg:p-7"
        >
            {/* Header & Breadcrumbs */}
            <section className="space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span className="truncate">Infrastructure & Timetable</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Rooms</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Campus Infrastructure & Physical Facilities
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Rooms & Facilities
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Manage lecture halls, laboratory spaces, seating capacities, and multimedia IT equipment.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            title="Refresh rooms list"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-3 sm:text-sm disabled:opacity-50"
                        >
                            <RefreshCw size={15} className={refreshing || loading ? "animate-spin text-cyan-400" : ""} />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => openDialog("CREATE")}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Add Room</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Alert / Notice Banner */}
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
                                <p className="font-semibold text-white">{pageError ? "Action Required" : "Success"}</p>
                                <p className="mt-0.5 leading-relaxed">{pageError || notice}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {pageError && (
                                <button
                                    type="button"
                                    onClick={() => void loadData()}
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
                aria-label="Room facilities statistics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    {
                        label: "Total Rooms",
                        value: formatNumber(metrics.total),
                        sub: "Classrooms & halls",
                        icon: DoorOpen,
                        color: "from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30",
                    },
                    {
                        label: "Total Capacity",
                        value: formatNumber(metrics.totalCapacity),
                        sub: "Total campus seats",
                        icon: LayoutGrid,
                        color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
                    },
                    {
                        label: "Labs & PC Workstations",
                        value: formatNumber(metrics.labs),
                        sub: "Computer-equipped",
                        icon: Monitor,
                        color: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
                    },
                    {
                        label: "AV & Projectors",
                        value: formatNumber(metrics.projectors),
                        sub: "Presentation-ready",
                        icon: Projector,
                        color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
                    },
                ].map((stat) => (
                    <GlassCard key={stat.label} className="p-3.5 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-400">
                                {stat.label}
                            </span>
                            <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border bg-gradient-to-br ${stat.color}`}>
                                <stat.icon size={17} />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
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
                    {/* Top Row: Search + Type + Sort + Reset */}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search room number, building, school, floor..."
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

                        {/* Room Type Filter */}
                        <div className="relative min-w-[140px]">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as RoomType | "ALL")}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Classifications</option>
                                <option value="CLASSROOM" className="bg-slate-900 text-white">Classrooms</option>
                                <option value="LABORATORY" className="bg-slate-900 text-white">Laboratories</option>
                                <option value="SEMINAR_HALL" className="bg-slate-900 text-white">Seminar Halls</option>
                                <option value="AUDITORIUM" className="bg-slate-900 text-white">Auditoriums</option>
                                <option value="VIRTUAL" className="bg-slate-900 text-white">Virtual Rooms</option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Sort Order */}
                        <div className="relative min-w-[150px]">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="NEWEST" className="bg-slate-900 text-white">Newest First</option>
                                <option value="ROOM_ASC" className="bg-slate-900 text-white">Room Number (A-Z)</option>
                                <option value="ROOM_DESC" className="bg-slate-900 text-white">Room Number (Z-A)</option>
                                <option value="CAPACITY_DESC" className="bg-slate-900 text-white">Capacity (High-Low)</option>
                                <option value="CAPACITY_ASC" className="bg-slate-900 text-white">Capacity (Low-High)</option>
                            </select>
                            <ArrowDownUp size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Clear Filters */}
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

                    {/* Secondary Row: Cascading Hierarchy & Amenities Filters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                        {/* University */}
                        <div className="relative">
                            <select
                                value={universityFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setUniversityFilter(val);
                                    setSchoolFilter("ALL");
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Universities</option>
                                {universityOptions.map((u) => (
                                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* School */}
                        <div className="relative">
                            <select
                                value={schoolFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSchoolFilter(val);
                                }}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">All Schools</option>
                                {schoolOptions.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Projector Filter */}
                        <div className="relative">
                            <select
                                value={projectorFilter}
                                onChange={(e) => setProjectorFilter(e.target.value as BooleanFilter)}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">Projector: All</option>
                                <option value="YES" className="bg-slate-900 text-white">Has Projector</option>
                                <option value="NO" className="bg-slate-900 text-white">No Projector</option>
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Computer Filter */}
                        <div className="relative">
                            <select
                                value={computerFilter}
                                onChange={(e) => setComputerFilter(e.target.value as BooleanFilter)}
                                className="w-full appearance-none rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1.5 text-[11px] text-slate-300 outline-none transition focus:border-cyan-400/40"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">Computers: All</option>
                                <option value="YES" className="bg-slate-900 text-white">Has Computers</option>
                                <option value="NO" className="bg-slate-900 text-white">No Computers</option>
                            </select>
                            <SelectChevron />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* List Presentation & Dual-View */}
            <GlassCard>
                {/* Desktop Table View (hidden on sm/mobile) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <th scope="col" className="px-5 py-4 w-12 text-center">#</th>
                                <th scope="col" className="px-4 py-4 min-w-[200px]">Room & Creator</th>
                                <th scope="col" className="px-4 py-4 min-w-[180px]">School & University</th>
                                <th scope="col" className="px-4 py-4 min-w-[150px]">Building & Floor</th>
                                <th scope="col" className="px-4 py-4">Type</th>
                                <th scope="col" className="px-4 py-4 text-center">Grid / Capacity</th>
                                <th scope="col" className="px-4 py-4 text-center">IT Amenities</th>
                                <th scope="col" className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="inline-flex flex-col items-center justify-center gap-3">
                                            <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                                            <p className="font-semibold text-slate-200">Loading rooms & facilities...</p>
                                            <p className="text-xs text-slate-400">Fetching campus layout and seating allocations</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageError && rooms.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">Failed to load rooms</p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">{pageError}</p>
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
                            ) : paginatedRooms.length > 0 ? (
                                paginatedRooms.map((r, index) => {
                                    const canEdit = hasPermission(r, "UPDATE");
                                    const canDelete = hasPermission(r, "DELETE");

                                    return (
                                        <motion.tr
                                            key={r.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.035]"
                                        >
                                            {/* Index */}
                                            <td className="px-5 py-4 text-slate-500 text-xs text-center">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>

                                            {/* Room Number & Creator Pill (Matching University.tsx) */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                        <DoorOpen size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {r.roomNumber || "Unnamed Room"}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                ID #{r.id}
                                                            </span>
                                                            <span className="text-slate-600">·</span>
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                title={`Created by: ${formatAuditActor(r.createdBy)}${r.createdAt ? ` on ${formatDate(r.createdAt)}` : ""}${r.updatedBy?.name ? ` | Modified by: ${formatAuditActor(r.updatedBy)}` : ""}`}
                                                            >
                                                                <UserCheck size={11} className="text-emerald-400 shrink-0" />
                                                                <span className="truncate max-w-[120px] font-medium text-slate-300">
                                                                    {r.createdBy?.name || "System"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* School & University */}
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-200">
                                                        {r.school?.name || "—"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        {r.university?.name || "—"}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Building & Floor */}
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="truncate text-slate-300">
                                                        {r.buildingName || "Main Block"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        Floor {r.floorNumber ?? "0"}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Type Badge */}
                                            <td className="px-4 py-4">
                                                <RoomTypeBadge type={r.roomType} />
                                            </td>

                                            {/* Grid & Capacity */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-bold text-emerald-300 text-sm">
                                                        {formatNumber(r.capacity)} seats
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        {r.rows} × {r.columns} grid
                                                    </span>
                                                </div>
                                            </td>

                                            {/* IT Amenities */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {r.hasProjector && (
                                                        <span
                                                            title="Projector Available"
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                                                        >
                                                            <Projector size={13} />
                                                        </span>
                                                    )}
                                                    {r.hasComputers && (
                                                        <span
                                                            title="Computer Workstations Available"
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-400/30 bg-purple-500/10 text-purple-300"
                                                        >
                                                            <Monitor size={13} />
                                                        </span>
                                                    )}
                                                    {!r.hasProjector && !r.hasComputers && (
                                                        <span className="text-slate-600 text-xs">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Action Buttons with strict h-8 w-8 shrink-0 */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("VIEW", r)}
                                                        aria-label={`View details of room ${r.roomNumber}`}
                                                        title="View room details"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("EDIT", r)}
                                                            aria-label={`Edit room ${r.roomNumber}`}
                                                            title="Edit room"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("DELETE", r)}
                                                            aria-label={`Delete room ${r.roomNumber}`}
                                                            title="Delete room"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/20"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <DoorOpen size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters ? "No matching rooms found" : "No rooms registered yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search terms or clearing your filters."
                                                : "Get started by registering your campus's first room or lecture hall."}
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
                                                    onClick={() => openDialog("CREATE")}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plus size={14} />
                                                    Add Room
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View (sm:hidden) */}
                <div className="divide-y divide-white/5 sm:hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <LoaderCircle size={28} className="animate-spin text-cyan-400 mx-auto" />
                            <p className="mt-3 text-xs font-semibold text-slate-200">Loading rooms...</p>
                        </div>
                    ) : pageError && rooms.length === 0 ? (
                        <div className="p-6 text-center">
                            <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                            <p className="mt-2 text-xs font-semibold text-white">Failed to load rooms</p>
                            <button
                                type="button"
                                onClick={() => void loadData()}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                            >
                                <RefreshCw size={13} /> Retry
                            </button>
                        </div>
                    ) : paginatedRooms.length > 0 ? (
                        paginatedRooms.map((r) => {
                            const canEdit = hasPermission(r, "UPDATE");
                            const canDelete = hasPermission(r, "DELETE");

                            return (
                                <article key={r.id} className="p-3.5 space-y-3">
                                    {/* Header: Room Number + Type Badge */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-white text-sm truncate">{r.roomNumber}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-slate-400 font-mono text-[11px]">ID #{r.id}</span>
                                                <span className="text-slate-500 text-xs">·</span>
                                                <span className="text-slate-300 text-xs truncate">
                                                    {r.buildingName || "Main Block"} (Fl {r.floorNumber ?? "0"})
                                                </span>
                                            </div>
                                        </div>
                                        <RoomTypeBadge type={r.roomType} />
                                    </div>

                                    {/* Hierarchy & Location Details */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">School:</span>
                                            <span className="font-medium text-white truncate max-w-[200px]">{r.school?.name || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-300">
                                            <span className="text-slate-400 text-[11px]">University:</span>
                                            <span className="text-slate-400 truncate max-w-[200px]">{r.university?.name || "—"}</span>
                                        </div>
                                    </div>

                                    {/* Capacity & Amenities Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                            <span className="text-[10px] text-slate-400 uppercase">Seating Capacity</span>
                                            <p className="font-bold text-emerald-300 mt-0.5">
                                                {formatNumber(r.capacity)} seats ({r.rows}×{r.columns})
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                            <span className="text-[10px] text-slate-400 uppercase">Amenities</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {r.hasProjector && (
                                                    <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300">
                                                        <Projector size={10} /> AV
                                                    </span>
                                                )}
                                                {r.hasComputers && (
                                                    <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300">
                                                        <Monitor size={10} /> PCs
                                                    </span>
                                                )}
                                                {!r.hasProjector && !r.hasComputers && (
                                                    <span className="text-[11px] text-slate-500">Standard</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Audit Showcase Pill (matching University.tsx) */}
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                {r.createdBy?.name || "System"}
                                            </span>
                                            {r.createdAt && (
                                                <span className="text-slate-500 font-mono text-[10px]">
                                                    · {formatDate(r.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {r.updatedBy?.name && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="text-slate-500">Updated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {r.updatedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => openDialog("VIEW", r)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                                        >
                                            <Eye size={13} /> Details
                                        </button>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("EDIT", r)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("DELETE", r)}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-xs text-slate-400">
                            No rooms match your criteria.
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {sortedRooms.length === 0
                            ? "Showing 0 rooms"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                                  currentPage * PAGE_SIZE,
                                  sortedRooms.length
                              )} of ${sortedRooms.length} room${
                                  sortedRooms.length === 1 ? "" : "s"
                              }`}
                    </p>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Room pagination"
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

            {/* Modal Dialog */}
            <AnimatePresence>
                {dialogState && (
                    <RoomDialog
                        mode={dialogState.mode}
                        room={dialogState.room}
                        schools={schoolsForCreate}
                        schoolsLoading={schoolsLoading}
                        busy={busy}
                        onClose={closeDialog}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
