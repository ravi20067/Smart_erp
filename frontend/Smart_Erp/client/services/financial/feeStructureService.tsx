import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PermissionAction = string;
export type FeeFrequency =
    | "ONE_TIME"
    | "ANNUAL"
    | "SEMESTER"
    | "QUARTERLY"
    | "MONTHLY"
    | string;

export type FeeCategoryType =
    | "TUITION"
    | "ADMISSION"
    | "EXAMINATION"
    | "LABORATORY"
    | "LIBRARY"
    | "SPORTS"
    | "TRANSPORT"
    | "HOSTEL"
    | "MISCELLANEOUS"
    | string;

export interface CommonDTO {
    id: number;
    name: string;
    code?: string | null;
}

export interface FeeEnumOption {
    name: string;
    enumValue: string;
}

export interface FeeEnums {
    feeFrequency: FeeEnumOption[];
    feeComponentType: FeeEnumOption[];
}

export interface FeeComponentRequest {
    feeCategoryType: string;
    componentName: string;
    amount: number;
    isMandatory: boolean;
    isRefundable: boolean;
}

export interface FeeComponent extends FeeComponentRequest {
    id: number;
}

export interface FeeStructureResponse {
    id: number;
    name: string;
    frequency: FeeFrequency;
    totalNoOfInstallments: number;
    feeComponent: FeeComponent[];
    specialization: CommonDTO[];
    courses: CommonDTO | null;
    department: CommonDTO | null;
    school: CommonDTO | null;
    university: CommonDTO | null;
    academicYear: CommonDTO | null;
    permissionActions: PermissionAction[];
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: CommonDTO | null;
    updatedBy?: CommonDTO | null;
}

export type FeeStructure = FeeStructureResponse;

export interface FeeStructureCreateRequest {
    name: string;
    frequency: string;
    totalNoOfInstallments: number;
    specializationId: number[];
    components: FeeComponentRequest[];
}

export interface FeeStructureUpdateRequest {
    name: string;
    frequency: string;
    totalNoOfInstallments: number;
    specializationId: number[];
    componentToAdd: FeeComponentRequest[];
    componentToRemove: number[];
}

const getBase = () => getBaseUrl().replace(/\/+$/, "");
const getFeeUrl = () => `${getBase()}/fee-structures`;
const getFilterUrl = () => `${getBase()}/filter`;

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(
    error: unknown,
    fallback = "An unexpected error occurred. Please try again."
): string {
    if (typeof error === "string" && error.trim()) {
        return error.trim();
    }

    if (!error || typeof error !== "object") {
        return fallback;
    }

    const err = error as {
        message?: string;
        response?: {
            status?: number;
            data?: unknown;
        };
    };

    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data.trim();
    }

    if (data && typeof data === "object") {
        const body = data as Record<string, unknown>;

        for (const key of ["message", "error", "detail", "description", "title"]) {
            const val = body[key];
            if (typeof val === "string" && val.trim()) {
                return val.trim();
            }
        }

        if (Array.isArray(body.errors) && body.errors.length > 0) {
            const messages = body.errors
                .map((entry) => {
                    if (typeof entry === "string") return entry;
                    if (entry && typeof entry === "object") {
                        const item = entry as Record<string, unknown>;
                        return String(item.defaultMessage ?? item.message ?? item.field ?? "");
                    }
                    return "";
                })
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join(", ");
            }
        }
    }

    switch (err.response?.status) {
        case 400:
            return "The submitted data is invalid. Check the form and try again.";
        case 401:
            return "Your session has expired. Please sign in again.";
        case 403:
            return "You do not have permission to perform this action.";
        case 404:
            return "The requested fee structure or resource was not found.";
        case 409:
            return "This operation conflicts with existing academic records.";
        case 422:
            return "The server could not process the provided fee structure details.";
        case 500:
            return "A server error occurred. Please try again later.";
        default:
            return err.message?.trim() || fallback;
    }
}

/* -------------------------------------------------------------------------- */
/* Normalization helpers                                                      */
/* -------------------------------------------------------------------------- */

function ensureArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeCommon(value: unknown): CommonDTO | null {
    if (!value || typeof value !== "object") return null;
    const item = value as Record<string, unknown>;
    const id = Number(item.id);
    if (!Number.isSafeInteger(id) || id <= 0) return null;

    return {
        id,
        name: typeof item.name === "string" ? item.name.trim() : "",
        code: typeof item.code === "string" ? item.code.trim() : null,
    };
}

function normalizeComponent(value: unknown): FeeComponent {
    const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const id = Number(item.id);

    return {
        id: Number.isSafeInteger(id) && id > 0 ? id : 0,
        feeCategoryType: String(item.feeCategoryType ?? item.categoryType ?? "TUITION").trim(),
        componentName: String(item.componentName ?? "").trim(),
        amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0,
        isMandatory: item.isMandatory === true,
        isRefundable: item.isRefundable === true,
    };
}

function normalizeStructure(value: unknown): FeeStructureResponse {
    const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const id = Number(item.id);

    return {
        id: Number.isSafeInteger(id) && id > 0 ? id : 0,
        name: String(item.name ?? "").trim(),
        frequency: String(item.frequency ?? "SEMESTER").trim(),
        totalNoOfInstallments: Number.isFinite(Number(item.totalNoOfInstallments))
            ? Number(item.totalNoOfInstallments)
            : 1,
        feeComponent: ensureArray(item.feeComponent ?? item.components).map(normalizeComponent),
        specialization: ensureArray(item.specialization ?? item.specializations)
            .map(normalizeCommon)
            .filter((s): s is CommonDTO => s !== null),
        courses: normalizeCommon(item.courses ?? item.course),
        department: normalizeCommon(item.department),
        school: normalizeCommon(item.school),
        university: normalizeCommon(item.university),
        academicYear: normalizeCommon(item.academicYear),
        permissionActions: ensureArray(item.permissionActions).filter(
            (a): a is string => typeof a === "string"
        ),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
        createdBy: normalizeCommon(item.createdBy),
        updatedBy: normalizeCommon(item.updatedBy),
    };
}

function normalizeEnumOptions(value: unknown): FeeEnumOption[] {
    return ensureArray(value).flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as Record<string, unknown>;
        const enumValue = typeof item.enumValue === "string" ? item.enumValue : "";
        const name = typeof item.name === "string" ? item.name : enumValue;
        if (!enumValue) return [];
        return [{ name, enumValue }];
    });
}

/* -------------------------------------------------------------------------- */
/* API Methods                                                                */
/* -------------------------------------------------------------------------- */

/**
 * GET /{role}/fee-structures
 */
export async function getFeeStructures(): Promise<FeeStructureResponse[]> {
    try {
        const response = await api.get<unknown>(getFeeUrl());
        return ensureArray(response.data).map(normalizeStructure);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load fee structures."));
    }
}

/**
 * GET /{role}/fee-structures/enums
 */
export async function getFeeEnums(): Promise<FeeEnums> {
    try {
        const response = await api.get<unknown>(`${getFeeUrl()}/enums`);
        const body = (response.data && typeof response.data === "object" ? response.data : {}) as Record<string, unknown>;

        return {
            feeFrequency: normalizeEnumOptions(body.feeFrequency),
            feeComponentType: normalizeEnumOptions(body.feeComponentType),
        };
    } catch (error) {
        console.warn("Could not load fee enums from backend, using fallbacks:", error);
        return {
            feeFrequency: [
                { name: "One Time", enumValue: "ONE_TIME" },
                { name: "Annual", enumValue: "ANNUAL" },
                { name: "Semester", enumValue: "SEMESTER" },
                { name: "Quarterly", enumValue: "QUARTERLY" },
                { name: "Monthly", enumValue: "MONTHLY" },
            ],
            feeComponentType: [
                { name: "Tuition", enumValue: "TUITION" },
                { name: "Admission", enumValue: "ADMISSION" },
                { name: "Examination", enumValue: "EXAMINATION" },
                { name: "Laboratory", enumValue: "LABORATORY" },
                { name: "Library", enumValue: "LIBRARY" },
                { name: "Sports", enumValue: "SPORTS" },
                { name: "Transport", enumValue: "TRANSPORT" },
                { name: "Hostel", enumValue: "HOSTEL" },
                { name: "Miscellaneous", enumValue: "MISCELLANEOUS" },
            ],
        };
    }
}

/**
 * GET /{role}/filter/courses
 */
export async function getCourseFilter(): Promise<CommonDTO[]> {
    try {
        const response = await api.get<unknown>(`${getFilterUrl()}/courses`);
        return ensureArray(response.data)
            .map(normalizeCommon)
            .filter((c): c is CommonDTO => c !== null);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load course options."));
    }
}

/**
 * GET /{role}/fee-structures/academic-year/filter?courseId={courseId}
 */
export async function getAcademicYearFilter(courseId: number): Promise<CommonDTO[]> {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        return [];
    }

    try {
        const response = await api.get<unknown>(`${getFeeUrl()}/academic-year/filter`, {
            params: { courseId },
        });

        return ensureArray(response.data)
            .map(normalizeCommon)
            .filter((y): y is CommonDTO => y !== null);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load academic years for this course."));
    }
}

/**
 * GET /{role}/fee-structures/specialization/filter?courseId={courseId}&academicYearId={academicYearId}
 */
export async function getSpecializationFilter(
    courseId: number,
    academicYearId: number
): Promise<CommonDTO[]> {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        return [];
    }
    if (!Number.isSafeInteger(academicYearId) || academicYearId <= 0) {
        return [];
    }

    try {
        const response = await api.get<unknown>(`${getFeeUrl()}/specialization/filter`, {
            params: { courseId, academicYearId },
        });

        return ensureArray(response.data)
            .map(normalizeCommon)
            .filter((s): s is CommonDTO => s !== null);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to load specializations for this fee structure."));
    }
}

/**
 * POST /{role}/fee-structures?courseId={courseId}&academicYearId={academicYearId}
 */
export async function createFeeStructure(
    courseId: number,
    academicYearId: number,
    request: FeeStructureCreateRequest
): Promise<FeeStructureResponse> {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        throw new Error("Select a valid course.");
    }
    if (!Number.isSafeInteger(academicYearId) || academicYearId <= 0) {
        throw new Error("Select a valid academic year.");
    }

    try {
        const response = await api.post<unknown>(getFeeUrl(), request, {
            params: { courseId, academicYearId },
        });
        return normalizeStructure(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to create fee structure."));
    }
}

/**
 * PUT /{role}/fee-structures?id={id}
 */
export async function updateFeeStructure(
    id: number,
    request: FeeStructureUpdateRequest
): Promise<FeeStructureResponse> {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Invalid fee structure ID.");
    }

    try {
        const response = await api.put<unknown>(getFeeUrl(), request, {
            params: { id },
        });
        return normalizeStructure(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Unable to update fee structure."));
    }
}

/**
 * DELETE /{role}/fee-structures?id={id}
 */
export async function deleteFeeStructure(id: number): Promise<string> {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Invalid fee structure ID.");
    }

    try {
        await api.delete(getFeeUrl(), { params: { id } });
        return "Fee structure deleted successfully.";
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Unable to delete fee structure. It may have assigned specializations or enrolled students."
            )
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Shared Helpers                                                             */
/* -------------------------------------------------------------------------- */

export function uniqueCommonDTOs(
    items: Array<CommonDTO | null | undefined>
): CommonDTO[] {
    const unique = new Map<number, CommonDTO>();
    for (const item of items) {
        if (
            item &&
            Number.isFinite(Number(item.id)) &&
            Number(item.id) > 0 &&
            typeof item.name === "string"
        ) {
            const id = Number(item.id);
            if (!unique.has(id)) {
                unique.set(id, { ...item, id });
            }
        }
    }
    return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

export function formatCurrency(value: number): string {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatAuditActor(actor?: CommonDTO | null): string {
    if (!actor) return "System";
    const name = actor.name?.trim();
    const code = actor.code?.trim();
    if (name && code) return `${name} (${code})`;
    if (name) return name;
    if (code) return code;
    if (actor.id) return `ID: #${actor.id}`;
    return "System";
}

export function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(d);
    } catch {
        return "—";
    }
}

export function formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return "—";
    }
}

export function getInitials(name?: string): string {
    if (!name) return "FS";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "FS";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hasPermission(
    item: Pick<FeeStructureResponse, "permissionActions">,
    action: PermissionAction
): boolean {
    return Array.isArray(item.permissionActions) && item.permissionActions.includes(action);
}
