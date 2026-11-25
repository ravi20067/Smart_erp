import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    ArrowUpRight,
    Car,
    CheckCircle2,
    Clock,
    DoorOpen,
    Eye,
    KeyRound,
    Lock,
    PhoneCall,
    Plus,
    Radio,
    ScanLine,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Truck,
    UserCheck,
    UserPlus,
    Users,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

interface VisitorEntry {
    id: string;
    name: string;
    host: string;
    purpose: string;
    gate: string;
    time: string;
    status: "INSIDE" | "CHECKED_OUT";
}

interface VehicleEntry {
    plate: string;
    model: string;
    driver: string;
    gate: string;
    time: string;
    type: "STAFF" | "VISITOR" | "DELIVERY";
}

const mockVisitors: VisitorEntry[] = [
    { id: "V-901", name: "Dr. Ananya Roy", host: "Dept. of Computer Science", purpose: "Guest Lecture", gate: "Main Gate A", time: "10:15 AM", status: "INSIDE" },
    { id: "V-902", name: "Sunil Verma", host: "Admin Office", purpose: "Vendor Delivery", gate: "North Gate 2", time: "10:42 AM", status: "INSIDE" },
    { id: "V-903", name: "Pooja Hegde", host: "Dean of Engineering", purpose: "Parent Meeting", gate: "Main Gate A", time: "09:30 AM", status: "CHECKED_OUT" },
    { id: "V-904", name: "Rohan Mehra", host: "Library", purpose: "Book Return", gate: "East Gate", time: "11:05 AM", status: "INSIDE" },
];

const mockVehicles: VehicleEntry[] = [
    { plate: "DL 01 AB 4321", model: "Hyundai Creta", driver: "Prof. S. Sengupta", gate: "Main Gate A", time: "08:45 AM", type: "STAFF" },
    { plate: "HR 26 CP 9876", model: "Toyota Innova", driver: "Dr. Ananya Roy", gate: "Main Gate A", time: "10:15 AM", type: "VISITOR" },
    { plate: "UP 16 Z 5541", model: "Tata Ace", driver: "Courier Logistics", gate: "North Gate 2", time: "10:38 AM", type: "DELIVERY" },
];

export default function SecurityGuardDashboard() {
    const { user } = useAuth();
    const [emergencyModal, setEmergencyModal] = useState(false);
    const [visitorModal, setVisitorModal] = useState(false);

    return (
        <div className="space-y-6">
            {/* Hero Welcome Banner */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative isolate overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c1f38] via-[#091526] to-[#120f26] p-5 sm:p-7 lg:p-8"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/[0.12] blur-[90px]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-28 right-1/3 -z-10 h-64 w-64 rounded-full bg-blue-500/[0.10] blur-[90px]"
                />

                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="max-w-2xl">
                        <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                            <Shield size={14} className="text-cyan-300" />
                            Campus Security Command Station
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Officer On Duty:{" "}
                            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Campus Security Officer"}
                            </span>
                        </h1>

                        <p className="mt-2.5 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
                            Assigned to <span className="font-semibold text-slate-200">Main Campus Gate A</span> on <span className="font-semibold text-slate-200">Day Shift (08:00 - 16:00)</span>. Real-time visitor logs, perimeter monitoring, and emergency protocols are active.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2.5">
                            <Link
                                to="/security-guard/check-in"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition"
                            >
                                <ShieldCheck size={16} />
                                Student Check-In Station
                            </Link>

                            <button
                                type="button"
                                onClick={() => setVisitorModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
                            >
                                <UserPlus size={15} />
                                Quick Visitor Check-In
                            </button>

                            <button
                                type="button"
                                onClick={() => setEmergencyModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition"
                            >
                                <PhoneCall size={15} />
                                Emergency Protocols
                            </button>
                        </div>
                    </div>

                    {/* Duty Station Pill Box */}
                    <div className="grid grid-cols-2 gap-3 lg:w-[280px] lg:shrink-0">
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <DoorOpen className="mb-2 text-cyan-300" size={20} />
                            <p className="text-[11px] text-slate-400">Duty Post</p>
                            <p className="mt-0.5 text-xs font-semibold text-white">Main Gate A</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <Clock className="mb-2 text-emerald-300" size={20} />
                            <p className="text-[11px] text-slate-400">Shift Status</p>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <Radio className="mb-2 text-amber-300" size={20} />
                            <p className="text-[11px] text-slate-400">Patrol Radio</p>
                            <p className="mt-0.5 text-xs font-semibold text-white">Channel 4 (HQ)</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-md">
                            <ShieldCheck className="mb-2 text-violet-300" size={20} />
                            <p className="text-[11px] text-slate-400">Perimeter</p>
                            <p className="mt-0.5 text-xs font-semibold text-violet-300">100% Secure</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Officers on Duty</span>
                        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 p-2 text-cyan-300">
                            <Users size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-white">12</p>
                    <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Full Shift Manning
                    </p>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Active Gate Posts</span>
                        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-2 text-emerald-300">
                            <DoorOpen size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-white">4</p>
                    <p className="mt-1 text-[11px] text-slate-400">Gates A, B, North &amp; East</p>
                </div>

                <div className="rounded-2xl border border-blue-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Visitors Today</span>
                        <div className="rounded-xl border border-blue-400/25 bg-blue-400/10 p-2 text-blue-300">
                            <UserCheck size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-white">142</p>
                    <p className="mt-1 text-[11px] text-cyan-300">18 Currently on campus</p>
                </div>

                <div className="rounded-2xl border border-violet-400/20 bg-slate-900/60 p-4 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Vehicles Logged</span>
                        <div className="rounded-xl border border-violet-400/25 bg-violet-400/10 p-2 text-violet-300">
                            <Truck size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-white">89</p>
                    <p className="mt-1 text-[11px] text-slate-400">Staff &amp; Vendor passes verified</p>
                </div>
            </div>

            {/* Operational Tables: Visitors & Vehicles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Visitors */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-1.5 text-cyan-300">
                                <UserCheck size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Visitor Registry Log</h3>
                                <p className="text-[11px] text-slate-400">Today's campus entries</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setVisitorModal(true)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-white/10"
                        >
                            <Plus size={12} /> Log Visitor
                        </button>
                    </div>

                    <div className="space-y-2">
                        {mockVisitors.map((v) => (
                            <div
                                key={v.id}
                                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 hover:border-white/10 transition"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold text-white truncate">{v.name}</p>
                                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                                            {v.id}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        Host: {v.host} · {v.purpose}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span
                                        className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                            v.status === "INSIDE"
                                                ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                                : "border border-slate-600 bg-slate-800 text-slate-400"
                                        }`}
                                    >
                                        {v.status === "INSIDE" ? "On Campus" : "Checked Out"}
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-1">{v.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vehicle Log */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-1.5 text-violet-300">
                                <Car size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Vehicle Gate Entries</h3>
                                <p className="text-[11px] text-slate-400">License plate &amp; pass checks</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {mockVehicles.map((vh, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 hover:border-white/10 transition"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold text-cyan-300 font-mono tracking-wider truncate">
                                            {vh.plate}
                                        </p>
                                        <span className="rounded bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 text-[9px] text-violet-300 font-medium">
                                            {vh.type}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        {vh.model} · Driver: {vh.driver}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[11px] text-slate-300">{vh.gate}</span>
                                    <p className="text-[10px] text-slate-500 mt-1">{vh.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Action Protocols */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-3">Security Patrol &amp; Handover Protocol</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-400" /> Perimeter Inspection
                        </p>
                        <p className="text-[11px] text-slate-400">Last completed: 09:30 AM by Unit 2. All boundary fences intact.</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                            <Lock size={14} className="text-cyan-400" /> Lab &amp; Vault Night Locks
                        </p>
                        <p className="text-[11px] text-slate-400">All 14 academic laboratory biometric seals armed.</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                            <Radio size={14} className="text-violet-400" /> Evening Handover Prep
                        </p>
                        <p className="text-[11px] text-slate-400">Incoming shift: 16:00 PM. Officer Rajesh (SG-102) assigned.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
