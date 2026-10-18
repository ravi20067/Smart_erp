package com.Smart.Erp.Modules.TimeTable.DTO.Room;

import com.Smart.Erp.Modules.TimeTable.Entity.Room;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomRequest {
    private String roomNumber;
    private String buildingName;
    private Integer floorNumber;
    private Integer rows;
    private Integer columns;
    private Room.RoomType roomType;
    private Boolean hasProjector;
    private Boolean hasComputers;
}
