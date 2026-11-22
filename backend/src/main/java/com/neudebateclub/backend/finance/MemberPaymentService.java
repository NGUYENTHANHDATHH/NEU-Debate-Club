package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.notification.NotificationService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Thu khoản "chưa thu" của thành viên: ghi nhận tay (người quản lý Tài chính) hoặc tự động qua PayOS
 * (webhook, hoặc hỏi trạng thái khi thành viên đang mở QR — chạy được cả khi local chưa có webhook).
 */
@Slf4j
@Service
public class MemberPaymentService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    /** PayOS giới hạn 9 ký tự với tài khoản ngân hàng không liên kết qua PayOS. */
    private static final String PAYOS_DESCRIPTION = "NDCQUY";

    private final TransactionRepository transactionRepository;
    private final PayosClient payos;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final String returnUrl;

    public MemberPaymentService(TransactionRepository transactionRepository, PayosClient payos,
                                ActivityLogService activityLogService, NotificationService notificationService,
                                @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.transactionRepository = transactionRepository;
        this.payos = payos;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
        this.returnUrl = frontendUrl.replaceAll("/+$", "") + "/dashboard/tools/finance";
    }

    public record PaymentLink(UUID transactionId, BigDecimal amount, String qrCode, String checkoutUrl, boolean paid) {
        static PaymentLink of(Transaction transaction) {
            return new PaymentLink(transaction.getId(), transaction.getAmount(), transaction.getPayosQrCode(),
                    transaction.getPayosCheckoutUrl(), transaction.isPaid());
        }
    }

    /**
     * Ghi nhận đã thu: tính vào quỹ từ hôm nay, ghi activity log, gửi biên nhận cho thành viên.
     * actorId null = PayOS tự xác nhận (log ghi theo thành viên đã trả).
     */
    public void settle(Transaction transaction, UUID actorId, String action) {
        if (transaction.isPaid()) {
            throw new ValidationException("Khoản này đã được thu");
        }
        if (actorId != null) {
            // Thu tay trong khi link PayOS còn mở: huỷ link để thành viên không trả hai lần.
            cancelLinkQuietly(transaction, "Đã thu trực tiếp");
        }
        transaction.setPaid(true);
        // Ngày giao dịch thành ngày nhận tiền, để thu chi theo tháng phản ánh lúc tiền vào quỹ.
        transaction.setTransactionDate(LocalDate.now(VIETNAM));
        UUID logActor = actorId != null ? actorId
                : transaction.getMember() != null ? transaction.getMember().getId()
                : transaction.getCreatedBy().getId();
        activityLogService.record(logActor, action, "TRANSACTION", transaction.getId(),
                ActivityLogService.metadata("type", transaction.getType(), "amount", transaction.getAmount(),
                        "description", transaction.getDescription()));
        notificationService.notifyMemberTransactions(List.of(transaction), actorId);
    }

    /** QR cho một khoản chưa thu: dùng lại link PayOS còn chờ thanh toán, không thì tạo link mới. */
    public PaymentLink link(Transaction transaction) {
        if (transaction.isPaid()) {
            return PaymentLink.of(transaction);
        }
        if (transaction.getPayosOrderCode() != null) {
            String status = payos.get(transaction.getPayosOrderCode()).path("status").asString();
            if ("PAID".equals(status)) settle(transaction, null, "PAYOS_PAID");
            // Hết hạn / đã huỷ thì tạo link mới bên dưới.
            if ("PAID".equals(status) || "PENDING".equals(status)) return PaymentLink.of(transaction);
        }
        long amount;
        try {
            amount = transaction.getAmount().longValueExact();
        } catch (ArithmeticException exception) {
            throw new ValidationException("PayOS chỉ nhận số tiền nguyên (VND)");
        }
        long orderCode = transactionRepository.nextPayosOrderCode();
        JsonNode data = payos.create(orderCode, amount, PAYOS_DESCRIPTION,
                returnUrl + "?pay=" + transaction.getId(), returnUrl);
        transaction.setPayosOrderCode(orderCode);
        transaction.setPayosCheckoutUrl(data.path("checkoutUrl").asString(null));
        transaction.setPayosQrCode(data.path("qrCode").asString(null));
        return PaymentLink.of(transaction);
    }

    /** Hỏi PayOS khoản đã được trả chưa; trả rồi thì ghi nhận luôn. @return đã thu */
    public boolean refresh(Transaction transaction) {
        if (transaction.isPaid()) return true;
        if (transaction.getPayosOrderCode() == null || !payos.enabled()) return false;
        if (!"PAID".equals(payos.get(transaction.getPayosOrderCode()).path("status").asString())) return false;
        settle(transaction, null, "PAYOS_PAID");
        return true;
    }

    /**
     * Webhook PayOS. Chữ ký sai → false (trả 400). Chữ ký đúng → luôn true để PayOS không gửi lại, kể cả khi
     * không khớp giao dịch nào (ví dụ giao dịch mẫu lúc khai báo webhook) — những ca đó chỉ ghi log.
     */
    @Transactional
    public boolean handleWebhook(String rawBody) {
        JsonNode data = payos.verifiedWebhookData(rawBody);
        if (data == null) return false;
        if (!"00".equals(data.path("code").asString())) return true;
        long orderCode = data.path("orderCode").asLong();
        Transaction transaction = transactionRepository.findByPayosOrderCode(orderCode).orElse(null);
        if (transaction == null) {
            log.warn("Webhook PayOS orderCode {} không khớp giao dịch nào", orderCode);
        } else if (transaction.isPaid()) {
            log.info("Webhook PayOS orderCode {}: giao dịch đã được ghi nhận trước đó", orderCode);
        } else if (transaction.getAmount().compareTo(BigDecimal.valueOf(data.path("amount").asLong())) != 0) {
            log.warn("Webhook PayOS orderCode {}: số tiền {} khác khoản cần thu {}", orderCode,
                    data.path("amount").asLong(), transaction.getAmount());
        } else {
            settle(transaction, null, "PAYOS_PAID");
        }
        return true;
    }

    /** Huỷ link PayOS còn mở (khi xoá khoản hoặc thu tay); lỗi chỉ ghi log, không chặn thao tác chính. */
    public void cancelLinkQuietly(Transaction transaction, String reason) {
        if (transaction.isPaid() || transaction.getPayosOrderCode() == null || !payos.enabled()) return;
        try {
            payos.cancel(transaction.getPayosOrderCode(), reason);
        } catch (RuntimeException exception) {
            log.warn("Không huỷ được link PayOS {}: {}", transaction.getPayosOrderCode(), exception.getMessage());
        }
    }
}
