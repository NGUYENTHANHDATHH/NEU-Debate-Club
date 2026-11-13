package com.neudebateclub.backend.activity;

import com.neudebateclub.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Ghi activity log. Gọi trong cùng transaction với thao tác ghi, sau khi lưu thành công,
 * để log và dữ liệu cùng commit hoặc cùng rollback.
 */
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public void record(UUID actorId, String action, String entityType, UUID entityId, Map<String, Object> metadata) {
        activityLogRepository.save(ActivityLog.builder()
                .user(userRepository.getReferenceById(actorId))
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .metadata(metadata == null ? Map.of() : metadata)
                .build());
    }

    /** Metadata từ các cặp key, value; bỏ qua value null, enum ghi bằng tên. */
    public static Map<String, Object> metadata(Object... keyValues) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i + 1 < keyValues.length; i += 2) {
            Object value = keyValues[i + 1];
            if (value != null) {
                result.put((String) keyValues[i], value instanceof Enum<?> e ? e.name() : value);
            }
        }
        return result;
    }
}
