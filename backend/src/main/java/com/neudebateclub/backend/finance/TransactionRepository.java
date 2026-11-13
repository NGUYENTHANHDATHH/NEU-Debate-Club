package com.neudebateclub.backend.finance;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    @EntityGraph(attributePaths = {"event", "createdBy"})
    List<Transaction> findAllByOrderByTransactionDateDescCreatedAtDesc();
}
