import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Teacher } from "@/types/admin/teacher";

interface TeacherRowProps {
    teacher: Teacher;
    onDelete?: (id: number) => void;
}

export default function TeacherRow({
    teacher,
    onDelete,
}: TeacherRowProps) {

    return (
        <tr className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">

            {/* Employee ID */}

            <td className="px-6 py-4 font-medium">
                {teacher.employeeId}
            </td>

            {/* Teacher Name */}

            <td className="px-6 py-4">

                <div className="flex items-center gap-3">

                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold">

                        {teacher.firstName.charAt(0)}

                    </div>

                    <div>

                        <p className="font-medium">
                            {teacher.name}
                        </p>

                        <p className="text-xs text-slate-500">
                            {teacher.role}
                        </p>

                    </div>

                </div>

            </td>

            <td className="px-6 py-4">
                {teacher.gender}
            </td>

            {/* Qualification */}

            <td className="px-6 py-4">
                {teacher.qualification}
            </td>

            {/* Specialization */}

            <td className="px-6 py-4">
                {teacher.specialization}
            </td>

            {/* Joining Date */}

            <td className="px-6 py-4">
                {teacher.joiningDate}
            </td>

            {/* Phone */}

            <td className="px-6 py-4">
                {teacher.phone}
            </td>

            {/* Email */}

            <td className="px-6 py-4">
                {teacher.email}
            </td>

            {/* Status */}

            <td className="px-6 py-4">

                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium
                        ${teacher.status === "ACTIVE"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                >
                    {teacher.status}
                </span>

            </td>

            {/* Actions */}

            <td className="px-6 py-4">

                <div className="flex justify-center gap-2">

                    <button
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="View Teacher"
                    >
                        <Eye size={18} />
                    </button>

                    <button
                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition"
                        title="Edit Teacher"
                    >
                        <Pencil size={18} />
                    </button>

                    <button
                        onClick={() => onDelete?.(teacher.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition"
                        title="Delete Teacher"
                    >
                        <Trash2 size={18} />
                    </button>

                </div>

            </td>

        </tr>
    );
}