package com.neudebateclub.backend.notification;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @EntityGraph(attributePaths = "createdBy")
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
