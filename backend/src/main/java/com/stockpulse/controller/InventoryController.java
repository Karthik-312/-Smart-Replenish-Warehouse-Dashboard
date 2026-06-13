package com.stockpulse.controller;

import com.stockpulse.dto.InventorySummary;
import com.stockpulse.model.InventoryItem;
import com.stockpulse.service.InventoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<InventoryItem> getAllItems() {
        return inventoryService.findAll();
    }

    @GetMapping("/summary")
    public InventorySummary getSummary() {
        return inventoryService.getSummary();
    }

    @GetMapping("/{id}")
    public InventoryItem getItem(@PathVariable Long id) {
        return inventoryService.findById(id);
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createItem(@RequestBody InventoryItem item) {
        InventoryItem created = inventoryService.create(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public InventoryItem updateItem(@PathVariable Long id, @RequestBody InventoryItem item) {
        return inventoryService.update(id, item);
    }

    @PostMapping("/{id}/adjust")
    public InventoryItem adjustStock(@PathVariable Long id, @RequestParam int delta) {
        return inventoryService.adjustStock(id, delta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteItem(@PathVariable Long id) {
        inventoryService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Item deleted successfully"));
    }
}
