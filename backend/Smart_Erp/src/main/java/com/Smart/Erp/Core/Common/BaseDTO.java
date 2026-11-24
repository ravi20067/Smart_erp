package com.Smart.Erp.Core.Common;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Data
@SuperBuilder
public abstract class BaseDTO {
    private Instant createdAt;
    private Instant updatedAt;
    private CommonDTO createdBy;
    private CommonDTO updatedBy;
}
