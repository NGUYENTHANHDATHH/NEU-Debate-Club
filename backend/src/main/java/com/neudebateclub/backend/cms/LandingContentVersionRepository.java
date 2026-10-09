package com.neudebateclub.backend.cms;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LandingContentVersionRepository extends JpaRepository<LandingContentVersion, UUID> {
    Optional<LandingContentVersion> findFirstBySectionAndStatusOrderByCreatedAtDesc(String section, String status);

    List<LandingContentVersion> findTop20BySectionOrderByCreatedAtDesc(String section);
}