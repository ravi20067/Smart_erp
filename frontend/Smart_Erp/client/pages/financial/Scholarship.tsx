
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertCircle,
    Award,
    BadgeIndianRupee,
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
    Sparkles,
    Trash2,
    X,
} from "lucide-react";

import { getUniversityFilter } from "@/services/org/schoolService";
import {
    createScholarship,
    deleteScholarship,
    extractScholarshipError,
    getScholarshipPrefix,
    getScholarships,
    updateScholarship,
    type AmountType,
    type ScholarshipRequest,
    type ScholarshipResponse,
    type ScholarshipType,
    type ScholarshipUniversity,
} from "@/services/financial/scholarshipService";

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortOption = "NEWEST" | "NAME_ASC" | "NAME_DESC" | "AMOUNT_DESC";

interface ScholarshipForm extends ScholarshipRequest {
    universityId: number | "";
}

const EMPTY_FORM: ScholarshipForm = {
    universityId: "",
    name: "",
    code: "",
    description: "",
    number: 0,
    status: true,
    amountType: "NUMBER",
    scholarshipType: "PERMANENT",
};

const PAGE_SIZE = 8;

const inputClass =
    "w-full min-w-0 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50";

const selectClass = `${inputClass} appearance-none pr-10`;

const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

function formatAmount(
    amount: number | null | undefined,
    type: AmountType
): string {
    const value = Number(amount);

    if (!Number.isFinite(value)) return "—";

    if (type === "PERCENTAGE") {
        return `${new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
        }).format(value)}%`;
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
}

function getInitials(name: string) {
    return (
        name.trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "SC"
    );
}

function getPrefixFromCode(
    code: string,
    universities: ScholarshipUniversity[]
): string {
    const matching = universities
        .filter((university) => university.code?.trim())
        .sort((a, b) => b.code.length - a.code.length)
        .find((university) => code.startsWith(university.code));

    return matching?.code ?? "";
}

function GlassCard({
    children,
    className = "",
}: {
    children: React.ReactNode;
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

function StatusBadge({ active }: { active: boolean }) {
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

function TypeBadge({ type }: { type: ScholarshipType }) {
    const styles: Record<ScholarshipType, string> = {
        PERMANENT:
            "border-violet-400/25 bg-violet-500/10 text-violet-300",
        ENROLLMENT:
            "border-cyan-400/25 bg-cyan-500/10 text-cyan-300",
        ONE_TIME:
            "border-amber-400/25 bg-amber-500/10 text-amber-300",
    };

    return (
        <span
            className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${styles[type]}`}
        >
            {type.replace("_", " ")}
        </span>
    );
}

function ActionButton({
    label,
    onClick,
    children,
    tone = "cyan",
    disabled = false,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    tone?: "cyan" | "rose" | "violet";
    disabled?: boolean;
}) {
    const colors = {
        cyan: "text-sky-300 hover:border-sky-400/30 hover:bg-sky-400/10",
        rose: "text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10",
        violet:
            "text-violet-300 hover:border-violet-400/30 hover:bg-violet-400/10",
    };

    return (
        <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={onClick}
            disabled={disabled}
            title={label}
            aria-label={label}
            className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 transition disabled:opacity-40 ${colors[tone]}`}
        >
            {children}
        </motion.button>
    );
}

interface ScholarshipDialogProps {
    mode: DialogMode;
    scholarship: ScholarshipResponse | null;
    universities: ScholarshipUniversity[];
    busy: boolean;
    onClose: () => void;
    onCreate: (
        universityId: number,
        request: ScholarshipRequest
    ) => Promise<void>;
    onUpdate: (
        id: number,
        request: ScholarshipRequest
    ) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

function ScholarshipDialog({
    mode,
    scholarship,
    universities,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: ScholarshipDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";
    const readOnly = isView || isDelete;

    const [form, setForm] = useState<ScholarshipForm>(() => {
        const prefix = scholarship
            ? getPrefixFromCode(scholarship.code, universities)
            : "";

        return {
            ...EMPTY_FORM,
            ...(scholarship ?? {}),
            universityId: "",
            code: scholarship
                ? scholarship.code.slice(prefix.length)
                : "",
        };
    });

    const [prefix, setPrefix] = useState(() =>
        scholarship
            ? getPrefixFromCode(scholarship.code, universities)
            : ""
    );
    const [prefixLoading, setPrefixLoading] = useState(false);
    const [prefixError, setPrefixError] = useState("");
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof ScholarshipForm, string>>
    >({});

    const selectedUniversity = universities.find(
        (item) => item.id === Number(form.universityId)
    );

    useEffect(() => {
        if (!isCreate) return;

        let cancelled = false;

        async function loadPrefix() {
            const universityId = Number(form.universityId);

            if (!universityId || universityId <= 0) {
                setPrefix("");
                setPrefixError("");
                setPrefixLoading(false);
                return;
            }

            setPrefixLoading(true);
            setPrefix("");
            setPrefixError("");

            try {
                const value = await getScholarshipPrefix(universityId);

                if (!cancelled) setPrefix(value);
            } catch (error) {
                if (!cancelled) {
                    setPrefixError(extractScholarshipError(error));
                }
            } finally {
                if (!cancelled) setPrefixLoading(false);
            }
        }

        void loadPrefix();

        return () => {
            cancelled = true;
        };
    }, [form.universityId, isCreate]);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !busy) onClose();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [busy, onClose]);

    function changeField<K extends keyof ScholarshipForm>(
        key: K,
        value: ScholarshipForm[K]
    ) {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
        setFormError("");
    }

    function validate(): boolean {
        const errors: Partial<
            Record<keyof ScholarshipForm, string>
        > = {};

        if (isCreate && !Number(form.universityId)) {
            errors.universityId = "Select a university.";
        }

        if (!form.name.trim()) {
            errors.name = "Scholarship name is required.";
        } else if (form.name.trim().length > 150) {
            errors.name = "Name cannot exceed 150 characters.";
        }

        if (!form.code.trim()) {
            errors.code = "Scholarship code is required.";
        } else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) {
            errors.code = "Use letters, numbers, hyphens, or underscores.";
        } else if (form.code.trim().length > 60) {
            errors.code = "Code cannot exceed 60 characters.";
        }

        if (form.description.length > 2000) {
            errors.description = "Description cannot exceed 2000 characters.";
        }

        if (!Number.isFinite(Number(form.number)) || Number(form.number) < 0) {
            errors.number = "Enter a valid, non-negative amount.";
        }

        if (
            form.amountType === "PERCENTAGE" &&
            Number(form.number) > 100
        ) {
            errors.number = "Percentage must not exceed 100.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");

        if (isView) {
            onClose();
            return;
        }

        if (isDelete) {
            if (!scholarship) {
                setFormError("No scholarship was selected.");
                return;
            }

            try {
                await onDelete(scholarship.id);
            } catch (error) {
                setFormError(extractScholarshipError(error));
            }

            return;
        }

        if (prefixLoading) {
            setFormError("Wait for the scholarship prefix to load.");
            return;
        }

        if (prefixError) {
            setFormError(prefixError);
            return;
        }

        if (!validate()) return;

        if (!isCreate && !isEdit) return;

        const request: ScholarshipRequest = {
            name: form.name.trim(),
            code: form.code.trim(),
            description: form.description.trim(),
            number: Number(form.number),
            status: Boolean(form.status),
            amountType: form.amountType,
            scholarshipType: form.scholarshipType,
        };

        try {
            if (isCreate) {
                await onCreate(Number(form.universityId), request);
            } else if (isEdit && scholarship) {
                await onUpdate(scholarship.id, request);
            }
        } catch (error) {
            setFormError(extractScholarshipError(error));
        }
    }

    const titles: Record<DialogMode, string> = {
        CREATE: "Create Scholarship",
        EDIT: "Edit Scholarship",
        VIEW: "Scholarship Details",
        DELETE: "Delete Scholarship",
    };

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:p-5"
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
                aria-labelledby="scholarship-dialog-title"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0c1530] shadow-[0_0_70px_rgba(59,130,246,0.16)]"
            >
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Smart ERP · Finance
                        </p>
                        <h2
                            id="scholarship-dialog-title"
                            className="mt-1 text-xl font-semibold text-white"
                        >
                            {titles[mode]}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={submit}
                    noValidate
                    className="max-h-[calc(100dvh-130px)] space-y-5 overflow-y-auto p-5 sm:p-6"
                >
                    <AnimatePresence>
                        {formError && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
                            >
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                <span className="min-w-0 break-words">{formError}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isDelete ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-5">
                            <Trash2 className="mb-3 text-rose-400" size={28} />
                            <h3 className="font-semibold text-white">
                                Delete this scholarship?
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                You are about to delete{" "}
                                <strong className="text-white">
                                    {scholarship?.name}
                                </strong>
                                . This action cannot be undone. The backend may
                                reject deletion if the scholarship is assigned
                                to students.
                            </p>
                        </div>
                    ) : (
                        <>
                            {isCreate && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        University *
                                    </label>
                                    <div className="relative">
                                        <select
                                            className={selectClass}
                                            value={form.universityId}
                                            onChange={(event) =>
                                                changeField(
                                                    "universityId",
                                                    event.target.value
                                                        ? Number(event.target.value)
                                                        : ""
                                                )
                                            }
                                            disabled={busy || readOnly}
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
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    </div>
                                    {fieldErrors.universityId && (
                                        <p className="mt-1 text-xs text-rose-400">
                                            {fieldErrors.universityId}
                                        </p>
                                    )}
                                    {universities.length === 0 && (
                                        <p className="mt-2 text-xs text-amber-300">
                                            No university options are available.
                                        </p>
                                    )}
                                </div>
                            )}

                            {!isCreate && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        University
                                    </label>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-slate-200">
                                        {scholarship?.university?.name ||
                                            universities.find(
                                                (u) =>
                                                    u.code &&
                                                    scholarship?.code?.startsWith(u.code)
                                            )?.name ||
                                            "—"}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="mb-2 flex justify-between gap-3">
                                    <label className="text-sm font-medium text-slate-300">
                                        Scholarship name *
                                    </label>
                                    <span className="text-xs text-slate-500">
                                        {form.name.length}/150
                                    </span>
                                </div>
                                <input
                                    className={inputClass}
                                    value={form.name}
                                    onChange={(event) =>
                                        changeField("name", event.target.value)
                                    }
                                    placeholder="e.g. Academic Excellence Scholarship"
                                    maxLength={150}
                                    readOnly={readOnly}
                                    disabled={busy}
                                />
                                {fieldErrors.name && (
                                    <p className="mt-1 text-xs text-rose-400">
                                        {fieldErrors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Scholarship code *
                                </label>
                                <div className="flex min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-cyan-400/60">
                                    <div className="flex max-w-[45%] shrink-0 items-center border-r border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-cyan-300">
                                        <span className="truncate">
                                            {isCreate
                                                ? prefixLoading
                                                    ? "Loading…"
                                                    : prefix || "PREFIX"
                                                : prefix || "CODE"}
                                        </span>
                                    </div>
                                    <input
                                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm uppercase text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                                        value={form.code}
                                        onChange={(event) =>
                                            changeField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder="SCHOLARSHIP01"
                                        maxLength={60}
                                        readOnly={readOnly}
                                        disabled={busy}
                                    />
                                </div>
                                {fieldErrors.code && (
                                    <p className="mt-1 text-xs text-rose-400">
                                        {fieldErrors.code}
                                    </p>
                                )}
                                {isEdit && !prefix && (
                                    <p className="mt-1 text-xs text-amber-300">
                                        The university prefix could not be
                                        identified. Verify the complete code
                                        before saving.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Amount type *
                                    </label>
                                    <div className="relative">
                                        <select
                                            className={selectClass}
                                            value={form.amountType}
                                            onChange={(event) =>
                                                changeField(
                                                    "amountType",
                                                    event.target.value as AmountType
                                                )
                                            }
                                            disabled={readOnly || busy}
                                        >
                                            <option value="NUMBER">
                                                Fixed amount (₹)
                                            </option>
                                            <option value="PERCENTAGE">
                                                Percentage (%)
                                            </option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        {form.amountType === "PERCENTAGE"
                                            ? "Percentage *"
                                            : "Amount in INR *"}
                                    </label>
                                    <input
                                        className={inputClass}
                                        type="number"
                                        min="0"
                                        max={
                                            form.amountType === "PERCENTAGE"
                                                ? 100
                                                : undefined
                                        }
                                        step="0.01"
                                        value={form.number}
                                        onChange={(event) =>
                                            changeField(
                                                "number",
                                                event.target.value === ""
                                                    ? 0
                                                    : Number(event.target.value)
                                            )
                                        }
                                        readOnly={readOnly}
                                        disabled={busy}
                                    />
                                    {fieldErrors.number && (
                                        <p className="mt-1 text-xs text-rose-400">
                                            {fieldErrors.number}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-slate-500">
                                        Preview:{" "}
                                        {formatAmount(form.number, form.amountType)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Scholarship type *
                                </label>
                                <div className="relative">
                                    <select
                                        className={selectClass}
                                        value={form.scholarshipType}
                                        onChange={(event) =>
                                            changeField(
                                                "scholarshipType",
                                                event.target.value as ScholarshipType
                                            )
                                        }
                                        disabled={readOnly || busy}
                                    >
                                        <option value="PERMANENT">Permanent</option>
                                        <option value="ENROLLMENT">Enrollment</option>
                                        <option value="ONE_TIME">One time</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex justify-between gap-3">
                                    <label className="text-sm font-medium text-slate-300">
                                        Description
                                    </label>
                                    <span className="text-xs text-slate-500">
                                        {form.description.length}/2000
                                    </span>
                                </div>
                                <textarea
                                    className={`${inputClass} min-h-28 resize-y`}
                                    value={form.description}
                                    onChange={(event) =>
                                        changeField("description", event.target.value)
                                    }
                                    placeholder="Describe the scholarship and its purpose..."
                                    maxLength={2000}
                                    readOnly={readOnly}
                                    disabled={busy}
                                />
                                {fieldErrors.description && (
                                    <p className="mt-1 text-xs text-rose-400">
                                        {fieldErrors.description}
                                    </p>
                                )}
                            </div>

                            {!isCreate && (
                                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Scholarship status
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Control whether this scholarship is active.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                            {form.status ? (
                                                <span className="text-emerald-400">Active</span>
                                            ) : (
                                                <span className="text-slate-400">Inactive</span>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={Boolean(form.status)}
                                            aria-label="Scholarship active status"
                                            disabled={readOnly || busy}
                                            onClick={() =>
                                                changeField("status", !form.status)
                                            }
                                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60 ${form.status
                                                ? "bg-emerald-500"
                                                : "bg-slate-700"
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${form.status
                                                    ? "translate-x-5"
                                                    : "translate-x-0"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isView && scholarship && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-xs text-slate-500">
                                            Scholarship ID
                                        </p>
                                        <p className="mt-1 font-semibold text-white">
                                            {scholarship.id}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-xs text-slate-500">
                                            Available permissions
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {scholarship.permissionActions?.length ? (
                                                scholarship.permissionActions.map(
                                                    (action) => (
                                                        <span
                                                            key={action}
                                                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 font-mono text-xs text-cyan-300"
                                                        >
                                                            {action}
                                                        </span>
                                                    )
                                                )
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    No permission actions returned.
                                                </span>
                                            )}
                                        </div>
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
                            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>

                        {!isView && (
                            <button
                                type="submit"
                                disabled={
                                    busy ||
                                    prefixLoading ||
                                    (isCreate &&
                                        (universities.length === 0 || !prefix))
                                }
                                className={`${primaryButton} ${isDelete
                                    ? "!bg-gradient-to-r !from-red-600 !to-rose-500"
                                    : ""
                                    }`}
                            >
                                {busy || prefixLoading ? (
                                    <LoaderCircle size={17} className="animate-spin" />
                                ) : isDelete ? (
                                    <Trash2 size={17} />
                                ) : (
                                    <CheckCircle2 size={17} />
                                )}
                                {busy
                                    ? "Processing..."
                                    : prefixLoading
                                        ? "Loading prefix..."
                                        : isDelete
                                            ? "Confirm Delete"
                                            : isCreate
                                                ? "Create Scholarship"
                                                : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default function Scholarships() {
    const reduceMotion = useReducedMotion();

    const [scholarships, setScholarships] = useState<ScholarshipResponse[]>([]);
    const [universities, setUniversities] = useState<ScholarshipUniversity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [universityError, setUniversityError] = useState("");

    const [search, setSearch] = useState("");
    const [universityFilter, setUniversityFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        scholarship: ScholarshipResponse | null;
    } | null>(null);

    const loadData = useCallback(async (background = false) => {
        if (background) setRefreshing(true);
        else setLoading(true);

        setPageError("");
        setUniversityError("");

        try {
            const [scholarshipResult, universityResult] =
                await Promise.allSettled([
                    getScholarships(),
                    getUniversityFilter(),
                ]);

            if (scholarshipResult.status === "rejected") {
                throw scholarshipResult.reason;
            }

            setScholarships(scholarshipResult.value);

            if (universityResult.status === "fulfilled") {
                const unique = new Map<number, ScholarshipUniversity>();

                universityResult.value.forEach((item) => {
                    if (
                        item &&
                        Number.isFinite(Number(item.id)) &&
                        typeof item.name === "string" &&
                        !unique.has(item.id)
                    ) {
                        unique.set(item.id, {
                            id: item.id,
                            name: item.name,
                            code: item.code ?? "",
                        });
                    }
                });

                setUniversities(
                    Array.from(unique.values()).sort((a, b) =>
                        a.name.localeCompare(b.name)
                    )
                );
            } else {
                setUniversities([]);
                setUniversityError(
                    extractScholarshipError(universityResult.reason)
                );
            }
        } catch (error) {
            setPageError(extractScholarshipError(error));
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
        const timer = window.setTimeout(() => setNotice(""), 4500);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const stats = useMemo(() => {
        const total = scholarships.length;
        const active = scholarships.filter((item) => item.status === true).length;
        const inactive = total - active;
        const percentage = scholarships.filter(
            (item) => item.amountType === "PERCENTAGE"
        ).length;

        return [
            {
                label: "Total Scholarships",
                value: total,
                icon: Award,
                tone: "cyan",
            },
            {
                label: "Active Scholarships",
                value: active,
                icon: ShieldCheck,
                tone: "green",
            },
            {
                label: "Inactive Scholarships",
                value: inactive,
                icon: GraduationCap,
                tone: "purple",
            },
            {
                label: "Percentage Based",
                value: percentage,
                icon: BadgeIndianRupee,
                tone: "blue",
            },
        ];
    }, [scholarships]);

    const filteredScholarships = useMemo(() => {
        const query = search.trim().toLowerCase();
        const targetUniId = universityFilter ? Number(universityFilter) : null;
        const targetUni = targetUniId
            ? universities.find((u) => u.id === targetUniId)
            : null;

        const result = scholarships.filter((item) => {
            const itemUniName =
                item.university?.name ||
                universities.find(
                    (u) => u.code && item.code?.startsWith(u.code)
                )?.name ||
                "";

            const matchesSearch =
                !query ||
                (item.name ?? "").toLowerCase().includes(query) ||
                (item.code ?? "").toLowerCase().includes(query) ||
                (item.description ?? "").toLowerCase().includes(query) ||
                itemUniName.toLowerCase().includes(query);

            const matchesUniversity =
                !targetUniId ||
                item.university?.id === targetUniId ||
                (Boolean(targetUni?.code) &&
                    Boolean(item.code?.startsWith(targetUni!.code)));

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" && item.status === true) ||
                (statusFilter === "INACTIVE" && item.status !== true);

            const matchesType =
                typeFilter === "ALL" || item.scholarshipType === typeFilter;

            return (
                matchesSearch &&
                matchesUniversity &&
                matchesStatus &&
                matchesType
            );
        });

        return result.sort((a, b) => {
            if (sort === "NAME_ASC") return a.name.localeCompare(b.name);
            if (sort === "NAME_DESC") return b.name.localeCompare(a.name);
            if (sort === "AMOUNT_DESC") return Number(b.number) - Number(a.number);
            return b.id - a.id;
        });
    }, [scholarships, search, universityFilter, statusFilter, typeFilter, sort, universities]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredScholarships.length / PAGE_SIZE)
    );

    const currentPage = Math.min(page, totalPages);

    const visibleScholarships = filteredScholarships.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [search, universityFilter, statusFilter, typeFilter, sort]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        universityFilter !== "" ||
        statusFilter !== "ALL" ||
        typeFilter !== "ALL" ||
        sort !== "NEWEST";

    function openDialog(
        mode: DialogMode,
        scholarship: ScholarshipResponse | null = null
    ) {
        setPageError("");
        setNotice("");
        setDialog({ mode, scholarship });
    }

    async function handleCreate(
        universityId: number,
        request: ScholarshipRequest
    ) {
        setBusy(true);
        try {
            await createScholarship(universityId, request);
            setDialog(null);
            setNotice("Scholarship created successfully.");
            toast.success("Scholarship created successfully.");
            await loadData(true);
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(
        id: number,
        request: ScholarshipRequest
    ) {
        setBusy(true);
        try {
            await updateScholarship(id, request);
            setDialog(null);
            setNotice("Scholarship updated successfully.");
            toast.success("Scholarship updated successfully.");
            await loadData(true);
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setBusy(true);
        try {
            const message = await deleteScholarship(id);
            setDialog(null);
            setNotice(message);
            toast.success(message);
            await loadData(true);
        } finally {
            setBusy(false);
        }
    }

    function resetFilters() {
        setSearch("");
        setUniversityFilter("");
        setStatusFilter("ALL");
        setTypeFilter("ALL");
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
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative w-full min-w-0 space-y-7 overflow-x-clip p-4 text-white sm:p-6 lg:p-8"
        >
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Finance</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Scholarships</span>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                            <Sparkles size={14} />
                            FINANCIAL AID MANAGEMENT
                        </div>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                            Scholarship Management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Manage scholarship programs, award values, eligibility
                            categories, and active status from one place.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <motion.button
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loading || refreshing ? "animate-spin text-cyan-400" : ""
                                }
                            />
                            <span className="hidden sm:inline">
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openDialog("CREATE")}
                            disabled={loading || refreshing || universities.length === 0}
                            title={
                                universities.length
                                    ? "Create scholarship"
                                    : "University options are unavailable"
                            }
                            className={primaryButton}
                        >
                            <Plus size={19} />
                            Add Scholarship
                        </motion.button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {(pageError || notice || universityError) && (
                    <motion.div
                        role={pageError ? "alert" : "status"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex flex-col justify-between gap-3 rounded-xl border p-4 text-sm sm:flex-row sm:items-center ${pageError
                            ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                            : universityError
                                ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            }`}
                    >
                        <div className="flex min-w-0 items-start gap-3">
                            {pageError ? (
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            ) : (
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0 break-words">
                                <p className="font-semibold">
                                    {pageError
                                        ? "Could not load scholarships"
                                        : universityError
                                            ? "University options unavailable"
                                            : "Success"}
                                </p>
                                <p className="mt-1">
                                    {pageError || universityError || notice}
                                </p>
                            </div>
                        </div>
                        {pageError && (
                            <button
                                type="button"
                                onClick={() => void loadData()}
                                className="self-start rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 sm:self-center"
                            >
                                Retry
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <section
                aria-label="Scholarship statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={
                                reduceMotion ? false : { opacity: 0, y: 16 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.35,
                                delay: reduceMotion ? 0 : index * 0.07,
                            }}
                            whileHover={reduceMotion ? undefined : { y: -4 }}
                            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-300">
                                        {stat.label}
                                    </p>
                                    <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                                        {loading ? (
                                            <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10" />
                                        ) : (
                                            stat.value.toLocaleString("en-IN")
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

            <GlassCard>
                <div className="grid gap-3 border-b border-white/10 p-4 sm:p-5 xl:grid-cols-[minmax(200px,1fr)_190px_160px_170px_180px_auto]">
                    <div className="relative min-w-0">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search scholarships"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, code, description..."
                            className={`${inputClass} pl-10 pr-9`}
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
                            aria-label="Filter by university"
                            value={universityFilter}
                            onChange={(event) =>
                                setUniversityFilter(event.target.value)
                            }
                            className={selectClass}
                        >
                            <option value="">All universities</option>
                            {universities.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Filter scholarship status"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as StatusFilter)
                            }
                            className={selectClass}
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Filter scholarship type"
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                            className={selectClass}
                        >
                            <option value="ALL">All types</option>
                            <option value="PERMANENT">Permanent</option>
                            <option value="ENROLLMENT">Enrollment</option>
                            <option value="ONE_TIME">One time</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    </div>

                    <div className="relative">
                        <select
                            aria-label="Sort scholarships"
                            value={sort}
                            onChange={(event) =>
                                setSort(event.target.value as SortOption)
                            }
                            className={selectClass}
                        >
                            <option value="NEWEST">Newest first</option>
                            <option value="NAME_ASC">Name: A to Z</option>
                            <option value="NAME_DESC">Name: Z to A</option>
                            <option value="AMOUNT_DESC">Highest amount</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
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

                {/*
                  Desktop: detailed table.
                  Mobile/tablet: responsive cards to avoid horizontal overflow.
                */}
                <div className="hidden min-w-0 overflow-x-auto md:block">
                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-4 font-medium">Scholarship</th>
                                <th className="px-4 py-4 font-medium">Code</th>
                                <th className="px-4 py-4 font-medium">Type</th>
                                <th className="px-4 py-4 font-medium">Award value</th>
                                <th className="px-4 py-4 font-medium">Status</th>
                                <th className="px-5 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.07]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index}>
                                        {Array.from({ length: 6 }).map((__, cell) => (
                                            <td key={cell} className="px-4 py-5">
                                                <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : pageError && scholarships.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <AlertCircle className="mx-auto text-rose-400" size={30} />
                                        <p className="mt-3 font-semibold text-slate-200">
                                            Unable to load scholarships
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void loadData()}
                                            className="mt-4 rounded-xl border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-400/10"
                                        >
                                            Try again
                                        </button>
                                    </td>
                                </tr>
                            ) : visibleScholarships.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {visibleScholarships.map((item, index) => {
                                        const actions = item.permissionActions ?? [];
                                        const itemUni =
                                            item.university?.name ||
                                            universities.find(
                                                (u) =>
                                                    u.code &&
                                                    item.code?.startsWith(u.code)
                                            )?.name;

                                        return (
                                            <motion.tr
                                                key={item.id}
                                                layout={!reduceMotion}
                                                initial={
                                                    reduceMotion
                                                        ? false
                                                        : { opacity: 0, x: -8 }
                                                }
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2, delay: index * 0.025 }}
                                                className="group transition-colors hover:bg-cyan-400/[0.035]"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-sm font-bold text-cyan-200">
                                                            {getInitials(item.name)}
                                                        </div>
                                                        <div className="min-w-0 max-w-[280px]">
                                                            <p className="truncate font-semibold text-slate-100">
                                                                {item.name}
                                                            </p>
                                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                                ID: {item.id}
                                                                {itemUni ? ` · ${itemUni}` : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex max-w-[180px] truncate rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-slate-300">
                                                        {item.code || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <TypeBadge type={item.scholarshipType} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-white">
                                                        {formatAmount(item.number, item.amountType)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {item.amountType === "PERCENTAGE"
                                                            ? "Percentage based"
                                                            : "Fixed amount"}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge active={item.status === true} />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <ActionButton
                                                            label={`View ${item.name}`}
                                                            onClick={() => openDialog("VIEW", item)}
                                                        >
                                                            <Eye size={17} />
                                                        </ActionButton>
                                                        {actions.includes("UPDATE") && (
                                                            <ActionButton
                                                                label={`Edit ${item.name}`}
                                                                onClick={() => openDialog("EDIT", item)}
                                                                tone="violet"
                                                            >
                                                                <Pencil size={17} />
                                                            </ActionButton>
                                                        )}
                                                        {actions.includes("DELETE") && (
                                                            <ActionButton
                                                                label={`Delete ${item.name}`}
                                                                onClick={() => openDialog("DELETE", item)}
                                                                tone="rose"
                                                            >
                                                                <Trash2 size={17} />
                                                            </ActionButton>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300">
                                            <Award size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching scholarships"
                                                : "No scholarships registered yet"}
                                        </p>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : "Create a scholarship to start managing financial aid."}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 gap-3 p-3 md:hidden sm:p-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/[0.035]"
                            />
                        ))
                    ) : visibleScholarships.length ? (
                        <AnimatePresence mode="popLayout">
                            {visibleScholarships.map((item, index) => {
                                const actions = item.permissionActions ?? [];
                                const itemUni =
                                    item.university?.name ||
                                    universities.find(
                                        (u) =>
                                            u.code &&
                                            item.code?.startsWith(u.code)
                                    )?.name;

                                return (
                                    <motion.article
                                        key={item.id}
                                        layout={!reduceMotion}
                                        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        className="min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 font-bold text-cyan-200">
                                                {getInitials(item.name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="break-words font-semibold text-white">
                                                    {item.name}
                                                </h3>
                                                <p className="mt-1 break-all font-mono text-xs text-slate-500">
                                                    {item.code || "No code"} · ID {item.id}
                                                    {itemUni ? ` · ${itemUni}` : ""}
                                                </p>
                                            </div>
                                            <StatusBadge active={item.status === true} />
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs text-slate-500">Award value</p>
                                                <p className="mt-1 text-lg font-bold text-white">
                                                    {formatAmount(item.number, item.amountType)}
                                                </p>
                                            </div>
                                            <TypeBadge type={item.scholarshipType} />
                                        </div>

                                        {item.description && (
                                            <p className="mt-3 line-clamp-2 break-words text-sm leading-5 text-slate-400">
                                                {item.description}
                                            </p>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                                            <ActionButton
                                                label={`View ${item.name}`}
                                                onClick={() => openDialog("VIEW", item)}
                                            >
                                                <Eye size={17} />
                                            </ActionButton>
                                            {actions.includes("UPDATE") && (
                                                <ActionButton
                                                    label={`Edit ${item.name}`}
                                                    onClick={() => openDialog("EDIT", item)}
                                                    tone="violet"
                                                >
                                                    <Pencil size={17} />
                                                </ActionButton>
                                            )}
                                            {actions.includes("DELETE") && (
                                                <ActionButton
                                                    label={`Delete ${item.name}`}
                                                    onClick={() => openDialog("DELETE", item)}
                                                    tone="rose"
                                                >
                                                    <Trash2 size={17} />
                                                </ActionButton>
                                            )}
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </AnimatePresence>
                    ) : (
                        <div className="py-12 text-center">
                            <Award className="mx-auto text-slate-500" size={30} />
                            <p className="mt-3 font-semibold text-slate-200">
                                {pageError
                                    ? "Unable to load scholarships"
                                    : "No matching scholarships"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {pageError || "Try changing your search or filters."}
                            </p>
                            {pageError && (
                                <button
                                    type="button"
                                    onClick={() => void loadData()}
                                    className="mt-4 rounded-xl border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300"
                                >
                                    Try again
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm text-slate-400">
                        {filteredScholarships.length === 0
                            ? "Showing 0 scholarships"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                currentPage * PAGE_SIZE,
                                filteredScholarships.length
                            )} of ${filteredScholarships.length} scholarships`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronsLeft size={17} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            aria-label="Previous page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronLeft size={17} />
                        </button>

                        <span className="px-2 text-sm text-slate-300">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() =>
                                setPage((value) => Math.min(totalPages, value + 1))
                            }
                            aria-label="Next page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronRight size={17} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                            <ChevronsRight size={17} />
                        </button>
                    </div>
                </div>
            </GlassCard>

            <AnimatePresence>
                {dialog && (
                    <ScholarshipDialog
                        key={`${dialog.mode}-${dialog.scholarship?.id ?? "new"}`}
                        mode={dialog.mode}
                        scholarship={dialog.scholarship}
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
