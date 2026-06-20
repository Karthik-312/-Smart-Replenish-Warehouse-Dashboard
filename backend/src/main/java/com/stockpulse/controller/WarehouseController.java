package com.stockpulse.controller;

import com.stockpulse.model.Warehouse;
import com.stockpulse.model.WarehouseStock;
import com.stockpulse.repository.WarehouseRepository;
import com.stockpulse.repository.WarehouseStockRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouses")
@Tag(name = "Warehouses", description = "Warehouse management and per-warehouse stock tracking")
public class WarehouseController {

    private final WarehouseRepository warehouseRepo;
    private final WarehouseStockRepository stockRepo;

    public WarehouseController(WarehouseRepository warehouseRepo, WarehouseStockRepository stockRepo) {
        this.warehouseRepo = warehouseRepo;
        this.stockRepo = stockRepo;
    }

    @GetMapping
    @Operation(summary = "List all warehouses")
    public List<Warehouse> getAll() {
        return warehouseRepo.findAll();
    }

    @PostMapping
    @Operation(summary = "Create a new warehouse")
    public Warehouse create(@RequestBody Warehouse warehouse) {
        return warehouseRepo.save(warehouse);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a warehouse")
    public ResponseEntity<Warehouse> update(@PathVariable Long id, @RequestBody Warehouse updated) {
        return warehouseRepo.findById(id).map(w -> {
            w.setName(updated.getName());
            w.setLocation(updated.getLocation());
            w.setDefault(updated.isDefault());
            return ResponseEntity.ok(warehouseRepo.save(w));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a warehouse (only if no stock)")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        if (stockRepo.existsByWarehouseId(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete warehouse with stock. Move stock first."));
        }
        warehouseRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Warehouse deleted"));
    }

    @GetMapping("/{id}/stock")
    @Operation(summary = "Get all item stock for a warehouse")
    public List<WarehouseStock> getWarehouseStock(@PathVariable Long id) {
        return stockRepo.findByWarehouseId(id);
    }

    @GetMapping("/item/{itemId}/breakdown")
    @Operation(summary = "Get per-warehouse stock breakdown for an item")
    public List<WarehouseStock> getItemBreakdown(@PathVariable Long itemId) {
        return stockRepo.findByItemId(itemId);
    }

    @PostMapping("/item/{itemId}/stock")
    @Operation(summary = "Set stock for an item in a specific warehouse")
    public WarehouseStock setItemStock(@PathVariable Long itemId, @RequestBody Map<String, Object> body) {
        Long warehouseId = Long.valueOf(body.get("warehouseId").toString());
        int quantity = Integer.parseInt(body.get("quantity").toString());

        WarehouseStock ws = stockRepo.findByWarehouseIdAndItemId(warehouseId, itemId)
                .orElseGet(() -> {
                    WarehouseStock n = new WarehouseStock();
                    n.setWarehouseId(warehouseId);
                    n.setItemId(itemId);
                    return n;
                });
        ws.setQuantity(quantity);
        return stockRepo.save(ws);
    }
}
