package com.neudebateclub.backend.event;

import com.neudebateclub.backend.common.converter.EventStatusConverter;
import com.neudebateclub.backend.common.enums.EventStatus;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(length = 255)
    private String location;

    @Column(name = "event_date", nullable = false)
    private Instant eventDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal budget;

    @Convert(converter = EventStatusConverter.class)
    @ColumnTransformer(write = "?::event_status_enum")
    @Column(nullable = false, columnDefinition = "event_status_enum")
    private EventStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "resource_urls", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> resourceUrls = new ArrayList<>();

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
