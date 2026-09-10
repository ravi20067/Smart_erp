package com.Smart.Erp.DTO.Admin.Student;

import com.Smart.Erp.DTO.CommonDTO;
import com.Smart.Erp.DTO.UserProfileDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudentResponse {
    private Long id;
    private UserProfileDto basicDetailRequest;
    private CommonDTO sectionGroup;
    private Boolean status;
    private List<CommonDTO> scholarship;
}
