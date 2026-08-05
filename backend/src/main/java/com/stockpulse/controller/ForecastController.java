package com.stockpulse.controller;

import com.stockpulse.dto.DemandForecast;
import com.stockpulse.service.ForecastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Demand Forecast", description = "Predict future demand based on historical consumption")
public class ForecastController {

    private final ForecastService forecastService;

    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @GetMapping("/{id}/forecast")
    @Operation(summary = "Get demand forecast for an item")
    public DemandForecast getForecast(@PathVariable Long id,
                                      @RequestParam(defaultValue = "30") int days) {
        return forecastService.getForecast(id, days);
    }
}
