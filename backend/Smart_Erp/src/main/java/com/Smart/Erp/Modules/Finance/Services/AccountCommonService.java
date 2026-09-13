package com.Smart.Erp.Modules.Finance.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.Finance.Repo.ScholarshipRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@AllArgsConstructor
public class AccountCommonService {
    private final ScholarshipRepo scholarshipRepo;

    public Scholarship getScholarship(Long scholarshipId){
        if (scholarshipId == null){
            return new Scholarship();
        }
        return scholarshipRepo.findById(scholarshipId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Scholarship not Found with id : "+scholarshipId)
        );
    }

    public Set<Scholarship> getScholarship(List<Long> scholarshipIds){
        return scholarshipRepo.findByIdIn(scholarshipIds);
    }
}
