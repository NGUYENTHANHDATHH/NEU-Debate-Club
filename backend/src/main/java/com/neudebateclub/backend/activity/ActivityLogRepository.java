package com.neudebateclub.backend.activity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
