package com.Smart.Erp.Modules.Student.DTO;

import com.Smart.Erp.Core.Common.CommonDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class SectionGroupFilter {
    private CommonDTO sectionGroup;
    private CommonDTO specialization;
    private CommonDTO courses;
}
