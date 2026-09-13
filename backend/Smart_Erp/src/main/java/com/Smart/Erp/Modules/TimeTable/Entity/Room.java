package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import jakarta.persistence.*;import lombok.*;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, unique = true, length = 50)
    private String roomNumber;
    @Column(name = "building_name", length = 100)
    private String buildingName;
    @Column(name = "capacity", nullable = false)
    private Integer capacity;
    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 30)
    private RoomType roomType;
    @Column(name = "has_projector")
    private Boolean hasProjector = false;
    @Column(name = "has_computers")
    private Boolean hasComputers = false;

    public enum RoomType {CLASSROOM, LABORATORY, SEMINAR_HALL,AUDITORIUM,VIRTUAL}
}
