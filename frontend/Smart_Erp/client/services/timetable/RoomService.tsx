import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type RoomType =
  | "CLASSROOM"
  | "LABORATORY"
  | "SEMINAR_HALL"
  | "AUDITORIUM"
  | "VIRTUAL";

export type PermissionAction = "UPDATE" | "DELETE" | "CREATE" | "VIEW" | string;

export interface CommonDTO {
  id: number;
  name: string;
  code?: string | null;
}

export interface RoomRequest {
  roomNumber: string;
  buildingName: string;
  floorNumber: number;
  rows: number;
  columns: number;
  roomType: RoomType;
  hasProjector: boolean;
  hasComputers: boolean;
}

export interface RoomResponse {
  id: number;
  university?: CommonDTO | null;
  school?: CommonDTO | null;
  roomNumber: string;
  buildingName?: string | null;
  floorNumber?: number | null;
  rows?: number | null;
  columns?: number | null;
  capacity?: number | null;
  roomType: RoomType;
  hasProjector?: boolean | null;
  hasComputers?: boolean | null;
  permissionActions?: PermissionAction[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: CommonDTO | null;
  updatedBy?: CommonDTO | null;
}

const getRoomUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/rooms`;
const getFilterUrl = (): string => `${getBaseUrl().replace(/\/+$/, "")}/filter`;

/* -------------------------------------------------------------------------- */
/* Error handling                                                             */
/* -------------------------------------------------------------------------- */

export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
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
      const value = body[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const messages = body.errors
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const value = item as Record<string, unknown>;
            return String(value.defaultMessage ?? value.message ?? value.field ?? "");
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
      return "The request is invalid. Please check the entered information.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested room or resource was not found.";
    case 409:
      return "This room number already exists or conflicts with another record.";
    case 422:
      return "The server could not process the provided information.";
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

function normalizeCommonDTO(value: unknown): CommonDTO | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    name: String(item.name ?? "").trim(),
    code: typeof item.code === "string" ? item.code.trim() : null,
  };
}

function normalizeRoom(value: unknown): RoomResponse {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

  const idNum = Number(item.id);
  const rowsNum = Number(item.rows ?? item.rowCount);
  const colsNum = Number(item.columns ?? item.columnCount);
  const capacityNum = Number(item.capacity);

  const calculatedCapacity =
    Number.isFinite(capacityNum) && capacityNum > 0
      ? capacityNum
      : Number.isFinite(rowsNum) && Number.isFinite(colsNum) && rowsNum > 0 && colsNum > 0
      ? rowsNum * colsNum
      : null;

  return {
    id: Number.isSafeInteger(idNum) && idNum > 0 ? idNum : 0,
    roomNumber: String(item.roomNumber ?? "").trim(),
    buildingName: item.buildingName ? String(item.buildingName).trim() : null,
    floorNumber: Number.isFinite(Number(item.floorNumber)) ? Number(item.floorNumber) : null,
    rows: Number.isFinite(rowsNum) ? rowsNum : null,
    columns: Number.isFinite(colsNum) ? colsNum : null,
    capacity: calculatedCapacity,
    roomType: (String(item.roomType ?? "CLASSROOM").toUpperCase() as RoomType) || "CLASSROOM",
    hasProjector: Boolean(item.hasProjector),
    hasComputers: Boolean(item.hasComputers),
    university: normalizeCommonDTO(item.university),
    school: normalizeCommonDTO(item.school),
    permissionActions: Array.isArray(item.permissionActions)
      ? (item.permissionActions as PermissionAction[])
      : [],
    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
    createdBy: normalizeCommonDTO(item.createdBy),
    updatedBy: normalizeCommonDTO(item.updatedBy),
  };
}

function normalizeCommonList(response: unknown): CommonDTO[] {
  return ensureArray<CommonDTO>(response)
    .filter(
      (item) =>
        item &&
        Number.isFinite(Number(item.id)) &&
        Number(item.id) > 0 &&
        typeof item.name === "string"
    )
    .map((item) => ({
      id: Number(item.id),
      name: item.name.trim(),
      code: item.code ? item.code.trim() : null,
    }));
}

/* -------------------------------------------------------------------------- */
/* API Methods                                                                */
/* -------------------------------------------------------------------------- */

/**
 * GET {baseUrl}/rooms
 */
export async function getAllRooms(): Promise<RoomResponse[]> {
  try {
    const response = await api.get<unknown>(getRoomUrl());
    return ensureArray(response.data).map(normalizeRoom);
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Unable to load rooms."));
  }
}

/**
 * GET {baseUrl}/filter/school
 */
export async function getSchoolFilter(): Promise<CommonDTO[]> {
  try {
    const response = await api.get<unknown>(`${getFilterUrl()}/school`);
    return normalizeCommonList(response.data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Unable to load school options."));
  }
}

/**
 * POST {baseUrl}/rooms?schoolId={schoolId}
 */
export async function createRoom(
  schoolId: number,
  request: RoomRequest
): Promise<RoomResponse> {
  if (!Number.isFinite(schoolId) || schoolId <= 0) {
    throw new Error("A valid school is required.");
  }

  const payload: RoomRequest = {
    roomNumber: request.roomNumber.trim(),
    buildingName: request.buildingName.trim(),
    floorNumber: Number(request.floorNumber),
    rows: Number(request.rows),
    columns: Number(request.columns),
    roomType: request.roomType,
    hasProjector: Boolean(request.hasProjector),
    hasComputers: Boolean(request.hasComputers),
  };

  if (!payload.roomNumber) throw new Error("Room number is required.");

  try {
    const response = await api.post<unknown>(getRoomUrl(), payload, {
      params: { schoolId },
    });
    return normalizeRoom(response.data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Unable to create room."));
  }
}

/**
 * PUT {baseUrl}/rooms?roomId={roomId}
 */
export async function updateRoom(
  roomId: number,
  request: RoomRequest
): Promise<RoomResponse> {
  if (!Number.isFinite(roomId) || roomId <= 0) {
    throw new Error("A valid room ID is required for updating.");
  }

  const payload: RoomRequest = {
    roomNumber: request.roomNumber.trim(),
    buildingName: request.buildingName.trim(),
    floorNumber: Number(request.floorNumber),
    rows: Number(request.rows),
    columns: Number(request.columns),
    roomType: request.roomType,
    hasProjector: Boolean(request.hasProjector),
    hasComputers: Boolean(request.hasComputers),
  };

  if (!payload.roomNumber) throw new Error("Room number is required.");

  try {
    const response = await api.put<unknown>(getRoomUrl(), payload, {
      params: { roomId },
    });
    return normalizeRoom(response.data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Unable to update room."));
  }
}

/**
 * DELETE {baseUrl}/rooms?roomId={roomId}
 */
export async function deleteRoom(roomId: number): Promise<string> {
  if (!Number.isFinite(roomId) || roomId <= 0) {
    throw new Error("A valid room ID is required for deletion.");
  }

  try {
    const response = await api.delete<unknown>(getRoomUrl(), {
      params: { roomId },
    });

    if (typeof response.data === "string" && response.data.trim()) {
      return response.data.trim();
    }

    if (response.data && typeof response.data === "object") {
      const body = response.data as Record<string, unknown>;
      const message = body.message ?? body.data;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    }

    return "Room deleted successfully.";
  } catch (error) {
    throw new Error(
      extractErrorMessage(
        error,
        "Unable to delete room. It may be in use in active timetables or schedules."
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
  if (!name) return "RM";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
