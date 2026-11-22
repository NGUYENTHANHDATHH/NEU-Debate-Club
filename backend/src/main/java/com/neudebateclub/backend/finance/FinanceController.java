package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.TransactionType;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.notification.NotificationService;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Sổ thu chi. Người quản lý FINANCE thấy và sửa mọi giao dịch; người quản lý EVENT_MANAGEMENT
 * (Ban Sự kiện) chỉ thấy, thêm, xóa giao dịch có gắn sự kiện (quyết định của owner 2026-11-13).
 */
@RestController
@RequestMapping("/finance/transactions")
@RequiredArgsConstructor
public class FinanceController {

    private final TransactionRepository transactionRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final MemberPaymentService memberPaymentService;

    @GetMapping
    @Transactional
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> list(
            @CurrentUser UserPrincipal currentUser) {
        boolean financeManager = roleGuard.canManageModule(currentUser, AdminModule.FINANCE);
        if (!financeManager) {
            roleGuard.requireModuleManager(currentUser, AdminModule.EVENT_MANAGEMENT);
        }
        List<Transaction> rows = financeManager
                ? transactionRepository.findAllByOrderByTransactionDateDescCreatedAtDesc()
                : transactionRepository.findAllByEventIsNotNullOrderByTransactionDateDescCreatedAtDesc();
        return ResponseEntity.ok(ApiResponse.success(rows.stream().map(TransactionResponse::from).toList()));
    }

    /** Thu chi gắn với chính người gọi (đóng quỹ, hoàn ứng...): mọi thành viên xem được của mình. */
    @GetMapping("/mine")
    @Transactional
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> mine(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(transactionRepository
                .findAllByMemberIdOrderByTransactionDateDescCreatedAtDesc(currentUser.getId())
                .stream().map(TransactionResponse::from).toList()));
    }

    /** Danh sách chọn "Thành viên liên quan": mọi ban, vì /members chỉ cho trưởng ban xem ban mình. */
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<MemberOption>>> members(
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.FINANCE);
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAllByOrderByFullNameAsc().stream()
                .filter(user -> user.isActive() && user.getRole() != Role.GUEST)
                .map(user -> new MemberOption(user.getId(), user.getFullName(), user.getEmail()))
                .toList()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            @Valid @RequestBody TransactionRequest request,
            @CurrentUser UserPrincipal currentUser) {
        Transaction saved = save(request, currentUser);
        notificationService.notifyMemberTransactions(List.of(saved), currentUser.getId());
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã thêm giao dịch", TransactionResponse.from(saved)));
    }

    /** Nhập nhiều giao dịch từ file CSV: lỗi ở một dòng thì không dòng nào được lưu. */
    @PostMapping("/import")
    @Transactional
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> importAll(
            @Valid @RequestBody ImportRequest request,
            @CurrentUser UserPrincipal currentUser) {
        List<Transaction> saved = request.transactions().stream().map(item -> save(item, currentUser)).toList();
        notificationService.notifyMemberTransactions(saved, currentUser.getId());
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã nhập " + saved.size() + " giao dịch", saved.stream().map(TransactionResponse::from).toList()));
    }

    /** Thành viên đã đóng khoản "chưa thu": tính vào quỹ từ hôm nay và gửi biên nhận cho họ. */
    @PostMapping("/{id}/paid")
    @Transactional
    public ResponseEntity<ApiResponse<TransactionResponse>> markPaid(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id.toString()));
        requireCanWrite(currentUser, transaction.getEvent() != null);
        memberPaymentService.settle(transaction, currentUser.getId(), "MARK_PAID");
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận khoản thu", TransactionResponse.from(transaction)));
    }

    /** QR PayOS để thành viên tự trả khoản chưa thu của mình. */
    @PostMapping("/{id}/payos")
    @Transactional
    public ResponseEntity<ApiResponse<MemberPaymentService.PaymentLink>> payosLink(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(memberPaymentService.link(ownTransaction(id, currentUser))));
    }

    /** Thành viên đang mở QR hỏi lại: PayOS báo đã trả thì ghi nhận ngay, không phải chờ webhook. */
    @PostMapping("/{id}/payos/refresh")
    @Transactional
    public ResponseEntity<ApiResponse<Boolean>> payosRefresh(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(memberPaymentService.refresh(ownTransaction(id, currentUser))));
    }

    private Transaction ownTransaction(UUID id, UserPrincipal currentUser) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id.toString()));
        if (transaction.getMember() == null || !transaction.getMember().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ thành viên có khoản này mới thanh toán được");
        }
        return transaction;
    }

    private Transaction save(TransactionRequest request, UserPrincipal currentUser) {
        requireCanWrite(currentUser, request.eventId() != null);
        // DB transaction_type_enum only has income/expense.
        if (request.type() == TransactionType.TRANSFER) {
            throw new ValidationException("Loại giao dịch chỉ được là thu hoặc chi");
        }
        boolean paid = request.paid() == null || request.paid();
        if (!paid && (request.type() != TransactionType.INCOME || request.memberId() == null || request.eventId() != null)) {
            throw new ValidationException("Khoản chưa thu phải là khoản thu gắn một thành viên và không gắn sự kiện");
        }
        Event event = request.eventId() == null ? null : eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId().toString()));
        User member = request.memberId() == null ? null : userRepository.findById(request.memberId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.memberId().toString()));
        String category = request.category() == null || request.category().isBlank()
                ? null : request.category().trim();

        Transaction transaction = Transaction.builder()
                .type(request.type())
                .amount(request.amount())
                .description(request.description().trim())
                .category(category)
                .event(event)
                .member(member)
                .paid(paid)
                .transactionDate(request.transactionDate())
                .createdBy(userRepository.getReferenceById(currentUser.getId()))
                .build();
        Transaction saved = transactionRepository.save(transaction);
        record(currentUser, "CREATE", saved);
        return saved;
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id.toString()));
        requireCanWrite(currentUser, transaction.getEvent() != null);
        memberPaymentService.cancelLinkQuietly(transaction, "Khoản thu đã bị xoá");
        transactionRepository.delete(transaction);
        record(currentUser, "DELETE", transaction);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa giao dịch", null));
    }

    private void requireCanWrite(UserPrincipal currentUser, boolean linkedToEvent) {
        if (roleGuard.canManageModule(currentUser, AdminModule.FINANCE)) return;
        if (roleGuard.canManageModule(currentUser, AdminModule.EVENT_MANAGEMENT)) {
            if (linkedToEvent) return;
            throw new ForbiddenException("Ban Sự kiện chỉ được ghi thu chi gắn với một sự kiện");
        }
        throw new ForbiddenException("Access restricted to module: " + AdminModule.FINANCE);
    }

    private void record(UserPrincipal currentUser, String action, Transaction transaction) {
        activityLogService.record(currentUser.getId(), action, "TRANSACTION", transaction.getId(),
                ActivityLogService.metadata("type", transaction.getType(), "amount", transaction.getAmount(),
                        "description", transaction.getDescription()));
    }

    public record TransactionRequest(
            @NotNull TransactionType type,
            @NotNull @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 13, fraction = 2) BigDecimal amount,
            @NotBlank @Size(max = 500) String description,
            @Size(max = 100) String category,
            UUID eventId,
            UUID memberId,
            /** null = đã thu/đã chi; false = khoản thành viên cần đóng. */
            Boolean paid,
            @NotNull LocalDate transactionDate) {
    }

    public record ImportRequest(@NotEmpty @Size(max = 1000) List<@NotNull @Valid TransactionRequest> transactions) {
    }

    public record MemberOption(UUID id, String fullName, String email) {
    }

    public record TransactionResponse(
            UUID id,
            TransactionType type,
            BigDecimal amount,
            String description,
            String category,
            UUID eventId,
            String eventTitle,
            UUID memberId,
            String memberName,
            boolean paid,
            LocalDate transactionDate,
            UUID createdById,
            String createdByName,
            Instant createdAt) {

        static TransactionResponse from(Transaction transaction) {
            Event event = transaction.getEvent();
            User creator = transaction.getCreatedBy();
            User member = transaction.getMember();
            return new TransactionResponse(transaction.getId(), transaction.getType(), transaction.getAmount(),
                    transaction.getDescription(), transaction.getCategory(),
                    event == null ? null : event.getId(), event == null ? null : event.getTitle(),
                    member == null ? null : member.getId(), member == null ? null : member.getFullName(),
                    transaction.isPaid(),
                    transaction.getTransactionDate(),
                    creator == null ? null : creator.getId(), creator == null ? null : creator.getFullName(),
                    transaction.getCreatedAt());
        }
    }
}
