package com.Smart.Erp.Modules.Finance.Services;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Finance.DTO.Scholarship.ScholarshipRequest;
import com.Smart.Erp.Modules.Finance.DTO.Scholarship.ScholarshipResponse;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.Finance.Repo.ScholarshipRepo;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@AllArgsConstructor
public class ScholarshipService {
    private final AcademicCommonService academicCommonService;
    private final AuthorizationService authorizationService;
    private final AccountCommonService accountCommonService;
    private final ScholarshipRepo scholarshipRepo;

    public List<ScholarshipResponse> getScholarships() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.SCHOLARSHIP);
        Set<Scholarship> scholarships = scholarshipRepo.findByIdIn(map.keySet());

        return scholarships.stream().map(scholarship -> scholarship.mapToResponse(map.get(scholarship.getId())))
                .toList();

    }

    public String getPrefix(Long universityId) {
        return academicCommonService.getUniversity(universityId).getCode();
    }

    public ScholarshipResponse createScholarship(Long universityId, ScholarshipRequest request) {
        University university = academicCommonService.getUniversity(universityId);
        Scholarship scholarship = Scholarship.createScholarship(request, university);
        scholarship = scholarshipRepo.save(scholarship);

        authorizationService.createPermission(scholarship.getId(), ResourceType.SCHOLARSHIP, university.getId(),ResourceType.UNIVERSITY);

        return scholarship.mapToResponse(authorizationService.getPermissionAction(ResourceType.SCHOLARSHIP, scholarship.getId()));
    }

    public ScholarshipResponse updateScholarship(Long id, ScholarshipRequest request) {
        Scholarship scholarship = accountCommonService.getScholarship(id);
        scholarship.updateFromRequest(request);
        scholarship = scholarshipRepo.save(scholarship);
        return scholarship.mapToResponse(authorizationService.getPermissionAction(ResourceType.SCHOLARSHIP, scholarship.getId()));
    }

    public String deleteScholarship(Long id) {
        if (accountCommonService.getScholarship(id).getStudents().isEmpty()) {
            scholarshipRepo.deleteById(id);
            authorizationService.deletePermission(ResourceType.SCHOLARSHIP, id);
            return "Scholarship deleted successfully";
        } else {
            throw new OperationNotAllowedException("Scholarship is assigned to students, cannot delete");
        }
    }
}
