package com.stockpulse.controller;

import com.stockpulse.model.PurchaseOrder;
import com.stockpulse.model.PurchaseOrderStatus;
import com.stockpulse.repository.PurchaseOrderRepository;
import com.stockpulse.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
@Tag(name = "Purchase Orders", description = "Automatic reorder management")
public class PurchaseOrderController {

    private final PurchaseOrderRepository poRepository;
    private final InventoryService inventoryService;

    public PurchaseOrderController(PurchaseOrderRepository poRepository, InventoryService inventoryService) {
        this.poRepository = poRepository;
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @Operation(summary = "List all purchase orders, optionally filtered by status")
    public List<PurchaseOrder> getAll(@RequestParam(required = false) PurchaseOrderStatus status) {
        if (status != null) {
            return poRepository.findByStatus(status);
        }
        return poRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single purchase order")
    public ResponseEntity<PurchaseOrder> getOne(@PathVariable Long id) {
        return poRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update PO status (approve, order, receive, cancel)")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return poRepository.findById(id).map(po -> {
            PurchaseOrderStatus newStatus = PurchaseOrderStatus.valueOf(body.get("status"));
            po.setStatus(newStatus);
            PurchaseOrder saved = poRepository.save(po);

            if (newStatus == PurchaseOrderStatus.RECEIVED) {
                inventoryService.adjustStock(po.getItemId(), po.getQuantity());
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
