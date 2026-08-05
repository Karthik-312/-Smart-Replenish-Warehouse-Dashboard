package com.stockpulse.repository;

import com.stockpulse.model.WarehouseStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, Long> {
    List<WarehouseStock> findByWarehouseId(Long warehouseId);
    List<WarehouseStock> findByItemId(Long itemId);
    Optional<WarehouseStock> findByWarehouseIdAndItemId(Long warehouseId, Long itemId);
    boolean existsByWarehouseId(Long warehouseId);
}
