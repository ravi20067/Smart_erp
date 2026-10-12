import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertCircle, AlertTriangle, ArrowDownUp, Building2, CheckCircle2, ChevronDown,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, GraduationCap,
    LoaderCircle, Pencil, Plus, RefreshCw, RotateCcw, Search, ShieldAlert,
    ShieldCheck, Trash2, Users, X,
} from "lucide-react";
import {
    createUniversity, deleteUniversity, getUniversities, updateUniversity,
    type ActiveStatus, type UniversityResponse,
} from "@/services/org/universityService";

type StatusFilter = "ALL" | ActiveStatus;
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "CODE_ASC";
type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";

interface UniversityForm {
    name: string;
    code: string;
    activeStatus: ActiveStatus;
}

interface FieldErrors {
    name?: string;
    code?: string;
}

const EMPTY_FORM: UniversityForm = { name: "", code: "", activeStatus: "ENABLE" };
const PAGE_SIZE = 5;

/**
 * Robustly parses any API / Axios / network error into a clear, user-friendly message.
 */
function extractErrorMessage(error: unknown): string {
    if (!error) return "An unexpected error occurred. Please try again.";

    if (typeof error === "object" && error !== null) {
        const errObj = error as Record<string, any>;

        // Network or connection errors
        if (errObj.code === "ERR_NETWORK" || errObj.message === "Network Error") {
            return "Unable to connect to the server. Please check your network connection or verify that the backend is running.";
        }
        if (errObj.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        const response = errObj.response;
        if (response) {
            const status = response.status;
            const data = response.data;

            // Direct string response
            if (typeof data === "string" && data.trim()) {
                return data;
            }

            // Structured object responses
            if (data && typeof data === "object") {
                if (typeof data.message === "string" && data.message.trim()) {
                    return data.message;
                }
                if (typeof data.error === "string" && data.error.trim()) {
                    return data.error;
                }
                if (typeof data.detail === "string" && data.detail.trim()) {
                    return data.detail;
                }
                // Handle Spring Boot / standard validation error arrays
                if (Array.isArray(data.errors) && data.errors.length > 0) {
                    return data.errors
                        .map((e: any) => (typeof e === "string" ? e : e?.defaultMessage || e?.message || JSON.stringify(e)))
                        .join(", ");
                }
                // Handle field error maps: { errors: { name: "Name cannot be empty" } }
                if (data.errors && typeof data.errors === "object") {
                    const entries = Object.entries(data.errors);
                    if (entries.length > 0) {
                        return entries.map(([field, msg]) => `${field}: ${msg}`).join(", ");
                    }
                }
            }

            // Fallbacks based on HTTP status codes
            if (status === 400) return "Invalid data provided. Please check the form fields.";
            if (status === 401) return "Your session has expired or is invalid. Please log in again.";
            if (status === 403) return "Access denied. Super-administrator privileges are required.";
            if (status === 404) return "The requested university was not found or has been removed.";
            if (status === 409) return "A university with this name or code already exists in the system.";
            if (status === 422) return "Unprocessable entity. Please verify your input parameters.";
            if (status >= 500) return "Server encountered an internal error. Please try again later.";
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "An unexpected error occurred. Please try again.";
}

function formatNumber(value: number | null | undefined): string {
    return typeof value === "number" && !isNaN(value) ? new Intl.NumberFormat("en-IN").format(value) : "—";
}

function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

function UniversityDialog({
    mode,
    university,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: {
    mode: DialogMode;
    university: UniversityResponse | null;
    busy: boolean;
    onClose: () => void;
    onCreate: (form: UniversityForm) => Promise<void>;
    onUpdate: (id: number, form: Pick<UniversityForm, "name" | "activeStatus">) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}) {
    const [form, setForm] = useState<UniversityForm>(
        university
            ? {
                  name: university.name ?? "",
                  code: university.code ?? "",
                  activeStatus: university.activeStatus ?? "ENABLE",
              }
            : { ...EMPTY_FORM }
    );
    const [dialogError, setDialogError] = useState<string>("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const title: Record<DialogMode, string> = {
        CREATE: "Add University",
        EDIT: "Edit University",
        VIEW: "University Details",
        DELETE: "Delete University",
    };

    // Close on Escape key if not busy
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function validate(): boolean {
        const errors: FieldErrors = {};
        const name = form.name.trim();

        if (!name) {
            errors.name = "University name is required.";
        } else if (name.length < 2) {
            errors.name = "University name must be at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "University name cannot exceed 150 characters.";
        }

        if (isCreate) {
            const code = form.code.trim();
            if (!code) {
                errors.code = "University code is required.";
            } else if (code.length < 2) {
                errors.code = "University code must be at least 2 characters.";
            } else if (code.length > 40) {
                errors.code = "University code cannot exceed 40 characters.";
            } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
                errors.code = "Code should only contain letters, numbers, hyphens, and underscores.";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!university) return;
            try {
                await onDelete(university.id);
            } catch (err) {
                const message = extractErrorMessage(err);
                setDialogError(
                    message.includes("constraint") || message.includes("foreign key") || message.includes("Cannot delete")
                        ? "Cannot delete this university because it has related schools, departments, students, or staff records attached. Please remove associated entities first."
                        : message
                );
            }
            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (!validate()) return;

        const name = form.name.trim();
        const code = form.code.trim();

        try {
            if (isCreate) {
                await onCreate({ ...form, name, code });
            } else if (isEdit && university) {
                await onUpdate(university.id, { name, activeStatus: form.activeStatus });
            }
        } catch (err) {
            setDialogError(extractErrorMessage(err));
        }
    }

    const hasActiveDependents =
        university &&
        ((university.noOfStudent ?? 0) > 0 || (university.noOfTeacher ?? 0) > 0 || (university.noOfUser ?? 0) > 0);

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="university-dialog-title"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Super Admin · Organisation
                        </p>
                        <h2 id="university-dialog-title" className="mt-1 text-xl font-semibold text-white">
                            {title[mode]}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5 p-6" noValidate>
                    {/* In-Dialog Error Banner */}
                    <AnimatePresence>
                        {dialogError && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs sm:text-sm text-rose-200"
                            >
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                                <div className="flex-1">
                                    <p className="font-semibold text-rose-300">Action could not be completed</p>
                                    <p className="mt-0.5 leading-relaxed text-rose-200/90">{dialogError}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDialogError("")}
                                    className="text-rose-400 hover:text-rose-200"
                                    aria-label="Dismiss error"
                                >
                                    <X size={15} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isDelete ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Are you sure you want to delete this university?
                                    </p>
                                    <p className="text-xs text-slate-300">
                                        This action will permanently delete <strong className="text-white">{university?.name}</strong>{" "}
                                        (<span className="font-mono text-cyan-300">{university?.code}</span>).
                                    </p>
                                </div>
                            </div>

                            {hasActiveDependents && (
                                <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                                    <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" />
                                    <div>
                                        <p className="font-semibold text-amber-300">Active Records Warning</p>
                                        <p className="mt-0.5 leading-relaxed text-amber-200/90">
                                            This university is currently linked to{" "}
                                            <strong>{formatNumber(university?.noOfStudent)} students</strong> and{" "}
                                            <strong>{formatNumber(university?.noOfTeacher)} teachers</strong>.
                                            Deletion may be rejected by relational constraints.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="university-name" className="mb-2 block text-sm font-medium text-slate-300">
                                        University Name <span className="text-cyan-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">{form.name.length}/150</span>
                                </div>
                                <input
                                    id="university-name"
                                    value={form.name}
                                    onChange={(e) => {
                                        setForm((v) => ({ ...v, name: e.target.value }));
                                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                                        if (dialogError) setDialogError("");
                                    }}
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. Stanford University"
                                    className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 ${
                                        fieldErrors.name
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : "border-white/10 focus:border-cyan-400/60"
                                    } read-only:opacity-75 disabled:opacity-50`}
                                />
                                {fieldErrors.name && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                                        <AlertCircle size={13} /> {fieldErrors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="university-code" className="mb-2 block text-sm font-medium text-slate-300">
                                        University Code {isCreate && <span className="text-cyan-400">*</span>}
                                    </label>
                                    {isCreate && <span className="text-[11px] text-slate-500">{form.code.length}/40</span>}
                                </div>
                                <input
                                    id="university-code"
                                    value={form.code}
                                    onChange={(e) => {
                                        setForm((v) => ({ ...v, code: e.target.value.toUpperCase() }));
                                        if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: undefined }));
                                        if (dialogError) setDialogError("");
                                    }}
                                    readOnly={!isCreate || busy}
                                    maxLength={40}
                                    placeholder="e.g. STAN-01"
                                    className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 font-mono text-sm uppercase text-white outline-none transition placeholder:text-slate-500 ${
                                        fieldErrors.code
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : "border-white/10 focus:border-cyan-400/60"
                                    } read-only:opacity-60 disabled:opacity-50`}
                                />
                                {fieldErrors.code ? (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                                        <AlertCircle size={13} /> {fieldErrors.code}
                                    </p>
                                ) : isEdit ? (
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        University code is immutable and cannot be changed after creation.
                                    </p>
                                ) : (
                                    <p className="mt-1.5 text-[11px] text-slate-500">
                                        Unique institutional code (e.g. STANFORD-2024). Uppercase letters, numbers, hyphens.
                                    </p>
                                )}
                            </div>

                            {!isCreate && (
                                <div>
                                    <label htmlFor="university-status" className="mb-2 block text-sm font-medium text-slate-300">
                                        Active Status
                                    </label>
                                    {isView ? (
                                        <div className="flex items-center pt-1">
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                                    form.activeStatus === "ENABLE"
                                                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                        : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                                                }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        form.activeStatus === "ENABLE" ? "bg-emerald-400" : "bg-amber-400"
                                                    }`}
                                                />
                                                {form.activeStatus === "ENABLE" ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    ) : (
                                        <select
                                            id="university-status"
                                            value={form.activeStatus}
                                            onChange={(e) => {
                                                setForm((v) => ({ ...v, activeStatus: e.target.value as ActiveStatus }));
                                                if (dialogError) setDialogError("");
                                            }}
                                            disabled={busy}
                                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-75"
                                        >
                                            <option value="ENABLE">Active (Enable)</option>
                                            <option value="DISABLE">Inactive (Disable)</option>
                                        </select>
                                    )}
                                </div>
                            )}

                            {isView && university && (
                                <div className="space-y-3 pt-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Institutional Statistics
                                    </p>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {[
                                            { label: "Students", value: university.noOfStudent },
                                            { label: "Teachers", value: university.noOfTeacher },
                                            { label: "Users", value: university.noOfUser },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"
                                            >
                                                <p className="text-[11px] font-medium text-slate-400">{item.label}</p>
                                                <p className="mt-1 text-lg font-bold text-white">{formatNumber(item.value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {university.school?.name && (
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-300">
                                            <span className="text-slate-400">Associated School: </span>
                                            <strong className="text-cyan-300">{university.school.name}</strong>
                                            {university.school.code && (
                                                <span className="ml-1 text-slate-500 font-mono">({university.school.code})</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>
                        {!isView && (
                            <button
                                type="submit"
                                disabled={busy}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                                    isDelete
                                        ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                        : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                }`}
                            >
                                {busy && <LoaderCircle size={16} className="animate-spin" />}
                                {busy
                                    ? "Processing..."
                                    : isDelete
                                    ? "Confirm Delete"
                                    : isCreate
                                    ? "Create University"
                                    : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

/**
 * Super Admin University Management Page.
 * Designed with comprehensive error handling, safe null fallbacks, retry flows,
 * responsive layout, and dark glassmorphic styling.
 */
export default function Universities() {
    const reduceMotion = useReducedMotion();
    const [universities, setUniversities] = useState<UniversityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);
    const [dialog, setDialog] = useState<{ mode: DialogMode; university: UniversityResponse | null } | null>(null);

    async function loadUniversities(isBackgroundRefresh = false) {
        if (isBackgroundRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setPageError("");

        try {
            const data = await getUniversities();
            setUniversities(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = extractErrorMessage(err);
            setPageError(msg);
            toast.error("Failed to load universities: " + msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        void loadUniversities();
    }, []);

    // Clear notice auto-timer
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    const stats = useMemo(() => {
        const list = Array.isArray(universities) ? universities : [];
        const students = list.reduce((sum, item) => sum + (item.noOfStudent ?? 0), 0);
        const teachers = list.reduce((sum, item) => sum + (item.noOfTeacher ?? 0), 0);
        const activeCount = list.filter((u) => u.activeStatus === "ENABLE").length;

        return [
            { label: "Total Universities", value: formatNumber(list.length), icon: Building2, tone: "cyan" },
            { label: "Active Universities", value: formatNumber(activeCount), icon: GraduationCap, tone: "green" },
            { label: "Total Students", value: formatNumber(students), icon: Users, tone: "blue" },
            { label: "Total Faculties", value: formatNumber(teachers), icon: ShieldCheck, tone: "purple" },
        ];
    }, [universities]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        const list = Array.isArray(universities) ? universities : [];

        const result = list.filter((u) => {
            const name = (u.name ?? "").toLowerCase();
            const code = (u.code ?? "").toLowerCase();
            const matchesQuery = !query || name.includes(query) || code.includes(query);
            const matchesStatus = statusFilter === "ALL" || u.activeStatus === statusFilter;
            return matchesQuery && matchesStatus;
        });

        return result.sort((a, b) => {
            if (sort === "NAME_ASC") return (a.name ?? "").localeCompare(b.name ?? "");
            if (sort === "NAME_DESC") return (b.name ?? "").localeCompare(a.name ?? "");
            if (sort === "CODE_ASC") return (a.code ?? "").localeCompare(b.code ?? "");
            return (b.id ?? 0) - (a.id ?? 0);
        });
    }, [universities, search, statusFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Reset pagination when search or filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, sort]);

    // Ensure current page does not stay out of bounds when data count shrinks
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    function openDialog(mode: DialogMode, university: UniversityResponse | null = null) {
        setPageError("");
        setNotice("");
        setDialog({ mode, university });
    }

    async function handleCreate(form: UniversityForm) {
        setBusy(true);
        try {
            await createUniversity({ name: form.name, code: form.code });
            setDialog(null);
            setNotice("University created successfully.");
            toast.success(`University "${form.name}" created successfully.`);
            await loadUniversities(true);
        } catch (err) {
            // Rethrow so the dialog handles and presents the error internally
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(id: number, form: Pick<UniversityForm, "name" | "activeStatus">) {
        setBusy(true);
        try {
            await updateUniversity(id, form);
            setDialog(null);
            setNotice("University updated successfully.");
            toast.success("University updated successfully.");
            await loadUniversities(true);
        } catch (err) {
            // Rethrow so the dialog handles and presents the error internally
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setBusy(true);
        try {
            await deleteUniversity(id);
            setDialog(null);
            setNotice("University deleted successfully.");
            toast.success("University removed successfully.");
            await loadUniversities(true);
        } catch (err) {
            // Rethrow so the dialog handles and presents the error internally
            throw err;
        } finally {
            setBusy(false);
        }
    }

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setSort("NEWEST");
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
    };

    const hasActiveFilters = search.trim() !== "" || statusFilter !== "ALL" || sort !== "NEWEST";

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-7 p-4 text-white sm:p-6 lg:p-8"
        >
            {/* Header & Breadcrumbs */}
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Dashboard</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Universities</span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Universities</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage institution registrations, monitor student & faculty statistics, and configure operational status.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void loadUniversities(true)}
                            disabled={loading || refreshing}
                            title="Refresh data"
                            aria-label="Refresh university list"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing || loading ? "animate-spin text-cyan-400" : ""} />
                            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => openDialog("CREATE")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                        >
                            <Plus size={19} />
                            Add University
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
                        className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-sm ${
                            pageError
                                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {pageError ? (
                                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                            ) : (
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                            )}
                            <div>
                                <p className="font-semibold text-white">{pageError ? "Error Occurred" : "Success"}</p>
                                <p className="mt-0.5 text-xs sm:text-sm">{pageError || notice}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {pageError && (
                                <button
                                    type="button"
                                    onClick={() => void loadUniversities()}
                                    className="rounded-lg border border-rose-400/30 bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/30"
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
                                <X size={17} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metric / Statistics Cards */}
            <section aria-label="University statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.06 }}
                            whileHover={reduceMotion ? undefined : { y: -3 }}
                            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-300">{stat.label}</p>
                                    <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                                        {loading ? (
                                            <span className="inline-block h-8 w-20 animate-pulse rounded bg-white/10" />
                                        ) : (
                                            stat.value
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                                    <Icon size={23} />
                                </div>
                            </div>
                            <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
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

            {/* Main Data Table & Filtering */}
            <GlassCard>
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 lg:grid-cols-[minmax(220px,1fr)_190px_190px_auto]">
                    {/* Search Field */}
                    <div className="relative">
                        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            aria-label="Search universities by name or code"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or code..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-10 pr-9 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div>
                        <div className="relative">
                            <select
                                id="status-filter"
                                aria-label="Filter by active status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                            >
                                <option value="ALL">All statuses</option>
                                <option value="ENABLE">Active</option>
                                <option value="DISABLE">Inactive</option>
                            </select>
                            <ChevronDown
                                size={15}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Sort Filter */}
                    <div>
                        <div className="relative">
                            <select
                                id="sort-filter"
                                aria-label="Sort universities"
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortOption)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                            >
                                <option value="NEWEST">Highest ID first</option>
                                <option value="NAME_ASC">Name: A to Z</option>
                                <option value="NAME_DESC">Name: Z to A</option>
                                <option value="CODE_ASC">Code: A to Z</option>
                            </select>
                            <ArrowDownUp
                                size={15}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Reset Filter Button (conditional) */}
                    {hasActiveFilters && (
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-full w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white lg:w-auto"
                            >
                                <RotateCcw size={14} />
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Table Container */}
                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[950px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">University</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-4 py-4 text-right font-medium">Students</th>
                                <th className="px-4 py-4 text-right font-medium">Faculties</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`loading-${i}`}>
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <td key={j} className="px-4 py-5">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && universities.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">Failed to load universities</p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">{pageError}</p>
                                        <button
                                            type="button"
                                            onClick={() => void loadUniversities()}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                        >
                                            <RefreshCw size={15} />
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : visible.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visible.map((u, index) => {
                                        const initials = (u.name || "UN")
                                            .trim()
                                            .split(/\s+/)
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((part) => part[0])
                                            .join("")
                                            .toUpperCase() || "UN";

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={u.id}
                                                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="group transition-colors hover:bg-cyan-400/[0.035]"
                                            >
                                                <td className="px-5 py-5 text-slate-500">
                                                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-cyan-200">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-xs truncate font-semibold text-slate-100">
                                                                {u.name || "Unnamed University"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                ID: {u.id}
                                                                {u.school?.name ? ` · ${u.school.name}` : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {u.code || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <span
                                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                                            u.activeStatus === "ENABLE"
                                                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                                                : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                u.activeStatus === "ENABLE" ? "bg-emerald-400" : "bg-amber-400"
                                                            }`}
                                                        />
                                                        {u.activeStatus === "ENABLE" ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-right tabular-nums text-slate-300">
                                                    {formatNumber(u.noOfStudent)}
                                                </td>
                                                <td className="px-4 py-5 text-right tabular-nums text-slate-300">
                                                    {formatNumber(u.noOfTeacher)}
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("VIEW", u)}
                                                            aria-label={`View details of ${u.name}`}
                                                            title="View details"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={17} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("EDIT", u)}
                                                            aria-label={`Edit ${u.name}`}
                                                            title="Edit university"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                        >
                                                            <Pencil size={17} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("DELETE", u)}
                                                            aria-label={`Delete ${u.name}`}
                                                            title="Delete university"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rose-400 transition hover:border-rose-400/30 hover:bg-rose-400/10"
                                                        >
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Building2 size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters ? "No matching universities found" : "No universities registered yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search term, changing status filter, or clearing search criteria."
                                                : "Get started by registering your organization's first university."}
                                        </p>
                                        <div className="mt-5 flex justify-center gap-3">
                                            {hasActiveFilters ? (
                                                <button
                                                    type="button"
                                                    onClick={resetFilters}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                                                >
                                                    <RotateCcw size={14} />
                                                    Clear Filters
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => openDialog("CREATE")}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plus size={15} />
                                                    Add University
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination Controls */}
                <footer className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        {filtered.length === 0
                            ? "Showing 0 universities"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                  currentPage * PAGE_SIZE,
                                  filtered.length
                              )} of ${filtered.length} universities${
                                  hasActiveFilters && filtered.length !== universities.length
                                      ? ` (filtered from ${universities.length})`
                                      : ""
                              }`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            title="First page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsLeft size={17} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((v) => Math.max(1, v - 1))}
                            aria-label="Previous page"
                            title="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={17} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                            .map((n, i, pages) => (
                                <span key={n} className="contents">
                                    {i > 0 && n - pages[i - 1] > 1 && <span className="px-1 text-slate-500">…</span>}
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setPage(n)}
                                        aria-current={currentPage === n ? "page" : undefined}
                                        className={`min-w-9 rounded-lg border px-3 py-2 text-sm transition ${
                                            currentPage === n
                                                ? "border-cyan-300/40 bg-gradient-to-r from-violet-600 to-blue-500 font-semibold text-white shadow-md shadow-blue-500/20"
                                                : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/10"
                                        }`}
                                    >
                                        {n}
                                    </button>
                                </span>
                            ))}

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                            aria-label="Next page"
                            title="Next page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={17} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            title="Last page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsRight size={17} />
                        </button>
                    </div>
                </footer>
            </GlassCard>

            {/* Modal Dialog */}
            <AnimatePresence>
                {dialog && (
                    <UniversityDialog
                        key={`${dialog.mode}-${dialog.university?.id ?? "new"}`}
                        mode={dialog.mode}
                        university={dialog.university}
                        busy={busy}
                        onClose={() => {
                            if (!busy) setDialog(null);
                        }}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>
        </motion.main>
    );
}
