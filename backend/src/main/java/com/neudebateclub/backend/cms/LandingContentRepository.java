package com.neudebateclub.backend.cms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LandingContentRepository extends JpaRepository<LandingContent, UUID> {

    @Query(value = "SELECT * FROM landing_content WHERE is_published = true", nativeQuery = true)
    List<LandingContent> findAllPublished();

    @Query(value = "SELECT * FROM landing_content WHERE section = CAST(:section AS landing_section_enum) AND is_published = true",
            nativeQuery = true)
    Optional<LandingContent> findPublishedBySection(@Param("section") String section);

    Optional<LandingContent> findBySection(String section);
}
