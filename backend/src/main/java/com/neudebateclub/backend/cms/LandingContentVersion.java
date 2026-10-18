package com.neudebateclub.backend.cms;

import com.neudebateclub.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "landing_content_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandingContentVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ColumnTransformer(read = "section::text", write = "?::landing_section_enum")
    @Column(nullable = false, columnDefinition = "landing_section_enum")
    private String section;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_json", nullable = false, columnDefinition = "jsonb")
    private String contentJson;

    @Column(nullable = false)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
