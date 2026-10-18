package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.TimeTable.Entity.Room;
import com.Smart.Erp.Modules.TimeTable.Repo.RoomRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class TimeTableCommonService {
    private final RoomRepo roomRepo;

    public Room getRoom(Long id){
        return roomRepo.findById(id).orElseThrow(
                () ->
                        new ResourceNotFoundException("Room not found with id: " + id)
        );
    }
}
