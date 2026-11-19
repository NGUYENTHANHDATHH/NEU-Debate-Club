# NEU Debate Club — Website & Hệ thống quản trị CLB

Website giới thiệu công khai và dashboard quản trị nội bộ cho CLB Tranh biện NEU: quản lý thành viên, giao việc, sự kiện (đăng ký + check-in QR), tài chính, thông báo đẩy, CMS cho trang chủ và các công cụ cho thành viên.

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript 5, Tailwind 4, MUI 7, Radix UI, TanStack Query |
| Backend | Java 21, Spring Boot 4.1 (Web, Security, Data JPA, Validation, Actuator), Flyway, springdoc OpenAPI, JWT (jjwt), Google API Client, Web Push (VAPID) |
| Database | PostgreSQL 16, schema quản lý bằng Flyway (`V1`–`V26`) |
| Triển khai | Docker Compose (`db`, `backend`, `frontend`) |

---

## 1. Kiến trúc tổng quan

```mermaid
flowchart LR
  subgraph Client["Trình duyệt / PWA"]
    Pub["Trang công khai<br/>(public)"]
    Dash["Dashboard<br/>/dashboard/*"]
    SW["Service Worker<br/>(Web Push)"]
  end

  subgraph BE["Spring Boot · /api"]
    Filter["JwtAuthenticationFilter"]
    Ctrl["Controllers<br/>+ RoleGuard"]
    Svc["NotificationService<br/>PushService<br/>ActivityLogService"]
  end

  DB[("PostgreSQL 16")]
  Flyway["Flyway migrations"]
  Google["Google OAuth"]
  Gmail["Gmail API<br/>(gmail.send)"]
  PushSvc["Push service<br/>của trình duyệt"]

  Pub & Dash -->|"fetch + Bearer JWT"| Filter --> Ctrl --> Svc
  Ctrl -->|"JPA (ddl-auto=validate)"| DB
  Flyway --> DB
  Ctrl <-->|"đổi code / xác thực ID token"| Google
  Dash -->|"gửi mail hàng loạt bằng Gmail của chính thành viên"| Gmail
  Svc -->|"VAPID"| PushSvc --> SW
```

- **Không có SSR gọi API**: mọi lời gọi dữ liệu là `fetch` phía client tới `NEXT_PUBLIC_API_BASE_URL`.
- **Phân quyền nằm trong controller** qua `RoleGuard` (không dùng annotation method-security). Middleware Next.js chỉ chặn ở phía client.
- **Mọi thao tác ghi** (task, tài chính, sự kiện, …) được ghi lại vào `activity_logs` qua `ActivityLogService`.

---

## 2. Cấu trúc thư mục

```text
NEU-Debate-Club/
├── backend/                     # Spring Boot (Maven, mvnw)
│   ├── src/main/java/com/neudebateclub/backend/
│   │   ├── auth/                # Đăng nhập Google, JWT
│   │   ├── user/                # Thành viên (MemberController)
│   │   ├── task/                # Giao việc, tiến độ, bình luận
│   │   ├── event/               # Sự kiện, đăng ký, check-in/out QR
│   │   ├── finance/             # Thu chi (kể cả thu chi theo sự kiện)
│   │   ├── notification/        # Thông báo + Web Push
│   │   ├── permission/          # Ma trận ban → module (module_permissions)
│   │   ├── publication/         # Ấn phẩm / link tài liệu
│   │   ├── tenure/              # Nhiệm kỳ (seasons)
│   │   ├── activity/            # Nhật ký hoạt động
│   │   ├── cms/                 # Nội dung landing (draft → publish), dự án, thành tích
│   │   ├── common/              # enums, converters, ApiResponse, exceptions, RoleGuard
│   │   └── config/              # SecurityConfig, ...
│   ├── src/main/resources/db/migration/   # Flyway V1..V26
│   ├── dev-seed/                # Dữ liệu mẫu CHỈ dùng cho dev
│   └── Dockerfile
├── frontend/                    # Next.js
│   ├── src/app/(public)/        # Trang chủ, dự án, thành tích, các ban
│   ├── src/app/(dashboard)/dashboard/   # Các trang quản trị
│   ├── src/app/login, logout/
│   ├── src/components/dashboard/        # Màn hình dashboard
│   └── Dockerfile
├── docs/                        # Kiến trúc, master plan, tài liệu từng module
├── docker-compose.yml
├── DOCKER.md                    # Hướng dẫn chạy bằng Docker chi tiết
└── *.md                         # Tài liệu nghiệp vụ (nhu cầu, use case, roadmap)
```

---

## 3. Vai trò & phân quyền

| Vai trò | Mô tả |
|---|---|
| `BCN` | Ban chủ nhiệm — toàn quyền, cấu hình phân quyền module |
| `TRUONG_BAN` | Trưởng ban — dùng các module được BCN tick cho ban của mình, chỉ thao tác trong ban mình |
| `MEMBER` | Thành viên — xem task của mình, nhận thông báo, dùng nhóm **Công cụ** |
| `GUEST` | Tài khoản Google chưa có trong `users` — chỉ được đăng ký tham gia sự kiện, không vào được dashboard |

Các ban: `BCN`, `TRUYEN_THONG`, `DOI_NGOAI`, `NOI_DUNG`, `SU_KIEN`, `KY_THUAT`, `NHAN_SU`.

14 module (`AdminModule`): `TASK_ASSIGNMENT`, `NOTIFICATION_MANAGEMENT`, `DEPARTMENT_OPERATIONS`, `ANALYTICS`, `PUBLICATIONS`, `ASSET_LIBRARY`, `LANDING_CMS`, `FINANCE`, `EVENT_MANAGEMENT`, `MEMBERSHIP`, `TENURE`, `CROSS_DEPARTMENT_TASKS`, `ACTIVITY_LOG`, `HEALTH_DASHBOARD`.

```mermaid
flowchart TD
  Req["Request có JWT"] --> F{"JwtAuthenticationFilter:<br/>user tồn tại & active?"}
  F -- Không --> R401["401 Unauthorized"]
  F -- Có --> G{"RoleGuard trong controller"}
  G -->|"role = BCN"| OK["Cho phép"]
  G -->|"role = TRUONG_BAN"| M{"module_permissions:<br/>ban của user có được tick module này?"}
  M -- Có --> D{"Dữ liệu thuộc ban mình?"}
  D -- Có --> OK
  D -- Không --> R403["403 Forbidden"]
  M -- Không --> R403
  G -->|"role = MEMBER"| Own{"Chỉ dữ liệu của chính mình<br/>(task được giao, thông báo, công cụ)"}
  Own --> OK
  G -->|"role = GUEST"| R403
```

> Bảng `module_permissions` ban đầu **rỗng**; BCN tick quyền tại `/dashboard/roles`. Tick chỉ cấp quyền cho **trưởng ban** của ban đó, không cấp cho `MEMBER`.

---

## 4. Các quy trình nghiệp vụ chính

### 4.1. Đăng nhập Google

JWT không bao giờ xuất hiện trên URL: backend trả về một mã dùng một lần (sống 60 giây), trình duyệt đổi mã đó lấy JWT.

```mermaid
sequenceDiagram
  autonumber
  actor U as Người dùng
  participant FE as Frontend
  participant BE as Backend /api/auth
  participant G as Google OAuth
  participant DB as PostgreSQL

  U->>FE: Bấm "Đăng nhập" trên header
  FE->>BE: GET /google/authorize?returnUrl=...
  BE-->>U: Set cookie nonce + redirect sang Google (state ký, hạn 10 phút)
  U->>G: Chọn tài khoản Google
  G-->>BE: GET /google/callback?code&state
  BE->>BE: Kiểm tra state + nonce cookie
  BE->>G: Đổi code lấy ID token
  BE->>DB: Tìm user theo email
  alt Có trong users & active
    BE->>DB: Cập nhật full_name, avatar_url
    BE->>BE: Tạo JWT (role, department)
  else Không có
    BE->>BE: Tạo token GUEST (chỉ để đăng ký sự kiện)
  end
  BE-->>FE: Redirect returnUrl?authCode=...&loginSuccess=true
  FE->>BE: POST /google/exchange {code}
  BE-->>FE: JWT + thông tin user
  FE->>FE: Lưu localStorage (ndc_token, ndc_user)
  FE->>BE: GET /auth/modules → hiển thị sidebar theo quyền
```

### 4.2. Giao việc & theo dõi tiến độ

Quy tắc hiển thị: thành viên chỉ thấy task được giao cho mình; trưởng ban xem/sửa/xoá task trong ban mình; BCN xem tất cả; chỉ BCN giao việc cho **tất cả các ban**.

```mermaid
flowchart LR
  A["BCN / Trưởng ban<br/>tạo task<br/>(/dashboard/tasks/assign)"] --> B["POST /tasks"]
  B --> C["Lưu task + activity log"]
  C --> N["NotificationService.notifyTaskAssigned<br/>→ thông báo TASK_ASSIGNED"]
  N --> P["Web Push tới thiết bị người được giao"]
  P --> M["Thành viên mở<br/>/dashboard/tasks/todo-list"]
  M --> S["PATCH /tasks/{id}/status<br/>PATCH /tasks/{id}/progress"]
  S --> L["Activity log<br/>(STATUS_CHANGE / PROGRESS_UPDATE)"]
  M --> CM["Bình luận<br/>/tasks/{id}/comments"]
```

```mermaid
stateDiagram-v2
  [*] --> TODO
  TODO --> IN_PROGRESS
  IN_PROGRESS --> BLOCKED
  BLOCKED --> IN_PROGRESS
  IN_PROGRESS --> DONE
  TODO --> CANCELLED
  IN_PROGRESS --> CANCELLED
  DONE --> [*]
  CANCELLED --> [*]
```

> ⚠️ `BLOCKED`, `CANCELLED` và độ ưu tiên `URGENT` đã có trong Java nhưng **chưa có trong enum PostgreSQL** — hiện bị lưu thành `todo` / `high`. Cần migration mở rộng enum (dự kiến `V27`).

### 4.3. Thông báo & Web Push

```mermaid
flowchart TD
  subgraph Nguon["Nguồn thông báo"]
    T["Tạo task<br/>(tự động, TASK_ASSIGNED)"]
    Man["Gửi thủ công<br/>/dashboard/notifications/create"]
    Cms["Nút 'Gửi thông báo đẩy'<br/>trong CMS (mục announcement)"]
  end

  Man --> Who{"Người gửi"}
  Who -->|"BCN"| A1["Tất cả / theo ban / từng thành viên"]
  Who -->|"Trưởng ban"| A2["Ban mình / thành viên ban mình"]

  T --> Save["Lưu bảng notifications<br/>(GENERAL, TASK_UPDATE, REWARD, URGENT, TASK_ASSIGNED)"]
  A1 --> Save
  A2 --> Save
  Save --> Push["PushService → thiết bị đã đăng ký của người nhận"]
  Cms --> PushAll["PushService → MỌI thiết bị đã đăng ký<br/>(kể cả khách vãng lai)"]
  Push & PushAll --> SW["Service Worker hiển thị thông báo<br/>(kể cả khi đã đóng web)"]
  Save --> Bell["Chuông dashboard: poll 60s,<br/>5 thông báo mới nhất + 'Xem tất cả'"]
```

Không có trạng thái đã đọc/chưa đọc, ghim, đính kèm hay hẹn giờ (phạm vi v1).

### 4.4. Đăng ký sự kiện & check-in QR

```mermaid
sequenceDiagram
  autonumber
  actor V as Khách / Thành viên
  actor O as Ban tổ chức
  participant FE as Frontend
  participant BE as Backend
  participant DB as PostgreSQL
  participant GM as Gmail API

  Note over FE: CMS mục "announcement" chọn eventId
  V->>FE: Mở popup chuông trên trang chủ → "Đăng ký tham gia"
  FE->>FE: Chưa đăng nhập → đăng nhập Google (có thể là GUEST)
  FE->>BE: POST /public/events/{eventId}/registrations
  BE->>DB: Lưu event_attendees (email, họ tên Google)
  Note over V: QR KHÔNG hiển thị trên thiết bị người đăng ký

  O->>FE: Công cụ → Gửi mail (/dashboard/tools/mail)
  FE->>BE: GET /events/{eventId}/attendees
  FE->>GM: Gửi mail từ Gmail của chính người tổ chức,<br/>tự đính kèm QR (nội dung = id đăng ký)
  GM-->>V: Email kèm mã QR

  V->>O: Xuất trình QR tại sự kiện
  O->>FE: Công cụ → Check-in (/dashboard/tools/checkin), quét camera
  FE->>BE: POST /events/{eventId}/attendees/{id}/check-in
  Note over O,BE: Khi ra về: cùng QR → /check-out
```

### 4.5. Quản lý nội dung trang chủ (CMS)

```mermaid
flowchart LR
  E["Trưởng ban+ sửa section<br/>/dashboard/cms"] --> D["PUT /cms/landing/{section}/draft<br/>→ bản DRAFT trong landing_content_versions"]
  D --> Pv["Xem lại / sửa tiếp"]
  Pv --> P["POST /cms/landing/{section}/publish"]
  P --> Live["landing_content (PUBLISHED)"]
  Live --> Pub["GET /public/landing → trang chủ"]
  P --> H["Lịch sử phiên bản<br/>GET /cms/landing/{section}/history"]
```

Dự án và thành tích là catalog riêng (`/cms/landing/catalog/{type}`), hiển thị công khai ở `/projects` và `/achievements`.

### 4.6. Tài chính sự kiện

Thu/chi của sự kiện là các dòng `transactions` bình thường có `event_id`. Quản lý module `EVENT_MANAGEMENT` chỉ xem/thêm/xoá giao dịch gắn sự kiện; quản lý `FINANCE` xem tất cả. `events.budget` là dự toán: cảnh báo khi chi ≥ 80%, vượt khi > 100%.

---

## 5. Vòng đời một request

```mermaid
sequenceDiagram
  participant C as Client component
  participant J as JwtAuthenticationFilter
  participant Ctl as Controller
  participant RG as RoleGuard
  participant R as Repository
  participant AL as ActivityLogService
  participant EH as GlobalExceptionHandler

  C->>J: fetch /api/... (Authorization: Bearer)
  J->>J: Giải mã JWT, nạp lại user từ DB
  J->>Ctl: UserPrincipal (@CurrentUser)
  Ctl->>RG: requireXxx(user, module)
  alt Không đủ quyền
    RG-->>EH: ForbiddenException
    EH-->>C: 403 ApiResponse
  else Đủ quyền
    Ctl->>R: Đọc / ghi (JPA)
    Ctl->>AL: record(...) nếu là thao tác ghi
    Ctl-->>C: 200 ApiResponse { success, message, data, timestamp }
  end
```

---

## 6. Cài đặt & chạy

### 6.1. Chạy bằng Docker (khuyến nghị)

Yêu cầu: Docker Desktop + Docker Compose v2. Chi tiết xem [DOCKER.md](DOCKER.md).

```powershell
if (!(Test-Path .env)) { Copy-Item .env.docker.example .env }
# Điền POSTGRES_PASSWORD, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (+ VAPID_* nếu cần push)
docker compose up -d --build --wait --wait-timeout 180
```

| Dịch vụ | URL |
|---|---|
| Website | http://localhost:3000 |
| API health | http://localhost:8080/api/actuator/health |
| Swagger UI | http://localhost:8080/api/swagger-ui/index.html |
| PostgreSQL | localhost:5432 |

### 6.2. Chạy trực tiếp (dev)

Yêu cầu: JDK 21, Node.js + pnpm, PostgreSQL 16 đang chạy.

```powershell
# Backend
Copy-Item backend/.env.example backend/.env   # sửa DATABASE_*, JWT_SECRET, GOOGLE_*
cd backend; .\mvnw.cmd spring-boot:run        # Flyway tự chạy migration khi khởi động

# Frontend (terminal khác, ở thư mục gốc)
Copy-Item frontend/.env.example frontend/.env
pnpm install --dir frontend
pnpm dev:fe                                   # http://localhost:3000
```

### 6.3. Biến môi trường chính

| Biến | Dùng cho |
|---|---|
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Kết nối PostgreSQL (chạy trực tiếp) |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Docker Compose |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | Ký JWT (mặc định 7 ngày) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Đăng nhập Google — thêm `http://localhost:3000` vào Authorized JavaScript origins |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID phía trình duyệt (đăng nhập + Gmail API gửi mail) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push — tạo bằng `npx web-push generate-vapid-keys`; để trống = tắt push |
| `CORS_ALLOWED_ORIGINS` | Origin frontend được phép gọi API |
| `NEXT_PUBLIC_API_BASE_URL` | URL API, **nhúng lúc build** frontend (đổi thì phải build lại) |

### 6.4. Dữ liệu mẫu (chỉ dev)

```powershell
Get-Content -Raw -Encoding UTF8 backend/dev-seed/dashboard-sample-data.sql | docker exec -i ndc_db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Không bao giờ chạy lên database dùng chung / production.

---

## 7. Quy trình phát triển

```mermaid
flowchart LR
  I["Nhận yêu cầu /<br/>đọc docs/master-plan.md"] --> Br["Tạo nhánh từ main"]
  Br --> DBc{"Đổi schema?"}
  DBc -- Có --> Mig["Thêm file Flyway mới<br/>V{n+1}__mo_ta.sql<br/>(KHÔNG sửa migration cũ)"]
  DBc -- Không --> Code
  Mig --> Code["Code backend + frontend"]
  Code --> T["Test:<br/>mvnw test · tsc --noEmit · pnpm lint"]
  T --> Run["Chạy thử local / Docker"]
  Run --> PR["Commit + Pull Request"]
  PR --> Rv["Review"] --> Merge["Merge vào main"]
```

Quy ước:

- **Migration**: luôn thêm file mới, không sửa file đã chạy (Flyway sẽ báo lệch checksum). Dữ liệu mẫu đặt trong `backend/dev-seed/`, không đưa vào Flyway.
- **Hợp đồng API**: OpenAPI do springdoc sinh từ Java là nguồn chuẩn (xem Swagger UI).
- **Phản hồi API**: bọc trong `ApiResponse<T>`; lỗi ném `ForbiddenException`, `ResourceNotFoundException`, `ValidationException`, `UnauthorizedException`.
- **Phân quyền**: gọi `RoleGuard` ngay đầu mỗi endpoint; không dựa vào chặn ở frontend.
- **Thao tác ghi**: ghi `ActivityLogService.record(...)`.

### Lệnh kiểm tra

| Việc | Lệnh |
|---|---|
| Unit test backend (không cần DB) | `cd backend; .\mvnw.cmd test "-Dtest=*ControllerTest,*ServiceTest,RoleGuardTest"` |
| Toàn bộ test backend | `cd backend; .\mvnw.cmd test` — ⚠️ `BackendApplicationTests` chạy Flyway lên DB đã cấu hình, chỉ dùng DB tạm |
| Type-check frontend | `frontend\node_modules\.bin\tsc --noEmit -p frontend\tsconfig.json` |
| Lint frontend | `pnpm --dir frontend lint` |
| Build frontend | `pnpm --dir frontend build` |

---

## 8. Tài liệu liên quan

- [docs/architecture.md](docs/architecture.md) — kiến trúc chi tiết, cấu hình, rủi ro đã biết
- [docs/master-plan.md](docs/master-plan.md) — kế hoạch & quyết định của chủ dự án
- [docs/modules/](docs/modules/) — tài liệu từng module (auth, tasks, events, notifications, CMS, phân quyền, migration)
- [DOCKER.md](DOCKER.md) — chạy bằng Docker, logs, khôi phục
- [USE_CASES_HE_THONG_CLB_NEU.md](USE_CASES_HE_THONG_CLB_NEU.md), [NHU_CAU_VA_GIAI_PHAP_WEBSITE_CLB_NEU.md](NHU_CAU_VA_GIAI_PHAP_WEBSITE_CLB_NEU.md) — nghiệp vụ (một số điểm đã lỗi thời so với code)
