package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Finance.DTO.Scholarship.ScholarshipRequest;
import com.Smart.Erp.Modules.Finance.DTO.Scholarship.ScholarshipResponse;
import com.Smart.Erp.Modules.Finance.Enum.AmountType;
import com.Smart.Erp.Modules.Finance.Enum.ScholarshipType;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static java.math.BigDecimal.*;

@Entity
@Table(name = "scholarships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Scholarship  extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    private String name;
    private String code;
    private String description;
    @Column(precision = 12, scale = 2)

    private Boolean status;

    private BigDecimal number;
    private AmountType amountType;
    private ScholarshipType scholarshipType;

    @ToString.Exclude
    @ManyToMany(mappedBy = "scholarships")
    private Set<StudentFeeAccount> students = new HashSet<>();

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private University university;

    public static Scholarship createScholarship(ScholarshipRequest request, University university) {
        return Scholarship.builder()
                .name(request.getName())
                .code(university.getCode() + request.getCode())
                .description(request.getDescription())
                .number(request.getNumber())
                .amountType(request.getAmountType())
                .scholarshipType(request.getScholarshipType())
                .status(request.getStatus())
                .university(university)
                .build();
    }

    @Override
    public void setCodeWithPrefix(String code) {
        this.code = university.getCode()+code;
    }

    public BigDecimal getFinalAmount(FeeStructure feeStructure){
        if (this.amountType == AmountType.NUMBER){
            return number;
        }else {
            return feeStructure.getTotalAmount().multiply(number.divide(valueOf(100)));
        }
    }

    public ScholarshipResponse mapToResponse(List<PermissionAction> permissionActions) {
        return ScholarshipResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .description(this.getDescription())
                .number(this.getNumber())
                .amountType(this.getAmountType())
                .status(this.getStatus())
                .scholarshipType(this.getScholarshipType())
                .permissionActions(permissionActions)
                .build();
    }

    public void updateFromRequest(ScholarshipRequest request) {
        this.name = request.getName();
        this.code = university.getCode()+request.getCode();
        this.description = request.getDescription();
        this.number = request.getNumber();
        this.amountType = request.getAmountType();
        this.scholarshipType = request.getScholarshipType();
        this.status = request.getStatus();
    }
}
