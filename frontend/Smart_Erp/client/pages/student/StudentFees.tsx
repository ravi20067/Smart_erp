import { useEffect, useMemo, useState } from "react";
import {
    BadgePercent,
    CalendarClock,
    CheckCircle2,
    CreditCard,
    FileSpreadsheet,
    IndianRupee,
    Receipt,
    Scale,
    Wallet,
    AlertTriangle,
} from "lucide-react";
import {
    studentPortalService,
    type FeeAccountInstallment,
    type StudentFeesResponse,
} from "@/services/studentPortalService";

function formatInr(value: number | null | undefined): string {
    return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StudentFees() {
    const [data, setData] = useState<StudentFeesResponse | null>(null);
    const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        studentPortalService
            .getFees()
            .then((res) => {
                setData(res);
                if (res.installments?.length) {
                    const current = res.installments.find((i) => i.isCurrent) || res.installments[0];
                    setSelectedInstallmentId(current.feeAccountId);
                }
            })
            .catch((e) => setError(e?.response?.data?.message || e?.message || "Failed to load fee account"))
            .finally(() => setLoading(false));
    }, []);

    const activeInstallment = useMemo<FeeAccountInstallment | null>(() => {
        if (!data?.installments?.length) return null;
        return (
            data.installments.find((i) => i.feeAccountId === selectedInstallmentId) ||
            data.installments[0]
        );
    }, [data, selectedInstallmentId]);

    if (loading) {
        return <div className="p-8 text-slate-400">Loading your fee account, scholarships, and payment receipts...</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                    {error}
                </div>
            </div>
        );
    }

    const statusBadgeClass = (status: string) => {
        switch (status) {
            case "PAID":
            case "OVER_PAID":
                return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
            case "PARTIAL":
            case "PARTIALLY_PAID":
                return "bg-sky-500/20 text-sky-300 border-sky-500/40";
            case "OVERDUE":
                return "bg-rose-500/20 text-rose-300 border-rose-500/40";
            default:
                return "bg-amber-500/20 text-amber-300 border-amber-500/40";
        }
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <CreditCard className="text-emerald-400" />
                        <span>Fee Account & Financial Ledger</span>
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {data?.courseName || "Course"} • Section {data?.sectionName || "-"}
                        {data?.specializationName ? ` • ${data.specializationName}` : ""}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {data?.nextDueDate && Number(data.dueAmount || 0) > 0 && (
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
                            <CalendarClock size={14} className="text-amber-400" />
                            <span>Next Due: {data.nextDueDate}</span>
                        </div>
                    )}
                    <div
                        className={`rounded-full border px-4 py-1.5 text-xs font-bold ${statusBadgeClass(
                            data?.status || "PENDING"
                        )}`}
                    >
                        {data?.status || "PENDING"}
                    </div>
                </div>
            </header>

            {!data?.initialized || !data.installments.length ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
                    <AlertTriangle size={36} className="mx-auto text-amber-400" />
                    <h2 className="mt-3 text-lg font-bold text-white">
                        Fee Account Not Initialized Yet
                    </h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-300">
                        Your enrollment does not currently have an initialized Fee Account or Fee Structure linked. Please contact the Finance Desk to generate your installment schedule.
                    </p>
                </div>
            ) : (
                <>
                    {/* Portfolio KPI Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <IndianRupee size={14} className="text-indigo-400" /> Net Payable Fee
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-white">
                                {formatInr(data.totalFeeAmount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Base: {formatInr(data.totalBaseAmount)} • Fines: {formatInr(data.totalFineAmount)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <CheckCircle2 size={14} className="text-emerald-400" /> Total Paid
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-emerald-400">
                                {formatInr(data.paidAmount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {data.allPayments.length} verified transaction{data.allPayments.length === 1 ? "" : "s"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <Wallet size={14} className="text-rose-400" /> Remaining Due
                            </p>
                            <p
                                className={`mt-2 text-2xl font-extrabold ${
                                    Number(data.dueAmount || 0) > 0 ? "text-rose-400" : "text-emerald-400"
                                }`}
                            >
                                {formatInr(data.dueAmount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Across {data.installments.length} installment{data.installments.length === 1 ? "" : "s"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <BadgePercent size={14} className="text-cyan-400" /> Scholarships Saved
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-cyan-400">
                                {formatInr(data.totalScholarshipDiscount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">Applied waivers & grants</p>
                        </div>
                    </div>

                    {/* Installment Selector Tabs */}
                    <div className="space-y-2">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                            Fee Account Installments ({data.installments.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {data.installments.map((inst) => {
                                const selected = activeInstallment?.feeAccountId === inst.feeAccountId;
                                return (
                                    <button
                                        key={inst.feeAccountId}
                                        type="button"
                                        onClick={() => setSelectedInstallmentId(inst.feeAccountId)}
                                        className={`rounded-2xl border p-4 text-left transition ${
                                            selected
                                                ? "border-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                                                : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-white">
                                                Installment #{inst.installmentNo}
                                                {inst.isCurrent && (
                                                    <span className="ml-2 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                                                        Current
                                                    </span>
                                                )}
                                            </span>
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(
                                                    inst.status
                                                )}`}
                                            >
                                                {inst.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-xs text-slate-400">
                                            {inst.feeStructureName}
                                            {inst.academicYearName ? ` • ${inst.academicYearName}` : ""}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <span className="text-slate-400">
                                                Due: {inst.dueDate || "Not Set"}
                                            </span>
                                            <span className="font-bold text-white">
                                                Due Bal: {formatInr(inst.dueBalance)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Installment Detailed Breakdown */}
                    {activeInstallment && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Fee Structure Components */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 font-bold text-white">
                                        <FileSpreadsheet size={18} className="text-indigo-400" />
                                        <span>
                                            {activeInstallment.feeStructureName} — Fee Components
                                        </span>
                                    </h3>
                                    {activeInstallment.frequency && (
                                        <span className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs text-slate-300">
                                            {activeInstallment.frequency}
                                        </span>
                                    )}
                                </div>

                                {activeInstallment.components.length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                        Lump-sum base amount: {formatInr(activeInstallment.baseAmount)}
                                    </p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {activeInstallment.components.map((c) => (
                                            <div
                                                key={c.id}
                                                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-sm"
                                            >
                                                <div>
                                                    <p className="font-medium text-slate-100">
                                                        {c.componentName}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {c.category || "FEE"} •{" "}
                                                        {c.mandatory ? "Mandatory" : "Optional"}
                                                        {c.refundable ? " • Refundable" : ""}
                                                    </p>
                                                </div>
                                                <span className="font-semibold text-white">
                                                    {formatInr(c.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Scholarships & Fee Adjustments */}
                            <div className="space-y-6">
                                {/* Scholarships */}
                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                    <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
                                        <BadgePercent size={18} className="text-cyan-400" />
                                        <span>Applied Scholarships</span>
                                    </h3>
                                    {activeInstallment.scholarships.length === 0 ? (
                                        <p className="text-xs text-slate-500">
                                            No scholarships applied to this installment.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {activeInstallment.scholarships.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-cyan-200">
                                                            {s.name} ({s.code})
                                                        </p>
                                                        <p className="text-slate-400">
                                                            {s.scholarshipType} •{" "}
                                                            {s.amountType === "PERCENTAGE"
                                                                ? `${s.value}%`
                                                                : formatInr(s.value)}
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-emerald-400">
                                                        -{formatInr(s.calculatedDiscount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Adjustments */}
                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                                    <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
                                        <Scale size={18} className="text-amber-400" />
                                        <span>Fines & Adjustments</span>
                                    </h3>
                                    {activeInstallment.adjustments.length === 0 ? (
                                        <p className="text-xs text-slate-500">
                                            No manual adjustments or fines recorded.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {activeInstallment.adjustments.map((adj) => (
                                                <div
                                                    key={adj.id}
                                                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-slate-200">
                                                            {adj.reason}
                                                        </p>
                                                        <p className="text-slate-500">
                                                            {adj.type}
                                                            {adj.authorizedBy
                                                                ? ` • Approved by ${adj.authorizedBy}`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-amber-300">
                                                        {formatInr(adj.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Receipts Ledger */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <h3 className="mb-4 flex items-center gap-2 font-bold text-white">
                            <Receipt size={18} className="text-emerald-400" />
                            <span>Payment Receipts & Transaction History</span>
                        </h3>
                        {data.allPayments.length === 0 ? (
                            <p className="text-sm text-slate-500">No payments recorded yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-800 text-slate-400">
                                        <tr>
                                            <th className="py-2 pr-4">Receipt #</th>
                                            <th className="py-2 pr-4">Installment</th>
                                            <th className="py-2 pr-4">Date</th>
                                            <th className="py-2 pr-4">Mode</th>
                                            <th className="py-2 pr-4">Ref</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 text-right">Amount Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/80">
                                        {data.allPayments.map((p) => (
                                            <tr key={p.id} className="text-slate-200">
                                                <td className="py-2.5 pr-4 font-mono font-semibold text-white">
                                                    {p.receiptNumber || `RCPT-${p.id}`}
                                                </td>
                                                <td className="py-2.5 pr-4">#{p.installmentNo ?? "-"}</td>
                                                <td className="py-2.5 pr-4">{p.paymentDate || "-"}</td>
                                                <td className="py-2.5 pr-4">{p.paymentMode || "-"}</td>
                                                <td className="py-2.5 pr-4 font-mono text-slate-400">
                                                    {p.transactionReference || "-"}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
                                                        {p.status || "SUCCESS"}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right font-bold text-emerald-400">
                                                    {formatInr(p.amountPaid)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
