package com.Smart.Erp.DTO.Admin.University;

import com.Smart.Erp.DTO.CommonAcademic.CommonTeacherDTO;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UniversityResponse {
    private Long id;
    private String name;
    private long noOfUser;
    private long noOfStudent;
    private long noOfTeacher;
    private CommonTeacherDTO dean;
}
