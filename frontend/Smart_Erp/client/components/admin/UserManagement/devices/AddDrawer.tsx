import { X } from "lucide-react";
import DeviceForm from "./Form";
import DeviceRecipt from "./Receipt";
import { Device, DeviceFormData } from "@/types/admin/device";

interface AddDeviceDrawerProps {
    open: boolean;

    onClose: () => void;

    submitting: boolean;

    errorMsg: string;

    receiptDevice: any;

    editingDevice?: Device | null;

    formData: DeviceFormData;

    onFormChange: (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement |
            HTMLTextAreaElement
        >
    ) => void;

    onSubmit: (
        e: React.FormEvent<HTMLFormElement>
    ) => void;

    onDownloadReceipt: () => void;
}

export default function AddDeviceDrawer({
    open,
    onClose,
    submitting,
    errorMsg,
    receiptDevice,
    editingDevice,
    formData,
    onFormChange,
    onSubmit,
    onDownloadReceipt,
}: AddDeviceDrawerProps) {

    if (!open) return null;

    return (
        <>
            {/* Overlay */}

            <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={onClose}
            />

            {/* Drawer */}

            <div
                className="
                    fixed
                    top-0
                    right-0
                    z-50

                    w-[95vw]
                    sm:w-[500px]

                    h-full

                    bg-white
                    dark:bg-slate-900

                    border-l
                    border-slate-200
                    dark:border-slate-800

                    shadow-2xl

                    flex
                    flex-col

                    animate-in
                    slide-in-from-right
                    duration-200
                "
            >

                {/* Header */}

                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">

                    <div>

                        <h2 className="font-bold text-xl">

                            {editingDevice
                                ? "Edit Device"
                                : receiptDevice
                                ? "Device Receipt"
                                : "Add New Device"}

                        </h2>

                        <p className="text-xs text-slate-500 mt-1">

                            {editingDevice
                                ? "Update the details for this device"
                                : receiptDevice
                                ? "Device processed successfully"
                                : "Fill in the details to register a new device"}

                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >

                        <X size={20} />

                    </button>

                </div>

                {/* Body */}

                <div className="flex-1 overflow-y-auto p-6">

                    {errorMsg && (

                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">

                            {errorMsg}

                        </div>

                    )}

                    {receiptDevice && !editingDevice ? (

                        <DeviceRecipt
                            device={receiptDevice}
                            onDownload={onDownloadReceipt}
                            onClose={onClose}
                        />

                    ) : (

                        <DeviceForm

                            formData={formData}

                            submitting={submitting}

                            onFormChange={onFormChange}

                            onSubmit={onSubmit}

                            onCancel={onClose}

                        />

                    )}

                </div>

            </div>

        </>
    );
}