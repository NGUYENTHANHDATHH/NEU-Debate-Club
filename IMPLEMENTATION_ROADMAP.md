# Lộ trình triển khai hệ thống CLB NEU

## Mục tiêu

Hoàn thiện hệ thống quản trị nội bộ theo tài liệu:

- `NHU_CAU_VA_GIAI_PHAP_WEBSITE_CLB_NEU.md`
- `USE_CASES_HE_THONG_CLB_NEU.md`

Chức năng **UC-17: CMS Landing Page** đã hoàn thành trong `frontend/src/components/dashboard/CmsPage.tsx`.

## Quy tắc thực hiện

1. Làm theo thứ tự bên dưới, không nhảy sang chức năng phụ thuộc chức năng chưa hoàn thành.
2. Trước khi sửa, đọc các pattern API, auth, database và UI đã có trong repository.
3. Tái sử dụng component, type và helper hiện có; không thêm thư viện nếu không cần.
4. Mỗi chức năng phải có phân quyền, xử lý lỗi và trạng thái loading/empty.
5. Sau mỗi chức năng: kiểm tra type/lint, chạy test liên quan và cập nhật trạng thái trong file này.

## Trạng thái

- [x] UC-17 - CMS Landing Page
- [x] UC-16 - Google OAuth, Route Guard và RBAC
- [ ] UC-14 - Cập nhật trạng thái task cá nhân
- [ ] UC-09 - Quản lý danh sách thành viên
  - [x] Danh sách thật, thêm và chỉnh sửa thành viên (họ tên, email, MSSV, SĐT, ban, chức vụ, trạng thái)
  - [x] Dữ liệu mẫu 50 thành viên và phân trang 10 người/trang
  - [ ] Gen/nhiệm kỳ, xóa, lọc theo ban và phân quyền xem dữ liệu giới hạn
- [ ] UC-08 - Kho link Drive ảnh/video sự kiện
- [ ] UC-07 - Kho bộ nhận diện và file thiết kế
- [ ] UC-06 - Danh bạ đối tác theo năm
- [ ] UC-03 - Quy trình nội dung Draft → Reviewing → Final Approved
- [ ] UC-04 - Thông báo khi nội dung được duyệt
- [ ] UC-02 - Approval Center
- [ ] UC-01 - Executive Dashboard
- [ ] UC-10 - Thống kê tỷ lệ hoàn thành task
- [ ] UC-05 - Lưu trữ hợp đồng và gói tài trợ
- [ ] UC-13 - Quản lý thiết bị và mượn/trả
- [ ] UC-11 - Tạo QR/ID người tham dự
- [ ] UC-12 - Quét QR check-in sự kiện
- [ ] UC-15 - Thông báo nhắc việc/PWA Push

## Chi tiết theo thứ tự

### Giai đoạn 1: Nền tảng truy cập và dữ liệu cơ bản

#### 1. UC-16 - Google OAuth, Route Guard và RBAC

- Cho phép đăng nhập bằng Google.
- Email thành viên hợp lệ: `*.ndc.neu@gmail.com` và có trong database.
- Người dùng phổ thông chỉ được dùng Landing Page.
- Thành viên được vào `/dashboard`.
- Phân quyền tối thiểu: BCN, Trưởng/Phó ban, thành viên.
- Chặn truy cập module hợp đồng đối với người không có quyền.

#### 2. UC-14 - Cập nhật trạng thái task cá nhân

- Thành viên xem task được giao.
- Thành viên cập nhật trạng thái: `TODO`, `IN_PROGRESS`, `DONE`.
- Lưu người cập nhật và thời gian cập nhật.
- Dữ liệu phải dùng được cho UC-01 và UC-10.

#### 3. UC-09 - Quản lý danh sách thành viên

- Hiển thị tên, MSSV, số điện thoại, ban và thế hệ.
- BCN/HR được thêm, sửa, xóa thành viên.
- Thành viên thường chỉ xem dữ liệu được phép.
- Có tìm kiếm và lọc theo ban/thế hệ nếu hệ thống hiện tại đã có pattern phù hợp.

### Giai đoạn 2: Kho tài nguyên và quy trình nội dung

#### 4. UC-08 - Kho link Drive ảnh/video sự kiện

- CRUD tiêu đề, sự kiện, loại media, URL Drive và mô tả.
- Kiểm tra URL trước khi lưu.
- Thành viên được xem tài nguyên chung theo quyền.

#### 5. UC-07 - Kho bộ nhận diện và file thiết kế

- CRUD logo, font, màu chuẩn, file AI/PSD/Figma và tài nguyên liên quan.
- Phân loại theo bộ nhận diện, file gốc và media.
- Cho phép lưu link ngoài nếu chưa có yêu cầu upload file.

#### 6. UC-06 - Danh bạ đối tác theo năm

- CRUD doanh nghiệp, người liên hệ, năm hợp tác và ghi chú.
- Cho phép tra cứu theo tên và năm.
- Chỉ BCN và Ban Đối ngoại được sửa dữ liệu.

#### 7. UC-03 - Quy trình nội dung

- BCM tạo và sửa nội dung ở trạng thái `DRAFT`.
- Chuyển sang `REVIEWING` để gửi duyệt.
- Chuyển sang `FINAL_APPROVED` để chốt nội dung.
- Sau khi chốt, khóa các trường quan trọng.
- Ghi lịch sử thay đổi tối thiểu gồm trạng thái, người thay đổi và thời gian.

#### 8. UC-04 - Thông báo chốt nội dung

- Khi UC-03 chuyển sang `FINAL_APPROVED`, tạo thông báo cho Kỹ thuật và Truyền thông.
- Thông báo phải chứa tên nội dung, sự kiện và liên kết mở chi tiết.
- Có thể triển khai In-App Alert trước; PWA Push làm ở UC-15.

### Giai đoạn 3: Điều hành và báo cáo

#### 9. UC-02 - Approval Center

- Trưởng ban gửi đề xuất/kế hoạch cho BCN.
- BCN xem, sửa, duyệt hoặc từ chối.
- Lưu trạng thái: `PENDING`, `APPROVED`, `REJECTED`.
- Lưu lý do từ chối và lịch sử xử lý.

#### 10. UC-01 - Executive Dashboard

- Hiển thị sự kiện đang chạy.
- Hiển thị phần trăm task hoàn thành.
- Hiển thị task trễ hạn.
- Hiển thị đề xuất đang chờ duyệt.
- Chỉ tổng hợp từ dữ liệu đã có, không tạo hệ thống task riêng.

#### 11. UC-10 - Thống kê tỷ lệ hoàn thành task

- Thống kê task được giao và task hoàn thành theo thành viên.
- Lọc theo sự kiện, ban và khoảng thời gian nếu dữ liệu hỗ trợ.
- Dùng cho HR đánh giá đóng góp.

#### 12. UC-05 - Hợp đồng và gói tài trợ

- CRUD doanh nghiệp, gói tài trợ, giá trị, quyền lợi và thời hạn.
- Lưu link/file hợp đồng.
- Phân quyền riêng: BCN và Ban Đối ngoại.
- Không trả dữ liệu nhạy cảm cho API hoặc UI không có quyền.

### Giai đoạn 4: Sự kiện và tài sản

#### 13. UC-13 - Quản lý thiết bị và mượn/trả

- CRUD danh mục thiết bị.
- Theo dõi trạng thái: `AVAILABLE`, `BORROWED`, `DAMAGED`, `LOST`.
- Lưu người mượn, ngày mượn, ngày trả và tình trạng trước/sau.
- Không cho mượn thiết bị đang được mượn hoặc thất lạc.

#### 14. UC-11 - Tạo QR/ID người tham dự

- Tạo người tham dự gắn với sự kiện.
- Sinh mã QR/ID duy nhất.
- Cho phép người tham dự nhận mã trước sự kiện.
- Không tạo mã trùng trong cùng một sự kiện.

#### 15. UC-12 - Quét QR check-in

- Thành viên sự kiện quét QR bằng camera điện thoại.
- Kiểm tra mã hợp lệ và đúng sự kiện.
- Đánh dấu thời gian check-in.
- Chặn quét trùng và hiển thị kết quả rõ ràng.
- Tối ưu thao tác nhanh tại bàn đón tiếp.

#### 16. UC-15 - Thông báo nhắc việc/PWA Push

- Nhắc task sắp đến hạn hoặc quá hạn.
- Gửi thông báo khi có đề xuất cần duyệt.
- Quản lý quyền notification và đăng ký thiết bị.
- Chỉ làm sau khi In-App Alert và dữ liệu task đã ổn định.

## Tiêu chí hoàn thành chung

Một chức năng được đánh dấu hoàn thành khi:

- Luồng chính hoạt động từ UI đến API/database.
- Kiểm tra quyền ở cả frontend và backend.
- Có loading, empty state và lỗi rõ ràng.
- Không làm hỏng các chức năng đã hoàn thành.
- Đã chạy kiểm tra phù hợp và cập nhật checkbox trong file này.
