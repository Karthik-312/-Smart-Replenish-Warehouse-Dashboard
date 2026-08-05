package com.stockpulse.service;

import com.stockpulse.model.InventoryItem;
import com.stockpulse.model.PurchaseOrder;
import com.stockpulse.model.PurchaseOrderStatus;
import com.stockpulse.repository.PurchaseOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReorderService {

    private static final Logger log = LoggerFactory.getLogger(ReorderService.class);

    private final PurchaseOrderRepository poRepository;

    public ReorderService(PurchaseOrderRepository poRepository) {
        this.poRepository = poRepository;
    }

    public void generateOrderIfNeeded(InventoryItem item) {
        List<PurchaseOrderStatus> openStatuses = List.of(
                PurchaseOrderStatus.PENDING,
                PurchaseOrderStatus.APPROVED,
                PurchaseOrderStatus.ORDERED
        );

        List<PurchaseOrder> existing = poRepository.findByItemIdAndStatusIn(item.getId(), openStatuses);
        if (!existing.isEmpty()) {
            log.debug("Open PO already exists for item {}, skipping", item.getSku());
            return;
        }

        int suggestedQty = Math.max(1, item.getMinThreshold() * 2 - item.getCurrentStock());

        PurchaseOrder po = new PurchaseOrder();
        po.setItemId(item.getId());
        po.setItemName(item.getName());
        po.setSku(item.getSku());
        po.setSupplierId(item.getSupplierId());
        po.setQuantity(suggestedQty);
        po.setStatus(PurchaseOrderStatus.PENDING);

        poRepository.save(po);
        log.info("Auto-generated PO for {} (qty: {})", item.getSku(), suggestedQty);
    }
}
