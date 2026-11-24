package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionRequest;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Services.SectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:program-coordinator|head-of-department|admin|dean|school-dean|super-admin}/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;
    @GetMapping
    public ResponseEntity<List<SectionResponse>> getAll(){
        return ResponseEntity.ok(sectionService.getAll());
    }

    //First take the courseId from common controller then select and pass it to this endpoint academic year filter last in this class to create a new section for that course.
    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
            "#courseId) &&" +
            "@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
            "#academicYearId)")
    @PostMapping
    public ResponseEntity<SectionResponse> create(
            @RequestParam Long courseId,
            @RequestParam Long academicYearId,
            @RequestBody SectionRequest request
    ){
        return ResponseEntity.ok(sectionService.create(courseId,request,academicYearId));
    }
    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION, " +
            "#sectionId)")
    @PutMapping
    public ResponseEntity<SectionResponse> update(
            @RequestParam Long sectionId,
            @RequestBody SectionRequest request
    ){
        return ResponseEntity.ok(sectionService.update(sectionId,request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION, " +
            "#sectionId)")
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long sectionId
    ){
        return ResponseEntity.ok(sectionService.delete(sectionId));
    }

    @PreAuthorize(
            "(@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId) && " +
                    "(@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
                    "#academicYearId))) || " +
                    "(#sectionId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION, " +
                    "#sectionId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long sectionId,
            @RequestParam Long academicYearId,
            @RequestParam Long courseId
    ) {
        return ResponseEntity.ok(sectionService.getPrefix(academicYearId,courseId));
    }


    //It is used to get the academic year filter for the given course id. It is used in the section creation and update.
    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
            "#courseId)")
    @GetMapping("/academic-year/filter")
    public ResponseEntity<List<CommonDTO>> getAcademicYearFilter(@RequestParam Long courseId){
        return ResponseEntity.ok(sectionService.getAcademicYearFilter(courseId));
    }

}
