package com.neudebateclub.backend.notification;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.common.security.TestRoleGuards;
import com.neudebateclub.backend.task.Task;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationServiceTest {

    private NotificationRepository notificationRepository;
    private UserRepository userRepository;
    private NotificationService service;

    private User bcn;
    private User leadTt;
    private User memberTt;
    private User memberSk;
    private User inactiveTt;
    private User guest;

    @BeforeEach
    void setUp() {
        notificationRepository = mock(NotificationRepository.class);
        userRepository = mock(UserRepository.class);
        service = new NotificationService(notificationRepository, userRepository, TestRoleGuards.withDefaults(),
                mock(ActivityLogService.class));
        when(notificationRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        bcn = user("BCN", Role.BCN, Department.BCN, true);
        leadTt = user("Lead TT", Role.TRUONG_BAN, Department.TRUYEN_THONG, true);
        memberTt = user("Member TT", Role.MEMBER, Department.TRUYEN_THONG, true);
        memberSk = user("Member SK", Role.MEMBER, Department.SU_KIEN, true);
        inactiveTt = user("Inactive TT", Role.MEMBER, Department.TRUYEN_THONG, false);
        guest = user("Guest", Role.GUEST, null, true);

        when(userRepository.findAllByOrderByFullNameAsc())
                .thenReturn(List.of(bcn, leadTt, memberTt, memberSk, inactiveTt, guest));
        when(userRepository.getReferenceById(any(UUID.class))).thenAnswer(invocation -> {
            UUID id = invocation.getArgument(0);
            return List.of(bcn, leadTt, memberTt, memberSk).stream()
                    .filter(u -> u.getId().equals(id)).findFirst().orElseThrow();
        });
    }

    @Test
    void taskAssignmentNotifiesAssigneeWithTaskLinkAndSender() {
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .title("Thiết kế poster")
                .department(Department.TRUYEN_THONG)
                .deadline(Instant.parse("2026-11-20T10:30:00Z"))
                .assignedTo(memberTt)
                .assignedBy(leadTt)
                .build();

        service.notifyTaskAssigned(task);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertEquals(memberTt, saved.getUser());
        assertEquals(leadTt, saved.getCreatedBy());
        assertEquals(NotificationType.TASK_ASSIGNED, saved.getType());
        assertEquals(task.getId(), saved.getEntityId());
        assertTrue(saved.getBody().contains("Thiết kế poster"));
        assertTrue(saved.getBody().contains("17:30 20/11/2026"), saved.getBody());
    }

    @Test
    void selfAssignedTaskDoesNotNotify() {
        Task task = Task.builder().id(UUID.randomUUID()).title("x").department(Department.SU_KIEN)
                .assignedTo(bcn).assignedBy(bcn).build();

        service.notifyTaskAssigned(task);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void bcnBroadcastReachesActiveMembersExceptSenderAndGuests() {
        int count = service.sendManual(principal(bcn), NotificationAudience.ALL, null, null,
                NotificationType.GENERAL, "  Họp toàn CLB  ", "  Nội dung  ");

        assertEquals(3, count);
        List<Notification> saved = captureSaved();
        assertEquals(Set.of(leadTt, memberTt, memberSk),
                saved.stream().map(Notification::getUser).collect(Collectors.toSet()));
        assertTrue(saved.stream().allMatch(n -> n.getTitle().equals("Họp toàn CLB")
                && n.getBody().equals("Nội dung") && n.getCreatedBy() == bcn && n.getEntityId() == null));
    }

    @Test
    void leadCanNotifyOwnDepartmentOnly() {
        int count = service.sendManual(principal(leadTt), NotificationAudience.DEPARTMENTS,
                List.of(Department.TRUYEN_THONG), null, NotificationType.URGENT, "t", "b");

        assertEquals(1, count);
        assertEquals(List.of(memberTt), captureSaved().stream().map(Notification::getUser).toList());

        assertThrows(ForbiddenException.class, () -> service.sendManual(principal(leadTt),
                NotificationAudience.DEPARTMENTS, List.of(Department.TRUYEN_THONG, Department.SU_KIEN), null,
                NotificationType.GENERAL, "t", "b"));
        assertThrows(ForbiddenException.class, () -> service.sendManual(principal(leadTt),
                NotificationAudience.ALL, null, null, NotificationType.GENERAL, "t", "b"));
    }

    @Test
    void leadCannotPickMembersOfAnotherDepartment() {
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(memberSk));

        assertThrows(ForbiddenException.class, () -> service.sendManual(principal(leadTt),
                NotificationAudience.MEMBERS, null, List.of(memberSk.getId()), NotificationType.GENERAL, "t", "b"));
        verify(notificationRepository, never()).saveAll(anyList());
    }

    @Test
    void bcnCanPickSpecificMembersButNotInactiveOrUnknownOnes() {
        when(userRepository.findAllById(eq(Set.of(memberSk.getId())))).thenReturn(List.of(memberSk));
        assertEquals(1, service.sendManual(principal(bcn), NotificationAudience.MEMBERS, null,
                List.of(memberSk.getId(), memberSk.getId()), NotificationType.REWARD, "t", "b"));

        when(userRepository.findAllById(eq(Set.of(inactiveTt.getId())))).thenReturn(List.of(inactiveTt));
        assertThrows(ValidationException.class, () -> service.sendManual(principal(bcn),
                NotificationAudience.MEMBERS, null, List.of(inactiveTt.getId()), NotificationType.GENERAL, "t", "b"));

        UUID unknown = UUID.randomUUID();
        when(userRepository.findAllById(eq(Set.of(unknown)))).thenReturn(List.of());
        assertThrows(ValidationException.class, () -> service.sendManual(principal(bcn),
                NotificationAudience.MEMBERS, null, List.of(unknown), NotificationType.GENERAL, "t", "b"));
    }

    @Test
    void memberCannotSendAndTaskAssignedTypeIsReserved() {
        assertThrows(ForbiddenException.class, () -> service.sendManual(principal(memberTt),
                NotificationAudience.DEPARTMENTS, List.of(Department.TRUYEN_THONG), null,
                NotificationType.GENERAL, "t", "b"));
        assertThrows(ValidationException.class, () -> service.sendManual(principal(bcn),
                NotificationAudience.ALL, null, null, NotificationType.TASK_ASSIGNED, "t", "b"));
    }

    @Test
    void sendingOnlyToYourselfIsRejected() {
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(bcn));
        assertThrows(ValidationException.class, () -> service.sendManual(principal(bcn),
                NotificationAudience.MEMBERS, null, List.of(bcn.getId()), NotificationType.GENERAL, "t", "b"));
    }

    @Test
    void listIsScopedToCurrentUserAndLimitIsClamped() {
        service.listForUser(principal(memberTt), 500);
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(eq(memberTt.getId()), page.capture());
        assertEquals(NotificationService.MAX_LIMIT, page.getValue().getPageSize());

        assertThrows(ForbiddenException.class, () -> service.listForUser(principal(guest), null));
    }

    @SuppressWarnings("unchecked")
    private List<Notification> captureSaved() {
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        return captor.getValue();
    }

    private static User user(String name, Role role, Department department, boolean active) {
        return User.builder().id(UUID.randomUUID()).fullName(name).role(role)
                .department(department).active(active).build();
    }

    private static UserPrincipal principal(User user) {
        return UserPrincipal.builder().id(user.getId()).role(user.getRole())
                .department(user.getDepartment()).active(user.isActive()).build();
    }
}
