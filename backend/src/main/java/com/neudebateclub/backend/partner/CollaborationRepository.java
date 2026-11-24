package com.neudebateclub.backend.partner;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CollaborationRepository extends JpaRepository<Collaboration, UUID> {

    @EntityGraph(attributePaths = "event")
    List<Collaboration> findAllByPartnerIdOrderByCollaborationDateDesc(UUID partnerId);

    boolean existsByPartnerId(UUID partnerId);
}
