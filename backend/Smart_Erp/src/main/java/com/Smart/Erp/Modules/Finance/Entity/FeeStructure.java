package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureRequest;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureResponse;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureUpdateRequest;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_modified_by")
    @ToString.Exclude
    private User lastModifiedBy;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @OneToMany(mappedBy = "feeStructure")
    @Builder.Default
    private List<Specialization> specializations = new ArrayList<>();

    public static FeeStructure createFromRequest(FeeStructureRequest request, Course course, List<Specialization> specializations, User currentUser) {
        FeeStructure feeStructure = FeeStructure.builder()
                .name(request.getName())
                .frequency(request.getFrequency())
                .course(course)
                .lastModifiedBy(currentUser)
                .totalNoOfInstallments(request.getTotalNoOfInstallments())
                .build();

        // Add components
        for ( var componentRequest : request.getComponents()) {
            FeeComponent component = FeeComponent.builder()
                    .categoryType(componentRequest.getFeeCategoryType())
                    .componentName(componentRequest.getComponentName())
                    .amount(componentRequest.getAmount())
                    .isMandatory(componentRequest.getIsMandatory())
                    .isRefundable(componentRequest.getIsRefundable())
                    .feeStructure(feeStructure)
                    .build();
            feeStructure.addComponent(component);
        }

        for (Specialization specialization : specializations) {
            feeStructure.addSpecialization(specialization);
        }

        return feeStructure;
    }

    public void addSpecialization(Specialization specialization) {
        if (specialization == null) {
            return;
        }

        if (!this.specializations.contains(specialization)) {
            this.specializations.add(specialization);
        }

        specialization.setFeeStructure(this);
    }

    public void removeSpecialization(Specialization specialization) {
        if (specialization == null) {
            return;
        }

        this.specializations.remove(specialization);

        if (specialization.getFeeStructure() == this) {
            specialization.setFeeStructure(null);
        }
    }

    public void addComponent(FeeComponent component) {
        if (component == null) {
            return;
        }

        if (!this.components.contains(component)) {
            this.components.add(component);
        }

        component.setFeeStructure(this);
    }

    public void removeComponent(FeeComponent component) {
        if (component == null) {
            return;
        }

        this.components.remove(component);

        if (component.getFeeStructure() == this) {
            component.setFeeStructure(null);
        }
    }

    public void updateFromRequest(
            FeeStructureUpdateRequest request,
            List<Specialization> requestedSpecializations,
            User currentUser,
            List<FeeComponent> componentsToRemove
    ) {
        this.setName(request.getName());
        this.setFrequency(request.getFrequency());
        this.setTotalNoOfInstallments(
                request.getTotalNoOfInstallments()
        );
        this.setLastModifiedBy(currentUser);

        // Remove existing components requested for deletion.
        for (FeeComponent component :
                new ArrayList<>(componentsToRemove)) {
            removeComponent(component);
        }

        // Add new components.
        if (request.getComponentToAdd() != null) {
            for (var componentRequest :
                    request.getComponentToAdd()) {

                FeeComponent component = FeeComponent.builder()
                        .categoryType(
                                componentRequest.getFeeCategoryType()
                        )
                        .componentName(
                                componentRequest.getComponentName()
                        )
                        .amount(componentRequest.getAmount())
                        .isMandatory(
                                componentRequest.getIsMandatory()
                        )
                        .isRefundable(
                                componentRequest.getIsRefundable()
                        )
                        .feeStructure(this)
                        .build();

                addComponent(component);
            }
        }

        // Synchronize specializations without replacing the
        // Hibernate-managed collection instance.
        List<Specialization> desiredSpecializations =
                requestedSpecializations == null
                        ? List.of()
                        : requestedSpecializations;

        for (Specialization existing :
                new ArrayList<>(this.specializations)) {

            boolean stillAssigned = desiredSpecializations.stream()
                    .anyMatch(existing::equals);

            if (!stillAssigned) {
                removeSpecialization(existing);
            }
        }

        for (Specialization specialization :
                desiredSpecializations) {

            if (!this.specializations.contains(specialization)) {
                addSpecialization(specialization);
            } else {
                specialization.setFeeStructure(this);
            }
        }
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

    public FeeStructureResponse mapToResponse(List<PermissionAction> permissionActions) {

        AcademicYear academicYear = course.getAcademicYear();
        Department department = academicYear.getDepartment();
        School school = department.getSchool();

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
                .courses(this.getCourse().toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .academicYear(academicYear.toCommonDTO())
                .lastModifiedBy(this.getLastModifiedBy() != null ? this.getLastModifiedBy().toCommonDTO() : null)
                .permissionActions(permissionActions)
                .build();
    }
}