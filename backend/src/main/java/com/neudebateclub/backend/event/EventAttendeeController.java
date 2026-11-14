package com.neudebateclub.backend.event;

import com.neudebateclub.backend.auth.jwt.JwtService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.EventStatus;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.UnauthorizedException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Người đã đăng nhập Google ở header (thành viên hoặc khách ngoài CLB) đăng ký tham gia sự kiện; mã QR của họ
 * (id của lượt đăng ký) chỉ thành viên đọc được để gửi qua email;
 * thành viên quét mã đó để check-in/check-out.
 */
@RestController
@RequiredArgsConstructor
public class EventAttendeeController {

    private static final DateTimeFormatter TIME =
            DateTimeFormatter.ofPattern("HH:mm dd/MM").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final EventRepository eventRepository;
    private final EventAttendeeRepository attendeeRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RoleGuard roleGuard;

    /**
     * Người đăng ký là người đang đăng nhập ở header: thành viên (JWT thường) hoặc khách (token khách của
     * {@link JwtService#generateGuestToken}). Đăng ký lại không tạo vé thứ hai. Không trả vé về trình duyệt:
     * mã QR chỉ tới người đăng ký qua email do thành viên gửi từ công cụ gửi mail.
     */
    @PostMapping("/public/events/{eventId}/registrations")
    public ResponseEntity<ApiResponse<Void>> register(
            @PathVariable UUID eventId,
            @CurrentUser UserPrincipal currentUser,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String name;
        String email;
        if (currentUser != null) {
            User member = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new UnauthorizedException("Hãy đăng nhập để đăng ký sự kiện"));
            name = member.getFullName();
            email = member.getEmail().toLowerCase(Locale.ROOT);
        } else {
            Claims guest = jwtService.parseGuest(authorization == null ? "" : authorization.replaceFirst("^Bearer ", ""))
                    .orElseThrow(() -> new UnauthorizedException("Hãy đăng nhập để đăng ký sự kiện"));
            name = guest.get("name", String.class);
            email = guest.get("email", String.class).toLowerCase(Locale.ROOT);
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        if (event.getStatus() == EventStatus.FINISHED) {
            throw new ValidationException("Sự kiện đã kết thúc, không thể đăng ký");
        }

        if (attendeeRepository.findByEventIdAndEmail(eventId, email).isEmpty()) {
            try {
                attendeeRepository.save(EventAttendee.builder()
                        .event(event)
                        .email(email)
                        .fullName(name == null || name.isBlank() ? email : name.trim())
                        .build());
            } catch (DataIntegrityViolationException duplicate) {
                // Bấm đăng ký hai lần cùng lúc: lần kia đã tạo vé, coi như thành công.
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", null));
    }

    /** Người đã đăng ký một sự kiện, kèm mã QR: nguồn người nhận cho công cụ gửi mail (mọi thành viên dùng được). */
    @GetMapping("/events/{eventId}/attendees")
    public ResponseEntity<ApiResponse<List<Ticket>>> attendees(
            @PathVariable UUID eventId,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireMemberOrAbove(currentUser);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        return ResponseEntity.ok(ApiResponse.success(attendeeRepository.findByEventIdOrderByFullNameAsc(eventId)
                .stream().map(attendee -> Ticket.from(attendee, event)).toList()));
    }

    /** {@code id} là nội dung mã QR. Mã của sự kiện khác bị từ chối để vé không dùng nhầm cửa. */
    @PostMapping("/events/{eventId}/attendees/{id}/{action:check-in|check-out}")
    @Transactional
    public ResponseEntity<ApiResponse<Ticket>> scan(
            @PathVariable UUID eventId,
            @PathVariable UUID id,
            @PathVariable String action,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireMemberOrAbove(currentUser);
        EventAttendee attendee = attendeeRepository.findWithLockByIdAndEventId(id, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Mã QR không thuộc sự kiện này"));
        String name = attendee.getFullName();

        if (action.equals("check-in")) {
            if (attendee.getCheckedInAt() != null) {
                throw new ValidationException(name + " đã check-in lúc " + TIME.format(attendee.getCheckedInAt()));
            }
            attendee.setCheckedInAt(Instant.now());
        } else {
            if (attendee.getCheckedInAt() == null) {
                throw new ValidationException(name + " chưa check-in nên chưa thể check-out");
            }
            if (attendee.getCheckedOutAt() != null) {
                throw new ValidationException(name + " đã check-out lúc " + TIME.format(attendee.getCheckedOutAt()));
            }
            attendee.setCheckedOutAt(Instant.now());
        }
        return ResponseEntity.ok(ApiResponse.success(
                Ticket.from(attendeeRepository.save(attendee), attendee.getEvent())));
    }

    public record Ticket(UUID id, UUID eventId, String eventTitle, String fullName, String email,
                         Instant checkedInAt, Instant checkedOutAt) {

        static Ticket from(EventAttendee attendee, Event event) {
            return new Ticket(attendee.getId(), event.getId(), event.getTitle(), attendee.getFullName(),
                    attendee.getEmail(), attendee.getCheckedInAt(), attendee.getCheckedOutAt());
        }
    }
}
