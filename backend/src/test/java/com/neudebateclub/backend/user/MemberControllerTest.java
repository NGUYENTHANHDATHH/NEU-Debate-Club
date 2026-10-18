package com.neudebateclub.backend.user;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.security.RoleGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MemberControllerTest {

    private UserRepository repository;
    private RoleGuard roleGuard;
    private MemberController controller;
    private UserPrincipal manager;

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        roleGuard = mock(RoleGuard.class);
        controller = new MemberController(repository, roleGuard);
        ReflectionTestUtils.setField(controller, "allowedDomain", ".ndc.neu@gmail.com");
        manager = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.BCN).active(true).build();
    }

    @Test
    void createsMemberWithNormalizedEmail() {
        when(repository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        controller.create(new MemberController.MemberRequest(
                "Nguyễn An", " AN.NDC.NEU@GMAIL.COM ", "11223344", "0912345678",
                Department.NOI_DUNG, Role.MEMBER, true), manager);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(repository).save(captor.capture());
        assertEquals("an.ndc.neu@gmail.com", captor.getValue().getEmail());
        verify(roleGuard).requireModuleManager(manager, AdminModule.MEMBERSHIP);
    }

    @Test
    void listExcludesGuestAccounts() {
        User member = User.builder().id(UUID.randomUUID()).fullName("Member")
                .email("member.ndc.neu@gmail.com").role(Role.MEMBER).active(true).build();
        User guest = User.builder().id(UUID.randomUUID()).fullName("Guest")
                .email("guest@gmail.com").role(Role.GUEST).active(true).build();
        when(repository.findAllByOrderByFullNameAsc()).thenReturn(List.of(guest, member));

        var response = controller.list(manager).getBody();

        assertEquals(1, response.getData().size());
        assertEquals(member.getId(), response.getData().getFirst().id());
    }

    @Test
    void rejectsDuplicateEmail() {
        when(repository.existsByEmailIgnoreCase("an.ndc.neu@gmail.com")).thenReturn(true);

        assertThrows(ValidationException.class, () -> controller.create(
                new MemberController.MemberRequest(
                        "Nguyễn An", "an.ndc.neu@gmail.com", "11223344", "0912345678",
                        Department.NOI_DUNG, Role.MEMBER, true), manager));

        verify(repository, never()).save(any());
    }

    @Test
    void humanResourcesManagerCannotGrantBcnRole() {
        UserPrincipal hrManager = UserPrincipal.builder()
                .id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.NHAN_SU).active(true).build();

        assertThrows(ForbiddenException.class, () -> controller.create(
                new MemberController.MemberRequest(
                        "Nguyễn An", "an.ndc.neu@gmail.com", "11223344", "0912345678",
                        Department.BCN, Role.BCN, true), hrManager));

        verify(repository, never()).save(any());
    }

    @Test
    void updatesMemberWithoutTreatingCurrentValuesAsDuplicates() {
        UUID id = UUID.randomUUID();
        User member = User.builder().id(id).fullName("Tên cũ")
                .email("member.ndc.neu@gmail.com").studentId("11223344")
                .phone("0900000000").department(Department.NOI_DUNG)
                .role(Role.MEMBER).active(true).build();
        when(repository.findById(id)).thenReturn(java.util.Optional.of(member));
        when(repository.save(member)).thenReturn(member);

        var response = controller.update(id, new MemberController.MemberRequest(
                "Tên mới", "member.ndc.neu@gmail.com", "11223344", "0912345678",
                Department.NHAN_SU, Role.TRUONG_BAN, true), manager).getBody();

        assertEquals("Tên mới", response.getData().fullName());
        assertEquals(Department.NHAN_SU, response.getData().department());
        verify(repository).existsByEmailIgnoreCaseAndIdNot("member.ndc.neu@gmail.com", id);
        verify(repository).existsByStudentIdIgnoreCaseAndIdNot("11223344", id);
    }
}
