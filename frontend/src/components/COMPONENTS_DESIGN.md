# Detailed UI Components Design (Stitch Design Taste)

Dựa trên yêu cầu từ `frontend-mock-spec.md` và triết lý thiết kế của `stitch-design-taste`, dưới đây là bản thiết kế chi tiết cho các UI component lõi của hệ thống NEU Debate Club Dashboard.

## 1. Hệ thống Layout & Vùng Không Gian (Spatial Zones)

- **Container chung:** `bg-[#F9FAFB] min-h-[100dvh] flex`.
- **Sidebar:** Không gian cố định bên trái, nền `#F9FAFB`, viền phải `1px solid rgba(226,232,240,0.5)`. Các nhóm menu được chia cách bằng khoảng trống hào phóng (Gallery-airy). Không có icon hamburger trên desktop.
- **Main Content Area:** Rộng tối đa `1400px`, nằm giữa (centered) khi màn hình quá lớn. Cấu trúc Bento grid không viền hoặc dùng Card nền `#FFFFFF` bo góc cực lớn `rounded-[2.5rem]`.
- **Tuyệt đối không xếp chồng (No overlapping):** Tất cả các layer nội dung, header, filter bar đều có khoảng không riêng biệt. Không dùng `absolute` đè chữ lên hình.

## 2. Các UI Component Lõi

### 2.1. Task Board (Kanban Lite - Dành cho Todo-list)

- **Cấu trúc:** 3 cột theo chiều dọc (Cần làm / Đang làm / Hoàn thành). Giữa các cột dùng khoảng trống (gap) `2rem` thay vì viền cứng.
- **Task Card:**
  - Nền `#FFFFFF`, góc bo `rounded-2xl` (mềm mại nhưng nhỏ hơn card bọc ngoài).
  - Viền `Whisper Border` `border-slate-200/50`.
  - **Shadow:** Bóng đổ lan toả (Diffused Shadow) `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`.
  - **Typography:** Tên task dùng `Geist` font medium `#18181B`. Deadline icon lịch + text dùng `Geist Mono` size nhỏ `#71717A`.
  - **Trạng thái (Check):** Nút check tròn to `24px`. Khi click có hiệu ứng Spring Physics scale lõm vào `-1px translateY`.
  - **Tag Ban:** Dạng pill, chữ uppercase nhỏ, không dùng màu phản quang.

### 2.2. Forms & Inputs (Dành cho Cập nhật Task, Tạo thông báo)

- **Kiến trúc:** Label luôn nằm TRÊN input (`flex-col gap-2`).
- **Text Input/Textarea:**
  - Nền trong suốt hoặc `#F9FAFB`, viền xám nhạt.
  - Khi focus: Không có outline browser mặc định. Viền chuyển sang màu **Deep Rose** (`#E11D48`) kèm hiệu ứng `-translate-y-[1px]` nhẹ.
- **Segmented Control (chọn Trạng thái):**
  - Khung xám nhạt bo tròn. Nút active nổi lên bằng một khối trắng bo góc, text màu `#18181B`, motion spring trượt mượt mà.
- **Drag-and-Drop Zone (File upload):**
  - Vùng đứt nét (dashed) bo góc lớn `rounded-3xl`, padding rộng, chữ ở giữa kèm icon. Khi drag file vào nền đổi sang màu Rose siêu nhạt `bg-rose-50`.

### 2.3. Data Tables (Dành cho Quản lý Thành viên, Tài chính, Activity Log)

- **Kiến trúc:** Không có sọc ngựa vằn (zebra stripes) thô thiển.
- **Header:** Chữ `Geist` hoặc `Satoshi` in hoa nhỏ (Text-xs), màu `#94A3B8`, tracking rộng (tracking-wider).
- **Rows:** Có padding trên dưới lớn (`py-4`). Khi hover, nền chuyển nhẹ sang `bg-slate-50` thay vì bóng đổ.
- **Cell Content:**
  - Tên/Tiêu đề: `#18181B` font medium.
  - Số liệu/Tiền tệ/Thời gian: Bắt buộc dùng monospace `JetBrains Mono` hoặc `Geist Mono`. Tiền thu màu `#10B981`, tiền chi màu Deep Rose `#E11D48`.
  - Status Badges: Dạng Pill (bo tròn 2 đầu). Nền cực nhạt, chữ đậm màu không bão hòa.

### 2.4. Dashboard Analytics & Biểu đồ (Health Dashboard, Biểu đồ)

- **Thẻ KPI (Metric Cards):**
  - Không nằm trong box màu xám thô. Nằm trong nền `#FFFFFF`, bóng đổ whisper shadow, góc `rounded-[2.5rem]`.
  - Số liệu hiển thị siêu to (Display scale `text-5xl`), track-tight.
- **Biểu đồ (Charts):**
  - Không dùng viền lưới (grid lines) lộn xộn. Trục X/Y nét mờ `rgba(0,0,0,0.05)`.
  - Màu sắc chart: Dùng thang màu Monochromatic (Deep Rose nhạt dần) cho Data ban mình, xám nhạt đứt nét cho trung bình tổ chức.
  - Activity Heatmap (GitHub style): Thay vì dùng các ô vuông cứng, dùng các chấm tròn nhỏ (dots) hoặc ô bo góc lớn, các cấp độ màu từ xám nhạt `#F3F4F6` đến hồng đậm `#E11D48`.

### 2.5. Dialogs, Modals & Slide-overs (Drawers)

- **Slide-over (Rút từ phải sang cho Task Detail, Member Profile):**
  - Phủ full chiều cao `h-[100dvh]`.
  - Nền backdrop: Mờ nhẹ `bg-black/10` kết hợp `backdrop-blur-sm`.
  - Panel chính: Bo góc cực lớn chỉ ở bên trái `rounded-l-[2.5rem]`, nền `#FFFFFF`.
  - Motion: Trượt vào với Spring physics `stiffness: 100, damping: 20` (nhanh gọn, có độ đàn hồi cuối).
- **Fullscreen Overlays (File Preview):**
  - Nền `#F9FAFB` đục 100% để tập trung vào content, nút Close (X) to, rõ ràng ở góc phải.

### 2.6. Micro-Interactions & Animation (Trọng tâm Stitch)

- **Waterfall Reveals:** Khi danh sách (Todo, Thông báo, Activity log) load ra, các dòng xuất hiện trượt từ dưới lên kèm mờ ảo với delay lệch nhau (`animation-delay`).
- **Perpetual Loops:**
  - Cảnh báo "Quá hạn" (Overdue): Icon `!` rung nhẹ (pulse) liên tục.
  - Status "Đang làm" (In Progress): Dấu chấm xanh dương hoặc rose pulse nhẹ nhàng cạnh tên task.
  - Skeleton Loader: Không xoay tròn. Shimmer lướt qua các khối layout mờ màu xám nhạt với độ trễ (gradient animation).

---

## Tóm tắt so sánh Mock Spec vs Stitch Taste

| Yếu tố                 | Mock Spec (Linear/Dark mode) | Stitch Design Taste (Áp dụng)                     |
| ---------------------- | ---------------------------- | ------------------------------------------------- |
| Nền (Background)       | `#0a0a0a` (Đen)              | `#F9FAFB` (Trắng ấm - Canvas White)               |
| Bề mặt (Surface)       | `#111111` (Xám tối)          | `#FFFFFF` (Pure Surface) với Whisper shadow       |
| Màu nhấn (Accent)      | `#3b82f6` (Electric Blue)    | `#E11D48` (Deep Rose)                             |
| Góc bo (Border Radius) | 8px (Cards), 4px (Badges)    | `2.5rem` (Cards), siêu tròn mềm mại               |
| Cấu trúc Layout        | Chặt chẽ, sát nhau           | Bất đối xứng, Gallery-Airy, khoảng trống lớn      |
| Typography             | Geist Sans / Mono (cơ bản)   | Geist/Satoshi (Display tight) + JetBrains Mono    |
| Animation              | Ít đề cập / Linear           | Spring Physics, Perpetual loops, Staggered reveal |
