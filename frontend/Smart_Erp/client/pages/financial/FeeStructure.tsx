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
    BadgeIndianRupee,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    CreditCard,
    Eye,
    GraduationCap,
    HelpCircle,
    Layers,
    Library,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    Wallet,
    X,
} from "lucide-react";

import {
    createFeeStructure,
    deleteFeeStructure,
    extractErrorMessage,
    formatAuditActor,
    formatCurrency,
    formatDate,
    formatDateTime,
    getAcademicYearFilter,
    getCourseFilter,
    getFeeEnums,
    getFeeStructures,
    getInitials,
    getSpecializationFilter,
    hasPermission,
    uniqueCommonDTOs,
    updateFeeStructure,
    type CommonDTO,
    type FeeComponent,
    type FeeComponentRequest,
    type FeeEnums,
    type FeeFrequency,
    type FeeStructure,
    type FeeStructureCreateRequest,
    type FeeStructureResponse,
    type FeeStructureUpdateRequest,
} from "@/services/financial/feeStructureService";

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE";

type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "AMOUNT_DESC"
    | "AMOUNT_ASC";

interface DraftComponent {
    key: string;
    id?: number;
    feeCategoryType: string;
    componentName: string;
    amount: string;
    isMandatory: boolean;
    isRefundable: boolean;
    original?: FeeComponent;
}

interface FeeFormState {
    courseId: number | "";
    academicYearId: number | "";
    name: string;
    frequency: string;
    totalNoOfInstallments: number;
    selectedSpecializationIds: number[];
    components: DraftComponent[];
}

interface FieldErrors {
    courseId?: string;
    academicYearId?: string;
    name?: string;
    frequency?: string;
    totalNoOfInstallments?: string;
    components?: string;
}

/* -------------------------------------------------------------------------- */
/* GlassCard & Visual Containers                                              */
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

function FrequencyBadge({ frequency }: { frequency?: string | null }) {
    if (!frequency) return <span className="text-slate-500">—</span>;
    const freq = frequency.toUpperCase();

    let style = "border-blue-400/20 bg-blue-500/10 text-blue-300";
    if (freq === "ANNUAL") {
        style = "border-purple-400/20 bg-purple-500/10 text-purple-300";
    } else if (freq === "SEMESTER") {
        style = "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";
    } else if (freq === "ONE_TIME") {
        style = "border-amber-400/20 bg-amber-500/10 text-amber-300";
    } else if (freq === "MONTHLY" || freq === "QUARTERLY") {
        style = "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${style}`}
        >
            <Clock size={11} className="shrink-0" />
            <span>{frequency.replace(/_/g, " ")}</span>
        </span>
    );
}

/* -------------------------------------------------------------------------- */
/* Modal Dialog Component                                                     */
/* -------------------------------------------------------------------------- */

interface FeeStructureDialogProps {
    mode: DialogMode;
    structure: FeeStructureResponse | null;
    feeEnums: FeeEnums;
    courses: CommonDTO[];
    coursesLoading: boolean;
    busy: boolean;
    onClose: () => void;
    onCreate: (
        courseId: number,
        academicYearId: number,
        request: FeeStructureCreateRequest
    ) => Promise<void>;
    onUpdate: (id: number, request: FeeStructureUpdateRequest) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onSwitchToEdit: (structure: FeeStructureResponse) => void;
}

function FeeStructureDialog({
    mode,
    structure,
    feeEnums,
    courses,
    coursesLoading,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
    onSwitchToEdit,
}: FeeStructureDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";

    // Form State
    const [form, setForm] = useState<FeeFormState>(() => {
        if (structure && (isEdit || isView)) {
            return {
                courseId: structure.courses?.id ?? "",
                academicYearId: structure.academicYear?.id ?? "",
                name: structure.name || "",
                frequency: structure.frequency || "SEMESTER",
                totalNoOfInstallments: structure.totalNoOfInstallments || 1,
                selectedSpecializationIds: structure.specialization.map((s) => s.id),
                components: structure.feeComponent.map((c) => ({
                    key: `existing-${c.id}`,
                    id: c.id,
                    feeCategoryType: c.feeCategoryType,
                    componentName: c.componentName,
                    amount: String(c.amount),
                    isMandatory: c.isMandatory,
                    isRefundable: c.isRefundable,
                    original: { ...c },
                })),
            };
        }

        return {
            courseId: "",
            academicYearId: "",
            name: "",
            frequency: feeEnums.feeFrequency[0]?.enumValue || "SEMESTER",
            totalNoOfInstallments: 1,
            selectedSpecializationIds: [],
            components: [
                {
                    key: "default-tuition",
                    feeCategoryType: "TUITION",
                    componentName: "Tuition Fee",
                    amount: "",
                    isMandatory: true,
                    isRefundable: false,
                },
            ],
        };
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [submitError, setSubmitError] = useState("");

    // Dynamic Cascade Lists for Modal
    const [academicYears, setAcademicYears] = useState<CommonDTO[]>([]);
    const [academicYearsLoading, setAcademicYearsLoading] = useState(false);

    const [availableSpecializations, setAvailableSpecializations] = useState<CommonDTO[]>([]);
    const [specializationsLoading, setSpecializationsLoading] = useState(false);

    // Load academic years when course changes in CREATE mode
    useEffect(() => {
        if (isCreate && typeof form.courseId === "number" && form.courseId > 0) {
            let active = true;
            setAcademicYearsLoading(true);
            setAcademicYears([]);
            setAvailableSpecializations([]);
            setForm((prev) => ({
                ...prev,
                academicYearId: "",
                selectedSpecializationIds: [],
            }));

            getAcademicYearFilter(form.courseId)
                .then((years) => {
                    if (active) {
                        setAcademicYears(years);
                        // Auto-select if single year available
                        if (years.length === 1) {
                            setForm((prev) => ({ ...prev, academicYearId: years[0].id }));
                        }
                    }
                })
                .catch((err) => {
                    if (active) {
                        toast.error(extractErrorMessage(err, "Failed to load academic years."));
                    }
                })
                .finally(() => {
                    if (active) setAcademicYearsLoading(false);
                });

            return () => {
                active = false;
            };
        }
    }, [isCreate, form.courseId]);

    // Load available specializations when course & academic year are set in CREATE mode
    useEffect(() => {
        if (
            isCreate &&
            typeof form.courseId === "number" &&
            form.courseId > 0 &&
            typeof form.academicYearId === "number" &&
            form.academicYearId > 0
        ) {
            let active = true;
            setSpecializationsLoading(true);
            setAvailableSpecializations([]);

            getSpecializationFilter(form.courseId, form.academicYearId)
                .then((specs) => {
                    if (active) {
                        setAvailableSpecializations(specs);
                    }
                })
                .catch((err) => {
                    if (active) {
                        toast.error(
                            extractErrorMessage(err, "Failed to load available specializations.")
                        );
                    }
                })
                .finally(() => {
                    if (active) setSpecializationsLoading(false);
                });

            return () => {
                active = false;
            };
        }
    }, [isCreate, form.courseId, form.academicYearId]);

    // In EDIT mode, load available specializations and merge with already assigned specializations
    useEffect(() => {
        if (isEdit && structure && structure.courses?.id && structure.academicYear?.id) {
            let active = true;
            setSpecializationsLoading(true);

            getSpecializationFilter(structure.courses.id, structure.academicYear.id)
                .then((unassigned) => {
                    if (active) {
                        // Merge current assignments with unassigned options
                        const combined = uniqueCommonDTOs([
                            ...(structure.specialization || []),
                            ...unassigned,
                        ]);
                        setAvailableSpecializations(combined);
                    }
                })
                .catch(() => {
                    if (active) {
                        // Fallback to currently assigned
                        setAvailableSpecializations(structure.specialization || []);
                    }
                })
                .finally(() => {
                    if (active) setSpecializationsLoading(false);
                });

            return () => {
                active = false;
            };
        }
    }, [isEdit, structure]);

    // Calculation helper for draft components
    const feeTotals = useMemo(() => {
        let mandatory = 0;
        let optional = 0;

        form.components.forEach((c) => {
            const val = parseFloat(c.amount) || 0;
            if (val > 0) {
                if (c.isMandatory) {
                    mandatory += val;
                } else {
                    optional += val;
                }
            }
        });

        const grand = mandatory + optional;
        const installments = Math.max(1, form.totalNoOfInstallments || 1);
        const perInstallment = mandatory / installments;

        return { mandatory, optional, grand, perInstallment };
    }, [form.components, form.totalNoOfInstallments]);

    // Component Row Operations
    function handleAddComponent() {
        setForm((prev) => ({
            ...prev,
            components: [
                ...prev.components,
                {
                    key: Math.random().toString(36).slice(2),
                    feeCategoryType: feeEnums.feeComponentType[0]?.enumValue || "TUITION",
                    componentName: "",
                    amount: "",
                    isMandatory: true,
                    isRefundable: false,
                },
            ],
        }));
    }

    function handleRemoveComponent(key: string) {
        setForm((prev) => ({
            ...prev,
            components: prev.components.filter((c) => c.key !== key),
        }));
    }

    function handleUpdateComponent(
        key: string,
        field: keyof DraftComponent,
        value: unknown
    ) {
        setForm((prev) => ({
            ...prev,
            components: prev.components.map((c) =>
                c.key === key ? { ...c, [field]: value } : c
            ),
        }));
    }

    // Specialization Selection Toggle
    function toggleSpecialization(specId: number) {
        setForm((prev) => {
            const current = new Set(prev.selectedSpecializationIds);
            if (current.has(specId)) {
                current.delete(specId);
            } else {
                current.add(specId);
            }
            return { ...prev, selectedSpecializationIds: Array.from(current) };
        });
    }

    function selectAllSpecializations() {
        setForm((prev) => ({
            ...prev,
            selectedSpecializationIds: availableSpecializations.map((s) => s.id),
        }));
    }

    function deselectAllSpecializations() {
        setForm((prev) => ({
            ...prev,
            selectedSpecializationIds: [],
        }));
    }

    // Validation
    function validate(): boolean {
        const errors: FieldErrors = {};

        if (isCreate) {
            if (!form.courseId || typeof form.courseId !== "number" || form.courseId <= 0) {
                errors.courseId = "Please select a valid course.";
            }
            if (
                !form.academicYearId ||
                typeof form.academicYearId !== "number" ||
                form.academicYearId <= 0
            ) {
                errors.academicYearId = "Please select an academic year.";
            }
        }

        if (!form.name.trim()) {
            errors.name = "Fee structure name is required.";
        }

        if (!form.frequency) {
            errors.frequency = "Frequency is required.";
        }

        if (!form.totalNoOfInstallments || form.totalNoOfInstallments < 1) {
            errors.totalNoOfInstallments = "Number of installments must be at least 1.";
        }

        if (form.components.length === 0) {
            errors.components = "At least one fee component is required.";
        } else {
            const hasInvalid = form.components.some(
                (c) =>
                    !c.componentName.trim() ||
                    !c.feeCategoryType ||
                    isNaN(parseFloat(c.amount)) ||
                    parseFloat(c.amount) < 0
            );
            if (hasInvalid) {
                errors.components =
                    "All components must have a valid name, category, and non-negative amount.";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    // Form Submission
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitError("");

        if (isDelete) {
            if (!structure) return;
            try {
                await onDelete(structure.id);
            } catch (err) {
                setSubmitError(extractErrorMessage(err, "Failed to delete fee structure."));
            }
            return;
        }

        if (!validate()) return;

        try {
            if (isCreate) {
                const requestPayload: FeeStructureCreateRequest = {
                    name: form.name.trim(),
                    frequency: form.frequency,
                    totalNoOfInstallments: Number(form.totalNoOfInstallments),
                    specializationId: form.selectedSpecializationIds,
                    components: form.components.map((c) => ({
                        feeCategoryType: c.feeCategoryType,
                        componentName: c.componentName.trim(),
                        amount: parseFloat(c.amount) || 0,
                        isMandatory: c.isMandatory,
                        isRefundable: c.isRefundable,
                    })),
                };

                await onCreate(
                    Number(form.courseId),
                    Number(form.academicYearId),
                    requestPayload
                );
            } else if (isEdit && structure) {
                const componentToRemove: number[] = [];
                const componentToAdd: FeeComponentRequest[] = [];

                // Track removed original components
                const currentIds = new Set(
                    form.components.filter((c) => c.id).map((c) => c.id!)
                );
                structure.feeComponent.forEach((orig) => {
                    if (!currentIds.has(orig.id)) {
                        componentToRemove.push(orig.id);
                    }
                });

                // Track new components and edited components
                form.components.forEach((c) => {
                    const amt = parseFloat(c.amount) || 0;
                    if (!c.id) {
                        componentToAdd.push({
                            feeCategoryType: c.feeCategoryType,
                            componentName: c.componentName.trim(),
                            amount: amt,
                            isMandatory: c.isMandatory,
                            isRefundable: c.isRefundable,
                        });
                    } else if (c.original) {
                        const isChanged =
                            c.original.componentName !== c.componentName.trim() ||
                            c.original.feeCategoryType !== c.feeCategoryType ||
                            c.original.amount !== amt ||
                            c.original.isMandatory !== c.isMandatory ||
                            c.original.isRefundable !== c.isRefundable;

                        if (isChanged) {
                            componentToRemove.push(c.id);
                            componentToAdd.push({
                                feeCategoryType: c.feeCategoryType,
                                componentName: c.componentName.trim(),
                                amount: amt,
                                isMandatory: c.isMandatory,
                                isRefundable: c.isRefundable,
                            });
                        }
                    }
                });

                const updatePayload: FeeStructureUpdateRequest = {
                    name: form.name.trim(),
                    frequency: form.frequency,
                    totalNoOfInstallments: Number(form.totalNoOfInstallments),
                    specializationId: form.selectedSpecializationIds,
                    componentToAdd,
                    componentToRemove,
                };

                await onUpdate(structure.id, updatePayload);
            }
        } catch (err) {
            setSubmitError(extractErrorMessage(err, "Operation failed. Please review the form."));
        }
    }

    // View Mode Financial Summary calculations
    const viewTotals = useMemo(() => {
        if (!structure) return { mandatory: 0, optional: 0, grand: 0, perInstallment: 0 };
        const mandatory = structure.feeComponent
            .filter((c) => c.isMandatory)
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        const optional = structure.feeComponent
            .filter((c) => !c.isMandatory)
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        const grand = mandatory + optional;
        const installments = Math.max(1, structure.totalNoOfInstallments || 1);
        const perInstallment = mandatory / installments;
        return { mandatory, optional, grand, perInstallment };
    }, [structure]);

    const hasSpecializationsAssigned = Boolean(
        structure?.specialization && structure.specialization.length > 0
    );

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (!busy) onClose();
                }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 my-auto flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                                isDelete
                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                                    : isView
                                    ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                                    : isEdit
                                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            }`}
                        >
                            {isDelete ? (
                                <Trash2 size={20} />
                            ) : isView ? (
                                <Eye size={20} />
                            ) : isEdit ? (
                                <Pencil size={20} />
                            ) : (
                                <Plus size={20} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-white">
                                {isDelete
                                    ? "Delete Fee Structure"
                                    : isView
                                    ? "Fee Structure Details"
                                    : isEdit
                                    ? "Edit Fee Structure"
                                    : "Create Fee Structure"}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {isDelete
                                    ? "Confirm permanent removal of this fee schedule"
                                    : isView
                                    ? `Review structure components, installments, and governance audit`
                                    : isEdit
                                    ? `Updating: ${structure?.name || "Fee Structure"}`
                                    : "Configure new course fee breakdown, schedules, and installments"}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close dialog"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Submit Error Banner */}
                {submitError && (
                    <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                        <span className="flex-1 leading-relaxed">{submitError}</span>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
                    {/* -------------------------------------------------------- */}
                    {/* DELETE DIALOG                                            */}
                    {/* -------------------------------------------------------- */}
                    {isDelete && structure && (
                        <div className="space-y-4">
                            {/* Specialization Assigned Warning (Critical Backend Constraint) */}
                            {hasSpecializationsAssigned ? (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-3">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-amber-200 text-sm">
                                                Cannot Delete: Specializations Currently Assigned
                                            </p>
                                            <p className="text-amber-300/90 leading-relaxed">
                                                The server enforces that a fee structure cannot be deleted while it has specializations assigned to it.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-amber-400/20 bg-slate-950/60 p-3">
                                        <p className="text-[11px] font-semibold text-slate-400 mb-2">
                                            Currently Assigned Specializations ({structure.specialization.length}):
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {structure.specialization.map((s) => (
                                                <span
                                                    key={s.id}
                                                    className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200"
                                                >
                                                    <span>{s.name}</span>
                                                    {s.code && (
                                                        <span className="font-mono text-[10px] text-amber-300">
                                                            ({s.code})
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-slate-300 leading-relaxed text-[11px]">
                                        To delete this fee structure, click below to open Edit mode, unassign all specializations, save your changes, and then retry deletion.
                                    </p>

                                    <div className="pt-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => onSwitchToEdit(structure)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30 transition"
                                        >
                                            <Pencil size={14} />
                                            <span>Switch to Edit &amp; Unassign Specializations</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Are you sure you want to permanently delete the fee structure{" "}
                                        <span className="font-bold text-white">"{structure.name}"</span>?
                                    </p>

                                    <div className="rounded-lg border border-white/5 bg-slate-900/60 p-3 text-xs space-y-1.5 text-slate-300">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Course:</span>
                                            <span className="font-medium text-white">{structure.courses?.name || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Academic Year:</span>
                                            <span className="font-medium text-white">{structure.academicYear?.name || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Frequency:</span>
                                            <span className="font-medium text-white">{structure.frequency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Components Count:</span>
                                            <span className="font-medium text-white">{structure.feeComponent?.length || 0}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-rose-300/90 flex items-center gap-1.5">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        This action cannot be undone. Any student fee records referencing this structure will be affected.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* -------------------------------------------------------- */}
                    {/* VIEW DIALOG                                              */}
                    {/* -------------------------------------------------------- */}
                    {isView && structure && (
                        <div className="space-y-4">
                            {/* Institutional Context Breadcrumbs */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Building2 size={13} className="text-cyan-400" />
                                    Institutional Hierarchy &amp; Academic Scope
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">University</span>
                                        <span className="font-semibold text-white truncate block">
                                            {structure.university?.name || "—"}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">School</span>
                                        <span className="font-semibold text-white truncate block">
                                            {structure.school?.name || "—"}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">Department</span>
                                        <span className="font-semibold text-white truncate block">
                                            {structure.department?.name || "—"}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">Academic Year</span>
                                        <span className="font-semibold text-cyan-300 truncate block">
                                            {structure.academicYear?.name || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Metric Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                                    <span className="text-[11px] font-medium text-emerald-300">Mandatory Fee</span>
                                    <p className="mt-1 text-base sm:text-lg font-bold text-white truncate">
                                        {formatCurrency(viewTotals.mandatory)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                                    <span className="text-[11px] font-medium text-slate-400">Optional Fee</span>
                                    <p className="mt-1 text-base sm:text-lg font-bold text-white truncate">
                                        {formatCurrency(viewTotals.optional)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center">
                                    <span className="text-[11px] font-medium text-slate-400">Installments</span>
                                    <p className="mt-1 text-base sm:text-lg font-bold text-white truncate">
                                        {structure.totalNoOfInstallments || 1}
                                    </p>
                                    <span className="text-[10px] text-cyan-400 block truncate">
                                        {formatCurrency(viewTotals.perInstallment)}/inst.
                                    </span>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-center flex flex-col justify-center items-center">
                                    <span className="text-[11px] font-medium text-slate-400">Frequency</span>
                                    <div className="mt-1">
                                        <FrequencyBadge frequency={structure.frequency} />
                                    </div>
                                </div>
                            </div>

                            {/* Components Table */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                        <CreditCard size={13} className="text-cyan-400" />
                                        Fee Components ({structure.feeComponent?.length || 0})
                                    </span>
                                    <span className="text-xs font-bold text-emerald-400">
                                        Grand Total: {formatCurrency(viewTotals.grand)}
                                    </span>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                                                <th className="py-2 px-3">#</th>
                                                <th className="py-2 px-3">Category</th>
                                                <th className="py-2 px-3">Component Name</th>
                                                <th className="py-2 px-3 text-right">Amount</th>
                                                <th className="py-2 px-3 text-center">Type</th>
                                                <th className="py-2 px-3 text-center">Refundable</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-slate-200">
                                            {structure.feeComponent?.map((comp, idx) => (
                                                <tr key={comp.id || idx} className="hover:bg-white/[0.02]">
                                                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3 font-medium text-cyan-300">
                                                        {comp.feeCategoryType}
                                                    </td>
                                                    <td className="py-2 px-3">{comp.componentName}</td>
                                                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-300">
                                                        {formatCurrency(comp.amount)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                comp.isMandatory
                                                                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                                    : "border border-slate-500/30 bg-slate-500/10 text-slate-400"
                                                            }`}
                                                        >
                                                            {comp.isMandatory ? "Mandatory" : "Optional"}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                comp.isRefundable
                                                                    ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                                                                    : "border border-white/5 bg-white/5 text-slate-400"
                                                            }`}
                                                        >
                                                            {comp.isRefundable ? "Yes" : "No"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Assigned Specializations */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                        <GraduationCap size={13} className="text-purple-400" />
                                        Assigned Specializations
                                    </span>
                                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                                        {structure.specialization?.length ?? 0}
                                    </span>
                                </div>
                                {Array.isArray(structure.specialization) &&
                                structure.specialization.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                        {structure.specialization.map((s) => (
                                            <span
                                                key={s.id}
                                                className="inline-flex items-center gap-1 rounded-lg border border-purple-400/20 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-200"
                                            >
                                                <span>{s.name}</span>
                                                {s.code && (
                                                    <span className="text-[10px] text-purple-300 font-mono">
                                                        ({s.code})
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">
                                        No specific specializations assigned.
                                    </p>
                                )}
                            </div>

                            {/* Audit & Governance Showcase (EXACT University.tsx Design) */}
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
                                            {structure.createdAt && (
                                                <span className="text-slate-400 font-mono text-[10px]">
                                                    {formatDate(structure.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                                {getInitials(structure.createdBy?.name || "System")}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                    {structure.createdBy?.name || "System Administrator"}
                                                </p>
                                                {(structure.createdBy?.code || structure.createdBy?.id) && (
                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                        {structure.createdBy.code
                                                            ? `Code: ${structure.createdBy.code}`
                                                            : `ID: #${structure.createdBy.id}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {structure.createdAt && (
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-emerald-500/10">
                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    Timestamp: {formatDateTime(structure.createdAt)}
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
                                            {(structure.updatedAt || structure.createdAt) && (
                                                <span className="text-slate-400 font-mono text-[10px]">
                                                    {formatDate(structure.updatedAt || structure.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                                                {getInitials(
                                                    structure.updatedBy?.name ||
                                                        structure.createdBy?.name ||
                                                        "System"
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-slate-200 text-xs">
                                                    {structure.updatedBy?.name ||
                                                        structure.createdBy?.name ||
                                                        "System Administrator"}
                                                </p>
                                                {(structure.updatedBy?.code || structure.updatedBy?.id) && (
                                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                                        {structure.updatedBy.code
                                                            ? `Code: ${structure.updatedBy.code}`
                                                            : `ID: #${structure.updatedBy.id}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {(structure.updatedAt || structure.createdAt) && (
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-cyan-500/10">
                                                <Clock size={10} className="text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    Timestamp:{" "}
                                                    {formatDateTime(structure.updatedAt || structure.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* -------------------------------------------------------- */}
                    {/* CREATE / EDIT FORM                                       */}
                    {/* -------------------------------------------------------- */}
                    {(isCreate || isEdit) && (
                        <form id="fee-structure-form" onSubmit={handleSubmit} className="space-y-4">
                            {/* Course & Academic Year Selection (CREATE: selectable, EDIT: read-only) */}
                            {isCreate ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Course Selector */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-300">
                                            Course <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={form.courseId}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        courseId: e.target.value ? Number(e.target.value) : "",
                                                    }))
                                                }
                                                disabled={busy || coursesLoading}
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                            >
                                                <option value="" className="bg-slate-900 text-white">
                                                    {coursesLoading ? "Loading courses..." : "Select Course"}
                                                </option>
                                                {courses.map((c) => (
                                                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                                                        {c.name} {c.code ? `(${c.code})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        {fieldErrors.courseId && (
                                            <p className="text-[11px] text-rose-400">{fieldErrors.courseId}</p>
                                        )}
                                    </div>

                                    {/* Academic Year Selector */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-300">
                                            Academic Year <span className="text-rose-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={form.academicYearId}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        academicYearId: e.target.value ? Number(e.target.value) : "",
                                                    }))
                                                }
                                                disabled={
                                                    busy ||
                                                    academicYearsLoading ||
                                                    !form.courseId ||
                                                    academicYears.length === 0
                                                }
                                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                            >
                                                <option value="" className="bg-slate-900 text-white">
                                                    {!form.courseId
                                                        ? "Select course first"
                                                        : academicYearsLoading
                                                        ? "Loading academic years..."
                                                        : academicYears.length === 0
                                                        ? "No academic years found"
                                                        : "Select Academic Year"}
                                                </option>
                                                {academicYears.map((y) => (
                                                    <option key={y.id} value={y.id} className="bg-slate-900 text-white">
                                                        {y.name} {y.code ? `(${y.code})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <SelectChevron />
                                        </div>
                                        {fieldErrors.academicYearId && (
                                            <p className="text-[11px] text-rose-400">{fieldErrors.academicYearId}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* EDIT Mode: Read-only Course and Academic Year banner */
                                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3 space-y-1 text-xs">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Bound Academic Scope (Immutable)
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                                        <div>
                                            <span className="text-slate-500 text-[11px]">Course:</span>{" "}
                                            <span className="font-semibold text-white">
                                                {structure?.courses?.name || "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[11px]">Academic Year:</span>{" "}
                                            <span className="font-semibold text-white">
                                                {structure?.academicYear?.name || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Name, Frequency, and Installments */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Name */}
                                <div className="space-y-1 sm:col-span-1">
                                    <label className="text-[11px] font-semibold text-slate-300">
                                        Fee Structure Name <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="e.g. Standard B.Tech Fee 2024"
                                        disabled={busy}
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                    />
                                    {fieldErrors.name && (
                                        <p className="text-[11px] text-rose-400">{fieldErrors.name}</p>
                                    )}
                                </div>

                                {/* Frequency */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-300">
                                        Frequency <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.frequency}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, frequency: e.target.value }))
                                            }
                                            disabled={busy}
                                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                        >
                                            {feeEnums.feeFrequency.map((f) => (
                                                <option key={f.enumValue} value={f.enumValue} className="bg-slate-900 text-white">
                                                    {f.name}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                    </div>
                                    {fieldErrors.frequency && (
                                        <p className="text-[11px] text-rose-400">{fieldErrors.frequency}</p>
                                    )}
                                </div>

                                {/* Total Installments */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-300">
                                        Total Installments <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={24}
                                        value={form.totalNoOfInstallments}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                totalNoOfInstallments: Math.max(1, parseInt(e.target.value) || 1),
                                            }))
                                        }
                                        disabled={busy}
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/60 disabled:opacity-50"
                                    />
                                    {fieldErrors.totalNoOfInstallments && (
                                        <p className="text-[11px] text-rose-400">{fieldErrors.totalNoOfInstallments}</p>
                                    )}
                                </div>
                            </div>

                            {/* Specialization Multi-Select */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <GraduationCap size={13} className="text-purple-400" />
                                            Assigned Specializations
                                        </span>
                                        <p className="text-[10px] text-slate-500">
                                            Select specializations covered by this fee schedule.
                                        </p>
                                    </div>
                                    {availableSpecializations.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={selectAllSpecializations}
                                                className="text-[10px] font-medium text-purple-300 hover:underline"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-slate-600">·</span>
                                            <button
                                                type="button"
                                                onClick={deselectAllSpecializations}
                                                className="text-[10px] font-medium text-slate-400 hover:underline"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {specializationsLoading ? (
                                    <div className="py-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                        <LoaderCircle size={14} className="animate-spin text-purple-400" />
                                        <span>Loading specializations...</span>
                                    </div>
                                ) : availableSpecializations.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar pt-1">
                                        {availableSpecializations.map((spec) => {
                                            const isSelected = form.selectedSpecializationIds.includes(spec.id);
                                            return (
                                                <button
                                                    key={spec.id}
                                                    type="button"
                                                    onClick={() => toggleSpecialization(spec.id)}
                                                    className={`flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                                                        isSelected
                                                            ? "border-purple-400/40 bg-purple-500/20 text-purple-200"
                                                            : "border-white/5 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:text-slate-300"
                                                    }`}
                                                >
                                                    <span className="truncate">{spec.name}</span>
                                                    {isSelected && <Check size={12} className="shrink-0 text-purple-300" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic py-1">
                                        {isCreate && (!form.courseId || !form.academicYearId)
                                            ? "Select Course and Academic Year above to load eligible specializations."
                                            : "No eligible unassigned specializations found."}
                                    </p>
                                )}
                            </div>

                            {/* Dynamic Components Builder */}
                            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <CreditCard size={13} className="text-emerald-400" />
                                            Fee Breakdown Components ({form.components.length})
                                        </span>
                                        <p className="text-[10px] text-slate-500">
                                            Define mandatory and optional fee items for this schedule.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddComponent}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition self-start sm:self-auto"
                                    >
                                        <Plus size={13} />
                                        <span>Add Component</span>
                                    </button>
                                </div>

                                {fieldErrors.components && (
                                    <p className="text-[11px] text-rose-400">{fieldErrors.components}</p>
                                )}

                                {/* Component Rows */}
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {form.components.map((comp, idx) => (
                                        <div
                                            key={comp.key}
                                            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-white/5 bg-slate-900/60 p-2.5 text-xs"
                                        >
                                            <span className="text-slate-500 font-mono text-[10px] w-5 text-center hidden sm:inline">
                                                {idx + 1}
                                            </span>

                                            {/* Category */}
                                            <div className="relative min-w-[130px]">
                                                <select
                                                    value={comp.feeCategoryType}
                                                    onChange={(e) =>
                                                        handleUpdateComponent(
                                                            comp.key,
                                                            "feeCategoryType",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full appearance-none rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 pr-7 text-xs text-white outline-none focus:border-cyan-400"
                                                >
                                                    {feeEnums.feeComponentType.map((t) => (
                                                        <option
                                                            key={t.enumValue}
                                                            value={t.enumValue}
                                                            className="bg-slate-900 text-white"
                                                        >
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown
                                                    size={12}
                                                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                            </div>

                                            {/* Component Name */}
                                            <input
                                                type="text"
                                                value={comp.componentName}
                                                onChange={(e) =>
                                                    handleUpdateComponent(
                                                        comp.key,
                                                        "componentName",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Component Name (e.g. Lab Fee)"
                                                className="flex-1 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                                            />

                                            {/* Amount */}
                                            <div className="relative w-full sm:w-28">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={comp.amount}
                                                    onChange={(e) =>
                                                        handleUpdateComponent(comp.key, "amount", e.target.value)
                                                    }
                                                    placeholder="Amount (₹)"
                                                    className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 font-mono text-xs text-emerald-300 placeholder-slate-500 outline-none focus:border-cyan-400"
                                                />
                                            </div>

                                            {/* Mandatory Toggle */}
                                            <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={comp.isMandatory}
                                                    onChange={(e) =>
                                                        handleUpdateComponent(
                                                            comp.key,
                                                            "isMandatory",
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="rounded border-white/10 bg-slate-950 text-cyan-500 focus:ring-0"
                                                />
                                                <span>Mandatory</span>
                                            </label>

                                            {/* Refundable Toggle */}
                                            <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={comp.isRefundable}
                                                    onChange={(e) =>
                                                        handleUpdateComponent(
                                                            comp.key,
                                                            "isRefundable",
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="rounded border-white/10 bg-slate-950 text-cyan-500 focus:ring-0"
                                                />
                                                <span>Refundable</span>
                                            </label>

                                            {/* Remove row button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveComponent(comp.key)}
                                                disabled={form.components.length === 1}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-20 shrink-0"
                                                title="Remove fee component"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Live Computed Totals Footer */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-center text-xs">
                                    <div className="rounded-lg bg-slate-950/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">Mandatory Fee</span>
                                        <span className="font-bold text-emerald-400 text-sm">
                                            {formatCurrency(feeTotals.mandatory)}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-slate-950/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">Optional Fee</span>
                                        <span className="font-medium text-slate-300 text-sm">
                                            {formatCurrency(feeTotals.optional)}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-slate-950/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">Grand Total</span>
                                        <span className="font-bold text-white text-sm">
                                            {formatCurrency(feeTotals.grand)}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-slate-950/60 p-2">
                                        <span className="text-[10px] text-slate-400 block">Per Installment</span>
                                        <span className="font-bold text-cyan-300 text-sm">
                                            {formatCurrency(feeTotals.perInstallment)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3.5 shrink-0 bg-slate-950/40">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                        {isView ? "Close" : "Cancel"}
                    </button>

                    {isDelete && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={busy || hasSpecializationsAssigned}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 disabled:opacity-50"
                        >
                            {busy ? (
                                <>
                                    <LoaderCircle size={14} className="animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 size={14} />
                                    <span>Delete Fee Structure</span>
                                </>
                            )}
                        </button>
                    )}

                    {(isCreate || isEdit) && (
                        <button
                            type="submit"
                            form="fee-structure-form"
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:opacity-50"
                        >
                            {busy ? (
                                <>
                                    <LoaderCircle size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : isEdit ? (
                                <>
                                    <Pencil size={14} />
                                    <span>Save Changes</span>
                                </>
                            ) : (
                                <>
                                    <Plus size={14} />
                                    <span>Create Structure</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main FeeStructure Page Component                                           */
/* -------------------------------------------------------------------------- */

export default function FeeStructure() {
    const reduceMotion = useReducedMotion();

    // Data State
    const [feeStructures, setFeeStructures] = useState<FeeStructureResponse[]>([]);
    const [courses, setCourses] = useState<CommonDTO[]>([]);
    const [feeEnums, setFeeEnums] = useState<FeeEnums>({
        feeFrequency: [],
        feeComponentType: [],
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    // Modal State
    const [dialogState, setDialogState] = useState<{
        mode: DialogMode;
        structure: FeeStructureResponse | null;
    } | null>(null);
    const [busy, setBusy] = useState(false);

    // Filter & Search State
    const [search, setSearch] = useState("");
    const [universityFilter, setUniversityFilter] = useState<number | "ALL">("ALL");
    const [schoolFilter, setSchoolFilter] = useState<number | "ALL">("ALL");
    const [departmentFilter, setDepartmentFilter] = useState<number | "ALL">("ALL");
    const [courseFilter, setCourseFilter] = useState<number | "ALL">("ALL");
    const [academicYearFilter, setAcademicYearFilter] = useState<number | "ALL">("ALL");
    const [frequencyFilter, setFrequencyFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);

    // Initial Data Fetching
    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setPageError("");

        try {
            const [structuresData, enumsData, coursesData] = await Promise.all([
                getFeeStructures(),
                getFeeEnums(),
                getCourseFilter().catch((err) => {
                    console.warn("Could not load initial course filter options:", err);
                    return [] as CommonDTO[];
                }),
            ]);

            setFeeStructures(structuresData);
            setFeeEnums(enumsData);
            setCourses(coursesData);
        } catch (err) {
            setPageError(extractErrorMessage(err, "Failed to load fee structures."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Lazy load courses if modal is opened and courses are empty
    async function ensureCourses() {
        if (courses.length === 0) {
            setCoursesLoading(true);
            try {
                const data = await getCourseFilter();
                setCourses(data);
            } catch (err) {
                console.warn("Failed to load courses on demand:", err);
            } finally {
                setCoursesLoading(false);
            }
        }
    }

    // Dynamic Filter Options derived from loaded structures
    const universityOptions = useMemo(
        () => uniqueCommonDTOs(feeStructures.map((f) => f.university)),
        [feeStructures]
    );

    const schoolOptions = useMemo(
        () => uniqueCommonDTOs(feeStructures.map((f) => f.school)),
        [feeStructures]
    );

    const departmentOptions = useMemo(
        () => uniqueCommonDTOs(feeStructures.map((f) => f.department)),
        [feeStructures]
    );

    const courseOptions = useMemo(
        () => uniqueCommonDTOs(feeStructures.map((f) => f.courses)),
        [feeStructures]
    );

    const academicYearOptions = useMemo(
        () => uniqueCommonDTOs(feeStructures.map((f) => f.academicYear)),
        [feeStructures]
    );

    const frequencyOptions = useMemo(() => {
        const unique = new Set<string>();
        feeStructures.forEach((f) => {
            if (f.frequency) unique.add(f.frequency);
        });
        return Array.from(unique);
    }, [feeStructures]);

    // Filter and Sort Pipeline
    const filteredStructures = useMemo(() => {
        const q = search.trim().toLowerCase();

        return feeStructures.filter((f) => {
            // Search text
            if (q) {
                const matchesName = f.name?.toLowerCase().includes(q);
                const matchesCourse = f.courses?.name?.toLowerCase().includes(q);
                const matchesYear = f.academicYear?.name?.toLowerCase().includes(q);
                const matchesDept = f.department?.name?.toLowerCase().includes(q);
                const matchesSchool = f.school?.name?.toLowerCase().includes(q);
                const matchesUni = f.university?.name?.toLowerCase().includes(q);
                const matchesSpec = f.specialization?.some((s) =>
                    s.name?.toLowerCase().includes(q)
                );
                if (
                    !matchesName &&
                    !matchesCourse &&
                    !matchesYear &&
                    !matchesDept &&
                    !matchesSchool &&
                    !matchesUni &&
                    !matchesSpec
                ) {
                    return false;
                }
            }

            // University Filter
            if (universityFilter !== "ALL" && f.university?.id !== universityFilter) {
                return false;
            }

            // School Filter
            if (schoolFilter !== "ALL" && f.school?.id !== schoolFilter) {
                return false;
            }

            // Department Filter
            if (departmentFilter !== "ALL" && f.department?.id !== departmentFilter) {
                return false;
            }

            // Course Filter
            if (courseFilter !== "ALL" && f.courses?.id !== courseFilter) {
                return false;
            }

            // Academic Year Filter
            if (academicYearFilter !== "ALL" && f.academicYear?.id !== academicYearFilter) {
                return false;
            }

            // Frequency Filter
            if (frequencyFilter !== "ALL" && f.frequency !== frequencyFilter) {
                return false;
            }

            return true;
        });
    }, [
        feeStructures,
        search,
        universityFilter,
        schoolFilter,
        departmentFilter,
        courseFilter,
        academicYearFilter,
        frequencyFilter,
    ]);

    const sortedStructures = useMemo(() => {
        return [...filteredStructures].sort((a, b) => {
            const aMandatory = a.feeComponent
                ?.filter((c) => c.isMandatory)
                .reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;
            const bMandatory = b.feeComponent
                ?.filter((c) => c.isMandatory)
                .reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;

            switch (sortBy) {
                case "NAME_ASC":
                    return (a.name || "").localeCompare(b.name || "");
                case "NAME_DESC":
                    return (b.name || "").localeCompare(a.name || "");
                case "AMOUNT_DESC":
                    return bMandatory - aMandatory;
                case "AMOUNT_ASC":
                    return aMandatory - bMandatory;
                case "NEWEST":
                default:
                    return b.id - a.id;
            }
        });
    }, [filteredStructures, sortBy]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedStructures.length / PAGE_SIZE));
    const paginatedStructures = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedStructures.slice(start, start + PAGE_SIZE);
    }, [sortedStructures, currentPage]);

    // Overall Metrics
    const metrics = useMemo(() => {
        const total = feeStructures.length;
        const totalMandatoryValue = feeStructures.reduce((sum, f) => {
            const m = f.feeComponent
                ?.filter((c) => c.isMandatory)
                .reduce((sub, c) => sub + (c.amount || 0), 0) ?? 0;
            return sum + m;
        }, 0);

        const uniqueFreqs = new Set(feeStructures.map((f) => f.frequency)).size;
        const uniqueSpecs = new Set(
            feeStructures.flatMap((f) => f.specialization?.map((s) => s.id) || [])
        ).size;

        return { total, totalMandatoryValue, uniqueFreqs, uniqueSpecs };
    }, [feeStructures]);

    const hasActiveFilters =
        Boolean(search.trim()) ||
        universityFilter !== "ALL" ||
        schoolFilter !== "ALL" ||
        departmentFilter !== "ALL" ||
        courseFilter !== "ALL" ||
        academicYearFilter !== "ALL" ||
        frequencyFilter !== "ALL" ||
        sortBy !== "NEWEST";

    function resetFilters() {
        setSearch("");
        setUniversityFilter("ALL");
        setSchoolFilter("ALL");
        setDepartmentFilter("ALL");
        setCourseFilter("ALL");
        setAcademicYearFilter("ALL");
        setFrequencyFilter("ALL");
        setSortBy("NEWEST");
        setCurrentPage(1);
    }

    // Modal Handlers
    function openDialog(mode: DialogMode, structure: FeeStructureResponse | null = null) {
        setDialogState({ mode, structure });
        if (mode === "CREATE" || mode === "EDIT") {
            void ensureCourses();
        }
    }

    function closeDialog() {
        setDialogState(null);
    }

    async function handleCreate(
        courseId: number,
        academicYearId: number,
        request: FeeStructureCreateRequest
    ) {
        setBusy(true);
        try {
            const created = await createFeeStructure(courseId, academicYearId, request);
            setFeeStructures((prev) => [created, ...prev]);
            closeDialog();
            setNotice(`Fee structure "${created.name}" created successfully.`);
            toast.success("Fee structure created successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpdate(id: number, request: FeeStructureUpdateRequest) {
        setBusy(true);
        try {
            const updated = await updateFeeStructure(id, request);
            setFeeStructures((prev) =>
                prev.map((item) => (item.id === id ? updated : item))
            );
            closeDialog();
            setNotice(`Fee structure "${updated.name}" updated successfully.`);
            toast.success("Fee structure updated successfully");
        } catch (err) {
            throw err;
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setBusy(true);
        try {
            await deleteFeeStructure(id);
            setFeeStructures((prev) => prev.filter((item) => item.id !== id));
            closeDialog();
            setNotice("Fee structure deleted successfully.");
            toast.success("Fee structure deleted successfully");
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
                    <span className="truncate">Financial Management</span>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                    <span className="text-cyan-300 shrink-0">Fee Structures</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Academic Billing &amp; Installments
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Fee Structures
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                            Configure mandatory tuition, examination, and laboratory components, manage installment frequencies, and monitor governance audit trails.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            title="Refresh fee structure list"
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
                            onClick={() => openDialog("CREATE")}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span>Add Fee Structure</span>
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
                aria-label="Fee structure metrics"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
                {[
                    {
                        label: "Total Fee Structures",
                        value: loading ? "—" : metrics.total.toLocaleString("en-IN"),
                        sub: "Active fee schedules",
                        icon: Wallet,
                        color: "border-blue-400/30 bg-blue-500/10 text-blue-300",
                    },
                    {
                        label: "Mandatory Fee Portfolio",
                        value: loading ? "—" : formatCurrency(metrics.totalMandatoryValue),
                        sub: "Total baseline tuition value",
                        icon: BadgeIndianRupee,
                        color: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
                    },
                    {
                        label: "Configured Frequencies",
                        value: loading ? "—" : metrics.uniqueFreqs.toLocaleString("en-IN"),
                        sub: "Billing cycles (Semester/Annual)",
                        icon: Calendar,
                        color: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
                    },
                    {
                        label: "Specializations Covered",
                        value: loading ? "—" : metrics.uniqueSpecs.toLocaleString("en-IN"),
                        sub: "Associated academic branches",
                        icon: GraduationCap,
                        color: "border-purple-400/30 bg-purple-500/10 text-purple-300",
                    },
                ].map((stat, idx) => (
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
                    {/* Top Row: Search + University + School + Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* Search Input */}
                        <div className="relative">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name, course, specialization..."
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

                        {/* School Filter */}
                        <div className="relative">
                            <select
                                value={schoolFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setSchoolFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Schools
                                </option>
                                {schoolOptions.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Department Filter */}
                        <div className="relative">
                            <select
                                value={departmentFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setDepartmentFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 pr-9 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Departments
                                </option>
                                {departmentOptions.map((d) => (
                                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>
                    </div>

                    {/* Secondary Row: Course + Academic Year + Frequency + Sort + Reset */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-white/5">
                        {/* Course Filter */}
                        <div className="relative">
                            <select
                                value={courseFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setCourseFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 pr-8 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Courses
                                </option>
                                {courseOptions.map((c) => (
                                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Academic Year Filter */}
                        <div className="relative">
                            <select
                                value={academicYearFilter}
                                onChange={(e) => {
                                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                                    setAcademicYearFilter(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 pr-8 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Academic Years
                                </option>
                                {academicYearOptions.map((y) => (
                                    <option key={y.id} value={y.id} className="bg-slate-900 text-white">
                                        {y.name}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Frequency Filter */}
                        <div className="relative">
                            <select
                                value={frequencyFilter}
                                onChange={(e) => setFrequencyFilter(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 pr-8 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">
                                    All Frequencies
                                </option>
                                {frequencyOptions.map((f) => (
                                    <option key={f} value={f} className="bg-slate-900 text-white">
                                        {f.replace(/_/g, " ")}
                                    </option>
                                ))}
                            </select>
                            <SelectChevron />
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 pr-8 text-xs text-white outline-none transition focus:border-cyan-400/60"
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
                                <option value="AMOUNT_DESC" className="bg-slate-900 text-white">
                                    Fee (High to Low)
                                </option>
                                <option value="AMOUNT_ASC" className="bg-slate-900 text-white">
                                    Fee (Low to High)
                                </option>
                            </select>
                            <ArrowDownUp
                                size={13}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                        {/* Reset Filters */}
                        <div className="col-span-2 sm:col-span-1 flex items-center">
                            <button
                                type="button"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                            >
                                <RotateCcw size={13} />
                                <span>Reset Filters</span>
                            </button>
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
                                    Structure &amp; Creator
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[170px]">
                                    Course &amp; Academic Year
                                </th>
                                <th scope="col" className="px-4 py-4">
                                    Frequency
                                </th>
                                <th scope="col" className="px-4 py-4 text-right">
                                    Mandatory Fee
                                </th>
                                <th scope="col" className="px-4 py-4 text-center">
                                    Installments
                                </th>
                                <th scope="col" className="px-4 py-4 min-w-[130px]">
                                    Specializations
                                </th>
                                <th scope="col" className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="inline-flex flex-col items-center justify-center gap-3">
                                            <LoaderCircle size={32} className="animate-spin text-cyan-400" />
                                            <p className="font-semibold text-slate-200">
                                                Loading fee structures...
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Fetching schedules, component breakdowns, and installments
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageError && feeStructures.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={26} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            Failed to load fee structures
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
                            ) : paginatedStructures.length > 0 ? (
                                paginatedStructures.map((f, index) => {
                                    const canEdit = hasPermission(f, "UPDATE");
                                    const canDelete = hasPermission(f, "DELETE");

                                    const mandatoryTotal = f.feeComponent
                                        ?.filter((c) => c.isMandatory)
                                        .reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;
                                    const optionalTotal = f.feeComponent
                                        ?.filter((c) => !c.isMandatory)
                                        .reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;

                                    const installments = Math.max(1, f.totalNoOfInstallments || 1);
                                    const perInstallment = mandatoryTotal / installments;

                                    return (
                                        <motion.tr
                                            key={f.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group transition-colors hover:bg-cyan-400/[0.035]"
                                        >
                                            {/* Index */}
                                            <td className="px-5 py-4 text-slate-500 text-xs text-center font-mono">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>

                                            {/* Structure & Creator Pill (Exact University.tsx Matching) */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/25 to-violet-500/20 text-xs font-bold text-cyan-200">
                                                        {getInitials(f.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-xs truncate font-semibold text-slate-100">
                                                            {f.name || "Unnamed Structure"}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                ID #{f.id}
                                                            </span>
                                                            <span className="text-slate-600">·</span>
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors"
                                                                title={`Created by: ${formatAuditActor(
                                                                    f.createdBy
                                                                )}${
                                                                    f.createdAt
                                                                        ? ` on ${formatDate(f.createdAt)}`
                                                                        : ""
                                                                }${
                                                                    f.updatedBy?.name
                                                                        ? ` | Modified by: ${formatAuditActor(
                                                                              f.updatedBy
                                                                          )}`
                                                                        : ""
                                                                }`}
                                                            >
                                                                <UserCheck
                                                                    size={11}
                                                                    className="text-emerald-400 shrink-0"
                                                                />
                                                                <span className="truncate max-w-[120px] font-medium text-slate-300">
                                                                    {f.createdBy?.name || "System"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Course & Academic Year */}
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-200">
                                                        {f.courses?.name || "—"}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        {f.courses?.code && (
                                                            <span className="rounded bg-white/5 px-1.5 py-0.2 font-mono text-[10px] text-cyan-300">
                                                                {f.courses.code}
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-slate-400 truncate">
                                                            {f.academicYear?.name || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Frequency Badge */}
                                            <td className="px-4 py-4">
                                                <FrequencyBadge frequency={f.frequency} />
                                            </td>

                                            {/* Mandatory Fee */}
                                            <td className="px-4 py-4 text-right">
                                                <p className="font-bold text-emerald-300 font-mono text-sm">
                                                    {formatCurrency(mandatoryTotal)}
                                                </p>
                                                {optionalTotal > 0 && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        +{formatCurrency(optionalTotal)} opt.
                                                    </p>
                                                )}
                                            </td>

                                            {/* Installments */}
                                            <td className="px-4 py-4 text-center">
                                                <span className="font-semibold text-white">
                                                    {f.totalNoOfInstallments}x
                                                </span>
                                                <p className="text-[10px] text-cyan-300 font-mono mt-0.5">
                                                    {formatCurrency(perInstallment)}/inst.
                                                </p>
                                            </td>

                                            {/* Specializations */}
                                            <td className="px-4 py-4">
                                                {f.specialization && f.specialization.length > 0 ? (
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
                                                            <GraduationCap size={11} />
                                                            <span>
                                                                {f.specialization.length}{" "}
                                                                {f.specialization.length === 1 ? "Spec" : "Specs"}
                                                            </span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 text-xs italic">
                                                        General (All)
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions with strict h-8 w-8 shrink-0 */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDialog("VIEW", f)}
                                                        aria-label={`View details of ${f.name}`}
                                                        title="View fee structure details"
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("EDIT", f)}
                                                            aria-label={`Edit ${f.name}`}
                                                            title="Edit fee structure"
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog("DELETE", f)}
                                                            aria-label={`Delete ${f.name}`}
                                                            title="Delete fee structure"
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
                                            <Wallet size={25} />
                                        </div>
                                        <p className="mt-4 font-semibold text-slate-200">
                                            {hasActiveFilters
                                                ? "No matching fee structures found"
                                                : "No fee structures configured yet"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try revising your search terms or resetting your filters."
                                                : "Get started by creating your institution's first course fee structure."}
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
                                                    Add Fee Structure
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
                                Loading fee structures...
                            </p>
                        </div>
                    ) : pageError && feeStructures.length === 0 ? (
                        <div className="p-6 text-center">
                            <AlertTriangle size={24} className="text-rose-400 mx-auto" />
                            <p className="mt-2 text-xs font-semibold text-white">
                                Failed to load fee structures
                            </p>
                            <button
                                type="button"
                                onClick={() => void loadData()}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                            >
                                <RefreshCw size={13} /> Retry
                            </button>
                        </div>
                    ) : paginatedStructures.length > 0 ? (
                        paginatedStructures.map((f) => {
                            const canEdit = hasPermission(f, "UPDATE");
                            const canDelete = hasPermission(f, "DELETE");

                            const mandatoryTotal = f.feeComponent
                                ?.filter((c) => c.isMandatory)
                                .reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;
                            const optionalTotal = f.feeComponent
                                ?.filter((c) => !c.isMandatory)
                                .reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;

                            const installments = Math.max(1, f.totalNoOfInstallments || 1);
                            const perInstallment = mandatoryTotal / installments;

                            return (
                                <article key={f.id} className="p-3.5 space-y-3">
                                    {/* Header: Name + ID + Frequency */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-white text-sm truncate">
                                                {f.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                                <span className="font-mono text-[11px] text-slate-500">
                                                    ID #{f.id}
                                                </span>
                                                <span>·</span>
                                                <span className="truncate">{f.courses?.name || "—"}</span>
                                            </div>
                                        </div>
                                        <FrequencyBadge frequency={f.frequency} />
                                    </div>

                                    {/* Financial Breakdown Grid */}
                                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5 text-xs space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-[11px]">Academic Year:</span>
                                            <span className="font-medium text-white">{f.academicYear?.name || "—"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-[11px]">Mandatory Fee:</span>
                                            <span className="font-bold text-emerald-300 font-mono">
                                                {formatCurrency(mandatoryTotal)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-[11px]">Installments:</span>
                                            <span className="font-medium text-cyan-300">
                                                {f.totalNoOfInstallments}x ({formatCurrency(perInstallment)}/inst.)
                                            </span>
                                        </div>
                                        {f.specialization && f.specialization.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400 text-[11px]">Specializations:</span>
                                                <span className="font-medium text-purple-300">
                                                    {f.specialization.length} assigned
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Audit Showcase Bar (Matching University.tsx) */}
                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-[11px] text-slate-400">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                                            <span className="text-slate-500">Created:</span>
                                            <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                {f.createdBy?.name || "System"}
                                            </span>
                                            {f.createdAt && (
                                                <span className="text-slate-500 font-mono text-[10px]">
                                                    · {formatDate(f.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {f.updatedBy?.name && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <RotateCcw size={11} className="text-cyan-400 shrink-0" />
                                                <span className="text-slate-500">Updated:</span>
                                                <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                    {f.updatedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => openDialog("VIEW", f)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                                        >
                                            <Eye size={13} /> Details
                                        </button>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("EDIT", f)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => openDialog("DELETE", f)}
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
                            No fee structures match your criteria.
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        {sortedStructures.length === 0
                            ? "Showing 0 fee structures"
                            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                                  currentPage * PAGE_SIZE,
                                  sortedStructures.length
                              )} of ${sortedStructures.length} fee structure${
                                  sortedStructures.length === 1 ? "" : "s"
                              }`}
                    </p>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Fee structure pagination"
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
                    <FeeStructureDialog
                        mode={dialogState.mode}
                        structure={dialogState.structure}
                        feeEnums={feeEnums}
                        courses={courses}
                        coursesLoading={coursesLoading}
                        busy={busy}
                        onClose={closeDialog}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onSwitchToEdit={(struct) => setDialogState({ mode: "EDIT", structure: struct })}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
