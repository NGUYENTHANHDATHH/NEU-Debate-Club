package com.neudebateclub.backend.cms;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LandingProjectRepository extends JpaRepository<LandingProject, UUID> {
    List<LandingProject> findByVisibleTrueOrderByDisplayOrderAscUpdatedAtDesc();
    List<LandingProject> findAllByOrderByDisplayOrderAscUpdatedAtDesc();
    Optional<LandingProject> findBySlugAndVisibleTrue(String slug);
}