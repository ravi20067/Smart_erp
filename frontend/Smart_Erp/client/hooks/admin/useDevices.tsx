import { useEffect, useState } from "react";

import type {
    Device,
    DeviceFormData,
} from "@/types/admin/device";
import { addDevice, getDevices, updateDevice, deleteDevice } from "@/services/admin/deviceService";

export default function useDevices() {
    useEffect(() => {
        loadDevices();
    }, []);

    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [addDeviceOpen, setAddDeviceOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [receiptDevice, setReceiptDevice] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const filteredDevices = deviceList;

    const [formData, setFormData] = useState<DeviceFormData>({
        location: "",
        password: ""
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCloseAddDevice = () => {
        setAddDeviceOpen(false);
        setEditingDevice(null);
        setReceiptDevice(null);
        setErrorMsg("");
        setFormData({
            location: "",
            password: ""
        });
    };

    const handleEditDevice = (device: Device) => {
        setEditingDevice(device);
        setFormData({
            location: device.location || "",
            password: device.password || ""
        });
        setErrorMsg("");
        setReceiptDevice(null);
        setAddDeviceOpen(true);
    };

    const loadDevices = async () => {
        setLoadingDevices(true);
        try {
            const data = await getDevices();
            setDeviceList(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDevices(false);
        }
    };

    const handleAddDeviceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg("");
        try {
            if (editingDevice) {
                await updateDevice(editingDevice.id, formData);
                setEditingDevice(null);
                setAddDeviceOpen(false);
                await loadDevices();
            } else {
                const data = await addDevice(formData);
                if (data) {
                    const newDevice: Device = {
                        id: data.id || Date.now(),
                        deviceEPid: data.deviceEPid || "",
                        location: data.location || "",
                        password: data.password || "",
                        status: data.status || "Active"
                    };
                    setReceiptDevice(newDevice);
                    await loadDevices();
                }
            }
        } catch (err: any) {
            console.error("Error saving device:", err);
            setErrorMsg(err.response?.data?.message || `Failed to ${editingDevice ? "update" : "add"} device. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDevice = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to delete this device?")) {
            return;
        }
        try {
            await deleteDevice(id);
            setDeviceList((prev) => prev.filter((d) => d.id !== id));
            await loadDevices();
        } catch (err: any) {
            console.error("Error deleting device:", err);
            alert(err.response?.data?.message || "Failed to delete device.");
        }
    };

    const handleDownloadReceipt = (device?: any) => {
        const data = device || receiptDevice;
        if (!data) return;
        const content = `
==================================================
              ACADEMY ELITE SCHOOL
             DEVICE REGISTRATION RECEIPT
==================================================
Date Generated : ${new Date().toLocaleDateString()}
--------------------------------------------------
Device EPid   : ${data.deviceEPid}
Location     : ${data.location}
Password     : ${data.password}
--------------------------------------------------
Status         : PROCESSED & ENROLLED
==================================================
Thank you for registering at Academy Elite.
Please retain this copy for future reference.
==================================================
`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `device_registration_receipt_${data.deviceEPid || "device"}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return {
        // Data
        deviceList,
        filteredDevices,
        formData,
        receiptDevice,
        editingDevice,

        // Loading
        loadingDevices,
        submitting,

        // Drawer
        addDeviceOpen,
        setAddDeviceOpen,

        // Error
        errorMsg,

        // Actions
        handleFormChange,
        handleCloseAddDevice,
        handleEditDevice,
        handleDeleteDevice,
        handleAddDeviceSubmit,
        handleDownloadReceipt,

        // Refresh
        setDeviceList,
    };
}