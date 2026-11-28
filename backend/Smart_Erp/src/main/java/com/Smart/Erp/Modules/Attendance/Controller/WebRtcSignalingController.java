package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Attendance.DTO.WebRtcSignalMessage;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Services.CampusCheckInService;
import com.Smart.Erp.Modules.Attendance.Services.LocalNetworkPolicy;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Authenticated WebRTC signaling relay over Spring Boot STOMP WebSocket.
 * Exchanges SDP Offer/Answer and local-host ICE candidates strictly for direct
 * browser-to-browser P2P connections on campus Wi-Fi or Teacher Hotspots (iceServers=[]).
 */
@RestController
@RequiredArgsConstructor
public class WebRtcSignalingController {

    private final AttendanceSessionRepository sessionRepository;
    private final FaceVerificationSessionRepository verificationSessionRepository;
    private final StudentRepo studentRepo;
    private final UserRepo userRepo;
    private final CampusCheckInService campusCheckInService;
    private final LocalNetworkPolicy localNetworkPolicy;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/student/attendance/webrtc/signal")
    public ResponseEntity<Map<String, Object>> relayStudentSignal(
            @RequestBody WebRtcSignalMessage signal,
            HttpServletRequest httpRequest,
            Authentication authentication
    ) {
        localNetworkPolicy.rejectProxyHeaders(httpRequest);
        if (signal == null || signal.getSessionUuid() == null || signal.getTicketId() == null) {
            throw new IllegalArgumentException("sessionUuid and ticketId are required for WebRTC signaling");
        }

        User user = userRepo.findByUsername(authentication.getName())
                .orElseThrow(() -> new OperationNotAllowedException("User not found"));
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new OperationNotAllowedException("Student profile not found"));

        campusCheckInService.requireOpenCampusCheckIn(student);

        AttendanceSession session = sessionRepository.findBySessionUuid(signal.getSessionUuid())
                .orElseThrow(() -> new OperationNotAllowedException("Attendance session not found"));
        if (session.getStatus() != AttendanceSessionStatus.ACTIVE || LocalDateTime.now().isAfter(session.getExpiresAt())) {
            throw new OperationNotAllowedException("Attendance session is no longer active");
        }

        verificationSessionRepository
                .findFirstByStudentAndAttendanceSessionAndStatus(student, session, VerificationState.PASSED)
                .orElseThrow(() -> new OperationNotAllowedException("Face verification must pass before WebRTC handshake signaling"));

        if ("ICE".equalsIgnoreCase(signal.getSignalType())) {
            localNetworkPolicy.validateSignaledIceCandidate(signal.getCandidate(), session.getAllowedSubnets());
        }

        signal.setSenderRole("STUDENT");
        messagingTemplate.convertAndSend("/topic/webrtc/teacher/" + session.getSessionUuid(), signal);
        return ResponseEntity.ok(Map.of("relayed", true));
    }

    @PostMapping("/teacher/attendance/webrtc/signal")
    public ResponseEntity<Map<String, Object>> relayTeacherSignal(
            @RequestBody WebRtcSignalMessage signal,
            HttpServletRequest httpRequest,
            Authentication authentication
    ) {
        localNetworkPolicy.rejectProxyHeaders(httpRequest);
        if (signal == null || signal.getSessionUuid() == null || signal.getTicketId() == null) {
            throw new IllegalArgumentException("sessionUuid and ticketId are required for WebRTC signaling");
        }

        AttendanceSession session = sessionRepository.findBySessionUuid(signal.getSessionUuid())
                .orElseThrow(() -> new OperationNotAllowedException("Attendance session not found"));
        if (session.getTeacher() == null || session.getTeacher().getUser() == null
                || !session.getTeacher().getUser().getUsername().equals(authentication.getName())) {
            throw new OperationNotAllowedException("Unauthorized: You do not own this attendance session");
        }

        if ("ICE".equalsIgnoreCase(signal.getSignalType())) {
            localNetworkPolicy.validateSignaledIceCandidate(signal.getCandidate(), session.getAllowedSubnets());
        }

        signal.setSenderRole("TEACHER");
        messagingTemplate.convertAndSend("/topic/webrtc/student/" + signal.getTicketId(), signal);
        return ResponseEntity.ok(Map.of("relayed", true));
    }
}
