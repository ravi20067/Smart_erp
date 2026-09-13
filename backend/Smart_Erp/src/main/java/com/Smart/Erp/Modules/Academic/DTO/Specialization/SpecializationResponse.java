package com.Smart.Erp.Modules.Academic.DTO.Specialization;

import com.Smart.Erp.Core.Common.CommonDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class SpecializationResponse {
    private Long id;

    private String name;

    private String code;

    private List<CommonDTO> subjects;

    private List<CommonDTO> sectionGroups;
}
