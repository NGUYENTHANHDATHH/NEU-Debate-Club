package com.neudebateclub.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

    boolean existsByStudentIdIgnoreCase(String studentId);

    boolean existsByStudentIdIgnoreCaseAndIdNot(String studentId, UUID id);

    List<User> findAllByOrderByFullNameAsc();

    @Query(value = """
            SELECT * FROM users
            WHERE department::text = LOWER(CAST(:department AS text))
              AND role::text = LOWER(CAST(:role AS text))
              AND is_active = true
            LIMIT 1
            """, nativeQuery = true)
    Optional<User> findFirstByDepartmentAndRoleAndActiveTrue(
            @Param("department") Department department,
            @Param("role") Role role);

    @Query(value = """
            SELECT * FROM users
            WHERE department::text = LOWER(CAST(:department AS text))
              AND is_active = true
            LIMIT 1
            """, nativeQuery = true)
    Optional<User> findFirstByDepartmentAndActiveTrue(@Param("department") Department department);

    @Query(value = """
            SELECT * FROM users
            WHERE role::text = LOWER(CAST(:role AS text))
              AND is_active = true
            LIMIT 1
            """, nativeQuery = true)
    Optional<User> findFirstByRoleAndActiveTrue(@Param("role") Role role);
}
