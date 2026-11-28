import axios from "axios";
import { getBaseUrl, ROLE_BASE_URL } from "./authutil";

function isPrivateOrLocalHostname(host: string): boolean {
    if (!host) return false;
    if (host === "localhost" || host === "127.0.0.1") return true;
    const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
    if (!v4) return false;
    const [b0, b1] = [Number(v4[1]), Number(v4[2])];
    return b0 === 10 || (b0 === 172 && b1 >= 16 && b1 <= 31) || (b0 === 192 && b1 === 168);
}

export function resolveBackendBaseUrl(): string {
    const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (typeof window !== "undefined") {
        const currentHost = window.location.hostname;
        if (isPrivateOrLocalHostname(currentHost)) {
            if (!configured) {
                return `${window.location.protocol}//${currentHost}:7777`;
            }
            try {
                const parsed = new URL(configured);
                if (isPrivateOrLocalHostname(parsed.hostname) && parsed.hostname !== currentHost) {
                    const port = parsed.port || "7777";
                    return `${window.location.protocol}//${currentHost}:${port}`;
                }
            } catch {
                // fall through to configured
            }
        }
    }
    return configured || "http://localhost:7777";
}

const api = axios.create({
    baseURL: resolveBackendBaseUrl(),
});


let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void) => {
    logoutHandler = handler;
};

const EXCLUDED_PREFIXES = [
    "/api",
    "/auth",
    "/ping",
    "/demo",
    "http://",
    "https://",
    ...Object.values(ROLE_BASE_URL),
];

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.url) {
        const url = config.url.trim();
        const isExcluded = EXCLUDED_PREFIXES.some(
            (prefix) => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(prefix)
        );

        if (!isExcluded) {
            const roleBase = getBaseUrl();
            if (roleBase) {
                const cleanBase = roleBase.replace(/\/+$/, "");
                const cleanUrl = url.replace(/^\/+/, "");
                config.url = `${cleanBase}/${cleanUrl}`;
            }
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && logoutHandler) {
            logoutHandler();
        }
        return Promise.reject(error);
    }
);
export default api;