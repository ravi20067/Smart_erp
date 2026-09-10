package com.Smart.Erp.DTO.Admin.Sections;

import com.Smart.Erp.DTO.CommonDTO;
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
    private Integer studentCount;

    private List<CommonDTO> specializations;

    private CommonDTO mentor;
}
