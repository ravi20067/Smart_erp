package com.Smart.Erp.Modules.Subject.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class SubjectCommonService {
    private final SubjectRepo subjectRepo;

    public Subject getSubject(Long subjectId) {
        return subjectRepo.findById(subjectId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Subject not found with id : " + subjectId)
        );
    }
}
