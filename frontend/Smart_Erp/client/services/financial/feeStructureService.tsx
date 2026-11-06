import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

export type PermissionAction = string;
export type FeeFrequency = string;
export type FeeCategoryType = string;

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
    feeCategoryType: FeeCategoryType;
    componentName: string;
    amount: number;
    isMandatory: boolean;
    isRefundable: boolean;
}

export interface FeeComponent extends FeeComponentRequest {
    id: number;
}

export interface FeeStructure {
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
    lastModifiedBy: CommonDTO | null;
    permissionActions: PermissionAction[];
}

export interface FeeStructureCreateRequest {
    name: string;
    frequency: FeeFrequency;
    totalNoOfInstallments: number;
    specializationId: number[];
    components: FeeComponentRequest[];
}

export interface FeeStructureUpdateRequest {
    name: string;
    frequency: FeeFrequency;
    totalNoOfInstallments: number;
    specializationId: number[];
    componentToAdd: FeeComponentRequest[];
    componentToRemove: number[];
}

const baseUrl = () => getBaseUrl().replace(/\/+$/, "");
const feeUrl = () => `${baseUrl()}/fee-structures`;

function unwrap(value: unknown): unknown {
    let current = value;

    // Axios response.data may itself contain an API { data: ... } wrapper.
    for (let depth = 0; depth < 3; depth += 1) {
        if (
            current &&
            typeof current === "object" &&
            !Array.isArray(current) &&
            "data" in current
        ) {
            current = (current as Record<string, unknown>).data;
        } else {
            break;
        }
    }

    return current;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function normalizeCommon(value: unknown): CommonDTO | null {
    const item = asRecord(value);
    if (!item) return null;

    const id = Number(item.id);
    if (!Number.isSafeInteger(id) || id <= 0) return null;

    return {
        id,
        name: typeof item.name === "string" ? item.name : "",
        code: typeof item.code === "string" ? item.code : null,
    };
}

function normalizeComponent(value: unknown): FeeComponent {
    const item = asRecord(value);

    if (!item) {
        throw new Error("The server returned an invalid fee component.");
    }

    const id = Number(item.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("A fee component returned by the server has no valid ID.");
    }

    return {
        id,
        feeCategoryType:
            typeof item.feeCategoryType === "string"
                ? item.feeCategoryType
                : "",
        componentName:
            typeof item.componentName === "string"
                ? item.componentName
                : "",
        amount: Number(item.amount),
        isMandatory: item.isMandatory === true,
        isRefundable: item.isRefundable === true,
    };
}

function normalizeStructure(value: unknown): FeeStructure {
    const item = asRecord(value);

    if (!item) {
        throw new Error("The server returned an invalid fee structure.");
    }

    const id = Number(item.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("A fee structure returned by the server has no valid ID.");
    }

    if (!Array.isArray(item.feeComponent)) {
        throw new Error(
            `Fee structure ${id} has an invalid feeComponent response.`,
        );
    }

    if (!Array.isArray(item.specialization)) {
        throw new Error(
            `Fee structure ${id} has an invalid specialization response.`,
        );
    }

    const components = item.feeComponent.map(normalizeComponent);
    const specializations = item.specialization.map(normalizeCommon);

    return {
        id,
        name: typeof item.name === "string" ? item.name : "",
        frequency: typeof item.frequency === "string" ? item.frequency : "",
        totalNoOfInstallments: Number(item.totalNoOfInstallments),
        feeComponent: components,
        specialization: specializations.filter(
            (value): value is CommonDTO => value !== null,
        ),
        courses: normalizeCommon(item.courses),
        department: normalizeCommon(item.department),
        school: normalizeCommon(item.school),
        university: normalizeCommon(item.university),
        academicYear: normalizeCommon(item.academicYear),
        lastModifiedBy: normalizeCommon(item.lastModifiedBy),
        permissionActions: Array.isArray(item.permissionActions)
            ? item.permissionActions.filter(
                (action): action is string => typeof action === "string",
            )
            : [],
    };
}

function normalizeEnumOptions(value: unknown): FeeEnumOption[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((entry) => {
        const item = asRecord(entry);
        if (!item) return [];

        const enumValue =
            typeof item.enumValue === "string" ? item.enumValue : "";
        const name = typeof item.name === "string" ? item.name : enumValue;

        if (!enumValue) return [];

        return [{ name, enumValue }];
    });
}

export function extractErrorMessage(error: unknown): string {
    const fallback = "An unexpected error occurred. Please try again.";

    if (!error || typeof error !== "object") return fallback;

    const err = error as {
        message?: string;
        response?: {
            status?: number;
            data?: unknown;
        };
    };

    const responseData = err.response?.data;
    const body = asRecord(responseData);

    if (typeof responseData === "string" && responseData.trim()) {
        return responseData.trim();
    }

    if (body) {
        for (const key of [
            "message",
            "error",
            "detail",
            "description",
            "title",
        ]) {
            const message = body[key];

            if (typeof message === "string" && message.trim()) {
                return message.trim();
            }
        }

        if (Array.isArray(body.errors)) {
            const messages = body.errors.map((entry) => {
                if (typeof entry === "string") return entry;

                const fieldError = asRecord(entry);
                return typeof fieldError?.defaultMessage === "string"
                    ? fieldError.defaultMessage
                    : "";
            }).filter(Boolean);

            if (messages.length) return messages.join(", ");
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
            return "The requested resource or API endpoint was not found.";
        case 409:
            return "This operation conflicts with existing data.";
        default:
            break;
    }

    if (err.response?.status && err.response.status >= 500) {
        return "The server encountered an error. Please try again later.";
    }

    if (err.message === "Network Error") {
        return "Unable to connect to the server. Check your network connection.";
    }

    return err.message?.trim() || fallback;
}

export function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}

export function formatCurrency(value: number): string {
    if (!Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
}

export function hasPermission(
    item: Pick<FeeStructure, "permissionActions">,
    action: PermissionAction,
): boolean {
    return item.permissionActions.includes(action);
}

/** GET /{role}/fee-structures */
export async function getFeeStructures(): Promise<FeeStructure[]> {
    const response = await api.get(feeUrl());
    const data = unwrap(response.data);

    if (!Array.isArray(data)) {
        throw new Error(
            "Invalid fee structure response: expected a list from the server.",
        );
    }

    return data.map(normalizeStructure);
}

/** GET /{role}/fee-structures/enums */
export async function getFeeEnums(): Promise<FeeEnums> {
    const response = await api.get(`${feeUrl()}/enums`);
    const data = unwrap(response.data);
    const body = asRecord(data);

    if (!body) {
        throw new Error("Invalid enum response from the server.");
    }

    return {
        feeFrequency: normalizeEnumOptions(body.feeFrequency),
        feeComponentType: normalizeEnumOptions(body.feeComponentType),
    };
}

/** GET /{role}/filter/courses */
export async function getCourseFilter(): Promise<CommonDTO[]> {
    const response = await api.get(`${baseUrl()}/filter/courses`);
    const data = unwrap(response.data);

    if (!Array.isArray(data)) {
        throw new Error(
            "Invalid course-filter response: expected a List<CommonDTO>.",
        );
    }

    return data
        .map(normalizeCommon)
        .filter((value): value is CommonDTO => value !== null);
}

/** GET /{role}/fee-structures/specialization/filter?courseId=... */
export async function getSpecializationFilter(
    courseId: number,
): Promise<CommonDTO[]> {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        throw new Error("Select a valid course before loading specializations.");
    }

    const response = await api.get(
        `${feeUrl()}/specialization/filter`,
        { params: { courseId } },
    );

    const data = unwrap(response.data);

    if (!Array.isArray(data)) {
        throw new Error(
            "Invalid specialization response: expected a list from the server.",
        );
    }

    return data
        .map(normalizeCommon)
        .filter((value): value is CommonDTO => value !== null);
}

/** POST /{role}/fee-structures?courseId=... */
export async function createFeeStructure(
    courseId: number,
    request: FeeStructureCreateRequest,
): Promise<FeeStructure> {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        throw new Error("Select a valid course.");
    }

    const response = await api.post(
        feeUrl(),
        request,
        { params: { courseId } },
    );

    return normalizeStructure(unwrap(response.data));
}

/** PUT /{role}/fee-structures?id=... */
export async function updateFeeStructure(
    id: number,
    request: FeeStructureUpdateRequest,
): Promise<FeeStructure> {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Invalid fee structure ID.");
    }

    const response = await api.put(
        feeUrl(),
        request,
        { params: { id } },
    );

    return normalizeStructure(unwrap(response.data));
}

/** DELETE /{role}/fee-structures?id=... */
export async function deleteFeeStructure(id: number): Promise<void> {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error("Invalid fee structure ID.");
    }

    await api.delete(feeUrl(), { params: { id } });
}