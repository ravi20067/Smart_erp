package com.Smart.Erp.Modules.Student.DTO.Student;

import com.Smart.Erp.Modules.User.DTO.UserProfileDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentRequest {
    private Long sectionGroupId;
    private Boolean status;
    private List<Long> scholarshipId;
    private UserProfileDto basicDetailRequest;
}
