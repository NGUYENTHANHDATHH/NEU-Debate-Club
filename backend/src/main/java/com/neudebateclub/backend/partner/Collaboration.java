package com.neudebateclub.backend.partner;

import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.user.User;
import jakarta.persistence.Column;
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
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/** Một lần tài trợ: gói, số tiền, link hợp đồng. */
@Entity
@Table(name = "collaborations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Collaboration {

    /** Giá trị cho các cột VARCHAR của V9. */
    public static final Set<String> TIERS = Set.of("kim_cuong", "vang", "bac", "dong", "hien_vat");
    public static final Set<String> CONTRACT_STATUSES = Set.of("dang_dam_phan", "da_ky", "da_thanh_ly");

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "partner_id", nullable = false)
    private UUID partnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "sponsored_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal sponsoredAmount;

    /** Link Google Drive tới file hợp đồng (Word/PDF). */
    @Column(name = "mou_link", columnDefinition = "TEXT")
    private String mouLink;

    @Column(name = "collaboration_date", nullable = false)
    private LocalDate collaborationDate;

    @Column(length = 50)
    private String tier;

    @Column(name = "contract_status", nullable = false, length = 50)
    private String contractStatus;

    @Column(name = "benefits_committed", columnDefinition = "TEXT")
    private String benefitsCommitted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Chỉ hợp đồng đã ký/đã thanh lý mới tính là đã tài trợ. */
    public boolean isSigned() {
        return "da_ky".equals(contractStatus) || "da_thanh_ly".equals(contractStatus);
    }
}
