package com.Smart.Erp.Modules.Teacher.DTO.Teacher;

import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeacherRequest{
    private Boolean status;
    private UserProfileRequest basicDetailRequest;
    private List<Long> subjectIds;
}
