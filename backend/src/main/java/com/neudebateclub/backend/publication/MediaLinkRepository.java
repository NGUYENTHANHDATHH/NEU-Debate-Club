package com.neudebateclub.backend.publication;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MediaLinkRepository extends JpaRepository<MediaLink, UUID> {

    @EntityGraph(attributePaths = {"event", "createdBy"})
    List<MediaLink> findAllByOrderByPostedAtDescCreatedAtDesc();
}
