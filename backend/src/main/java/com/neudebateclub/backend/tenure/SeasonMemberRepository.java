package com.neudebateclub.backend.tenure;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeasonMemberRepository extends JpaRepository<SeasonMember, UUID> {

    /** Rows of [seasonId (UUID), memberCount (Long)]; seasons without members are absent. */
    @Query("select m.season.id, count(m) from SeasonMember m group by m.season.id")
    List<Object[]> countBySeason();

    @EntityGraph(attributePaths = "user")
    List<SeasonMember> findBySeasonIdOrderByDepartmentAscUserFullNameAsc(UUID seasonId);

    boolean existsBySeasonIdAndUserId(UUID seasonId, UUID userId);

    Optional<SeasonMember> findByIdAndSeasonId(UUID id, UUID seasonId);
}
