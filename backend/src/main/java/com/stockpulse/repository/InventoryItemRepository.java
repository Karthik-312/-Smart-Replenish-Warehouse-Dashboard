package com.stockpulse.repository;

import com.stockpulse.model.InventoryItem;
import com.stockpulse.model.StockStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    long countByStatus(StockStatus status);

    List<InventoryItem> findByStatus(StockStatus status);
}
