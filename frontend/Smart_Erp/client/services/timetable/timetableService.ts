import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types & Enums                                                              */
/* -------------------------------------------------------------------------- */

export const TIMETABLE_SCOPES = ["SECTION", "SECTION_GROUP"] as const;
export type TimetableScope = (typeof TIMETABLE_SCOPES)[number];

export const TIMETABLE_VERSION_STATUSES = [
    "DRAFT",
    "PUBLISHED",
    "SUPERSEDED",
    "ARCHIVED",
] as const;
export type TimetableVersionStatus = (typeof TIMETABLE_VERSION_STATUSES)[number];

export const TIMETABLE_ENTRY_TYPES = [
    "THEORY",
    "PRACTICAL",
    "LABORATORY",
    "TUTORIAL",
    "ACTIVITY",
    "OTHER",
] as const;
export type TimetableEntryType = (typeof TIMETABLE_ENTRY_TYPES)[number];

export const WEEK_DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const OVERRIDE_ACTIONS = ["REPLACE", "CANCEL", "ADD"] as const;
export type OverrideAction = (typeof OVERRIDE_ACTIONS)[number];

export const OVERRIDE_APPROVAL_MODES = ["REQUIRES_APPROVAL", "IMMEDIATE"] as const;
export type OverrideApprovalMode = (typeof OVERRIDE_APPROVAL_MODES)[number];

export const OVERRIDE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
export type OverrideStatus = (typeof OVERRIDE_STATUSES)[number];

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface EntryRequest {
    dayOfWeek: WeekDay;
    basePeriodId: number;
    subjectId: number;
    teacherEnrollmentId: number;
    teacherId?: number | null;
    teacherName?: string | null;
    subjectName?: string | null;
    roomId?: number | null;
    entryType: TimetableEntryType;
    remarks?: string | null;
}

export interface TimetableVersionRequest {
    scope: TimetableScope;
    sectionId?: number | null;
    sectionGroupId?: number | null;
    baseTimeTableId: number;
    name: string;
    description?: string | null;
    effectiveFrom: string; // YYYY-MM-DD
    effectiveUntil?: string | null;
    entries: EntryRequest[];
}

export interface EntryResponse {
    id?: number;
    basePeriodId: number;
    subjectId: number;
    subjectName?: string | null;
    teacherEnrollmentId: number;
    teacherId?: number | null;
    teacherName?: string | null;
    roomId?: number | null;
    roomNumber?: string | null;
    dayOfWeek: WeekDay;
    entryType: TimetableEntryType;
    remarks?: string | null;
    active?: boolean;
}

export interface TimetableVersionResponse {
    id: number;
    sectionId?: number | null;
    sectionGroupId?: number | null;
    baseTimeTableId: number;
    scope: TimetableScope;
    versionNumber: number;
    name: string;
    description?: string | null;
    status: TimetableVersionStatus;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    publishedAt?: string | null;
    entries: EntryResponse[];
}

export interface OverrideDetailRequest {
    basePeriodId?: number;
    subjectId?: number;
    teacherEnrollmentId?: number;
    roomId?: number;
    entryType?: TimetableEntryType;
    remarks?: string;
}

export interface OverrideRequest {
    sectionId: number;
    sectionGroupId?: number | null;
    overrideDate: string; // YYYY-MM-DD
    action: OverrideAction;
    approvalMode: OverrideApprovalMode;
    originalEntryId?: number | null;
    reason: string;
    basePeriodId?: number | null;
    subjectId?: number | null;
    teacherEnrollmentId?: number | null;
    roomId?: number | null;
    entryType?: TimetableEntryType | null;
    remarks?: string | null;
}

export interface OverrideDetailResponse {
    id?: number;
    basePeriodId?: number | null;
    subjectId?: number | null;
    subjectName?: string | null;
    teacherEnrollmentId?: number | null;
    teacherId?: number | null;
    teacherName?: string | null;
    roomId?: number | null;
    roomNumber?: string | null;
    entryType?: TimetableEntryType | null;
    remarks?: string | null;
}

export interface OverrideResponse {
    id: number;
    sectionId: number;
    sectionGroupId?: number | null;
    originalEntryId?: number | null;
    approvedByUserId?: number | null;
    supersedesOverrideId?: number | null;
    overrideDate: string;
    action: OverrideAction;
    approvalMode: OverrideApprovalMode;
    status: OverrideStatus;
    reason: string;
    revisionNumber: number;
    approvedAt?: string | null;
    detail?: OverrideDetailResponse | null;
}

export interface TimetableSlotView {
    entryId?: number | null;
    sequenceNumber: number;
    periodNumber?: number | null;
    periodLabel: string;
    startTime: string;
    endTime: string;
    subject?: string | null;
    teacher?: string | null;
    room?: string | null;
    entryType?: TimetableEntryType | null;
    note?: string | null;
    overridden: boolean;
}

export interface TimetableView {
    date: string;
    open: boolean;
    dayTitle?: string | null;
    closureReason?: string | null;
    timetableVersionId?: number | null;
    versionNumber?: number | null;
    versionName?: string | null;
    slots: TimetableSlotView[];
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

    if (status === 400) return "Invalid request. Please check entered periods, scope, and parameters.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to manage this timetable schedule.";
    if (status === 404) return "The requested timetable version, section, or day was not found.";
    if (status === 409) return "Conflict detected with an existing timetable schedule or room/teacher allocation.";
    if (status === 422) return "The submitted timetable schedule could not be processed.";
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

export function normalizeEntryResponse(value: unknown): EntryResponse {
    const item = asRecord(value);
    return {
        id: Number(item.id) || undefined,
        basePeriodId: Number(item.basePeriodId) || 0,
        subjectId: Number(item.subjectId) || 0,
        subjectName: typeof item.subjectName === "string" ? item.subjectName : null,
        teacherEnrollmentId: Number(item.teacherEnrollmentId) || 0,
        teacherId: item.teacherId != null ? Number(item.teacherId) : null,
        teacherName: typeof item.teacherName === "string" ? item.teacherName : null,
        roomId: item.roomId != null ? Number(item.roomId) : null,
        roomNumber: typeof item.roomNumber === "string" ? item.roomNumber : null,
        dayOfWeek: (String(item.dayOfWeek ?? "MONDAY").toUpperCase() as WeekDay) || "MONDAY",
        entryType: (String(item.entryType ?? "THEORY").toUpperCase() as TimetableEntryType) || "THEORY",
        remarks: typeof item.remarks === "string" ? item.remarks : null,
        active: item.active !== false,
    };
}

export function normalizeTimetableVersion(value: unknown): TimetableVersionResponse {
    const item = asRecord(value);
    return {
        id: Number(item.id) || 0,
        sectionId: item.sectionId != null ? Number(item.sectionId) : null,
        sectionGroupId: item.sectionGroupId != null ? Number(item.sectionGroupId) : null,
        baseTimeTableId: Number(item.baseTimeTableId) || 0,
        scope: (String(item.scope ?? "SECTION").toUpperCase() as TimetableScope) || "SECTION",
        versionNumber: Number(item.versionNumber) || 1,
        name: String(item.name ?? ""),
        description: typeof item.description === "string" ? item.description : null,
        status: (String(item.status ?? "DRAFT").toUpperCase() as TimetableVersionStatus) || "DRAFT",
        effectiveFrom: String(item.effectiveFrom ?? ""),
        effectiveUntil: typeof item.effectiveUntil === "string" ? item.effectiveUntil : null,
        publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : null,
        entries: asArray(item.entries).map(normalizeEntryResponse),
    };
}

export function normalizeOverride(value: unknown): OverrideResponse {
    const item = asRecord(value);
    const detailObj = asRecord(item.detail);
    const hasDetail = Object.keys(detailObj).length > 0;

    return {
        id: Number(item.id) || 0,
        sectionId: Number(item.sectionId) || 0,
        sectionGroupId: item.sectionGroupId != null ? Number(item.sectionGroupId) : null,
        originalEntryId: item.originalEntryId != null ? Number(item.originalEntryId) : null,
        approvedByUserId: item.approvedByUserId != null ? Number(item.approvedByUserId) : null,
        supersedesOverrideId: item.supersedesOverrideId != null ? Number(item.supersedesOverrideId) : null,
        overrideDate: String(item.overrideDate ?? ""),
        action: (String(item.action ?? "REPLACE").toUpperCase() as OverrideAction) || "REPLACE",
        approvalMode: (String(item.approvalMode ?? "REQUIRES_APPROVAL").toUpperCase() as OverrideApprovalMode) || "REQUIRES_APPROVAL",
        status: (String(item.status ?? "PENDING").toUpperCase() as OverrideStatus) || "PENDING",
        reason: String(item.reason ?? ""),
        revisionNumber: Number(item.revisionNumber) || 1,
        approvedAt: typeof item.approvedAt === "string" ? item.approvedAt : null,
        detail: hasDetail
            ? {
                id: Number(detailObj.id) || undefined,
                basePeriodId: detailObj.basePeriodId != null ? Number(detailObj.basePeriodId) : null,
                subjectId: detailObj.subjectId != null ? Number(detailObj.subjectId) : null,
                subjectName: typeof detailObj.subjectName === "string" ? detailObj.subjectName : null,
                teacherEnrollmentId: detailObj.teacherEnrollmentId != null ? Number(detailObj.teacherEnrollmentId) : null,
                teacherId: detailObj.teacherId != null ? Number(detailObj.teacherId) : null,
                teacherName: typeof detailObj.teacherName === "string" ? detailObj.teacherName : null,
                roomId: detailObj.roomId != null ? Number(detailObj.roomId) : null,
                roomNumber: typeof detailObj.roomNumber === "string" ? detailObj.roomNumber : null,
                entryType: detailObj.entryType ? (String(detailObj.entryType).toUpperCase() as TimetableEntryType) : null,
                remarks: typeof detailObj.remarks === "string" ? detailObj.remarks : null,
            }
            : null,
    };
}

export function normalizeTimetableView(value: unknown): TimetableView {
    const item = asRecord(value);
    const slots = asArray(item.slots).map((s) => {
        const slot = asRecord(s);
        return {
            entryId: slot.entryId != null ? Number(slot.entryId) : null,
            sequenceNumber: Number(slot.sequenceNumber) || 1,
            periodNumber: slot.periodNumber != null ? Number(slot.periodNumber) : null,
            periodLabel: String(slot.periodLabel ?? ""),
            startTime: String(slot.startTime ?? ""),
            endTime: String(slot.endTime ?? ""),
            subject: typeof slot.subject === "string" ? slot.subject : null,
            teacher: typeof slot.teacher === "string" ? slot.teacher : null,
            room: typeof slot.room === "string" ? slot.room : null,
            entryType: slot.entryType ? (String(slot.entryType).toUpperCase() as TimetableEntryType) : null,
            note: typeof slot.note === "string" ? slot.note : null,
            overridden: slot.overridden === true,
        };
    });

    return {
        date: String(item.date ?? ""),
        open: item.open !== false,
        dayTitle: typeof item.dayTitle === "string" ? item.dayTitle : null,
        closureReason: typeof item.closureReason === "string" ? item.closureReason : null,
        timetableVersionId: item.timetableVersionId != null ? Number(item.timetableVersionId) : null,
        versionNumber: item.versionNumber != null ? Number(item.versionNumber) : null,
        versionName: typeof item.versionName === "string" ? item.versionName : null,
        slots,
    };
}

/* -------------------------------------------------------------------------- */
/* API Service Functions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * POST /{role}/timetable/versions
 */
export async function createTimetableVersion(
    request: TimetableVersionRequest
): Promise<TimetableVersionResponse> {
    if (!request.name || !request.name.trim()) {
        throw new Error("Version name is required.");
    }
    if (!request.baseTimeTableId || request.baseTimeTableId <= 0) {
        throw new Error("Please select a base timetable template.");
    }
    if (request.scope === "SECTION" && (!request.sectionId || request.sectionId <= 0)) {
        throw new Error("Please select a section for Section scope.");
    }
    if (request.scope === "SECTION_GROUP" && (!request.sectionGroupId || request.sectionGroupId <= 0)) {
        throw new Error("Please select a section group for Section Group scope.");
    }
    if (!request.effectiveFrom) {
        throw new Error("Effective from date is required.");
    }

    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/timetable/versions`,
            request
        );
        return normalizeTimetableVersion(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to create timetable version."));
    }
}

/**
 * GET /{role}/timetable/sections/{sectionId}/versions
 */
export async function getSectionTimetableVersions(
    sectionId: number
): Promise<TimetableVersionResponse[]> {
    if (!sectionId || sectionId <= 0) return [];
    try {
        const response = await api.get<unknown>(
            `${getServiceBaseUrl()}/timetable/sections/${sectionId}/versions`
        );
        return asArray(response.data)
            .map(normalizeTimetableVersion)
            .filter((v) => v.id > 0);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load section timetable versions."));
    }
}

/**
 * GET /{role}/timetable/section-groups/{groupId}/versions
 */
export async function getGroupTimetableVersions(
    groupId: number
): Promise<TimetableVersionResponse[]> {
    if (!groupId || groupId <= 0) return [];
    try {
        const response = await api.get<unknown>(
            `${getServiceBaseUrl()}/timetable/section-groups/${groupId}/versions`
        );
        return asArray(response.data)
            .map(normalizeTimetableVersion)
            .filter((v) => v.id > 0);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load group timetable versions."));
    }
}

/**
 * POST /{role}/timetable/versions/{versionId}/publish
 */
export async function publishTimetableVersion(
    versionId: number
): Promise<TimetableVersionResponse> {
    if (!versionId || versionId <= 0) {
        throw new Error("Invalid timetable version ID.");
    }
    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/timetable/versions/${versionId}/publish`
        );
        return normalizeTimetableVersion(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to publish timetable version."));
    }
}

/**
 * POST /{role}/timetable/overrides
 */
export async function submitTimetableOverride(
    request: OverrideRequest
): Promise<OverrideResponse> {
    if (!request.sectionId || request.sectionId <= 0) {
        throw new Error("Section ID is required.");
    }
    if (!request.overrideDate) {
        throw new Error("Override date is required.");
    }
    if (!request.reason || !request.reason.trim()) {
        throw new Error("Reason for substitution or override is required.");
    }

    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/timetable/overrides`,
            request
        );
        return normalizeOverride(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to submit timetable override."));
    }
}

/**
 * POST /{role}/timetable/overrides/{overrideId}/approve
 */
export async function approveTimetableOverride(overrideId: number): Promise<OverrideResponse> {
    if (!overrideId || overrideId <= 0) {
        throw new Error("Invalid override ID.");
    }
    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/timetable/overrides/${overrideId}/approve`
        );
        return normalizeOverride(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to approve override."));
    }
}

/**
 * POST /{role}/timetable/overrides/{overrideId}/reject
 */
export async function rejectTimetableOverride(overrideId: number): Promise<OverrideResponse> {
    if (!overrideId || overrideId <= 0) {
        throw new Error("Invalid override ID.");
    }
    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/timetable/overrides/${overrideId}/reject`
        );
        return normalizeOverride(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to reject override."));
    }
}

/**
 * GET /{role}/timetable/sections/{sectionId}/daily?sectionGroupId=...&date=YYYY-MM-DD
 */
export async function getDailyTimetable(
    sectionId: number,
    date: string,
    sectionGroupId?: number | null
): Promise<TimetableView> {
    if (!sectionId || sectionId <= 0) {
        throw new Error("Section ID is required.");
    }
    if (!date) {
        throw new Error("Date is required.");
    }

    const params: Record<string, string | number> = { date };
    if (sectionGroupId && sectionGroupId > 0) {
        params.sectionGroupId = sectionGroupId;
    }

    try {
        const response = await api.get<unknown>(
            `${getServiceBaseUrl()}/timetable/sections/${sectionId}/daily`,
            { params }
        );
        return normalizeTimetableView(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load daily timetable."));
    }
}

/**
 * GET /{role}/filter/subject
 */
export async function getSubjectFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/filter/subject`);
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

export interface AutoGenerateTimetableRequest {
    sectionId: number;
    sectionGroupId?: number | null;
    scope?: TimetableScope;
    baseTimeTableId: number;
    academicYearId?: number | null;
    name?: string;
    description?: string | null;
    effectiveFrom: string; // YYYY-MM-DD
    effectiveUntil?: string | null;
    preferredRoomIds?: number[];
    publishImmediately?: boolean;
}

/**
 * POST /{role}/timetable/auto-generate
 */
export async function autoGenerateTimetable(
    request: AutoGenerateTimetableRequest
): Promise<TimetableVersionResponse> {
    try {
        const response = await api.post<unknown>(
            `${getServiceBaseUrl()}/auto-generate`,
            request
        );
        return normalizeTimetableVersion(response.data);
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Unable to auto-generate timetable.")
        );
    }
}

/**
 * GET /{role}/filter/teacher
 */
export async function getTeacherFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getServiceBaseUrl()}/filter/teacher`);
        return asArray(response.data)
            .map((item) => {
                const rec = asRecord(item);
                return {
                    id: Number(rec.id) || 0,
                    name: String(rec.name ?? ""),
                    code: typeof rec.code === "string" ? rec.code : null,
                };
            })
            .filter((t) => t.id > 0);
    } catch {
        return [];
    }
}

