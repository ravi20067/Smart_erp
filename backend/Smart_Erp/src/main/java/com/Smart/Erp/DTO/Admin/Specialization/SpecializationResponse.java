package com.Smart.Erp.DTO.Admin.Specialization;

import com.Smart.Erp.DTO.CommonDTO;
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
