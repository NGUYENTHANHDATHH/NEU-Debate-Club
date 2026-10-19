package com.neudebateclub.backend.task;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.TaskPriority;
import com.neudebateclub.backend.common.enums.TaskStatus;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskControllerTest {

    private TaskRepository taskRepository;
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
        userRepository = mock(UserRepository.class);
        eventRepository = mock(EventRepository.class);
        roleGuard = mock(RoleGuard.class);
        taskController = new TaskController(taskRepository, userRepository, eventRepository, roleGuard);

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
        assertNotNull(existing.getCompletedAt());
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
}
