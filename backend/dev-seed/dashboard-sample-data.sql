-- Dữ liệu mẫu cho dashboard — CHỈ DÙNG CHO MÔI TRƯỜNG LOCAL/DEV.
-- Không nằm trong db/migration nên Flyway không bao giờ tự chạy file này.
-- Chạy lại nhiều lần an toàn: mọi bản ghi có id cố định + ON CONFLICT DO NOTHING.
-- Mốc thời gian cố định quanh ngày 13/11/2026 (không dùng now()).
-- Người dùng được tham chiếu qua truy vấn con (theo role/ban, sắp xếp theo email),
-- nên cần có sẵn thành viên ở cả 6 ban (V18 seed hoặc dữ liệu thật).

BEGIN;

-- Tham chiếu dùng chung. Tài khoản system@ (V10) không phải người thật nên không chọn làm người thao tác.
CREATE TEMP TABLE seed_ref ON COMMIT DROP AS
SELECT
  b.bcn0,
  COALESCE(b.bcn1, b.bcn0) AS bcn1,
  COALESCE(b.bcn2, b.bcn0) AS bcn2,
  COALESCE((SELECT id FROM users WHERE role = 'truong_ban' AND department = 'doi_ngoai' AND is_active ORDER BY email LIMIT 1), b.bcn0) AS lead_dn,
  COALESCE((SELECT id FROM users WHERE role = 'truong_ban' AND department = 'nhan_su' AND is_active ORDER BY email LIMIT 1), b.bcn0) AS lead_ns,
  -- shortcut: liên kết sự kiện tháng 10/2026 theo ngày (dữ liệu local); nếu không có thì event_id = NULL. Thêm sự kiện mẫu cố định nếu cần liên kết ổn định.
  (SELECT id FROM events WHERE event_date >= '2026-10-01' AND event_date < '2026-11-01' ORDER BY event_date, id LIMIT 1) AS ev_a,
  (SELECT id FROM events WHERE event_date >= '2026-10-01' AND event_date < '2026-11-01' ORDER BY event_date, id OFFSET 1 LIMIT 1) AS ev_b,
  (SELECT id FROM events WHERE id = 'e0000000-0000-0000-0000-000000000001') AS ev_open25
FROM (
  SELECT
    (SELECT id FROM users WHERE role = 'bcn' AND is_active AND email <> 'system@ndc.neu.edu.vn' ORDER BY email LIMIT 1) AS bcn0,
    (SELECT id FROM users WHERE role = 'bcn' AND is_active AND email <> 'system@ndc.neu.edu.vn' ORDER BY email OFFSET 1 LIMIT 1) AS bcn1,
    (SELECT id FROM users WHERE role = 'bcn' AND is_active AND email <> 'system@ndc.neu.edu.vn' ORDER BY email OFFSET 2 LIMIT 1) AS bcn2
) b;

-- ---------------------------------------------------------------------------
-- Nhiệm vụ: 33 task, 8 tuần gần nhất. done: progress 100 + completed_at (13/18 đúng hạn);
-- in_progress 15..80; todo 0. Trigger V8 chỉ chạy khi UPDATE nên completed_at ghi trực tiếp.
-- assigner = 'lead' → trưởng ban (ban chưa có trưởng ban thì BCN), hoặc bcn0/bcn1/bcn2.
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, title, description, priority, status, progress, deadline, assigned_to, assigned_by,
                   department, event_id, completed_at, created_at, updated_at)
SELECT v.id::uuid, v.title, v.description, v.priority::task_priority_enum, v.status::task_status_enum, v.progress,
       v.deadline::timestamptz,
       (SELECT u.id FROM users u
         WHERE u.role = 'member' AND u.is_active AND u.department = v.dept::department_enum
         ORDER BY u.email OFFSET v.member_offset LIMIT 1),
       CASE v.assigner
         WHEN 'lead' THEN COALESCE((SELECT u.id FROM users u
                                     WHERE u.role = 'truong_ban' AND u.is_active AND u.department = v.dept::department_enum
                                     ORDER BY u.email LIMIT 1), r.bcn0)
         WHEN 'bcn1' THEN r.bcn1
         WHEN 'bcn2' THEN r.bcn2
         ELSE r.bcn0
       END,
       v.dept::department_enum,
       CASE v.ev WHEN 'a' THEN r.ev_a WHEN 'b' THEN r.ev_b WHEN 'open25' THEN r.ev_open25 END,
       v.completed_at::timestamptz, v.created_at::timestamptz,
       COALESCE(v.completed_at, v.created_at)::timestamptz
FROM seed_ref r,
(VALUES
  -- Truyền thông
  ('d1000000-0000-4000-8000-000000000001', 'truyen_thong', 0, 'lead', 'Thiết kế poster truyền thông Debate 2026', 'Bộ poster chính + 3 ảnh bìa fanpage theo nhận diện mùa giải.', 'high', 'done', 100, '2026-09-20 09:00+07', '2026-10-05 23:59+07', '2026-10-03 20:15+07', 'a'),
  ('d1000000-0000-4000-8000-000000000002', 'truyen_thong', 1, 'lead', 'Lên lịch đăng bài fanpage tháng 10', 'Content calendar tháng 10 cho Facebook, Instagram, TikTok.', 'medium', 'done', 100, '2026-09-25 10:00+07', '2026-09-30 23:59+07', '2026-09-29 21:40+07', NULL),
  ('d1000000-0000-4000-8000-000000000003', 'truyen_thong', 2, 'lead', 'Quay và dựng video recap Workshop tháng 10', 'Video 3 phút tổng hợp khoảnh khắc nổi bật của workshop.', 'high', 'done', 100, '2026-10-24 08:30+07', '2026-10-31 23:59+07', '2026-11-03 16:00+07', 'b'),
  ('d1000000-0000-4000-8000-000000000004', 'truyen_thong', 3, 'lead', 'Viết thông cáo báo chí NEU Debate Open 2026', 'Thông cáo gửi các trang tin sinh viên và đối tác truyền thông.', 'high', 'in_progress', 60, '2026-11-02 09:00+07', '2026-11-20 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000005', 'truyen_thong', 4, 'bcn0', 'Thiết kế bộ nhận diện mùa giải NEU Debate Open 2026', 'Logo mùa giải, bảng màu, template bài đăng và backdrop.', 'high', 'in_progress', 40, '2026-10-28 14:00+07', '2026-11-10 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000006', 'truyen_thong', 5, 'lead', 'Chụp ảnh profile Ban Chủ nhiệm nhiệm kỳ mới', 'Chụp ảnh chân dung BCN và trưởng các ban để đăng giới thiệu.', 'low', 'todo', 0, '2026-11-05 10:00+07', '2026-11-25 23:59+07', NULL, NULL),
  -- Nội dung (chưa có trưởng ban → BCN giao)
  ('d1000000-0000-4000-8000-000000000007', 'noi_dung', 0, 'bcn0', 'Biên soạn bộ motion cho buổi sinh hoạt tuần 3', '5 motion chủ đề kinh tế – xã hội kèm info slide.', 'medium', 'done', 100, '2026-09-18 09:00+07', '2026-09-25 23:59+07', '2026-09-24 22:10+07', NULL),
  ('d1000000-0000-4000-8000-000000000008', 'noi_dung', 1, 'bcn1', 'Viết bài phân tích motion "AI thay thế giáo viên"', 'Phân tích lập luận hai phe cho chuyên mục Góc tranh biện.', 'medium', 'done', 100, '2026-10-01 08:00+07', '2026-10-10 23:59+07', '2026-10-09 19:30+07', NULL),
  ('d1000000-0000-4000-8000-000000000009', 'noi_dung', 2, 'bcn0', 'Soạn tài liệu nhập môn tranh biện cho K68', 'Tài liệu 20 trang: thể thức BP, vai trò từng vị trí, cách xây dựng luận điểm.', 'high', 'done', 100, '2026-09-22 09:00+07', '2026-10-06 23:59+07', '2026-10-12 11:00+07', NULL),
  ('d1000000-0000-4000-8000-000000000010', 'noi_dung', 3, 'bcn0', 'Xây dựng ngân hàng motion vòng loại NEU Debate Open 2026', 'Tối thiểu 15 motion đã qua thẩm định của tổ chuyên môn.', 'high', 'in_progress', 30, '2026-10-30 10:00+07', '2026-11-08 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000011', 'noi_dung', 4, 'bcn2', 'Biên tập bản tin "Góc tranh biện" số 11', 'Chủ đề: tuần làm việc 4 ngày.', 'medium', 'in_progress', 70, '2026-11-03 09:00+07', '2026-11-15 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000012', 'noi_dung', 5, 'bcn1', 'Soạn đề bài tập huấn trọng tài', 'Bộ tình huống chấm điểm cho buổi tập huấn trọng tài cuối tháng.', 'low', 'todo', 0, '2026-11-10 15:00+07', '2026-11-28 23:59+07', NULL, NULL),
  -- Sự kiện
  ('d1000000-0000-4000-8000-000000000013', 'su_kien', 0, 'lead', 'Đặt hội trường A2 cho Debate 2026', 'Làm việc với phòng Quản trị, xác nhận âm thanh và máy chiếu.', 'high', 'done', 100, '2026-09-21 09:00+07', '2026-10-01 23:59+07', '2026-09-30 17:00+07', 'a'),
  ('d1000000-0000-4000-8000-000000000014', 'su_kien', 1, 'lead', 'Lập kịch bản chương trình Debate 2026', 'Kịch bản MC, timeline các vòng đấu và lễ trao giải.', 'high', 'done', 100, '2026-09-28 10:00+07', '2026-10-12 23:59+07', '2026-10-11 22:00+07', 'a'),
  ('d1000000-0000-4000-8000-000000000015', 'su_kien', 2, 'lead', 'Chuẩn bị checklist hậu cần Workshop tháng 10', 'Teabreak, bảng tên, tài liệu phát tay, sơ đồ chỗ ngồi.', 'medium', 'done', 100, '2026-10-10 09:00+07', '2026-10-20 23:59+07', '2026-10-22 09:30+07', 'b'),
  ('d1000000-0000-4000-8000-000000000016', 'su_kien', 3, 'bcn0', 'Khảo sát địa điểm tổ chức NEU Debate Open 2026', 'So sánh 3 phương án hội trường về sức chứa và chi phí.', 'high', 'in_progress', 50, '2026-10-26 09:00+07', '2026-11-12 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000017', 'su_kien', 4, 'lead', 'Tuyển tình nguyện viên hỗ trợ giải Open 2026', 'Mở form, phỏng vấn nhanh và phân công 20 tình nguyện viên.', 'medium', 'todo', 0, '2026-11-06 10:00+07', '2026-11-22 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000018', 'su_kien', 5, 'lead', 'Tổng kết, đánh giá sau Workshop tháng 10', 'Tổng hợp phản hồi người tham dự và bài học kinh nghiệm.', 'low', 'todo', 0, '2026-10-25 09:00+07', '2026-11-05 23:59+07', NULL, 'b'),
  -- Đối ngoại
  ('d1000000-0000-4000-8000-000000000019', 'doi_ngoai', 0, 'lead', 'Gửi hồ sơ tài trợ cho 10 doanh nghiệp', 'Gửi proposal và theo dõi phản hồi trong 2 tuần.', 'high', 'done', 100, '2026-09-19 09:00+07', '2026-10-03 23:59+07', '2026-10-02 18:00+07', NULL),
  ('d1000000-0000-4000-8000-000000000020', 'doi_ngoai', 1, 'lead', 'Liên hệ CLB tranh biện FTU, DAV giao lưu tháng 12', 'Thống nhất thời gian, thể thức và số đội tham gia.', 'medium', 'done', 100, '2026-10-05 10:00+07', '2026-10-15 23:59+07', '2026-10-14 20:00+07', NULL),
  ('d1000000-0000-4000-8000-000000000021', 'doi_ngoai', 2, 'bcn0', 'Hoàn thiện hợp đồng tài trợ Debate 2026', 'Rà soát quyền lợi nhà tài trợ và ký hợp đồng.', 'high', 'done', 100, '2026-09-30 09:00+07', '2026-10-10 23:59+07', '2026-10-16 15:00+07', 'a'),
  ('d1000000-0000-4000-8000-000000000022', 'doi_ngoai', 3, 'lead', 'Chuẩn bị proposal tài trợ NEU Debate Open 2026', 'Gói quyền lợi Kim cương / Vàng / Bạc và số liệu truyền thông mùa trước.', 'high', 'in_progress', 80, '2026-10-27 09:00+07', '2026-11-14 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000023', 'doi_ngoai', 4, 'lead', 'Cập nhật danh sách đối tác và đầu mối liên hệ', 'Chuẩn hóa thông tin liên hệ, ghi chú lịch sử hợp tác.', 'low', 'in_progress', 20, '2026-11-01 09:00+07', '2026-11-07 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000024', 'doi_ngoai', 5, 'lead', 'Mời giám khảo khách mời cho vòng chung kết', 'Gửi thư mời 3 giám khảo là cựu thành viên và giảng viên.', 'medium', 'todo', 0, '2026-11-08 10:00+07', '2026-11-30 23:59+07', NULL, NULL),
  -- Kỹ thuật (chưa có trưởng ban → BCN giao)
  ('d1000000-0000-4000-8000-000000000025', 'ky_thuat', 0, 'bcn0', 'Cập nhật trang sự kiện trên website CLB', 'Thêm thông tin, ảnh và link đăng ký cho các sự kiện tháng 10.', 'medium', 'done', 100, '2026-09-23 09:00+07', '2026-10-02 23:59+07', '2026-10-01 21:00+07', NULL),
  ('d1000000-0000-4000-8000-000000000026', 'ky_thuat', 1, 'bcn1', 'Thiết lập hệ thống đếm giờ cho phòng thi', 'Màn hình đếm giờ và chuông báo cho 4 phòng thi.', 'medium', 'done', 100, '2026-10-08 09:00+07', '2026-10-17 23:59+07', '2026-10-16 22:30+07', 'a'),
  ('d1000000-0000-4000-8000-000000000027', 'ky_thuat', 2, 'bcn0', 'Sửa lỗi form đăng ký thành viên', 'Form không gửi được khi nhập số điện thoại có dấu cách.', 'high', 'done', 100, '2026-10-20 08:00+07', '2026-10-24 23:59+07', '2026-10-23 14:00+07', NULL),
  ('d1000000-0000-4000-8000-000000000028', 'ky_thuat', 3, 'bcn0', 'Xây dựng trang đăng ký đội thi Open 2026', 'Form đăng ký đội, xác nhận email và xuất danh sách.', 'high', 'in_progress', 45, '2026-11-01 09:00+07', '2026-11-18 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000029', 'ky_thuat', 4, 'bcn2', 'Kiểm kê thiết bị âm thanh, máy chiếu', 'Lập danh sách thiết bị hỏng cần sửa trước mùa giải.', 'low', 'todo', 0, '2026-10-29 10:00+07', '2026-11-09 23:59+07', NULL, NULL),
  -- Nhân sự
  ('d1000000-0000-4000-8000-000000000030', 'nhan_su', 0, 'lead', 'Tổ chức phỏng vấn tuyển thành viên K68', 'Xếp lịch, chuẩn bị câu hỏi và tổng hợp kết quả phỏng vấn.', 'high', 'done', 100, '2026-09-18 08:00+07', '2026-10-04 23:59+07', '2026-10-04 18:00+07', NULL),
  ('d1000000-0000-4000-8000-000000000031', 'nhan_su', 1, 'lead', 'Tổng hợp điểm hoạt động thành viên tháng 10', 'Bảng điểm chuyên cần và đóng góp của từng ban.', 'medium', 'done', 100, '2026-10-28 09:00+07', '2026-11-05 23:59+07', '2026-11-07 10:00+07', NULL),
  ('d1000000-0000-4000-8000-000000000032', 'nhan_su', 2, 'lead', 'Lên kế hoạch team building cuối kỳ', 'Đề xuất địa điểm, kinh phí và chương trình.', 'medium', 'in_progress', 15, '2026-11-04 09:00+07', '2026-11-26 23:59+07', NULL, NULL),
  ('d1000000-0000-4000-8000-000000000033', 'nhan_su', 3, 'bcn1', 'Cập nhật hồ sơ thành viên trên hệ thống', 'Bổ sung mã sinh viên, số điện thoại còn thiếu.', 'low', 'done', 100, '2026-10-15 09:00+07', '2026-10-25 23:59+07', '2026-10-24 20:00+07', NULL)
) AS v(id, dept, member_offset, assigner, title, description, priority, status, progress, created_at, deadline, completed_at, ev)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Thu chi: 21 giao dịch từ 07/2026 đến 11/2026. creator = 'bcn0' hoặc 'lead_dn' (trưởng ban Đối ngoại).
-- ---------------------------------------------------------------------------
INSERT INTO transactions (id, type, amount, description, category, event_id, transaction_date, created_by, created_at, updated_at)
SELECT v.id::uuid, v.type::transaction_type_enum, v.amount, v.description, v.category,
       CASE v.ev WHEN 'a' THEN r.ev_a WHEN 'b' THEN r.ev_b END,
       v.tx_date::date,
       CASE v.creator WHEN 'lead_dn' THEN r.lead_dn ELSE r.bcn0 END,
       (v.tx_date || ' 20:00+07')::timestamptz, (v.tx_date || ' 20:00+07')::timestamptz
FROM seed_ref r,
(VALUES
  ('d2000000-0000-4000-8000-000000000001', 'income', 15000000, 'Tài trợ gói Vàng cho Debate 2026 – Công ty CP Giáo dục Tri Thức Việt', 'Tài trợ', 'a', '2026-09-28', 'lead_dn'),
  ('d2000000-0000-4000-8000-000000000002', 'income', 8000000, 'Tài trợ gói Bạc cho Debate 2026 – Ngân hàng đối tác', 'Tài trợ', 'a', '2026-10-05', 'lead_dn'),
  ('d2000000-0000-4000-8000-000000000003', 'income', 9600000, 'Thu phí thành viên kỳ I năm học 2026–2027 (48 người × 200.000đ)', 'Phí thành viên', NULL, '2026-09-15', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000004', 'income', 3200000, 'Bán vé khán giả Debate 2026', 'Bán vé', 'a', '2026-10-18', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000005', 'income', 1500000, 'Phí tham dự Workshop tháng 10 (30 người)', 'Bán vé', 'b', '2026-10-23', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000006', 'income', 5000000, 'Tài trợ Trại huấn luyện hè 2026 – Công ty TNHH Sách Bình Minh', 'Tài trợ', NULL, '2026-07-20', 'lead_dn'),
  ('d2000000-0000-4000-8000-000000000007', 'income', 2400000, 'Thu phí thành viên bổ sung (12 người)', 'Phí thành viên', NULL, '2026-11-05', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000008', 'income', 10000000, 'Đặt cọc tài trợ NEU Debate Open 2026 – Công ty CP Công nghệ An Phát', 'Tài trợ', NULL, '2026-11-10', 'lead_dn'),
  ('d2000000-0000-4000-8000-000000000009', 'expense', 6500000, 'Thuê hội trường và hệ thống âm thanh Debate 2026', 'Sự kiện', 'a', '2026-10-16', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000010', 'expense', 2800000, 'In backdrop, standee và giấy chứng nhận Debate 2026', 'In ấn', 'a', '2026-10-14', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000011', 'expense', 1200000, 'Chạy quảng cáo Facebook cho Debate 2026', 'Truyền thông', 'a', '2026-10-08', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000012', 'expense', 3500000, 'Giải thưởng và quà tặng đội thắng Debate 2026', 'Sự kiện', 'a', '2026-10-18', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000013', 'expense', 1800000, 'Teabreak Workshop tháng 10', 'Sự kiện', 'b', '2026-10-23', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000014', 'expense', 650000, 'Văn phòng phẩm đầu kỳ (bút, giấy A4, bìa hồ sơ)', 'Văn phòng phẩm', NULL, '2026-09-10', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000015', 'expense', 4200000, 'Chi phí Trại huấn luyện hè 2026 (thanh toán đợt cuối)', 'Sự kiện', NULL, '2026-07-25', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000016', 'expense', 900000, 'Quảng cáo tuyển thành viên K68', 'Truyền thông', NULL, '2026-08-25', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000017', 'expense', 450000, 'In tài liệu nhập môn tranh biện cho K68', 'In ấn', NULL, '2026-10-10', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000018', 'expense', 380000, 'Mua bút, sổ cho buổi phỏng vấn thành viên', 'Văn phòng phẩm', NULL, '2026-11-03', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000019', 'expense', 1500000, 'Quảng cáo mở đăng ký NEU Debate Open 2026', 'Truyền thông', NULL, '2026-11-08', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000020', 'expense', 1200000, 'Gia hạn tên miền và hosting website CLB', 'Khác', NULL, '2026-11-11', 'bcn0'),
  ('d2000000-0000-4000-8000-000000000021', 'expense', 320000, 'Phí dịch vụ ngân hàng quý III', 'Khác', NULL, '2026-10-01', 'bcn0')
) AS v(id, type, amount, description, category, ev, tx_date, creator)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Link ấn phẩm: 16 bài, 3 tháng gần nhất. Người tạo = trưởng ban (ban chưa có thì BCN).
-- ---------------------------------------------------------------------------
INSERT INTO media_links (id, title, url, platform, department, event_id, reach, likes, shares, comments, posted_at,
                         created_by, created_at, updated_at)
SELECT v.id::uuid, v.title, v.url, v.platform::platform_enum, v.dept::department_enum,
       CASE v.ev WHEN 'a' THEN r.ev_a WHEN 'b' THEN r.ev_b WHEN 'open25' THEN r.ev_open25 END,
       v.reach, v.likes, v.shares, v.comments, v.posted_at::date,
       COALESCE((SELECT u.id FROM users u
                  WHERE u.role = 'truong_ban' AND u.is_active AND u.department = v.dept::department_enum
                  ORDER BY u.email LIMIT 1), r.bcn0),
       (v.posted_at || ' 19:00+07')::timestamptz, (v.posted_at || ' 19:00+07')::timestamptz
FROM seed_ref r,
(VALUES
  ('d3000000-0000-4000-8000-000000000001', 'Poster chính thức Debate 2026', 'https://www.facebook.com/neudebateclub/posts/1001', 'facebook', 'truyen_thong', 'a', 8200, 640, 85, 42, '2026-09-30'),
  ('d3000000-0000-4000-8000-000000000002', 'Công bố đội hình vòng chung kết Debate 2026', 'https://www.facebook.com/neudebateclub/posts/1002', 'facebook', 'truyen_thong', 'a', 6100, 520, 40, 66, '2026-10-15'),
  ('d3000000-0000-4000-8000-000000000003', 'Album ảnh Debate 2026', 'https://www.instagram.com/p/NDCdebate2026/', 'instagram', 'truyen_thong', 'a', 4300, 710, 12, 35, '2026-10-20'),
  ('d3000000-0000-4000-8000-000000000004', 'Video recap Workshop tháng 10', 'https://www.youtube.com/watch?v=ndcRecapOct26', 'youtube', 'truyen_thong', 'b', 2900, 210, 18, 24, '2026-11-03'),
  ('d3000000-0000-4000-8000-000000000005', 'Clip 60 giây: khoảnh khắc phản biện đỉnh cao', 'https://www.tiktok.com/@neudebateclub/video/7400000000000000001', 'tiktok', 'truyen_thong', 'a', 15400, 1830, 220, 97, '2026-10-22'),
  ('d3000000-0000-4000-8000-000000000006', 'Mở đơn tuyển thành viên K68', 'https://www.facebook.com/neudebateclub/posts/1003', 'facebook', 'truyen_thong', NULL, 12000, 980, 310, 154, '2026-08-25'),
  ('d3000000-0000-4000-8000-000000000007', 'Góc tranh biện số 9: AI trong giáo dục', 'https://www.facebook.com/neudebateclub/posts/1004', 'facebook', 'noi_dung', NULL, 3500, 260, 34, 41, '2026-09-18'),
  ('d3000000-0000-4000-8000-000000000008', 'Góc tranh biện số 10: Kinh tế tuần hoàn', 'https://www.facebook.com/neudebateclub/posts/1005', 'facebook', 'noi_dung', NULL, 3100, 230, 29, 18, '2026-10-12'),
  ('d3000000-0000-4000-8000-000000000009', 'Infographic: 5 lỗi lập luận thường gặp', 'https://www.instagram.com/p/NDClogic5/', 'instagram', 'noi_dung', NULL, 5200, 690, 140, 23, '2026-10-28'),
  ('d3000000-0000-4000-8000-000000000010', 'Góc tranh biện số 11: Tuần làm việc 4 ngày', 'https://www.facebook.com/neudebateclub/posts/1006', 'facebook', 'noi_dung', NULL, 2700, 190, 21, 30, '2026-11-09'),
  ('d3000000-0000-4000-8000-000000000011', 'Trend "Một ngày ở CLB tranh biện"', 'https://www.tiktok.com/@neudebateclub/video/7400000000000000002', 'tiktok', 'truyen_thong', NULL, 21000, 2600, 310, 180, '2026-11-06'),
  ('d3000000-0000-4000-8000-000000000012', 'Nhìn lại NEU Debate Open 2025 – một năm trước', 'https://www.facebook.com/neudebateclub/posts/1007', 'facebook', 'truyen_thong', 'open25', 4800, 450, 36, 28, '2026-11-12'),
  ('d3000000-0000-4000-8000-000000000013', 'Phân tích trận chung kết NEU Debate Open 2025', 'https://www.youtube.com/watch?v=ndcFinal2025', 'youtube', 'noi_dung', 'open25', 1900, 160, 9, 15, '2026-11-11'),
  ('d3000000-0000-4000-8000-000000000014', 'Lịch trình Workshop tháng 10 trên website CLB', 'https://neudebateclub.example.com/su-kien/workshop-thang-10', 'other', 'su_kien', 'b', 900, 0, 0, 0, '2026-10-19'),
  ('d3000000-0000-4000-8000-000000000015', 'Story đếm ngược NEU Debate Open 2026', 'https://www.instagram.com/p/NDCopen2026/', 'instagram', 'truyen_thong', NULL, 3600, 280, 5, 11, '2026-11-10'),
  ('d3000000-0000-4000-8000-000000000016', 'Cảm ơn nhà tài trợ đồng hành Debate 2026', 'https://www.facebook.com/neudebateclub/posts/1008', 'facebook', 'doi_ngoai', 'a', 2500, 210, 14, 9, '2026-10-25')
) AS v(id, title, url, platform, dept, ev, reach, likes, shares, comments, posted_at)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Nhiệm kỳ. WHERE NOT EXISTS để lần chạy lại không kích hoạt trigger "chỉ 1 nhiệm kỳ active" (V8).
-- ---------------------------------------------------------------------------
INSERT INTO seasons (id, name, start_date, end_date, is_active, created_at)
SELECT v.id::uuid, v.name, v.start_date::date, v.end_date::date, v.is_active, v.created_at::timestamptz
FROM (VALUES
  ('d4000000-0000-4000-8000-000000000001', 'Nhiệm kỳ 2025–2026', '2025-09-01', '2026-08-31', false, '2025-08-25 09:00+07'),
  ('d4000000-0000-4000-8000-000000000002', 'Nhiệm kỳ 2026–2027', '2026-09-01', '2027-08-31', true, '2026-08-25 09:00+07')
) AS v(id, name, start_date, end_date, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM seasons s WHERE s.id = v.id::uuid)
ON CONFLICT (id) DO NOTHING;

-- Nhiệm kỳ hiện tại: mọi người dùng đang hoạt động (trừ guest và tài khoản system@), giữ vai trò/ban hiện tại.
INSERT INTO season_members (season_id, user_id, role, department, joined_at)
SELECT 'd4000000-0000-4000-8000-000000000002', u.id, u.role, u.department, '2026-09-01'
FROM users u
WHERE u.is_active AND u.role <> 'guest' AND u.department IS NOT NULL AND u.email <> 'system@ndc.neu.edu.vn'
ON CONFLICT (season_id, user_id) DO NOTHING;

-- Nhiệm kỳ trước: 15 người đầu tiên theo email.
INSERT INTO season_members (season_id, user_id, role, department, joined_at, left_at)
SELECT 'd4000000-0000-4000-8000-000000000001', u.id, u.role, u.department, '2025-09-01', '2026-08-31'
FROM (SELECT * FROM users
       WHERE is_active AND role <> 'guest' AND department IS NOT NULL AND email <> 'system@ndc.neu.edu.vn'
       ORDER BY email LIMIT 15) u
ON CONFLICT (season_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Nhật ký hoạt động: 2 tuần gần nhất, metadata theo đúng dạng backend ghi (enum viết hoa).
-- actor: bcn0 / task_by (người giao) / task_to (người nhận) / tx_by / media_by (người tạo bản ghi).
-- ---------------------------------------------------------------------------
INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
SELECT v.id::uuid,
       CASE v.actor
         WHEN 'task_by'  THEN (SELECT assigned_by FROM tasks WHERE id = x.entity_id)
         WHEN 'task_to'  THEN (SELECT assigned_to FROM tasks WHERE id = x.entity_id)
         WHEN 'tx_by'    THEN (SELECT created_by FROM transactions WHERE id = x.entity_id)
         WHEN 'media_by' THEN (SELECT created_by FROM media_links WHERE id = x.entity_id)
         ELSE r.bcn0
       END,
       v.action, v.entity_type, x.entity_id,
       -- Sự kiện: metadata lấy từ bản ghi thật, giống EventController.record.
       COALESCE(v.metadata::jsonb,
                (SELECT jsonb_build_object('title', e.title, 'status', upper(e.status::text)) FROM events e WHERE e.id = x.entity_id),
                '{}'::jsonb),
       v.created_at::timestamptz
FROM seed_ref r
CROSS JOIN (VALUES
  ('d5000000-0000-4000-8000-000000000001', 'bcn0', 'CREATE', 'SEASON', 'd4000000-0000-4000-8000-000000000002', '{"title": "Nhiệm kỳ 2026–2027"}', '2026-10-30 09:00+07'),
  ('d5000000-0000-4000-8000-000000000002', 'task_by', 'CREATE', 'TASK', 'd1000000-0000-4000-8000-000000000023', '{"title": "Cập nhật danh sách đối tác và đầu mối liên hệ", "department": "DOI_NGOAI"}', '2026-11-01 09:00+07'),
  ('d5000000-0000-4000-8000-000000000003', 'task_by', 'CREATE', 'TASK', 'd1000000-0000-4000-8000-000000000004', '{"title": "Viết thông cáo báo chí NEU Debate Open 2026", "department": "TRUYEN_THONG"}', '2026-11-02 09:00+07'),
  ('d5000000-0000-4000-8000-000000000004', 'task_to', 'STATUS_CHANGE', 'TASK', 'd1000000-0000-4000-8000-000000000003', '{"title": "Quay và dựng video recap Workshop tháng 10", "from": "IN_PROGRESS", "to": "DONE"}', '2026-11-03 16:00+07'),
  ('d5000000-0000-4000-8000-000000000005', 'tx_by', 'CREATE', 'TRANSACTION', 'd2000000-0000-4000-8000-000000000018', '{"title": "Mua bút, sổ cho buổi phỏng vấn thành viên", "type": "EXPENSE", "amount": 380000}', '2026-11-03 20:00+07'),
  ('d5000000-0000-4000-8000-000000000006', 'task_to', 'STATUS_CHANGE', 'TASK', 'd1000000-0000-4000-8000-000000000010', '{"title": "Xây dựng ngân hàng motion vòng loại NEU Debate Open 2026", "from": "TODO", "to": "IN_PROGRESS"}', '2026-11-04 10:30+07'),
  ('d5000000-0000-4000-8000-000000000007', 'tx_by', 'CREATE', 'TRANSACTION', 'd2000000-0000-4000-8000-000000000007', '{"title": "Thu phí thành viên bổ sung (12 người)", "type": "INCOME", "amount": 2400000}', '2026-11-05 20:00+07'),
  ('d5000000-0000-4000-8000-000000000008', 'media_by', 'PUBLISH', 'PUBLICATION', 'd3000000-0000-4000-8000-000000000011', '{"title": "Trend \"Một ngày ở CLB tranh biện\"", "platform": "TIKTOK"}', '2026-11-06 19:00+07'),
  ('d5000000-0000-4000-8000-000000000009', 'task_to', 'STATUS_CHANGE', 'TASK', 'd1000000-0000-4000-8000-000000000031', '{"title": "Tổng hợp điểm hoạt động thành viên tháng 10", "from": "IN_PROGRESS", "to": "DONE"}', '2026-11-07 10:00+07'),
  ('d5000000-0000-4000-8000-000000000010', 'task_by', 'CREATE', 'TASK', 'd1000000-0000-4000-8000-000000000024', '{"title": "Mời giám khảo khách mời cho vòng chung kết", "department": "DOI_NGOAI"}', '2026-11-08 10:00+07'),
  ('d5000000-0000-4000-8000-000000000011', 'tx_by', 'UPDATE', 'TRANSACTION', 'd2000000-0000-4000-8000-000000000019', '{"title": "Quảng cáo mở đăng ký NEU Debate Open 2026", "type": "EXPENSE", "amount": 1500000}', '2026-11-08 21:00+07'),
  ('d5000000-0000-4000-8000-000000000012', 'media_by', 'PUBLISH', 'PUBLICATION', 'd3000000-0000-4000-8000-000000000010', '{"title": "Góc tranh biện số 11: Tuần làm việc 4 ngày", "platform": "FACEBOOK"}', '2026-11-09 19:00+07'),
  ('d5000000-0000-4000-8000-000000000013', 'tx_by', 'CREATE', 'TRANSACTION', 'd2000000-0000-4000-8000-000000000008', '{"title": "Đặt cọc tài trợ NEU Debate Open 2026 – Công ty CP Công nghệ An Phát", "type": "INCOME", "amount": 10000000}', '2026-11-10 20:00+07'),
  ('d5000000-0000-4000-8000-000000000014', 'task_by', 'CREATE', 'TASK', 'd1000000-0000-4000-8000-000000000012', '{"title": "Soạn đề bài tập huấn trọng tài", "department": "NOI_DUNG"}', '2026-11-10 15:00+07'),
  ('d5000000-0000-4000-8000-000000000015', 'media_by', 'PUBLISH', 'PUBLICATION', 'd3000000-0000-4000-8000-000000000015', '{"title": "Story đếm ngược NEU Debate Open 2026", "platform": "INSTAGRAM"}', '2026-11-10 19:00+07'),
  ('d5000000-0000-4000-8000-000000000016', 'task_to', 'PROGRESS_UPDATE', 'TASK', 'd1000000-0000-4000-8000-000000000004', '{"title": "Viết thông cáo báo chí NEU Debate Open 2026", "progress": 60, "status": "IN_PROGRESS"}', '2026-11-11 16:00+07'),
  ('d5000000-0000-4000-8000-000000000017', 'task_to', 'PROGRESS_UPDATE', 'TASK', 'd1000000-0000-4000-8000-000000000022', '{"title": "Chuẩn bị proposal tài trợ NEU Debate Open 2026", "progress": 80, "status": "IN_PROGRESS"}', '2026-11-11 21:00+07'),
  ('d5000000-0000-4000-8000-000000000018', 'tx_by', 'CREATE', 'TRANSACTION', 'd2000000-0000-4000-8000-000000000020', '{"title": "Gia hạn tên miền và hosting website CLB", "type": "EXPENSE", "amount": 1200000}', '2026-11-11 20:00+07'),
  ('d5000000-0000-4000-8000-000000000019', 'media_by', 'PUBLISH', 'PUBLICATION', 'd3000000-0000-4000-8000-000000000012', '{"title": "Nhìn lại NEU Debate Open 2025 – một năm trước", "platform": "FACEBOOK"}', '2026-11-12 19:00+07'),
  ('d5000000-0000-4000-8000-000000000021', 'bcn0', 'UPDATE', 'EVENT', 'ev_b', NULL, '2026-11-06 14:00+07')
) AS v(id, actor, action, entity_type, entity_id, metadata, created_at)
-- activity_logs.entity_id không có FK; thiếu sự kiện tháng 10 thì trỏ sang sự kiện V20.
CROSS JOIN LATERAL (SELECT CASE v.entity_id
                             WHEN 'ev_b' THEN COALESCE(r.ev_b, 'e0000000-0000-0000-0000-000000000002')
                             ELSE v.entity_id::uuid END AS entity_id) x
ON CONFLICT (id) DO NOTHING;

-- Thêm thành viên vào nhiệm kỳ mới (entity = người dùng, chọn theo ban).
INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
SELECT v.id::uuid, r.lead_ns, 'ADD_MEMBER', 'MEMBER', u.id,
       jsonb_build_object('title', 'Nhiệm kỳ 2026–2027', 'fullName', u.full_name, 'department', upper(u.department::text)),
       v.created_at::timestamptz
FROM seed_ref r
CROSS JOIN (VALUES
  ('d5000000-0000-4000-8000-000000000022', 'noi_dung', 5, '2026-10-31 10:00+07'),
  ('d5000000-0000-4000-8000-000000000023', 'ky_thuat', 5, '2026-10-31 10:05+07')
) AS v(id, dept, member_offset, created_at)
CROSS JOIN LATERAL (SELECT id, full_name, department FROM users
                     WHERE role = 'member' AND is_active AND department = v.dept::department_enum
                     ORDER BY email OFFSET v.member_offset LIMIT 1) u
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Thông báo thủ công: 1 dòng cho mỗi người nhận, id = md5(khóa cố định + user id) nên chạy lại không trùng.
-- Người gửi không nhận bản sao (giống NotificationService.sendManual).
-- ---------------------------------------------------------------------------
INSERT INTO notifications (id, user_id, title, body, type, created_by, created_at)
SELECT md5(n.key || ':' || u.id::text)::uuid, u.id, n.title, n.body, n.type,
       CASE n.sender WHEN 'bcn1' THEN r.bcn1 ELSE r.bcn0 END, n.created_at::timestamptz
FROM seed_ref r
CROSS JOIN (VALUES
  ('ndc-seed-n1', 'bcn0', 'GENERAL', 'Họp Ban Chủ nhiệm và trưởng các ban tháng 11', 'Họp lúc 19:00 thứ Hai 16/11 tại phòng 301 nhà A1. Các ban chuẩn bị báo cáo tiến độ nhiệm vụ.', '2026-11-09 08:00+07', 'bcn_leads'),
  ('ndc-seed-n2', 'bcn0', 'URGENT', 'Hạn nộp dự trù kinh phí NEU Debate Open 2026', 'Các trưởng ban gửi dự trù kinh phí trước 23:59 ngày 15/11 để BCN tổng hợp.', '2026-11-11 09:00+07', 'leads'),
  ('ndc-seed-n3', 'bcn0', 'REWARD', 'Khen thưởng thành viên tích cực tháng 10', 'Chúc mừng bạn được ghi nhận là thành viên tích cực tháng 10. Phần quà sẽ được trao tại buổi sinh hoạt gần nhất.', '2026-11-07 18:00+07', 'stars'),
  ('ndc-seed-n4', 'bcn1', 'GENERAL', 'Lịch duyệt kế hoạch NEU Debate Open 2026', 'Đề nghị anh/chị duyệt bản kế hoạch tổng thể trước buổi họp thứ Hai.', '2026-11-10 21:00+07', 'bcn0'),
  ('ndc-seed-n5', 'bcn0', 'URGENT', 'Kiểm tra thiết bị trước mùa giải', 'Ban Kỹ thuật hoàn tất kiểm kê thiết bị âm thanh, máy chiếu và báo cáo thiết bị hỏng.', '2026-11-10 08:00+07', 'dept:ky_thuat'),
  ('ndc-seed-n6', 'bcn0', 'GENERAL', 'Lịch sinh hoạt định kỳ Ban Nhân sự', 'Ban Nhân sự sinh hoạt lúc 18:30 thứ Năm hằng tuần, bắt đầu từ 19/11.', '2026-11-12 10:00+07', 'dept:nhan_su')
) AS n(key, sender, type, title, body, created_at, audience)
JOIN users u ON u.is_active AND u.id <> CASE n.sender WHEN 'bcn1' THEN r.bcn1 ELSE r.bcn0 END AND (
       (n.audience = 'bcn_leads' AND u.role IN ('bcn', 'truong_ban'))
    OR (n.audience = 'leads' AND u.role = 'truong_ban')
    OR (n.audience = 'bcn0' AND u.id = r.bcn0)
    OR (n.audience LIKE 'dept:%' AND u.department::text = substr(n.audience, 6))
    OR (n.audience = 'stars' AND u.id IN (SELECT assigned_to FROM tasks WHERE id IN (
          'd1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000014')))
  )
ON CONFLICT (id) DO NOTHING;

-- Thông báo giao nhiệm vụ cho 5 task đang mở, cùng định dạng NotificationService.notifyTaskAssigned.
INSERT INTO notifications (id, user_id, title, body, type, entity_id, created_by, created_at)
SELECT v.id::uuid, t.assigned_to, 'Bạn được giao nhiệm vụ mới',
       'Nhiệm vụ: ' || t.title
         || E'\nBan: ' || CASE t.department
              WHEN 'bcn' THEN 'Ban Chủ Nhiệm' WHEN 'truyen_thong' THEN 'Ban Truyền thông'
              WHEN 'noi_dung' THEN 'Ban Nội dung' WHEN 'su_kien' THEN 'Ban Sự kiện'
              WHEN 'doi_ngoai' THEN 'Ban Đối ngoại' WHEN 'ky_thuat' THEN 'Ban Kỹ thuật'
              WHEN 'nhan_su' THEN 'Ban Nhân sự' ELSE 'Chưa phân ban' END
         || E'\nHạn chót: ' || to_char(t.deadline AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY'),
       'TASK_ASSIGNED', t.id, t.assigned_by, t.created_at
FROM (VALUES
  ('d6000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000004'),
  ('d6000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005'),
  ('d6000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000010'),
  ('d6000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000017'),
  ('d6000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000028')
) AS v(id, task_id)
JOIN tasks t ON t.id = v.task_id::uuid AND t.assigned_to <> t.assigned_by
ON CONFLICT (id) DO NOTHING;

-- Nhật ký gửi thông báo thủ công, giống NotificationService.sendManual (entity = bản ghi đầu tiên).
INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
SELECT 'd5000000-0000-4000-8000-000000000020', r.bcn0, 'SEND', 'NOTIFICATION', n.first_id,
       jsonb_build_object('title', 'Hạn nộp dự trù kinh phí NEU Debate Open 2026', 'type', 'URGENT',
                          'audience', 'MEMBERS', 'recipientCount', n.recipient_count),
       '2026-11-11 09:00+07'
FROM seed_ref r,
     (SELECT (array_agg(id ORDER BY id))[1] AS first_id, count(*) AS recipient_count
        FROM notifications WHERE id = md5('ndc-seed-n2:' || user_id::text)::uuid) n
WHERE n.first_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

COMMIT;
