package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.OrderRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRequestRepository extends JpaRepository<OrderRequest, Long> {
    List<OrderRequest> findByVendorUserIdOrderByCreatedAtDesc(Long vendorUserId);
    long countByVendorUserId(Long vendorUserId);
    long countByVendorUserIdAndStatus(Long vendorUserId, String status);
    long countByStatusNot(String status);
}
