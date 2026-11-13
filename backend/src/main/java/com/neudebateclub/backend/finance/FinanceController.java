package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.TransactionType;
import com.neudebateclub.backend.common.exception.ForbiddenException;
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
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
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

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            @Valid @RequestBody TransactionRequest request,
            @CurrentUser UserPrincipal currentUser) {
        requireCanWrite(currentUser, request.eventId() != null);
        // DB transaction_type_enum only has income/expense.
        if (request.type() == TransactionType.TRANSFER) {
            throw new ValidationException("Loại giao dịch chỉ được là thu hoặc chi");
        }
        Event event = request.eventId() == null ? null : eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId().toString()));
        String category = request.category() == null || request.category().isBlank()
                ? null : request.category().trim();

        Transaction transaction = Transaction.builder()
                .type(request.type())
                .amount(request.amount())
                .description(request.description().trim())
                .category(category)
                .event(event)
                .transactionDate(request.transactionDate())
                .createdBy(userRepository.getReferenceById(currentUser.getId()))
                .build();
        Transaction saved = transactionRepository.save(transaction);
        record(currentUser, "CREATE", saved);
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã thêm giao dịch", TransactionResponse.from(saved)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id.toString()));
        requireCanWrite(currentUser, transaction.getEvent() != null);
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
            @NotNull LocalDate transactionDate) {
    }

    public record TransactionResponse(
            UUID id,
            TransactionType type,
            BigDecimal amount,
            String description,
            String category,
            UUID eventId,
            String eventTitle,
            LocalDate transactionDate,
            UUID createdById,
            String createdByName,
            Instant createdAt) {

        static TransactionResponse from(Transaction transaction) {
            Event event = transaction.getEvent();
            User creator = transaction.getCreatedBy();
            return new TransactionResponse(transaction.getId(), transaction.getType(), transaction.getAmount(),
                    transaction.getDescription(), transaction.getCategory(),
                    event == null ? null : event.getId(), event == null ? null : event.getTitle(),
                    transaction.getTransactionDate(),
                    creator == null ? null : creator.getId(), creator == null ? null : creator.getFullName(),
                    transaction.getCreatedAt());
        }
    }
}
