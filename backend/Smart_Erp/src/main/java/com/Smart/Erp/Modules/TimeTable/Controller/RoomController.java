package com.Smart.Erp.Modules.TimeTable.Controller;

import com.Smart.Erp.Modules.TimeTable.DTO.Room.RoomRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.Room.RoomResponse;
import com.Smart.Erp.Modules.TimeTable.Services.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|school-dean|super-admin}/rooms")
@RequiredArgsConstructor
public class RoomController {
    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOOL, " +
                    "#schoolId)"
    )
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @RequestParam Long schoolId,
            @RequestBody RoomRequest request
            ) {
        return ResponseEntity.ok(roomService.createRoom(schoolId, request));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ROOM, " +
                    "#roomId)"
    )
    @PutMapping
    public ResponseEntity<RoomResponse> updateRoom(
            @RequestParam Long roomId,
            @RequestBody RoomRequest request
    ) {
        return ResponseEntity.ok(roomService.updateRoom(roomId, request));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ROOM, " +
                    "#roomId)"
    )
    @DeleteMapping
    public ResponseEntity<String> deleteRoom(
            @RequestParam Long roomId
    ) {
        return ResponseEntity.ok(roomService.deleteRoom(roomId));
    }
}
