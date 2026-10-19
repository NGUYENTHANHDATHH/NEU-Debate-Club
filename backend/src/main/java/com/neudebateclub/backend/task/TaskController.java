package com.neudebateclub.backend.task;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.TaskPriority;
import com.neudebateclub.backend.common.enums.TaskStatus;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RoleGuard roleGuard;

    private static final List<Department> SPECIALIZED_DEPARTMENTS = List.of(
            Department.TRUYEN_THONG,
            Department.NOI_DUNG,
            Department.SU_KIEN,
            Department.DOI_NGOAI,
            Department.KY_THUAT,
            Department.NHAN_SU
    );

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> list(
            @RequestParam(required = false) Department department,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @CurrentUser UserPrincipal currentUser) {
        if (currentUser != null) {
            roleGuard.requireMemberOrAbove(currentUser);
        }

        List<Task> tasks;
        if (department == null && status == null && priority == null) {
            tasks = taskRepository.findAllByOrderByCreatedAtDesc();
        } else {
            tasks = taskRepository.findWithFilters(department, status, priority);
        }

        return ResponseEntity.ok(ApiResponse.success(
                tasks.stream().map(TaskResponse::from).toList()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getById(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        if (currentUser != null) {
            roleGuard.requireMemberOrAbove(currentUser);
        }

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id.toString()));
        return ResponseEntity.ok(ApiResponse.success(TaskResponse.from(task)));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<List<TaskResponse>>> create(
            @Valid @RequestBody CreateTaskRequest request,
            @CurrentUser UserPrincipal currentUser) {
        if (currentUser != null) {
            roleGuard.requireTruongBanOrAbove(currentUser);
        }

        User assignedByUser = resolveAssignerUser(currentUser);
        User assignedToUser = Boolean.TRUE.equals(request.assignToAllDepartments())
                ? assignedByUser
                : resolveAssignee(request, currentUser, assignedByUser);
        Event event = request.eventId() != null
                ? eventRepository.findById(request.eventId()).orElse(null)
                : null;

        List<TaskResponse> responses = new ArrayList<>();

        if (Boolean.TRUE.equals(request.assignToAllDepartments())) {
            // Nghiệp vụ: BCN giao đồng loạt cho cả 6 ban chuyên môn
            for (Department dept : SPECIALIZED_DEPARTMENTS) {
                User departmentLead = resolveDepartmentLead(dept, assignedByUser);
                Task task = Task.builder()
                        .title(request.title().trim())
                        .description(request.description() == null ? null : request.description().trim())
                        .department(dept)
                        .priority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM)
                        .status(request.status() != null ? request.status() : TaskStatus.TODO)
                        .deadline(request.deadline())
                        .crossDepartment(true)
                        .event(event)
                        .assignedBy(assignedByUser)
                        .assignedTo(departmentLead)
                        .build();

                if (task.getStatus() == TaskStatus.DONE) {
                    task.setCompletedAt(Instant.now());
                }
                responses.add(TaskResponse.from(taskRepository.save(task)));
            }

            return ResponseEntity.status(201).body(ApiResponse.success(
                    "Đã phân phối nhiệm vụ tới Trưởng ban của cả 6 ban chuyên môn",
                    responses
            ));
        } else {
            // Nghiệp vụ: BCN giao cho một ban cụ thể - chỉ Trưởng ban của ban đó nhận
            Department targetDepartment = request.department();
            User departmentLead = assignedToUser;

            Task task = Task.builder()
                    .title(request.title().trim())
                    .description(request.description() == null ? null : request.description().trim())
                    .department(targetDepartment)
                    .priority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM)
                    .status(request.status() != null ? request.status() : TaskStatus.TODO)
                    .deadline(request.deadline())
                    .crossDepartment(Boolean.TRUE.equals(request.crossDepartment()))
                    .event(event)
                    .assignedBy(assignedByUser)
                    .assignedTo(departmentLead)
                    .build();

            if (task.getStatus() == TaskStatus.DONE) {
                task.setCompletedAt(Instant.now());
            }

            Task saved = taskRepository.save(task);
            responses.add(TaskResponse.from(saved));

            return ResponseEntity.status(201).body(ApiResponse.success(
                    "Đã giao nhiệm vụ thành công cho Trưởng " + formatDepartmentName(targetDepartment),
                    responses
            ));
        }
    }

    private User resolveAssignee(CreateTaskRequest request, UserPrincipal currentUser, User fallbackUser) {
        if (currentUser == null || currentUser.getRole() != Role.TRUONG_BAN) {
            return request.assignedToId() == null
                    ? resolveDepartmentLead(request.department(), fallbackUser)
                    : findMemberInDepartment(request.assignedToId(), request.department());
        }
        if (!currentUser.isInDepartment(request.department())) {
            throw new ForbiddenException("Trưởng ban chỉ được giao nhiệm vụ trong ban của mình");
        }
        if (request.assignedToId() == null) {
            throw new com.neudebateclub.backend.common.exception.ValidationException(
                    "Vui lòng chọn thành viên nhận nhiệm vụ");
        }
        return findMemberInDepartment(request.assignedToId(), currentUser.getDepartment());
    }

    private User findMemberInDepartment(UUID userId, Department department) {
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member", userId.toString()));
        if (!member.isActive() || member.getDepartment() != department || member.getRole() == Role.BCN) {
            throw new ForbiddenException("Thành viên nhận nhiệm vụ không thuộc ban hoặc đã ngừng hoạt động");
        }
        return member;
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<TaskResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskRequest request,
            @CurrentUser UserPrincipal currentUser) {
        if (currentUser != null) {
            roleGuard.requireTruongBanOrAbove(currentUser);
        }

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id.toString()));

        task.setTitle(request.title().trim());
        task.setDescription(request.description() == null ? null : request.description().trim());
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.status() != null) {
            task.setStatus(request.status());
            if (request.status() == TaskStatus.DONE && task.getCompletedAt() == null) {
                task.setCompletedAt(Instant.now());
            } else if (request.status() != TaskStatus.DONE) {
                task.setCompletedAt(null);
            }
        }
        task.setDeadline(request.deadline());
        if (request.crossDepartment() != null) {
            task.setCrossDepartment(request.crossDepartment());
        }
        if (request.eventId() != null) {
            Event event = eventRepository.findById(request.eventId()).orElse(null);
            task.setEvent(event);
        } else {
            task.setEvent(null);
        }

        return ResponseEntity.ok(ApiResponse.success(
                "Đã cập nhật nhiệm vụ",
                TaskResponse.from(taskRepository.save(task))
        ));
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<TaskResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request,
            @CurrentUser UserPrincipal currentUser) {
        if (currentUser != null) {
            roleGuard.requireMemberOrAbove(currentUser);
        }

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id.toString()));

        task.setStatus(request.status());
        if (request.status() == TaskStatus.DONE) {
            task.setCompletedAt(Instant.now());
        } else {
            task.setCompletedAt(null);
        }

        return ResponseEntity.ok(ApiResponse.success(
                "Đã cập nhật trạng thái nhiệm vụ",
                TaskResponse.from(taskRepository.save(task))
        ));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        if (currentUser != null) {
            roleGuard.requireTruongBanOrAbove(currentUser);
        }

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id.toString()));
        taskRepository.delete(task);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa nhiệm vụ", null));
    }

    /**
     * Xác định Trưởng ban phụ trách của ban được chỉ định.
     * Quy tắc nghiệp vụ: Chỉ Trưởng ban mới nhận nhiệm vụ này từ BCN.
     */
    private User resolveDepartmentLead(Department department, User fallbackUser) {
        return userRepository.findFirstByDepartmentAndRoleAndActiveTrue(department, Role.TRUONG_BAN)
                .or(() -> userRepository.findFirstByDepartmentAndActiveTrue(department))
                .orElse(fallbackUser);
    }

    /**
     * Xác định người giao việc (BCN).
     */
    private User resolveAssignerUser(UserPrincipal currentUser) {
        if (currentUser != null && currentUser.getId() != null) {
            return userRepository.getReferenceById(currentUser.getId());
        }
        return userRepository.findFirstByRoleAndActiveTrue(Role.BCN)
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có người dùng nào để gán creator.")));
    }

    public static String formatDepartmentName(Department dept) {
        if (dept == null) return "Chưa phân ban";
        return switch (dept) {
            case BCN -> "Ban Chủ Nhiệm";
            case TRUYEN_THONG -> "Ban Truyền thông";
            case NOI_DUNG -> "Ban Nội dung";
            case SU_KIEN -> "Ban Sự kiện";
            case DOI_NGOAI -> "Ban Đối ngoại";
            case KY_THUAT -> "Ban Kỹ thuật";
            case NHAN_SU -> "Ban Nhân sự";
        };
    }

    // =========================================================================
    // DTO REQUESTS & RESPONSES
    // =========================================================================

    public record CreateTaskRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 5000) String description,
            @NotNull Department department,
            TaskPriority priority,
            TaskStatus status,
            Instant deadline,
            UUID eventId,
            Boolean crossDepartment,
            Boolean assignToAllDepartments,
            UUID assignedToId
    ) {
        public CreateTaskRequest(
                String title,
                String description,
                Department department,
                TaskPriority priority,
                TaskStatus status,
                Instant deadline,
                UUID eventId,
                Boolean crossDepartment,
                Boolean assignToAllDepartments) {
            this(title, description, department, priority, status, deadline, eventId,
                    crossDepartment, assignToAllDepartments, null);
        }
    }

    public record UpdateTaskRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 5000) String description,
            TaskPriority priority,
            TaskStatus status,
            Instant deadline,
            UUID eventId,
            Boolean crossDepartment
    ) {}

    public record UpdateStatusRequest(
            @NotNull TaskStatus status
    ) {}

    public record TaskResponse(
            UUID id,
            String title,
            String description,
            TaskPriority priority,
            TaskStatus status,
            Instant deadline,
            UUID assignedToId,
            String assignedToName,
            String assignedToRole,
            UUID assignedById,
            String assignedByName,
            Department department,
            String departmentName,
            boolean crossDepartment,
            UUID eventId,
            String eventTitle,
            Instant completedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static TaskResponse from(Task task) {
            String leadName = task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null;
            String leadRole = "Trưởng " + formatDepartmentName(task.getDepartment());
            String creatorName = task.getAssignedBy() != null ? task.getAssignedBy().getFullName() : "Ban Chủ Nhiệm (BCN)";
            String evTitle = task.getEvent() != null ? task.getEvent().getTitle() : null;
            UUID evId = task.getEvent() != null ? task.getEvent().getId() : null;

            return new TaskResponse(
                    task.getId(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getPriority(),
                    task.getStatus(),
                    task.getDeadline(),
                    task.getAssignedTo() != null ? task.getAssignedTo().getId() : null,
                    leadName,
                    leadRole,
                    task.getAssignedBy() != null ? task.getAssignedBy().getId() : null,
                    creatorName,
                    task.getDepartment(),
                    formatDepartmentName(task.getDepartment()),
                    task.isCrossDepartment(),
                    evId,
                    evTitle,
                    task.getCompletedAt(),
                    task.getCreatedAt(),
                    task.getUpdatedAt()
            );
        }
    }
}
