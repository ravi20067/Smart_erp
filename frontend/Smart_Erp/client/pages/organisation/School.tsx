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
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    GraduationCap,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    X,
} from "lucide-react";

import {
    createSchool,
    deleteSchool,
    extractErrorMessage,
    getSchoolPrefix,
    getSchools,
    getUniversityFilter,
    updateSchool,
    type ActiveStatus,
    type CommonDTO,
    type PermissionAction,
    type SchoolRequest,
    type SchoolResponse,
} from "@/services/org/schoolService";

/* -------------------------------------------------------------------------- */
/* Constants and local types                                                  */
/* -------------------------------------------------------------------------- */

type StatusFilter = "ALL" | ActiveStatus;
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "CODE_ASC";
type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";

interface SchoolForm {
    universityId: number | "";
    name: string;
    code: string;
    activeStatus: ActiveStatus;
}

interface FieldErrors {
    universityId?: string;
    name?: string;
    code?: string;
}

const EMPTY_FORM: SchoolForm = {
    universityId: "",
    name: "",
    code: "",
    activeStatus: "ENABLE",
};

const PAGE_SIZE = 5;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number | null | undefined): string {
    return typeof value === "number" && Number.isFinite(value)
        ? new Intl.NumberFormat("en-IN").format(value)
        : "—";
}

function getSchoolActions(school: SchoolResponse): PermissionAction[] {
    return Array.isArray(school.permissionActions)
        ? school.permissionActions
        : [];
}

function hasPermission(
    school: SchoolResponse,
    action: PermissionAction
): boolean {
    return getSchoolActions(school).includes(action);
}

/**
 * School codes returned by the API may include the fixed prefix.
 * The form edits only the part after that prefix.
 */
function removePrefix(code: string | null | undefined, prefix: string): string {
    const value = (code ?? "").trim();

    if (prefix && value.startsWith(prefix)) {
        return value.slice(prefix.length).trim();
    }

    return value;
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
            className={`rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

function FieldError({ children }: { children?: string }) {
    if (!children) return null;

    return (
        <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-400"
            role="alert"
        >
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </motion.p>
    );
}

function StatusBadge({ status }: { status: ActiveStatus }) {
    const active = status === "ENABLE";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${active
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-400/30 bg-amber-500/10 text-amber-300"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-amber-400"
                    }`}
            />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/* School dialog                                                              */
/* -------------------------------------------------------------------------- */

interface SchoolDialogProps {
    mode: DialogMode;
    school: SchoolResponse | null;
    universities: CommonDTO[];
    busy: boolean;
    onClose: () => void;
    onCreate: (
        universityId: number,
        request: { name: string; code: string }
    ) => Promise<void>;
    onUpdate: (request: SchoolRequest) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

function SchoolDialog({
    mode,
    school,
    universities,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: SchoolDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<SchoolForm>(() => ({
        universityId: school?.university?.id ?? "",
        name: school?.name ?? "",
        code: school?.code ?? "",
        activeStatus: school?.activeStatus ?? "ENABLE",
    }));

    const [prefix, setPrefix] = useState("");
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const title: Record<DialogMode, string> = {
        CREATE: "Create School",
        EDIT: "Edit School",
        VIEW: "School Details",
        DELETE: "Delete School",
    };

    const selectedUniversity = universities.find(
        (item) => item.id === Number(form.universityId)
    );

    const selectedUniversityName =
        selectedUniversity?.name ?? school?.university?.name ?? "—";

    const universityCode =
        selectedUniversity?.code ?? school?.university?.code ?? "";

    /*
     * Load the fixed prefix for the selected university.
     * During edit, pass schoolId as well because the backend checks permission.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadPrefix() {
            const universityId = Number(form.universityId);

            if (!Number.isFinite(universityId) || universityId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            setPrefixLoading(true);
            setPrefixError("");
            setPrefix("");

            try {
                const result = await getSchoolPrefix(
                    universityId,
                    isEdit && school ? school.id : undefined
                );

                if (!cancelled) {
                    setPrefix(result);
                    setForm((current) => ({
                        ...current,
                        code: isEdit && school
                            ? removePrefix(school.code, result)
                            : current.code,
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    setPrefixError(extractErrorMessage(error));
                }
            } finally {
                if (!cancelled) {
                    setPrefixLoading(false);
                }
            }
        }

        void loadPrefix();

        return () => {
            cancelled = true;
        };
    }, [form.universityId, isEdit, school?.id]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof SchoolForm>(
        key: K,
        value: SchoolForm[K]
    ) {
        setForm((current) => ({ ...current, [key]: value }));

        setFieldErrors((current) => ({
            ...current,
            [key]: undefined,
        }));

        setDialogError("");
    }

    function validate(): boolean {
        const errors: FieldErrors = {};
        const name = form.name.trim();
        const code = form.code.trim();

        if (isCreate) {
            const universityId = Number(form.universityId);

            if (!form.universityId || universityId <= 0) {
                errors.universityId = "Please select a university.";
            } else if (
                !universities.some((item) => item.id === universityId)
            ) {
                errors.universityId =
                    "The selected university is no longer available.";
            }
        }

        if (!name) {
            errors.name = "School name is required.";
        } else if (name.length < 2) {
            errors.name = "School name must contain at least 2 characters.";
        } else if (name.length > 150) {
            errors.name = "School name cannot exceed 150 characters.";
        }

        if (!prefix) {
            errors.code = "The school prefix could not be loaded.";
        } else if (!code) {
            errors.code = "School code is required.";
        } else if (code.length > 40) {
            errors.code = "School code cannot exceed 40 characters.";
        } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
            errors.code =
                "Use only letters, numbers, hyphens, and underscores.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setDialogError("");

        if (isDelete) {
            if (!school) {
                setDialogError("No school was selected for deletion.");
                return;
            }

            try {
                await onDelete(school.id);
            } catch (error) {
                const message = extractErrorMessage(error);
                const lower = message.toLowerCase();

                setDialogError(
                    lower.includes("constraint") ||
                        lower.includes("foreign key") ||
                        lower.includes("cannot delete")
                        ? "This school has related records. Remove or reassign the related records before deleting it."
                        : message
                );
            }

            return;
        }

        if (isView) {
            onClose();
            return;
        }

        if (prefixLoading) {
            setDialogError("Please wait while the school prefix loads.");
            return;
        }

        if (prefixError) {
            setDialogError(prefixError);
            return;
        }

        if (!validate()) return;

        const name = form.name.trim();
        const code = form.code.trim();

        try {
            if (isCreate) {
                await onCreate(Number(form.universityId), {
                    name,
                    code,
                });
            } else if (isEdit && school) {
                await onUpdate({
                    id: school.id,
                    name,
                    code,
                    activeStatus: form.activeStatus,
                });
            }
        } catch (error) {
            setDialogError(extractErrorMessage(error));
        }
    }

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !busy
                ) {
                    onClose();
                }
            }}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="school-dialog-title"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · School Management
                        </p>
                        <h2
                            id="school-dialog-title"
                            className="mt-1 text-xl font-semibold text-white"
                        >
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

                <form
                    onSubmit={submit}
                    noValidate
                    className="space-y-5 p-5 sm:p-6"
                >
                    <AnimatePresence>
                        {dialogError && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200"
                            >
                                <AlertCircle
                                    size={18}
                                    className="mt-0.5 shrink-0 text-rose-400"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-rose-300">
                                        Action could not be completed
                                    </p>
                                    <p className="mt-1 break-words text-xs leading-relaxed">
                                        {dialogError}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDialogError("")}
                                    aria-label="Dismiss error"
                                    className="text-rose-400 hover:text-rose-200"
                                >
                                    <X size={15} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isDelete ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                                <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">
                                        Delete this school?
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                                        You are about to delete{" "}
                                        <strong className="text-white">
                                            {school?.name}
                                        </strong>
                                        . This action may be blocked if related
                                        records exist.
                                    </p>
                                    <p className="mt-2 font-mono text-xs text-cyan-300">
                                        {school?.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label
                                    htmlFor="school-university"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    University{" "}
                                    {isCreate && (
                                        <span className="text-cyan-400">*</span>
                                    )}
                                </label>

                                {isCreate ? (
                                    <>
                                        <div className="relative">
                                            <select
                                                id="school-university"
                                                value={form.universityId}
                                                onChange={(event) =>
                                                    changeField(
                                                        "universityId",
                                                        event.target.value
                                                            ? Number(event.target.value)
                                                            : ""
                                                    )
                                                }
                                                disabled={
                                                    busy ||
                                                    universities.length === 0
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-60"
                                            >
                                                <option value="">
                                                    Select university
                                                </option>

                                                {universities.map((university) => (
                                                    <option
                                                        key={university.id}
                                                        value={university.id}
                                                    >
                                                        {university.name}
                                                        {university.code
                                                            ? ` (${university.code})`
                                                            : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown
                                                size={16}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                        </div>

                                        {universities.length === 0 && (
                                            <p className="mt-2 text-xs text-amber-300">
                                                No universities are available.
                                                School creation is not allowed.
                                            </p>
                                        )}
                                        <FieldError>
                                            {fieldErrors.universityId}
                                        </FieldError>
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                                        <p className="font-medium text-white">
                                            {selectedUniversityName}
                                        </p>
                                        {universityCode && (
                                            <p className="mt-1 font-mono text-xs text-cyan-300">
                                                {universityCode}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="school-name"
                                        className="text-sm font-medium text-slate-300"
                                    >
                                        School Name{" "}
                                        <span className="text-cyan-400">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        {form.name.length}/150
                                    </span>
                                </div>

                                <input
                                    id="school-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        changeField("name", event.target.value)
                                    }
                                    readOnly={readOnly || busy}
                                    maxLength={150}
                                    placeholder="e.g. School of Computer Science"
                                    className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 ${fieldErrors.name
                                            ? "border-rose-500/60 focus:border-rose-400"
                                            : "border-white/10 focus:border-cyan-400/60"
                                        } read-only:opacity-75`}
                                />

                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            <div>
                                <label
                                    htmlFor="school-code"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    School Code{" "}
                                    <span className="text-cyan-400">*</span>
                                </label>

                                <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[45%] items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-cyan-300 sm:px-4">
                                        <span className="truncate">
                                            {prefixLoading
                                                ? "Loading…"
                                                : prefix || "PREFIX"}
                                        </span>
                                    </div>

                                    <input
                                        id="school-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        readOnly={readOnly || busy}
                                        maxLength={40}
                                        placeholder="SCHOOL01"
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 read-only:opacity-75 sm:px-4"
                                    />
                                </div>

                                <FieldError>
                                    {fieldErrors.code || prefixError}
                                </FieldError>

                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    The prefix is fixed by the server. Only the
                                    code after the prefix is entered and sent to
                                    the API.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="school-status"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Active Status
                                </label>

                                <div className="relative">
                                    <select
                                        id="school-status"
                                        value={form.activeStatus}
                                        onChange={(event) =>
                                            changeField(
                                                "activeStatus",
                                                event.target.value as ActiveStatus
                                            )
                                        }
                                        disabled={readOnly || busy}
                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/60 disabled:opacity-70"
                                    >
                                        <option value="ENABLE">
                                            Active (Enable)
                                        </option>
                                        <option value="DISABLE">
                                            Inactive (Disable)
                                        </option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                </div>
                            </div>

                            {isView && school && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        School Information
                                    </p>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-xs text-slate-500">
                                                School ID
                                            </p>
                                            <p className="mt-1 font-semibold text-white">
                                                {school.id}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-xs text-slate-500">
                                                Departments
                                            </p>
                                            <p className="mt-1 font-semibold text-white">
                                                {formatNumber(
                                                    school.departments?.length ?? 0
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="text-xs text-slate-500">
                                            Available permissions
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {getSchoolActions(school).length ? (
                                                getSchoolActions(school).map(
                                                    (action) => (
                                                        <span
                                                            key={action}
                                                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-xs text-cyan-300"
                                                        >
                                                            {action}
                                                        </span>
                                                    )
                                                )
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    No update or delete
                                                    permissions returned.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <p className="mb-2 text-xs text-slate-500">
                                            Departments
                                        </p>
                                        {school.departments?.length ? (
                                            <div className="flex flex-wrap gap-2">
                                                {school.departments.map(
                                                    (department) => (
                                                        <span
                                                            key={department.id}
                                                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300"
                                                        >
                                                            {department.name}
                                                            {department.code
                                                                ? ` (${department.code})`
                                                                : ""}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500">
                                                No departments linked.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
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
                                disabled={
                                    busy ||
                                    prefixLoading ||
                                    (isCreate && universities.length === 0)
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${isDelete
                                        ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20"
                                        : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                    }`}
                            >
                                {busy || prefixLoading ? (
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : isDelete ? (
                                    <Trash2 size={16} />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}

                                {busy
                                    ? "Processing..."
                                    : prefixLoading
                                        ? "Loading prefix..."
                                        : isDelete
                                            ? "Confirm Delete"
                                            : isCreate
                                                ? "Create School"
                                                : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main School Management Page                                                */
/* -------------------------------------------------------------------------- */

export default function Schools() {
    const reduceMotion = useReducedMotion();

    const [schools, setSchools] = useState<SchoolResponse[]>([]);
    const [universities, setUniversities] = useState<CommonDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [universityFilterError, setUniversityFilterError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [universityIdFilter, setUniversityIdFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        school: SchoolResponse | null;
    } | null>(null);

    /*
     * Load the schools and university creation options independently.
     * A university-filter failure does not hide schools already loaded.
     */
    const loadData = useCallback(async (background = false) => {
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError("");
        setUniversityFilterError("");

        try {
            const [schoolResult, universityResult] = await Promise.allSettled([
                getSchools(),
                getUniversityFilter(),
            ]);

            if (schoolResult.status === "rejected") {
                throw schoolResult.reason;
            }

            setSchools(schoolResult.value);

            if (universityResult.status === "fulfilled") {
                const uniqueUniversities = new Map<number, CommonDTO>();

                universityResult.value.forEach((university) => {
                    if (!uniqueUniversities.has(university.id)) {
                        uniqueUniversities.set(university.id, university);
                    }
                });

                setUniversities(
                    Array.from(uniqueUniversities.values()).sort((a, b) =>
                        a.name.localeCompare(b.name)
                    )
                );
            } else {
                setUniversities([]);
                const message = extractErrorMessage(
                    universityResult.reason
                );
                setUniversityFilterError(message);
                toast.error("Could not load university options: " + message);
            }
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error("Failed to load schools: " + message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!notice) return;

        const timer = window.setTimeout(() => setNotice(""), 5000);
        return () => window.clearTimeout(timer);
    }, [notice]);

    /*
     * Build a unique university list from schools for the table filter.
     * The creation dialog continues to use the dedicated university API.
     */
    const tableUniversities = useMemo(() => {
        const unique = new Map<number, CommonDTO>();

        schools.forEach((school) => {
            const university = school.university;

            if (
                university &&
                Number.isFinite(Number(university.id)) &&
                !unique.has(university.id)
            ) {
                unique.set(university.id, university);
            }
        });

        return Array.from(unique.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [schools]);

    const stats = useMemo(() => {
        const total = schools.length;
        const active = schools.filter(
            (school) => school.activeStatus === "ENABLE"
        ).length;
        const inactive = schools.filter(
            (school) => school.activeStatus === "DISABLE"
        ).length;
        const departments = schools.reduce(
            (sum, school) => sum + (school.departments?.length ?? 0),
            0
        );

        return [
            {
                label: "Total Schools",
                value: formatNumber(total),
                icon: Building2,
                tone: "cyan",
            },
            {
                label: "Active Schools",
                value: formatNumber(active),
                icon: GraduationCap,
                tone: "green",
            },
            {
                label: "Inactive Schools",
                value: formatNumber(inactive),
                icon: ShieldCheck,
                tone: "purple",
            },
            {
                label: "Departments",
                value: formatNumber(departments),
                icon: Building2,
                tone: "blue",
            },
        ];
    }, [schools]);

    const filteredSchools = useMemo(() => {
        const query = search.trim().toLowerCase();

        const result = schools.filter((school) => {
            const name = (school.name ?? "").toLowerCase();
            const code = (school.code ?? "").toLowerCase();
            const universityName = (
                school.university?.name ?? ""
            ).toLowerCase();
            const universityCode = (
                school.university?.code ?? ""
            ).toLowerCase();

            const matchesSearch =
                !query ||
                name.includes(query) ||
                code.includes(query) ||
                universityName.includes(query) ||
                universityCode.includes(query);

            const matchesStatus =
                statusFilter === "ALL" ||
                school.activeStatus === statusFilter;

            const matchesUniversity =
                universityIdFilter === "ALL" ||
                school.university?.id === Number(universityIdFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesUniversity
            );
        });

        return result.sort((a, b) => {
            if (sort === "NAME_ASC") {
                return (a.name ?? "").localeCompare(b.name ?? "");
            }

            if (sort === "NAME_DESC") {
                return (b.name ?? "").localeCompare(a.name ?? "");
            }

            if (sort === "CODE_ASC") {
                return (a.code ?? "").localeCompare(b.code ?? "");
            }

            return (b.id ?? 0) - (a.id ?? 0);
        });
    }, [schools, search, statusFilter, universityIdFilter, sort]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSchools.length / PAGE_SIZE)
    );

    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const visibleSchools = filteredSchools.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, universityIdFilter, sort]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "ALL" ||
        universityIdFilter !== "ALL" ||
        sort !== "NEWEST";

    const canCreate = universities.length > 0;

    async function openCreateDialog() {
        setPageError("");
        setUniversityFilterError("");

        try {
            /*
             * Always refresh the university filter before showing the create
             * form so a stale list cannot authorize a creation attempt.
             */
            const result = await getUniversityFilter();
            const unique = new Map<number, CommonDTO>();

            result.forEach((university) => {
                if (!unique.has(university.id)) {
                    unique.set(university.id, university);
                }
            });

            const options = Array.from(unique.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
            );

            setUniversities(options);

            if (options.length === 0) {
                toast.error(
                    "No universities are available. A school cannot be created."
                );
                return;
            }

            setDialog({ mode: "CREATE", school: null });
        } catch (error) {
            const message = extractErrorMessage(error);
            setUniversityFilterError(message);
            toast.error("Cannot create a school: " + message);
        }
    }

    function openDialog(
        mode: DialogMode,
        school: SchoolResponse | null = null
    ) {
        setPageError("");
        setNotice("");
        setDialog({ mode, school });
    }

    async function handleCreate(
        universityId: number,
        request: { name: string; code: string }
    ) {
        setBusy(true);

        try {
            await createSchool(universityId, request);
            setDialog(null);
            setNotice("School created successfully.");
            toast.success(`School "${request.name}" created successfully.`);
            await loadData(true);
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(request: SchoolRequest) {
        setBusy(true);

        try {
            await updateSchool(request);
            setDialog(null);
            setNotice("School updated successfully.");
            toast.success("School updated successfully.");
            await loadData(true);
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setBusy(true);

        try {
            const message = await deleteSchool(id);
            setDialog(null);
            setNotice(message || "School deleted successfully.");
            toast.success(message || "School deleted successfully.");
            await loadData(true);
        } finally {
            setBusy(false);
        }
    }

    function resetFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setUniversityIdFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    }

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
    };

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-7 p-4 text-white sm:p-6 lg:p-8"
        >
            {/* Page heading */}
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Dashboard</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Schools</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Administration
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            School Management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage schools, view their university associations,
                            and control school records through your assigned
                            permissions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            title="Refresh school data"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loading || refreshing
                                        ? "animate-spin text-cyan-400"
                                        : ""
                                }
                            />
                            <span className="hidden sm:inline">
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => void openCreateDialog()}
                            disabled={!canCreate || loading || refreshing}
                            title={
                                canCreate
                                    ? "Create a school"
                                    : "A university is required before creating a school"
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Add School
                        </button>
                    </div>
                </div>
            </section>

            {/* Error and success banners */}
            <AnimatePresence>
                {(pageError || notice || universityFilterError) && (
                    <motion.div
                        role={pageError ? "alert" : "status"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-sm ${pageError
                                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                                : universityFilterError
                                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            }`}
                    >
                        <div className="flex min-w-0 items-start gap-3">
                            {pageError ? (
                                <AlertTriangle
                                    size={18}
                                    className="mt-0.5 shrink-0 text-rose-400"
                                />
                            ) : universityFilterError ? (
                                <AlertCircle
                                    size={18}
                                    className="mt-0.5 shrink-0 text-amber-400"
                                />
                            ) : (
                                <CheckCircle2
                                    size={18}
                                    className="mt-0.5 shrink-0 text-emerald-400"
                                />
                            )}

                            <div className="min-w-0">
                                <p className="font-semibold text-white">
                                    {pageError
                                        ? "Could not load schools"
                                        : universityFilterError
                                            ? "University options unavailable"
                                            : "Success"}
                                </p>
                                <p className="mt-1 break-words text-xs sm:text-sm">
                                    {pageError ||
                                        universityFilterError ||
                                        notice}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {pageError && (
                                <button
                                    type="button"
                                    onClick={() => void loadData()}
                                    className="rounded-lg border border-rose-400/30 bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/30"
                                >
                                    Retry
                                </button>
                            )}

                            {universityFilterError && (
                                <button
                                    type="button"
                                    onClick={() => void openCreateDialog()}
                                    className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20"
                                >
                                    Retry
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setPageError("");
                                    setNotice("");
                                    setUniversityFilterError("");
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

            {/* Statistics */}
            <section
                aria-label="School statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={
                                reduceMotion ? false : { opacity: 0, y: 14 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: reduceMotion ? 0 : index * 0.06,
                            }}
                            whileHover={
                                reduceMotion ? undefined : { y: -3 }
                            }
                            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-300">
                                        {stat.label}
                                    </p>
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
                                    animate={{
                                        width: loading ? "30%" : "100%",
                                    }}
                                    transition={{
                                        duration: 0.7,
                                        delay: index * 0.08,
                                    }}
                                    className="h-full rounded-full bg-current opacity-60"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </section>

            {/* School table and filters */}
            <GlassCard>
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 xl:grid-cols-[minmax(220px,1fr)_190px_230px_190px_auto]">
                    <div className="relative">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search schools"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search school, code, university..."
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

                    <div className="relative">
                        <select
                            aria-label="Filter by school status"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
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

                    <div className="relative">
                        <select
                            aria-label="Filter by university"
                            value={universityIdFilter}
                            onChange={(event) =>
                                setUniversityIdFilter(event.target.value)
                            }
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-3 pr-9 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                            <option value="ALL">All universities</option>
                            {tableUniversities.map((university) => (
                                <option
                                    key={university.id}
                                    value={university.id}
                                >
                                    {university.name}
                                    {university.code
                                        ? ` (${university.code})`
                                        : ""}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Sort schools"
                            value={sort}
                            onChange={(event) =>
                                setSort(event.target.value as SortOption)
                            }
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

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    )}
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">#</th>
                                <th className="px-4 py-4 font-medium">School</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">University</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-4 py-4 text-right font-medium">
                                    Departments
                                </th>
                                <th className="px-5 py-4 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: PAGE_SIZE }).map(
                                    (_, rowIndex) => (
                                        <tr key={`loading-${rowIndex}`}>
                                            {Array.from({ length: 7 }).map(
                                                (_, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className="px-4 py-5"
                                                    >
                                                        <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    )
                                )
                            ) : pageError && schools.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load schools
                                        </p>
                                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
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
                            ) : visibleSchools.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleSchools.map((school, index) => {
                                        const initials =
                                            (school.name || "SC")
                                                .trim()
                                                .split(/\s+/)
                                                .filter(Boolean)
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase() || "SC";

                                        const canUpdate = hasPermission(
                                            school,
                                            "UPDATE"
                                        );
                                        const canDelete = hasPermission(
                                            school,
                                            "DELETE"
                                        );

                                        return (
                                            <motion.tr
                                                layout={!reduceMotion}
                                                key={school.id}
                                                initial={
                                                    reduceMotion
                                                        ? false
                                                        : {
                                                            opacity: 0,
                                                            x: -6,
                                                        }
                                                }
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="group transition-colors hover:bg-cyan-400/[0.035]"
                                            >
                                                <td className="px-5 py-5 text-slate-500">
                                                    {(currentPage - 1) *
                                                        PAGE_SIZE +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-cyan-200">
                                                            {initials}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="max-w-xs truncate font-semibold text-slate-100">
                                                                {school.name ||
                                                                    "Unnamed School"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                ID: {school.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <span className="inline-flex max-w-[180px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {school.code || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="max-w-[220px]">
                                                        <p className="truncate font-medium text-slate-200">
                                                            {school.university
                                                                ?.name || "—"}
                                                        </p>
                                                        {school.university
                                                            ?.code && (
                                                                <p className="mt-1 truncate font-mono text-xs text-slate-500">
                                                                    {
                                                                        school
                                                                            .university
                                                                            .code
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <StatusBadge
                                                        status={
                                                            school.activeStatus
                                                        }
                                                    />
                                                </td>

                                                <td className="px-4 py-5 text-right tabular-nums text-slate-300">
                                                    {formatNumber(
                                                        school.departments
                                                            ?.length ?? 0
                                                    )}
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        {/* View is read-only and does not need UPDATE/DELETE permission. */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDialog(
                                                                    "VIEW",
                                                                    school
                                                                )
                                                            }
                                                            aria-label={`View ${school.name}`}
                                                            title="View details"
                                                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                        >
                                                            <Eye size={17} />
                                                        </button>

                                                        {canUpdate && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDialog(
                                                                        "EDIT",
                                                                        school
                                                                    )
                                                                }
                                                                aria-label={`Edit ${school.name}`}
                                                                title="Edit school"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                            >
                                                                <Pencil
                                                                    size={17}
                                                                />
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDialog(
                                                                        "DELETE",
                                                                        school
                                                                    )
                                                                }
                                                                aria-label={`Delete ${school.name}`}
                                                                title="Delete school"
                                                                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rose-400 transition hover:border-rose-400/30 hover:bg-rose-400/10"
                                                            >
                                                                <Trash2
                                                                    size={17}
                                                                />
                                                            </button>
                                                        )}

                                                        {!canUpdate &&
                                                            !canDelete && (
                                                                <span className="self-center text-xs text-slate-500">
                                                                    View only
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                                            <Building2 size={25} />
                                        </div>

                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching schools found"
                                                : "No schools registered yet"}
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : "Schools will appear here after they are created."}
                                        </p>

                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                                            >
                                                <RotateCcw size={14} />
                                                Clear Filters
                                            </button>
                                        )}

                                        {!hasActiveFilters && canCreate && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void openCreateDialog()
                                                }
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110"
                                            >
                                                <Plus size={15} />
                                                Add School
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        {filteredSchools.length === 0
                            ? "Showing 0 schools"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1
                            }–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredSchools.length
                            )} of ${filteredSchools.length} schools${hasActiveFilters &&
                                filteredSchools.length !== schools.length
                                ? ` (filtered from ${schools.length})`
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
                            onClick={() =>
                                setPage((value) => Math.max(1, value - 1))
                            }
                            aria-label="Previous page"
                            title="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={17} />
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        )
                            .filter(
                                (number) =>
                                    number === 1 ||
                                    number === totalPages ||
                                    Math.abs(number - currentPage) <= 1
                            )
                            .map((number, index, pages) => (
                                <span key={number} className="contents">
                                    {index > 0 &&
                                        number - pages[index - 1] > 1 && (
                                            <span className="px-1 text-slate-500">
                                                …
                                            </span>
                                        )}

                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setPage(number)}
                                        aria-current={
                                            currentPage === number
                                                ? "page"
                                                : undefined
                                        }
                                        className={`min-w-9 rounded-lg border px-3 py-2 text-sm transition ${currentPage === number
                                                ? "border-cyan-300/40 bg-gradient-to-r from-violet-600 to-blue-500 font-semibold text-white shadow-md shadow-blue-500/20"
                                                : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/10"
                                            }`}
                                    >
                                        {number}
                                    </button>
                                </span>
                            ))}

                        <button
                            type="button"
                            disabled={
                                currentPage === totalPages || loading
                            }
                            onClick={() =>
                                setPage((value) =>
                                    Math.min(totalPages, value + 1)
                                )
                            }
                            aria-label="Next page"
                            title="Next page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={17} />
                        </button>

                        <button
                            type="button"
                            disabled={
                                currentPage === totalPages || loading
                            }
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            title="Last page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronsRight size={17} />
                        </button>
                    </div>
                </div>
            </GlassCard>

            {/* Dialog */}
            <AnimatePresence>
                {dialog && (
                    <SchoolDialog
                        key={`${dialog.mode}-${dialog.school?.id ?? "new"}`}
                        mode={dialog.mode}
                        school={dialog.school}
                        universities={universities}
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