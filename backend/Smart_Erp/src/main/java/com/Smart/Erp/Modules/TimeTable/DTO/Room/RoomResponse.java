package com.Smart.Erp.Modules.TimeTable.DTO.Room;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.TimeTable.Entity.Room;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@SuperBuilder
public class RoomResponse extends BaseDTO {
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
