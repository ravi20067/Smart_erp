import {
    Building2,
    School,
    GraduationCap,
    Users,
} from "lucide-react";

const cards = [
    {
        title: "Total Universities",
        value: "12",
        icon: Building2,
    },
    {
        title: "Total Schools",
        value: "86",
        icon: School,
    },
    {
        title: "Total Students",
        value: "24,548",
        icon: GraduationCap,
    },
    {
        title: "Total Teachers",
        value: "1,286",
        icon: Users,
    },
];

export default function StatsCards() {
    return (
        <div
            className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-4
                md:gap-6
            "
        >
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.title}
                        className="
                            bg-white
                            dark:bg-slate-900

                            rounded-2xl
                            p-5
                            md:p-6

                            shadow-sm

                            border
                            border-slate-200
                            dark:border-slate-800

                            hover:shadow-md
                            transition-shadow
                        "
                    >
                        <div className="flex items-center justify-between">

                            {/* Information */}
                            <div className="min-w-0">

                                <p
                                    className="
                                        text-sm
                                        text-slate-500
                                        dark:text-slate-400
                                    "
                                >
                                    {card.title}
                                </p>

                                <h3
                                    className="
                                        text-2xl
                                        md:text-3xl
                                        font-bold
                                        mt-2
                                        text-slate-900
                                        dark:text-white
                                    "
                                >
                                    {card.value}
                                </h3>

                            </div>


                            {/* Icon */}
                            <div
                                className="
                                    shrink-0

                                    p-3

                                    rounded-xl

                                    bg-blue-50
                                    dark:bg-slate-800
                                "
                            >
                                <Icon
                                    size={26}
                                    className="text-primary"
                                />
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>
    );
}