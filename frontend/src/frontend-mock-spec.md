# Frontend Mock — Hệ thống Quản lý Tổ chức

> **Prompt-ready spec** cho coding agent thiết kế frontend mock.  
> Stack gợi ý: React + Tailwind v4, dark mode, Geist + Geist Mono, shadcn/ui components.  
> Design dial: `VARIANCE: 5 / MOTION: 4 / DENSITY: 7` (data-dense, minimal, Linear-style)

---

## ROLE 1 — THÀNH VIÊN

> Giao diện cá nhân, tập trung vào công việc của bản thân. Sidebar 4 items.

---

### 1.1 Todo-list

**Layout:** Full-page task board chia 3 cột theo trạng thái (Kanban-lite).

**Header:**
- Tiêu đề "Công việc của tôi" + badge đếm số task chưa xong
- Button `+ Thêm task` (mở modal inline)
- Filter chips: Tất cả / Hôm nay / Tuần này / Quá hạn (chip active highlight màu accent)
- Sort dropdown: Deadline / Ưu tiên / Mới nhất

**3 cột Kanban:**
- **Cần làm** (trạng thái: `TODO`) — viền trái màu xám
- **Đang làm** (trạng thái: `IN_PROGRESS`) — viền trái màu xanh dương
- **Hoàn thành** (trạng thái: `DONE`) — viền trái màu xanh lá, mờ nhẹ

**Task Card** (mỗi card chứa):
- Checkbox tròn ở góc trái (check = chuyển sang DONE với animation gạch ngang)
- Tên task (font medium, max 2 dòng truncate)
- Tag ban (pill nhỏ màu, ví dụ: "Truyền thông" — màu tím, "Nội dung" — màu cam)
- Deadline: icon lịch + ngày. Nếu quá hạn: text đỏ + icon cảnh báo
- Priority badge: `!` Thấp (xám) / `!!` Trung bình (vàng) / `!!!` Cao (đỏ)
- Avatar người giao task (tooltip hiện tên)
- Hover: hiện nút `Xem chi tiết` và `...` menu (Sửa / Xóa)

**Task Detail Drawer** (slide từ phải, 400px):
- Tên task (editable inline h2)
- Mô tả (rich text read-only, textarea khi edit)
- Trạng thái dropdown
- Deadline date picker
- File đính kèm (list thumbnails, click download)
- Comment thread (avatar + text + timestamp, input ở dưới)
- Lịch sử thay đổi (accordion collapsible)

---

### 1.2 Cập nhật Task

**Layout:** Form page 1 cột, max-width 640px centered.

**Mục đích:** Thành viên tự cập nhật tiến độ task được giao — không tạo mới task.

**Header:**
- Breadcrumb: Công việc của tôi > [Tên task]
- Status badge hiện tại (editable)

**Form fields:**
- **Trạng thái:** Segmented control 3 nút (Cần làm / Đang làm / Hoàn thành)
- **Tiến độ %:** Slider 0-100% + số hiển thị bên phải. Nếu trạng thái = Hoàn thành thì tự nhảy 100%
- **Ghi chú cập nhật:** Textarea placeholder "Bạn đã làm gì? Gặp khó khăn gì?" — bắt buộc khi % thay đổi
- **File đính kèm:** Drag-and-drop zone + button chọn file. Hiện danh sách file đã upload
- **Ngày hoàn thành dự kiến:** Date picker (chỉ hiện nếu trạng thái ≠ Hoàn thành)

**Timeline bên phải (desktop):** Lịch sử cập nhật trước đó — timeline dọc với dot, timestamp, nội dung ghi chú, % tiến độ.

**Footer:**
- Button `Lưu cập nhật` (primary)
- Button `Hủy` (ghost)

---

### 1.3 Đọc Thông báo

**Layout:** Trang danh sách thông báo, 2 panel (list trái / detail phải) trên desktop.

**Panel trái — Danh sách:**
- Search bar (tìm kiếm nội dung thông báo)
- Tabs: Tất cả / Chưa đọc (badge đỏ số lượng) / Đã ghim / Quan trọng
- Button "Đánh dấu tất cả đã đọc" (ghost, chỉ hiện khi có unread)
- Mỗi notification item:
  - Dot xanh (unread indicator) hoặc không có (đã đọc)
  - Icon loại: 📋 Task / 📢 Thông báo / 🏆 Nghiệp vụ / 💬 Comment
  - Tiêu đề (bold nếu unread, regular nếu đã đọc)
  - Preview nội dung (1 dòng truncate, text muted)
  - Timestamp relative ("2 giờ trước", "Hôm qua")
  - Hover: icon ghim + icon xóa

**Panel phải — Chi tiết thông báo:**
- Tiêu đề lớn (h2)
- Metadata: Người gửi (avatar + tên) / Ngày gửi / Tag loại
- Nội dung đầy đủ (markdown rendered)
- File đính kèm (nếu có): grid thumbnails
- Link liên quan: button "Xem task liên quan" / "Xem ấn phẩm"
- Action: Button `Ghim` / `Xóa`

---

### 1.4 Thư viện

**Layout:** Grid view với filter sidebar trái (240px) + nội dung phải.

**Mục đích:** Xem tài liệu, ấn phẩm, file được chia sẻ với thành viên.

**Sidebar filter:**
- Tìm kiếm file (search input)
- Danh mục: Tất cả / Tài liệu / Ấn phẩm / Template / Khác
- Lọc theo ban: Checkbox list (Truyền thông, Nội dung, Sự kiện...)
- Lọc theo thời gian: Tuần này / Tháng này / Tùy chọn

**Main content:**
- Toolbar: `Grid view` / `List view` toggle + Sort (Mới nhất / Tên A-Z / Kích thước)
- **Grid view:** Cards 3 cột, mỗi card:
  - Thumbnail preview (PDF → icon PDF màu đỏ, ảnh → preview, docx → icon xanh)
  - Tên file (truncate 2 dòng)
  - Metadata: Kích thước / Ngày upload / Người upload
  - Hover: Button `Xem` (primary) + `Tải xuống` (icon)
- **List view:** Table rows: icon loại / tên file / ban / ngày / kích thước / actions

**File Preview Modal:** Fullscreen overlay, PDF render in-browser, ảnh zoom, video play.

---

## ROLE 2 — TRƯỞNG BAN

> Kế thừa toàn bộ giao diện Thành viên + 5 tab/section dành riêng. Sidebar group "Quản lý Ban".

---

### 2.1 Giao Task

**Layout:** Split view — Form bên trái (60%) + Preview danh sách task của ban bên phải (40%).

**Form giao task:**
- **Tiêu đề task:** Input text (required)
- **Mô tả:** Rich text editor (bold, italic, bullet list, link)
- **Giao cho:** Multi-select dropdown danh sách thành viên trong ban (avatar + tên). Có thể chọn nhiều người (co-assign)
- **Deadline:** Date + Time picker (hiện cả giờ)
- **Mức độ ưu tiên:** Radio pills: Thấp / Trung bình / Cao / Khẩn cấp
- **Danh mục:** Select (Nghiệp vụ / Sự kiện / Hành chính / Khác)
- **Nhắc nhở:** Toggle + chọn trước bao nhiêu ngày (1/3/7 ngày trước deadline)
- **File đính kèm:** Drag-drop zone
- **Lặp lại:** Toggle + chọn tần suất (Hàng tuần / Hàng tháng) — optional

**Buttons:** `Giao task` (primary) / `Lưu nháp` (secondary) / `Hủy`

**Panel phải — Task board của ban:**
- Mini Kanban theo người được giao
- Hiện tên thành viên + số task đang có
- Quick filter: Quá hạn / Hôm nay

---

### 2.2 Tạo Thông báo

**Layout:** Editor page full-width, max 800px centered.

**Header:** "Tạo thông báo mới" + Draft autosave indicator ("Đã lưu nháp lúc 15:22")

**Form:**
- **Tiêu đề:** Input lớn (placeholder "Tiêu đề thông báo...")
- **Loại:** Select với icon: 📢 Thông báo chung / 📋 Cập nhật task / 🏆 Khen thưởng / ⚠️ Khẩn cấp (đổi màu header theo loại)
- **Gửi đến:** Multi-select: Toàn ban / Chọn thành viên cụ thể (danh sách checkbox với avatar)
- **Nội dung:** WYSIWYG editor (heading, bold, italic, link, image embed, bullet list, code block)
- **File đính kèm:** Upload multiple
- **Lên lịch gửi:** Toggle → Date + Time picker (nếu không toggle = gửi ngay)
- **Mức độ:** Switch "Đánh dấu quan trọng" (thêm icon ⭐ cho người nhận)

**Preview panel** (toggle button): Xem trước thông báo như người nhận thấy.

**Buttons:** `Gửi ngay` / `Lên lịch` / `Lưu nháp`

---

### 2.3 Nghiệp vụ Ban

**Layout:** Dashboard nội bộ ban — 3 section chính.

**Section A — Tổng quan ban (top stats row):**
- Card: Tổng thành viên / Đang hoạt động / Vắng mặt
- Card: Task tuần này: Tổng / Hoàn thành / Đang làm / Quá hạn
- Card: Điểm hoàn thành nhiệm vụ ban (progress ring %)

**Section B — Bảng theo dõi thành viên:**
- Table: Avatar / Tên / Chức vụ / Task đang có / Task hoàn thành tháng này / Tỷ lệ đúng hạn / Điểm đóng góp / Trạng thái hoạt động
- Sort được theo từng cột
- Row click → mở sidebar chi tiết thành viên đó
- Badge màu cho tỷ lệ: ≥80% xanh / 50-79% vàng / <50% đỏ

**Section C — Nghiệp vụ nổi bật:**
- List các task quan trọng đang diễn ra của ban
- Timeline tiến độ các dự án/sự kiện của ban

---

### 2.4 Biểu đồ

**Layout:** Analytics page, grid 2 cột trên desktop, 1 cột mobile.

**Chart 1 — Hoàn thành task theo tuần (Line chart):**
- X: 8 tuần gần nhất
- Y: Số task hoàn thành
- 2 lines: Ban tôi (accent màu) vs Trung bình toàn tổ chức (xám đứt)
- Hover tooltip hiện số chính xác

**Chart 2 — Phân bổ task theo trạng thái (Donut chart):**
- 4 segments: Todo / In Progress / Done / Overdue
- Số tổng ở giữa
- Legend dưới chart

**Chart 3 — Đóng góp thành viên (Horizontal bar chart):**
- Mỗi row = 1 thành viên (avatar nhỏ + tên)
- Bar = số task hoàn thành trong tháng
- Màu bar gradient từ nhạt → đậm theo giá trị

**Chart 4 — Task theo danh mục (Stacked bar):**
- X: 4 tuần gần nhất
- Stack màu: Nghiệp vụ / Sự kiện / Hành chính / Khác

**Filter bar trên cùng:** Chọn khoảng thời gian (7 ngày / 30 ngày / 3 tháng / Tùy chọn)

---

### 2.5 Link Ấn phẩm

**Layout:** Gallery page + form thêm mới.

**Mục đích:** Trưởng ban đăng link hoặc upload ấn phẩm ban sản xuất (ảnh, video, bài đăng...) để BCN theo dõi và lưu trữ.

**Header:**
- "Ấn phẩm của ban [Tên ban]"
- Button `+ Đăng ấn phẩm mới` (mở slide-over panel)

**Gallery grid (3 cột):**
- Mỗi card ấn phẩm:
  - Thumbnail (ảnh preview / video thumbnail / link OG image)
  - Tiêu đề ấn phẩm
  - Loại: 📸 Ảnh / 🎬 Video / 📝 Bài viết / 🎨 Design
  - Platform: icon Facebook / Instagram / Website / Internal
  - Ngày đăng
  - Lượt tương tác (nếu có): ❤️ Likes / 💬 Comments / 👁️ Views
  - Status badge: Đã duyệt / Chờ duyệt / Từ chối
  - Hover: `Xem link` (external) + `Sửa` + `Xóa`

**Slide-over form "Đăng ấn phẩm":**
- Tiêu đề
- Loại ấn phẩm (select)
- Link URL hoặc Upload file
- Platform
- Ngày đăng
- Mô tả ngắn
- Button Submit

---

## ROLE 3 — BCN (Ban Chấp hành)

> Full access. Sidebar có group "Quản lý Tổ chức" + "Hệ thống". Kế thừa tất cả role Trưởng ban.

---

### 3.1 Quản lý Thành viên

**Layout:** Data table full-width với toolbar đầy đủ.

**Toolbar:**
- Search (tìm tên, email, mã thành viên)
- Filter: Theo ban / Theo chức vụ / Theo trạng thái (Hoạt động / Tạm nghỉ / Đã nghỉ)
- Button `+ Thêm thành viên` / `Import CSV` / `Export`

**Table columns:**
- Avatar + Tên đầy đủ
- Mã thành viên (monospace)
- Email / SĐT
- Ban
- Chức vụ (Badge: Thành viên / Trưởng ban / Phó ban / BCN)
- Ngày tham gia
- Trạng thái (pill: Hoạt động xanh / Tạm nghỉ vàng / Đã nghỉ xám)
- Hành động: `Xem` / `Sửa` / `...` (Đổi ban / Đổi chức vụ / Vô hiệu hóa)

**Row click → Member Profile Drawer (600px):**
- Header: Avatar lớn + Tên + Chức vụ + Ban
- Tabs: Thông tin / Task / Lịch sử / Ghi chú
- Tab Thông tin: thông tin cá nhân, liên hệ, ngày sinh, mạng xã hội
- Tab Task: danh sách task của thành viên này (mini table)
- Tab Lịch sử: timeline hoạt động từ lúc tham gia
- Tab Ghi chú: BCN có thể thêm ghi chú nội bộ (private)

**Bulk actions** (khi chọn nhiều rows):
- Đổi ban hàng loạt / Đổi trạng thái / Export selected

---

### 3.2 Phân quyền

**Layout:** 2 panel — Role list trái + Permission matrix phải.

**Panel trái — Danh sách Role:**
- 4 role mặc định: BCN / Trưởng ban / Phó ban / Thành viên
- Button `+ Tạo role tùy chỉnh`
- Click role → load permission matrix bên phải

**Panel phải — Permission Matrix:**
- Header: "Quyền hạn của: [Tên role]"
- Table dạng grid: Hàng = Module (Task, Thông báo, Thư viện, Tài chính...) / Cột = Action (Xem / Tạo / Sửa / Xóa / Phê duyệt)
- Mỗi ô = Toggle switch
- Color coding: Toggle xanh = có quyền / xám = không
- Footer: Button `Lưu thay đổi` + warning "Thay đổi sẽ áp dụng ngay lập tức"

**Tab "Thành viên theo Role":**
- Danh sách ai đang có role đó
- Drag thành viên sang role khác (hoặc dùng dropdown)

---

### 3.3 Tài chính

**Layout:** Finance dashboard với summary cards + data table.

**Summary cards (top row, 4 cards):**
- Tổng quỹ hiện có (số lớn, màu xanh)
- Thu tháng này (số + so sánh vs tháng trước, arrow up/down)
- Chi tháng này (số + so sánh vs tháng trước)
- Số giao dịch chờ duyệt (badge đỏ nếu > 0)

**Tabs chính:** Tổng quan / Giao dịch / Ngân sách / Báo cáo

**Tab Tổng quan:**
- Line chart: Thu/Chi theo 6 tháng (2 lines khác màu)
- Donut chart: Phân bổ chi tiêu theo danh mục (Sự kiện / Văn phòng phẩm / Khác)
- Bảng top 5 khoản chi lớn nhất tháng

**Tab Giao dịch:**
- Table: STT / Ngày / Mô tả / Danh mục / Loại (Thu/Chi) / Số tiền / Người tạo / Trạng thái / Actions
- Filter: Loại (Thu/Chi/Tất cả) / Danh mục / Khoảng thời gian / Trạng thái
- Button: `+ Thêm giao dịch` (modal form)
- Số tiền: dùng font monospace, Thu = xanh, Chi = đỏ
- Trạng thái: Chờ duyệt (vàng) / Đã duyệt (xanh) / Từ chối (đỏ)
- Hành động: Duyệt / Từ chối (chỉ với Chờ duyệt)

**Tab Ngân sách:**
- Mỗi danh mục = 1 row với progress bar (% đã dùng / tổng ngân sách)
- Nếu >90%: bar đỏ + warning icon
- Button `Điều chỉnh ngân sách`

---

### 3.4 CMS (Content Management System)

**Layout:** Admin CMS, sidebar content trái + editor phải.

**Sidebar nội dung:**
- Tree structure: Tài liệu / Thông báo / Template / Biểu mẫu
- Mỗi item: icon loại + tên + status badge (Draft / Published / Archived)
- Button `+ Tạo mới` per category
- Drag để sắp xếp thứ tự

**Editor chính (phải):**
- Toolbar: Bold / Italic / Heading / Link / Image / Code / Table / Divider
- Full WYSIWYG editor (như Notion)
- Right panel meta: Tiêu đề SEO / Tags / Danh mục / Người tạo / Ngày tạo / Ngày sửa / Phiên bản
- Version history (dropdown chọn phiên bản cũ, so sánh diff)
- Publish controls: `Lưu nháp` / `Xuất bản` / `Lên lịch`

**Thư viện Media** (tab riêng):
- Grid upload/quản lý ảnh, video, file
- Tìm kiếm / filter theo loại / ngày
- Bulk delete / copy link

---

### 3.5 Health Dashboard

**Layout:** Executive dashboard, data-dense, tối ưu cho màn hình lớn.

**Mục đích:** Tổng quan sức khỏe toàn tổ chức — BCN nhìn 1 trang biết tất cả.

**Row 1 — KPI Cards (6 cards ngang):**
- Tổng thành viên hoạt động
- Task hoàn thành đúng hạn (%) — ring chart nhỏ
- Task quá hạn (số) — badge đỏ nếu > 0
- Ấn phẩm tháng này (tổng)
- Điểm sức khỏe tổ chức (0-100) — large number với trend arrow
- Thành viên tạm nghỉ / nghỉ tháng này

**Row 2 — Charts (2 cột):**
- Bảng xếp hạng các ban: Table với cột Tên ban / Task hoàn thành / Tỷ lệ đúng hạn / Ấn phẩm / Điểm. Color heatmap theo hiệu suất.
- Activity heatmap (kiểu GitHub contribution graph): Trục X = ngày (52 tuần), mỗi ô = cường độ hoạt động. Hover = tooltip số liệu ngày đó.

**Row 3 — Alerts & Notices:**
- List cảnh báo tự động: "Ban X có 5 task quá hạn", "Thành viên Y chưa hoạt động 2 tuần", "Quỹ sắp cạn ngân sách danh mục Z"
- Mỗi alert: icon mức độ (🔴 Cao / 🟡 Trung bình / 🔵 Thông tin) + text + button action "Xem chi tiết"

**Row 4 — Timeline sự kiện tổ chức sắp tới:**
- Horizontal scroll timeline
- Mỗi event: ngày + tên + ban phụ trách + trạng thái chuẩn bị (progress %)

---

### 3.6 Giao Task Mọi Ban

**Layout:** Tương tự 2.1 nhưng mở rộng phạm vi toàn tổ chức.

**Khác biệt so với Trưởng ban:**
- Field "Giao cho ban": Select ban trước (dropdown danh sách ban) → sau đó chọn thành viên trong ban đó
- Có thể giao task liên ban: chọn nhiều ban, chọn thành viên từ nhiều ban khác nhau
- Field "Trưởng ban phụ trách": Optional, chọn Trưởng ban sẽ nhận được thông báo và theo dõi task
- **Panel xem toàn tổ chức bên phải:** Task board tổng hợp tất cả các ban, có thể filter theo từng ban

**Bulk assign:**
- Tạo 1 task nhưng assign cho nhiều người (mỗi người nhận 1 bản task riêng)
- Toggle: "Nhân bản task cho từng người" vs "Task chung cho nhóm"

---

### 3.7 Activity Log

**Layout:** Full-width log viewer, tương tự audit log.

**Filter bar:**
- Search (tìm kiếm theo nội dung log, tên người, module)
- Filter theo: Người thực hiện / Module (Task/Tài chính/Thành viên/Hệ thống) / Loại hành động (Tạo/Sửa/Xóa/Đăng nhập) / Khoảng thời gian

**Log table:**
- Timestamp (format: DD/MM/YYYY HH:mm:ss, font monospace)
- Avatar + Tên người thực hiện
- Hành động (badge màu: Tạo=xanh / Sửa=vàng / Xóa=đỏ / Xem=xám)
- Module + Đối tượng (ví dụ: "Task #123 — Làm poster sự kiện")
- Chi tiết thay đổi: "Đổi trạng thái: Đang làm → Hoàn thành"
- IP Address (monospace, muted)

**Row click → Log Detail Modal:**
- Hiện đầy đủ payload thay đổi: trước và sau (diff view, xanh = thêm, đỏ = xóa)

**Export:** Button export CSV / JSON theo filter hiện tại.

**Realtime:** Auto-refresh mỗi 30 giây, có indicator "Đang theo dõi realtime".

---

### 3.8 Nhiệm kỳ

**Layout:** Timeline page + management panel.

**Mục đích:** Quản lý lịch sử các nhiệm kỳ tổ chức, chuyển giao dữ liệu, lưu trữ.

**Timeline nhiệm kỳ (top section):**
- Horizontal timeline: mỗi nhiệm kỳ = 1 block (tên nhiệm kỳ + thời gian + BCN chủ chốt)
- Block đang hoạt động: highlight màu accent, badge "Hiện tại"
- Block cũ: xám, click để xem
- Button `+ Tạo nhiệm kỳ mới`

**Detail panel (khi chọn nhiệm kỳ):**

**Tab Thông tin:**
- Tên nhiệm kỳ, thời gian (từ... đến...)
- Slogan / Mục tiêu nhiệm kỳ (textarea)
- Danh sách BCN nhiệm kỳ đó (avatar grid)
- Thành tích nổi bật (bullet list editable)

**Tab Thống kê nhiệm kỳ:**
- Tổng thành viên qua nhiệm kỳ
- Tổng task hoàn thành
- Tổng ấn phẩm
- Tổng sự kiện
- So sánh với nhiệm kỳ trước (% tăng/giảm)

**Tab Chuyển giao:**
- Checklist chuyển giao: Tài liệu / Tài chính / Tài sản / Nhân sự
- Mỗi mục: checkbox + người phụ trách + ghi chú + file đính kèm
- Status tổng: % hoàn thành chuyển giao (progress bar)

**Tab Lưu trữ:**
- Snapshot toàn bộ dữ liệu nhiệm kỳ (read-only sau khi đóng)
- Button `Export toàn bộ dữ liệu nhiệm kỳ` (ZIP)
- Button `Đóng nhiệm kỳ` (destructive, confirm dialog 2 bước)

---

## LAYOUT CHUNG — NAVIGATION

**Sidebar trái (260px, collapsible):**

```
[Logo + Tên tổ chức]

── THÀNH VIÊN ──────────
  📋 Công việc của tôi     (Todo-list)
  ✏️  Cập nhật Task
  🔔 Thông báo             (badge đỏ số unread)
  📁 Thư viện

── QUẢN LÝ BAN ─────────  [chỉ hiện với Trưởng ban+]
  ➕ Giao Task
  📢 Tạo thông báo
  📊 Nghiệp vụ Ban
  📈 Biểu đồ
  🔗 Link Ấn phẩm

── TỔ CHỨC ─────────────  [chỉ hiện với BCN]
  👥 Quản lý thành viên
  🔑 Phân quyền
  💰 Tài chính
  📝 CMS
  💚 Health Dashboard
  📋 Giao Task mọi ban
  🗂️  Activity Log
  🏛️  Nhiệm kỳ

────────────────────────
[Avatar + Tên] [Cài đặt]
```

**Topbar (64px):**
- Breadcrumb hiện tại
- Search global (Ctrl+K command palette)
- Icon thông báo (bell + badge)
- Avatar + dropdown (Hồ sơ / Đổi mật khẩu / Đăng xuất)

**Design tokens:**
- Background: `#0a0a0a` (near-black)
- Surface: `#111111`
- Border: `#1f1f1f`
- Accent: Electric blue `#3b82f6` (một màu duy nhất)
- Text primary: `#f5f5f5`
- Text muted: `#6b7280`
- Font: Geist Sans + Geist Mono (cho số liệu, code, timestamp)
- Radius: 8px cho cards, 6px cho inputs, 4px cho badges
