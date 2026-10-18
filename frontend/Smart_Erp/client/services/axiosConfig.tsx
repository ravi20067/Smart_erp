import axios from "axios";
import { getBaseUrl, ROLE_BASE_URL } from "./authutil";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});


let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void) => {
    logoutHandler = handler;
};

const EXCLUDED_PREFIXES = [
    "/auth",
    "/devices",
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