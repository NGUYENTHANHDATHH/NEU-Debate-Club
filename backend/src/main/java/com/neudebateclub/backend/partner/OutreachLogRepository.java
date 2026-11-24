package com.neudebateclub.backend.partner;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OutreachLogRepository extends JpaRepository<OutreachLog, UUID> {

    @EntityGraph(attributePaths = "createdBy")
    List<OutreachLog> findAllByPartnerIdOrderByContactDateDescCreatedAtDesc(UUID partnerId);

    /** Mới nhất trước: lần đầu gặp một partner là lần liên hệ gần nhất của họ. */
    @EntityGraph(attributePaths = "createdBy")
    List<OutreachLog> findAllByOrderByContactDateDescCreatedAtDesc();
}
