package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceAuditLog;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceAuditLogRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.User.Entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceAuditService {

    private final AttendanceAuditLogRepository auditLogRepository;

    public void logEvent(
            AttendanceSession session,
            Student student,
            User performedBy,
            String role,
            String eventType,
            String stateFrom,
            String stateTo,
            String details,
            String ipAddress
    ) {
        try {
            AttendanceAuditLog logEntry = AttendanceAuditLog.builder()
                    .attendanceSession(session)
                    .student(student)
                    .performedBy(performedBy)
                    .role(role)
                    .eventType(eventType)
                    .stateFrom(stateFrom)
                    .stateTo(stateTo)
                    .details(details)
                    .ipAddress(ipAddress)
                    .timestamp(LocalDateTime.now())
                    .build();

            auditLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Error writing attendance audit log for event {}: {}", eventType, e.getMessage());
        }
    }
}
