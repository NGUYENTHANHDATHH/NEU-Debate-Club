package com.neudebateclub.backend.tenure;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.common.security.TestRoleGuards;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SeasonControllerTest {

    private SeasonRepository seasonRepository;
    private SeasonMemberRepository seasonMemberRepository;
    private UserRepository userRepository;
    private SeasonController controller;
    private UserPrincipal nhanSuLead;
    private Season season;

    @BeforeEach
    void setUp() {
        seasonRepository = mock(SeasonRepository.class);
        seasonMemberRepository = mock(SeasonMemberRepository.class);
        userRepository = mock(UserRepository.class);
        controller = new SeasonController(seasonRepository, seasonMemberRepository, userRepository, TestRoleGuards.withDefaults(),
                mock(ActivityLogService.class));
        nhanSuLead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.NHAN_SU).active(true).build();
        season = Season.builder().id(UUID.randomUUID()).name("Nhiệm kỳ 2026")
                .startDate(LocalDate.of(2026, 1, 1)).endDate(LocalDate.of(2026, 12, 31)).build();
        when(seasonRepository.findById(season.getId())).thenReturn(Optional.of(season));
    }

    @Test
    void rejectsLeadOutsideTenureModule() {
        UserPrincipal suKienLead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.SU_KIEN).active(true).build();

        assertThrows(ForbiddenException.class, () -> controller.list(suKienLead));
        assertThrows(ForbiddenException.class, () -> controller.delete(season.getId(), suKienLead));
        verify(seasonRepository, never()).delete(any());
    }

    @Test
    void listsSeasonsWithGroupedMemberCounts() {
        Season empty = Season.builder().id(UUID.randomUUID()).name("Nhiệm kỳ 2025").build();
        when(seasonRepository.findAllByOrderByStartDateDesc()).thenReturn(List.of(season, empty));
        when(seasonMemberRepository.countBySeason()).thenReturn(List.<Object[]>of(new Object[]{season.getId(), 3L}));

        List<SeasonController.SeasonResponse> data = controller.list(nhanSuLead).getBody().getData();

        assertEquals(3L, data.get(0).memberCount());
        assertEquals(0L, data.get(1).memberCount());
    }

    @Test
    void createRejectsEndDateNotAfterStartDate() {
        assertThrows(ValidationException.class, () -> controller.create(new SeasonController.SeasonRequest(
                "Nhiệm kỳ", LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 1), false), nhanSuLead));

        verify(seasonRepository, never()).save(any());
    }

    @Test
    void createActiveSeasonDeactivatesOthers() {
        when(seasonRepository.save(any(Season.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.create(new SeasonController.SeasonRequest(
                " Nhiệm kỳ 2027 ", LocalDate.of(2027, 1, 1), LocalDate.of(2027, 12, 31), true), nhanSuLead);

        assertEquals(201, response.getStatusCode().value());
        assertEquals("Nhiệm kỳ 2027", response.getBody().getData().name());
        verify(seasonRepository).deactivateAll();
    }

    @Test
    void addMemberDefaultsRoleAndDepartmentFromUser() {
        User user = User.builder().id(UUID.randomUUID()).email("a@neu.edu.vn").fullName("An")
                .role(Role.MEMBER).department(Department.NOI_DUNG).build();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(seasonMemberRepository.save(any(SeasonMember.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.addMember(season.getId(),
                new SeasonController.SeasonMemberRequest(user.getId(), null, null, null), nhanSuLead);

        ArgumentCaptor<SeasonMember> captor = ArgumentCaptor.forClass(SeasonMember.class);
        verify(seasonMemberRepository).save(captor.capture());
        assertEquals(201, response.getStatusCode().value());
        assertEquals(Role.MEMBER, captor.getValue().getRole());
        assertEquals(Department.NOI_DUNG, captor.getValue().getDepartment());
        assertEquals(LocalDate.now(), captor.getValue().getJoinedAt());
        assertEquals(season, captor.getValue().getSeason());
    }

    @Test
    void addMemberRejectsGuestDuplicateMissingDepartmentAndUnknownUser() {
        User guest = User.builder().id(UUID.randomUUID()).role(Role.GUEST).department(Department.NOI_DUNG).build();
        User noDepartment = User.builder().id(UUID.randomUUID()).role(Role.MEMBER).build();
        User existing = User.builder().id(UUID.randomUUID()).role(Role.MEMBER).department(Department.SU_KIEN).build();
        UUID unknownId = UUID.randomUUID();
        when(userRepository.findById(guest.getId())).thenReturn(Optional.of(guest));
        when(userRepository.findById(noDepartment.getId())).thenReturn(Optional.of(noDepartment));
        when(userRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());
        when(seasonMemberRepository.existsBySeasonIdAndUserId(season.getId(), existing.getId())).thenReturn(true);

        assertThrows(ValidationException.class, () -> controller.addMember(season.getId(),
                new SeasonController.SeasonMemberRequest(guest.getId(), null, null, null), nhanSuLead));
        assertThrows(ValidationException.class, () -> controller.addMember(season.getId(),
                new SeasonController.SeasonMemberRequest(noDepartment.getId(), null, null, null), nhanSuLead));
        assertThrows(ValidationException.class, () -> controller.addMember(season.getId(),
                new SeasonController.SeasonMemberRequest(existing.getId(), null, null, null), nhanSuLead));
        assertThrows(ResourceNotFoundException.class, () -> controller.addMember(season.getId(),
                new SeasonController.SeasonMemberRequest(unknownId, null, null, null), nhanSuLead));
        verify(seasonMemberRepository, never()).save(any());
    }

    @Test
    void removeMemberReturns404WhenMemberNotInSeason() {
        UUID memberId = UUID.randomUUID();
        when(seasonMemberRepository.findByIdAndSeasonId(memberId, season.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> controller.removeMember(season.getId(), memberId, nhanSuLead));
        verify(seasonMemberRepository, never()).delete(any());
    }
}
