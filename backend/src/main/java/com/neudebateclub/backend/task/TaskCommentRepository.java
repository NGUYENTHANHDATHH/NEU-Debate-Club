package com.neudebateclub.backend.task;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {
    @EntityGraph(attributePaths = "user")
    List<TaskComment> findByTaskIdOrderByCreatedAtAscIdAsc(UUID taskId);
}
