import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";

export interface FaceStatusResponse {
  studentId: number;
  studentName: string;
  registrationNumber: string;
  hasEnrolledFace: boolean;
  hasProfilePhoto: boolean;
  enrolledAt?: string;
  algorithm?: string;
  dimension?: number;
}

export interface FaceStatusSummary {
  enrolled: boolean;
  algorithm?: string;
  dimension?: number;
  enrolledAt?: string;
}

const getAdminAttendanceBase = (): string => {
  const base = getBaseUrl().replace(/\/+$/, "");
  const allowedBase = base === "/admin" || base === "/super-admin" ? base : "/super-admin";
  return `${allowedBase}/attendance`;
};

export const adminFaceService = {
  getFaceStatus: async (studentId: number): Promise<FaceStatusResponse> => {
    const res = await api.get(`${getAdminAttendanceBase()}/students/${studentId}/face-status`);
    return res.data;
  },

  getFaceStatusMap: async (): Promise<Record<number, FaceStatusSummary>> => {
    const res = await api.get(`${getAdminAttendanceBase()}/students/face-status-map`);
    return res.data || {};
  },

  enrollFaceFromPhoto: async (studentId: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`${getAdminAttendanceBase()}/students/${studentId}/enroll-face/from-photo`);
    return res.data;
  },

  enrollFaceWithFile: async (studentId: number, file: File): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`${getAdminAttendanceBase()}/students/${studentId}/enroll-face`, formData);
    return res.data;
  },

  deleteFaceTemplate: async (studentId: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`${getAdminAttendanceBase()}/students/${studentId}/face-template`);
    return res.data;
  },
};
