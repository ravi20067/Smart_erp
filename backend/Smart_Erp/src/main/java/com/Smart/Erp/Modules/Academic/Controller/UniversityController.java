package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityResponse;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityUpdateRequest;
import com.Smart.Erp.Modules.Academic.Services.UniversityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/super-admin/university"
})
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityService universityService;

    @GetMapping
    public ResponseEntity<List<UniversityResponse>> getAll(){
        return ResponseEntity.ok(universityService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UniversityResponse>getById(
            @PathVariable long id
    ){
        return ResponseEntity.ok(universityService.getUniversityById(id));
    }

    @PostMapping()
    public ResponseEntity<UniversityResponse> createUniversity(
            @RequestBody CommonRequest request
            ){
        return ResponseEntity.ok(universityService.createUniversity(request));
    }
    @PutMapping("/{universityId}")
    public ResponseEntity<UniversityResponse>  updateUniversity(
            @PathVariable Long universityId,
            @RequestBody UniversityUpdateRequest request
            ){
        return ResponseEntity.ok(universityService.updateUniversity(universityId,request));
    }
    @DeleteMapping("/{universityId}")
    public ResponseEntity<String> deleteUniversity(
            @PathVariable Long universityId
    ){
        universityService.deleteUniversity(universityId);
        return ResponseEntity.ok("Deleted Success");
    }
}
