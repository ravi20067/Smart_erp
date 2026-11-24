package com.Smart.Erp.Modules.Academic.DTO.University;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class UniversityResponse extends BaseDTO {
    private Long id;
    private String name;
    private String code;
    private long noOfUser;
    private ActiveStatus activeStatus;
    private long noOfStudent;
    private long noOfTeacher;
    private List<CommonDTO> school;
}
