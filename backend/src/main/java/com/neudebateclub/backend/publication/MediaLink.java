package com.neudebateclub.backend.publication;

import com.neudebateclub.backend.common.converter.DepartmentConverter;
import com.neudebateclub.backend.common.converter.PlatformConverter;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Platform;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "media_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Convert(converter = PlatformConverter.class)
    @ColumnTransformer(write = "?::platform_enum")
    @Column(nullable = false, columnDefinition = "platform_enum")
    private Platform platform;

    @Convert(converter = DepartmentConverter.class)
    @ColumnTransformer(write = "?::department_enum")
    @Column(nullable = false, columnDefinition = "department_enum")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    @Builder.Default
    private int reach = 0;

    @Column(nullable = false)
    @Builder.Default
    private int likes = 0;

    @Column(nullable = false)
    @Builder.Default
    private int shares = 0;

    @Column(nullable = false)
    @Builder.Default
    private int comments = 0;

    @Column(name = "posted_at", nullable = false)
    private LocalDate postedAt;

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
