package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebRtcSignalMessage {
    private String sessionUuid;
    private String ticketId;
    private String senderRole;
    private String signalType; // OFFER, ANSWER, ICE, ERROR
    private String sdp;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
    private String iceType;
    private String errorMessage;
}
