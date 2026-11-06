import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownUp,
    Banknote,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CircleDollarSign,
    Eye,
    FileText,
    Filter,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
    Wallet,
    X,
} from "lucide-react";

import {
    createFeeStructure,
    deleteFeeStructure,
    extractErrorMessage,
    formatCurrency,
    getCourseFilter,
    getFeeEnums,
    getFeeStructures,
    getSpecializationFilter,
    hasPermission,
    normalizeText,
    updateFeeStructure,
    type CommonDTO,
    type FeeComponent,
    type FeeComponentRequest,
    type FeeEnums,
    type FeeStructure,
} from "@/services/financial/feeStructureService";

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";

type DraftComponent = {
    key: string;
    id?: number;
    feeCategoryType: string;
    componentName: string;
    amount: string;
    isMandatory: boolean;
    isRefundable: boolean;
};

interface FeeForm {
    courseId: number | "";
    name: string;
    frequency: string;
    totalNoOfInstallments: number;
    specializationId: number[];
    components: DraftComponent[];
}

interface DialogState {
    mode: DialogMode;
    item: FeeStructure | null;
}

interface EntityOption {
    id: number;
    name: string;
}

const PAGE_SIZE = 8;

const inputClass =
    "w-full min-w-0 rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50";

const selectClass = `${inputClass} appearance-none pr-9`;

const buttonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm font-medium transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

const emptyForm = (): FeeForm => ({
    courseId: "",
    name: "",
    frequency: "",
    totalNoOfInstallments: 1,
    specializationId: [],
    components: [],
});

function labelize(value?: string | null): string {
    if (!value) return "—";

    return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function moneyTotal(components: FeeComponent[]): number {
    return components.reduce(
        (total, component) =>
            total + (component.isMandatory ? component.amount : 0),
        0,
    );
}

function formatCount(value: number): string {
    return new Intl.NumberFormat("en-IN").format(value);
}

function formatCommon(dto?: CommonDTO | null): string {
    if (!dto) return "";
    const name = dto.name || `ID ${dto.id}`;
    return dto.code ? `${name} (${dto.code})` : name;
}

function uniqueOptions(
    items: FeeStructure[],
    getEntity: (item: FeeStructure) => CommonDTO | null,
): EntityOption[] {
    const options = new Map<number, EntityOption>();

    items.forEach((item) => {
        const entity = getEntity(item);

        if (entity && !options.has(entity.id)) {
            options.set(entity.id, {
                id: entity.id,
                name: formatCommon(entity),
            });
        }
    });

    return [...options.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
    );
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
                <SelectArrow />
            </div>
        </label>
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
                        <div className="h-3 w-20 rounded bg-white/5" />
                    </div>
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="h-4 w-28 rounded bg-white/10" />
                <div className="mt-2 h-3 w-36 rounded bg-white/5" />
            </td>
            <td className="px-5 py-4">
                <div className="h-6 w-20 rounded-lg bg-white/10" />
                <div className="mt-2 h-3 w-16 rounded bg-white/5" />
            </td>
            <td className="px-5 py-4">
                <div className="h-4 w-12 rounded bg-white/10" />
                <div className="mt-2 h-3 w-28 rounded bg-white/5" />
            </td>
            <td className="px-5 py-4">
                <div className="h-5 w-24 rounded bg-white/10" />
            </td>
            <td className="px-5 py-4">
                <div className="h-4 w-20 rounded bg-white/10" />
            </td>
            <td className="px-5 py-4 text-right">
                <div className="inline-block h-8 w-24 rounded bg-white/10" />
            </td>
        </tr>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{message}</span>
        </p>
    );
}

function SelectArrow() {
    return (
        <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function EntityFilter({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: EntityOption[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="relative min-w-0">
            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={selectClass}
            >
                <option value="">All {label.toLowerCase()}s</option>
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
            <SelectArrow />
        </div>
    );
}

function ErrorBanner({
    message,
    onRetry,
    onDismiss,
}: {
    message: string;
    onRetry: () => void;
    onDismiss: () => void;
}) {
    return (
        <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] p-4 sm:flex-row sm:items-start sm:justify-between"
        >
            <div className="flex min-w-0 gap-3">
                <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0 text-rose-300"
                />
                <div className="min-w-0">
                    <p className="font-semibold text-rose-200">
                        Could not load fee structures
                    </p>
                    <p className="mt-1 break-words text-sm text-rose-200/80">
                        {message}
                    </p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 rounded-lg border border-rose-300/25 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-400/10"
                    >
                        Try again
                    </button>
                </div>
            </div>

            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss error"
                className="self-end rounded-lg p-1.5 text-rose-200 hover:bg-white/5 sm:self-start"
            >
                <X size={16} />
            </button>
        </div>
    );
}

function FeeStructureDialog({
    mode,
    item,
    courses,
    enums,
    coursesLoading,
    coursesError,
    busy,
    onRetryCourses,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: {
    mode: DialogMode;
    item: FeeStructure | null;
    courses: CommonDTO[];
    enums: FeeEnums;
    coursesLoading: boolean;
    coursesError: string;
    busy: boolean;
    onRetryCourses: () => void;
    onClose: () => void;
    onCreate: (courseId: number, form: FeeForm) => Promise<void>;
    onUpdate: (item: FeeStructure, form: FeeForm) => Promise<void>;
    onDelete: (item: FeeStructure) => Promise<void>;
}) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const readOnly = mode === "VIEW" || mode === "DELETE";

    const [form, setForm] = useState<FeeForm>(() => {
        if (!item) return emptyForm();

        return {
            courseId: item.courses?.id ?? "",
            name: item.name,
            frequency: item.frequency,
            totalNoOfInstallments: item.totalNoOfInstallments,
            specializationId: item.specialization.map(
                (specialization) => specialization.id,
            ),
            components: item.feeComponent.map((component) => ({
                key: `existing-${component.id}`,
                id: component.id,
                feeCategoryType: component.feeCategoryType,
                componentName: component.componentName,
                amount: String(component.amount),
                isMandatory: component.isMandatory,
                isRefundable: component.isRefundable,
            })),
        };
    });

    const [specializations, setSpecializations] = useState<CommonDTO[]>(
        () => item?.specialization ?? [],
    );
    const [specializationsLoading, setSpecializationsLoading] = useState(false);
    const [specializationsError, setSpecializationsError] = useState("");
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const selectedCourseId =
        typeof form.courseId === "number" ? form.courseId : 0;

    const mandatoryTotal = form.components.reduce((total, component) => {
        const amount = Number(component.amount);

        return total + (
            component.isMandatory && Number.isFinite(amount) ? amount : 0
        );
    }, 0);

    const updateForm = <K extends keyof FeeForm>(
        key: K,
        value: FeeForm[K],
    ) => {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: "" }));
        setFormError("");
    };

    const updateComponent = (
        key: string,
        patch: Partial<DraftComponent>,
    ) => {
        setForm((current) => ({
            ...current,
            components: current.components.map((component) =>
                component.key === key
                    ? { ...component, ...patch }
                    : component,
            ),
        }));

        setFieldErrors((current) => {
            const next = { ...current };
            delete next[`name-${key}`];
            delete next[`amount-${key}`];
            delete next[`category-${key}`];
            delete next.components;
            return next;
        });

        setFormError("");
    };

    const addComponent = () => {
        const category = enums.feeComponentType[0]?.enumValue ?? "";

        setForm((current) => ({
            ...current,
            components: [
                ...current.components,
                {
                    key: `new-${Date.now()}-${current.components.length}`,
                    feeCategoryType: category,
                    componentName: "",
                    amount: "",
                    isMandatory: true,
                    isRefundable: false,
                },
            ],
        }));

        setFormError("");
    };

    const removeComponent = (key: string) => {
        setForm((current) => ({
            ...current,
            components: current.components.filter(
                (component) => component.key !== key,
            ),
        }));

        setFieldErrors((current) => {
            const next = { ...current };
            delete next[`name-${key}`];
            delete next[`amount-${key}`];
            delete next[`category-${key}`];
            delete next.components;
            return next;
        });
    };

    useEffect(() => {
        let cancelled = false;

        if (readOnly || selectedCourseId <= 0) {
            setSpecializations(item?.specialization ?? []);
            setSpecializationsError("");
            setSpecializationsLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (isCreate) {
            setSpecializations([]);
        }
        setSpecializationsError("");
        setSpecializationsLoading(true);

        getSpecializationFilter(selectedCourseId)
            .then((rows) => {
                if (cancelled) return;
                const combined = [...rows];
                (item?.specialization ?? []).forEach((spec) => {
                    if (!combined.some((c) => c.id === spec.id)) {
                        combined.push(spec);
                    }
                });
                setSpecializations(combined);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setSpecializations(item?.specialization ?? []);
                setSpecializationsError(extractErrorMessage(error));
            })
            .finally(() => {
                if (!cancelled) setSpecializationsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [readOnly, isCreate, selectedCourseId, item]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [busy, onClose]);

    const validate = (): boolean => {
        const errors: Record<string, string> = {};

        if (isCreate && (!form.courseId || form.courseId <= 0)) {
            errors.courseId = "Select a course.";
        }

        if (!form.name.trim()) {
            errors.name = "Fee structure name is required.";
        }

        if (form.name.trim().length > 120) {
            errors.name = "Name cannot exceed 120 characters.";
        }

        if (!form.frequency) {
            errors.frequency = "Select a fee frequency from the server options.";
        }

        if (
            !Number.isInteger(form.totalNoOfInstallments) ||
            form.totalNoOfInstallments < 1
        ) {
            errors.totalNoOfInstallments =
                "Installments must be a positive whole number.";
        }

        if (form.components.length === 0) {
            errors.components = "Add at least one fee component.";
        }

        form.components.forEach((component) => {
            if (!component.feeCategoryType) {
                errors[`category-${component.key}`] =
                    "Select a category returned by the server.";
            }

            if (!component.componentName.trim()) {
                errors[`name-${component.key}`] =
                    "Component name is required.";
            }

            const amount = Number(component.amount);

            if (
                component.amount.trim() === "" ||
                !Number.isFinite(amount) ||
                amount < 0
            ) {
                errors[`amount-${component.key}`] =
                    "Enter a valid non-negative amount.";
            }
        });

        const categories = form.components.map(
            (component) => component.feeCategoryType,
        );

        if (
            categories.some(Boolean) &&
            new Set(categories.filter(Boolean)).size !==
            categories.filter(Boolean).length
        ) {
            errors.components =
                "Each fee category can appear only once in a fee structure.";
        }

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormError("Please correct the highlighted fields.");
            return false;
        }

        return true;
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        if (mode === "DELETE") {
            if (item) await onDelete(item);
            return;
        }

        if (mode === "VIEW") {
            onClose();
            return;
        }

        if (!validate()) return;

        try {
            if (isCreate && typeof form.courseId === "number") {
                await onCreate(form.courseId, form);
            } else if (isEdit && item) {
                await onUpdate(item, form);
            }
        } catch {
            // The parent handles the API error and displays a toast.
            // Keep this dialog open so the user does not lose their form.
        }
    };

    const title = {
        CREATE: "Create fee structure",
        EDIT: "Edit fee structure",
        VIEW: "Fee structure details",
        DELETE: "Delete fee structure",
    }[mode];

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:items-center sm:p-5"
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
                aria-labelledby="fee-dialog-title"
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className="my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-cyan-300/15 bg-[#0c1530] shadow-2xl shadow-black/40"
            >
                <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0c1530]/95 px-4 py-4 backdrop-blur sm:px-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            Finance / Fee Management
                        </p>
                        <h2
                            id="fee-dialog-title"
                            className="mt-1 text-lg font-semibold text-white sm:text-xl"
                        >
                            {title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5"
                    >
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={submit} className="space-y-5 p-4 sm:p-6">
                    {formError && (
                        <div
                            role="alert"
                            className="rounded-xl border border-rose-400/25 bg-rose-500/[0.08] p-3 text-sm text-rose-200"
                        >
                            {formError}
                        </div>
                    )}

                    {mode === "DELETE" ? (
                        <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.07] p-4">
                            <div className="flex gap-3">
                                <Trash2
                                    size={21}
                                    className="shrink-0 text-rose-300"
                                />
                                <div>
                                    <p className="font-semibold text-white">
                                        Delete this fee structure?
                                    </p>
                                    <p className="mt-2 break-words text-sm text-slate-300">
                                        You are about to delete{" "}
                                        <strong>{item?.name}</strong>. The
                                        server may reject deletion if this
                                        record is referenced elsewhere.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Course
                                        {isCreate && (
                                            <span className="text-cyan-300"> *</span>
                                        )}
                                    </label>

                                    {isCreate ? (
                                        <>
                                            <div className="relative">
                                                <select
                                                    value={form.courseId}
                                                    disabled={coursesLoading || readOnly}
                                                    onChange={(event) => {
                                                        const value = event.target.value;
                                                        updateForm(
                                                            "courseId",
                                                            value ? Number(value) : "",
                                                        );
                                                        updateForm("specializationId", []);
                                                    }}
                                                    className={selectClass}
                                                >
                                                    <option value="">
                                                        {coursesLoading
                                                            ? "Loading courses…"
                                                            : "Select course"}
                                                    </option>
                                                    {courses.map((course) => (
                                                        <option
                                                            key={course.id}
                                                            value={course.id}
                                                        >
                                                            {formatCommon(course)}
                                                        </option>
                                                    ))}
                                                </select>
                                                <SelectArrow />
                                            </div>

                                            <FieldError message={fieldErrors.courseId} />

                                            {coursesError && (
                                                <div className="mt-2 text-xs text-amber-200">
                                                    <p>{coursesError}</p>
                                                    <button
                                                        type="button"
                                                        onClick={onRetryCourses}
                                                        className="mt-1 underline underline-offset-2"
                                                    >
                                                        Retry loading courses
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-slate-200">
                                            {formatCommon(item?.courses) || "—"}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Fee structure name *
                                    </label>
                                    <input
                                        value={form.name}
                                        maxLength={120}
                                        readOnly={readOnly}
                                        onChange={(event) =>
                                            updateForm("name", event.target.value)
                                        }
                                        placeholder="Enter fee structure name"
                                        className={inputClass}
                                    />
                                    <FieldError message={fieldErrors.name} />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Frequency *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.frequency}
                                            disabled={readOnly}
                                            onChange={(event) =>
                                                updateForm("frequency", event.target.value)
                                            }
                                            className={selectClass}
                                        >
                                            <option value="">
                                                Select frequency
                                            </option>
                                            {enums.feeFrequency.map((option) => (
                                                <option
                                                    key={option.enumValue}
                                                    value={option.enumValue}
                                                >
                                                    {option.name || labelize(option.enumValue)}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectArrow />
                                    </div>
                                    {!enums.feeFrequency.length && (
                                        <p className="mt-1.5 text-xs text-amber-200">
                                            No frequency options were returned by the API.
                                        </p>
                                    )}
                                    <FieldError message={fieldErrors.frequency} />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Number of installments *
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={form.totalNoOfInstallments}
                                        readOnly={readOnly}
                                        onChange={(event) =>
                                            updateForm(
                                                "totalNoOfInstallments",
                                                event.target.value === ""
                                                    ? 0
                                                    : Number(event.target.value),
                                            )
                                        }
                                        className={inputClass}
                                    />
                                    <FieldError
                                        message={fieldErrors.totalNoOfInstallments}
                                    />
                                </div>
                            </section>

                            <section className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                                <div className="mb-4">
                                    <h3 className="font-semibold text-white">
                                        Specializations
                                    </h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                        Assign this fee structure to the applicable
                                        specializations.
                                    </p>
                                </div>

                                {!selectedCourseId ? (
                                    <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                                        Select a course to load its specializations.
                                    </p>
                                ) : specializationsLoading ? (
                                    <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
                                        <LoaderCircle
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Loading specializations…
                                    </div>
                                ) : specializationsError ? (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] p-3 text-sm text-rose-200"
                                    >
                                        {specializationsError}
                                    </div>
                                ) : specializations.length ? (
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {specializations.map((specialization) => {
                                            const checked =
                                                form.specializationId.includes(
                                                    specialization.id,
                                                );

                                            return (
                                                <label
                                                    key={specialization.id}
                                                    className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${checked
                                                        ? "border-cyan-400/40 bg-cyan-400/[0.08] text-cyan-100"
                                                        : "border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.04]"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        disabled={readOnly}
                                                        checked={checked}
                                                        onChange={(event) => {
                                                            const next = event.target.checked
                                                                ? [
                                                                    ...form.specializationId,
                                                                    specialization.id,
                                                                ]
                                                                : form.specializationId.filter(
                                                                    (id) =>
                                                                        id !== specialization.id,
                                                                );

                                                            updateForm(
                                                                "specializationId",
                                                                next,
                                                            );
                                                        }}
                                                        className="mt-0.5 accent-cyan-400"
                                                    />
                                                    <span className="min-w-0 break-words">
                                                        {specialization.name || `ID ${specialization.id}`}
                                                        {specialization.code && (
                                                            <span className="ml-2 text-xs text-slate-500">
                                                                {specialization.code}
                                                            </span>
                                                        )}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                                        No specializations are assigned or available.
                                    </p>
                                )}
                            </section>

                            <section className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            Fee components
                                        </h3>
                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            The payable estimate below includes only
                                            mandatory components.
                                        </p>
                                    </div>

                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={addComponent}
                                            disabled={!enums.feeComponentType.length}
                                            className={buttonClass}
                                        >
                                            <Plus size={16} />
                                            Add component
                                        </button>
                                    )}
                                </div>

                                {!enums.feeComponentType.length && !readOnly && (
                                    <p className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200">
                                        The server returned no fee component categories.
                                        Components cannot be added until the enum endpoint
                                        returns valid options.
                                    </p>
                                )}

                                <FieldError message={fieldErrors.components} />

                                {form.components.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                                        <FileText
                                            size={24}
                                            className="mx-auto text-slate-500"
                                        />
                                        <p className="mt-2 text-sm text-slate-300">
                                            No fee components
                                        </p>
                                        {!readOnly && (
                                            <p className="mt-1 text-xs text-slate-500">
                                                Add a component to configure this fee structure.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {form.components.map((component, index) => {
                                            const categoryOptions =
                                                enums.feeComponentType.some(
                                                    (option) =>
                                                        option.enumValue ===
                                                        component.feeCategoryType,
                                                ) || !component.feeCategoryType
                                                    ? enums.feeComponentType
                                                    : [
                                                        ...enums.feeComponentType,
                                                        {
                                                            name: component.feeCategoryType,
                                                            enumValue: component.feeCategoryType,
                                                        },
                                                    ];

                                            return (
                                                <article
                                                    key={component.key}
                                                    className="rounded-xl border border-white/10 bg-[#0b1224] p-3 sm:p-4"
                                                >
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                                                            Component {index + 1}
                                                        </span>
                                                        {!readOnly && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeComponent(component.key)
                                                                }
                                                                aria-label={`Remove component ${index + 1}`}
                                                                className="rounded-lg p-2 text-rose-300 transition hover:bg-rose-500/10"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                        <div>
                                                            <label className="mb-1.5 block text-xs text-slate-400">
                                                                Category *
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    disabled={readOnly}
                                                                    value={component.feeCategoryType}
                                                                    onChange={(event) =>
                                                                        updateComponent(
                                                                            component.key,
                                                                            {
                                                                                feeCategoryType:
                                                                                    event.target.value,
                                                                            },
                                                                        )
                                                                    }
                                                                    className={selectClass}
                                                                >
                                                                    <option value="">
                                                                        Select category
                                                                    </option>
                                                                    {categoryOptions.map((option) => (
                                                                        <option
                                                                            key={option.enumValue}
                                                                            value={option.enumValue}
                                                                        >
                                                                            {option.name ||
                                                                                labelize(option.enumValue)}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <SelectArrow />
                                                            </div>
                                                            <FieldError
                                                                message={
                                                                    fieldErrors[
                                                                    `category-${component.key}`
                                                                    ]
                                                                }
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="mb-1.5 block text-xs text-slate-400">
                                                                Component name *
                                                            </label>
                                                            <input
                                                                readOnly={readOnly}
                                                                value={component.componentName}
                                                                onChange={(event) =>
                                                                    updateComponent(
                                                                        component.key,
                                                                        {
                                                                            componentName:
                                                                                event.target.value,
                                                                        },
                                                                    )
                                                                }
                                                                className={inputClass}
                                                                placeholder="Enter component name"
                                                            />
                                                            <FieldError
                                                                message={
                                                                    fieldErrors[
                                                                    `name-${component.key}`
                                                                    ]
                                                                }
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="mb-1.5 block text-xs text-slate-400">
                                                                Amount (₹) *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                step="0.01"
                                                                readOnly={readOnly}
                                                                value={component.amount}
                                                                onChange={(event) =>
                                                                    updateComponent(
                                                                        component.key,
                                                                        {
                                                                            amount:
                                                                                event.target.value,
                                                                        },
                                                                    )
                                                                }
                                                                className={inputClass}
                                                                placeholder="0.00"
                                                            />
                                                            <FieldError
                                                                message={
                                                                    fieldErrors[
                                                                    `amount-${component.key}`
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/[0.06] pt-3">
                                                        <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                                                            <input
                                                                type="checkbox"
                                                                disabled={readOnly}
                                                                checked={component.isMandatory}
                                                                onChange={(event) =>
                                                                    updateComponent(
                                                                        component.key,
                                                                        {
                                                                            isMandatory:
                                                                                event.target.checked,
                                                                        },
                                                                    )
                                                                }
                                                                className="accent-cyan-400"
                                                            />
                                                            Mandatory
                                                        </label>

                                                        <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                                                            <input
                                                                type="checkbox"
                                                                disabled={readOnly}
                                                                checked={component.isRefundable}
                                                                onChange={(event) =>
                                                                    updateComponent(
                                                                        component.key,
                                                                        {
                                                                            isRefundable:
                                                                                event.target.checked,
                                                                        },
                                                                    )
                                                                }
                                                                className="accent-cyan-400"
                                                            />
                                                            Refundable
                                                        </label>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-4 flex flex-col gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Mandatory component total
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-white">
                                            {formatCurrency(mandatoryTotal)}
                                        </p>
                                    </div>
                                    <p className="max-w-sm text-xs leading-5 text-slate-400">
                                        This is calculated from the current form values;
                                        the server remains authoritative for saved fees.
                                    </p>
                                </div>
                            </section>

                            {!isCreate && item && (
                                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {[
                                        ["University", formatCommon(item.university)],
                                        ["School", formatCommon(item.school)],
                                        ["Department", formatCommon(item.department)],
                                        ["Academic year", formatCommon(item.academicYear)],
                                        ["Last modified by", formatCommon(item.lastModifiedBy)],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                                        >
                                            <p className="text-xs text-slate-500">
                                                {label}
                                            </p>
                                            <p className="mt-1 break-words text-sm text-slate-200">
                                                {value || "—"}
                                            </p>
                                        </div>
                                    ))}
                                </section>
                            )}
                        </>
                    )}

                    <footer className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onClose}
                            className={buttonClass}
                        >
                            {mode === "VIEW" ? "Close" : "Cancel"}
                        </button>

                        {mode !== "VIEW" && (
                            <button
                                type="submit"
                                disabled={
                                    busy ||
                                    (isCreate &&
                                        (coursesLoading ||
                                            !courses.length)) ||
                                    (isCreate &&
                                        !enums.feeFrequency.length) ||
                                    (!readOnly &&
                                        form.components.length > 0 &&
                                        !enums.feeComponentType.length)
                                }
                                className={
                                    mode === "DELETE"
                                        ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                                        : primaryButtonClass
                                }
                            >
                                {busy ? (
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : mode === "DELETE" ? (
                                    <Trash2 size={16} />
                                ) : (
                                    <Check size={16} />
                                )}

                                {busy
                                    ? "Processing…"
                                    : mode === "DELETE"
                                        ? "Confirm delete"
                                        : isCreate
                                            ? "Create fee structure"
                                            : "Save changes"}
                            </button>
                        )}
                    </footer>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default function FeeStructurePage() {
    const [items, setItems] = useState<FeeStructure[]>([]);
    const [courses, setCourses] = useState<CommonDTO[]>([]);
    const [enums, setEnums] = useState<FeeEnums>({
        feeFrequency: [],
        feeComponentType: [],
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pageError, setPageError] = useState("");
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [coursesError, setCoursesError] = useState("");
    const [enumsError, setEnumsError] = useState("");

    const [search, setSearch] = useState("");
    const [universityFilter, setUniversityFilter] = useState("");
    const [schoolFilter, setSchoolFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [courseFilter, setCourseFilter] = useState("");
    const [frequencyFilter, setFrequencyFilter] = useState("");
    const [sort, setSort] = useState("NEWEST");
    const [page, setPage] = useState(1);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [dialog, setDialog] = useState<DialogState | null>(null);

    const loadFeeStructures = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        setPageError("");

        try {
            const result = await getFeeStructures();
            setItems(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setPageError(message);
            toast.error(`Could not load fee structures: ${message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadCourses = useCallback(async () => {
        setCoursesLoading(true);
        setCoursesError("");

        try {
            const result = await getCourseFilter();
            setCourses(result);
        } catch (error) {
            const message = extractErrorMessage(error);
            setCourses([]);
            setCoursesError(message);
            toast.error(`Could not load courses: ${message}`);
        } finally {
            setCoursesLoading(false);
        }
    }, []);

    const loadEnums = useCallback(async () => {
        setEnumsError("");

        try {
            const result = await getFeeEnums();
            setEnums(result);

            if (
                result.feeFrequency.length === 0 ||
                result.feeComponentType.length === 0
            ) {
                setEnumsError(
                    "The enum endpoint did not return all fee options.",
                );
            }
        } catch (error) {
            const message = extractErrorMessage(error);
            setEnums({
                feeFrequency: [],
                feeComponentType: [],
            });
            setEnumsError(message);
            toast.error(`Could not load fee options: ${message}`);
        }
    }, []);

    useEffect(() => {
        void loadFeeStructures();
        void loadCourses();
        void loadEnums();
    }, [loadFeeStructures, loadCourses, loadEnums]);

    const universityOptions = useMemo(
        () => uniqueOptions(items, (item) => item.university),
        [items],
    );

    const schoolOptions = useMemo(
        () => uniqueOptions(items, (item) => item.school),
        [items],
    );

    const departmentOptions = useMemo(
        () => uniqueOptions(items, (item) => item.department),
        [items],
    );

    const yearOptions = useMemo(
        () => uniqueOptions(items, (item) => item.academicYear),
        [items],
    );

    const courseOptions = useMemo(
        () => uniqueOptions(items, (item) => item.courses),
        [items],
    );

    const filtered = useMemo(() => {
        const query = normalizeText(search);

        const result = items.filter((item) => {
            const searchableValues = [
                item.name,
                item.university?.name,
                item.university?.code,
                item.courses?.name,
                item.courses?.code,
                item.school?.name,
                item.school?.code,
                item.department?.name,
                item.department?.code,
                item.academicYear?.name,
                item.academicYear?.code,
                item.lastModifiedBy?.name,
                item.lastModifiedBy?.code,
                ...item.specialization.flatMap((specialization) => [
                    specialization.name,
                    specialization.code ?? "",
                ]),
                ...item.feeComponent.map((component) => component.componentName),
                ...item.feeComponent.map((component) => component.feeCategoryType),
            ];

            const matchesSearch =
                !query ||
                searchableValues.some((value) =>
                    normalizeText(value).includes(query),
                );

            const matchesUniversity =
                !universityFilter ||
                item.university?.id === Number(universityFilter);

            const matchesSchool =
                !schoolFilter ||
                item.school?.id === Number(schoolFilter);

            const matchesDepartment =
                !departmentFilter ||
                item.department?.id === Number(departmentFilter);

            const matchesYear =
                !yearFilter ||
                item.academicYear?.id === Number(yearFilter);

            const matchesCourse =
                !courseFilter ||
                item.courses?.id === Number(courseFilter);

            const matchesFrequency =
                !frequencyFilter ||
                item.frequency === frequencyFilter;

            return (
                matchesSearch &&
                matchesUniversity &&
                matchesSchool &&
                matchesDepartment &&
                matchesYear &&
                matchesCourse &&
                matchesFrequency
            );
        });

        result.sort((a, b) => {
            if (sort === "NAME_ASC") {
                return a.name.localeCompare(b.name);
            }

            if (sort === "NAME_DESC") {
                return b.name.localeCompare(a.name);
            }

            if (sort === "AMOUNT_DESC") {
                return moneyTotal(b.feeComponent) - moneyTotal(a.feeComponent);
            }

            if (sort === "AMOUNT_ASC") {
                return moneyTotal(a.feeComponent) - moneyTotal(b.feeComponent);
            }

            return b.id - a.id;
        });

        return result;
    }, [
        items,
        search,
        universityFilter,
        schoolFilter,
        departmentFilter,
        yearFilter,
        courseFilter,
        frequencyFilter,
        sort,
    ]);

    const hasActiveFilters =
        Boolean(search.trim()) ||
        Boolean(universityFilter) ||
        Boolean(schoolFilter) ||
        Boolean(departmentFilter) ||
        Boolean(yearFilter) ||
        Boolean(courseFilter) ||
        Boolean(frequencyFilter) ||
        sort !== "NEWEST";

    const resetFilters = () => {
        setSearch("");
        setUniversityFilter("");
        setSchoolFilter("");
        setDepartmentFilter("");
        setYearFilter("");
        setCourseFilter("");
        setFrequencyFilter("");
        setSort("NEWEST");
        setPage(1);
    };

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
        if (frequencyFilter) {
            const freq = enums.feeFrequency.find((f) => f.enumValue === frequencyFilter);
            pills.push({
                id: "frequency",
                label: "Frequency",
                value: freq?.name || labelize(frequencyFilter),
                onRemove: () => setFrequencyFilter(""),
            });
        }
        if (courseFilter) {
            const item = courseOptions.find((o) => String(o.id) === courseFilter);
            pills.push({
                id: "course",
                label: "Course",
                value: item?.name ?? courseFilter,
                onRemove: () => setCourseFilter(""),
            });
        }
        if (universityFilter) {
            const item = universityOptions.find((o) => String(o.id) === universityFilter);
            pills.push({
                id: "university",
                label: "University",
                value: item?.name ?? universityFilter,
                onRemove: () => setUniversityFilter(""),
            });
        }
        if (schoolFilter) {
            const item = schoolOptions.find((o) => String(o.id) === schoolFilter);
            pills.push({
                id: "school",
                label: "School",
                value: item?.name ?? schoolFilter,
                onRemove: () => setSchoolFilter(""),
            });
        }
        if (departmentFilter) {
            const item = departmentOptions.find((o) => String(o.id) === departmentFilter);
            pills.push({
                id: "department",
                label: "Department",
                value: item?.name ?? departmentFilter,
                onRemove: () => setDepartmentFilter(""),
            });
        }
        if (yearFilter) {
            const item = yearOptions.find((o) => String(o.id) === yearFilter);
            pills.push({
                id: "year",
                label: "Year",
                value: item?.name ?? yearFilter,
                onRemove: () => setYearFilter(""),
            });
        }
        if (sort !== "NEWEST") {
            const sortLabels: Record<string, string> = {
                NAME_ASC: "Name: A–Z",
                NAME_DESC: "Name: Z–A",
                AMOUNT_DESC: "Amount: High to Low",
                AMOUNT_ASC: "Amount: Low to High",
            };
            pills.push({
                id: "sort",
                label: "Sort",
                value: sortLabels[sort] ?? sort,
                onRemove: () => setSort("NEWEST"),
            });
        }
        return pills;
    }, [
        search,
        frequencyFilter,
        courseFilter,
        universityFilter,
        schoolFilter,
        departmentFilter,
        yearFilter,
        sort,
        courseOptions,
        universityOptions,
        schoolOptions,
        departmentOptions,
        yearOptions,
        enums.feeFrequency,
    ]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);

    const visible = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    useEffect(() => {
        setPage(1);
    }, [
        search,
        universityFilter,
        schoolFilter,
        departmentFilter,
        yearFilter,
        courseFilter,
        frequencyFilter,
        sort,
    ]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const stats = useMemo(() => ({
        structures: items.length,
        components: items.reduce(
            (total, item) => total + item.feeComponent.length,
            0,
        ),
        mandatoryTotal: items.reduce(
            (total, item) => total + moneyTotal(item.feeComponent),
            0,
        ),
        courses: new Set(
            items
                .map((item) => item.courses?.id)
                .filter((id): id is number => typeof id === "number"),
        ).size,
    }), [items]);

    const handleCreate = async (
        courseId: number,
        form: FeeForm,
    ): Promise<void> => {
        setBusy(true);

        try {
            const request = {
                name: form.name.trim(),
                frequency: form.frequency,
                totalNoOfInstallments: form.totalNoOfInstallments,
                specializationId: form.specializationId,
                components: form.components.map((component) => ({
                    feeCategoryType: component.feeCategoryType,
                    componentName: component.componentName.trim(),
                    amount: Number(component.amount),
                    isMandatory: component.isMandatory,
                    isRefundable: component.isRefundable,
                })),
            };

            await createFeeStructure(courseId, request);
            setDialog(null);
            toast.success("Fee structure created successfully.");
            await loadFeeStructures(true);
        } catch (error) {
            toast.error(extractErrorMessage(error));
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (
        item: FeeStructure,
        form: FeeForm,
    ): Promise<void> => {
        setBusy(true);

        try {
            const originalById = new Map(
                item.feeComponent.map((component) => [
                    component.id,
                    component,
                ]),
            );

            const retainedIds = new Set(
                form.components
                    .filter(
                        (component): component is DraftComponent & { id: number } =>
                            typeof component.id === "number",
                    )
                    .map((component) => component.id),
            );

            const componentToRemove = item.feeComponent
                .filter((component) => !retainedIds.has(component.id))
                .map((component) => component.id);

            const componentToAdd: FeeComponentRequest[] = [];

            form.components.forEach((component) => {
                const payload: FeeComponentRequest = {
                    feeCategoryType: component.feeCategoryType,
                    componentName: component.componentName.trim(),
                    amount: Number(component.amount),
                    isMandatory: component.isMandatory,
                    isRefundable: component.isRefundable,
                };

                if (typeof component.id !== "number") {
                    componentToAdd.push(payload);
                    return;
                }

                const original = originalById.get(component.id);
                if (!original) {
                    throw new Error(
                        "An existing fee component no longer matches the loaded record. Refresh and try again.",
                    );
                }

                const changed =
                    original.feeCategoryType !== payload.feeCategoryType ||
                    original.componentName !== payload.componentName ||
                    original.amount !== payload.amount ||
                    original.isMandatory !== payload.isMandatory ||
                    original.isRefundable !== payload.isRefundable;

                // The update DTO supports removal by ID and addition as a new component,
                // not an in-place component edit.
                if (changed) {
                    componentToRemove.push(component.id);
                    componentToAdd.push(payload);
                }
            });

            await updateFeeStructure(item.id, {
                name: form.name.trim(),
                frequency: form.frequency,
                totalNoOfInstallments: form.totalNoOfInstallments,
                specializationId: form.specializationId,
                componentToAdd,
                componentToRemove: [...new Set(componentToRemove)],
            });

            setDialog(null);
            toast.success("Fee structure updated successfully.");
            await loadFeeStructures(true);
        } catch (error) {
            toast.error(extractErrorMessage(error));
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (item: FeeStructure): Promise<void> => {
        setBusy(true);

        try {
            await deleteFeeStructure(item.id);
            setDialog(null);
            toast.success("Fee structure deleted successfully.");
            await loadFeeStructures(true);
        } catch (error) {
            toast.error(extractErrorMessage(error));
            throw error;
        } finally {
            setBusy(false);
        }
    };
    const openCreate = () => {
        setDialog({ mode: "CREATE", item: null });
    };

    const openDialog = (mode: DialogMode, item: FeeStructure) => {
        setDialog({ mode, item });
    };

    const actionButtons = (item: FeeStructure) => (
        <div className="flex flex-wrap items-center gap-1.5">
            <button
                type="button"
                title="View fee structure"
                aria-label={`View ${item.name}`}
                onClick={() => openDialog("VIEW", item)}
                className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
                <Eye size={16} />
            </button>

            {hasPermission(item, "UPDATE") && (
                <button
                    type="button"
                    title="Edit fee structure"
                    aria-label={`Edit ${item.name}`}
                    onClick={() => openDialog("EDIT", item)}
                    className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
                >
                    <Pencil size={16} />
                </button>
            )}

            {hasPermission(item, "DELETE") && (
                <button
                    type="button"
                    title="Delete fee structure"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => openDialog("DELETE", item)}
                    className="rounded-lg border border-rose-400/20 p-2 text-rose-300 transition hover:bg-rose-500/10"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );

    const statCards = [
        {
            label: "Total Structures",
            value: stats.structures,
            icon: Banknote,
            tone: "cyan" as const,
        },
        {
            label: "Mandatory Total",
            value: formatCurrency(stats.mandatoryTotal),
            icon: Wallet,
            tone: "emerald" as const,
        },
        {
            label: "Mapped Programs",
            value: stats.courses,
            icon: BookOpen,
            tone: "violet" as const,
        },
        {
            label: "Configured Components",
            value: stats.components,
            icon: CircleDollarSign,
            tone: "amber" as const,
        },
    ];

    const tones = {
        cyan: "border-cyan-400/30 from-cyan-500/10 to-transparent text-cyan-300",
        emerald: "border-emerald-400/30 from-emerald-500/10 to-transparent text-emerald-300",
        violet: "border-violet-400/30 from-violet-500/10 to-transparent text-violet-300",
        amber: "border-amber-400/30 from-amber-500/10 to-transparent text-amber-300",
        rose: "border-rose-400/30 from-rose-500/10 to-transparent text-rose-300",
    };

    return (
        <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-6 p-3 text-slate-100 sm:p-5 lg:p-7"
        >
            {/* Header Section */}
            <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span>Finance</span>
                    <ChevronRight size={14} className="text-slate-500" />
                    <span className="text-cyan-300">Fee Structures</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Financial Configuration &amp; Billing
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Fee Structure Management
                        </h1>
                        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Configure tuition fee schedules, installment breakdowns, academic program mappings,
                            and category components.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadFeeStructures(true)}
                            disabled={loading || refreshing}
                            title="Refresh fee structures"
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
                            onClick={openCreate}
                            disabled={loading || !courses.length}
                            title={!courses.length ? "No courses available" : "Add fee structure"}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={18} />
                            <span>Add Fee Structure</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Error Banners */}
            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        message={pageError}
                        onRetry={() => void loadFeeStructures()}
                        onDismiss={() => setPageError("")}
                    />
                )}
            </AnimatePresence>

            {coursesError && (
                <div
                    role="alert"
                    className="flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="text-sm text-amber-100">
                        <p className="font-semibold">Course filter unavailable</p>
                        <p className="mt-1 break-words text-amber-100/75">
                            {coursesError}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadCourses()}
                        className={buttonClass}
                    >
                        Retry
                    </button>
                </div>
            )}

            {enumsError && (
                <div
                    role="alert"
                    className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-3 text-sm text-amber-100"
                >
                    Fee options: {enumsError}
                </div>
            )}

            {/* Statistics Row */}
            <section
                aria-label="Fee structure statistics"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                            }}
                            whileHover={{ y: -3 }}
                            className={`rounded-2xl border bg-gradient-to-br p-4 sm:p-5 shadow-lg backdrop-blur-xl ${tones[stat.tone]}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-300 sm:text-sm">
                                        {stat.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-3xl">
                                        {loading ? (
                                            <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10" />
                                        ) : typeof stat.value === "number" ? (
                                            formatCount(stat.value)
                                        ) : (
                                            stat.value
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
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                {/* Responsive Filter Toolbar */}
                <div className="grid gap-3 border-b border-white/10 p-3.5 sm:p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {/* Search Input */}
                    <div className="relative min-w-0 sm:col-span-2">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search fee structures"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, course, university, components..."
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

                    {/* Quick Frequency Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by frequency"
                            value={frequencyFilter}
                            onChange={(e) => setFrequencyFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="">All Frequencies</option>
                            {enums.feeFrequency.map((option) => (
                                <option key={option.enumValue} value={option.enumValue}>
                                    {option.name || labelize(option.enumValue)}
                                </option>
                            ))}
                        </select>
                        <SelectArrow />
                    </div>

                    {/* Quick Course Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by course"
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="">All Courses</option>
                            {courseOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <SelectArrow />
                    </div>

                    {/* Sort Options */}
                    <div className="relative">
                        <select
                            aria-label="Sort fee structures"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-9 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="NEWEST">Newest First</option>
                            <option value="NAME_ASC">Name: A–Z</option>
                            <option value="NAME_DESC">Name: Z–A</option>
                            <option value="AMOUNT_DESC">Mandatory Total: High to Low</option>
                            <option value="AMOUNT_ASC">Mandatory Total: Low to High</option>
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

                {/* Active Filter Pills Bar (Matching Student.tsx) */}
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
                            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                                <FilterSelect
                                    label="University"
                                    value={universityFilter}
                                    onChange={setUniversityFilter}
                                    options={[
                                        { value: "", label: "All universities" },
                                        ...universityOptions.map((o) => ({
                                            value: String(o.id),
                                            label: o.name,
                                        })),
                                    ]}
                                />
                                <FilterSelect
                                    label="School"
                                    value={schoolFilter}
                                    onChange={setSchoolFilter}
                                    options={[
                                        { value: "", label: "All schools" },
                                        ...schoolOptions.map((o) => ({
                                            value: String(o.id),
                                            label: o.name,
                                        })),
                                    ]}
                                />
                                <FilterSelect
                                    label="Department"
                                    value={departmentFilter}
                                    onChange={setDepartmentFilter}
                                    options={[
                                        { value: "", label: "All departments" },
                                        ...departmentOptions.map((o) => ({
                                            value: String(o.id),
                                            label: o.name,
                                        })),
                                    ]}
                                />
                                <FilterSelect
                                    label="Academic Year"
                                    value={yearFilter}
                                    onChange={setYearFilter}
                                    options={[
                                        { value: "", label: "All academic years" },
                                        ...yearOptions.map((o) => ({
                                            value: String(o.id),
                                            label: o.name,
                                        })),
                                    ]}
                                />
                                <FilterSelect
                                    label="Course"
                                    value={courseFilter}
                                    onChange={setCourseFilter}
                                    options={[
                                        { value: "", label: "All courses" },
                                        ...courseOptions.map((o) => ({
                                            value: String(o.id),
                                            label: o.name,
                                        })),
                                    ]}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Record Counter Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                    <p className="text-xs text-slate-400">
                        {loading
                            ? "Loading records…"
                            : `Showing ${filtered.length
                                ? (currentPage - 1) * PAGE_SIZE + 1
                                : 0
                            }–${Math.min(
                                currentPage * PAGE_SIZE,
                                filtered.length,
                            )} of ${formatCount(filtered.length)} records`}
                    </p>

                    <span className="rounded-lg border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-400">
                        {formatCount(items.length)} total records
                    </span>
                </div>

                {loading ? (
                    <div className="hidden overflow-x-auto xl:block">
                        <table className="w-full min-w-[1050px] text-left">
                            <tbody className="divide-y divide-white/[0.06]">
                                {[...Array(5)].map((_, i) => (
                                    <SkeletonRow key={i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-14 text-center">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-cyan-300">
                            <FileText size={28} />
                        </div>
                        <h3 className="mt-4 font-semibold text-white">
                            {items.length === 0
                                ? "No fee structures returned"
                                : "No matching fee structures"}
                        </h3>
                        <p className="mt-1 max-w-md text-sm leading-6 text-slate-400">
                            {items.length === 0
                                ? "The API returned no fee structures. Create one if your account has the required course permission."
                                : "Try adjusting your search or filters."}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className={`${buttonClass} mt-4`}
                            >
                                <RotateCcw size={15} />
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden overflow-x-auto xl:block">
                            <table className="w-full min-w-[1050px] text-left">
                                <thead className="bg-white/[0.025] text-[11px] uppercase tracking-wider text-slate-400">
                                    <tr>
                                        {[
                                            "Fee structure",
                                            "Course / Academic Context",
                                            "Frequency",
                                            "Components",
                                            "Mandatory total",
                                            "Specializations",
                                            "Actions",
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-5 py-4 font-semibold"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-white/[0.06]">
                                    {visible.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-white/[0.025]"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] p-2.5 text-cyan-300">
                                                        <Banknote size={18} />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="max-w-[240px] break-words font-semibold text-white">
                                                            {item.name || "—"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            ID: {item.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 max-w-[220px]">
                                                    <p
                                                        className="font-medium text-slate-200 truncate"
                                                        title={formatCommon(item.courses) || "—"}
                                                    >
                                                        {item.courses?.name || "—"}
                                                    </p>
                                                    {item.courses?.code && (
                                                        <span className="shrink-0 rounded bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">
                                                            {item.courses.code}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-slate-400 truncate max-w-[220px]">
                                                    {[formatCommon(item.university), formatCommon(item.academicYear)]
                                                        .filter(Boolean)
                                                        .join(" · ") || "—"}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-[220px]">
                                                    {[formatCommon(item.school), formatCommon(item.department)]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-lg border border-violet-400/20 bg-violet-400/[0.08] px-2.5 py-1.5 text-xs text-violet-200">
                                                    {labelize(item.frequency)}
                                                </span>
                                                <p className="mt-2 text-xs text-slate-500">
                                                    {item.totalNoOfInstallments} installment(s)
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-white">
                                                    {item.feeComponent.length}
                                                </p>
                                                <p className="mt-1 max-w-[190px] break-words text-xs text-slate-500">
                                                    {item.feeComponent
                                                        .slice(0, 2)
                                                        .map((component) => component.componentName)
                                                        .filter(Boolean)
                                                        .join(", ") || "—"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 font-semibold tabular-nums text-white">
                                                {formatCurrency(
                                                    moneyTotal(item.feeComponent),
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-slate-200">
                                                    {item.specialization.length} {item.specialization.length === 1 ? "Specialization" : "Specializations"}
                                                </p>
                                                <div className="mt-1 flex flex-wrap gap-1 max-w-[200px]">
                                                    {item.specialization.slice(0, 2).map((sp) => (
                                                        <span
                                                            key={sp.id}
                                                            className="rounded bg-slate-800/80 border border-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 truncate max-w-[180px]"
                                                            title={formatCommon(sp)}
                                                        >
                                                            {formatCommon(sp)}
                                                        </span>
                                                    ))}
                                                    {item.specialization.length > 2 && (
                                                        <span className="text-[10px] text-slate-500 self-center">
                                                            +{item.specialization.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                {actionButtons(item)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 xl:hidden">
                            {visible.map((item) => (
                                <article
                                    key={item.id}
                                    className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/30 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="shrink-0 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] p-2.5 text-cyan-300">
                                            <Banknote size={19} />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="break-words font-semibold text-white">
                                                        {item.name || "—"}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        ID: {item.id} · {formatCommon(item.courses) || "—"}
                                                    </p>
                                                </div>

                                                <span className="rounded-lg border border-violet-400/20 bg-violet-400/[0.08] px-2 py-1 text-xs text-violet-200">
                                                    {labelize(item.frequency)}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                                                    <p className="text-xs text-slate-500">
                                                        Mandatory total
                                                    </p>
                                                    <p className="mt-1 break-words font-semibold text-white">
                                                        {formatCurrency(
                                                            moneyTotal(item.feeComponent),
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                                                    <p className="text-xs text-slate-500">
                                                        Components
                                                    </p>
                                                    <p className="mt-1 font-semibold text-white">
                                                        {item.feeComponent.length}
                                                    </p>
                                                    <p className="mt-1 break-words text-xs text-slate-500">
                                                        {item.totalNoOfInstallments} installment(s)
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 space-y-1 text-xs text-slate-400">
                                                <p>
                                                    Academic year: {formatCommon(item.academicYear) || "—"}
                                                </p>
                                                <p>
                                                    University: {formatCommon(item.university) || "—"}
                                                </p>
                                                <p>
                                                    School: {formatCommon(item.school) || "—"}
                                                </p>
                                                <p>
                                                    Department: {formatCommon(item.department) || "—"}
                                                </p>
                                            </div>

                                            {item.feeComponent.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {item.feeComponent
                                                        .slice(0, 4)
                                                        .map((component) => (
                                                            <span
                                                                key={component.id}
                                                                className="max-w-full break-words rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-300"
                                                            >
                                                                {component.componentName}
                                                            </span>
                                                        ))}
                                                    {item.feeComponent.length > 4 && (
                                                        <span className="px-1 py-1 text-xs text-slate-500">
                                                            +{item.feeComponent.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-4 border-t border-white/10 pt-3">
                                                {actionButtons(item)}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Pagination Footer */}
                        <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-400">
                                Page {currentPage} of {totalPages}
                            </p>

                            <div className="flex items-center justify-between gap-1 sm:justify-end">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage(1)}
                                    aria-label="First page"
                                    className={`${buttonClass} !min-h-9 !px-2`}
                                >
                                    <ChevronsLeft size={16} />
                                </button>

                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() =>
                                        setPage((value) => Math.max(1, value - 1))
                                    }
                                    aria-label="Previous page"
                                    className={`${buttonClass} !min-h-9 !px-2`}
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <span className="px-3 text-xs text-slate-400">
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() =>
                                        setPage((value) =>
                                            Math.min(totalPages, value + 1),
                                        )
                                    }
                                    aria-label="Next page"
                                    className={`${buttonClass} !min-h-9 !px-2`}
                                >
                                    <ChevronRight size={16} />
                                </button>

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setPage(totalPages)}
                                    aria-label="Last page"
                                    className={`${buttonClass} !min-h-9 !px-2`}
                                >
                                    <ChevronsRight size={16} />
                                </button>
                            </div>
                        </footer>
                    </>
                )}
            </section>

            <AnimatePresence>
                {dialog && (
                    <FeeStructureDialog
                        key={`${dialog.mode}-${dialog.item?.id ?? "new"}`}
                        mode={dialog.mode}
                        item={dialog.item}
                        courses={courses}
                        enums={enums}
                        coursesLoading={coursesLoading}
                        coursesError={coursesError}
                        busy={busy}
                        onRetryCourses={() => void loadCourses()}
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