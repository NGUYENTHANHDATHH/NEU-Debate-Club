package com.neudebateclub.backend.cms;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LandingAchievementRepository extends JpaRepository<LandingAchievement, UUID> {
    List<LandingAchievement> findByVisibleTrueOrderByDisplayOrderAscUpdatedAtDesc();
    List<LandingAchievement> findAllByOrderByDisplayOrderAscUpdatedAtDesc();
    Optional<LandingAchievement> findBySlugAndVisibleTrue(String slug);
}