import api from "@/services/axiosConfig";
import { DeviceFormData } from "@/types/admin/device";

export const addDevice = async (formData: DeviceFormData) => {
    const response = await api.post(
        "/admin/device/add",
        formData
    );
    return response.data;
};

export const updateDevice = async (id: string | number, formData: DeviceFormData) => {
    const response = await api.put(
        `/admin/device/${id}`,
        formData
    );
    return response.data;
};

export const deleteDevice = async (id: string | number) => {
    const response = await api.delete(
        `/admin/device/${id}`
    );
    return response.data;
};

export const getDevices = async (
) => {
    const response = await api.get(
        `/admin/device/get_devices`
    );
    return response.data;
};