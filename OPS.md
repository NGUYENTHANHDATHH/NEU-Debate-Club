# Vận hành server production

Sổ tay cho người quản lý website `https://neudebateclub.id.vn`.
- [DEPLOY.md](DEPLOY.md): dựng server từ đầu, chỉ làm một lần.
- File này: các việc làm thường xuyên và cách xử lý sự cố.

## 1. Bức tranh tổng thể

```
Người dùng ──HTTPS──▶ Lightsail "ndc-prod" (Ubuntu 24.04, 2 GB, Sydney) — IP 52.64.239.220
                       └─ Docker Compose, project "ndc", thư mục ~/ndc
                          ├─ ndc_caddy     cổng 80/443, tự gia hạn HTTPS; /api/* → backend, còn lại → frontend
                          ├─ ndc_frontend  Next.js :3000   (chỉ trong mạng Docker)
                          ├─ ndc_backend   Spring Boot :8080, profile prod (chỉ trong mạng Docker)
                          └─ ndc_db        PostgreSQL 16, volume ndc_prod_postgres_data
GitHub push main ──▶ Actions: test + kiểm tra migration ──▶ SSH ──▶ git pull + scripts/deploy.sh
```

| Ở đâu | Cái gì |
|---|---|
| Máy bạn: `~/.ssh/ndc-prod.pem` | Khoá SSH chính của user `ubuntu`. **Mất khoá là mất quyền SSH** (xem 2.4) |
| Máy bạn: `~/.ssh/ndc-deploy` | Khoá chỉ dùng cho GitHub Actions. Bản sao nằm trong GitHub Secrets |
| Server: `~/ndc` | Code, clone từ GitHub. **Không sửa code ở đây** |
| Server: `~/ndc/.env` | Mật khẩu DB, JWT, Google, PayOS, VAPID. Quyền `600`, không nằm trong git |
| Server: `~/ndc-backup.sh`, `~/backups/` | Backup database hằng ngày, giữ 7 ngày |
| Server: `~/.ssh/authorized_keys` | Danh sách khoá được phép SSH vào server |
| AWS Lightsail | Máy chủ, IP tĩnh `ndc-ip`, firewall, snapshot tự động lúc 20:00 UTC |
| Vinahost | DNS: A `@` và CNAME `www` trỏ về IP tĩnh |

Đồng hồ server dùng giờ **UTC**, chậm hơn giờ Việt Nam 7 tiếng. Giờ trong log đều là UTC.

## 2. SSH vào server

### 2.1. Lần đầu: tạo tên tắt `ndc` trên máy bạn

Thêm đoạn sau vào `C:\Users\<bạn>\.ssh\config` (chưa có file thì tạo mới, không đặt đuôi file):

```
Host ndc
    HostName 52.64.239.220
    User ubuntu
    IdentityFile ~/.ssh/ndc-prod.pem
    ServerAliveInterval 30
```

Từ giờ, chỉ cần gõ trong PowerShell hoặc Git Bash:

```sh
ssh ndc                          # vào shell của server
ssh ndc "docker ps"              # chạy một lệnh rồi thoát luôn (lệnh tắt dc chỉ dùng được sau khi đã vào shell)
scp ndc:backups/ndc-2026-11-24.dump .     # tải file từ server về máy
scp ./file.txt ndc:/tmp/                  # gửi file từ máy lên server
```

**Dùng VS Code:** cài extension *Remote - SSH*, bấm F1, chọn `Remote-SSH: Connect to Host…`, chọn `ndc`. Sau đó có thể sửa `~/ndc/.env` ngay trong VS Code.

### 2.2. Thoát và giữ phiên làm việc

- Thoát: gõ `exit` hoặc bấm `Ctrl+D`.
- Với lệnh chạy lâu (build, restore): chạy trong `tmux`. Bắt đầu bằng `tmux new -s work`. Rời khỏi tmux bằng `Ctrl+B` rồi `D`, lệnh vẫn chạy tiếp. Quay lại bằng `tmux attach -t work`. Nhờ vậy, rớt mạng cũng không làm dừng lệnh.

### 2.3. Lệnh tắt đã cài trên server (trong `~/.bashrc`)

| Lệnh tắt | Tương đương |
|---|---|
| `dc …` | `docker compose -f ~/ndc/docker-compose.yml -f ~/ndc/docker-compose.prod.yml …`. Chạy được ở bất kỳ thư mục nào |
| `ndc-psql` | Mở `psql` vào database production |

**Luôn dùng `dc`, không gõ `docker compose` trơn.** Thiếu file `docker-compose.prod.yml` thì Compose sẽ mở cổng DB ra ngoài và gắn sai volume.

### 2.4. Mất khoá hoặc không SSH được

1. Vào Lightsail console → `ndc-prod` → **Connect using SSH**. Cách này đăng nhập qua trình duyệt, không cần khoá của bạn.
2. Tạo khoá mới trên máy bạn: `ssh-keygen -t ed25519 -f ~/.ssh/ndc-new`.
3. Trong cửa sổ SSH trên trình duyệt, thêm nội dung file `~/.ssh/ndc-new.pub` vào cuối `~/.ssh/authorized_keys`.
4. Đổi `IdentityFile` trong `~/.ssh/config` sang khoá mới.

Nếu SSH báo `Connection timed out`, kiểm tra Lightsail → Networking xem cổng 22 còn mở không.

## 3. Kiểm tra sức khoẻ hệ thống

```sh
dc ps                                   # 4 container, cột STATUS phải có "healthy"
curl -s https://neudebateclub.id.vn/api/actuator/health     # {"status":"UP"}
docker stats --no-stream                # CPU/RAM từng container
free -h                                 # RAM và swap. Swap dùng nhiều kéo dài = máy thiếu RAM
df -h /                                 # ổ đĩa. Trên 80% thì dọn (mục 9)
uptime                                  # tải máy. load average > 2 kéo dài = quá tải với 2 vCPU
```

## 4. Xem log

```sh
dc logs -f --tail=100 backend           # theo dõi log backend trực tiếp, Ctrl+C để thoát
dc logs --since=1h frontend             # log 1 giờ qua
dc logs --tail=50 caddy                 # lỗi HTTPS, chứng chỉ, proxy
dc logs backend | grep -E "ERROR|Exception" | tail -30     # chỉ lấy dòng lỗi
cat ~/backups/backup.log                # lỗi của backup hằng ngày (trống = ổn)
```

Tên service trong `dc` là `db`, `backend`, `frontend`, `caddy`. Tên container có thêm tiền tố `ndc_`, ví dụ `ndc_backend`.

## 5. Deploy

### 5.1. Bình thường: push là xong

Push lên `main`, GitHub Actions tự chạy 3 bước:
1. Test backend.
2. Khởi động backend thử trên một database trống, để kiểm tra migration.
3. SSH vào server, chạy `git pull` rồi `scripts/deploy.sh`.

Commit chỉ sửa `*.md` hoặc `docs/` thì không deploy. Theo dõi tiến trình ở tab **Actions** trên GitHub. Muốn chạy lại mà không cần push: Actions → Deploy → **Run workflow**.

Nếu workflow báo đỏ:
- Đỏ ở bước **test** hoặc **Migration check**: server chưa bị đụng tới. Sửa code rồi push lại.
- Đỏ ở bước **Deploy qua SSH**: đọc log của bước đó. Thường gặp:
  - `git pull` lỗi vì ai đó đã sửa file trong `~/ndc` trên server. Chạy `cd ~/ndc && git status` để xem.
  - Build hết RAM.

### 5.2. Deploy bằng tay (khi Actions hỏng)

```sh
ssh ndc
cd ~/ndc && git pull --ff-only && sh scripts/deploy.sh
```

### 5.3. Quay về bản cũ (rollback)

**Cách chuẩn:** trên máy bạn chạy `git revert <commit-lỗi>`, rồi `git push`. CI sẽ deploy bản đã gỡ lỗi.

**Khẩn cấp:** web đang sập và chờ CI quá lâu.

```sh
ssh ndc
cd ~/ndc && git log --oneline -5             # chọn commit tốt gần nhất
git reset --hard <commit-tốt> && sh scripts/deploy.sh
```

Sau đó vẫn phải sửa hoặc revert trên `main` và push. Lần deploy kế tiếp sẽ tự `pull` lên bản mới.

**Không rollback được migration DB.** Flyway chỉ chạy tiến. Nếu migration đã đổi dữ liệu, xem mục 7.3.

### 5.4. Khởi động lại, tắt, bật

```sh
dc restart backend          # khởi động lại 1 service, không build lại
dc up -d                    # tạo lại container nếu cấu hình hoặc .env đã đổi (không build)
dc stop / dc start          # tạm tắt / bật lại toàn bộ
sudo reboot                 # khởi động lại máy. Container tự lên lại (restart: unless-stopped)
```

**Không bao giờ chạy `dc down -v` hay `docker volume rm`.** Chữ `-v` xoá volume, tức **xoá toàn bộ database production**. `dc down` không có `-v` thì an toàn: dữ liệu còn nguyên, bật lại bằng `dc up -d`.

## 6. Sửa cấu hình (`.env`)

```sh
ssh ndc
nano ~/ndc/.env             # Ctrl+O, Enter để lưu; Ctrl+X để thoát
dc up -d                    # tạo lại các container có biến bị đổi
```

- Đổi biến `NEXT_PUBLIC_*` thì phải build lại frontend: `dc up -d --build frontend`. Các biến này được nhúng vào frontend lúc build.
- Đổi `JWT_SECRET` thì tất cả mọi người bị đăng xuất. Chỉ đổi khi nghi bị lộ.
- **Không đổi `POSTGRES_PASSWORD` trong `.env`** khi database đã có dữ liệu. Postgres chỉ đọc biến này lúc tạo database lần đầu. Đổi ở đây thì backend sẽ không đăng nhập được vào DB. Muốn đổi mật khẩu, chạy `ALTER USER ndc_user PASSWORD '…';` trong `ndc-psql` trước, rồi mới sửa `.env`.
- Trước khi sửa, nên sao lưu: `cp ~/ndc/.env ~/ndc/.env.bak-$(date +%F)`.

## 7. Database

### 7.1. Truy vấn

```sh
ndc-psql                                    # vào psql. Thoát: \q
```

```sql
\dt                                          -- danh sách bảng
\d users                                     -- cấu trúc bảng users
SELECT email, role, department, is_active FROM users ORDER BY created_at DESC LIMIT 20;
SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
```

Trước khi chạy `UPDATE` hoặc `DELETE`, gõ `BEGIN;`, chạy lệnh, rồi xem số dòng bị ảnh hưởng:
- Đúng như mong đợi thì `COMMIT;`.
- Sai thì `ROLLBACK;` để hoàn tác.

### 7.2. Backup

- **Tự động:** 3h sáng giờ Việt Nam mỗi ngày, ghi ra `~/backups/ndc-YYYY-MM-DD.dump`, giữ 7 ngày. Lightsail chụp thêm snapshot cả máy, cũng giữ 7 ngày.
- **Backup ngay** (bắt buộc trước migration xoá hoặc đổi dữ liệu, hoặc trước khi sửa tay): `~/ndc-backup.sh`. File cùng ngày sẽ bị ghi đè.
- **Bản sao ngoài AWS:** khoảng mỗi tháng một lần, tải một bản về máy: `scp ndc:backups/ndc-YYYY-MM-DD.dump .`.

### 7.3. Khôi phục

```sh
ls -lh ~/backups/
dc stop backend                              # không cho ghi vào DB trong lúc khôi phục
docker exec -i ndc_db sh -c 'pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < ~/backups/ndc-YYYY-MM-DD.dump
dc start backend
```

Lệnh này ghi đè toàn bộ dữ liệu bằng nội dung bản dump. Mọi thay đổi sau thời điểm backup sẽ mất. Muốn thử trước, khôi phục vào một database tạm:

```sh
docker exec ndc_db sh -c 'createdb -U "$POSTGRES_USER" restore_test'
docker exec -i ndc_db sh -c 'pg_restore -U "$POSTGRES_USER" -d restore_test' < ~/backups/ndc-YYYY-MM-DD.dump
docker exec ndc_db sh -c 'dropdb -U "$POSTGRES_USER" restore_test'           # dọn sau khi xem xong
```

### 7.4. Đổi cấu trúc DB (migration)

Đổi cấu trúc DB thì viết file mới `backend/src/main/resources/db/migration/V<số tiếp theo>__mo_ta.sql`, rồi push. CI sẽ chạy thử, sau đó deploy, và backend chạy Flyway khi khởi động. Quy tắc:
- Không sửa file V cũ.
- Sửa entity thì phải kèm migration.
- Dữ liệu mẫu để trong `db/seed/`, prod không chạy.

Chi tiết xem [docs/modules/database-migrations.md](docs/modules/database-migrations.md).

## 8. HTTPS và tên miền

- Caddy tự xin và tự gia hạn chứng chỉ Let's Encrypt, không cần làm gì. Chứng chỉ lưu trong volume `ndc_caddy_data`.
- Kiểm tra ngày hết hạn: `curl -vI https://neudebateclub.id.vn 2>&1 | grep -i "expire"`.
- **Sửa `Caddyfile`** và push xong thì deploy không tự áp dụng file mới. Sau khi deploy, chạy thêm `dc restart caddy`.
- Đổi IP, ví dụ khôi phục máy từ snapshot (mục 10.2): sửa bản ghi A ở Vinahost, đổi secret `DEPLOY_HOST` và `DEPLOY_KNOWN_HOSTS` trên GitHub.

## 9. Bảo trì định kỳ

### Hằng tuần (5 phút)

```sh
ssh ndc
dc ps && df -h / && free -h
ls -lh ~/backups/ && cat ~/backups/backup.log      # có đủ 7 file gần nhất, log trống
```

### Hằng tháng

```sh
sudo apt update && sudo apt -y upgrade              # Ubuntu đã tự cài bản vá bảo mật, đây là phần còn lại
[ -f /var/run/reboot-required ] && sudo reboot      # web gián đoạn khoảng 1 phút
docker system df                                    # dung lượng Docker đang dùng
docker builder prune -f                             # xoá build cache. Mỗi lần deploy cache tăng thêm vài trăm MB
docker image prune -f                               # xoá image không còn dùng
```

Lần build ngay sau khi xoá cache sẽ chậm hơn bình thường.

**Không chạy `docker system prune --volumes`.** Lệnh đó có thể xoá cả volume database.

### Một lần: giới hạn dung lượng log Docker

Log container hiện không bị giới hạn và sẽ đầy ổ đĩa sau vài tháng. Làm như sau:

```sh
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker          # các container tự lên lại; web gián đoạn khoảng 1 phút
dc up -d --force-recreate              # giới hạn chỉ áp dụng cho container tạo mới
```

## 10. AWS và Lightsail

Các lệnh `aws` chạy trên **máy bạn**. Phiên đăng nhập hết hạn thì chạy lại `aws login`.

### 10.1. Xem nhanh

```sh
aws lightsail get-instance-state --region ap-southeast-2 --instance-name ndc-prod
aws lightsail get-auto-snapshots --region ap-southeast-2 --resource-name ndc-prod
aws lightsail get-instance-metric-data --region ap-southeast-2 --instance-name ndc-prod \
  --metric-name CPUUtilization --period 3600 --unit Percent --statistics Average \
  --start-time $(date -u -d '-1 day' +%FT%TZ) --end-time $(date -u +%FT%TZ)
aws freetier get-account-plan-state      # credit còn lại, ngày hết hạn gói Free
```

Lệnh `date -d` trong ví dụ trên chạy được trong Git Bash, không chạy được trong PowerShell.

Lightsail console cũng có biểu đồ CPU, mạng và các lần snapshot, không cần dùng CLI.

### 10.2. Khôi phục cả máy từ snapshot

Dùng khi server hỏng nặng hoặc lỡ tay xoá dữ liệu:

```sh
R=ap-southeast-2
aws lightsail create-instances-from-snapshot --region $R --instance-names ndc-prod-restore \
  --availability-zone ${R}a --bundle-id small_3_2 \
  --source-instance-name ndc-prod --restore-date YYYY-MM-DD
aws lightsail detach-static-ip --region $R --static-ip-name ndc-ip
aws lightsail attach-static-ip --region $R --static-ip-name ndc-ip --instance-name ndc-prod-restore
```

Sau khi khôi phục:
- Firewall của máy mới mặc định chỉ mở cổng 22 và 80. Chạy lại lệnh `put-instance-public-ports` ở bước 1 của [DEPLOY.md](DEPLOY.md).
- Bật lại snapshot tự động.
- Máy mới có host key mới: xoá dòng của IP cũ trong `~/.ssh/known_hosts` trên máy bạn, và cập nhật secret `DEPLOY_KNOWN_HOSTS`.
- Kiểm tra web chạy ổn rồi mới xoá máy cũ.

### 10.3. Chi phí và các mốc cần nhớ

- Máy 12 USD/tháng, cộng tiền lưu snapshot. Xem trong AWS Settings → Billing.
- **Gói Free hết hạn ngày 23/05/2027.** Trước ngày đó phải nâng cấp lên gói trả phí, nếu không project bị đóng và máy bị xoá. Nên đặt spend limit khi nâng cấp.
- IP tĩnh không gắn vào máy nào sẽ bị tính phí. Xoá máy thì nhớ `release-static-ip`.

## 11. Bảo mật

- **Khoá SSH:** không gửi file `.pem` hay `ndc-deploy` qua chat hoặc email, không commit vào repo (đã có `*.pem` trong `.gitignore`).
- **Thêm người quản trị:** thêm khoá công khai (`.pub`) của họ vào `~/.ssh/authorized_keys`. Họ rời CLB thì xoá dòng đó.
- **Thu hồi quyền deploy của CI:** xoá dòng có `github-actions-deploy` trong `authorized_keys`. Khoá này chỉ chạy được `git pull` và `deploy.sh`, không mở shell được.
- **Giới hạn SSH theo IP:** vào Lightsail → Networking → sửa rule cổng 22, chỉ cho IP của bạn. Nhưng GitHub Actions cũng cần SSH vào cổng 22. Nếu giới hạn thì CI không deploy được nữa, trừ khi cho phép thêm dải IP của GitHub. Hiện tại nên để mở, đăng nhập chỉ bằng khoá.
- **Nghi lộ secret:**
  - Đổi giá trị trong `.env` (mục 6), rồi chạy `dc up -d`.
  - Lộ khoá Google hoặc PayOS thì tạo khoá mới ở Google Cloud Console hoặc my.payos.vn.
  - Lộ khoá SSH thì xoá khỏi `authorized_keys`.
- Repo đang **công khai**. Không bao giờ commit `.env`, khoá, hay bản dump DB.

## 12. Xử lý sự cố

| Triệu chứng | Kiểm tra theo thứ tự |
|---|---|
| Web không vào được | 1. `ssh ndc` được không? Không được → Lightsail console (máy có đang chạy không?). 2. `dc ps`: container nào không `healthy`? 3. `dc logs --tail=100 <service>`. 4. `df -h /` (đầy ổ?), `free -h` (hết RAM?) |
| Lỗi 502 Bad Gateway | Caddy chạy nhưng backend/frontend chết hoặc đang khởi động: `dc ps`, `dc logs backend`. Ngay sau deploy thì đợi khoảng 1 phút |
| Backend restart liên tục sau deploy | Thường do migration hoặc entity: `dc logs backend \| grep -E "Flyway\|Migrat\|Caused by"`. Sửa bằng một migration mới, hoặc rollback code (5.3) |
| Lỗi HTTPS, trình duyệt báo không an toàn | `dc logs caddy`. Kiểm tra DNS ở Vinahost còn trỏ đúng IP: `nslookup neudebateclub.id.vn`. Kiểm tra cổng 80/443 còn mở trong Lightsail |
| Đăng nhập Google lỗi `redirect_uri_mismatch` | Redirect URI trong Google Cloud Console phải đúng là `https://neudebateclub.id.vn/api/auth/google/callback` |
| Đăng nhập được nhưng bị đá ra | Tài khoản có `is_active = false` hoặc chưa có trong bảng `users`: kiểm tra bằng `ndc-psql` |
| Build hết RAM (`Killed`, exit 137) | `free -h`, kiểm tra swap còn bật không (`swapon --show`). Thử deploy lại. Vẫn lỗi thì nâng máy lên gói 4 GB |
| Ổ đĩa đầy | `docker system df` → `docker builder prune -f`. `du -sh ~/backups`. Xem log Docker (mục 9) |
| CI đỏ ở bước SSH: `Host key verification failed` | IP hoặc máy đã đổi: cập nhật secret `DEPLOY_KNOWN_HOSTS` |
| `git pull` trên server lỗi | Ai đó đã sửa file trong `~/ndc`: `git status`, rồi `git stash` hoặc `git checkout -- <file>`. Không bao giờ dùng lệnh này với `.env` (file này không nằm trong git, nên git cũng không đụng tới) |
| Thanh toán PayOS không cập nhật trạng thái | `dc logs backend \| grep -i payos`. Kiểm tra Webhook URL trên my.payos.vn là `https://neudebateclub.id.vn/api/public/payos/webhook` |
