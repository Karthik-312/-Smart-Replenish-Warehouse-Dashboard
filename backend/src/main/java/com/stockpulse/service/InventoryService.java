package com.stockpulse.service;

import com.stockpulse.dto.InventorySummary;
import com.stockpulse.model.InventoryItem;
import com.stockpulse.model.StockStatus;
import com.stockpulse.repository.InventoryItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryItemRepository repository;

    public InventoryService(InventoryItemRepository repository) {
        this.repository = repository;
    }

    public List<InventoryItem> findAll() {
        return repository.findAll();
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
        return repository.save(item);
    }

    @Transactional
    public InventoryItem update(Long id, InventoryItem updated) {
        InventoryItem existing = findById(id);
        existing.setName(updated.getName());
        existing.setSku(updated.getSku());
        existing.setCategory(updated.getCategory());
        existing.setCurrentStock(updated.getCurrentStock());
        existing.setMinThreshold(updated.getMinThreshold());
        updateStatus(existing);
        return repository.save(existing);
    }

    @Transactional
    public InventoryItem adjustStock(Long id, int delta) {
        InventoryItem item = findById(id);
        int newStock = item.getCurrentStock() + delta;
        if (newStock < 0) {
            throw new IllegalArgumentException("Stock cannot go below zero");
        }
        item.setCurrentStock(newStock);
        updateStatus(item);
        return repository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Inventory item not found: " + id);
        }
        repository.deleteById(id);
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
