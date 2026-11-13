package com.neudebateclub.backend.publication;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Platform;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.common.security.TestRoleGuards;
import com.neudebateclub.backend.event.EventRepository;
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

class PublicationControllerTest {

    private MediaLinkRepository mediaLinkRepository;
    private EventRepository eventRepository;
    private UserRepository userRepository;
    private PublicationController controller;
    private UserPrincipal mediaLead;

    @BeforeEach
    void setUp() {
        mediaLinkRepository = mock(MediaLinkRepository.class);
        eventRepository = mock(EventRepository.class);
        userRepository = mock(UserRepository.class);
        controller = new PublicationController(mediaLinkRepository, eventRepository, userRepository, TestRoleGuards.withDefaults(),
                mock(ActivityLogService.class));
        mediaLead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.TRUYEN_THONG).active(true).build();
        when(userRepository.getReferenceById(mediaLead.getId()))
                .thenReturn(User.builder().id(mediaLead.getId()).fullName("Trần Hải Đăng").build());
        when(mediaLinkRepository.save(any(MediaLink.class))).thenAnswer(invocation -> {
            MediaLink link = invocation.getArgument(0);
            link.setId(UUID.randomUUID());
            return link;
        });
    }

    private PublicationController.PublicationRequest request(String url, Platform platform, Department department) {
        return new PublicationController.PublicationRequest(" Recap Debate Night ", url, platform, department,
                null, 1200, null, 5, null, LocalDate.parse("2026-11-12"));
    }

    @Test
    void createsPublicationForOwnDepartmentWithDefaultCounts() {
        var response = controller.create(
                request(" https://facebook.com/neudebate/posts/1 ", Platform.FACEBOOK, Department.TRUYEN_THONG),
                mediaLead);

        ArgumentCaptor<MediaLink> captor = ArgumentCaptor.forClass(MediaLink.class);
        verify(mediaLinkRepository).save(captor.capture());
        assertEquals(201, response.getStatusCode().value());
        assertEquals("Recap Debate Night", captor.getValue().getTitle());
        assertEquals("https://facebook.com/neudebate/posts/1", captor.getValue().getUrl());
        assertEquals(1200, captor.getValue().getReach());
        assertEquals(0, captor.getValue().getLikes());
        assertEquals("Trần Hải Đăng", response.getBody().getData().createdByName());
    }

    @Test
    void forbidsCreatingForAnotherDepartment() {
        assertThrows(ForbiddenException.class, () -> controller.create(
                request("https://facebook.com/x", Platform.FACEBOOK, Department.NOI_DUNG), mediaLead));
        verify(mediaLinkRepository, never()).save(any());
    }

    @Test
    void rejectsPlatformMissingFromDbEnum() {
        assertThrows(ValidationException.class, () -> controller.create(
                request("https://x.com/neudebate", Platform.X, Department.TRUYEN_THONG), mediaLead));
        verify(mediaLinkRepository, never()).save(any());
    }

    @Test
    void rejectsNonHttpUrl() {
        assertThrows(ValidationException.class, () -> controller.create(
                request("javascript:alert(1)", Platform.OTHER, Department.TRUYEN_THONG), mediaLead));
        verify(mediaLinkRepository, never()).save(any());
    }

    @Test
    void memberCanListButNotDeleteOtherDepartmentLink() {
        UserPrincipal member = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.MEMBER)
                .department(Department.SU_KIEN).active(true).build();
        when(mediaLinkRepository.findAllByOrderByPostedAtDescCreatedAtDesc()).thenReturn(List.of());
        assertEquals(List.of(), controller.list(member).getBody().getData());

        UUID id = UUID.randomUUID();
        when(mediaLinkRepository.findById(id)).thenReturn(Optional.of(
                MediaLink.builder().id(id).department(Department.NOI_DUNG).build()));
        assertThrows(ForbiddenException.class, () -> controller.delete(id, member));
        assertThrows(ForbiddenException.class, () -> controller.delete(id, mediaLead));
        verify(mediaLinkRepository, never()).delete(any());
    }
}
