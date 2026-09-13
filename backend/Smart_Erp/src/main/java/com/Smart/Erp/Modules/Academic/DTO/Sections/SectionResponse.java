package com.Smart.Erp.Modules.Academic.DTO.Sections;

import com.Smart.Erp.Core.Common.CommonDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SectionResponse {
    private String id;
    private String name;
    private String code;
    private Integer capacity;
    private List<CommonDTO> specializations;
    private CommonDTO mentor;
}
