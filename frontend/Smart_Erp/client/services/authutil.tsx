import { jwtDecode } from "jwt-decode";

interface DecodedToken {
    sub: string;
    role?: string;
    exp: number;
}

const ROLE_BASE_URL: Record<string, string> = {
    STUDENT: "/student",
    TEACHER: "/teacher",
    LIBRARY: "/library",
    ADMISSION: "/admission",
    EXAMINATION: "/examination-dept",
    FINANCE: "/finance",
    SUPER_ADMIN: "/super-admin",
    ADMIN: "/admin",
    DEVICES: "/devices",
};

export const getRoleFromToken = (): string | null => {
    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {
        const decoded = jwtDecode<DecodedToken>(token);

        if (decoded.exp * 1000 < Date.now()) {
            return null;
        }

        return decoded.role ?? null;

    } catch {
        return null;
    }
};

export const getBaseUrl = (): string => {
    const role = getRoleFromToken();
    return role ? ROLE_BASE_URL[role] ?? "" : "";
};