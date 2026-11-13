package com.neudebateclub.backend.activity;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ActivityLogControllerTest {

    private ActivityLogRepository repository;
    private ActivityLogController controller;

    @BeforeEach
    void setUp() {
        repository = mock(ActivityLogRepository.class);
        controller = new ActivityLogController(repository, new RoleGuard());
    }

    @Test
    void bcnSeesNewestLogsWithFixedShape() {
        User actor = User.builder().id(UUID.randomUUID()).fullName("BCN Admin").build();
        ActivityLog log = ActivityLog.builder().id(UUID.randomUUID()).user(actor).action("CREATE")
                .entityType("TASK").entityId(UUID.randomUUID()).metadata(Map.of("title", "Poster"))
                .createdAt(Instant.now()).build();
        when(repository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(List.of(log));

        var data = controller.list(null, principal(Role.BCN, Department.BCN)).getBody().getData();

        assertEquals(1, data.size());
        assertEquals(actor.getId(), data.getFirst().userId());
        assertEquals("BCN Admin", data.getFirst().userName());
        assertEquals("Poster", data.getFirst().metadata().get("title"));
        assertEquals(ActivityLogController.DEFAULT_LIMIT, capturedPageSize());
    }

    @Test
    void limitIsClamped() {
        controller.list(10_000, principal(Role.BCN, Department.BCN));
        assertEquals(ActivityLogController.MAX_LIMIT, capturedPageSize());

        repository = mock(ActivityLogRepository.class);
        controller = new ActivityLogController(repository, new RoleGuard());
        controller.list(0, principal(Role.BCN, Department.BCN));
        assertEquals(1, capturedPageSize());
    }

    @Test
    void departmentLeadIsForbidden() {
        assertThrows(ForbiddenException.class,
                () -> controller.list(null, principal(Role.TRUONG_BAN, Department.NHAN_SU)));
        verify(repository, never()).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    private int capturedPageSize() {
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAllByOrderByCreatedAtDesc(page.capture());
        return page.getValue().getPageSize();
    }

    private static UserPrincipal principal(Role role, Department department) {
        return UserPrincipal.builder().id(UUID.randomUUID()).role(role).department(department).active(true).build();
    }
}
