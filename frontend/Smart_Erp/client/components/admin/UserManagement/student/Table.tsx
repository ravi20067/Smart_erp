import {
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";

import type { Student } from "@/types/admin/student";
import StudentRow from "./Row";

import StudentPagination from "@/components/admin/UserManagement/student/Pagination";

interface StudentTableProps {
    students: Student[];
    onDelete?: (id: number) => void;
}

export default function StudentTable({
    students,
    onDelete,
}: StudentTableProps) {

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-100 dark:bg-slate-800">

                        <tr>

                            <th className="px-6 py-4 text-left">
                                Admission
                            </th>

                            <th className="px-6 py-4 text-left">
                                Roll
                            </th>

                            <th className="px-6 py-4 text-left">
                                Student Name
                            </th>

                            <th className="px-6 py-4 text-left">
                                Date of Birth
                            </th>

                            <th className="px-6 py-4 text-left">
                                Class
                            </th>

                            <th className="px-6 py-4 text-left">
                                Phone
                            </th>

                            <th className="px-6 py-4 text-left">
                                Email
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

                        {students.map((student) => (

                            <StudentRow
                                key={student.id}
                                student={student}
                                onDelete={onDelete}
                            />

                        ))}

                        {students.length === 0 && (

                            <tr>

                                <td
                                    colSpan={9}
                                    className="text-center py-10 text-slate-500"
                                >
                                    No students found.
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}