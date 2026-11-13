package com.neudebateclub.backend.publication;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Platform;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/publications")
@RequiredArgsConstructor
public class PublicationController {

    // DB platform_enum only has these values; the Java enum has more.
    private static final Set<Platform> DB_PLATFORMS = EnumSet.of(
            Platform.FACEBOOK, Platform.INSTAGRAM, Platform.YOUTUBE, Platform.TIKTOK, Platform.OTHER);

    private final MediaLinkRepository mediaLinkRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;
    private final ActivityLogService activityLogService;

    @GetMapping
    @Transactional
    public ResponseEntity<ApiResponse<List<PublicationResponse>>> list(
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireMemberOrAbove(currentUser);
        return ResponseEntity.ok(ApiResponse.success(
                mediaLinkRepository.findAllByOrderByPostedAtDescCreatedAtDesc()
                        .stream().map(PublicationResponse::from).toList()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<PublicationResponse>> create(
            @Valid @RequestBody PublicationRequest request,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.PUBLICATIONS);
        roleGuard.requireSameDepartmentOrBCN(currentUser, request.department());
        if (!DB_PLATFORMS.contains(request.platform())) {
            throw new ValidationException("Nền tảng chỉ được là Facebook, Instagram, YouTube, TikTok hoặc Khác");
        }
        String url = request.url().trim();
        if (!isHttpUrl(url)) {
            throw new ValidationException("Liên kết phải bắt đầu bằng http:// hoặc https://");
        }
        Event event = request.eventId() == null ? null : eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId().toString()));

        MediaLink link = MediaLink.builder()
                .title(request.title().trim())
                .url(url)
                .platform(request.platform())
                .department(request.department())
                .event(event)
                .reach(orZero(request.reach()))
                .likes(orZero(request.likes()))
                .shares(orZero(request.shares()))
                .comments(orZero(request.comments()))
                .postedAt(request.postedAt())
                .createdBy(userRepository.getReferenceById(currentUser.getId()))
                .build();
        MediaLink saved = mediaLinkRepository.save(link);
        record(currentUser, "CREATE", saved);
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã thêm ấn phẩm", PublicationResponse.from(saved)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.PUBLICATIONS);
        MediaLink link = mediaLinkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MediaLink", id.toString()));
        roleGuard.requireSameDepartmentOrBCN(currentUser, link.getDepartment());
        mediaLinkRepository.delete(link);
        record(currentUser, "DELETE", link);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa ấn phẩm", null));
    }

    private void record(UserPrincipal currentUser, String action, MediaLink link) {
        activityLogService.record(currentUser.getId(), action, "PUBLICATION", link.getId(),
                ActivityLogService.metadata("title", link.getTitle(), "platform", link.getPlatform(),
                        "department", link.getDepartment()));
    }

    private static int orZero(Integer value) {
        return value == null ? 0 : value;
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

    public record PublicationRequest(
            @NotBlank @Size(max = 255) String title,
            @NotBlank String url,
            @NotNull Platform platform,
            @NotNull Department department,
            UUID eventId,
            @Min(0) Integer reach,
            @Min(0) Integer likes,
            @Min(0) Integer shares,
            @Min(0) Integer comments,
            @NotNull LocalDate postedAt) {
    }

    public record PublicationResponse(
            UUID id,
            String title,
            String url,
            Platform platform,
            Department department,
            UUID eventId,
            String eventTitle,
            int reach,
            int likes,
            int shares,
            int comments,
            LocalDate postedAt,
            String createdByName,
            Instant createdAt) {

        static PublicationResponse from(MediaLink link) {
            Event event = link.getEvent();
            User creator = link.getCreatedBy();
            return new PublicationResponse(link.getId(), link.getTitle(), link.getUrl(), link.getPlatform(),
                    link.getDepartment(), event == null ? null : event.getId(), event == null ? null : event.getTitle(),
                    link.getReach(), link.getLikes(), link.getShares(), link.getComments(), link.getPostedAt(),
                    creator == null ? null : creator.getFullName(), link.getCreatedAt());
        }
    }
}
