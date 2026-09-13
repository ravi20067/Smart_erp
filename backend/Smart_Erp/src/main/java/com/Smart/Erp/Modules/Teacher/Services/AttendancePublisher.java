package com.Smart.Erp.Modules.Teacher.Services;
import com.Smart.Erp.Modules.Teacher.DTO.MyAttendence.AttendanceSocketEventDto;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendancePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(
            Long userId,
            AttendanceSocketEventDto event
    ) {

        messagingTemplate.convertAndSend(

                "/topic/attendance/" + userId,

                event

        );

    }

}
