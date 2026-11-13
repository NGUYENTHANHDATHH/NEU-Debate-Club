package com.neudebateclub.backend.activity;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    static final int DEFAULT_LIMIT = 100;
    static final int MAX_LIMIT = 500;

    private final ActivityLogRepository activityLogRepository;
    private final RoleGuard roleGuard;

    /** Nhật ký thao tác mới nhất trước. {@code limit} mặc định 100, giới hạn 1..500. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> list(
            @RequestParam(required = false) Integer limit,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.ACTIVITY_LOG);
        int size = limit == null ? DEFAULT_LIMIT : Math.clamp(limit, 1, MAX_LIMIT);
        return ResponseEntity.ok(ApiResponse.success(
                activityLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, size)).stream()
                        .map(ActivityLogResponse::from)
                        .toList()));
    }

    public record ActivityLogResponse(
            UUID id,
            UUID userId,
            String userName,
            String action,
            String entityType,
            UUID entityId,
            Map<String, Object> metadata,
            Instant createdAt) {

        static ActivityLogResponse from(ActivityLog log) {
            User user = log.getUser();
            return new ActivityLogResponse(log.getId(), user.getId(), user.getFullName(), log.getAction(),
                    log.getEntityType(), log.getEntityId(),
                    log.getMetadata() == null ? Map.of() : log.getMetadata(), log.getCreatedAt());
        }
    }
}
