package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Modules.Academic.Repo.CourseRepo;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceAuthorizationService {

    private final CourseRepo courseRepository;

    public boolean belongsToUniversity(
            ResourceType resourceType,
            Long resourceId,
            Long universityId
    ) {

        if (resourceId == null ||
                universityId == null) {

            return false;
        }


        return switch (resourceType) {

            case COURSE ->
                    courseBelongsToUniversity(
                            resourceId,
                            universityId
                    );

            default ->
                    false;
        };
    }


    private boolean courseBelongsToUniversity(
            Long courseId,
            Long universityId
    ) {

        return courseRepository
                .existsByIdAndDepartmentUniversityId(
                        courseId,
                        universityId
                );
    }
}
