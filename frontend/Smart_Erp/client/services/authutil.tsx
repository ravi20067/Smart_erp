import { jwtDecode } from "jwt-decode";

interface DecodedToken {
    sub?: string;
    role?: string;
    roles?: string[] | string;
    authorities?: Array<{ authority?: string } | string> | string;
    userRole?: string | { enumValue?: string; name?: string };
    exp?: number;
    [key: string]: unknown;
}

export const ROLE_BASE_URL: Record<string, string> = {
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

export const normalizeRole = (role?: string | null): string | null => {
    if (!role || typeof role !== "string") return null;
    let clean = role.trim();
    if (clean.toUpperCase().startsWith("ROLE_")) {
        clean = clean.substring(5);
    }
    return clean.toUpperCase();
};

export const getRoleFromToken = (customToken?: string | null): string | null => {
    const token =
        customToken ||
        (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    if (!token) {
        return null;
    }

    try {
        const decoded = jwtDecode<DecodedToken>(token);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return null;
        }

        let rawRole: string | null = null;

        if (typeof decoded.role === "string" && decoded.role.trim()) {
            rawRole = decoded.role;
        } else if (Array.isArray(decoded.roles) && decoded.roles.length > 0) {
            rawRole = String(decoded.roles[0]);
        } else if (typeof decoded.roles === "string" && decoded.roles.trim()) {
            rawRole = decoded.roles;
        } else if (Array.isArray(decoded.authorities) && decoded.authorities.length > 0) {
            const first = decoded.authorities[0];
            rawRole =
                typeof first === "string"
                    ? first
                    : (first as { authority?: string })?.authority ?? null;
        } else if (typeof decoded.userRole === "string") {
            rawRole = decoded.userRole;
        } else if (decoded.userRole && typeof decoded.userRole === "object") {
            rawRole =
                (decoded.userRole as { enumValue?: string; name?: string }).enumValue ??
                (decoded.userRole as { name?: string }).name ??
                null;
        }

        return normalizeRole(rawRole);
    } catch {
        return null;
    }
};

export const getBaseUrl = (roleOrToken?: string | null): string => {
    let role: string | null = null;

    if (roleOrToken && typeof roleOrToken === "string") {
        if (roleOrToken.includes(".") && roleOrToken.split(".").length === 3) {
            role = getRoleFromToken(roleOrToken);
        } else {
            role = normalizeRole(roleOrToken);
        }
    }

    if (!role) {
        role = getRoleFromToken();
    }

    return role && ROLE_BASE_URL[role] ? ROLE_BASE_URL[role] : "";
};

export const getRoleEndpointUrl = (
    endpoint: string,
    roleOrToken?: string | null
): string => {
    const base = getBaseUrl(roleOrToken).replace(/\/+$/, "");
    const cleanEndpoint = endpoint.replace(/^\/+/, "");
    return base ? `${base}/${cleanEndpoint}` : `/${cleanEndpoint}`;
};