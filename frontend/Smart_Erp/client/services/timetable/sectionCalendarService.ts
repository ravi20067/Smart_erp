import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types & Enums                                                              */
/* -------------------------------------------------------------------------- */

export const CALENDAR_DAY_TYPES = [
    "REGULAR",
    "HOLIDAY",
    "HALF_DAY",
    "SPECIAL",
    "EXAMINATION",
    "EVENT",
] as const;

export type CalendarDayType = (typeof CALENDAR_DAY_TYPES)[number];

export const CALENDAR_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type CalendarStatus = (typeof CALENDAR_STATUSES)[number];

export const OPERATING_STATUSES = ["OPEN", "CLOSED"] as const;
export type OperatingStatus = (typeof OPERATING_STATUSES)[number];

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface CalendarRequest {
    name: string;
    sectionId: number;
    academicYearId: number;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    defaultOpeningTime?: string | null; // HH:mm
    defaultClosingTime?: string | null; // HH:mm
}

export interface CalendarResponse {
    id: number;
    sectionId: number;
    academicYearId: number;
    name: string;
    startDate: string;
    endDate: string;
    defaultOpeningTime?: string | null;
    defaultClosingTime?: string | null;
    status: CalendarStatus;
}

export interface CalendarDayRequest {
    calendarDate: string; // YYYY-MM-DD
    dayType: CalendarDayType;
    operatingStatus: OperatingStatus;
    title?: string | null;
    description?: string | null;
    holidayReason?: string | null;
    openingTime?: string | null; // HH:mm
    closingTime?: string | null; // HH:mm
    appliedTimetableVersionId?: number | null;
    instructionDay?: boolean;
}

export interface CalendarDayResponse {
    id: number;
    calendarId: number;
    appliedTimetableVersionId?: number | null;
    calendarDate: string;
    dayType: CalendarDayType;
    operatingStatus: OperatingStatus;
    title?: string | null;
    description?: string | null;
    holidayReason?: string | null;
    openingTime?: string | null;
    closingTime?: string | null;
    instructionDay: boolean;
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

    if (status === 400) return "Invalid calendar details. Please verify date ranges and time formats.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to manage this section's calendar.";
    if (status === 404) return "The requested section calendar was not found.";
    if (status === 409) return "A calendar already exists for this section in the selected date range.";
    if (status === 422) return "The submitted calendar days could not be processed.";
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

export function normalizeCalendar(value: unknown): CalendarResponse {
    const item = asRecord(value);
    return {
        id: Number(item.id) || 0,
        sectionId: Number(item.sectionId) || 0,
        academicYearId: Number(item.academicYearId) || 0,
        name: String(item.name ?? ""),
        startDate: String(item.startDate ?? ""),
        endDate: String(item.endDate ?? ""),
        defaultOpeningTime: typeof item.defaultOpeningTime === "string" ? item.defaultOpeningTime : null,
        defaultClosingTime: typeof item.defaultClosingTime === "string" ? item.defaultClosingTime : null,
        status: (String(item.status ?? "DRAFT").toUpperCase() as CalendarStatus) || "DRAFT",
    };
}

export function normalizeCalendarDay(value: unknown): CalendarDayResponse {
    const item = asRecord(value);
    return {
        id: Number(item.id) || 0,
        calendarId: Number(item.calendarId) || 0,
        appliedTimetableVersionId: item.appliedTimetableVersionId != null ? Number(item.appliedTimetableVersionId) : null,
        calendarDate: String(item.calendarDate ?? ""),
        dayType: (String(item.dayType ?? "REGULAR").toUpperCase() as CalendarDayType) || "REGULAR",
        operatingStatus: (String(item.operatingStatus ?? "OPEN").toUpperCase() as OperatingStatus) || "OPEN",
        title: typeof item.title === "string" ? item.title : null,
        description: typeof item.description === "string" ? item.description : null,
        holidayReason: typeof item.holidayReason === "string" ? item.holidayReason : null,
        openingTime: typeof item.openingTime === "string" ? item.openingTime : null,
        closingTime: typeof item.closingTime === "string" ? item.closingTime : null,
        instructionDay: item.instructionDay !== false,
    };
}

/* -------------------------------------------------------------------------- */
/* API Service Functions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * POST /{role}/timetable/calendars
 */
export async function createCalendar(request: CalendarRequest): Promise<CalendarResponse> {
    if (!request.name || !request.name.trim()) {
        throw new Error("Calendar name is required.");
    }
    if (!request.sectionId || request.sectionId <= 0) {
        throw new Error("Please select a section.");
    }
    if (!request.academicYearId || request.academicYearId <= 0) {
        throw new Error("Please select an academic year.");
    }
    if (!request.startDate || !request.endDate) {
        throw new Error("Start date and end date are required.");
    }
    if (new Date(request.endDate) < new Date(request.startDate)) {
        throw new Error("End date must be on or after start date.");
    }

    try {
        const response = await api.post<unknown>(`${getServiceBaseUrl()}/timetable/calendars`, request);
        return normalizeCalendar(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to create academic calendar."));
    }
}

/**
 * GET /{role}/timetable/calendars/{calendarId}
 */
export async function getCalendar(calendarId: number): Promise<CalendarResponse> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/timetable/calendars/${calendarId}`);
        return normalizeCalendar(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load calendar details."));
    }
}

/**
 * GET /{role}/timetable/calendars/by-section/{sectionId}
 * Fetches the single SectionAcademicCalendar bound to the given section, or null if none exists yet.
 */
export async function getCalendarBySection(sectionId: number): Promise<CalendarResponse | null> {
    if (!sectionId || sectionId <= 0) return null;
    try {
        const response = await api.get<unknown>(
            `${getServiceBaseUrl()}/timetable/calendars/by-section/${sectionId}`
        );
        if (response.status === 204 || !response.data) {
            return null;
        }
        return normalizeCalendar(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load section academic calendar."));
    }
}

/**
 * POST /{role}/timetable/calendars/{calendarId}/publish
 */
export async function publishCalendar(calendarId: number): Promise<CalendarResponse> {
    if (!calendarId || calendarId <= 0) {
        throw new Error("Invalid calendar ID.");
    }
    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/timetable/calendars/${calendarId}/publish`
        );
        return normalizeCalendar(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to publish section calendar."));
    }
}

/**
 * GET /{role}/timetable/calendars/{calendarId}/days?from=...&to=...
 */
export async function getCalendarDays(
    calendarId: number,
    from: string,
    to: string
): Promise<CalendarDayResponse[]> {
    if (!calendarId || calendarId <= 0) return [];
    try {
        const response = await api.get<unknown>(
            `${getServiceBaseUrl()}/timetable/calendars/${calendarId}/days`,
            { params: { from, to } }
        );
        return asArray(response.data).map(normalizeCalendarDay);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load calendar days."));
    }
}

/**
 * PUT /{role}/timetable/calendars/{calendarId}/days
 */
export async function upsertCalendarDay(
    calendarId: number,
    request: CalendarDayRequest
): Promise<CalendarDayResponse> {
    if (!calendarId || calendarId <= 0) {
        throw new Error("Invalid calendar ID.");
    }
    if (!request.calendarDate) {
        throw new Error("Calendar date is required.");
    }

    try {
        const response = await api.put<unknown>(
            `${getServiceBaseUrl()}/timetable/calendars/${calendarId}/days`,
            request
        );
        return normalizeCalendarDay(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to save calendar day settings."));
    }
}

/**
 * GET /{role}/filter/academic-year
 */
export async function getAcademicYearFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/filter/academic-year`);
        return asArray(response.data)
            .map((item) => {
                const rec = asRecord(item);
                return {
                    id: Number(rec.id) || 0,
                    name: String(rec.name ?? ""),
                    code: typeof rec.code === "string" ? rec.code : null,
                };
            })
            .filter((a) => a.id > 0);
    } catch {
        return [];
    }
}

/**
 * GET /{role}/filter/section
 */
export async function getSectionFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/filter/section`);
        return asArray(response.data)
            .map((item) => {
                const rec = asRecord(item);
                return {
                    id: Number(rec.id) || 0,
                    name: String(rec.name ?? ""),
                    code: typeof rec.code === "string" ? rec.code : null,
                };
            })
            .filter((s) => s.id > 0);
    } catch {
        return [];
    }
}
