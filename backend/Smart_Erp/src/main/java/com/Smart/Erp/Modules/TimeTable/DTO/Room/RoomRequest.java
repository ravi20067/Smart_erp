package com.Smart.Erp.Modules.TimeTable.DTO.Room;

import com.Smart.Erp.Modules.TimeTable.Entity.Room;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomRequest {
    @NotBlank
    @Size(max = 50)
    private String roomNumber;
    @Size(max = 120)
    private String buildingName;
    private Integer floorNumber;
    @Min(0)
    private Integer rows;
    @Min(0)
    private Integer columns;
    private Room.RoomType roomType;
    private Boolean hasProjector;
    private Boolean hasComputers;
}
