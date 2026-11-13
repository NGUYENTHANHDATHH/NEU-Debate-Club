package com.neudebateclub.backend.tenure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SeasonRepository extends JpaRepository<Season, UUID> {

    List<Season> findAllByOrderByStartDateDesc();

    @Modifying
    @Query("update Season s set s.active = false where s.active = true")
    int deactivateAll();
}
