package com.stockpulse.repository;

import com.stockpulse.model.InventoryItem;
import com.stockpulse.model.StockStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    long countByStatus(StockStatus status);

    List<InventoryItem> findByStatus(StockStatus status);

    Optional<InventoryItem> findBySkuIgnoreCase(String sku);

    @Query("SELECT i FROM InventoryItem i WHERE " +
            "(:search IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(i.category) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:category IS NULL OR i.category = :category) " +
            "AND (:status IS NULL OR i.status = :status)")
    Page<InventoryItem> findFiltered(
            @Param("search") String search,
            @Param("category") String category,
            @Param("status") StockStatus status,
            Pageable pageable);
}
