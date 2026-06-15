package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.contact.ContactRequest;
import com.jafpsoft.ventas.dto.contact.ContactResponse;
import com.jafpsoft.ventas.model.ContactMessage;
import com.jafpsoft.ventas.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;
    private final EmailService emailService;

    @Transactional
    public ContactResponse submit(ContactRequest req) {
        ContactMessage msg = ContactMessage.builder()
                .name(req.getName()).email(req.getEmail())
                .subject(req.getSubject()).message(req.getMessage())
                .read(false).build();
        ContactMessage saved = contactMessageRepository.save(msg);
        emailService.sendContactNotification(req.getName(), req.getEmail(), req.getSubject(), req.getMessage());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> getAll() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return contactMessageRepository.countByReadFalse();
    }

    @Transactional
    public ContactResponse markRead(Long id) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mensaje no encontrado."));
        msg.setRead(true);
        return toDto(contactMessageRepository.save(msg));
    }

    private ContactResponse toDto(ContactMessage m) {
        return ContactResponse.builder()
                .id(m.getId()).name(m.getName()).email(m.getEmail())
                .subject(m.getSubject()).message(m.getMessage())
                .read(m.isRead()).createdAt(m.getCreatedAt())
                .build();
    }
}
