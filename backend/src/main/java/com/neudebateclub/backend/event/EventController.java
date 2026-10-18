package com.neudebateclub.backend.event;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.EventStatus;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> list(
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.EVENT_MANAGEMENT);
        return ResponseEntity.ok(ApiResponse.success(eventRepository.findAllByOrderByEventDateDesc()
                .stream().map(EventResponse::from).toList()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<EventResponse>> create(
            @Valid @RequestBody EventRequest request,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.EVENT_MANAGEMENT);
        Event event = apply(new Event(), request);
        event.setCreatedBy(userRepository.getReferenceById(currentUser.getId()));
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã tạo sự kiện", EventResponse.from(eventRepository.save(event))));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody EventRequest request,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.EVENT_MANAGEMENT);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id.toString()));
        return ResponseEntity.ok(ApiResponse.success(
                "Đã cập nhật sự kiện", EventResponse.from(eventRepository.save(apply(event, request)))));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.EVENT_MANAGEMENT);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id.toString()));
        eventRepository.delete(event);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sự kiện", null));
    }

    private Event apply(Event event, EventRequest request) {
        List<String> urls = request.resourceUrls() == null ? List.of() : request.resourceUrls().stream()
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .distinct()
                .toList();
        if (urls.size() > 10 || urls.stream().anyMatch(url -> !isHttpUrl(url))) {
            throw new ValidationException("Tối đa 10 liên kết hợp lệ bắt đầu bằng http:// hoặc https://");
        }
        event.setTitle(request.title().trim());
        event.setDescription(request.description() == null ? null : request.description().trim());
        event.setLocation(request.location() == null ? null : request.location().trim());
        event.setEventDate(request.eventDate());
        event.setBudget(request.budget());
        event.setStatus(request.status() == null ? EventStatus.UPCOMING : request.status());
        event.setResourceUrls(urls);
        return event;
    }

    private boolean isHttpUrl(String value) {
        try {
            URI uri = URI.create(value);
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    public record EventRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 5000) String description,
            @Size(max = 255) String location,
            @NotNull Instant eventDate,
            @NotNull @DecimalMin("0.00") BigDecimal budget,
            EventStatus status,
            List<String> resourceUrls) {
    }

    public record EventResponse(
            UUID id,
            String title,
            String description,
            String location,
            Instant eventDate,
            BigDecimal budget,
            EventStatus status,
            List<String> resourceUrls,
            Instant createdAt,
            Instant updatedAt) {

        static EventResponse from(Event event) {
            return new EventResponse(event.getId(), event.getTitle(), event.getDescription(),
                    event.getLocation(),
                    event.getEventDate(), event.getBudget(), event.getStatus(), event.getResourceUrls(),
                    event.getCreatedAt(), event.getUpdatedAt());
        }
    }
}
