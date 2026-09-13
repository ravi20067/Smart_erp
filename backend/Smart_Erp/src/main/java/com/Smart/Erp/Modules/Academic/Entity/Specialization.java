package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Specialization  extends BaseAuditableEntity implements CommonReference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code = "";

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Builder.Default
    @ToString.Exclude
    @ManyToMany(mappedBy = "specializations")
    private List<Subject> subjects = new ArrayList<>();

    @Builder.Default
    @ToString.Exclude
    @OneToMany(mappedBy = "specialization")
    private List<SectionGroup> sectionGroups = new ArrayList<>();


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "fee_structure_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_specialization_fee_structure")
    )
    private FeeStructure feeStructure;


    public String getPrefix(){
        return this.getCourse().getPrefix() + this.getCourse().getCode();
    }

    public String getPostfix(){
        int studentCount = sectionGroups.stream()
                .mapToInt(sectionGroup -> sectionGroup.getStudentEnrollments().size())
                .sum();

        return this.getCourse().getCode()
                + this.getCode()
                + String.format("%04d", studentCount + 1);

    }
}
