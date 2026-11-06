// src/services/infrastructure/roomService.ts

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

export type PermissionAction = "UPDATE" | "DELETE" | string;

export interface CommonDTO {
  id: number;
  name: string;
  code: string;
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
  buildingName: string;
  floorNumber: number;
  rows: number;
  columns: number;
  capacity: number;
  roomType: RoomType;
  hasProjector: boolean;
  hasComputers: boolean;
  permissionActions?: PermissionAction[] | null;
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

    const message =
      body.message ??
      body.error ??
      body.detail ??
      body.description;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }

    if (Array.isArray(body.errors)) {
      const messages = body.errors
        .map((item) => {
          if (typeof item === "string") return item;

          if (item && typeof item === "object") {
            const value = item as Record<string, unknown>;
            return value.defaultMessage ?? value.message;
          }

          return "";
        })
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0
        );

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
  }

  switch (err.response?.status) {
    case 400: return "The request is invalid. Please check the entered information.";
    case 401: return "Your session has expired. Please log in again.";
    case 403: return "You do not have permission to perform this action.";
    case 404: return "The requested room or resource was not found.";
    case 409: return "This room number already exists or conflicts with another record.";
    case 422: return "The server could not process the provided information.";
    case 500: return "A server error occurred. Please try again later.";
    default: return err.message?.trim() || fallback;
  }
}

/* -------------------------------------------------------------------------- */
/* Response normalization                                                     */
/* -------------------------------------------------------------------------- */

function normalizeRoomList(response: unknown): RoomResponse[] {
  let result = response;

  if (result && typeof result === "object" && !Array.isArray(result)) {
    const object = result as Record<string, unknown>;

    if (Array.isArray(object.data)) {
      result = object.data;
    } else if (Array.isArray(object.content)) {
      result = object.content;
    }
  }

  if (!Array.isArray(result)) {
    throw new Error("Unexpected room response. Expected a list of rooms.");
  }

  return result as RoomResponse[];
}

function normalizeCommonList(response: unknown): CommonDTO[] {
  let result = response;

  if (result && typeof result === "object" && !Array.isArray(result)) {
    const object = result as Record<string, unknown>;

    if (Array.isArray(object.data)) {
      result = object.data;
    } else if (Array.isArray(object.content)) {
      result = object.content;
    }
  }

  if (!Array.isArray(result)) {
    throw new Error("Unexpected filter response. Expected a list.");
  }

  return result as CommonDTO[];
}

/* -------------------------------------------------------------------------- */
/* API Methods                                                                */
/* -------------------------------------------------------------------------- */

export async function getAllRooms(): Promise<RoomResponse[]> {
  const response = await api.get(getRoomUrl());
  return normalizeRoomList(response.data);
}

export async function getSchoolFilter(): Promise<CommonDTO[]> {
  const response = await api.get(`${getFilterUrl()}/school`);
  return normalizeCommonList(response.data);
}

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

  const response = await api.post(getRoomUrl(), payload, {
    params: { schoolId },
  });

  return response.data as RoomResponse;
}

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

  const response = await api.put(getRoomUrl(), payload, {
    params: { roomId },
  });

  return response.data as RoomResponse;
}

export async function deleteRoom(roomId: number): Promise<string> {
  if (!Number.isFinite(roomId) || roomId <= 0) {
    throw new Error("A valid room ID is required for deletion.");
  }

  const response = await api.delete(getRoomUrl(), {
    params: { roomId },
  });

  if (typeof response.data === "string") return response.data;

  if (response.data && typeof response.data === "object") {
    const body = response.data as Record<string, unknown>;
    const message = body.message ?? body.data;
    if (typeof message === "string") return message;
  }

  return "Room deleted successfully.";
}