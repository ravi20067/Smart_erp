package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Finance.DTO.Scholarship.ScholarshipResponse;
import com.Smart.Erp.Modules.Finance.Enum.AmountType;
import com.Smart.Erp.Modules.Finance.Enum.ScholarshipType;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Academic.Entity.University;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
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

    @Override
    public String getPrefix() {
        return "";
    }

    public BigDecimal getFinalAmount(FeeStructure feeStructure){
        if (this.amountType == AmountType.NUMBER){
            return number;
        }else {
            return feeStructure.getTotalAmount().multiply(number.divide(valueOf(100)));
        }
    }

    public ScholarshipResponse mapToResponse() {
        return ScholarshipResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .description(this.getDescription())
                .number(this.getNumber())
                .amountType(this.getAmountType())
                .scholarshipType(this.getScholarshipType())
                .build();
    }
}
