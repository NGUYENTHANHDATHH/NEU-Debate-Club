package com.neudebateclub.backend.task;

import com.neudebateclub.backend.common.converter.DepartmentConverter;
import com.neudebateclub.backend.common.converter.TaskPriorityConverter;
import com.neudebateclub.backend.common.converter.TaskStatusConverter;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.TaskPriority;
import com.neudebateclub.backend.common.enums.TaskStatus;
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Convert(converter = TaskPriorityConverter.class)
    @ColumnTransformer(write = "?::task_priority_enum")
    @Column(nullable = false, columnDefinition = "task_priority_enum")
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Convert(converter = TaskStatusConverter.class)
    @ColumnTransformer(write = "?::task_status_enum")
    @Column(nullable = false, columnDefinition = "task_status_enum")
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Column(nullable = false)
    @Builder.Default
    private int progress = 0;

    @Column(name = "deadline")
    private Instant deadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", nullable = false)
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Convert(converter = DepartmentConverter.class)
    @ColumnTransformer(write = "?::department_enum")
    @Column(name = "department", columnDefinition = "department_enum")
    private Department department;

    @Column(name = "is_cross_department", nullable = false)
    @Builder.Default
    private boolean crossDepartment = false;

    @Column(name = "completed_at")
    private Instant completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
