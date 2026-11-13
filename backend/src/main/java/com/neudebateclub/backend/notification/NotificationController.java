package com.neudebateclub.backend.notification;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.response.ApiResponse;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Thông báo của người dùng hiện tại, mới nhất trước. {@code limit} mặc định 50, tối đa 100. */
    @GetMapping
    @Transactional
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> listMine(
            @RequestParam(required = false) Integer limit,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.listForUser(currentUser, limit).stream()
                        .map(NotificationResponse::from)
                        .toList()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<CreateNotificationResponse>> create(
            @Valid @RequestBody CreateNotificationRequest request,
            @CurrentUser UserPrincipal currentUser) {
        int recipients = notificationService.sendManual(currentUser, request.audience(), request.departments(),
                request.memberIds(), request.type(), request.title(), request.body());
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã gửi thông báo tới " + recipients + " người",
                new CreateNotificationResponse(recipients)));
    }

    public record CreateNotificationRequest(
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 5000) String body,
            @NotNull NotificationType type,
            @NotNull NotificationAudience audience,
            List<Department> departments,
            @Size(max = 500) List<UUID> memberIds
    ) {}

    public record CreateNotificationResponse(int recipientCount) {}

    public record NotificationResponse(
            UUID id,
            String title,
            String body,
            NotificationType type,
            UUID entityId,
            UUID senderId,
            String senderName,
            String senderAvatarUrl,
            Instant createdAt
    ) {
        public static NotificationResponse from(Notification notification) {
            var sender = notification.getCreatedBy();
            return new NotificationResponse(
                    notification.getId(),
                    notification.getTitle(),
                    notification.getBody(),
                    notification.getType(),
                    notification.getEntityId(),
                    sender != null ? sender.getId() : null,
                    sender != null ? sender.getFullName() : null,
                    sender != null ? sender.getAvatarUrl() : null,
                    notification.getCreatedAt());
        }
    }
}
