package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sectionGroup")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionGroup  extends BaseAuditableEntity implements CommonReference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Transient
    private String code;
    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;
    @ManyToOne
    @JoinColumn(name = "specialization_id")
    private Specialization specialization;
    @ToString.Exclude
    @OneToMany(mappedBy = "sectionGroup")
    @Builder.Default
    private List<StudentEnrollment> studentEnrollments = new ArrayList<>();
    public String getPrefix(){
        return this.getSection().getPrefix() + this.getSpecialization().getCode();
    }
}
