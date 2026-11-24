
package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureRequest;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureResponse;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureUpdateRequest;
import com.Smart.Erp.Modules.Finance.Enum.FeeCategoryType;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.SuperBuilder;

import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(
        name = "fee_structures",
        indexes = {
                @Index(
                        name = "idx_fee_structure_academic_year",
                        columnList = "academic_year_id"
                )
        }
)
@Getter
@Setter
@ToString
@NoArgsConstructor
@SuperBuilder
public class FeeStructure extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "structure_name", nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    private FeeFrequency frequency;

    @Builder.Default
    @Column(name = "total_installments", nullable = false)
    private Integer totalNoOfInstallments = 1;

    // Fee components
    @Builder.Default
    @ToString.Exclude
    @OneToMany(
            mappedBy = "feeStructure",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @BatchSize(size = 25)
    private List<FeeComponent> components = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    @ToString.Exclude
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "academic_year_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_fee_structure_academic_year"
            )
    )
    @ToString.Exclude
    private AcademicYear academicYear;

    // One fee structure can have multiple specializations
    @Builder.Default
    @ToString.Exclude
    @OneToMany(
            mappedBy = "feeStructure",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @BatchSize(size = 25)
    private List<FeeStructureSpecialization> specializationAssignments =
            new ArrayList<>();

    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    public static FeeStructure createFromRequest(
            FeeStructureRequest request,
            Course course,
            AcademicYear academicYear,
            List<Specialization> specializations
    ) {

        FeeStructure feeStructure = FeeStructure.builder()
                .name(request.getName())
                .frequency(request.getFrequency())
                .course(course)
                .academicYear(academicYear)
                .totalNoOfInstallments(
                        request.getTotalNoOfInstallments()
                )
                .build();

        // Add fee components
        if (request.getComponents() != null) {

            for (var componentRequest : request.getComponents()) {

                FeeComponent component = FeeComponent.builder()
                        .categoryType(
                                componentRequest.getFeeCategoryType()
                        )
                        .componentName(
                                componentRequest.getComponentName()
                        )
                        .amount(componentRequest.getAmount())
                        .isMandatory(componentRequest.getIsMandatory())
                        .isRefundable(componentRequest.getIsRefundable())
                        .feeStructure(feeStructure)
                        .build();

                feeStructure.addComponent(component);
            }
        }

        // Add specializations
        if (specializations != null) {
            for (Specialization specialization : specializations) {
                feeStructure.addSpecialization(specialization);
            }
        }

        return feeStructure;
    }

    // --------------------------------------------------
    // SPECIALIZATION MANAGEMENT
    // --------------------------------------------------

    public void addSpecialization(Specialization specialization) {

        if (specialization == null) {
            return;
        }

        boolean exists = specializationAssignments.stream()
                .anyMatch(assignment ->
                        sameSpecialization(
                                assignment.getSpecialization(),
                                specialization
                        )
                );

        if (exists) {
            return;
        }

        FeeStructureSpecialization assignment =
                FeeStructureSpecialization.create(
                        this,
                        specialization
                );

        specializationAssignments.add(assignment);
    }

    public void removeSpecialization(Specialization specialization) {

        if (specialization == null) {
            return;
        }

        specializationAssignments.removeIf(assignment ->
                sameSpecialization(
                        assignment.getSpecialization(),
                        specialization
                )
        );
    }

    private boolean sameSpecialization(
            Specialization first,
            Specialization second
    ) {

        if (first == second) {
            return true;
        }

        if (first == null || second == null) {
            return false;
        }

        return first.getId() != null
                && Objects.equals(first.getId(), second.getId());
    }

    // --------------------------------------------------
    // COMPONENT MANAGEMENT
    // --------------------------------------------------

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

    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    public void updateFromRequest(
            FeeStructureUpdateRequest request,
            List<Specialization> requestedSpecializations,
            List<FeeComponent> componentsToRemove
    ) {

        this.setName(request.getName());
        this.setFrequency(request.getFrequency());

        this.setTotalNoOfInstallments(
                request.getTotalNoOfInstallments()
        );

        // Remove fee components
        if (componentsToRemove != null) {

            for (FeeComponent component :
                    new ArrayList<>(componentsToRemove)) {

                if (component.getFeeStructure() == null
                        || !Objects.equals(
                        component.getFeeStructure().getId(),
                        this.getId()
                )) {

                    throw new OperationNotAllowedException(
                            "Fee component " + component.getId()
                                    + " does not belong to fee structure "
                                    + this.getId()
                    );
                }

                removeComponent(component);
            }
        }

        // Add new fee components
        if (request.getComponentToAdd() != null) {

            Set<FeeCategoryType> existingCategories =
                    this.components.stream()
                            .map(FeeComponent::getCategoryType)
                            .collect(Collectors.toSet());

            for (var componentRequest :
                    request.getComponentToAdd()) {

                FeeCategoryType category =
                        componentRequest.getFeeCategoryType();

                if (category == null) {
                    throw new IllegalArgumentException(
                            "Fee component category cannot be null"
                    );
                }

                if (!existingCategories.add(category)) {
                    throw new OperationNotAllowedException(
                            "Fee component category " + category
                                    + " already exists in this fee structure"
                    );
                }

                FeeComponent component = FeeComponent.builder()
                        .categoryType(category)
                        .componentName(
                                componentRequest.getComponentName()
                        )
                        .amount(componentRequest.getAmount())
                        .isMandatory(componentRequest.getIsMandatory())
                        .isRefundable(componentRequest.getIsRefundable())
                        .feeStructure(this)
                        .build();

                addComponent(component);
            }
        }

        // Synchronize specialization assignments
        List<Specialization> desiredSpecializations =
                requestedSpecializations == null
                        ? List.of()
                        : requestedSpecializations;

        // Remove assignments no longer requested
        for (FeeStructureSpecialization existing :
                new ArrayList<>(this.specializationAssignments)) {

            boolean stillAssigned = desiredSpecializations.stream()
                    .anyMatch(specialization ->
                            sameSpecialization(
                                    existing.getSpecialization(),
                                    specialization
                            )
                    );

            if (!stillAssigned) {
                this.specializationAssignments.remove(existing);
            }
        }

        // Add new assignments
        for (Specialization specialization :
                desiredSpecializations) {

            addSpecialization(specialization);
        }
    }

    // --------------------------------------------------
    // CALCULATIONS
    // --------------------------------------------------

    @Transient
    public BigDecimal getTotalAmount() {

        return components.stream()
                .filter(FeeComponent::getIsMandatory)
                .map(FeeComponent::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // --------------------------------------------------
    // EQUALS / HASHCODE
    // --------------------------------------------------

    @Override
    public boolean equals(Object o) {

        if (this == o) {
            return true;
        }

        if (!(o instanceof FeeStructure that)) {
            return false;
        }

        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // --------------------------------------------------
    // RESPONSE MAPPING
    // --------------------------------------------------

    public FeeStructureResponse mapToResponse(
            List<PermissionAction> permissionActions
    ) {

        Department department = course.getDepartment();
        School school = department.getSchool();

        return FeeStructureResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .frequency(this.getFrequency())
                .totalNoOfInstallments(
                        this.getTotalNoOfInstallments()
                )
                .feeComponent(
                        this.getComponents().stream()
                                .map(FeeComponent::mapToResponse)
                                .toList()
                )
                .specialization(
                        this.getSpecializationAssignments().stream()
                                .map(FeeStructureSpecialization::getSpecialization)
                                .map(Specialization::toCommonDTO)
                                .toList()
                )
                .courses(this.getCourse().toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .university(school.getUniversity().toCommonDTO())
                .academicYear(this.academicYear.toCommonDTO())
                .permissionActions(permissionActions)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(
                        this.getCreatedBy() == null
                                ? null
                                : this.getCreatedBy().toCommonDTO()
                )
                .updatedBy(
                        this.getUpdatedBy() == null
                                ? null
                                : this.getUpdatedBy().toCommonDTO()
                )
                .build();
    }
}
