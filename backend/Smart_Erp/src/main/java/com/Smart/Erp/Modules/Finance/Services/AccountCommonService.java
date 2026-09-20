package com.Smart.Erp.Modules.Finance.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Finance.Entity.FeeComponent;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.Finance.Entity.StudentFeeAccount;
import com.Smart.Erp.Modules.Finance.Enum.FeeAccountStatus;
import com.Smart.Erp.Modules.Finance.Repo.FeeComponentRepo;
import com.Smart.Erp.Modules.Finance.Repo.FeeStructureRepo;
import com.Smart.Erp.Modules.Finance.Repo.ScholarshipRepo;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@AllArgsConstructor
public class AccountCommonService {
    private final ScholarshipRepo scholarshipRepo;
    private final FeeStructureRepo feeStructureRepo;
    private final FeeComponentRepo feeComponentRepo;

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

    public FeeStructure getFeeStructure(Long feeStructureId){
        if (feeStructureId == null){
            return new FeeStructure();
        }
        return feeStructureRepo.findById(feeStructureId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Fee Structure not Found with id : "+feeStructureId)
        );
    }

    public FeeComponent getFeeComponent(Long feeComponentId){
        if (feeComponentId == null){
            return new FeeComponent();
        }
        return feeComponentRepo.findById(feeComponentId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Fee Component not Found with id : "+feeComponentId)
        );
    }
}
