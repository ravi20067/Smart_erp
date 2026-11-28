import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { resolveWsEndpoint } from "@/services/webrtcHandshake";

export interface AttendanceSocketMessage {
  eventType: string;
  sessionUuid: string;
  studentId?: number;
  studentName?: string;
  rollNumber?: string;
  status?: string;
  timestamp: string;
  message?: string;
}

interface UseAttendanceWebSocketProps {
  topic: string; // e.g. "/topic/attendance/session/" + uuid, or "/topic/attendance/guard"
  onMessage: (message: AttendanceSocketMessage) => void;
  enabled?: boolean;
}

export default function useAttendanceWebSocket({
  topic,
  onMessage,
  enabled = true,
}: UseAttendanceWebSocketProps) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!enabled || !topic) {
      return;
    }

    const wsUrl = resolveWsEndpoint();
    const socket = new SockJS(wsUrl);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {},
    });

    client.onConnect = () => {
      client.subscribe(topic, (msg) => {
        try {
          const parsed: AttendanceSocketMessage = JSON.parse(msg.body);
          onMessage(parsed);
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [topic, enabled]);
}
