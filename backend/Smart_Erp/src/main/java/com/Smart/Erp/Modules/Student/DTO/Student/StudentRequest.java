package com.Smart.Erp.Modules.Student.DTO.Student;

import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentRequest {
    private Long sectionGroupId;
    private Boolean status;
    private List<Long> scholarshipId;
    private UserProfileRequest basicDetailRequest;
    private LocalDate dueDate;
}
