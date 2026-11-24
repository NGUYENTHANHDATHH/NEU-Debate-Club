package com.neudebateclub.backend.partner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PartnerContactRepository extends JpaRepository<PartnerContact, UUID> {
    List<PartnerContact> findAllByPartnerIdOrderByPrimaryDescFullNameAsc(UUID partnerId);
}
