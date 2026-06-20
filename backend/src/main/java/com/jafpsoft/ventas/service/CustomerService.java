package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.customer.CustomerRequest;
import com.jafpsoft.ventas.dto.customer.CustomerResponse;
import com.jafpsoft.ventas.model.Customer;
import com.jafpsoft.ventas.repository.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public List<CustomerResponse> list(Long vendorUserId) {
        return customerRepository.findByVendorUserIdOrderByCreatedAtDesc(vendorUserId)
                .stream().map(CustomerResponse::from).toList();
    }

    @Transactional
    public CustomerResponse create(Long vendorUserId, CustomerRequest req) {
        if (req.getOrderId() != null && customerRepository.existsByVendorUserIdAndOrderId(vendorUserId, req.getOrderId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El cliente ya fue guardado desde este pedido");
        }
        Customer customer = Customer.builder()
                .vendorUserId(vendorUserId)
                .name(req.getName())
                .dni(req.getDni())
                .phone(req.getPhone())
                .email(req.getEmail())
                .notes(req.getNotes())
                .source(req.getSource() != null ? req.getSource() : "manual")
                .orderId(req.getOrderId())
                .build();
        return CustomerResponse.from(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long vendorUserId, Long id, CustomerRequest req) {
        Customer customer = customerRepository.findById(id)
                .filter(c -> c.getVendorUserId().equals(vendorUserId))
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
        customer.setName(req.getName());
        customer.setDni(req.getDni());
        customer.setPhone(req.getPhone());
        customer.setEmail(req.getEmail());
        customer.setNotes(req.getNotes());
        return CustomerResponse.from(customerRepository.save(customer));
    }

    @Transactional
    public void delete(Long vendorUserId, Long id) {
        Customer customer = customerRepository.findById(id)
                .filter(c -> c.getVendorUserId().equals(vendorUserId))
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
        customerRepository.delete(customer);
    }

    public boolean existsFromOrder(Long vendorUserId, Long orderId) {
        return customerRepository.existsByVendorUserIdAndOrderId(vendorUserId, orderId);
    }
}
