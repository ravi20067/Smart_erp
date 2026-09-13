package com.Smart.Erp.Core.Redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceQR {

    private String token;

    private Long teacherId;

    private LocalDateTime generatedAt;

    private LocalDateTime expiresAt;
}
