// src/pages/Rooms.tsx

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
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    DoorOpen,
    Eye,
    LayoutGrid,
    LoaderCircle,
    Monitor,
    Pencil,
    Plus,
    Projector,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
    X,
} from "lucide-react";

import {
    createRoom,
    deleteRoom,
    extractErrorMessage,
    getAllRooms,
    getSchoolFilter,
    updateRoom,
    type CommonDTO,
    type PermissionAction,
    type RoomRequest,
    type RoomResponse,
    type RoomType,
} from "@/services/timetable/RoomService";

/* -------------------------------------------------------------------------- */
/* Types and constants                                                        */
/* -------------------------------------------------------------------------- */

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type SortOption = "NEWEST" | "ROOM_ASC" | "CAPACITY_DESC";
type BooleanFilter = "ALL" | "YES" | "NO";

interface RoomForm {
    schoolId: number | "";
    roomNumber: string;
    buildingName: string;
    floorNumber: number | "";
    rows: number | "";
    columns: number | "";
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

const PAGE_SIZE = 5;

/* -------------------------------------------------------------------------- */
/* General helpers                                                            */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-IN").format(value);
}

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getRoomActions(room: RoomResponse): PermissionAction[] {
    return Array.isArray(room.permissionActions) ? room.permissionActions : [];
}

function hasPermission(room: RoomResponse, action: PermissionAction): boolean {
    return getRoomActions(room).includes(action);
}

function formatRoomType(type: RoomType | undefined | null | ""): string {
    if (!type) return "—";
    return type.replace(/_/g, " ").replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
}

function uniqueDTOs(items: Array<CommonDTO | null | undefined>): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();
    for (const item of items) {
        if (item && Number.isFinite(item.id) && item.id > 0 && !unique.has(item.id)) {
            unique.set(item.id, item);
        }
    }
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

function FieldError({ children }: { children?: string }) {
    if (!children) return null;
    return (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-400" role="alert">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </motion.p>
    );
}

function SelectChevron() {
    return (
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    );
}

function ErrorBanner({ title, message, onRetry, onDismiss }: { title: string; message: string; onRetry?: () => void; onDismiss: () => void }) {
    return (
        <motion.div role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            <div className="flex min-w-0 items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                <div className="min-w-0">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 break-words text-xs sm:text-sm">{message}</p>
                    {onRetry && (
                        <button type="button" onClick={onRetry} className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25">
                            Try again
                        </button>
                    )}
                </div>
            </div>
            <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="shrink-0 text-slate-400 transition hover:text-white"><X size={17} /></button>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Room dialog                                                                */
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
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<RoomForm>(() => ({
        schoolId: isCreate ? "" : room?.school?.id ?? "",
        roomNumber: room?.roomNumber ?? "",
        buildingName: room?.buildingName ?? "",
        floorNumber: room?.floorNumber ?? "",
        rows: room?.rows ?? "",
        columns: room?.columns ?? "",
        roomType: room?.roomType ?? "",
        hasProjector: room?.hasProjector ?? false,
        hasComputers: room?.hasComputers ?? false,
    }));

    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof RoomForm>(key: K, value: RoomForm[K]) {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
        setDialogError("");
    }

    function validate(): boolean {
        const errors: FieldErrors = {};

        if (isCreate) {
            const schoolId = Number(form.schoolId);
            if (!form.schoolId || schoolId <= 0) {
                errors.schoolId = "Please select a school.";
            } else if (!schools.some((s) => s.id === schoolId)) {
                errors.schoolId = "Selected school is no longer available.";
            }
        }

        const rn = form.roomNumber.trim();
        if (!rn) errors.roomNumber = "Room number is required.";
        else if (rn.length > 50) errors.roomNumber = "Maximum 50 characters allowed.";

        const bn = form.buildingName.trim();
        if (bn.length > 100) errors.buildingName = "Maximum 100 characters allowed.";

        if (form.floorNumber === "" || Number(form.floorNumber) < -5 || Number(form.floorNumber) > 200) {
            errors.floorNumber = "Provide a valid floor number.";
        }

        if (form.rows === "" || Number(form.rows) <= 0) errors.rows = "Provide valid rows (>0).";
        if (form.columns === "" || Number(form.columns) <= 0) errors.columns = "Provide valid columns (>0).";
        if (!form.roomType) errors.roomType = "Select a room type.";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!room) return setDialogError("No room selected for deletion.");
            try {
                await onDelete(room.id);
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();
                setDialogError(lower.includes("constraint") ? "This room is currently in use (e.g. in a timetable). Remove associations before deleting." : message);
            }
            return;
        }

        if (isView) return onClose();
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
            if (isCreate) await onCreate(Number(form.schoolId), request);
            else if (isEdit && room) await onUpdate(room.id, request);
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    const title: Record<DialogMode, string> = {
        CREATE: "Add New Room",
        EDIT: "Edit Room",
        VIEW: "Room Details",
        DELETE: "Delete Room",
    };

    const currentCapacity = (Number(form.rows) > 0 && Number(form.columns) > 0) ? Number(form.rows) * Number(form.columns) : 0;
    const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 disabled:opacity-60 read-only:opacity-75";

    return (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
            <motion.div role="dialog" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.2 }} className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Infrastructure Management</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">{title[mode]}</h2>
                    </div>
                    <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-50"><X size={18} /></button>
                </div>

                <form onSubmit={submit} noValidate className="max-h-[80vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                    <AnimatePresence>
                        {dialogError && (
                            <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200">
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-rose-300">Action could not be completed</p>
                                    <p className="mt-1 break-words text-xs leading-relaxed">{dialogError}</p>
                                </div>
                                <button type="button" onClick={() => setDialogError("")} className="text-rose-400 hover:text-rose-200"><X size={15} /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isDelete ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400"><Trash2 size={22} /></div>
                                <div>
                                    <p className="font-semibold text-white">Delete this room?</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-300">You are about to delete <strong className="text-white">Room {room?.roomNumber}</strong> in {room?.buildingName}.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isCreate && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">School <span className="text-cyan-400">*</span></label>
                                    <div className="relative">
                                        <select value={form.schoolId} onChange={(e) => changeField("schoolId", e.target.value ? Number(e.target.value) : "")} disabled={busy || schoolsLoading || schools.length === 0} className={`${inputClass} appearance-none pr-10`}>
                                            <option value="">{schoolsLoading ? "Loading schools..." : "Select school"}</option>
                                            {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                                        </select>
                                        <SelectChevron />
                                    </div>
                                    <FieldError>{fieldErrors.schoolId}</FieldError>
                                </div>
                            )}

                            {!isCreate && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">School</label>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3"><p className="font-medium text-white">{room?.school?.name ?? "—"}</p></div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Room Number <span className="text-cyan-400">*</span></label>
                                    <input value={form.roomNumber} onChange={(e) => changeField("roomNumber", e.target.value)} readOnly={readOnly || busy} maxLength={50} placeholder="e.g. 101-A" className={`${inputClass} ${fieldErrors.roomNumber ? "border-rose-500/60 focus:border-rose-400" : ""}`} />
                                    <FieldError>{fieldErrors.roomNumber}</FieldError>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Room Type <span className="text-cyan-400">*</span></label>
                                    <div className="relative">
                                        <select value={form.roomType} onChange={(e) => changeField("roomType", e.target.value as RoomType)} disabled={readOnly || busy} className={`${inputClass} appearance-none pr-10 ${fieldErrors.roomType ? "border-rose-500/60 focus:border-rose-400" : ""}`}>
                                            <option value="">Select type</option>
                                            <option value="CLASSROOM">Classroom</option>
                                            <option value="LABORATORY">Laboratory</option>
                                            <option value="SEMINAR_HALL">Seminar Hall</option>
                                            <option value="AUDITORIUM">Auditorium</option>
                                            <option value="VIRTUAL">Virtual</option>
                                        </select>
                                        <SelectChevron />
                                    </div>
                                    <FieldError>{fieldErrors.roomType}</FieldError>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Building Name</label>
                                    <input value={form.buildingName} onChange={(e) => changeField("buildingName", e.target.value)} readOnly={readOnly || busy} maxLength={100} placeholder="e.g. Science Block" className={`${inputClass} ${fieldErrors.buildingName ? "border-rose-500/60 focus:border-rose-400" : ""}`} />
                                    <FieldError>{fieldErrors.buildingName}</FieldError>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Floor Number <span className="text-cyan-400">*</span></label>
                                    <input type="number" value={form.floorNumber} onChange={(e) => changeField("floorNumber", e.target.value ? Number(e.target.value) : "")} readOnly={readOnly || busy} placeholder="e.g. 1" className={`${inputClass} ${fieldErrors.floorNumber ? "border-rose-500/60 focus:border-rose-400" : ""}`} />
                                    <FieldError>{fieldErrors.floorNumber}</FieldError>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Rows <span className="text-cyan-400">*</span></label>
                                    <input type="number" min={1} value={form.rows} onChange={(e) => changeField("rows", e.target.value ? Number(e.target.value) : "")} readOnly={readOnly || busy} className={`${inputClass} ${fieldErrors.rows ? "border-rose-500/60 focus:border-rose-400" : ""}`} />
                                    <FieldError>{fieldErrors.rows}</FieldError>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Columns <span className="text-cyan-400">*</span></label>
                                    <input type="number" min={1} value={form.columns} onChange={(e) => changeField("columns", e.target.value ? Number(e.target.value) : "")} readOnly={readOnly || busy} className={`${inputClass} ${fieldErrors.columns ? "border-rose-500/60 focus:border-rose-400" : ""}`} />
                                    <FieldError>{fieldErrors.columns}</FieldError>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Total Capacity</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
                                        <LayoutGrid size={16} /> {currentCapacity || "—"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-white/10 p-2 text-cyan-300"><Projector size={18} /></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Projector Available</p>
                                            <p className="text-xs text-slate-400">Room is equipped with a projector</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" checked={form.hasProjector} onChange={(e) => changeField("hasProjector", e.target.checked)} disabled={readOnly || busy} className="h-5 w-5 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 disabled:opacity-50" />
                                </label>

                                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-white/10 p-2 text-purple-300"><Monitor size={18} /></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Computers Available</p>
                                            <p className="text-xs text-slate-400">Room is equipped with lab computers</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" checked={form.hasComputers} onChange={(e) => changeField("hasComputers", e.target.checked)} disabled={readOnly || busy} className="h-5 w-5 rounded border-white/20 bg-slate-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 disabled:opacity-50" />
                                </label>
                            </div>

                            {isView && room && (
                                <div className="space-y-3">
                                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Permissions Information</p>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="mb-2 text-xs text-slate-500">Available permissions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {getRoomActions(room).length ? getRoomActions(room).map(action => (
                                                <span key={action} className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-xs text-cyan-300">{action}</span>
                                            )) : <span className="text-xs text-slate-500">View only</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50">{isView ? "Close" : "Cancel"}</button>
                        {!isView && (
                            <button type="submit" disabled={busy || (isCreate && schools.length === 0)} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${isDelete ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20" : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"}`}>
                                {busy ? <LoaderCircle size={16} className="animate-spin" /> : isDelete ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
                                {busy ? "Processing..." : isDelete ? "Confirm Delete" : isCreate ? "Create Room" : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Room Page                                                             */
/* -------------------------------------------------------------------------- */

export default function Rooms() {
    const reduceMotion = useReducedMotion();

    const [rooms, setRooms] = useState<RoomResponse[]>([]);
    const [schoolsForCreate, setSchoolsForCreate] = useState<CommonDTO[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [schoolsLoading, setSchoolsLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [schoolOptionsError, setSchoolOptionsError] = useState("");
    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<RoomType | "ALL">("ALL");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [schoolFilter, setSchoolFilter] = useState("ALL");
    const [projectorFilter, setProjectorFilter] = useState<BooleanFilter>("ALL");
    const [computerFilter, setComputerFilter] = useState<BooleanFilter>("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{ mode: DialogMode; room: RoomResponse | null } | null>(null);

    const loadData = useCallback(async (background = false) => {
        if (background) setRefreshing(true);
        else setLoading(true);
        setPageError("");

        try {
            const result = await getAllRooms();
            setRooms(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Failed to load rooms: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { void loadData(); }, [loadData]);
    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const loadSchoolOptions = useCallback(async () => {
        setSchoolsLoading(true);
        setSchoolOptionsError("");
        try {
            const result = await getSchoolFilter();
            const options = uniqueDTOs(result);
            setSchoolsForCreate(options);
            return options;
        } catch (error) {
            const message = extractErrorMessage(error);
            setSchoolOptionsError(message);
            toast.error(`Could not load school options: ${message}`);
            throw error;
        } finally {
            setSchoolsLoading(false);
        }
    }, []);

    async function openCreateDialog() {
        setPageError("");
        setNotice("");
        try {
            const options = await loadSchoolOptions();
            if (options.length === 0) {
                toast.error("No schools are available. A room cannot be created.");
                return;
            }
            setDialog({ mode: "CREATE", room: null });
        } catch { }
    }

    function openDialog(mode: DialogMode, room: RoomResponse | null = null) {
        setPageError(""); setNotice(""); setDialog({ mode, room });
    }

    const tableUniversities = useMemo(() => uniqueDTOs(rooms.map(r => r.university)), [rooms]);
    const tableSchools = useMemo(() => uniqueDTOs(rooms.map(r => r.school)), [rooms]);

    const stats = useMemo(() => {
        const total = rooms.length;
        const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
        const labCount = rooms.filter((r) => r.roomType === "LABORATORY" || r.hasComputers).length;
        const projectorCount = rooms.filter((r) => r.hasProjector).length;

        return [
            { label: "Total Rooms", value: formatNumber(total), icon: DoorOpen, tone: "cyan" },
            { label: "Total Capacity", value: formatNumber(totalCapacity), icon: LayoutGrid, tone: "purple" },
            { label: "Labs & PC Rooms", value: formatNumber(labCount), icon: Monitor, tone: "amber" },
            { label: "Projector Equipped", value: formatNumber(projectorCount), icon: Projector, tone: "green" },
        ] as const;
    }, [rooms]);

    const filteredRooms = useMemo(() => {
        const query = normalizeText(search);
        const result = rooms.filter((room) => {
            const matchesSearch = !query || normalizeText(room.roomNumber).includes(query) || normalizeText(room.buildingName).includes(query);
            const matchesType = typeFilter === "ALL" || room.roomType === typeFilter;
            const matchesUniversity = universityFilter === "ALL" || room.university?.id === Number(universityFilter);
            const matchesSchool = schoolFilter === "ALL" || room.school?.id === Number(schoolFilter);
            const matchesProjector = projectorFilter === "ALL" || (projectorFilter === "YES" && room.hasProjector) || (projectorFilter === "NO" && !room.hasProjector);
            const matchesComputer = computerFilter === "ALL" || (computerFilter === "YES" && room.hasComputers) || (computerFilter === "NO" && !room.hasComputers);
            return matchesSearch && matchesType && matchesUniversity && matchesSchool && matchesProjector && matchesComputer;
        });

        result.sort((a, b) => {
            if (sort === "ROOM_ASC") return (a.roomNumber ?? "").localeCompare(b.roomNumber ?? "");
            if (sort === "CAPACITY_DESC") return (b.capacity ?? 0) - (a.capacity ?? 0);
            return (b.id ?? 0) - (a.id ?? 0);
        });

        return result;
    }, [rooms, search, typeFilter, universityFilter, schoolFilter, projectorFilter, computerFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const visibleRooms = filteredRooms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    useEffect(() => { setPage(1); }, [search, typeFilter, universityFilter, schoolFilter, projectorFilter, computerFilter, sort]);

    const hasActiveFilters = search.trim() !== "" || typeFilter !== "ALL" || universityFilter !== "ALL" || schoolFilter !== "ALL" || projectorFilter !== "ALL" || computerFilter !== "ALL" || sort !== "NEWEST";
    function resetFilters() {
        setSearch(""); setTypeFilter("ALL"); setUniversityFilter("ALL"); setSchoolFilter("ALL"); setProjectorFilter("ALL"); setComputerFilter("ALL"); setSort("NEWEST"); setPage(1);
    }

    async function handleCreate(schoolId: number, request: RoomRequest) {
        setBusy(true);
        try {
            await createRoom(schoolId, request);
            setDialog(null); setNotice("Room created successfully."); toast.success(`Room "${request.roomNumber}" created successfully.`);
            await loadData(true);
        } catch (error) {
            toast.error(`Could not create room: ${extractErrorMessage(error)}`); throw error;
        } finally { setBusy(false); }
    }

    async function handleUpdate(roomId: number, request: RoomRequest) {
        setBusy(true);
        try {
            await updateRoom(roomId, request);
            setDialog(null); setNotice("Room updated successfully."); toast.success("Room updated successfully.");
            await loadData(true);
        } catch (error) {
            toast.error(`Could not update room: ${extractErrorMessage(error)}`); throw error;
        } finally { setBusy(false); }
    }

    async function handleDelete(roomId: number) {
        setBusy(true);
        try {
            const message = await deleteRoom(roomId);
            setDialog(null); setNotice(message); toast.success(message);
            await loadData(true);
        } catch (error) {
            toast.error(`Could not delete room: ${extractErrorMessage(error)}`); throw error;
        } finally { setBusy(false); }
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        amber: "border-amber-400/20 from-amber-500/10 to-orange-500/5 text-amber-300",
    };

    return (
        <motion.main initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative w-full min-w-0 space-y-7 p-4 text-white sm:p-6 lg:p-8">
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Infrastructure</span> <ChevronRight size={15} /> <span className="text-cyan-300">Rooms</span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Campus Administration</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Room Management</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Manage lecture halls, labs, room capacities, and physical IT assets.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => void loadData(true)} disabled={loading || refreshing || busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
                            <RefreshCw size={16} className={loading || refreshing ? "animate-spin text-cyan-400" : ""} />
                            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>
                        <button type="button" onClick={() => void openCreateDialog()} disabled={loading || refreshing || busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
                            <Plus size={19} /> Add Room
                        </button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {pageError && <ErrorBanner title="Could not load rooms" message={pageError} onRetry={() => void loadData()} onDismiss={() => setPageError("")} />}
                {schoolOptionsError && <ErrorBanner title="School options unavailable" message={schoolOptionsError} onRetry={() => void loadSchoolOptions().catch(() => undefined)} onDismiss={() => setSchoolOptionsError("")} />}
                {notice && (
                    <motion.div role="status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" /> <p>{notice}</p>
                        <button type="button" onClick={() => setNotice("")} className="ml-auto text-slate-400 hover:text-white"><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, index) => (
                    <motion.div key={stat.label} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.06 }} className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-slate-300">{stat.label}</p>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-white">{loading ? <span className="inline-block h-8 w-20 animate-pulse rounded bg-white/10" /> : stat.value}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3"><stat.icon size={23} /></div>
                        </div>
                    </motion.div>
                ))}
            </section>

            <GlassCard>
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 xl:grid-cols-4 2xl:grid-cols-[minmax(200px,1.5fr)_150px_150px_150px_140px_140px_150px_auto]">
                    <div className="relative min-w-0">
                        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room, building..." className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-10 pr-9 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50" />
                        {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X size={15} /></button>}
                    </div>

                    <div className="relative">
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as RoomType | "ALL")} className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50">
                            <option value="ALL">All types</option>
                            <option value="CLASSROOM">Classroom</option>
                            <option value="LABORATORY">Laboratory</option>
                            <option value="SEMINAR_HALL">Seminar Hall</option>
                            <option value="AUDITORIUM">Auditorium</option>
                            <option value="VIRTUAL">Virtual</option>
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select value={universityFilter} onChange={(e) => setUniversityFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50">
                            <option value="ALL">All universities</option>
                            {tableUniversities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50">
                            <option value="ALL">All schools</option>
                            {tableSchools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select value={projectorFilter} onChange={(e) => setProjectorFilter(e.target.value as BooleanFilter)} className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50">
                            <option value="ALL">Projector: All</option>
                            <option value="YES">Yes</option>
                            <option value="NO">No</option>
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select value={computerFilter} onChange={(e) => setComputerFilter(e.target.value as BooleanFilter)} className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50">
                            <option value="ALL">PCs: All</option>
                            <option value="YES">Yes</option>
                            <option value="NO">No</option>
                        </select>
                        <SelectChevron />
                    </div>

                    <div className="relative">
                        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50">
                            <option value="NEWEST">Highest ID first</option>
                            <option value="ROOM_ASC">Room Number</option>
                            <option value="CAPACITY_DESC">Capacity: High to Low</option>
                        </select>
                        <ArrowDownUp size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {hasActiveFilters && (
                        <button type="button" onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                            <RotateCcw size={14} /> Reset
                        </button>
                    )}
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">Room Number</th>
                                <th className="px-4 py-4 font-medium">School / University</th>
                                <th className="px-4 py-4 font-medium">Location</th>
                                <th className="px-4 py-4 font-medium">Type</th>
                                <th className="px-4 py-4 font-medium text-center">Grid / Capacity</th>
                                <th className="px-4 py-4 font-medium text-center">Amenities</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map((_, rIdx) => (
                                    <tr key={`loading-${rIdx}`}>
                                        {Array.from({ length: 8 }).map((__, cIdx) => (
                                            <td key={cIdx} className="px-4 py-5"><div className="h-4 animate-pulse rounded bg-white/[0.07]" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && rooms.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400"><AlertTriangle size={26} /></div>
                                        <p className="mt-4 font-semibold text-slate-200">Failed to load rooms</p>
                                    </td>
                                </tr>
                            ) : visibleRooms.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleRooms.map((room, index) => {
                                        const canUpdate = hasPermission(room, "UPDATE");
                                        const canDelete = hasPermission(room, "DELETE");

                                        return (
                                            <motion.tr layout={!reduceMotion} key={room.id} initial={reduceMotion ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="group transition-colors hover:bg-cyan-400/[0.035]">
                                                <td className="px-5 py-5 text-slate-500">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-cyan-200"><DoorOpen size={20} /></div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-xs truncate font-semibold text-slate-100">{room.roomNumber}</p>
                                                            <p className="mt-0.5 text-xs text-slate-500">ID: {room.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="max-w-[210px]">
                                                        <p className="truncate font-medium text-slate-200">{room.school?.name || "—"}</p>
                                                        <p className="mt-1 truncate text-xs text-slate-500">{room.university?.name || "—"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="max-w-[190px]">
                                                        <p className="truncate font-medium text-slate-200">{room.buildingName || "—"}</p>
                                                        {room.floorNumber !== undefined && <p className="mt-1 truncate text-xs text-slate-500">Floor: {room.floorNumber}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">{formatRoomType(room.roomType)}</span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <p className="font-semibold text-emerald-300">{room.capacity || "—"}</p>
                                                    <p className="mt-0.5 text-xs text-slate-500">{room.rows}x{room.columns}</p>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {room.hasProjector && <div title="Projector Available" className="rounded-md border border-cyan-500/20 bg-cyan-500/10 p-1.5 text-cyan-400"><Projector size={14} /></div>}
                                                        {room.hasComputers && <div title="Computers Available" className="rounded-md border border-purple-500/20 bg-purple-500/10 p-1.5 text-purple-400"><Monitor size={14} /></div>}
                                                        {!room.hasProjector && !room.hasComputers && <span className="text-xs text-slate-600">—</span>}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button type="button" onClick={() => openDialog("VIEW", room)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"><Eye size={17} /></button>
                                                        {canUpdate && <button type="button" onClick={() => openDialog("EDIT", room)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"><Pencil size={17} /></button>}
                                                        {canDelete && <button type="button" onClick={() => openDialog("DELETE", room)} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rose-400 transition hover:border-rose-400/30 hover:bg-rose-400/10"><Trash2 size={17} /></button>}
                                                        {!canUpdate && !canDelete && <span className="self-center text-xs text-slate-500">View only</span>}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400"><DoorOpen size={25} /></div>
                                        <p className="mt-4 font-semibold text-slate-200">{hasActiveFilters ? "No matching rooms found" : "No rooms registered yet"}</p>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{hasActiveFilters ? "Try changing your search or filters." : "Rooms will appear here after they are created."}</p>
                                        {hasActiveFilters && <button type="button" onClick={resetFilters} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200"><RotateCcw size={14} /> Clear Filters</button>}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        {filteredRooms.length === 0 ? "Showing 0 rooms" : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredRooms.length)} of ${filteredRooms.length} rooms${hasActiveFilters && filteredRooms.length !== rooms.length ? ` (filtered from ${rooms.length})` : ""}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button disabled={currentPage === 1 || loading} onClick={() => setPage(1)} className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 disabled:opacity-30"><ChevronsLeft size={17} /></button>
                        <button disabled={currentPage === 1 || loading} onClick={() => setPage((v) => Math.max(1, v - 1))} className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 disabled:opacity-30"><ChevronLeft size={17} /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1).map((n, i, p) => (
                            <span key={n} className="contents">
                                {i > 0 && n - p[i - 1] > 1 && <span className="px-1 text-slate-500">…</span>}
                                <button disabled={loading} onClick={() => setPage(n)} className={`min-w-9 rounded-lg border px-3 py-2 text-sm ${currentPage === n ? "border-cyan-300/40 bg-gradient-to-r from-violet-600 to-blue-500 font-semibold text-white shadow-md shadow-blue-500/20" : "border-white/10 bg-white/[0.035] text-slate-300"}`}>{n}</button>
                            </span>
                        ))}
                        <button disabled={currentPage === totalPages || loading} onClick={() => setPage((v) => Math.min(totalPages, v + 1))} className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 disabled:opacity-30"><ChevronRight size={17} /></button>
                        <button disabled={currentPage === totalPages || loading} onClick={() => setPage(totalPages)} className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 disabled:opacity-30"><ChevronsRight size={17} /></button>
                    </div>
                </div>
            </GlassCard>

            <AnimatePresence>
                {dialog && (
                    <RoomDialog
                        key={`${dialog.mode}-${dialog.room?.id ?? "new"}`}
                        mode={dialog.mode}
                        room={dialog.room}
                        schools={schoolsForCreate}
                        schoolsLoading={schoolsLoading}
                        busy={busy}
                        onClose={() => { if (!busy) setDialog(null); }}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>
        </motion.main>
    );
}