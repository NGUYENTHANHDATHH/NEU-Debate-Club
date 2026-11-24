package com.neudebateclub.backend.partner;

import com.neudebateclub.backend.common.converter.OutreachResultConverter;
import com.neudebateclub.backend.common.enums.OutreachResult;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Một lần Ban Đối ngoại liên hệ nhà tài trợ. */
@Entity
@Table(name = "outreach_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutreachLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "partner_id", nullable = false)
    private UUID partnerId;

    @Column(name = "contact_date", nullable = false)
    private LocalDate contactDate;

    @Column(nullable = false, length = 50)
    private String method;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Convert(converter = OutreachResultConverter.class)
    @ColumnTransformer(write = "?::outreach_result_enum")
    @Column(nullable = false, columnDefinition = "outreach_result_enum")
    private OutreachResult result;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
