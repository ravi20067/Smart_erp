package com.Smart.Erp.Controller.Admin.AcademicManagement;

import com.Smart.Erp.DTO.Admin.University.UniversityResponse;
import com.Smart.Erp.DTO.Admin.University.UniversityUpdateRequest;
import com.Smart.Erp.Service.UniversityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/admin/university"
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
            @RequestParam String name
            ){
        return ResponseEntity.ok(universityService.createUniversity(name));
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
