package com.neudebateclub.backend.task;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.TaskPriority;
import com.neudebateclub.backend.common.enums.TaskStatus;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskControllerTest {

    private TaskRepository taskRepository;
    private TaskCommentRepository taskCommentRepository;
    private UserRepository userRepository;
    private EventRepository eventRepository;
    private RoleGuard roleGuard;
    private TaskController taskController;
    private UserPrincipal bcnManager;
    private User bcnUser;
    private User leadTruyenThong;

    @BeforeEach
    void setUp() {
        taskRepository = mock(TaskRepository.class);
        taskCommentRepository = mock(TaskCommentRepository.class);
        userRepository = mock(UserRepository.class);
        eventRepository = mock(EventRepository.class);
        roleGuard = new RoleGuard();
        taskController = new TaskController(taskRepository, taskCommentRepository, userRepository, eventRepository, roleGuard);

        UUID bcnId = UUID.randomUUID();
        bcnManager = UserPrincipal.builder()
                .id(bcnId)
                .role(Role.BCN)
                .department(Department.BCN)
                .active(true)
                .build();

        bcnUser = User.builder()
                .id(bcnId)
                .fullName("Ban Chủ Nhiệm Admin")
                .role(Role.BCN)
                .department(Department.BCN)
                .active(true)
                .build();

        leadTruyenThong = User.builder()
                .id(UUID.randomUUID())
                .fullName("Trần Hải Đăng")
                .role(Role.TRUONG_BAN)
                .department(Department.TRUYEN_THONG)
                .active(true)
                .build();

        when(userRepository.getReferenceById(bcnId)).thenReturn(bcnUser);
        when(userRepository.findFirstByRoleAndActiveTrue(Role.BCN)).thenReturn(Optional.of(bcnUser));
        when(userRepository.findFirstByDepartmentAndRoleAndActiveTrue(Department.TRUYEN_THONG, Role.TRUONG_BAN))
                .thenReturn(Optional.of(leadTruyenThong));
    }

    @Test
    void createTaskForSingleDepartmentAssignsToDepartmentLead() {
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            task.setId(UUID.randomUUID());
            return task;
        });

        TaskController.CreateTaskRequest request = new TaskController.CreateTaskRequest(
                "Thiết kế poster sự kiện",
                "Yêu cầu hoàn thành đúng deadline 3 ngày",
                Department.TRUYEN_THONG,
                TaskPriority.HIGH,
                TaskStatus.TODO,
                Instant.now().plusSeconds(86400 * 3),
                null,
                false,
                false
        );

        ResponseEntity<ApiResponse<List<TaskController.TaskResponse>>> response =
                taskController.create(request, bcnManager);

        assertEquals(201, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().size());

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        Task savedTask = captor.getValue();

        assertEquals("Thiết kế poster sự kiện", savedTask.getTitle());
        assertEquals(Department.TRUYEN_THONG, savedTask.getDepartment());
        assertEquals(leadTruyenThong.getId(), savedTask.getAssignedTo().getId());
        assertEquals(bcnUser.getId(), savedTask.getAssignedBy().getId());
    }

    @Test
    void createTaskWithAssignToAllDepartmentsCreatesTasksForAllSixDepartments() {
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            task.setId(UUID.randomUUID());
            return task;
        });

        TaskController.CreateTaskRequest request = new TaskController.CreateTaskRequest(
                "Nhiệm vụ chung toàn CLB chuẩn bị Debate Open",
                "Các ban tập hợp báo cáo tiến độ tuần",
                Department.TRUYEN_THONG,
                TaskPriority.HIGH,
                TaskStatus.TODO,
                Instant.now().plusSeconds(86400 * 5),
                null,
                true,
                true
        );

        ResponseEntity<ApiResponse<List<TaskController.TaskResponse>>> response =
                taskController.create(request, bcnManager);

        assertEquals(201, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(6, response.getBody().getData().size());
        verify(taskRepository, times(6)).save(any(Task.class));
    }

    @Test
    void updateStatusToDoneSetsCompletedAtTimestamp() {
        UUID taskId = UUID.randomUUID();
        Task existing = Task.builder()
                .id(taskId)
                .title("Chuẩn bị cơ sở vật chất")
                .department(Department.SU_KIEN)
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.MEDIUM)
                .assignedTo(leadTruyenThong)
                .assignedBy(bcnUser)
                .build();

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<ApiResponse<TaskController.TaskResponse>> response =
                taskController.updateStatus(taskId, new TaskController.UpdateStatusRequest(TaskStatus.DONE), bcnManager);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(TaskStatus.DONE, response.getBody().getData().status());
        assertEquals(100, response.getBody().getData().progress());
        assertNotNull(existing.getCompletedAt());
        verify(taskCommentRepository).save(any(TaskComment.class));
    }

    @Test
    void listMineOnlyLoadsTasksAssignedToCurrentUser() {
        Task assignedTask = Task.builder()
                .id(UUID.randomUUID())
                .title("Chuẩn bị nội dung")
                .department(Department.TRUYEN_THONG)
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .assignedTo(bcnUser)
                .assignedBy(bcnUser)
                .build();
        when(taskRepository.findByAssignedToIdOrderByCreatedAtDesc(bcnManager.getId()))
                .thenReturn(List.of(assignedTask));

        ResponseEntity<ApiResponse<List<TaskController.TaskResponse>>> response =
                taskController.listMine(bcnManager);

        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().size());
        assertEquals(assignedTask.getId(), response.getBody().getData().getFirst().id());
        verify(taskRepository).findByAssignedToIdOrderByCreatedAtDesc(bcnManager.getId());
    }

    @Test
    void progressUpdateSavesTaskAndCommentSnapshot() {
        UUID taskId = UUID.randomUUID();
        Task task = Task.builder().id(taskId).title("Viết nội dung")
                .department(Department.TRUYEN_THONG).status(TaskStatus.TODO)
                .assignedTo(bcnUser).assignedBy(bcnUser).build();
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        taskController.updateProgress(taskId,
                new TaskController.UpdateProgressRequest(65, "  Đã xong bản nháp  "), bcnManager);

        assertEquals(65, task.getProgress());
        assertEquals(TaskStatus.IN_PROGRESS, task.getStatus());
        ArgumentCaptor<TaskComment> captor = ArgumentCaptor.forClass(TaskComment.class);
        verify(taskCommentRepository).save(captor.capture());
        assertEquals(65, captor.getValue().getProgress());
        assertEquals("Đã xong bản nháp", captor.getValue().getContent());
        assertEquals(bcnUser.getId(), captor.getValue().getUser().getId());
    }

    @Test
    void otherMemberCannotUpdateOrReadTaskProgress() {
        UUID taskId = UUID.randomUUID();
        Task task = Task.builder().id(taskId).title("Viết nội dung")
                .department(Department.TRUYEN_THONG).assignedTo(leadTruyenThong)
                .assignedBy(bcnUser).build();
        UserPrincipal otherMember = UserPrincipal.builder().id(UUID.randomUUID())
                .role(Role.MEMBER).department(Department.NOI_DUNG).active(true).build();
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        assertThrows(ForbiddenException.class, () -> taskController.updateProgress(taskId,
                new TaskController.UpdateProgressRequest(50, "Đang làm"), otherMember));
        assertThrows(ForbiddenException.class, () -> taskController.comments(taskId, otherMember));
    }

    // ---------------------------------------------------------------------
    // Quyền xem/sửa theo quy tắc "strict" (owner decision 2026-11-13)
    // ---------------------------------------------------------------------

    private UserPrincipal principal(User user) {
        return UserPrincipal.builder().id(user.getId()).role(user.getRole())
                .department(user.getDepartment()).active(true).build();
    }

    private Task taskIn(Department department, User assignee) {
        return Task.builder().id(UUID.randomUUID()).title("Task " + department)
                .department(department).status(TaskStatus.TODO).priority(TaskPriority.MEDIUM)
                .assignedTo(assignee).assignedBy(bcnUser).build();
    }

    @Test
    void memberListOnlyReturnsOwnAssignedTasks() {
        User member = User.builder().id(UUID.randomUUID()).fullName("Thành viên")
                .role(Role.MEMBER).department(Department.TRUYEN_THONG).active(true).build();
        Task own = taskIn(Department.TRUYEN_THONG, member);
        own.setStatus(TaskStatus.DONE);
        Task ownTodo = taskIn(Department.TRUYEN_THONG, member);
        when(taskRepository.findByAssignedToIdOrderByCreatedAtDesc(member.getId()))
                .thenReturn(List.of(own, ownTodo));

        List<TaskController.TaskResponse> all =
                taskController.list(null, null, null, principal(member)).getBody().getData();
        List<TaskController.TaskResponse> done =
                taskController.list(null, TaskStatus.DONE, null, principal(member)).getBody().getData();

        assertEquals(2, all.size());
        assertEquals(1, done.size());
        verify(taskRepository, never()).findAllByOrderByCreatedAtDesc();
        verify(taskRepository, never()).findWithFilters(any(), any(), any());
    }

    @Test
    void leadListIsScopedToOwnDepartment() {
        UserPrincipal lead = principal(leadTruyenThong);
        when(taskRepository.findWithFilters(Department.TRUYEN_THONG, null, null)).thenReturn(List.of());

        taskController.list(null, null, null, lead);

        verify(taskRepository).findWithFilters(Department.TRUYEN_THONG, null, null);
        verify(taskRepository, never()).findAllByOrderByCreatedAtDesc();
        assertThrows(ForbiddenException.class,
                () -> taskController.list(Department.SU_KIEN, null, null, lead));
    }

    @Test
    void bcnListSeesAllDepartments() {
        when(taskRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        taskController.list(null, null, null, bcnManager);

        verify(taskRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void memberCannotReadSomeoneElsesTaskById() {
        UserPrincipal member = UserPrincipal.builder().id(UUID.randomUUID())
                .role(Role.MEMBER).department(Department.TRUYEN_THONG).active(true).build();
        Task task = taskIn(Department.TRUYEN_THONG, leadTruyenThong);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));

        assertThrows(ForbiddenException.class, () -> taskController.getById(task.getId(), member));
    }

    @Test
    void leadCannotUpdateOrDeleteOtherDepartmentsTask() {
        UserPrincipal lead = principal(leadTruyenThong);
        Task otherDepartment = taskIn(Department.SU_KIEN, bcnUser);
        when(taskRepository.findById(otherDepartment.getId())).thenReturn(Optional.of(otherDepartment));

        assertThrows(ForbiddenException.class, () -> taskController.update(otherDepartment.getId(),
                new TaskController.UpdateTaskRequest("Sửa", null, null, null, null, null, null), lead));
        assertThrows(ForbiddenException.class, () -> taskController.delete(otherDepartment.getId(), lead));
        verify(taskRepository, never()).save(any(Task.class));
        verify(taskRepository, never()).delete(any(Task.class));
    }

    @Test
    void leadCanDeleteOwnDepartmentsTask() {
        Task ownDepartment = taskIn(Department.TRUYEN_THONG, leadTruyenThong);
        when(taskRepository.findById(ownDepartment.getId())).thenReturn(Optional.of(ownDepartment));

        taskController.delete(ownDepartment.getId(), principal(leadTruyenThong));

        verify(taskRepository).delete(ownDepartment);
    }

    @Test
    void onlyBcnCanAssignToAllDepartments() {
        TaskController.CreateTaskRequest request = new TaskController.CreateTaskRequest(
                "Nhiệm vụ toàn CLB", null, Department.TRUYEN_THONG, TaskPriority.HIGH,
                TaskStatus.TODO, null, null, true, true);

        assertThrows(ForbiddenException.class,
                () -> taskController.create(request, principal(leadTruyenThong)));
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void memberCannotCreateTask() {
        UserPrincipal member = UserPrincipal.builder().id(UUID.randomUUID())
                .role(Role.MEMBER).department(Department.TRUYEN_THONG).active(true).build();
        TaskController.CreateTaskRequest request = new TaskController.CreateTaskRequest(
                "Nhiệm vụ", null, Department.TRUYEN_THONG, null, null, null, null, false, false);

        assertThrows(ForbiddenException.class, () -> taskController.create(request, member));
    }
}
