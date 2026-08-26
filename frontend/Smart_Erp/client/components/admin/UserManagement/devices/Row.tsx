import { Pencil, Trash2 } from "lucide-react";
import type { Device } from "@/types/admin/device";

interface DeviceRowProps {
    device: Device;
    onEdit?: (device: Device) => void;
    onDelete?: (id: string | number) => void;
}

export default function DeviceRow({
    device,
    onEdit,
    onDelete,
}: DeviceRowProps) {
    return (
        <tr className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">

            <td className="px-6 py-4 font-medium">
                {device.id}
            </td>

            <td className="px-6 py-4">
                {device.deviceEPid}
            </td>

            <td className="px-6 py-4">
                {device.location}
            </td>

            <td className="px-6 py-4">
                {device.password}
            </td>

            <td className="px-6 py-4">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium
                        ${device.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                >
                    {device.status}
                </span>
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => onEdit?.(device)}
                        title="Edit Device"
                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition"
                    >
                        <Pencil size={18} />
                    </button>

                    <button
                        onClick={() => onDelete?.(device.id)}
                        title="Delete Device"
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}