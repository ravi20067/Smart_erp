import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Student } from "@/types/admin/student";

interface StudentRowProps {
    student: Student;
    onDelete?: (id: number) => void;
}

export default function StudentRow({
    student,
    onDelete,
}: StudentRowProps) {
    return (
        <tr className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">

            <td className="px-6 py-4 font-medium">
                {student.admissionNo}
            </td>

            <td className="px-6 py-4">
                {student.rollNo}
            </td>

            <td className="px-6 py-4">

                <div className="flex items-center gap-3">

                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0)}
                    </div>

                    <div>

                        <p className="font-medium">
                            {student.name}
                        </p>

                        <p className="text-xs text-slate-500">
                            {student.gender}
                        </p>

                    </div>

                </div>

            </td>

            <td className="px-6 py-4">
                {student.dateOfBirth}
            </td>

            <td className="px-6 py-4">
                {student.className}-{student.section}
            </td>

            <td className="px-6 py-4">
                {student.phone}
            </td>

            <td className="px-6 py-4">
                {student.email}
            </td>

            <td className="px-6 py-4">

                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium
                        ${student.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                >
                    {student.status}
                </span>

            </td>

            <td className="px-6 py-4">

                <div className="flex justify-center gap-2">

                    <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <Eye size={18} />
                    </button>

                    <button className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition">
                        <Pencil size={18} />
                    </button>

                    <button
                        onClick={() => onDelete?.(student.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition"
                    >
                        <Trash2 size={18} />
                    </button>

                </div>

            </td>

        </tr>
    );
}