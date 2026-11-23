# Deploy production lên AWS Lightsail

Một máy Lightsail chạy lại `docker-compose.yml` cùng `docker-compose.prod.yml`. Caddy nhận HTTPS cho `neudebateclub.id.vn`, chuyển `/api/*` sang backend, mọi request khác sang frontend. Lý do và các thay đổi code nằm ở [docs/deploy-plan.md](docs/deploy-plan.md).

| Thông số | Giá trị |
|---|---|
| Project AWS | gói **Free**: 100 USD credit, hết hạn **23/05/2027** |
| Selected Region | `ap-southeast-2` (Sydney). Mọi tài nguyên phải tạo ở Region này |
| Máy | `small_3_2`: 2 GB RAM, 2 vCPU, 60 GB SSD, 1,5 TB băng thông, giá **12 USD/tháng** |
| Tên miền | `neudebateclub.id.vn`, quản lý DNS tại Vinahost |

Các lệnh `aws` bên dưới chạy trên máy của bạn với profile `default` (đăng nhập bằng `aws login`). Các lệnh còn lại chạy trên server qua SSH.

## 0. Trước khi bắt đầu

- Xác nhận Region trong AWS Settings → View all projects → Overview → Additional Info → Region.
- **Trước 23/05/2027**, vào AWS Settings → Billing để nâng cấp lên gói trả phí. Hết hạn gói Free mà chưa nâng cấp thì project bị đóng và máy chủ bị xoá. Khi nâng cấp, nên đặt spend limit (ví dụ 20 USD/tháng).
- Nếu sau này lệnh nào đang chạy được bỗng báo `Access Denied`, kiểm tra spend limit trong AWS Settings → Billing trước.

## 1. Tạo máy, IP tĩnh, firewall, snapshot

```sh
R=ap-southeast-2
aws lightsail create-instances --region $R --instance-names ndc-prod \
  --availability-zone ${R}a --blueprint-id ubuntu_24_04 --bundle-id small_3_2
aws lightsail allocate-static-ip --region $R --static-ip-name ndc-ip
aws lightsail attach-static-ip   --region $R --static-ip-name ndc-ip --instance-name ndc-prod
aws lightsail get-static-ip      --region $R --static-ip-name ndc-ip --query staticIp.ipAddress --output text

# Firewall của Lightsail thay cho ufw: chỉ mở SSH và HTTP/HTTPS (443/udp cho HTTP/3)
aws lightsail put-instance-public-ports --region $R --instance-name ndc-prod --port-infos \
  fromPort=22,toPort=22,protocol=tcp fromPort=80,toPort=80,protocol=tcp \
  fromPort=443,toPort=443,protocol=tcp fromPort=443,toPort=443,protocol=udp

# Snapshot tự động hằng ngày lúc 20:00 UTC (3h sáng giờ Việt Nam), Lightsail giữ 7 bản gần nhất
aws lightsail enable-add-on --region $R --resource-name ndc-prod \
  --add-on-request 'addOnType=AutoSnapshot,autoSnapshotAddOnRequest={snapshotTimeOfDay=20:00}'

# Khoá SSH mặc định của Lightsail (không commit file này)
aws lightsail download-default-key-pair --region $R --query privateKeyBase64 --output text > ~/.ssh/ndc-prod.pem
ssh -i ~/.ssh/ndc-prod.pem ubuntu@<IP>
```

- IP tĩnh không mất tiền khi đang gắn vào máy. Nếu không gắn vào máy nào thì bị tính phí.
- Snapshot tính phí theo dung lượng (vài USD/tháng) và được trừ vào credit.
- Muốn chặt hơn, giới hạn cổng 22 theo IP của bạn bằng `cidrs=<ip>/32`.

## 2. DNS tại Vinahost

Trong trang quản lý DNS của Vinahost:

| Loại | Tên | Giá trị | TTL |
|---|---|---|---|
| A | `@` | IP tĩnh ở bước 1 | 300 |
| CNAME | `www` | `neudebateclub.id.vn` | 300 |

Chạy `nslookup neudebateclub.id.vn` và `nslookup www.neudebateclub.id.vn`. Phải ra đúng IP rồi mới làm bước 6. Nếu chưa, Caddy không xin được chứng chỉ HTTPS.

## 3. Chuẩn bị server (một lần)

```sh
sudo apt update && sudo apt -y upgrade
curl -fsSL https://get.docker.com | sudo sh     # script chính thức của Docker, có kèm compose plugin
sudo usermod -aG docker ubuntu && exit          # đăng nhập SSH lại để nhận quyền docker

# 2 GB swap, vì `next build` có thể hết RAM trên máy 2 GB
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Code và `.env`

```sh
git clone https://github.com/NGUYENTHANHDATHH/NEU-Debate-Club.git ~/ndc && cd ~/ndc
cp .env.docker.example .env && chmod 600 .env && nano .env
```

Repo private thì clone bằng Personal Access Token (quyền chỉ đọc) hoặc deploy key.

Điền vào `.env`:
- `POSTGRES_PASSWORD`: mật khẩu mới, chưa dùng ở đâu khác.
- `JWT_SECRET`: lấy bằng `openssl rand -base64 32`.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: lấy bằng `npx web-push generate-vapid-keys`, chạy trên máy của bạn.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- `PAYOS_*`, nếu dùng thanh toán QR.
- Toàn bộ khối **Production** ở cuối file: bỏ comment và sửa các dòng trùng tên ở phía trên. Riêng `NEXT_PUBLIC_SITE_URL` phải là `https://neudebateclub.id.vn`, không có `/` ở cuối và không có `www`.

## 5. Dịch vụ bên ngoài

- **Google Cloud Console → OAuth client:**
  - Authorized JavaScript origin: `https://neudebateclub.id.vn`.
  - Redirect URI: `https://neudebateclub.id.vn/api/auth/google/callback`.
  - Chuyển OAuth consent screen sang "In production". Scope `gmail.send` là scope nhạy cảm: khi app chưa được Google xác minh, người dùng công cụ gửi mail sẽ thấy cảnh báo.
- **PayOS** (my.payos.vn → Kênh thanh toán): đặt Webhook URL là `https://neudebateclub.id.vn/api/public/payos/webhook`.

## 6. Chạy

```sh
cd ~/ndc
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait --wait-timeout 600
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps     # chỉ ndc_caddy có cổng 80/443
curl -s https://neudebateclub.id.vn/api/actuator/health                # {"status":"UP"}
```

## 7. Tạo BCN thật, tắt tài khoản cố định (một lần)

```sh
docker exec -i ndc_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
INSERT INTO users (email, full_name, role, department, is_active)
VALUES ('<email-bcn-that>', '<Họ tên>', 'bcn', 'bcn', true);
UPDATE users SET is_active = false WHERE id = '00000000-0000-0000-0000-000000000001';
SQL
```

Không xoá được tài khoản `…0001`, vì nội dung landing thật đang tham chiếu tới nó. Vì vậy chỉ tắt tài khoản này.

## 8. Backup database

Snapshot ở bước 1 sao lưu cả máy. Ngoài ra nên có thêm bản dump database hằng ngày, để khôi phục riêng database mà không phải khôi phục cả máy:

```sh
mkdir -p ~/backups
crontab -e
# thêm dòng:
0 20 * * * docker exec ndc_db sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > ~/backups/ndc-$(date +\%F).dump && find ~/backups -mtime +7 -delete
```

Khôi phục từ một bản dump:

```sh
docker exec -i ndc_db sh -c 'pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < ~/backups/ndc-YYYY-MM-DD.dump
```

## 9. Cập nhật phiên bản

```sh
cd ~/ndc && git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait --wait-timeout 600
```

Đổi bất kỳ biến `NEXT_PUBLIC_*` nào trong `.env` thì đều phải chạy lại lệnh trên, vì các biến này được nhúng vào frontend lúc build.

### Tự động deploy bằng GitHub Actions

Mỗi lần push lên `main`, [.github/workflows/deploy.yml](.github/workflows/deploy.yml) sẽ:
1. Chạy test backend. Test lỗi thì dừng, không deploy.
2. SSH vào server bằng khoá riêng cho CI.

Trên server, khoá này bị giới hạn bằng forced command trong `~/.ssh/authorized_keys`: nó chỉ chạy được `git pull --ff-only` và [scripts/deploy.sh](scripts/deploy.sh), không mở được shell. Nếu build lỗi, các container cũ vẫn chạy tiếp.

- Các commit chỉ sửa `*.md` hoặc `docs/` thì không deploy.
- Muốn chạy tay: GitHub → Actions → Deploy → Run workflow.

Secrets cần đặt ở GitHub → Settings → Secrets and variables → Actions:

| Secret | Giá trị |
|---|---|
| `DEPLOY_SSH_KEY` | Toàn bộ nội dung file khoá riêng `~/.ssh/ndc-deploy` trên máy tạo khoá |
| `DEPLOY_HOST` | `52.64.239.220` |
| `DEPLOY_KNOWN_HOSTS` | Kết quả của `ssh-keyscan -t ed25519 52.64.239.220` |

Thu hồi quyền deploy: xoá dòng `github-actions-deploy` trong `~/.ssh/authorized_keys` trên server.

Server không được có thay đổi chưa commit trong `~/ndc`, nếu có thì `git pull --ff-only` sẽ lỗi. Chỉ sửa `.env`, vì file này không nằm trong git.

## 10. Kiểm tra sau khi deploy

- Đăng nhập Google bằng email BCN thật. Không được gặp lỗi `redirect_uri_mismatch`.
- Tạo một task và kiểm tra push về thiết bị đã đăng ký. Cài PWA được trên điện thoại.
- `curl -I https://www.neudebateclub.id.vn` phải trả `301` về tên miền gốc.
- `https://neudebateclub.id.vn/api/swagger-ui/index.html` phải trả 404.
- SEO: làm theo mục 3b và các bước kiểm tra SEO trong [docs/deploy-plan.md](docs/deploy-plan.md): sitemap, robots, Search Console, Bing.

## Dọn dẹp và chi phí

- Tiền máy chủ được trừ vào credit. Theo dõi trong AWS Settings → Billing.
- Bỏ project thì xoá máy, IP tĩnh và snapshot, nếu không vẫn bị tính phí:

```sh
aws lightsail delete-instance --region ap-southeast-2 --instance-name ndc-prod
aws lightsail release-static-ip --region ap-southeast-2 --static-ip-name ndc-ip
aws lightsail get-auto-snapshots --region ap-southeast-2 --resource-name ndc-prod
```
