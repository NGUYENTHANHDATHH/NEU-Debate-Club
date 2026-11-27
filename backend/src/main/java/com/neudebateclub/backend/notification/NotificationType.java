package com.neudebateclub.backend.notification;

/** Giá trị lưu trong cột VARCHAR {@code notifications.type}. */
public enum NotificationType {
    /** Tự động: người nhận vừa được giao một task. */
    TASK_ASSIGNED,
    /** Tự động: nhắc task chưa hoàn thành theo lịch giãn cách (ngày 1, 2, 4, 8… sau khi giao). */
    TASK_REMINDER,
    /** Tự động: có khoản thu chi gắn với người nhận (cần đóng, đã đóng, CLB chi cho họ). */
    FINANCE,
    /** Các loại dưới đây do người dùng chọn khi tạo thông báo thủ công. */
    GENERAL,
    TASK_UPDATE,
    REWARD,
    URGENT;

    public boolean isManual() {
        return this != TASK_ASSIGNED && this != TASK_REMINDER && this != FINANCE;
    }

    /** Thông báo mở thẳng task (entityId là id task). */
    public boolean isTask() {
        return this == TASK_ASSIGNED || this == TASK_REMINDER;
    }
}
