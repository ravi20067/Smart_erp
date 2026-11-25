import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { setLogoutHandler } from "@/services/axiosConfig";
import type { UserProfile } from "@/types/auth";
import { getRoleFromToken } from "./authutil";

import { getProfile } from "./authService";


interface DecodedToken {
    sub: string;
    role?: string;
    exp: number;
}

interface AuthContextType {
    token: string | null;
    role: string | null;
    user: UserProfile | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    getDashboardRoute: (currentRole?: string | null) => string;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [token, setToken] = useState<string | null>(
        localStorage.getItem("token")
    );
    const [role, setRole] = useState<string | null>(() => getRoleFromToken());
    const [user, setUser] = useState<UserProfile | null>(null);

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setRole(null);
        setUser(null);
    };

    const login = (newToken: string) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        const resolvedRole = getRoleFromToken(newToken);
        setRole(resolvedRole);
    };
    const loadProfile = async () => {

        if (!token) return;

        try {

            const decoded: DecodedToken = jwtDecode(token);

            if (decoded.exp * 1000 < Date.now()) {
                logout();
                return;
            }

            setRole(decoded.role || null);
            const profile = await getProfile();

            setUser(profile);

        } catch (error) {

            console.error(error);

            logout();

        }
    }

    useEffect(() => {
        loadProfile();
    }, [token]);
    useEffect(() => {
        setLogoutHandler(logout);
    }, []);

    const getDashboardRoute = (currentRole?: string | null) => {
        const activeRole = (currentRole ?? role ?? getRoleFromToken() ?? "").replace(/^ROLE_/, "").toUpperCase();
        switch (activeRole) {
            case "STUDENT":
                return "/student";

            case "TEACHER":
                return "/teacher";

            case "SECURITY_GUARD":
                return "/security-guard";

            case "DEAN":
            case "SCHOOL_DEAN":
                return "/dean";

            case "HEAD_OF_DEPARTMENT":
                return "/head-of-department";

            case "PROGRAM_COORDINATOR":
                return "/program-coordinator";

            case "MENTOR":
                return "/mentor";

            case "LIBRARIAN":
            case "LIBRARY":
                return "/library";

            case "ADMISSION":
                return "/admission";

            case "EXAM_CONTROLLER":
            case "EXAMINATION":
                return "/examination-dept";

            case "ACCOUNTANT":
            case "FINANCE":
                return "/finance";

            case "HR":
                return "/hr";

            case "COUNSELOR":
                return "/counselor";

            case "ADMIN":
                return "/admin";

            case "SUPER_ADMIN":
                return "/super-admin";

            default:
                return "/login";
        }
    };
    return (
        <AuthContext.Provider
            value={{
                token,
                role,
                user,
                refreshProfile: loadProfile,
                login,
                logout,
                isAuthenticated: !!token,
                getDashboardRoute,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("AuthContext missing");
    return context;
};
