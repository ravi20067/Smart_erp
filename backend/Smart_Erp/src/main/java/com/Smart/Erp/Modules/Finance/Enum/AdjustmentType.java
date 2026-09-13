package com.Smart.Erp.Modules.Finance.Enum;

public enum AdjustmentType {
    FINE,        // Increases payable balance (e.g. late fee, lab damage)
    PENALTY,     // Increases payable balance
    DISCOUNT,    // Decreases payable balance (one-off concession)
    WAIVER       // Decreases payable balance
}