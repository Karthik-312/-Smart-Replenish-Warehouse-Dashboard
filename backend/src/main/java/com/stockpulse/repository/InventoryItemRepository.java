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

    @Query(value = "SELECT * FROM inventory_items WHERE " +
            "(CAST(:search AS TEXT) IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%')) " +
            "OR LOWER(sku) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%')) " +
            "OR LOWER(category) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))) " +
            "AND (CAST(:category AS TEXT) IS NULL OR category = CAST(:category AS TEXT)) " +
            "AND (CAST(:status AS TEXT) IS NULL OR status = CAST(:status AS TEXT)) " +
            "ORDER BY id",
            countQuery = "SELECT count(*) FROM inventory_items WHERE " +
            "(CAST(:search AS TEXT) IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%')) " +
            "OR LOWER(sku) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%')) " +
            "OR LOWER(category) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))) " +
            "AND (CAST(:category AS TEXT) IS NULL OR category = CAST(:category AS TEXT)) " +
            "AND (CAST(:status AS TEXT) IS NULL OR status = CAST(:status AS TEXT))",
            nativeQuery = true)
    Page<InventoryItem> findFiltered(
            @Param("search") String search,
            @Param("category") String category,
            @Param("status") String status,
            Pageable pageable);
}
