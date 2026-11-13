package com.neudebateclub.backend.event;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.EventStatus;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
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

class EventControllerTest {

    private EventRepository eventRepository;
    private UserRepository userRepository;
    private RoleGuard roleGuard;
    private EventController controller;
    private UserPrincipal manager;

    @BeforeEach
    void setUp() {
        eventRepository = mock(EventRepository.class);
        userRepository = mock(UserRepository.class);
        roleGuard = mock(RoleGuard.class);
        controller = new EventController(eventRepository, userRepository, roleGuard,
                mock(ActivityLogService.class));
        manager = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.BCN).active(true).build();
    }

    @Test
    void createsEventAndNormalizesResourceUrls() {
        User creator = User.builder().id(manager.getId()).build();
        when(userRepository.getReferenceById(manager.getId())).thenReturn(creator);
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event event = invocation.getArgument(0);
            event.setId(UUID.randomUUID());
            return event;
        });

        controller.create(new EventController.EventRequest(
                " Debate Night ", " Mô tả ", " Hội trường A2 ", Instant.parse("2026-11-20T12:00:00Z"),
                new BigDecimal("5000000"), EventStatus.UPCOMING,
                List.of(" https://docs.google.com/document/d/1 ", "https://docs.google.com/document/d/1")), manager);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertEquals("Debate Night", captor.getValue().getTitle());
        assertEquals("Hội trường A2", captor.getValue().getLocation());
        assertEquals(List.of("https://docs.google.com/document/d/1"), captor.getValue().getResourceUrls());
        assertEquals(creator, captor.getValue().getCreatedBy());
        verify(roleGuard).requireModuleManager(manager, AdminModule.EVENT_MANAGEMENT);
    }

    @Test
    void rejectsInvalidResourceUrl() {
        assertThrows(ValidationException.class, () -> controller.create(
                new EventController.EventRequest("Event", null, null, Instant.now(), BigDecimal.ZERO,
                        EventStatus.UPCOMING, List.of("javascript:alert(1)")), manager));

        verify(eventRepository, never()).save(any());
    }

    @Test
    void updatesExistingEvent() {
        UUID id = UUID.randomUUID();
        Event existing = Event.builder().id(id).title("Old").location("A1").eventDate(Instant.now())
                .budget(BigDecimal.ZERO).status(EventStatus.UPCOMING).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(existing));
        when(eventRepository.save(existing)).thenReturn(existing);

        var response = controller.update(id, new EventController.EventRequest(
                "New", "Updated", "Hội trường B", Instant.parse("2026-12-01T12:00:00Z"),
                new BigDecimal("1000000"), EventStatus.FINISHED, List.of()), manager).getBody();

        assertEquals("New", response.getData().title());
        assertEquals("Hội trường B", response.getData().location());
        assertEquals(EventStatus.FINISHED, response.getData().status());
    }

    @Test
    void deletesExistingEvent() {
        UUID id = UUID.randomUUID();
        Event existing = Event.builder().id(id).title("To Delete").eventDate(Instant.now())
                .budget(BigDecimal.ZERO).status(EventStatus.UPCOMING).build();
        when(eventRepository.findById(id)).thenReturn(Optional.of(existing));

        var response = controller.delete(id, manager).getBody();

        verify(eventRepository).delete(existing);
        verify(roleGuard).requireModuleManager(manager, AdminModule.EVENT_MANAGEMENT);
        assertEquals("Đã xóa sự kiện", response.getMessage());
    }
}
