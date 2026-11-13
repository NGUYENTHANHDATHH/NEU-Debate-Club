package com.neudebateclub.backend.notification;

/** Giá trị lưu trong cột VARCHAR {@code notifications.type}. */
public enum NotificationType {
    /** Tự động: người nhận vừa được giao một task. */
    TASK_ASSIGNED,
    /** Các loại dưới đây do người dùng chọn khi tạo thông báo thủ công. */
    GENERAL,
    TASK_UPDATE,
    REWARD,
    URGENT;

    public boolean isManual() {
        return this != TASK_ASSIGNED;
    }
}
