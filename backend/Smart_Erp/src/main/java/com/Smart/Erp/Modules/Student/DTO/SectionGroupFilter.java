package com.Smart.Erp.Modules.Student.DTO;

import com.Smart.Erp.Core.Common.CommonDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class SectionGroupFilter {
    private CommonDTO sectionGroup;
    private CommonDTO section;
    private CommonDTO specialization;
    private CommonDTO courses;
    private CommonDTO academicYear;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO university;
    private CommonDTO feeStructure;
    private Integer capacity;
    private Integer studentCount;
    private Integer availableSeats;
}
