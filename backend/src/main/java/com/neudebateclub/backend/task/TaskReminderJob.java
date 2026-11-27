package com.neudebateclub.backend.task;

import com.neudebateclub.backend.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** 8:00 sáng mỗi ngày nhắc các task chưa hoàn thành theo lịch giãn cách và khi hạn chót còn dưới 24 giờ. */
@Component
@RequiredArgsConstructor
@Slf4j
public class TaskReminderJob {

    private static final String ZONE = "Asia/Ho_Chi_Minh";

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    // shortcut: stateless (tính theo ngày giao), server tắt đúng ngày nhắc thì lượt đó bị bỏ; cần bù thì lưu last_reminded_at.
    @Scheduled(cron = "0 0 8 * * *", zone = ZONE)
    @Transactional
    public void remind() {
        int sent = notificationService.remindUnfinishedTasks(taskRepository.findUnfinished(), Instant.now());
        log.info("Task reminders sent: {}", sent);
    }
}
