package com.stockpulse.repository;

import com.stockpulse.model.PurchaseOrder;
import com.stockpulse.model.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);
    List<PurchaseOrder> findByItemIdAndStatusIn(Long itemId, List<PurchaseOrderStatus> statuses);
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
}
