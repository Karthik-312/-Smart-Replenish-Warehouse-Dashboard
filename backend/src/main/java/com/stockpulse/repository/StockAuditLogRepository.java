package com.stockpulse.repository;

import com.stockpulse.model.StockAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockAuditLogRepository extends JpaRepository<StockAuditLog, Long> {

    Page<StockAuditLog> findByItemIdOrderByTimestampDesc(Long itemId, Pageable pageable);
}
