package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.Sections.SectionRequest;
import com.Smart.Erp.DTO.Admin.Sections.SectionResponse;
import com.Smart.Erp.Repository.SectionGroupRepo;
import com.Smart.Erp.Repository.SectionRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SectionService {
    private final SectionRepo sectionRepo;
    private final SectionGroupRepo sectionGroupRepo;

    public @Nullable List<SectionResponse> getAll(Long courseId) {
        return null;
    }

    public @Nullable SectionResponse getById(Long courseId, Long sectionId) {
        return null;
    }

    public @Nullable SectionResponse create(Long courseId, SectionRequest request) {
        return null;
    }

    public @Nullable SectionResponse update(Long courseId, Long sectionId, SectionRequest request) {
        return null;
    }

    public @Nullable String delete(Long sectionId, Long courseId) {
        return null;
    }
}
