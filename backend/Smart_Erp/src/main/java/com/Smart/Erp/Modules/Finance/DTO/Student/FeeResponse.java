package com.Smart.Erp.Modules.Finance.DTO.Student;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
@Data
public class FeeResponse {
    private long id;
    private BigDecimal netPayableAmount;
    private LocalDate dueDate;
}
