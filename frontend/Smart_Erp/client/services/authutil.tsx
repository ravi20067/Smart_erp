import { jwtDecode } from "jwt-decode";

interface DecodedToken {
    sub: string;
    role?: string;
    exp: number;
}

const ROLE_BASE_URL: Record<string, string> = {
    ROLE_STUDENT: "/student",
    ROLE_TEACHER: "/teacher",
    ROLE_LIBRARY: "/library",
    ROLE_ADMISSION: "/admission",
    ROLE_EXAMINATION: "/examination-dept",
    ROLE_FINANCE: "/finance",
    ROLE_ADMIN: "/admin",
    ROLE_DEVICES: "/devices",
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