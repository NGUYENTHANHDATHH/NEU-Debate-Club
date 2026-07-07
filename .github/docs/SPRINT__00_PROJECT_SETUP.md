# SPRINT 00 — Project Setup & Infrastructure

> **Coding Agent:** GitHub Copilot Workspace  
> **Stack:** Java 25 · Spring Boot 4.1 · PostgreSQL · Google OAuth2  
> **Goal:** Khởi tạo project từ scratch, cấu hình đầy đủ để các Sprint sau có thể code ngay

---

## 📋 CONTEXT

NEU Debate Club là hệ thống quản trị nội bộ CLB Tranh Biện. Backend Spring Boot cung cấp REST API cho frontend Next.js. Authentication qua Google OAuth2 — backend verify Google ID Token, cấp JWT riêng cho client.

---

## 🎯 SPRINT GOALS

1. Khởi tạo Spring Boot project với đúng dependencies
2. Cấu hình PostgreSQL connection + Flyway migration
3. Cấu hình Spring Security (permit all tạm thời, sẽ lock down ở Sprint 01)
4. Cấu hình CORS cho Next.js frontend
5. Tạo global exception handler
6. Tạo cấu trúc package chuẩn
7. Health check endpoint hoạt động

---

## 📦 DEPENDENCIES (pom.xml)

```xml
<dependencies>
  <!-- Web -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!-- Security -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>

  <!-- OAuth2 Resource Server (verify Google JWT) -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
  </dependency>

  <!-- Data JPA -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>

  <!-- Validation -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>

  <!-- PostgreSQL Driver -->
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
  </dependency>

  <!-- Flyway — DB Migration -->
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
  </dependency>
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
  </dependency>

  <!-- Lombok -->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>

  <!-- Google API Client (verify ID Token) -->
  <dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
  </dependency>

  <!-- JWT (issue our own JWT after Google verify) -->
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
  </dependency>

  <!-- Test -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>

<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
      <configuration>
        <excludes>
          <exclude>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
          </exclude>
        </excludes>
      </configuration>
    </plugin>
  </plugins>
</build>
```

---

## 📁 PACKAGE STRUCTURE

```
com.clubhub/
├── ClubHubApplication.java
├── config/
│   ├── SecurityConfig.java         # Spring Security + CORS
│   ├── JwtConfig.java              # JWT properties
│   └── WebConfig.java              # Web MVC config
├── common/
│   ├── response/
│   │   ├── ApiResponse.java        # Generic response wrapper
│   │   └── PageResponse.java       # Paginated response wrapper
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   ├── ResourceNotFoundException.java
│   │   ├── ForbiddenException.java
│   │   ├── UnauthorizedException.java
│   │   └── ValidationException.java
│   └── enums/
│       ├── Role.java
│       ├── Department.java
│       ├── TaskStatus.java
│       ├── TaskPriority.java
│       ├── TransactionType.java
│       ├── EventStatus.java
│       ├── PartnerStatus.java
│       ├── OutreachResult.java
│       ├── Platform.java
│       ├── ContentStatus.java
│       └── LandingSection.java
├── auth/                           # Sprint 01
├── user/                           # Sprint 02
├── task/                           # Sprint 03
├── announcement/                   # Sprint 04
├── event/                          # Sprint 05
├── finance/                        # Sprint 06
├── partner/                        # Sprint 07
└── dashboard/                      # Sprint 08
```

---

## ⚙️ APPLICATION PROPERTIES

### `src/main/resources/application.yml`

```yaml
spring:
  application:
    name: clubhub-backend

  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/clubhub}
    username: ${DATABASE_USERNAME:postgres}
    password: ${DATABASE_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate # Flyway quản lý schema, JPA chỉ validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        default_schema: public

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

server:
  port: ${PORT:8080}
  servlet:
    context-path: /api

app:
  jwt:
    secret: ${JWT_SECRET:your-256-bit-secret-key-here-must-be-very-long}
    expiration-ms: ${JWT_EXPIRATION_MS:604800000} # 7 days

  google:
    client-id: ${GOOGLE_CLIENT_ID}

  allowed-domain: ${ALLOWED_DOMAIN:.ndc.neu@gmail.com}

  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}

logging:
  level:
    com.clubhub: DEBUG
    org.springframework.security: INFO
```

### `src/main/resources/application-local.yml`

```yaml
# Override cho local dev — KHÔNG commit file này nếu có secret thật
spring:
  jpa:
    show-sql: true

logging:
  level:
    com.clubhub: DEBUG
    org.springframework.security: DEBUG
```

---

## 🗄️ FLYWAY MIGRATION

### `src/main/resources/db/migration/V1__create_enums.sql`

```sql
-- Enums phải tạo trước bảng
CREATE TYPE role_enum AS ENUM ('guest', 'member', 'truong_ban', 'bcn');
CREATE TYPE department_enum AS ENUM ('bcn', 'truyen_thong', 'noi_dung', 'su_kien', 'doi_ngoai');
CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE transaction_type_enum AS ENUM ('income', 'expense');
CREATE TYPE event_status_enum AS ENUM ('upcoming', 'ongoing', 'finished');
CREATE TYPE partner_status_enum AS ENUM ('dang_lien_he', 'da_hop_tac', 'than_thiet', 'khong_phan_hoi');
CREATE TYPE outreach_result_enum AS ENUM ('cho_phan_hoi', 'dong_y', 'tu_choi');
CREATE TYPE platform_enum AS ENUM ('facebook', 'instagram', 'youtube', 'tiktok', 'other');
CREATE TYPE content_status_enum AS ENUM ('idea', 'writing', 'review', 'approved', 'published');
CREATE TYPE landing_section_enum AS ENUM ('hero', 'about', 'stats', 'activities', 'achievements', 'team', 'blog');
CREATE TYPE checklist_status_enum AS ENUM ('pending', 'in_progress', 'done');
```

### `src/main/resources/db/migration/V2__create_core_tables.sql`

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id     VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  full_name     VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  role          role_enum   NOT NULL DEFAULT 'guest',
  department    department_enum,
  phone         VARCHAR(20),
  student_id    VARCHAR(20),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_is_active  ON users(is_active);

CREATE TABLE seasons (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  start_date DATE    NOT NULL,
  end_date   DATE    NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seasons_date_check CHECK (end_date > start_date)
);

CREATE TABLE season_members (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id  UUID           NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id    UUID           NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  role       role_enum      NOT NULL,
  department department_enum NOT NULL,
  joined_at  DATE           NOT NULL DEFAULT CURRENT_DATE,
  left_at    DATE,
  CONSTRAINT season_members_unique UNIQUE (season_id, user_id),
  CONSTRAINT season_members_date_check CHECK (left_at IS NULL OR left_at > joined_at)
);
```

### `src/main/resources/db/migration/V3__create_task_tables.sql`

```sql
CREATE TABLE tasks (
  id                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255)       NOT NULL,
  description          TEXT,
  priority             task_priority_enum NOT NULL DEFAULT 'medium',
  status               task_status_enum   NOT NULL DEFAULT 'todo',
  deadline             TIMESTAMPTZ,
  assigned_to          UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_by          UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department           department_enum,
  is_cross_department  BOOLEAN            NOT NULL DEFAULT false,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ        NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assigned_to  ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by  ON tasks(assigned_by);
CREATE INDEX idx_tasks_status       ON tasks(status);
CREATE INDEX idx_tasks_deadline     ON tasks(deadline);
CREATE INDEX idx_tasks_department   ON tasks(department);

CREATE TABLE task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
```

### `src/main/resources/db/migration/V4__create_announcement_tables.sql`

```sql
CREATE TABLE announcements (
  id                UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(255)             NOT NULL,
  content           TEXT                     NOT NULL,
  target_role       VARCHAR(50)              NOT NULL DEFAULT 'all',
  target_department department_enum,
  is_pinned         BOOLEAN                  NOT NULL DEFAULT false,
  created_by        UUID                     NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ              NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ              NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_created_at        ON announcements(created_at DESC);
CREATE INDEX idx_announcements_target_department ON announcements(target_department);

CREATE TABLE announcement_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT announcement_reads_unique UNIQUE (announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);

CREATE TABLE notifications (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  body       TEXT    NOT NULL,
  type       VARCHAR(50)  NOT NULL,
  entity_id  UUID,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### `src/main/resources/db/migration/V5__create_event_tables.sql`

```sql
CREATE TABLE events (
  id                 UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  title              VARCHAR(255)      NOT NULL,
  description        TEXT,
  thumbnail_url      TEXT,
  event_date         TIMESTAMPTZ       NOT NULL,
  location           VARCHAR(255),
  status             event_status_enum NOT NULL DEFAULT 'upcoming',
  is_public          BOOLEAN           NOT NULL DEFAULT true,
  budget             DECIMAL(15,2)     NOT NULL DEFAULT 0,
  actual_attendees   INTEGER,
  expected_attendees INTEGER,
  post_event_notes   TEXT,
  post_event_rating  SMALLINT CHECK (post_event_rating BETWEEN 1 AND 5),
  created_by         UUID              NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ       NOT NULL DEFAULT now(),
  CONSTRAINT events_budget_check CHECK (budget >= 0)
);

CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status     ON events(status);
CREATE INDEX idx_events_is_public  ON events(is_public);

CREATE TABLE event_checklist_items (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID                  NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title             VARCHAR(255)          NOT NULL,
  status            checklist_status_enum NOT NULL DEFAULT 'pending',
  priority          task_priority_enum    NOT NULL DEFAULT 'medium',
  assigned_to       UUID                  REFERENCES users(id) ON DELETE SET NULL,
  deadline          TIMESTAMPTZ,
  days_before_event INTEGER,
  order_index       INTEGER               NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_event       ON event_checklist_items(event_id);
CREATE INDEX idx_checklist_items_assigned_to ON event_checklist_items(assigned_to);
```

### `src/main/resources/db/migration/V6__create_finance_partner_tables.sql`

```sql
CREATE TABLE transactions (
  id               UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  type             transaction_type_enum  NOT NULL,
  amount           DECIMAL(15,2)          NOT NULL,
  description      VARCHAR(500)           NOT NULL,
  category         VARCHAR(100),
  event_id         UUID                   REFERENCES events(id) ON DELETE SET NULL,
  transaction_date DATE                   NOT NULL,
  receipt_url      TEXT,
  created_by       UUID                   NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ            NOT NULL DEFAULT now(),
  CONSTRAINT transactions_amount_check CHECK (amount > 0)
);

CREATE INDEX idx_transactions_type             ON transactions(type);
CREATE INDEX idx_transactions_event_id         ON transactions(event_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date DESC);

CREATE TABLE partners (
  id                   UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name         VARCHAR(255)        NOT NULL,
  field                VARCHAR(100),
  logo_url             TEXT,
  status               partner_status_enum NOT NULL DEFAULT 'dang_lien_he',
  total_collaborations INTEGER             NOT NULL DEFAULT 0,
  total_sponsored      DECIMAL(15,2)       NOT NULL DEFAULT 0,
  notes                TEXT,
  created_by           UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE TABLE partner_contacts (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID    NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  full_name  VARCHAR(255) NOT NULL,
  position   VARCHAR(100),
  phone      VARCHAR(20),
  email      VARCHAR(255),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outreach_logs (
  id             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id     UUID                 NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  contact_date   DATE                 NOT NULL,
  method         VARCHAR(50)          NOT NULL,
  content        TEXT                 NOT NULL,
  result         outreach_result_enum NOT NULL DEFAULT 'cho_phan_hoi',
  follow_up_date DATE,
  created_by     UUID                 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT now()
);

CREATE TABLE collaborations (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id         UUID          NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  event_id           UUID          REFERENCES events(id) ON DELETE SET NULL,
  description        VARCHAR(500)  NOT NULL,
  sponsored_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
  mou_link           TEXT,
  collaboration_date DATE          NOT NULL,
  created_by         UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
```

### `src/main/resources/db/migration/V7__create_cms_activity_tables.sql`

```sql
CREATE TABLE landing_content (
  id           UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  section      landing_section_enum NOT NULL UNIQUE,
  content_json JSONB                NOT NULL DEFAULT '{}',
  is_published BOOLEAN              NOT NULL DEFAULT true,
  updated_by   UUID                 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at   TIMESTAMPTZ          NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   UUID         NOT NULL,
  metadata    JSONB        DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

### `src/main/resources/db/migration/V8__create_triggers.sql`

```sql
-- Trigger: tự động updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at       BEFORE UPDATE ON users            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated_at       BEFORE UPDATE ON tasks            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON announcements   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_events_updated_at      BEFORE UPDATE ON events           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_partners_updated_at    BEFORE UPDATE ON partners         FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: tự động set completed_at
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  END IF;
  IF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_completed_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- Trigger: cập nhật partner stats
CREATE OR REPLACE FUNCTION update_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE partners SET
      total_collaborations = total_collaborations + 1,
      total_sponsored = total_sponsored + NEW.sponsored_amount,
      status = CASE WHEN total_collaborations + 1 >= 3 THEN 'than_thiet'::partner_status_enum ELSE 'da_hop_tac'::partner_status_enum END
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_partner_stats AFTER INSERT ON collaborations FOR EACH ROW EXECUTE FUNCTION update_partner_stats();

-- Seed landing_content sections
INSERT INTO landing_content (section, content_json, updated_by)
SELECT s::landing_section_enum, '{}'::jsonb, (SELECT id FROM users LIMIT 1)
FROM unnest(ARRAY['hero','about','stats','activities','achievements','team','blog']) s
ON CONFLICT (section) DO NOTHING;
```

---

## 🔧 CLASSES CẦN TẠO

### 1. Enums (`com.clubhub.common.enums`)

Tạo enum cho từng type — ví dụ:

```java
// Role.java
public enum Role {
    GUEST, MEMBER, TRUONG_BAN, BCN;

    public String toDbValue() {
        return name().toLowerCase();
    }
}

// Department.java
public enum Department {
    BCN, TRUYEN_THONG, NOI_DUNG, SU_KIEN, DOI_NGOAI
}

// TaskStatus.java
public enum TaskStatus { TODO, IN_PROGRESS, DONE }

// TaskPriority.java
public enum TaskPriority { LOW, MEDIUM, HIGH }

// TransactionType.java
public enum TransactionType { INCOME, EXPENSE }

// EventStatus.java
public enum EventStatus { UPCOMING, ONGOING, FINISHED }

// PartnerStatus.java
public enum PartnerStatus { DANG_LIEN_HE, DA_HOP_TAC, THAN_THIET, KHONG_PHAN_HOI }

// OutreachResult.java
public enum OutreachResult { CHO_PHAN_HOI, DONG_Y, TU_CHOI }

// Platform.java
public enum Platform { FACEBOOK, INSTAGRAM, YOUTUBE, TIKTOK, OTHER }

// LandingSection.java
public enum LandingSection { HERO, ABOUT, STATS, ACTIVITIES, ACHIEVEMENTS, TEAM, BLOG }
```

### 2. ApiResponse (`com.clubhub.common.response`)

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .build();
    }
}
```

### 3. PageResponse (`com.clubhub.common.response`)

```java
@Data
@Builder
public class PageResponse<T> {
    private List<T> data;
    private long total;
    private int page;
    private int limit;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrev;

    public static <T> PageResponse<T> of(Page<T> page, int pageNumber, int limit) {
        return PageResponse.<T>builder()
            .data(page.getContent())
            .total(page.getTotalElements())
            .page(pageNumber)
            .limit(limit)
            .totalPages(page.getTotalPages())
            .hasNext(page.hasNext())
            .hasPrev(page.hasPrevious())
            .build();
    }
}
```

### 4. Exceptions (`com.clubhub.common.exception`)

```java
// ResourceNotFoundException.java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
    public ResourceNotFoundException(String resource, String id) {
        super(resource + " not found with id: " + id);
    }
}

// ForbiddenException.java
public class ForbiddenException extends RuntimeException {
    public ForbiddenException() { super("Access denied"); }
    public ForbiddenException(String message) { super(message); }
}

// UnauthorizedException.java
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException() { super("Authentication required"); }
    public UnauthorizedException(String message) { super(message); }
}
```

### 5. GlobalExceptionHandler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
        MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .data(errors)
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Internal server error"));
    }
}
```

### 6. SecurityConfig (tạm thời permit all)

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                // TODO Sprint 01: lock down các route khác
                .anyRequest().permitAll()   // TẠM THỜI — sẽ thay bằng authenticated()
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 7. Health Check Controller

```java
@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        return ResponseEntity.ok(ApiResponse.success(
            Map.of(
                "status", "UP",
                "service", "ClubHub API",
                "version", "1.0.0"
            )
        ));
    }
}
```

---

## ✅ DEFINITION OF DONE

- [ ] `mvn clean install` không có lỗi
- [ ] Flyway migrations V1–V8 chạy thành công
- [ ] `GET /api/health` trả về `{"success": true, "data": {"status": "UP"}}`
- [ ] Tất cả enums được tạo đúng package
- [ ] `ApiResponse` và `PageResponse` hoạt động
- [ ] `GlobalExceptionHandler` bắt được `MethodArgumentNotValidException`
- [ ] CORS cho phép `http://localhost:3000`
- [ ] Application start không có lỗi, log level DEBUG

---

## 🔗 NEXT SPRINT

**SPRINT_01_AUTH.md** — Implement Google OAuth2 flow, JWT issuance, Security filter chain hoàn chỉnh.
