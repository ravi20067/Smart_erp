package com.Smart.Erp.Modules.Finance.DTO.Student;

import com.Smart.Erp.Modules.Finance.Enum.FeeAccountStatus;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.Finance.Enum.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
@Data
public class FeeResponse {
    private long id;
    private BigDecimal totalAmount;
    private BigDecimal payableAmount;
    private BigDecimal paidAmount;
    private BigDecimal balance;
    private FeeFrequency frequency;
    private FeeAccountStatus status;
    private LocalDate dueDate;
}
