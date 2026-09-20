package com.Smart.Erp.Modules.Academic.DTO.University;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UniversityResponse {
    private Long id;
    private String name;
    private String code;
    private long noOfUser;
    private ActiveStatus activeStatus;
    private long noOfStudent;
    private long noOfTeacher;
    private CommonDTO dean;
}
