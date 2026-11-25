import api from "./axiosConfig";
import type { UserProfile } from "@/types/auth";

export const loginAuth = async (username: string, password: string) => {
    const response = await api.post("/auth/login", {
        username,
        password,
    });
    return response.data;
};

export const getProfile = async (): Promise<UserProfile> => {
    const response = await api.get("/auth/profile");
    return response.data;
};

/**
 * Extracts and normalizes the error message returned from the authentication API.
 * Accurately parses Spring Boot ErrorResponse, Spring Security exceptions,
 * validation errors, and network connectivity problems.
 */
export function extractAuthErrorMessage(
    error: unknown,
    fallback = "Unable to sign in right now. Please try again."
): string {
    if (!error || typeof error !== "object") {
        return typeof error === "string" && error.trim() ? error.trim() : fallback;
    }

    const candidate = error as Record<string, unknown>;

    // Network & connection failures (e.g. backend server is offline or network dropped)
    if (
        candidate.code === "ERR_NETWORK" ||
        candidate.message === "Network Error" ||
        (typeof candidate.message === "string" && candidate.message.toLowerCase().includes("network error"))
    ) {
        return "Unable to connect to the server. Please check your internet connection or verify the server is running.";
    }

    if (
        candidate.code === "ECONNABORTED" ||
        (typeof candidate.message === "string" && candidate.message.toLowerCase().includes("timeout"))
    ) {
        return "The login request timed out. Please try again.";
    }

    const response = candidate.response as Record<string, unknown> | undefined;
    if (response) {
        const data = response.data;

        // Plain text error response from backend
        if (typeof data === "string" && data.trim()) {
            const trimmed = data.trim();
            const lower = trimmed.toLowerCase();
            if (lower === "bad credentials") {
                return "Invalid username or password. Please verify your credentials and try again.";
            }
            if (lower.includes("disabled")) {
                return "Your account is disabled. Please contact your institution administrator.";
            }
            if (lower.includes("locked")) {
                return "Your account has been locked. Please contact support or your administrator.";
            }
            return trimmed;
        }

        // Structured JSON error object (GlobalExceptionHandler ErrorResponse or Spring Security)
        if (data && typeof data === "object") {
            const body = data as Record<string, unknown>;

            // Check field errors array (e.g. @Valid validation violations)
            if (Array.isArray(body.errors) && body.errors.length > 0) {
                const messages = body.errors
                    .map((err) => {
                        if (typeof err === "string") return err.trim();
                        if (err && typeof err === "object") {
                            const e = err as Record<string, unknown>;
                            return String(e.defaultMessage ?? e.message ?? e.field ?? "").trim();
                        }
                        return "";
                    })
                    .filter(Boolean);

                if (messages.length > 0) {
                    return messages.join(", ");
                }
            }

            // Extract message from standard Spring Boot error fields
            const rawMessage =
                typeof body.message === "string" && body.message.trim()
                    ? body.message.trim()
                    : typeof body.error === "string" &&
                      body.error.trim() &&
                      !["not found", "bad request", "unauthorized", "forbidden", "internal server error"].includes(
                          body.error.trim().toLowerCase()
                      )
                    ? body.error.trim()
                    : typeof body.detail === "string" && body.detail.trim()
                    ? body.detail.trim()
                    : typeof body.description === "string" && body.description.trim()
                    ? body.description.trim()
                    : typeof body.title === "string" && body.title.trim()
                    ? body.title.trim()
                    : null;

            if (rawMessage) {
                const lower = rawMessage.toLowerCase();
                if (lower === "bad credentials") {
                    return "Invalid username or password. Please verify your credentials and try again.";
                }
                if (lower.includes("disabled")) {
                    return "Your account is disabled. Please contact your institution administrator.";
                }
                if (lower.includes("locked")) {
                    return "Your account has been locked. Please contact support or your administrator.";
                }
                if (lower.includes("expired")) {
                    return "Your account credentials have expired. Please reset your password.";
                }
                if (lower.startsWith("user not found")) {
                    return "User account not found. Please check your username or register.";
                }
                return rawMessage;
            }
        }

        // Fallbacks based on HTTP response status code
        const status = Number(response.status);
        if (status === 400) {
            return "Invalid login details. Please check your username and password.";
        }
        if (status === 401 || status === 404) {
            return "Invalid username or password. Please check your credentials and try again.";
        }
        if (status === 403) {
            return "Access denied. Your account does not have permission to sign in.";
        }
        if (status === 429) {
            return "Too many sign-in attempts. Please wait a few moments before trying again.";
        }
        if (status >= 500) {
            return "A server error occurred during authentication. Please try again later.";
        }
    }

    // Direct Axios or Error message
    if (typeof candidate.message === "string" && candidate.message.trim()) {
        const msg = candidate.message.trim();
        if (msg.toLowerCase().includes("network error")) {
            return "Unable to connect to the server. Please check your connection.";
        }
        return msg;
    }

    return fallback;
}
