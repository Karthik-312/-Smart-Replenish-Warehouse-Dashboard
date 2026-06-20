package com.stockpulse.service;

import com.stockpulse.dto.InventorySummary;
import com.stockpulse.model.AuditAction;
import com.stockpulse.model.InventoryItem;
import com.stockpulse.model.StockStatus;
import com.stockpulse.repository.InventoryItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryItemRepository repository;
    private final AuditService auditService;
    private final EmailNotificationService emailService;
    private final StockUpdateBroadcaster broadcaster;
    private final ReorderService reorderService;

    public InventoryService(InventoryItemRepository repository, AuditService auditService,
                            EmailNotificationService emailService, StockUpdateBroadcaster broadcaster,
                            ReorderService reorderService) {
        this.repository = repository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.broadcaster = broadcaster;
        this.reorderService = reorderService;
    }

    public List<InventoryItem> findAll() {
        return repository.findAll();
    }

    public Page<InventoryItem> findPaginated(int page, int size, String search, String category, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        String categoryParam = (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) ? category : null;
        StockStatus statusParam = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            try {
                statusParam = StockStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return repository.findFiltered(searchParam, categoryParam, statusParam, pageable);
    }

    public InventoryItem findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found: " + id));
    }

    @Transactional
    public InventoryItem create(InventoryItem item) {
        if (item.getCurrentStock() < 0 || item.getMinThreshold() < 0) {
            throw new IllegalArgumentException("Stock values cannot be negative");
        }
        updateStatus(item);
        InventoryItem saved = repository.save(item);
        auditService.log(saved.getId(), saved.getName(), AuditAction.CREATE,
                "Created with stock " + saved.getCurrentStock(), null, saved.getCurrentStock());
        broadcaster.broadcastUpdate("CREATE", saved);
        return saved;
    }

    @Transactional
    public InventoryItem update(Long id, InventoryItem updated) {
        InventoryItem existing = findById(id);
        int oldStock = existing.getCurrentStock();
        existing.setName(updated.getName());
        existing.setSku(updated.getSku());
        existing.setCategory(updated.getCategory());
        existing.setCurrentStock(updated.getCurrentStock());
        existing.setMinThreshold(updated.getMinThreshold());
        updateStatus(existing);
        InventoryItem saved = repository.save(existing);
        auditService.log(saved.getId(), saved.getName(), AuditAction.UPDATE,
                "Item details updated", oldStock, saved.getCurrentStock());
        broadcaster.broadcastUpdate("UPDATE", saved);
        return saved;
    }

    @Transactional
    public InventoryItem adjustStock(Long id, int delta) {
        InventoryItem item = findById(id);
        int oldStock = item.getCurrentStock();
        int newStock = oldStock + delta;
        if (newStock < 0) {
            throw new IllegalArgumentException("Stock cannot go below zero");
        }
        item.setCurrentStock(newStock);
        updateStatus(item);
        InventoryItem saved = repository.save(item);
        auditService.log(saved.getId(), saved.getName(), AuditAction.ADJUST,
                "Stock adjusted by " + (delta > 0 ? "+" : "") + delta, oldStock, newStock);
        broadcaster.broadcastUpdate("ADJUST", saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        InventoryItem item = findById(id);
        auditService.log(item.getId(), item.getName(), AuditAction.DELETE,
                "Item deleted", item.getCurrentStock(), null);
        repository.deleteById(id);
        broadcaster.broadcastDelete(id, item.getName());
    }

    public InventorySummary getSummary() {
        long total = repository.count();
        long low = repository.countByStatus(StockStatus.LOW);
        long outOfStock = repository.countByStatus(StockStatus.OUT_OF_STOCK);
        return new InventorySummary(total, low, outOfStock);
    }

    public void updateStatus(InventoryItem item) {
        StockStatus previousStatus = item.getStatus();
        StockStatus newStatus = calculateStatus(item.getCurrentStock(), item.getMinThreshold());
        item.setStatus(newStatus);

        if (newStatus == StockStatus.LOW || newStatus == StockStatus.OUT_OF_STOCK) {
            if (previousStatus != newStatus || previousStatus == null) {
                logReorderAlert(item.getSku(), newStatus);
                emailService.sendLowStockAlert(item, newStatus);
                reorderService.generateOrderIfNeeded(item);
            }
        }
    }

    private StockStatus calculateStatus(int currentStock, int minThreshold) {
        if (currentStock <= 0) {
            return StockStatus.OUT_OF_STOCK;
        }
        if (currentStock <= minThreshold) {
            return StockStatus.LOW;
        }
        return StockStatus.HEALTHY;
    }

    private void logReorderAlert(String sku, StockStatus status) {
        if (status == StockStatus.OUT_OF_STOCK) {
            System.out.println("REORDER ALERT: " + sku + " is out of stock!");
        } else {
            System.out.println("REORDER ALERT: " + sku + " is low!");
        }
        log.warn("REORDER ALERT: {} is {}!", sku, status == StockStatus.OUT_OF_STOCK ? "out of stock" : "low");
    }
}
