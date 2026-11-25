package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.DTO.AttendanceSocketMessage;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishEvent(
            AttendanceEventType eventType,
            String sessionUuid,
            Long studentId,
            String studentName,
            String rollNumber,
            String status,
            String message
    ) {
        AttendanceSocketMessage socketMessage = AttendanceSocketMessage.builder()
                .eventType(eventType)
                .sessionUuid(sessionUuid)
                .studentId(studentId)
                .studentName(studentName)
                .rollNumber(rollNumber)
                .status(status)
                .timestamp(LocalDateTime.now())
                .message(message)
                .build();

        try {
            // 1. Session topic for Teacher dashboard
            if (sessionUuid != null && !sessionUuid.isBlank()) {
                messagingTemplate.convertAndSend("/topic/attendance/session/" + sessionUuid, socketMessage);
            }

            // 2. Personal topic for Student
            if (studentId != null) {
                messagingTemplate.convertAndSend("/topic/attendance/student/" + studentId, socketMessage);
            }

            // 3. Broadcast to Security Guard stations for Check-In updates
            messagingTemplate.convertAndSend("/topic/attendance/guard", socketMessage);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket event {}: {}", eventType, e.getMessage());
        }
    }

    public void publishCampusEvent(
            AttendanceEventType eventType,
            Long userId,
            Long personId,
            String personName,
            String identifier,
            String status,
            String message
    ) {
        AttendanceSocketMessage socketMessage = AttendanceSocketMessage.builder()
                .eventType(eventType)
                .studentId(personId)
                .studentName(personName)
                .rollNumber(identifier)
                .status(status)
                .timestamp(LocalDateTime.now())
                .message(message)
                .build();

        try {
            if (userId != null) {
                messagingTemplate.convertAndSend("/topic/campus/user/" + userId, socketMessage);
            }
            messagingTemplate.convertAndSend("/topic/campus/guard", socketMessage);
            messagingTemplate.convertAndSend("/topic/attendance/guard", socketMessage);
        } catch (Exception e) {
            log.error("Failed to broadcast Campus WebSocket event {}: {}", eventType, e.getMessage());
        }
    }
}
