package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.common.converter.TransactionTypeConverter;
import com.neudebateclub.backend.common.enums.TransactionType;
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Convert(converter = TransactionTypeConverter.class)
    @ColumnTransformer(write = "?::transaction_type_enum")
    @Column(nullable = false, columnDefinition = "transaction_type_enum")
    private TransactionType type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 100)
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private User member;

    /** false: khoản thành viên cần đóng, chưa nhận tiền (chưa tính vào quỹ). */
    @Builder.Default
    @Column(nullable = false)
    private boolean paid = true;

    /** Link PayOS đang dùng cho khoản chưa thu (xem MemberPaymentService). */
    @Column(name = "payos_order_code", unique = true)
    private Long payosOrderCode;

    @Column(name = "payos_checkout_url", columnDefinition = "TEXT")
    private String payosCheckoutUrl;

    /** Chuỗi VietQR, frontend vẽ thành ảnh QR. */
    @Column(name = "payos_qr_code", columnDefinition = "TEXT")
    private String payosQrCode;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
