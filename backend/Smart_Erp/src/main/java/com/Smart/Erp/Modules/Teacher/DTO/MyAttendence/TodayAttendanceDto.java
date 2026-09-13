package com.Smart.Erp.Modules.Teacher.DTO.MyAttendence;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodayAttendanceDto {

    private String checkIn;

    private String checkOut;

    private String workingHours;

    private String location;

    private String status;
}