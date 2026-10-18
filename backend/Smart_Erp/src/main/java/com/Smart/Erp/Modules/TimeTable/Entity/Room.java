package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.TimeTable.DTO.Room.RoomRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.Room.RoomResponse;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;import lombok.*;

import java.util.List;

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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;
    @Column(name = "room_number", nullable = false, unique = true, length = 50)
    private String roomNumber;
    @Column(name = "building_name", length = 100)
    private String buildingName;
    private Integer floorNumber;
    private Integer rowCount;
    private Integer columnCount;
    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 30)
    private RoomType roomType;
    @Column(name = "has_projector")
    private Boolean hasProjector = false;
    @Column(name = "has_computers")
    private Boolean hasComputers = false;

    public static Room createFromRequest(RoomRequest request, School school) {
        return Room.builder()
                .roomNumber(request.getRoomNumber())
                .buildingName(request.getBuildingName())
                .floorNumber(request.getFloorNumber())
                .rowCount(request.getRows())
                .columnCount(request.getColumns())
                .roomType(request.getRoomType())
                .hasProjector(request.getHasProjector())
                .hasComputers(request.getHasComputers())
                .school(school)
                .build();
    }

    public void updateFromRequest(RoomRequest request) {
        this.roomNumber = request.getRoomNumber();
        this.buildingName = request.getBuildingName();
        this.floorNumber = request.getFloorNumber();
        this.rowCount = request.getRows();
        this.columnCount = request.getColumns();
        this.roomType = request.getRoomType();
        this.hasProjector = request.getHasProjector();
        this.hasComputers = request.getHasComputers();
    }

    public enum RoomType {CLASSROOM, LABORATORY, SEMINAR_HALL,AUDITORIUM,VIRTUAL}

    public RoomResponse mapToResponse(List<PermissionAction> permissionActions) {
        return RoomResponse.builder()
                .id(this.id)
                .university(this.school.getUniversity().toCommonDTO())
                .school(this.school.toCommonDTO())
                .roomNumber(this.roomNumber)
                .buildingName(this.buildingName)
                .floorNumber(this.floorNumber)
                .rows(this.rowCount)
                .columns(this.columnCount)
                .capacity(this.rowCount != null && this.columnCount != null ? this.rowCount * this.columnCount : null)
                .roomType(this.roomType)
                .hasProjector(this.hasProjector)
                .hasComputers(this.hasComputers)
                .permissionActions(permissionActions)
                .build();
    }
}
