package com.neudebateclub.backend.partner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PartnerRepository extends JpaRepository<Partner, UUID> {
    List<Partner> findAllByOrderByCompanyNameAsc();
}
