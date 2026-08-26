import type { Device } from "@/types/admin/device";
import DeviceRow from "./Row";

interface DeviceTableProps {
    devices: Device[];
    onEdit?: (device: Device) => void;
    onDelete?: (id: string | number) => void;
}

export default function DevicesTable({
    devices,
    onEdit,
    onDelete,
}: DeviceTableProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-left">
                                id
                            </th>
                            <th className="px-6 py-4 text-left">
                                EP id
                            </th>
                            <th className="px-6 py-4 text-left">
                                Location
                            </th>
                            <th className="px-6 py-4 text-left">
                                Password
                            </th>
                            <th className="px-6 py-4 text-left">
                                Status
                            </th>
                            <th className="px-6 py-4 text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((device) => (
                            <DeviceRow
                                key={device.id}
                                device={device}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}