package com.Smart.Erp.Modules.TimeTable.DTO.Room;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.TimeTable.Entity.Room;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RoomResponse {
    private Long id;
    private CommonDTO university;
    private CommonDTO school;
    private String roomNumber;
    private String buildingName;
    private Integer floorNumber;
    private Integer rows;
    private Integer columns;
    private Integer capacity;
    private Room.RoomType roomType;
    private Boolean hasProjector;
    private Boolean hasComputers;
    private List<PermissionAction> permissionActions;
}
