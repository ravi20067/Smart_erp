package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.TimeTable.DTO.Room.RoomRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.Room.RoomResponse;
import com.Smart.Erp.Modules.TimeTable.Entity.Room;
import com.Smart.Erp.Modules.TimeTable.Repo.RoomRepo;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import com.Smart.Erp.Core.Exception.DuplicateResourceException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@AllArgsConstructor
public class RoomService {
    private final RoomRepo repository;
    private final AuthorizationService authorizationService;
    private final TimeTableCommonService commonService;
    private final AcademicCommonService academicCommonService;

    public List<RoomResponse> getAllRooms() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.ROOM);
        Set<Long> readableRoomIds = map.entrySet().stream()
                .filter(entry -> entry.getValue().contains(PermissionAction.READ))
                .map(Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toSet());

        List<Room> rooms = repository.findAllById(readableRoomIds);

        return rooms.stream()
                .map(room -> room.mapToResponse(map.get(room.getId())))
                .toList();
    }

    public RoomResponse createRoom(Long schoolId, RoomRequest request) {
        School school = academicCommonService.getSchool(schoolId);
        if (repository.existsByRoomNumber(request.getRoomNumber())) {
            throw new DuplicateResourceException(
                    "A room with number '" + request.getRoomNumber() + "' already exists"
            );
        }
        Room room = Room.createFromRequest(request, school);
        room = repository.save(room);
        authorizationService.createChildPermission(room.getId(), ResourceType.ROOM, schoolId, ResourceType.SCHOOL);
        return room.mapToResponse(authorizationService.getPermissionAction(ResourceType.ROOM, room.getId()));
    }

    public RoomResponse updateRoom(Long roomId, RoomRequest request) {
        Room room = commonService.getRoom(roomId);
        if (repository.existsByRoomNumberAndIdNot(request.getRoomNumber(), roomId)) {
            throw new DuplicateResourceException(
                    "A room with number '" + request.getRoomNumber() + "' already exists"
            );
        }
        room.updateFromRequest(request);
        room = repository.save(room);
        return room.mapToResponse(authorizationService.getPermissionAction(ResourceType.ROOM, room.getId()));
    }

    public String deleteRoom(Long roomId) {
        Room room = commonService.getRoom(roomId);
        repository.delete(room);
        //add extra check after time table is implemented to check if room is used in any timetable before deleting
        authorizationService.deletePermission(ResourceType.ROOM, roomId);
        return "Room deleted successfully";
    }
}
