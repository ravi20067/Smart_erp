package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureResponse;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(
        name = "fee_structures"
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeStructure extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "structure_name", nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    private FeeFrequency frequency;

    // Added field for total number of installments
    @Column(name = "total_installments", nullable = false)
    @Builder.Default
    private Integer totalNoOfInstallments = 1;

    @OneToMany(
            mappedBy = "feeStructure",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @BatchSize(size = 25)
    @Builder.Default
    private List<FeeComponent> components = new ArrayList<>();
    @OneToMany(mappedBy = "feeStructure", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Specialization> specializations = new ArrayList<>();

    public void addSpecialization(Specialization specialization) {
        specializations.add(specialization);
        specialization.setFeeStructure(this);
    }

    public void removeSpecialization(Specialization specialization) {
        specializations.remove(specialization);
        specialization.setFeeStructure(null);
    }

    public void addComponent(FeeComponent component) {
        components.add(component);
        component.setFeeStructure(this);
    }

    public void removeComponent(FeeComponent component) {
        components.remove(component);
        component.setFeeStructure(null);
    }

    @Transient
    public BigDecimal getTotalAmount() {
        return components.stream()
                .filter(FeeComponent::getIsMandatory)
                .map(FeeComponent::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FeeStructure that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    public FeeStructureResponse mapToResponse() {

        Specialization specialization = this.getSpecializations().getFirst();
        Course course = specialization.getCourse();
        Department department = course.getDepartment();
        School school = department.getSchool();
        AcademicYear academicYear = school.getAcademicYear();


        return FeeStructureResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .frequency(this.getFrequency())
                .totalNoOfInstallments(this.getTotalNoOfInstallments())
                .feeComponent(
                        this.getComponents().stream()
                                .map(FeeComponent::mapToResponse)
                                .toList()
                )
                .specialization(
                        this.getSpecializations().stream()
                                .map(Specialization::toCommonDTO)
                                .toList()
                )
                .courses(course.toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .academicYear(academicYear.toCommonDTO())
                .build();
    }
}