package com.neudebateclub.backend.finance;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    @EntityGraph(attributePaths = {"event", "createdBy", "member"})
    List<Transaction> findAllByOrderByTransactionDateDescCreatedAtDesc();

    @EntityGraph(attributePaths = {"event", "createdBy", "member"})
    List<Transaction> findAllByEventIsNotNullOrderByTransactionDateDescCreatedAtDesc();

    @EntityGraph(attributePaths = {"event", "createdBy", "member"})
    List<Transaction> findAllByMemberIdOrderByTransactionDateDescCreatedAtDesc(UUID memberId);

    @EntityGraph(attributePaths = {"createdBy", "member"})
    Optional<Transaction> findByPayosOrderCode(Long payosOrderCode);

    @Query(value = "SELECT nextval('payos_order_code_seq')", nativeQuery = true)
    long nextPayosOrderCode();
}
