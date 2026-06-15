package com.stockpulse.service;

import com.stockpulse.model.AuditAction;
import com.stockpulse.model.StockAuditLog;
import com.stockpulse.repository.StockAuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final StockAuditLogRepository repository;

    public AuditService(StockAuditLogRepository repository) {
        this.repository = repository;
    }

    public void log(Long itemId, String itemName, AuditAction action, String details,
                    Integer oldValue, Integer newValue) {
        String changedBy = getCurrentUser();
        StockAuditLog entry = new StockAuditLog(itemId, itemName, action, details, oldValue, newValue, changedBy);
        repository.save(entry);
    }

    public Page<StockAuditLog> getHistoryForItem(Long itemId, int page, int size) {
        return repository.findByItemIdOrderByTimestampDesc(itemId, PageRequest.of(page, size));
    }

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String email) {
            return email;
        }
        return "system";
    }
}
