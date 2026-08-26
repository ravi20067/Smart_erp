import type { Teacher } from "@/types/admin/teacher";
import TeacherRow from "./Row";

interface TeacherTableProps {
    teachers: Teacher[];
    onDelete?: (id: number) => void;
}

export default function TeacherTable({
    teachers,
    onDelete,
}: TeacherTableProps) {

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-100 dark:bg-slate-800">

                        <tr>

                            <th className="px-6 py-4 text-left">
                                Employee ID
                            </th>

                            <th className="px-6 py-4 text-left">
                                Teacher Name
                            </th>

                            <th className="px-6 py-4 text-left">
                                Gender
                            </th>

                            <th className="px-6 py-4 text-left">
                                Qualification
                            </th>

                            <th className="px-6 py-4 text-left">
                                Specialization
                            </th>

                            <th className="px-6 py-4 text-left">
                                Joining Date
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

                        {teachers.map((teacher) => (

                            <TeacherRow
                                key={teacher.id}
                                teacher={teacher}
                                onDelete={onDelete}
                            />

                        ))}

                        {teachers.length === 0 && (

                            <tr>

                                <td
                                    colSpan={9}
                                    className="text-center py-10 text-slate-500"
                                >
                                    No teachers found.
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}