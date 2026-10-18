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
@Table(name = "landing_content")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LandingContent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Keep the API's lowercase strings while casting PostgreSQL enum reads/writes.
    @ColumnTransformer(read = "section::text", write = "?::landing_section_enum")
    @Column(nullable = false, unique = true,
            columnDefinition = "landing_section_enum")
    private String section;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_json", nullable = false, columnDefinition = "jsonb")
    private String contentJson;

    @Column(name = "is_published", nullable = false)
    private boolean published;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
