package com.neudebateclub.backend.event;

import com.neudebateclub.backend.auth.jwt.JwtService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.EventStatus;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.UnauthorizedException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EventAttendeeControllerTest {

    private EventRepository eventRepository;
    private EventAttendeeRepository attendeeRepository;
    private UserRepository userRepository;
    private JwtService jwtService;
    private RoleGuard roleGuard;
    private String guestHeader;
    private EventAttendeeController controller;
    private Event event;
    private final UserPrincipal member =
            UserPrincipal.builder().id(UUID.randomUUID()).role(Role.MEMBER).active(true).build();

    @BeforeEach
    void setUp() {
        eventRepository = mock(EventRepository.class);
        attendeeRepository = mock(EventAttendeeRepository.class);
        userRepository = mock(UserRepository.class);
        roleGuard = mock(RoleGuard.class);
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "unit-test-secret-unit-test-secret-123");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 60_000L);
        controller = new EventAttendeeController(eventRepository, attendeeRepository, userRepository, jwtService, roleGuard);
        event = Event.builder().id(UUID.randomUUID()).title("Debate Night")
                .eventDate(Instant.now()).status(EventStatus.UPCOMING).build();
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(attendeeRepository.save(any(EventAttendee.class))).thenAnswer(invocation -> invocation.getArgument(0));
        guestHeader = "Bearer " + jwtService.generateGuestToken("guest@gmail.com", "Khách Mời");
    }

    @Test
    void registersGuestFromGuestToken() {
        when(attendeeRepository.findByEventIdAndEmail(event.getId(), "guest@gmail.com")).thenReturn(Optional.empty());

        var response = controller.register(event.getId(), null, guestHeader).getBody();

        ArgumentCaptor<EventAttendee> saved = ArgumentCaptor.forClass(EventAttendee.class);
        verify(attendeeRepository).save(saved.capture());
        assertEquals("guest@gmail.com", saved.getValue().getEmail());
        assertEquals("Khách Mời", saved.getValue().getFullName());
        assertEquals(event, saved.getValue().getEvent());
        // Mã QR (id vé) không được trả về trình duyệt của người đăng ký.
        assertNull(response.getData());
    }

    @Test
    void registersSignedInMemberWithLowercasedEmail() {
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(
                User.builder().id(member.getId()).email("Member@Gmail.com").fullName("Thành Viên").build()));
        when(attendeeRepository.findByEventIdAndEmail(event.getId(), "member@gmail.com")).thenReturn(Optional.empty());

        controller.register(event.getId(), member, "Bearer member-jwt");

        ArgumentCaptor<EventAttendee> saved = ArgumentCaptor.forClass(EventAttendee.class);
        verify(attendeeRepository).save(saved.capture());
        assertEquals("member@gmail.com", saved.getValue().getEmail());
        assertEquals("Thành Viên", saved.getValue().getFullName());
    }

    @Test
    void rejectsRegistrationWithoutSignIn() {
        assertThrows(UnauthorizedException.class, () -> controller.register(event.getId(), null, null));
        assertThrows(UnauthorizedException.class, () -> controller.register(event.getId(), null, "Bearer nonsense"));
        verify(attendeeRepository, never()).save(any());
    }

    @Test
    void registeringAgainDoesNotCreateSecondTicket() {
        when(attendeeRepository.findByEventIdAndEmail(event.getId(), "guest@gmail.com"))
                .thenReturn(Optional.of(attendee()));

        controller.register(event.getId(), null, guestHeader);

        verify(attendeeRepository, never()).save(any());
    }

    @Test
    void rejectsRegistrationForFinishedEvent() {
        event.setStatus(EventStatus.FINISHED);

        assertThrows(ValidationException.class, () -> controller.register(event.getId(), null, guestHeader));
    }

    @Test
    void checksInOnceThenChecksOutOnce() {
        EventAttendee attendee = attendee();
        when(attendeeRepository.findWithLockByIdAndEventId(attendee.getId(), event.getId()))
                .thenReturn(Optional.of(attendee));

        // Chưa check-in thì không check-out được.
        assertThrows(ValidationException.class, () -> scan(attendee, "check-out"));

        assertNotNull(scan(attendee, "check-in").checkedInAt());
        assertThrows(ValidationException.class, () -> scan(attendee, "check-in"));

        assertNotNull(scan(attendee, "check-out").checkedOutAt());
        assertThrows(ValidationException.class, () -> scan(attendee, "check-out"));
        verify(roleGuard, atLeastOnce()).requireMemberOrAbove(member);
    }

    @Test
    void listsAttendeesOfEventForMembers() {
        EventAttendee attendee = attendee();
        when(attendeeRepository.findByEventIdOrderByFullNameAsc(event.getId())).thenReturn(List.of(attendee));

        var tickets = controller.attendees(event.getId(), member).getBody().getData();

        assertEquals(attendee.getId(), tickets.getFirst().id());
        verify(roleGuard).requireMemberOrAbove(member);
    }

    @Test
    void rejectsTicketOfAnotherEvent() {
        UUID ticketId = UUID.randomUUID();
        when(attendeeRepository.findWithLockByIdAndEventId(ticketId, event.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> controller.scan(event.getId(), ticketId, "check-in", member));
    }

    private EventAttendeeController.Ticket scan(EventAttendee attendee, String action) {
        return controller.scan(event.getId(), attendee.getId(), action, member).getBody().getData();
    }

    private EventAttendee attendee() {
        return EventAttendee.builder().id(UUID.randomUUID()).event(event)
                .fullName("Khách Mời").email("guest@gmail.com").build();
    }
}
