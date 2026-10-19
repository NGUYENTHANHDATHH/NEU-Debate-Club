package com.neudebateclub.backend.task;

import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.TaskPriority;
import com.neudebateclub.backend.common.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findAllByOrderByCreatedAtDesc();

    List<Task> findByDepartmentOrderByCreatedAtDesc(Department department);

    List<Task> findByAssignedToIdOrderByCreatedAtDesc(UUID assignedToId);

    @Query(value = """
            SELECT * FROM tasks
            WHERE (CAST(:department AS text) IS NULL OR department::text = LOWER(CAST(:department AS text)))
              AND (CAST(:status AS text) IS NULL OR status::text = LOWER(CAST(:status AS text)))
              AND (CAST(:priority AS text) IS NULL OR priority::text = LOWER(CAST(:priority AS text)))
            ORDER BY created_at DESC
            """, nativeQuery = true)
    List<Task> findWithFilters(
            @Param("department") Department department,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority
    );
}
