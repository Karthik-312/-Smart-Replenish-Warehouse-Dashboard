package com.stockpulse.dto;

public record InventorySummary(
        long totalItems,
        long lowStockItems,
        long outOfStockItems
) {
}
