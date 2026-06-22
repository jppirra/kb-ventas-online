package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.MercadoPagoPaymentLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MercadoPagoPaymentLogRepository extends JpaRepository<MercadoPagoPaymentLog, Long> {

    List<MercadoPagoPaymentLog> findBySaleTicketIdOrderByCreatedAtDesc(Long saleTicketId);

    List<MercadoPagoPaymentLog> findByVendorUserIdOrderByCreatedAtDesc(Long vendorUserId);
}
