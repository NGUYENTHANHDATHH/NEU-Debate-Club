# Deploy NEU Debate Club lên DigitalOcean (credit sinh viên)

## Context

CLB muốn đưa web vào dùng thật. Hướng đã chọn: một droplet DigitalOcean trả bằng credit của GitHub Student Developer Pack, chạy lại `docker-compose.yml` sẵn có, thêm Caddy để có HTTPS.

Code hiện tại có 3 vấn đề phải sửa trước khi đưa người dùng thật vào:
1. **Seed mẫu chạy trên production.** Flyway chạy `V18__seed_sample_members.sql` (50 thành viên giả) và `V20__seed_sample_events.sql` (10 sự kiện giả; file này còn tự tạo BCN nếu chưa có) ở mọi môi trường.
   - `V12` tạo tài khoản BCN cố định `0000…0001` (`datnt.ndc.neu@gmail.com`). Bạn đã quyết định tài khoản này không được hoạt động trên production.
   - Tuy vậy, dòng user này không xoá được: nó là `updated_by` (khoá ngoại, `ON DELETE RESTRICT`) của nội dung landing seed ở V10/V12, và nội dung landing đó là nội dung thật.
2. **URL callback Google sai khi chạy sau proxy.** `getCallbackUrl` ([AuthController.java:77](backend/src/main/java/com/neudebateclub/backend/auth/AuthController.java#L77)) dựng URL từ `request.getScheme()` và `getServerName()`. Sau Caddy, giá trị này thành `http://backend:8080/...`, nên Google báo `redirect_uri_mismatch`.
3. **Cấu hình chưa hợp với production.** Port DB/backend/frontend đang mở ra ngoài; log ở mức DEBUG; Swagger công khai; actuator mở `mappings` và `metrics`; `baseline-on-migrate` có thể bỏ qua V1–V12.

## Hướng giải quyết

Một domain duy nhất: Caddy chuyển `https://DOMAIN/api/*` sang backend (context-path đã là `/api`, không cần cắt path), mọi request khác sang frontend. Cách này không phát sinh CORS khác domain, chỉ cần một chứng chỉ, và redirect URI là `https://DOMAIN/api/auth/google/callback`.

### 1. Tách seed mẫu khỏi production (không đổi checksum)

- `git mv` hai file `V18__seed_sample_members.sql` và `V20__seed_sample_events.sql` từ `backend/src/main/resources/db/migration/` sang `backend/src/main/resources/db/seed/`. Nội dung và tên file giữ nguyên, nên checksum của DB dev cũ không đổi.
- [application.yml](backend/src/main/resources/application.yml): `spring.flyway.locations: classpath:db/migration,classpath:db/seed`. Dev, Docker local và test chạy y như cũ.
- [CREATE_NEU_DEBATE_CLUB.sql](backend/src/main/resources/db/CREATE_NEU_DEBATE_CLUB.sql): sửa 2 dòng `\ir` (dòng 25 và 27) trỏ sang `seed/`.
- Tài khoản BCN của V12 vẫn được tạo (vì khoá ngoại), nhưng sẽ bị **vô hiệu hoá** bằng một lệnh SQL trong runbook (bước 7 ở phần 5). Không phải viết code mới.

### 2. Profile `prod` (file mới [application-prod.yml](backend/src/main/resources/application-prod.yml))

```yaml
spring:
  flyway:
    locations: classpath:db/migration   # list bị thay hẳn → không có seed mẫu
    baseline-on-migrate: false          # DB lạ không bao giờ bị đánh dấu V12 rồi bỏ qua V1–V12
server:
  forward-headers-strategy: framework   # tin X-Forwarded-* từ Caddy → callback https://DOMAIN/api/...
management:
  endpoints.web.exposure.include: health
springdoc:
  api-docs.enabled: false
  swagger-ui.enabled: false
logging.level:
  com.neudebateclub: INFO
  org.springframework.security: WARN
```

`forward-headers-strategy` chỉ được bật trong `prod`, vì ở đó backend không mở port ra ngoài, chỉ Caddy gọi được tới nó. Dev giữ nguyên.

### 3. Compose cho production (2 file mới ở thư mục gốc)

**`docker-compose.prod.yml`**, dùng kèm `docker-compose.yml`:
- `db`, `backend`, `frontend`: `ports: !reset []` để đóng port 5432/8080/3000 ra internet (Compose v2.24+ hỗ trợ `!reset`).
- Service `caddy`:
  - Image `caddy:2.10-alpine` (ghim đúng version), `restart: unless-stopped`.
  - Port `80`, `443`, `443/udp`.
  - `DOMAIN: ${DOMAIN:?Set DOMAIN}`.
  - Mount `./Caddyfile:/etc/caddy/Caddyfile:ro` và volume `caddy_data:/data` (giữ chứng chỉ qua các lần khởi động lại).
- Đổi tên volume DB: `postgres_data: { name: ndc_prod_postgres_data }`, để profile `prod` không bao giờ chạy nhầm lên volume dev `ndc_postgres_data`. Volume dev đã ghi nhận V18/V20, nên nếu chạy `prod` lên đó thì Flyway validate sẽ lỗi.

**`Caddyfile`**:
```
{$DOMAIN} {
	encode zstd gzip
	handle /api/* {
		reverse_proxy backend:8080
	}
	handle {
		reverse_proxy frontend:3000
	}
}
```

[.env.docker.example](.env.docker.example): thêm khối ghi chú "Production" gồm `DOMAIN=`, `SPRING_PROFILES_ACTIVE=prod`, `CORS_ALLOWED_ORIGINS=https://DOMAIN` và `NEXT_PUBLIC_API_BASE_URL=https://DOMAIN/api`.

### 4. Tài liệu

- **`DEPLOY.md`** (mới): runbook ở phần 5 bên dưới.
- [README.md](README.md) mục 6: thêm một dòng "Deploy production → DEPLOY.md".
- [docs/modules/database-migrations.md](docs/modules/database-migrations.md): một đoạn giải thích `db/seed` chỉ chạy ngoài profile `prod`.

## 5. Runbook trong DEPLOY.md

1. **Lấy credit**: kích hoạt GitHub Student Developer Pack, nhận offer DigitalOcean.
2. **Tạo droplet**: Ubuntu 24.04, vùng **Singapore (SGP1)**, gói Basic 2 GB / 1 vCPU, đăng nhập bằng SSH key, **bật Backups** của DigitalOcean (snapshot do DO lưu tách khỏi droplet; phí trừ vào credit).
3. **Domain**: tạo bản ghi A trỏ về IP droplet. Chưa có domain thì tạm dùng `<IP>.sslip.io`, Caddy vẫn cấp được HTTPS. Pack sinh viên có kèm domain miễn phí 1 năm, cần kiểm tra lại.
4. **Chuẩn bị server**:
   - `apt update && apt upgrade`.
   - Cài Docker theo hướng dẫn chính thức.
   - `ufw allow OpenSSH,80,443/tcp,443/udp && ufw enable`.
   - Tạo **2 GB swap**, vì `next build` có thể hết RAM trên máy 2 GB.
5. **Code và `.env`**:
   - `git clone`, rồi `cp .env.docker.example .env`.
   - Điền mật khẩu DB, `JWT_SECRET` (`openssl rand -base64 32`), `VAPID_*` (`npx web-push generate-vapid-keys`), `VAPID_SUBJECT` là email thật của CLB, `GOOGLE_*`, cùng các biến của khối Production.
6. **Google Cloud Console**:
   - Authorized JavaScript origin: `https://DOMAIN`.
   - Redirect URI: `https://DOMAIN/api/auth/google/callback`.
   - Chuyển OAuth consent screen sang "In production".
   - Lưu ý: scope `gmail.send` của công cụ gửi mail là scope nhạy cảm. Khi app chưa được Google xác minh, người dùng công cụ này sẽ thấy cảnh báo.
7. **Chạy**: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait --wait-timeout 300`.
8. **Tạo BCN thật và tắt tài khoản cố định** (chạy một lần):
   ```sql
   INSERT INTO users (email, full_name, role, department, is_active)
   VALUES ('<email-bcn-that>', '<Họ tên>', 'bcn', 'bcn', true);
   UPDATE users SET is_active = false WHERE id = '00000000-0000-0000-0000-000000000001';
   ```
   Chạy qua `docker exec -i ndc_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"`.
9. **Backup**:
   - Cron chạy hằng ngày lúc 3h: `docker exec ndc_db pg_dump -Fc ... > /root/backups/ndc-$(date +%F).dump`, kèm `find /root/backups -mtime +7 -delete`.
   - Ghi kèm lệnh khôi phục bằng `pg_restore`.
   - Bản sao ngoài máy là snapshot Backups của DigitalOcean.
10. **Cập nhật phiên bản**: `git pull`, rồi chạy lại lệnh ở bước 7. Nếu đổi `NEXT_PUBLIC_*` thì phải build lại frontend.

## Bỏ qua (chưa ai yêu cầu)

CI/CD tự deploy khi push, giám sát/uptime alert, nhiều instance, CDN, upload ảnh (đã bàn riêng: dùng Supabase Storage).

## Kiểm tra

1. **Dev không bị ảnh hưởng**: khởi động lại stack dev với volume cũ (`docker compose up -d --build --wait`). Backend phải lên (Flyway validate pass, V18/V20 resolve từ `db/seed` với cùng checksum), dashboard vẫn có 50 thành viên mẫu.
2. **Test backend**: `cd backend; .\mvnw.cmd test "-Dtest=*ControllerTest,*ServiceTest,RoleGuardTest"`.
3. **Thử profile prod ở máy local** (dừng stack dev trước, vì `container_name` trùng):
   - Chạy `DOMAIN=localhost` với `SPRING_PROFILES_ACTIVE=prod` bằng cả hai file compose. Volume mới `ndc_prod_postgres_data` được tạo.
   - Kiểm tra:
     - `https://localhost/api/actuator/health` trả `UP` (Caddy dùng chứng chỉ local).
     - `select count(*) from users` bằng 1 (chỉ có tài khoản V12) và `select count(*) from events` bằng 0.
     - `https://localhost/api/swagger-ui/index.html` trả 404.
     - Port 5432/8080/3000 không còn mở (`docker compose ps`).
   - Dọn dẹp: `docker compose -f ... down`, rồi `docker volume rm ndc_prod_postgres_data`.
4. **Trên droplet**: đăng nhập Google bằng email BCN thật. Callback phải về `https://DOMAIN/api/auth/google/callback` (không lỗi `redirect_uri_mismatch`). Kiểm tra thêm: tạo task thì có push tới thiết bị đã đăng ký; trang chủ có HTTPS hợp lệ; trên điện thoại cài được PWA.
