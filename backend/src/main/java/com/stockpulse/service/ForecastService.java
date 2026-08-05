package com.stockpulse.service;

import com.stockpulse.dto.DemandForecast;
import com.stockpulse.model.AuditAction;
import com.stockpulse.model.InventoryItem;
import com.stockpulse.model.StockAuditLog;
import com.stockpulse.repository.InventoryItemRepository;
import com.stockpulse.repository.StockAuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ForecastService {

    private final StockAuditLogRepository auditRepo;
    private final InventoryItemRepository itemRepo;

    public ForecastService(StockAuditLogRepository auditRepo, InventoryItemRepository itemRepo) {
        this.auditRepo = auditRepo;
        this.itemRepo = itemRepo;
    }

    public DemandForecast getForecast(Long itemId, int daysBack) {
        InventoryItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));

        LocalDateTime since = LocalDateTime.now().minusDays(daysBack);
        List<StockAuditLog> adjustments = auditRepo.findByItemIdAndActionAndTimestampAfter(
                itemId, AuditAction.ADJUST, since);

        int totalConsumed = 0;
        int dataPoints = 0;
        for (StockAuditLog log : adjustments) {
            if (log.getOldValue() != null && log.getNewValue() != null) {
                int delta = log.getOldValue() - log.getNewValue();
                if (delta > 0) {
                    totalConsumed += delta;
                    dataPoints++;
                }
            }
        }

        double avgDaily = daysBack > 0 ? (double) totalConsumed / daysBack : 0;
        double daysUntilStockout = avgDaily > 0 ? item.getCurrentStock() / avgDaily : 999;
        int suggestedQty = (int) Math.ceil(avgDaily * 14);

        return new DemandForecast(
                Math.round(avgDaily * 100.0) / 100.0,
                Math.round(daysUntilStockout * 10.0) / 10.0,
                Math.max(suggestedQty, 1),
                dataPoints
        );
    }
}
