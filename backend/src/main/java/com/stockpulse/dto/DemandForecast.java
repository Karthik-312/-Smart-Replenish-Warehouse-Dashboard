package com.stockpulse.dto;

public record DemandForecast(
        double avgDailyConsumption,
        double daysUntilStockout,
        int suggestedReorderQty,
        int dataPoints
) {}
