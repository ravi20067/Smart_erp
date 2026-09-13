package com.Smart.Erp.Modules.Teacher.DTO.MyAttendence;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QRCodeResponseDto {
    String token;
    LocalDateTime expiresAt;
}
