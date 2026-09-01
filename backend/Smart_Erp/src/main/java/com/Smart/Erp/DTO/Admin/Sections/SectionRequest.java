package com.Smart.Erp.DTO.Admin.Sections;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SectionRequest {
    private String name;
    private String code;
    private Integer capacity;
    private Integer studentCount;
    private List<Long> specializationId;
    private Long mentorId;
}
