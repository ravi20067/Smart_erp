import { Link, useNavigate } from "react-router-dom";
import {
    Bell,
    Settings,
    User,
    Menu,
    X,
} from "lucide-react";
import { useAuth } from "@/services/authContext";

export default function DashboardHeader({
    sidebarOpen,
    setSidebarOpen,
}) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (e) {
            console.log(e);
        } finally {
            localStorage.clear();
            navigate("/login");
        }
    };

    const notifications = [
        "Exam starts from 25 June",
        "Fee due reminder",
        "New assignment uploaded",
    ];

    return (
        <header
            className="
                sticky
                top-0
                z-[60]
                h-16
                bg-white
                dark:bg-slate-900
                border-b
                border-slate-200
                dark:border-slate-800
                shadow-sm
            "
        >
            <div
                className="
                    h-full
                    px-4
                    md:px-6
                    flex
                    items-center
                    justify-between
                "
            >

                {/* ================================================== */}
                {/* LEFT SIDE */}
                {/* ================================================== */}

                <div className="flex items-center gap-3">

                    {/* Sidebar Toggle */}
                    <button
                        type="button"
                        onClick={() =>
                            setSidebarOpen(!sidebarOpen)
                        }
                        aria-label={
                            sidebarOpen
                                ? "Close sidebar"
                                : "Open sidebar"
                        }
                        className="
                            flex
                            items-center
                            justify-center
                            w-10
                            h-10
                            rounded-xl
                            border
                            border-slate-200
                            dark:border-slate-700
                            bg-white
                            dark:bg-slate-900
                            hover:bg-slate-100
                            dark:hover:bg-slate-800
                            transition-all
                            duration-200
                            shadow-sm
                        "
                    >
                        {sidebarOpen ? (
                            <X size={22} />
                        ) : (
                            <Menu size={22} />
                        )}
                    </button>


                    {/* Logo */}
                    <div className="flex items-center gap-3">

                        <div
                            className="
                                w-9
                                h-9
                                md:w-10
                                md:h-10
                                rounded-lg
                                bg-gradient-to-r
                                from-primary
                                to-secondary
                                flex
                                items-center
                                justify-center
                                text-white
                                font-bold
                                text-sm
                                md:text-base
                            "
                        >
                            AE
                        </div>

                        <h1
                            className="
                                font-bold
                                text-base
                                md:text-lg
                                text-slate-900
                                dark:text-white
                                whitespace-nowrap
                            "
                        >
                            Academy Elite ERP
                        </h1>

                    </div>

                </div>


                {/* ================================================== */}
                {/* RIGHT SIDE */}
                {/* ================================================== */}

                <div className="flex items-center gap-1 md:gap-3">

                    {/* ============================================== */}
                    {/* Notifications */}
                    {/* ============================================== */}

                    <div className="relative group">

                        <button
                            type="button"
                            aria-label="Notifications"
                            className="
                                relative
                                flex
                                items-center
                                justify-center
                                w-10
                                h-10
                                rounded-xl
                                hover:bg-slate-100
                                dark:hover:bg-slate-800
                                transition
                            "
                        >
                            <Bell size={21} />

                            {/* Notification Badge */}
                            <span
                                className="
                                    absolute
                                    top-1.5
                                    right-1.5
                                    w-2
                                    h-2
                                    rounded-full
                                    bg-red-500
                                    border-2
                                    border-white
                                    dark:border-slate-900
                                "
                            />
                        </button>


                        {/* Notification Dropdown */}
                        <div
                            className="
                                absolute
                                right-0
                                top-11
                                w-72
                                md:w-80
                                bg-white
                                dark:bg-slate-800
                                rounded-xl
                                shadow-xl
                                border
                                border-slate-200
                                dark:border-slate-700
                                opacity-0
                                invisible
                                group-hover:opacity-100
                                group-hover:visible
                                transition-all
                                duration-200
                                overflow-hidden
                            "
                        >

                            <div
                                className="
                                    px-4
                                    py-3
                                    border-b
                                    border-slate-200
                                    dark:border-slate-700
                                    font-semibold
                                "
                            >
                                Notifications
                            </div>

                            {notifications.map(
                                (item, index) => (
                                    <div
                                        key={index}
                                        className="
                                            px-4
                                            py-3
                                            text-sm
                                            hover:bg-slate-50
                                            dark:hover:bg-slate-700
                                            transition
                                        "
                                    >
                                        {item}
                                    </div>
                                )
                            )}

                        </div>

                    </div>


                    {/* ============================================== */}
                    {/* Settings */}
                    {/* ============================================== */}

                    <Link
                        to="/settings"
                        aria-label="Settings"
                        className="
                            flex
                            items-center
                            justify-center
                            w-10
                            h-10
                            rounded-xl
                            hover:bg-slate-100
                            dark:hover:bg-slate-800
                            transition
                        "
                    >
                        <Settings size={21} />
                    </Link>


                    {/* ============================================== */}
                    {/* Profile */}
                    {/* ============================================== */}

                    <div className="relative group">

                        <button
                            type="button"
                            aria-label="Profile"
                            className="
                                flex
                                items-center
                                justify-center
                                w-10
                                h-10
                                rounded-xl
                                hover:bg-slate-100
                                dark:hover:bg-slate-800
                                transition
                            "
                        >
                            <User size={21} />
                        </button>


                        {/* Profile Dropdown */}
                        <div
                            className="
                                absolute
                                right-0
                                top-11
                                w-56
                                bg-white
                                dark:bg-slate-800
                                rounded-xl
                                shadow-xl
                                border
                                border-slate-200
                                dark:border-slate-700
                                opacity-0
                                invisible
                                group-hover:opacity-100
                                group-hover:visible
                                transition-all
                                duration-200
                                overflow-hidden
                            "
                        >

                            <Link
                                to="/profile"
                                className="
                                    block
                                    px-4
                                    py-3
                                    text-sm
                                    hover:bg-slate-50
                                    dark:hover:bg-slate-700
                                "
                            >
                                My Profile
                            </Link>

                            <Link
                                to="/settings"
                                className="
                                    block
                                    px-4
                                    py-3
                                    text-sm
                                    hover:bg-slate-50
                                    dark:hover:bg-slate-700
                                "
                            >
                                Settings
                            </Link>

                            <Link
                                to="/change-password"
                                className="
                                    block
                                    px-4
                                    py-3
                                    text-sm
                                    hover:bg-slate-50
                                    dark:hover:bg-slate-700
                                "
                            >
                                Change Password
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="
                                    w-full
                                    text-left
                                    px-4
                                    py-3
                                    text-sm
                                    text-red-500
                                    hover:bg-red-50
                                    dark:hover:bg-red-900/20
                                "
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        </header>
    );
}