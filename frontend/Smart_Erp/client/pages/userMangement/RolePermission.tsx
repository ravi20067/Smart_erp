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
    BookMarked,
    BookOpen,
    Building2,
    Calendar,
    CalendarRange,
    Check,
    CheckCircle2,
    CheckSquare,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ClipboardList,
    ContactRound,
    Eye,
    FileCheck,
    FileText,
    GraduationCap,
    KeyRound,
    Layers3,
    Library,
    LoaderCircle,
    Network,
    Pencil,
    Plus,
    Presentation,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Square,
    Target,
    Trash2,
    UserCheck,
    Users,
    X,
} from "lucide-react";

import {
    createRole,
    deleteRole,
    extractErrorMessage,
    getAllRoles,
    getRoleBasePermissions,
    getRoleEnums,
    getUniversityFilter,
    uniqueCommonDTOs,
    updateRole,
    updateRolePermissions,
    type CommonDTO,
    type Permission,
    type PermissionAction,
    type ResourceType,
    type RoleRequest,
    type RoleResponse,
    type UserRoleResponse,
    RESOURCE_TYPES,
} from "@/services/userMangement/rolePermissionService";

/* -------------------------------------------------------------------------- */
/* Constants & Types                                                          */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 6;

type DialogMode = "CREATE" | "EDIT" | "VIEW" | "DELETE" | "PERMISSIONS";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortOption =
    | "NEWEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "USERS_DESC"
    | "PERMS_DESC";

interface RoleFormState {
    universityId: number | "";
    name: string;
    description: string;
    userRole: string;
    active: boolean;
}

const EMPTY_FORM: RoleFormState = {
    universityId: "",
    name: "",
    description: "",
    userRole: "",
    active: true,
};

interface FormErrors {
    universityId?: string;
    name?: string;
    userRole?: string;
}

/* -------------------------------------------------------------------------- */
/* Resource Hierarchy Tree Types & Mapping                                    */
/* -------------------------------------------------------------------------- */

export interface ResourceNode {
    id: number;
    key: string;
    name: string;
    resourceType: ResourceType;
    icon: typeof Building2;
    iconColor: string;
    iconBg: string;
    level: number;
    parentId: string | null;
    childKeys: string[];
    // Permission IDs for each action on this node
    actionPermIds: Partial<Record<PermissionAction, number>>;
}

// Fixed hierarchy metadata matching user matrix screenshot
const RESOURCE_METADATA: Array<{
    key: string;
    resourceType: ResourceType;
    name: string;
    icon: typeof Building2;
    iconColor: string;
    iconBg: string;
    parentKey: string | null;
    defaultId: number;
}> = [
        {
            key: "UNIVERSITY",
            resourceType: "UNIVERSITY",
            name: "University",
            icon: Building2,
            iconColor: "text-cyan-400",
            iconBg: "bg-cyan-500/10 border-cyan-500/30",
            parentKey: null,
            defaultId: 0,
        },
        {
            key: "SCHOOL",
            resourceType: "SCHOOL",
            name: "School",
            icon: GraduationCap,
            iconColor: "text-fuchsia-400",
            iconBg: "bg-fuchsia-500/10 border-fuchsia-500/30",
            parentKey: "UNIVERSITY",
            defaultId: 0,
        },
        {
            key: "DEPARTMENT",
            resourceType: "DEPARTMENT",
            name: "Department",
            icon: Network,
            iconColor: "text-emerald-400",
            iconBg: "bg-emerald-500/10 border-emerald-500/30",
            parentKey: "SCHOOL",
            defaultId: 0,
        },
        {
            key: "ACADEMIC_YEAR",
            resourceType: "ACADEMIC_YEAR",
            name: "Academic Year",
            icon: CalendarRange,
            iconColor: "text-amber-400",
            iconBg: "bg-amber-500/10 border-amber-500/30",
            parentKey: "DEPARTMENT",
            defaultId: 0,
        },
        {
            key: "COURSE",
            resourceType: "COURSE",
            name: "Course",
            icon: BookOpen,
            iconColor: "text-sky-400",
            iconBg: "bg-sky-500/10 border-sky-500/30",
            parentKey: "ACADEMIC_YEAR",
            defaultId: 0,
        },
        {
            key: "SECTION",
            resourceType: "SECTION",
            name: "Section",
            icon: Presentation,
            iconColor: "text-purple-400",
            iconBg: "bg-purple-500/10 border-purple-500/30",
            parentKey: "COURSE",
            defaultId: 0,
        },
        {
            key: "SUBJECT",
            resourceType: "SUBJECT",
            name: "Subject",
            icon: FileText,
            iconColor: "text-rose-400",
            iconBg: "bg-rose-500/10 border-rose-500/30",
            parentKey: "COURSE",
            defaultId: 0,
        },
        {
            key: "STUDENT",
            resourceType: "STUDENT_ENROLLMENT",
            name: "Student",
            icon: GraduationCap,
            iconColor: "text-emerald-400",
            iconBg: "bg-emerald-500/10 border-emerald-500/30",
            parentKey: "SECTION_GROUP",
            defaultId: 0,
        },
        {
            key: "USER",
            resourceType: "USER",
            name: "User",
            icon: Users,
            iconColor: "text-pink-400",
            iconBg: "bg-pink-500/10 border-pink-500/30",
            parentKey: "UNIVERSITY",
            defaultId: 0,
        },
        {
            key: "STAFF",
            resourceType: "STAFF",
            name: "Staff",
            icon: ContactRound,
            iconColor: "text-orange-400",
            iconBg: "bg-orange-500/10 border-orange-500/30",
            parentKey: "SCHOOL",
            defaultId: 0,
        },
        {
            key: "ROLE",
            resourceType: "ROLE",
            name: "Roles & Permissions",
            icon: ShieldCheck,
            iconColor: "text-purple-400",
            iconBg: "bg-purple-500/10 border-purple-500/30",
            parentKey: "UNIVERSITY",
            defaultId: 0,
        },
        {
            key: "ROOM", resourceType: "ROOM", name: "Room", icon: Building2,
            iconColor: "text-cyan-400", iconBg: "bg-cyan-500/10 border-cyan-500/30",
            parentKey: "SCHOOL", defaultId: 0,
        },
        {
            key: "SECTION_GROUP", resourceType: "SECTION_GROUP", name: "Section Group", icon: Layers3,
            iconColor: "text-violet-400", iconBg: "bg-violet-500/10 border-violet-500/30",
            parentKey: "SECTION", defaultId: 0,
        },
        {
            key: "TIMETABLE", resourceType: "TIMETABLE", name: "Timetable", icon: Calendar,
            iconColor: "text-amber-400", iconBg: "bg-amber-500/10 border-amber-500/30",
            parentKey: "SECTION_GROUP", defaultId: 0,
        },
        {
            key: "TEACHER_ENROLLMENT", resourceType: "TEACHER_ENROLLMENT", name: "Teacher Enrollment", icon: UserCheck,
            iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10 border-emerald-500/30",
            parentKey: "SUBJECT", defaultId: 0,
        },
        {
            key: "SPECIALIZATION", resourceType: "SPECIALIZATION", name: "Specialization", icon: Layers3,
            iconColor: "text-purple-400", iconBg: "bg-purple-500/10 border-purple-500/30",
            parentKey: "COURSE", defaultId: 0,
        },
    ];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function numberLabel(value: number | null | undefined): string {
    return typeof value === "number" && Number.isFinite(value)
        ? new Intl.NumberFormat("en-IN").format(value)
        : "0";
}

function hasPermission(
    role: RoleResponse,
    action: PermissionAction
): boolean {
    // Fail closed: an empty action list means the API has not granted an action.
    return Array.isArray(role.permissionActions) && role.permissionActions.includes(action);
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

function SelectChevron() {
    return (
        <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${active
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

function ErrorBanner({
    title,
    message,
    onRetry,
    onDismiss,
}: {
    title: string;
    message: string;
    onRetry?: () => void;
    onDismiss: () => void;
}) {
    return (
        <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
            <div className="flex min-w-0 items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                <div className="min-w-0">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 break-words text-xs sm:text-sm">{message}</p>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss error"
                className="shrink-0 text-slate-400 transition hover:text-white"
            >
                <X size={17} />
            </button>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Hierarchical Resource Tree Builder                                         */
/* -------------------------------------------------------------------------- */

function buildResourceTree(basePermissions: Permission[]): {
    nodes: ResourceNode[];
    ancestorMap: Map<string, string[]>;
    descendantMap: Map<string, string[]>;
} {
    const metadataByType = new Map(RESOURCE_METADATA.map((item) => [item.resourceType, item]));
    const nodeMap = new Map<string, ResourceNode>();
    const parentCandidates = new Map<string, Set<string>>();

    const keyFor = (permission: Permission) => {
        const resourceId = Number(permission.resourceId);
        return Number.isSafeInteger(resourceId) && resourceId > 0
            ? `${permission.resourceType}:${resourceId}`
            : `${permission.resourceType}:BASE`;
    };

    const ensureNode = (permission: Permission): ResourceNode => {
        const key = keyFor(permission);
        const existing = nodeMap.get(key);
        if (existing) return existing;
        const meta = metadataByType.get(permission.resourceType);
        const node: ResourceNode = {
            id: Number(permission.resourceId) > 0 ? Number(permission.resourceId) : 0,
            key,
            name: meta?.name ?? String(permission.resourceType).replace(/_/g, " "),
            resourceType: permission.resourceType,
            icon: meta?.icon ?? Building2,
            iconColor: meta?.iconColor ?? "text-cyan-400",
            iconBg: meta?.iconBg ?? "bg-cyan-500/10 border-cyan-500/30",
            level: 0,
            parentId: null,
            childKeys: [],
            actionPermIds: {},
        };
        nodeMap.set(key, node);
        return node;
    };

    // Group action permission records by actual resource type + resourceId.
    // The permission database ID is only used for the checkbox/save payload.
    const visitedPath = new Set<Permission>();
    const walk = (permissions: Permission[], ancestorResourceKey: string | null = null) => {
        for (const permission of permissions) {
            if (!permission || typeof permission !== "object" || visitedPath.has(permission)) continue;
            visitedPath.add(permission);
            const node = ensureNode(permission);
            const action = String(permission.action).toUpperCase() as PermissionAction;
            if (["READ", "UPDATE", "DELETE", "CREATE_CHILD"].includes(action) && permission.id > 0) {
                // Prefer the first valid ID for a unique type/resource/action tuple;
                // diagnostics below expose duplicate IDs/rows from the API.
                if (!node.actionPermIds[action]) node.actionPermIds[action] = permission.id;
            }
            if (ancestorResourceKey && ancestorResourceKey !== node.key) {
                const parents = parentCandidates.get(node.key) ?? new Set<string>();
                parents.add(ancestorResourceKey);
                parentCandidates.set(node.key, parents);
            }
            const nextAncestor = node.key;
            if (Array.isArray(permission.children) && permission.children.length) {
                walk(permission.children, nextAncestor);
            }
        }
    };
    walk(Array.isArray(basePermissions) ? basePermissions : []);

    // A resource can appear under multiple action branches. Only use an unambiguous
    // parent relationship; never silently choose one parent when the API conflicts.
    for (const [key, candidates] of parentCandidates) {
        if (candidates.size !== 1) continue;
        const parentKey = Array.from(candidates)[0];
        const node = nodeMap.get(key);
        const parent = nodeMap.get(parentKey);
        if (node && parent && node.key !== parent.key) {
            node.parentId = parent.key;
            if (!parent.childKeys.includes(node.key)) parent.childKeys.push(node.key);
        }
    }

    const computeLevel = (key: string, trail = new Set<string>()): number => {
        const node = nodeMap.get(key);
        if (!node?.parentId || !nodeMap.has(node.parentId) || trail.has(key)) return 0;
        const nextTrail = new Set(trail);
        nextTrail.add(key);
        return 1 + computeLevel(node.parentId, nextTrail);
    };
    for (const node of nodeMap.values()) node.level = computeLevel(node.key);

    const ancestorMap = new Map<string, string[]>();
    const descendantMap = new Map<string, string[]>();
    for (const node of nodeMap.values()) {
        const ancestors: string[] = [];
        let current = node.parentId;
        const seen = new Set<string>([node.key]);
        while (current && nodeMap.has(current) && !seen.has(current)) {
            seen.add(current);
            ancestors.push(current);
            current = nodeMap.get(current)!.parentId;
        }
        ancestorMap.set(node.key, ancestors);
        const descendants: string[] = [];
        const collect = (currentKey: string, seen = new Set<string>()) => {
            if (seen.has(currentKey)) return;
            seen.add(currentKey);
            const currentNode = nodeMap.get(currentKey);
            if (!currentNode) return;
            for (const childKey of currentNode.childKeys) {
                if (!descendants.includes(childKey)) descendants.push(childKey);
                collect(childKey, seen);
            }
        };
        collect(node.key);
        descendantMap.set(node.key, descendants);
    }
    return { nodes: Array.from(nodeMap.values()), ancestorMap, descendantMap };
}

/* -------------------------------------------------------------------------- */
/* Base permission hierarchy analysis                                         */
/* -------------------------------------------------------------------------- */
function BasePermissionAnalysisDialog({ permissions, onClose }: { permissions: Permission[]; onClose: () => void }) {
    const report = useMemo(() => {
        const rows: Array<{ id: number; type: string; action: string; resourceId?: number; depth: number; path: string; parentType: string; parentResourceId?: number }> = [];
        const idCounts = new Map<number, number>();
        const walk = (items: Permission[], depth: number, path: string, parentType = "", parentResourceId?: number) => {
            items.forEach((p) => {
                const type = String(p.resourceType ?? "UNKNOWN");
                const resourceId = Number(p.resourceId) > 0 ? Number(p.resourceId) : undefined;
                rows.push({ id: Number(p.id) || 0, type, action: String(p.action ?? "UNKNOWN"), resourceId, depth, path: path ? `${path} / ${type}` : type, parentType, parentResourceId });
                if (Number(p.id) > 0) idCounts.set(Number(p.id), (idCounts.get(Number(p.id)) ?? 0) + 1);
                if (Array.isArray(p.children)) walk(p.children, depth + 1, path ? `${path} / ${type}` : type, type, resourceId);
            });
        };
        walk(permissions, 0, "");
        const types = Array.from(new Set(rows.map((r) => r.type))).sort();
        const actions = Array.from(new Set(rows.map((r) => r.action))).sort();
        const missingIds = rows.filter((r) => !Number.isSafeInteger(r.id) || r.id <= 0).length;
        const missingResourceIds = rows.filter((r) => !r.resourceId).length;
        const unknownTypes = types.filter((type) => !RESOURCE_TYPES.includes(type as ResourceType));
        const missingBackendTypes = RESOURCE_TYPES.filter((type) => !types.includes(type));
        const duplicateIds = Array.from(idCounts.values()).filter((count) => count > 1).length;
        return { rows, types, actions, missingIds, missingResourceIds, unknownTypes, missingBackendTypes, duplicateIds };
    }, [permissions]);

    const statCards = [
        { label: "Permission definitions", value: report.rows.length, icon: KeyRound, tone: "text-cyan-300 border-cyan-400/20 bg-cyan-500/10" },
        { label: "Resource types found", value: report.types.length, icon: Network, tone: "text-violet-300 border-violet-400/20 bg-violet-500/10" },
        { label: "Actions found", value: report.actions.length, icon: ShieldCheck, tone: "text-emerald-300 border-emerald-400/20 bg-emerald-500/10" },
        { label: "Data warnings", value: report.missingIds + report.missingResourceIds + report.duplicateIds, icon: AlertTriangle, tone: "text-amber-300 border-amber-400/20 bg-amber-500/10" },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
            <button type="button" aria-label="Close hierarchy analysis" onClick={onClose} className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
            <section role="dialog" aria-modal="true" aria-labelledby="base-hierarchy-title" className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-violet-950/40 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-violet-300"><Network size={22} /></div>
                        <div>
                            <h2 id="base-hierarchy-title" className="text-xl font-bold text-white">Base Permission Hierarchy</h2>
                            <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-400">Explore the real permission definitions returned by the backend. Each row distinguishes the permission record ID from the resource record ID.</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">Permission ID = permissions table</span>
                                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-sky-200">Resource ID = target record</span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close"><X size={18} /></button>
                </header>
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
                    {statCards.map((item) => {
                        const Icon = item.icon;
                        return <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/50 p-3.5">
                            <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-400">{item.label}</p><span className={`rounded-lg border p-1.5 ${item.tone}`}><Icon size={15} /></span></div>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-white">{item.value}</p>
                        </div>;
                    })}
                </div>
                <div className="min-h-0 flex-1 overflow-auto px-4 pb-5 sm:px-5">
                    <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                        <div className="flex items-start gap-2"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-300" /><div><p className="text-sm font-semibold text-amber-100">Hierarchy and data-quality checks</p><p className="mt-1 text-xs leading-5 text-amber-100/75">The nested tree below shows the parent-child relationships present in the API response. Resource type relationships declared in the Java enum are expected structure, but are not a substitute for actual record IDs.</p></div></div>
                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                            <p className="rounded-lg bg-slate-950/40 p-2.5 text-slate-300">{report.missingResourceIds} permission definitions have no positive resource ID.</p>
                            <p className="rounded-lg bg-slate-950/40 p-2.5 text-slate-300">{report.duplicateIds} permission IDs are duplicated in the response tree.</p>
                            <p className="rounded-lg bg-slate-950/40 p-2.5 text-slate-300">{report.unknownTypes.length ? `Unknown resource types: ${report.unknownTypes.join(", ")}` : "All returned resource types match the backend enum."}</p>
                            <p className="rounded-lg bg-slate-950/40 p-2.5 text-slate-300">{report.missingBackendTypes.length ? `Types not present in response: ${report.missingBackendTypes.join(", ")}` : "Every backend resource type appears in the response."}</p>
                        </div>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold text-white">Permission records</h3><p className="mt-1 text-xs text-slate-400">Parent labels follow the returned JSON tree, not a guessed database relationship.</p></div><span className="rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-400">{report.rows.length} rows</span></div>
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full min-w-[920px] text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">Resource / hierarchy path</th><th className="px-4 py-3">Parent resource</th><th className="px-4 py-3">Resource ID</th><th className="px-4 py-3">Permission ID</th><th className="px-4 py-3">Action</th></tr></thead>
                            <tbody className="divide-y divide-white/5">{report.rows.map((row, i) => <tr key={`${row.id}-${row.type}-${row.action}-${i}`} className="transition hover:bg-white/[0.03]">
                                <td className="px-4 py-3"><div className="flex items-start gap-2" style={{ paddingLeft: `${Math.min(row.depth, 5) * 10}px` }}><span className="mt-0.5 text-slate-600">{row.depth ? "└─" : "●"}</span><div><p className="font-medium text-slate-100">{row.type.replace(/_/g, " ")}</p><p className="mt-0.5 max-w-[340px] truncate text-[11px] text-slate-500" title={row.path}>{row.path.replace(/_/g, " ")}</p></div></div></td>
                                <td className="px-4 py-3 text-xs text-slate-300">{row.parentType ? <><span className="block">{row.parentType.replace(/_/g, " ")}</span><span className="mt-0.5 block text-slate-500">Resource ID: {row.parentResourceId ?? "Not provided"}</span></> : <span className="text-slate-500">Root / not provided</span>}</td>
                                <td className="px-4 py-3"><span className="rounded-md border border-sky-400/15 bg-sky-500/[0.07] px-2 py-1 font-mono text-xs text-sky-200">{row.resourceId ?? "Not provided"}</span></td>
                                <td className="px-4 py-3"><span className={`rounded-md border px-2 py-1 font-mono text-xs ${row.id > 0 ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}`}>{row.id > 0 ? row.id : "Invalid"}</span></td>
                                <td className="px-4 py-3"><span className="inline-flex rounded-md border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{row.action.replace(/_/g, " ")}</span></td>
                            </tr>)}</tbody>
                        </table>
                        {report.rows.length === 0 && <div className="p-10 text-center"><Network className="mx-auto text-slate-600" size={28} /><p className="mt-3 font-medium text-slate-300">No base permissions returned</p><p className="mt-1 text-xs text-slate-500">Check the base-permissions API response and try refreshing.</p></div>}
                    </div>
                    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4"><p className="text-sm font-semibold text-slate-200">What the IDs mean</p><div className="mt-2 grid gap-3 text-xs leading-5 sm:grid-cols-3"><p className="text-slate-400"><strong className="text-cyan-200">Permission ID</strong><br />The database ID sent to the existing role-permission update endpoint.</p><p className="text-slate-400"><strong className="text-sky-200">Resource ID</strong><br />The specific University, School, Course, Student, or other target record this permission concerns.</p><p className="text-slate-400"><strong className="text-violet-200">Resource type</strong><br />The kind of record, such as SCHOOL or COURSE. It is not a record ID.</p></div></div>
                </div>
                <footer className="flex justify-end border-t border-white/10 bg-slate-900/95 p-4"><button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Close analysis</button></footer>
            </section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Hierarchical Permission Matrix Modal Component                             */
/* -------------------------------------------------------------------------- */

interface PermissionMatrixDialogProps {
    role: RoleResponse;
    allPermissions: Permission[];
    busy: boolean;
    onClose: () => void;
    onSave: (roleId: number, permissionIds: number[]) => Promise<void>;
}

function PermissionMatrixDialog({
    role,
    allPermissions,
    busy,
    onClose,
    onSave,
}: PermissionMatrixDialogProps) {
    const { nodes, ancestorMap, descendantMap } = useMemo(
        () => buildResourceTree(allPermissions),
        [allPermissions]
    );

    // Track collapsed resource rows
    const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());


    /**
     * Active state: map from `${resourceKey}_${action}` to boolean (true = allowed)
     * Initialized from role.permissions.
     * RULE: If a parent permission is present in role.permissions, then both parent
     * and all its children in that branch are initialized as checked (true)!
     */
    const [allowedState, setAllowedState] = useState<Record<string, boolean>>(() => {
        const state: Record<string, boolean> = {};

        // Extract permission IDs assigned to the role
        const rolePermIds = new Set<number>();
        // RoleResponse.permissions contains RolePermissionResponse wrappers normalized to
        // Permission plus assignmentActive. Only active direct assignments grant checked state.
        for (const permission of Array.isArray(role.permissions) ? role.permissions : []) {
            if (permission.assignmentActive === true && Number.isSafeInteger(permission.id) && permission.id > 0) {
                rolePermIds.add(permission.id);
            }
        }

        // Check if node has its action permission in role
        nodes.forEach((node) => {
            for (const action of ["READ", "UPDATE", "DELETE", "CREATE_CHILD"] as PermissionAction[]) {
                const pId = node.actionPermIds[action];
                if (pId && rolePermIds.has(pId)) {
                    state[`${node.key}_${action}`] = true;
                }
            }
        });

        // Cascade parent allowed status to all descendants
        nodes.forEach((node) => {
            for (const action of ["READ", "UPDATE", "DELETE", "CREATE_CHILD"] as PermissionAction[]) {
                if (state[`${node.key}_${action}`]) {
                    const desc = descendantMap.get(node.key) || [];
                    desc.forEach((dKey) => {
                        state[`${dKey}_${action}`] = true;
                    });
                }
            }
        });

        return state;
    });

    const [dialogError, setDialogError] = useState("");

    const toggleCollapse = (key: string) => {
        setCollapsedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    /**
     * RULE IMPLEMENTATION:
     * "if parent is allowed then its children is also allowed if user click the
     * permission allowed then backend goes only parent it in frontend its cilren
     * will also checkbox will true"
     */
    const handleToggleCell = (nodeKey: string, action: PermissionAction) => {
        const cellKey = `${nodeKey}_${action}`;
        const isCurrentlyAllowed = Boolean(allowedState[cellKey]);
        const nextAllowed = !isCurrentlyAllowed;

        setAllowedState((prev) => {
            const next = { ...prev };
            next[cellKey] = nextAllowed;

            const descendants = descendantMap.get(nodeKey) || [];

            if (nextAllowed) {
                // When parent is allowed, all descendants automatically become allowed!
                descendants.forEach((dKey) => {
                    next[`${dKey}_${action}`] = true;
                });
            } else {
                // When unchecked, uncheck this node and its descendants
                descendants.forEach((dKey) => {
                    next[`${dKey}_${action}`] = false;
                });
                // Also if an ancestor was allowed, uncheck ancestors so this node can stay unchecked
                const ancestors = ancestorMap.get(nodeKey) || [];
                ancestors.forEach((aKey) => {
                    next[`${aKey}_${action}`] = false;
                });
            }

            return next;
        });
    };

    /**
     * Compute payload to send to backend:
     * PRUNING RULE:
     * "only go the if parent id is send did not send the child id"
     * For every active permission, if any ancestor of this node is also active
     * for the same action, WE OMIT THE CHILD ID!
     * Only the highest active parent in each branch is sent to backend.
     */
    const handleSaveMatrix = async () => {
        setDialogError("");
        const selectedPermissionIds = new Set<number>();

        for (const node of nodes) {
            for (const action of ["READ", "UPDATE", "DELETE", "CREATE_CHILD"] as PermissionAction[]) {
                const cellKey = `${node.key}_${action}`;
                if (!allowedState[cellKey]) continue;

                // Check if any ancestor is also active for this action
                const ancestors = ancestorMap.get(node.key) || [];
                const hasActiveAncestor = ancestors.some(
                    (aKey) => allowedState[`${aKey}_${action}`]
                );

                // If parent/ancestor is already sent, DO NOT send the child id!
                if (!hasActiveAncestor) {
                    const pId = node.actionPermIds[action];
                    if (pId) {
                        selectedPermissionIds.add(pId);
                    }
                }
            }
        }

        try {
            await onSave(role.id, Array.from(selectedPermissionIds));
        } catch (err) {
            setDialogError(extractErrorMessage(err));
        }
    };

    // Filter visible nodes based on collapse state of ancestors
    const visibleNodes = useMemo(() => {
        return nodes.filter((node) => {
            const ancestors = ancestorMap.get(node.key) || [];
            return !ancestors.some((aKey) => collapsedKeys.has(aKey));
        });
    }, [nodes, ancestorMap, collapsedKeys]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-2 sm:p-3 md:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !busy && onClose()}
                className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex h-[92dvh] max-h-[92dvh] w-[96vw] max-w-[1440px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            >
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-3 py-3 backdrop-blur-md sm:px-5 sm:py-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="shrink-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 p-2.5 text-cyan-400 border border-cyan-500/20">
                            <KeyRound size={22} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="break-words text-base font-bold text-white sm:text-lg">
                                    Resource Hierarchy & Permission Matrix
                                </h2>
                                <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                                    {role.name}
                                </span>
                            </div>
                            <p className="mt-1 break-words text-[11px] leading-4 text-slate-400 sm:text-xs">
                                University:{" "}
                                <span className="text-white font-medium">
                                    {role.university?.name || "Global / Institution"}
                                </span>{" "}
                                • Check each action for this resource. Inherited access depends on backend authorization rules.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {dialogError && (
                    <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                        <span>{dialogError}</span>
                    </div>
                )}

                {/* Compact legend: explain IDs before users interact with the matrix */}
                <div className="grid shrink-0 gap-2 border-b border-white/5 bg-slate-950/30 px-3 py-3 sm:grid-cols-3 sm:px-5">
                    <div className="flex items-start gap-2 rounded-lg border border-sky-400/10 bg-sky-500/[0.04] p-2.5"><span className="mt-0.5 rounded border border-sky-400/20 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-200">Resource ID</span><p className="text-[11px] leading-4 text-slate-400">The real record being controlled, for example a specific School or Course.</p></div>
                    <div className="flex items-start gap-2 rounded-lg border border-cyan-400/10 bg-cyan-500/[0.04] p-2.5"><span className="mt-0.5 rounded border border-cyan-400/20 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200">Permission ID</span><p className="text-[11px] leading-4 text-slate-400">Hover an action checkbox to see the permission-definition ID submitted to the API.</p></div>
                    <div className="flex items-start gap-2 rounded-lg border border-violet-400/10 bg-violet-500/[0.04] p-2.5"><span className="mt-0.5 rounded border border-violet-400/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-200">Parent</span><p className="text-[11px] leading-4 text-slate-400">Shown under each resource name. The tree follows relationships available in the permission response.</p></div>
                </div>
                {/* Permission matrix */}
                <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain p-2 sm:p-4">
                    <div className="w-full min-w-[980px] rounded-2xl border border-white/10 bg-slate-950/60 shadow-xl">
                        <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm text-slate-300">
                            {/* Table Header */}
                            <thead className="border-b border-white/10 bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th scope="col" className="w-[34%] px-4 py-4">
                                        <span className="block">Resource hierarchy</span>
                                        <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-slate-500">Name, type and parent record</span>
                                    </th>
                                    <th scope="col" className="w-24 px-3 py-4 text-center">
                                        <span className="block">Resource ID</span>
                                        <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-slate-500">Target record</span>
                                    </th>
                                    <th scope="col" className="w-20 px-2 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 text-emerald-400">
                                            <Eye size={14} />
                                            <span>READ</span>
                                        </div>
                                    </th>
                                    <th scope="col" className="w-20 px-2 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 text-sky-400">
                                            <Pencil size={14} />
                                            <span>UPDATE</span>
                                        </div>
                                    </th>
                                    <th scope="col" className="w-20 px-2 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 text-rose-400">
                                            <Trash2 size={14} />
                                            <span>DELETE</span>
                                        </div>
                                    </th>
                                    <th scope="col" className="w-28 px-2 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 text-purple-400">
                                            <Plus size={14} />
                                            <span>CREATE_CHILD</span>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-4 py-4 min-w-[190px]">
                                        <span className="block">Assignment details</span>
                                        <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-slate-500">Status and assigned by</span>
                                    </th>
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y divide-white/5">
                                {visibleNodes.map((node) => {
                                    const Icon = node.icon;
                                    const hasChildren = node.childKeys.length > 0;
                                    const isCollapsed = collapsedKeys.has(node.key);

                                    return (
                                        <tr
                                            key={node.key}
                                            className="group transition-colors hover:bg-white/[0.02]"
                                        >
                                            {/* Resource (Hierarchy) Column */}
                                            <td className="px-5 py-3.5">
                                                <div
                                                    className="flex items-center gap-2"
                                                    style={{ paddingLeft: `${Math.min(node.level, 4) * 12}px` }}
                                                >
                                                    {/* Tree guide connector lines for nested children */}
                                                    {node.level > 0 && (
                                                        <span className="text-slate-600 font-mono text-sm mr-1 select-none">
                                                            └──
                                                        </span>
                                                    )}

                                                    {/* Expand / Collapse toggle */}
                                                    {hasChildren ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCollapse(node.key)}
                                                            className="flex h-5 w-5 items-center justify-center rounded border border-white/10 bg-slate-800/80 text-slate-400 hover:text-white transition"
                                                        >
                                                            <ChevronDown
                                                                size={13}
                                                                className={`transform transition-transform duration-150 ${isCollapsed ? "-rotate-90" : "rotate-0"
                                                                    }`}
                                                            />
                                                        </button>
                                                    ) : (
                                                        <span className="w-5" />
                                                    )}

                                                    {/* Icon */}
                                                    <div
                                                        className={`flex h-7 w-7 items-center justify-center rounded-lg border ${node.iconBg} ${node.iconColor} shrink-0`}
                                                    >
                                                        <Icon size={15} />
                                                    </div>

                                                    {/* Resource identity and relationship context */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="break-words font-semibold tracking-wide text-white">{node.name}</span>
                                                            <span className="rounded-md border border-white/10 bg-slate-800/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{String(node.resourceType).replace(/_/g, " ")}</span>
                                                        </div>
                                                        <p className="mt-1 max-w-full truncate text-[11px] text-slate-500" title={node.parentId ? `Parent: ${nodes.find((candidate) => candidate.key === node.parentId)?.name ?? node.parentId} · ${node.parentId}` : "Root resource or parent not supplied by API"}>
                                                            {node.parentId ? <>Parent: <span className="text-slate-400">{nodes.find((candidate) => candidate.key === node.parentId)?.name ?? "Unknown"}</span> <span className="text-slate-600">({nodes.find((candidate) => candidate.key === node.parentId)?.id || "ID unavailable"})</span></> : <span className="text-slate-600">Root resource / parent not supplied</span>}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-slate-600">Permission IDs are shown by action on hover.</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Actual target resource record ID; never confuse with permission-definition IDs */}
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${node.id > 0 ? "border-sky-400/20 bg-sky-500/10 text-sky-200" : "border-amber-400/20 bg-amber-500/10 text-amber-200"}`} title="Resource record ID from the base-permission response">
                                                    {node.id > 0 ? node.id : "Not provided"}
                                                </span>
                                                <span className="mt-1 block text-[10px] text-slate-600">Resource record</span>
                                            </td>

                                            {/* READ Action Checkbox */}
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCell(node.key, "READ")}
                                                    disabled={!node.actionPermIds.READ}
                                                    aria-pressed={Boolean(allowedState[`${node.key}_READ`])}
                                                    aria-label={`${node.name} ${node.id || "base"} READ`}
                                                    title={node.actionPermIds.READ ? `Permission ID: ${node.actionPermIds.READ} · Resource: ${node.resourceType} · Resource ID: ${node.id || "not provided"} · Action: READ` : "No matching READ permission ID was returned by the backend."}
                                                    className={`inline-flex h-5 w-5 items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${allowedState[`${node.key}_READ`]
                                                        ? "border-sky-400 bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/30"
                                                        : "border-slate-700 bg-slate-900 hover:border-slate-500"
                                                        }`}
                                                >
                                                    {allowedState[`${node.key}_READ`] && (
                                                        <Check size={13} strokeWidth={3} />
                                                    )}
                                                </button>
                                            </td>

                                            {/* UPDATE Action Checkbox */}
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCell(node.key, "UPDATE")}
                                                    disabled={!node.actionPermIds.UPDATE}
                                                    aria-pressed={Boolean(allowedState[`${node.key}_UPDATE`])}
                                                    aria-label={`${node.name} ${node.id || "base"} UPDATE`}
                                                    title={node.actionPermIds.UPDATE ? `Permission ID: ${node.actionPermIds.UPDATE} · Resource: ${node.resourceType} · Resource ID: ${node.id || "not provided"} · Action: UPDATE` : "No matching UPDATE permission ID was returned by the backend."}
                                                    className={`inline-flex h-5 w-5 items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${allowedState[`${node.key}_UPDATE`]
                                                        ? "border-sky-400 bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/30"
                                                        : "border-slate-700 bg-slate-900 hover:border-slate-500"
                                                        }`}
                                                >
                                                    {allowedState[`${node.key}_UPDATE`] && (
                                                        <Check size={13} strokeWidth={3} />
                                                    )}
                                                </button>
                                            </td>

                                            {/* DELETE Action Checkbox */}
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCell(node.key, "DELETE")}
                                                    disabled={!node.actionPermIds.DELETE}
                                                    aria-pressed={Boolean(allowedState[`${node.key}_DELETE`])}
                                                    aria-label={`${node.name} ${node.id || "base"} DELETE`}
                                                    title={node.actionPermIds.DELETE ? `Permission ID: ${node.actionPermIds.DELETE} · Resource: ${node.resourceType} · Resource ID: ${node.id || "not provided"} · Action: DELETE` : "No matching DELETE permission ID was returned by the backend."}
                                                    className={`inline-flex h-5 w-5 items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${allowedState[`${node.key}_DELETE`]
                                                        ? "border-sky-400 bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/30"
                                                        : "border-slate-700 bg-slate-900 hover:border-slate-500"
                                                        }`}
                                                >
                                                    {allowedState[`${node.key}_DELETE`] && (
                                                        <Check size={13} strokeWidth={3} />
                                                    )}
                                                </button>
                                            </td>

                                            {/* CREATE_CHILD Action Checkbox */}
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCell(node.key, "CREATE_CHILD")}
                                                    disabled={!node.actionPermIds.CREATE_CHILD}
                                                    aria-pressed={Boolean(allowedState[`${node.key}_CREATE_CHILD`])}
                                                    aria-label={`${node.name} ${node.id || "base"} CREATE_CHILD`}
                                                    title={node.actionPermIds.CREATE_CHILD ? `Permission ID: ${node.actionPermIds.CREATE_CHILD} · Resource: ${node.resourceType} · Resource ID: ${node.id || "not provided"} · Action: CREATE_CHILD` : "No matching CREATE_CHILD permission ID was returned by the backend."}
                                                    className={`inline-flex h-5 w-5 items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${allowedState[`${node.key}_CREATE_CHILD`]
                                                        ? "border-sky-400 bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/30"
                                                        : "border-slate-700 bg-slate-900 hover:border-slate-500"
                                                        }`}
                                                >
                                                    {allowedState[`${node.key}_CREATE_CHILD`] && (
                                                        <Check size={13} strokeWidth={3} />
                                                    )}
                                                </button>
                                            </td>

                                            {/* Assignment status and assignedBy metadata from RolePermissionResponse */}
                                            <td className="px-3 py-3.5">
                                                {(() => {
                                                    const assignments = (role.permissions ?? []).filter((assigned) =>
                                                        assigned.id > 0 &&
                                                        Object.values(node.actionPermIds).includes(assigned.id)
                                                    );
                                                    const activeAssignments = assignments.filter((assigned) => assigned.assignmentActive === true);
                                                    const inactiveAssignments = assignments.filter((assigned) => assigned.assignmentActive === false);
                                                    if (assignments.length === 0) {
                                                        return <span className="text-xs text-slate-500">Not assigned</span>;
                                                    }
                                                    return (
                                                        <div className="flex min-w-0 flex-col gap-1.5">
                                                            {activeAssignments.length > 0 && (
                                                                <span className="inline-flex w-fit items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                                                                    <CheckCircle2 size={11} /> Active assignment
                                                                </span>
                                                            )}
                                                            {inactiveAssignments.length > 0 && (
                                                                <span className="inline-flex w-fit items-center gap-1 rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
                                                                    <AlertCircle size={11} /> Inactive assignment
                                                                </span>
                                                            )}
                                                            {Array.from(new Map(assignments.filter((a) => a.assignedBy).map((a) => [a.assignedBy!.id, a.assignedBy!])).values()).map((person) => (
                                                                <span key={person.id} className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-300" title={`Assigned by ${person.name}${person.code ? ` (${person.code})` : ""}`}>
                                                                    <Users size={11} className="shrink-0 text-cyan-400" />
                                                                    <span className="truncate">{person.name}</span>
                                                                    {person.code && <span className="truncate text-slate-500">· {person.code}</span>}
                                                                </span>
                                                            ))}
                                                            {assignments.every((a) => !a.assignedBy) && (
                                                                <span className="text-[10px] text-slate-500">Assigner not provided</span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 bg-slate-900/95 px-3 py-3 backdrop-blur-md sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
                    <p className="min-w-0 flex-1 text-[11px] leading-4 text-slate-400 sm:text-xs">
                        Checkboxes configure action permissions. The assignment column shows active status and the user who assigned each permission when returned by the backend.
                    </p>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveMatrix}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition disabled:opacity-50"
                        >
                            {busy && <LoaderCircle size={15} className="animate-spin" />}
                            Apply & Save Hierarchy
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Role Dialog (Create / Edit / View / Delete)                                */
/* -------------------------------------------------------------------------- */

interface RoleDialogProps {
    mode: "CREATE" | "EDIT" | "VIEW" | "DELETE";
    role: RoleResponse | null;
    universities: CommonDTO[];
    roleEnums: UserRoleResponse[];
    busy: boolean;
    onClose: () => void;
    onCreate: (universityId: number, request: RoleRequest) => Promise<void>;
    onUpdate: (roleId: number, request: RoleRequest) => Promise<void>;
    onDelete: (roleId: number) => Promise<void>;
    onOpenPermissions: (role: RoleResponse) => void;
}

function RoleDialog({
    mode,
    role,
    universities,
    roleEnums,
    busy,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
    onOpenPermissions,
}: RoleDialogProps) {
    const isCreate = mode === "CREATE";
    const isEdit = mode === "EDIT";
    const isView = mode === "VIEW";
    const isDelete = mode === "DELETE";

    const [form, setForm] = useState<RoleFormState>(() => ({
        universityId: role?.university?.id ?? (universities[0]?.id || ""),
        name: role?.name ?? "",
        description: role?.description ?? "",
        userRole: role?.userRole?.enumValue ?? "",
        active: role ? role.active : true,
    }));

    const [dynamicEnums, setDynamicEnums] = useState<UserRoleResponse[]>(roleEnums);
    const [enumsLoading, setEnumsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [dialogError, setDialogError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchEnums(uId: number) {
            setEnumsLoading(true);
            try {
                const enums = await getRoleEnums(uId);
                if (!cancelled && enums.length > 0) {
                    setDynamicEnums(enums);
                }
            } catch {
                // Keep default roleEnums on error
            } finally {
                if (!cancelled) setEnumsLoading(false);
            }
        }

        if (isCreate && form.universityId && Number(form.universityId) > 0) {
            void fetchEnums(Number(form.universityId));
        } else if (roleEnums.length > 0) {
            setDynamicEnums(roleEnums);
        }

        return () => {
            cancelled = true;
        };
    }, [isCreate, form.universityId, roleEnums]);

    const activeEnums = dynamicEnums.length > 0 ? dynamicEnums : roleEnums;

    const validate = (): boolean => {
        const errors: FormErrors = {};

        if (isCreate) {
            if (!form.universityId || Number(form.universityId) <= 0) {
                errors.universityId = "Please select a university.";
            }
        }

        if (!form.name.trim()) {
            errors.name = "Role name is required.";
        } else if (form.name.trim().length < 2) {
            errors.name = "Role name must have at least 2 characters.";
        }

        if (!form.userRole) {
            errors.userRole = "Please select a role category.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setDialogError("");

        if (isView) {
            onClose();
            return;
        }

        if (isDelete) {
            if (!role?.id) return;
            try {
                await onDelete(role.id);
            } catch (err) {
                setDialogError(extractErrorMessage(err));
            }
            return;
        }

        if (!validate()) return;

        const request: RoleRequest = {
            name: form.name.trim(),
            description: form.description.trim(),
            userRole: form.userRole,
            active: form.active,
        };

        try {
            if (isCreate) {
                await onCreate(Number(form.universityId), request);
            } else if (isEdit && role?.id) {
                await onUpdate(role.id, request);
            }
        } catch (err) {
            setDialogError(extractErrorMessage(err));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !busy && onClose()}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div
                            className={`rounded-xl p-2.5 ${isDelete
                                ? "bg-rose-500/10 text-rose-400"
                                : "bg-cyan-500/10 text-cyan-400"
                                }`}
                        >
                            {isDelete ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {isCreate && "Create New Role"}
                                {isEdit && "Edit Role Details"}
                                {isView && "Role Profile & Overview"}
                                {isDelete && "Delete Role"}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {isCreate && "Add a new security role bound to a university"}
                                {isEdit && "Update role properties, category and status"}
                                {isView && "Inspect role metadata and granted permissions"}
                                {isDelete && "Confirm permanent removal of role from system"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form or Info Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {dialogError && (
                        <div className="flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-300">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                            <span>{dialogError}</span>
                        </div>
                    )}

                    {/* DELETE WARNING */}
                    {isDelete && role && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-slate-300">
                                <p className="font-semibold text-rose-300">
                                    Are you sure you want to delete &ldquo;{role.name}&rdquo;?
                                </p>
                                <p className="mt-2 text-xs leading-5 text-slate-400">
                                    This role belongs to{" "}
                                    <span className="font-medium text-white">
                                        {role.university?.name || "University"}
                                    </span>
                                    . This action cannot be undone.
                                </p>
                            </div>

                            {role.userCount > 0 ? (
                                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                                    <div>
                                        <p className="font-semibold">Users are currently assigned</p>
                                        <p className="mt-0.5 text-amber-200/80">
                                            This role currently has{" "}
                                            <strong>{role.userCount}</strong> active user(s). The server will prevent deletion until users are reassigned.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                                    <CheckCircle2 size={15} />
                                    <span>Safe to delete: No users are assigned to this role.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW MODE DETAILS */}
                    {isView && role && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                    <p className="text-xs text-slate-400">Role Name</p>
                                    <p className="mt-1 text-base font-semibold text-white">{role.name}</p>
                                    <p className="mt-1 text-[10px] font-mono text-slate-500">Role record ID: {role.id}</p>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                    <p className="text-xs text-slate-400">Status</p>
                                    <div className="mt-1.5">
                                        <StatusBadge active={role.active} />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                    <p className="text-xs text-slate-400">Category / Enum</p>
                                    <p className="mt-1 text-sm font-medium text-cyan-300">
                                        {role.userRole?.name || role.userRole?.enumValue || "Not specified"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                    <p className="text-xs text-slate-400">University</p>
                                    <p className="mt-1 text-sm font-medium text-white">
                                        {role.university?.name || "Not assigned"}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-500">University ID: {role.university?.id ?? "Not supplied"}{role.university?.code ? ` · Code: ${role.university.code}` : ""}</p>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                    <p className="text-xs text-slate-400">Assigned Users</p>
                                    <p className="mt-1 text-base font-bold text-white flex items-center gap-1.5">
                                        <Users size={16} className="text-slate-400" />
                                        {role.userCount}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                    <p className="text-xs text-slate-400">Granted Permissions</p>
                                    <p className="mt-1 text-base font-bold text-cyan-400 flex items-center gap-1.5">
                                        <KeyRound size={16} />
                                        {role.permissions?.length || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-200">Your available actions on this role</p><span className="text-[10px] text-slate-500">From role.permissionActions</span></div>
                                <div className="mt-2 flex flex-wrap gap-1.5">{(role.permissionActions ?? []).length ? role.permissionActions.map((action) => <span key={action} className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200">{action.replace(/_/g, " ")}</span>) : <span className="text-xs text-amber-300">No actions were granted or returned by the backend.</span>}</div>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                                <p className="text-xs text-slate-400">Description</p>
                                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                                    {role.description || "No description provided for this role."}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-slate-800/40 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-slate-300">
                                        Resource Hierarchy Permissions ({role.permissions?.length || 0})
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onOpenPermissions(role);
                                        }}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                                    >
                                        <Pencil size={12} />
                                        Manage Hierarchy Matrix
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Click &quot;Manage Hierarchy Matrix&quot; above to configure parent-child resource permissions for this role.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CREATE OR EDIT FORM FIELDS */}
                    {(isCreate || isEdit) && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    University <span className="text-rose-400">*</span>
                                </label>
                                {isCreate ? (
                                    <div className="relative mt-1.5">
                                        <select
                                            value={form.universityId}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    universityId: e.target.value ? Number(e.target.value) : "",
                                                })
                                            }
                                            disabled={busy}
                                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                                        >
                                            <option value="" disabled className="bg-slate-900 text-slate-400">
                                                Select University...
                                            </option>
                                            {universities.map((u) => (
                                                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                                    {u.name} {u.code ? `(${u.code})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <SelectChevron />
                                        <FieldError>{fieldErrors.universityId}</FieldError>
                                    </div>
                                ) : (
                                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/5 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-300">
                                        <Building2 size={16} className="text-cyan-400" />
                                        <span>{role?.university?.name || "University"}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Role Category (Enum Tier) <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative mt-1.5">
                                    <select
                                        value={form.userRole}
                                        onChange={(e) =>
                                            setForm({ ...form, userRole: e.target.value })
                                        }
                                        disabled={busy || enumsLoading}
                                        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm text-white transition focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                                    >
                                        <option value="" disabled className="bg-slate-900 text-slate-400">
                                            {enumsLoading ? "Loading role tiers..." : "Select Role Category..."}
                                        </option>
                                        {activeEnums.map((e) => (
                                            <option key={e.enumValue} value={e.enumValue} className="bg-slate-900 text-white">
                                                {e.name} ({e.enumValue})
                                            </option>
                                        ))}
                                    </select>
                                    <SelectChevron />
                                    <FieldError>{fieldErrors.userRole}</FieldError>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Role Title / Name <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Senior Academic Coordinator"
                                    disabled={busy}
                                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                                />
                                <FieldError>{fieldErrors.name}</FieldError>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe responsibilities and scope of this role..."
                                    rows={3}
                                    disabled={busy}
                                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none disabled:opacity-50 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-white">Role Active Status</p>
                                    <p className="text-xs text-slate-400">
                                        Inactive roles cannot be assigned to new users.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={form.active}
                                    onClick={() => setForm({ ...form, active: !form.active })}
                                    disabled={busy}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.active ? "bg-cyan-500" : "bg-slate-700"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.active ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            {isView ? "Close" : "Cancel"}
                        </button>

                        {!isView && (
                            <button
                                type="submit"
                                disabled={busy}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 ${isDelete
                                    ? "bg-rose-600 shadow-rose-600/20"
                                    : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 shadow-blue-500/20"
                                    }`}
                            >
                                {busy && <LoaderCircle size={16} className="animate-spin" />}
                                {isCreate && "Create Role"}
                                {isEdit && "Save Changes"}
                                {isDelete && "Delete Role"}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function RolePermission() {
    const reduceMotion = useReducedMotion();

    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [universities, setUniversities] = useState<CommonDTO[]>([]);
    const [roleEnums, setRoleEnums] = useState<UserRoleResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showHierarchyAnalysis, setShowHierarchyAnalysis] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    // Active dialog
    const [dialog, setDialog] = useState<{
        mode: DialogMode;
        role: RoleResponse | null;
    } | null>(null);

    // Filter toolbar state
    const [search, setSearch] = useState("");
    const [universityFilter, setUniversityFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("NEWEST");
    const [page, setPage] = useState(1);

    /* -------------------------------------------------------------------------- */
    /* Data Loading                                                               */
    /* -------------------------------------------------------------------------- */

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setPageError("");

        try {
            const [rolesData, permsData, unisData] = await Promise.allSettled([
                getAllRoles(),
                getRoleBasePermissions(),
                getUniversityFilter(),
            ]);

            let loadedRoles: RoleResponse[] = [];
            if (rolesData.status === "fulfilled") {
                loadedRoles = rolesData.value;
                setRoles(loadedRoles);
            } else {
                setPageError(extractErrorMessage(rolesData.reason, "Unable to load roles."));
            }

            if (permsData.status === "fulfilled") {
                setAllPermissions(permsData.value);
            }

            // Collect universities from filter endpoint + any unique universities present on roles
            const loadedUnis: CommonDTO[] = [];
            if (unisData.status === "fulfilled") {
                loadedUnis.push(...unisData.value);
            }
            loadedRoles.forEach((r) => {
                if (r.university) loadedUnis.push(r.university);
            });
            const mergedUnis = uniqueCommonDTOs(loadedUnis);
            setUniversities(mergedUnis);

            // Fetch role enums if we have at least one university
            if (mergedUnis.length > 0) {
                try {
                    const enums = await getRoleEnums(mergedUnis[0].id);
                    setRoleEnums(enums);
                } catch {
                    // Handled inside service fallback
                }
            }
        } catch (error) {
            setPageError(extractErrorMessage(error, "Unexpected error loading role data."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const availableCategories = useMemo(() => {
        const catSet = new Map<string, string>();
        roles.forEach((r) => {
            if (r.userRole?.enumValue) {
                catSet.set(r.userRole.enumValue, r.userRole.name || r.userRole.enumValue);
            }
        });
        return Array.from(catSet.entries()).map(([enumValue, name]) => ({
            enumValue,
            name,
        }));
    }, [roles]);

    /* -------------------------------------------------------------------------- */
    /* Statistics Cards                                                           */
    /* -------------------------------------------------------------------------- */

    const stats = useMemo(() => {
        const activeCount = roles.filter((r) => r.active).length;
        const inactiveCount = roles.filter((r) => !r.active).length;
        const totalPermsCount = allPermissions.length;
        const universitiesCovered = new Set(
            roles.map((r) => r.university?.id).filter(Boolean)
        ).size;

        return [
            {
                label: "Total Roles",
                value: numberLabel(roles.length),
                icon: Shield,
                tone: "cyan",
            },
            {
                label: "Active Roles",
                value: numberLabel(activeCount),
                icon: ShieldCheck,
                tone: "green",
            },
            {
                label: "Inactive Roles",
                value: numberLabel(inactiveCount),
                icon: ShieldAlert,
                tone: "amber",
            },
            {
                label: "Universities Covered",
                value: numberLabel(universitiesCovered || universities.length),
                icon: Building2,
                tone: "blue",
            },
            {
                label: "Base Permissions",
                value: numberLabel(totalPermsCount),
                icon: KeyRound,
                tone: "purple",
            },
        ];
    }, [roles, allPermissions, universities]);

    /* -------------------------------------------------------------------------- */
    /* Filtering & Sorting                                                        */
    /* -------------------------------------------------------------------------- */

    const filteredRoles = useMemo(() => {
        const query = text(search);

        const list = roles.filter((role) => {
            const matchesSearch =
                !query ||
                text(role.name).includes(query) ||
                text(role.description).includes(query) ||
                text(role.userRole?.name).includes(query) ||
                text(role.userRole?.enumValue).includes(query) ||
                text(role.university?.name).includes(query) ||
                text(role.university?.code).includes(query) ||
                String(role.id).includes(query);

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" && role.active) ||
                (statusFilter === "INACTIVE" && !role.active);

            const matchesUni =
                universityFilter === "ALL" ||
                role.university?.id === Number(universityFilter);

            const matchesCategory =
                categoryFilter === "ALL" ||
                role.userRole?.enumValue === categoryFilter;

            return matchesSearch && matchesStatus && matchesUni && matchesCategory;
        });

        list.sort((a, b) => {
            if (sort === "NAME_ASC") return a.name.localeCompare(b.name);
            if (sort === "NAME_DESC") return b.name.localeCompare(a.name);
            if (sort === "USERS_DESC") return (b.userCount || 0) - (a.userCount || 0);
            if (sort === "PERMS_DESC")
                return (b.permissions?.length || 0) - (a.permissions?.length || 0);
            return b.id - a.id;
        });

        return list;
    }, [roles, search, statusFilter, universityFilter, categoryFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const visibleRoles = filteredRoles.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, universityFilter, categoryFilter, sort]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const hasActiveFilters =
        search.trim() !== "" ||
        universityFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        categoryFilter !== "ALL" ||
        sort !== "NEWEST";

    const resetFilters = () => {
        setSearch("");
        setUniversityFilter("ALL");
        setStatusFilter("ALL");
        setCategoryFilter("ALL");
        setSort("NEWEST");
        setPage(1);
    };

    /* -------------------------------------------------------------------------- */
    /* CRUD Handlers                                                              */
    /* -------------------------------------------------------------------------- */

    const handleCreateRole = async (universityId: number, request: RoleRequest) => {
        setBusy(true);
        try {
            const created = await createRole(universityId, request);
            setDialog(null);
            setNotice(`Role "${created.name}" created successfully.`);
            toast.success(`Role "${created.name}" created successfully.`);
            await loadData(true);
        } catch (error) {
            const msg = extractErrorMessage(error);
            toast.error(`Could not create role: ${msg}`);
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const handleUpdateRole = async (roleId: number, request: RoleRequest) => {
        setBusy(true);
        try {
            await updateRole(roleId, request);
            setDialog(null);
            setNotice("Role updated successfully.");
            toast.success("Role updated successfully.");
            await loadData(true);
        } catch (error) {
            const msg = extractErrorMessage(error);
            toast.error(`Could not update role: ${msg}`);
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteRole = async (roleId: number) => {
        setBusy(true);
        try {
            const msg = await deleteRole(roleId);
            setDialog(null);
            setNotice(msg || "Role deleted successfully.");
            toast.success(msg || "Role deleted successfully.");
            await loadData(true);
        } catch (error) {
            const msg = extractErrorMessage(error);
            toast.error(`Could not delete role: ${msg}`);
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const handleSavePermissions = async (roleId: number, permissionIds: number[]) => {
        setBusy(true);
        try {
            await updateRolePermissions(roleId, permissionIds);
            setDialog(null);
            setNotice("Hierarchical permissions updated successfully.");
            toast.success("Hierarchical permissions updated successfully.");
            await loadData(true);
        } catch (error) {
            const msg = extractErrorMessage(error);
            toast.error(`Could not update permissions: ${msg}`);
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const tones: Record<string, string> = {
        cyan: "border-cyan-400/20 from-cyan-500/10 to-blue-500/5 text-cyan-300",
        green: "border-emerald-400/20 from-emerald-500/10 to-teal-500/5 text-emerald-300",
        amber: "border-amber-400/20 from-amber-500/10 to-orange-500/5 text-amber-300",
        blue: "border-blue-400/20 from-blue-500/10 to-indigo-500/5 text-sky-300",
        purple: "border-purple-400/20 from-purple-500/10 to-pink-500/5 text-purple-300",
    };

    return (
        <motion.main
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full min-w-0 space-y-7 p-4 text-white sm:p-6 lg:p-8"
        >
            {/* Header Section */}
            <section>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <span>Dashboard</span>
                    <ChevronRight size={15} />
                    <span>User Management</span>
                    <ChevronRight size={15} />
                    <span className="text-cyan-300">Roles & Permissions</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Identity & Access Governance
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Role & Permission Management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Define institutional roles, govern access scopes across universities, and manage cascading resource permissions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void loadData(true)}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={loading || refreshing ? "animate-spin text-cyan-400" : ""}
                            />
                            <span className="hidden sm:inline">
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowHierarchyAnalysis(true)}
                            disabled={loading || refreshing}
                            title="Inspect the live base permission hierarchy and frontend/backend mapping"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-200 transition hover:border-violet-300/40 hover:bg-violet-500/20 disabled:opacity-50"
                        >
                            <Network size={16} />
                            <span className="hidden sm:inline">Analyze Hierarchy</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDialog({ mode: "CREATE", role: null })}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={19} />
                            Add Role
                        </button>
                    </div>
                </div>
            </section>

            {/* Error / Notice Banners */}
            <AnimatePresence>
                {pageError && (
                    <ErrorBanner
                        title="Could not load role configurations"
                        message={pageError}
                        onRetry={() => void loadData()}
                        onDismiss={() => setPageError("")}
                    />
                )}

                {notice && (
                    <motion.div
                        role="status"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                    >
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                        <p>{notice}</p>
                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss success message"
                            className="ml-auto text-slate-400 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Statistics Row */}
            <section
                aria-label="Role statistics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

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
                                            stat.value
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                                    <Icon size={22} />
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

            {/* Main Content Card (Filters + Table) */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_12px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                {/* Filter Toolbar */}
                <div className="grid gap-4 border-b border-white/10 p-4 sm:p-5 lg:grid-cols-[1.5fr_repeat(4,1fr)_auto]">
                    {/* Search */}
                    <div className="relative min-w-0">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            aria-label="Search roles"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search role name, category, university..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none"
                        />
                    </div>

                    {/* University Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by university"
                            value={universityFilter}
                            onChange={(e) => setUniversityFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-2.5 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="ALL" className="bg-slate-900 text-white">
                                All Universities
                            </option>
                            {universities.map((u) => (
                                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                    {u.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-2.5 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="ALL" className="bg-slate-900 text-white">
                                All Statuses
                            </option>
                            <option value="ACTIVE" className="bg-slate-900 text-white">
                                Active Only
                            </option>
                            <option value="INACTIVE" className="bg-slate-900 text-white">
                                Inactive Only
                            </option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            aria-label="Filter by category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-2.5 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="ALL" className="bg-slate-900 text-white">
                                All Categories
                            </option>
                            {availableCategories.map((c) => (
                                <option key={c.enumValue} value={c.enumValue} className="bg-slate-900 text-white">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Sort Options */}
                    <div className="relative">
                        <select
                            aria-label="Sort roles"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-2.5 text-sm text-white transition focus:border-cyan-400 focus:outline-none"
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
                            <option value="USERS_DESC" className="bg-slate-900 text-white">
                                Most Users
                            </option>
                            <option value="PERMS_DESC" className="bg-slate-900 text-white">
                                Most Permissions
                            </option>
                        </select>
                        <SelectChevron />
                    </div>

                    {/* Reset Filters */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                            title="Reset all filters"
                        >
                            <RotateCcw size={14} />
                            <span>Reset</span>
                        </button>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="border-b border-white/10 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <tr>
                                <th scope="col" className="px-6 py-4">Role Title & Scope</th>
                                <th scope="col" className="px-6 py-4">Category / Tier</th>
                                <th scope="col" className="px-6 py-4">University</th>
                                <th scope="col" className="px-6 py-4">Assigned Users</th>
                                <th scope="col" className="px-6 py-4">Hierarchy Permissions</th>
                                <th scope="col" className="px-6 py-4">Status</th>
                                <th scope="col" className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-36 rounded bg-white/10" />
                                            <div className="mt-2 h-3 w-48 rounded bg-white/5" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 w-24 rounded-full bg-white/10" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-32 rounded bg-white/10" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-12 rounded bg-white/10" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 w-28 rounded bg-white/10" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 w-16 rounded-full bg-white/10" />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-block h-8 w-24 rounded bg-white/10" />
                                        </td>
                                    </tr>
                                ))
                            ) : visibleRoles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                        <Shield size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                        <p className="text-base font-semibold text-slate-300">No roles found</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                            {hasActiveFilters
                                                ? "Try clearing some filters or searching with different keywords."
                                                : "Get started by creating your first system role."}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-4 rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                                            >
                                                Clear all filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                visibleRoles.map((role) => {
                                    const canEdit = hasPermission(role, "UPDATE");
                                    const canDelete = hasPermission(role, "DELETE");

                                    return (
                                        <motion.tr
                                            key={role.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="transition hover:bg-white/[0.02]"
                                        >
                                            {/* Name & Description */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-xl border border-white/10 bg-slate-800/80 p-2 text-cyan-400 shrink-0 mt-0.5">
                                                        <Shield size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white truncate max-w-[220px]">
                                                            {role.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400 line-clamp-1 max-w-[240px]">
                                                            {role.description || "No description"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category / Tier */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">
                                                    {role.userRole?.name || role.userRole?.enumValue || "General"}
                                                </span>
                                            </td>

                                            {/* University */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                                    <Building2 size={14} className="text-slate-500 shrink-0" />
                                                    <span className="truncate max-w-[180px]">
                                                        {role.university?.name || "Global / Institutional"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Assigned Users */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/50 px-2.5 py-1 text-xs font-medium text-slate-300">
                                                    <Users size={13} className="text-slate-400" />
                                                    {role.userCount} {role.userCount === 1 ? "user" : "users"}
                                                </span>
                                            </td>

                                            {/* Granted Permissions & Matrix Action */}
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDialog({ mode: "PERMISSIONS", role })
                                                    }
                                                    className="group inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/15 transition"
                                                >
                                                    <KeyRound size={13} className="text-cyan-400" />
                                                    <span>Hierarchy Matrix</span>
                                                    <ChevronRight
                                                        size={13}
                                                        className="text-cyan-400/50 group-hover:translate-x-0.5 transition"
                                                    />
                                                </button>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <StatusBadge active={role.active} />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDialog({ mode: "VIEW", role })
                                                        }
                                                        aria-label="View role details"
                                                        className="rounded-lg border border-white/10 bg-slate-800/50 p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
                                                        title="View Details"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDialog({ mode: "EDIT", role })
                                                        }
                                                        disabled={!canEdit}
                                                        aria-label="Edit role"
                                                        className="rounded-lg border border-white/10 bg-slate-800/50 p-2 text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                                                        title={canEdit ? "Edit Role" : "No update permission"}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDialog({ mode: "DELETE", role })
                                                        }
                                                        disabled={!canDelete}
                                                        aria-label="Delete role"
                                                        className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition disabled:opacity-40"
                                                        title={canDelete ? "Delete Role" : "No delete permission"}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="lg:hidden divide-y divide-white/5">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 space-y-3 animate-pulse">
                                <div className="h-5 w-40 rounded bg-white/10" />
                                <div className="h-4 w-28 rounded bg-white/5" />
                                <div className="h-8 w-full rounded bg-white/10" />
                            </div>
                        ))
                    ) : visibleRoles.length === 0 ? (
                        <div className="py-12 px-4 text-center text-slate-500">
                            <Shield size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-300">No roles found</p>
                        </div>
                    ) : (
                        visibleRoles.map((role) => (
                            <div key={role.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white">{role.name}</p>
                                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                            {role.description || "No description"}
                                        </p>
                                    </div>
                                    <StatusBadge active={role.active} />
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 font-semibold text-violet-300">
                                        {role.userRole?.name || role.userRole?.enumValue || "General"}
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <Building2 size={13} />
                                        {role.university?.name || "Not assigned"}{role.university?.code ? ` · ${role.university.code}` : ` · ID ${role.university?.id ?? "—"}`}
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <Users size={13} />
                                        {role.userCount} users
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDialog({ mode: "PERMISSIONS", role })
                                        }
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                                    >
                                        <KeyRound size={13} />
                                        Hierarchy Matrix
                                    </button>

                                    <div className="flex min-w-0 items-start gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDialog({ mode: "VIEW", role })}
                                            className="rounded-lg border border-white/10 bg-slate-800 p-2 text-slate-300 hover:text-white"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDialog({ mode: "EDIT", role })}
                                            className="rounded-lg border border-white/10 bg-slate-800 p-2 text-slate-300 hover:text-white"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDialog({ mode: "DELETE", role })}
                                            className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:text-rose-200"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        Showing{" "}
                        <strong className="text-white">
                            {filteredRoles.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                        </strong>{" "}
                        to{" "}
                        <strong className="text-white">
                            {Math.min(currentPage * PAGE_SIZE, filteredRoles.length)}
                        </strong>{" "}
                        of <strong className="text-white">{filteredRoles.length}</strong> roles
                    </p>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setPage(1)}
                            disabled={currentPage === 1 || loading}
                            aria-label="First page"
                            className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40 transition"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            aria-label="Previous page"
                            className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40 transition"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span className="px-3 text-xs font-semibold text-slate-300">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            aria-label="Next page"
                            className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40 transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(totalPages)}
                            disabled={currentPage === totalPages || loading}
                            aria-label="Last page"
                            className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40 transition"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {showHierarchyAnalysis && (
                <BasePermissionAnalysisDialog
                    permissions={allPermissions}
                    onClose={() => setShowHierarchyAnalysis(false)}
                />
            )}

            {/* Modal Dialogs */}
            <AnimatePresence>
                {dialog && dialog.mode !== "PERMISSIONS" && (
                    <RoleDialog
                        mode={dialog.mode as "CREATE" | "EDIT" | "VIEW" | "DELETE"}
                        role={dialog.role}
                        universities={universities}
                        roleEnums={roleEnums}
                        busy={busy}
                        onClose={() => setDialog(null)}
                        onCreate={handleCreateRole}
                        onUpdate={handleUpdateRole}
                        onDelete={handleDeleteRole}
                        onOpenPermissions={(r) => setDialog({ mode: "PERMISSIONS", role: r })}
                    />
                )}

                {dialog && dialog.mode === "PERMISSIONS" && dialog.role && (
                    <PermissionMatrixDialog
                        role={dialog.role}
                        allPermissions={allPermissions}
                        busy={busy}
                        onClose={() => setDialog(null)}
                        onSave={handleSavePermissions}
                    />
                )}
            </AnimatePresence>
        </motion.main>
    );
}
