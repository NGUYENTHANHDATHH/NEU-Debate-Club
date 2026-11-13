package com.neudebateclub.backend.notification;

/** Phạm vi người nhận của thông báo thủ công. */
public enum NotificationAudience {
    /** Toàn CLB (chỉ BCN). */
    ALL,
    /** Mọi thành viên đang hoạt động của các ban được chọn. */
    DEPARTMENTS,
    /** Danh sách thành viên cụ thể. */
    MEMBERS
}
