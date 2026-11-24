import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types & Enums                                                              */
/* -------------------------------------------------------------------------- */

export const BASE_PERIOD_TYPES = [
    "CLASS",
    "BREAK",
    "LUNCH",
    "ASSEMBLY",
    "ACTIVITY",
] as const;

export type BasePeriodType = (typeof BASE_PERIOD_TYPES)[number];

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export type PermissionAction = "UPDATE" | "DELETE" | "CREATE_CHILD" | "READ" | string;

export interface PeriodRequest {
    sequenceNumber: number;
    periodNumber?: number | null;
    periodType: BasePeriodType;
    label: string;
    startTime: string; // HH:mm or HH:mm:ss
    endTime: string;   // HH:mm or HH:mm:ss
    durationMinutes: number;
    active?: boolean;
}

export interface BaseTimeTableRequest {
    name: string;
    description?: string;
    schoolId: number;
    dayStartTime: string; // HH:mm
    dayEndTime: string;   // HH:mm
    periodsPerDay: number;
    defaultPeriodDurationMinutes: number;
    defaultBreakDurationMinutes?: number;
    assemblyStartTime?: string | null;
    assemblyEndTime?: string | null;
    active?: boolean;
    periods: PeriodRequest[];
}

export interface PeriodResponse {
    id?: number;
    sequenceNumber: number;
    periodNumber?: number | null;
    durationMinutes: number;
    periodType: BasePeriodType;
    label: string;
    startTime: string;
    endTime: string;
    active: boolean;
}

export interface BaseTimeTableResponse {
    id: number;
    name: string;
    description?: string | null;
    dayStartTime: string;
    dayEndTime: string;
    assemblyStartTime?: string | null;
    assemblyEndTime?: string | null;
    periodsPerDay: number;
    defaultPeriodDurationMinutes: number;
    defaultBreakDurationMinutes?: number | null;
    active: boolean;
    periods: PeriodResponse[];
    school?: CommonDTO | null;
    university?: CommonDTO | null;
    permissionActions?: PermissionAction[];
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

/* -------------------------------------------------------------------------- */
/* URL helper                                                                 */
/* -------------------------------------------------------------------------- */

const getServiceBaseUrl = (): string => {
    const base = getBaseUrl().replace(/\/+$/, "");
    return base || "/super-admin";
};

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    if (!error || typeof error !== "object") {
        return fallback;
    }

    const candidate = error as {
        message?: unknown;
        response?: {
            data?: unknown;
            status?: number;
        };
    };

    const data = candidate.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data.trim();
    }

    if (data && typeof data === "object") {
        const body = data as Record<string, unknown>;

        for (const key of ["message", "error", "detail", "description", "title"]) {
            const value = body[key];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }

        if (Array.isArray(body.errors)) {
            const messages = body.errors
                .map((item) => {
                    if (typeof item === "string") return item;
                    if (item && typeof item === "object") {
                        const entry = item as Record<string, unknown>;
                        return String(entry.defaultMessage ?? entry.message ?? entry.field ?? "");
                    }
                    return "";
                })
                .filter(Boolean);

            if (messages.length) return messages.join(", ");
        }
    }

    const status = candidate.response?.status;

    if (status === 400) return "Invalid request. Please check your entered template details.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this timetable operation.";
    if (status === 404) return "The requested timetable template was not found.";
    if (status === 409) return "A template with this name already exists in the selected school.";
    if (status === 422) return "The submitted template details could not be processed.";
    if (status === 500) return "A server error occurred. Please try again later.";

    if (typeof candidate.message === "string" && candidate.message.trim()) {
        if (candidate.message.toLowerCase().includes("network error")) {
            return "Unable to connect to the server. Check your connection.";
        }
        return candidate.message.trim();
    }

    return fallback;
}

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeCommonDTO(value: unknown): CommonDTO | null {
    const item = asRecord(value);
    const id = Number(item.id);
    if (!Number.isSafeInteger(id) || id <= 0 || typeof item.name !== "string") {
        return null;
    }
    return {
        id,
        name: item.name,
        code: typeof item.code === "string" ? item.code : null,
    };
}

export function normalizePeriod(value: unknown): PeriodResponse {
    const item = asRecord(value);
    return {
        id: Number(item.id) || undefined,
        sequenceNumber: Number(item.sequenceNumber) || 1,
        periodNumber: item.periodNumber != null ? Number(item.periodNumber) : null,
        durationMinutes: Number(item.durationMinutes) || 0,
        periodType: (String(item.periodType ?? "CLASS").toUpperCase() as BasePeriodType) || "CLASS",
        label: String(item.label ?? ""),
        startTime: String(item.startTime ?? ""),
        endTime: String(item.endTime ?? ""),
        active: item.active !== false,
    };
}

export function normalizeBaseTimeTable(value: unknown): BaseTimeTableResponse {
    const item = asRecord(value);
    return {
        id: Number(item.id) || 0,
        name: String(item.name ?? ""),
        description: typeof item.description === "string" ? item.description : null,
        dayStartTime: String(item.dayStartTime ?? ""),
        dayEndTime: String(item.dayEndTime ?? ""),
        assemblyStartTime: typeof item.assemblyStartTime === "string" ? item.assemblyStartTime : null,
        assemblyEndTime: typeof item.assemblyEndTime === "string" ? item.assemblyEndTime : null,
        periodsPerDay: Number(item.periodsPerDay) || 0,
        defaultPeriodDurationMinutes: Number(item.defaultPeriodDurationMinutes) || 0,
        defaultBreakDurationMinutes: item.defaultBreakDurationMinutes != null ? Number(item.defaultBreakDurationMinutes) : null,
        active: item.active !== false,
        periods: asArray(item.periods).map(normalizePeriod),
        school: normalizeCommonDTO(item.school),
        university: normalizeCommonDTO(item.university),
        permissionActions: asArray<PermissionAction>(item.permissionActions),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
        createdBy: normalizeCommonDTO(item.createdBy),
        updatedBy: normalizeCommonDTO(item.updatedBy),
    };
}

export function formatTimeDisplay(timeStr?: string | null): string {
    if (!timeStr) return "--:--";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const hour = parseInt(parts[0], 10);
    const minute = parts[1];
    if (isNaN(hour)) return timeStr;
    const period = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minute} ${period}`;
}

export function formatDate(dateString?: string | null): string {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatAuditActor(actor?: CommonDTO | null): string {
    if (!actor) return "System";
    if (actor.name && actor.code) return `${actor.name} (${actor.code})`;
    if (actor.name) return actor.name;
    return `User #${actor.id}`;
}

/* -------------------------------------------------------------------------- */
/* API Service Functions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/timetable/base-templates
 */
export async function getAllBaseTemplates(): Promise<BaseTimeTableResponse[]> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/timetable/base-templates`);
        return asArray(response.data)
            .map(normalizeBaseTimeTable)
            .filter((t) => t.id > 0);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load timetable templates."));
    }
}

/**
 * GET /{role}/timetable/base-templates/{templateId}
 */
export async function getBaseTemplate(templateId: number): Promise<BaseTimeTableResponse> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/timetable/base-templates/${templateId}`);
        return normalizeBaseTimeTable(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load timetable template details."));
    }
}

/**
 * POST /{role}/timetable/base-templates
 */
export async function createBaseTemplate(request: BaseTimeTableRequest): Promise<BaseTimeTableResponse> {
    if (!request.name || !request.name.trim()) {
        throw new Error("Template name is required.");
    }
    if (!request.schoolId || request.schoolId <= 0) {
        throw new Error("Please select a valid school.");
    }
    if (!request.dayStartTime || !request.dayEndTime) {
        throw new Error("Day start and end times are required.");
    }
    if (request.periods.length === 0) {
        throw new Error("At least one period definition is required.");
    }

    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/timetable/base-templates`,
            request
        );
        return normalizeBaseTimeTable(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to create timetable template."));
    }
}

/**
 * GET /{role}/filter/school
 */
export async function getSchoolFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/filter/school`);
        const items = asArray(response.data).map(normalizeCommonDTO).filter((s): s is CommonDTO => Boolean(s));
        const unique = new Map<number, CommonDTO>();
        for (const item of items) {
            unique.set(item.id, item);
        }
        return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
}
