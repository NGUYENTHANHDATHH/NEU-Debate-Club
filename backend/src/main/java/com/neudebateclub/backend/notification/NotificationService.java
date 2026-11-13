package com.neudebateclub.backend.notification;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.task.Task;
import com.neudebateclub.backend.task.TaskController;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    static final int DEFAULT_LIMIT = 50;
    static final int MAX_LIMIT = 100;

    private static final DateTimeFormatter DEADLINE_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;
    private final ActivityLogService activityLogService;
    private final PushService pushService;

    /** Thông báo mới nhất của người dùng hiện tại. */
    public List<Notification> listForUser(UserPrincipal currentUser, Integer limit) {
        roleGuard.requireMemberOrAbove(currentUser);
        int size = limit == null ? DEFAULT_LIMIT : Math.clamp(limit, 1, MAX_LIMIT);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), PageRequest.of(0, size));
    }

    /**
     * Tự động báo cho người được giao task. Không gửi khi người giao tự giao cho chính mình
     * (ví dụ BCN giao cho ban chưa có thành viên hoạt động).
     */
    public void notifyTaskAssigned(Task task) {
        User assignee = task.getAssignedTo();
        User assigner = task.getAssignedBy();
        if (assignee == null || (assigner != null && assignee.getId().equals(assigner.getId()))) {
            return;
        }

        StringBuilder body = new StringBuilder("Nhiệm vụ: ").append(task.getTitle())
                .append("\nBan: ").append(TaskController.formatDepartmentName(task.getDepartment()));
        if (task.getDeadline() != null) {
            body.append("\nHạn chót: ").append(DEADLINE_FORMAT.format(task.getDeadline()));
        }

        pushService.push(List.of(notificationRepository.save(Notification.builder()
                .user(assignee)
                .title("Bạn được giao nhiệm vụ mới")
                .body(body.toString())
                .type(NotificationType.TASK_ASSIGNED)
                .entityId(task.getId())
                .createdBy(assigner)
                .build())));
    }

    /**
     * Gửi thông báo thủ công. BCN: toàn CLB, các ban, hoặc thành viên bất kỳ.
     * Trưởng ban: chỉ cả ban mình hoặc thành viên trong ban mình. Người gửi không nhận bản sao.
     *
     * @return số người nhận
     */
    public int sendManual(UserPrincipal sender, NotificationAudience audience, Collection<Department> departments,
                          Collection<UUID> memberIds, NotificationType type, String title, String body) {
        roleGuard.requireModuleManager(sender, AdminModule.NOTIFICATION_MANAGEMENT);
        if (!type.isManual()) {
            throw new ValidationException("Loại thông báo không hợp lệ");
        }

        List<User> recipients = resolveRecipients(sender, audience, departments, memberIds).stream()
                .filter(user -> !user.getId().equals(sender.getId()))
                .toList();
        if (recipients.isEmpty()) {
            throw new ValidationException("Không có người nhận phù hợp");
        }

        User createdBy = userRepository.getReferenceById(sender.getId());
        String cleanTitle = title.trim();
        String cleanBody = body.trim();
        List<Notification> saved = notificationRepository.saveAll(recipients.stream()
                .map(recipient -> Notification.builder()
                        .user(recipient)
                        .title(cleanTitle)
                        .body(cleanBody)
                        .type(type)
                        .createdBy(createdBy)
                        .build())
                .toList());
        pushService.push(saved);
        activityLogService.record(sender.getId(), "SEND", "NOTIFICATION", saved.getFirst().getId(),
                ActivityLogService.metadata("recipientCount", recipients.size(), "title", cleanTitle, "type", type,
                        "audience", audience));
        return recipients.size();
    }

    private List<User> resolveRecipients(UserPrincipal sender, NotificationAudience audience,
                                         Collection<Department> departments, Collection<UUID> memberIds) {
        boolean bcn = sender.getRole() == Role.BCN;
        return switch (audience) {
            case ALL -> {
                if (!bcn) {
                    throw new ForbiddenException("Chỉ BCN được gửi thông báo cho toàn CLB");
                }
                yield activeMembers().toList();
            }
            case DEPARTMENTS -> {
                if (departments == null || departments.isEmpty()) {
                    throw new ValidationException("Vui lòng chọn ít nhất một ban");
                }
                Set<Department> targets = EnumSet.copyOf(departments);
                if (!bcn && !(targets.size() == 1 && sender.getDepartment() != null
                        && targets.contains(sender.getDepartment()))) {
                    throw new ForbiddenException("Trưởng ban chỉ được gửi thông báo cho ban của mình");
                }
                yield activeMembers().filter(user -> targets.contains(user.getDepartment())).toList();
            }
            case MEMBERS -> {
                if (memberIds == null || memberIds.isEmpty()) {
                    throw new ValidationException("Vui lòng chọn ít nhất một thành viên");
                }
                Set<UUID> ids = new LinkedHashSet<>(memberIds);
                List<User> members = userRepository.findAllById(ids);
                if (members.size() != ids.size()
                        || members.stream().anyMatch(user -> !user.isActive() || user.getRole() == Role.GUEST)) {
                    throw new ValidationException("Có thành viên không tồn tại hoặc đã ngừng hoạt động");
                }
                if (!bcn && members.stream().anyMatch(user -> user.getDepartment() != sender.getDepartment())) {
                    throw new ForbiddenException("Trưởng ban chỉ được gửi thông báo cho thành viên trong ban mình");
                }
                yield members;
            }
        };
    }

    private java.util.stream.Stream<User> activeMembers() {
        return userRepository.findAllByOrderByFullNameAsc().stream()
                .filter(User::isActive)
                .filter(user -> user.getRole() != Role.GUEST);
    }
}
