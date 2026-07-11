package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByVendorUserIdOrderByCreatedAtDesc(Long vendorUserId);
    boolean existsByVendorUserIdAndOrderId(Long vendorUserId, Long orderId);
    boolean existsByVendorUserIdAndPhone(Long vendorUserId, String phone);
    boolean existsByVendorUserIdAndEmail(Long vendorUserId, String email);
}
