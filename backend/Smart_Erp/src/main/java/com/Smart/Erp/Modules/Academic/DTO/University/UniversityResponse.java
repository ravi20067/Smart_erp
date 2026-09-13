package com.Smart.Erp.Modules.Academic.DTO.University;

import com.Smart.Erp.Core.Common.CommonDTO;
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
    private CommonDTO dean;
}
