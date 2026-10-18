package com.neudebateclub.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

    boolean existsByStudentIdIgnoreCase(String studentId);

    boolean existsByStudentIdIgnoreCaseAndIdNot(String studentId, UUID id);

    List<User> findAllByOrderByFullNameAsc();
}
