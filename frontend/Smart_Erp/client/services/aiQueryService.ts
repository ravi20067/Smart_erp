import axios from "axios";
import api from "./axiosConfig";

export interface AiQueryResponse {
    success: boolean;
    conversationId?: string;
    language?: string;
    intent?: string;
    message: string;
    requiresClarification?: boolean;
    errorCode?: string;
    data?: unknown;
}

export async function sendAiQuery(
    message: string,
    language: string,
    conversationId?: string,
): Promise<AiQueryResponse> {
    try {
        const response = await api.post<AiQueryResponse>("/api/ai/query", {
            message,
            language,
            conversationId,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const serverMsg = error.response?.data?.message;
            if (typeof serverMsg === "string" && serverMsg.trim()) {
                throw new Error(serverMsg);
            }
            if (error.response?.status === 401) {
                throw new Error("Please sign in to use the Smart ERP AI assistant.");
            }
            if (error.response?.status === 403) {
                throw new Error("You are not authorized to access this information.");
            }
        }
        throw new Error("Unable to reach the AI assistant right now. Please try again.");
    }
}
